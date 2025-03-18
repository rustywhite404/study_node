const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const app = express(); 
let db;

const uri = "mongodb+srv://rustywhite404:%40Rkgus6628@cluster0.qw0l4.mongodb.net/myDB?retryWrites=true&w=majority&appName=Cluster0";
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true})) 
app.use('/public', express.static('public')) 


//세션으로 로그인 유지하기 위한 설정
//터미널에 npm install passport passport-local express-session 를 입력하여 설치 후 사용
//실제 서비스시 express-session 말고 MongoDB에 세션데이터를 저장해주는 라이브러리를 이용하면 더 좋다 
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 



//http에서 put, delete 요청을 받기 위한 설정 
//터미널에 npm install method-override 를 입력하여 설치 후 사용 
const methodOverride = require('method-override')
app.use(methodOverride('_method'))

app.get('/', function(요청, 응답) {
    응답.render('index.ejs'); // 데이터를 EJS로 전달
});

app.get('/pet', function(요청, 응답) { 
    응답.send('펫용품 사시오')
  })

app.get('/write', function(요청, 응답){
    응답.render('write.ejs'); 
})

app.get('/login', function(요청, 응답){
    응답.render('login.ejs'); 
})

//get 안에 loginCheck처럼 미들웨어를 넣을 수 있다. 그러면 /mypage 요청과 mypage.ejs 응답 사이에 loginCheck가 실행된다. 
app.get('/mypage', loginCheck, function (요청, 응답) {
    console.log("로그인한 유저:", 요청.user); // 로그인한 유저 정보
    응답.render('mypage.ejs', {user: 요청.user}) // 로그인한 유저 정보를 EJS로 전달
}) 

function loginCheck(req, res, next) {
    if (req.user) { // 로그인 상태 확인. deserializeUser 함수에서 req.user에 사용자 정보를 저장했음. 즉 req.user는 deserializeUser가 보내준 로그인 유저의 정보. 
        next(); // 다음 미들웨어로 이동
    } else {
        res.redirect('/login'); // 로그인 페이지로 리다이렉트
    }
}


//passport.authenticate를 통해 응답 전에 local 방식으로 아이디/비밀번호를 인증받을 수 있다. 
//failureRedirect는 인증 실패 시 이동시켜줄 경로. 
app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'
}), function (req, res) {
    res.redirect('/'); 
});

app.get('/edit/:id', async function(요청, 응답){
    const postId = parseInt(요청.params.id);
    const result = await db.collection('post').findOne({ _id: postId });
    응답.render('edit.ejs', {post: result}); // 데이터를 EJS로 전달
})

app.put('/edit', async function (req, res) {
    try {
        const postId = parseInt(req.body.id);
        console.log("호출:", postId);

        const result = await db.collection('post').updateOne(
            { _id: postId },
            { $set: { title: req.body.title, content: req.body.content } }
        );

        if (result.modifiedCount === 0) {
            console.warn('⚠️ 수정된 데이터가 없습니다.');
            return res.status(404).send('수정할 게시글을 찾을 수 없어요.');
        }

        console.log('✅ 수정 완료:', result);
        res.redirect('/list');

    } catch (error) {
        console.error('❌ 수정 중 에러 발생:', error);
        res.status(500).send('서버 에러!');
    }
});

app.post('/add', async (req, res) => {
    const session = db.client.startSession();

    try {
        const data = req.body; // 요청으로 받은 데이터
        await session.withTransaction(async () => {
            // 1. 게시물 갯수 가져오기
            const counterCollection = db.collection('counter');
            const counter = await counterCollection.findOne({ name: '게시물갯수' }, { session });

            if (!counter) {
                throw new Error("카운터 정보가 없습니다.");
            }

            const 총게시물갯수 = counter.totalPost;

            // 2. post 저장 (게시물 번호 = 총게시물갯수 + 1)
            const newPost = {
                _id: 총게시물갯수 + 1,
                title: data.title,
                content: data.content
            };

            await db.collection('post').insertOne(newPost, { session });
            console.log('✅ 새 게시물 저장 완료:', newPost);

            // 3. counter 업데이트 (totalPost + 1)
            await counterCollection.updateOne(
                { name: '게시물갯수' },
                { $inc: { totalPost: 1 } },
                { session }
            );

            console.log('✅ 게시물 갯수 업데이트 완료');
        });

        res.send("데이터 저장 완료!");
    } catch (error) {
        console.error("❌ 데이터 저장 실패:", error);
        res.status(500).send("데이터 저장 실패!");
    } finally {
        await session.endSession();
    }
});


app.get('/list', async function(req, res) {
    try {
        const result = await db.collection('post').find().toArray(); // 데이터를 가져옴
        console.log("✅ 조회된 데이터:", result);
        res.render('list.ejs', { posts: result }); // 데이터를 EJS로 전달
    } catch (error) {
        console.error("❌ 데이터 조회 실패:", error);
        res.status(500).send("데이터 조회 실패!");
    }
}); 

app.delete('/delete', function(req, res){
    req.body._id = parseInt(req.body._id)
    db.collection('post').deleteOne(req.body, function(error, result){
        console.log('삭제완료')
      })
    res.send('삭제완료')
  });

app.get('/detail/:id', async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        console.log('🔍 게시글 ID:', postId);

        // findOne을 Promise 기반으로 사용
        const result = await db.collection('post').findOne({ _id: postId });

        if (!result) {
            console.warn('⚠️ 해당 ID의 게시글을 찾을 수 없습니다:', postId);
            return res.status(404).send('게시글을 찾을 수 없어요.');
        }

        console.log('✅ 데이터 상세보기:', result);
        res.render('detail.ejs', { data: result });

    } catch (error) {
        console.error('❗️데이터 조회 중 에러 발생:', error);
        res.status(500).send('서버 에러가 발생했어요.');
    }
});

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
}, async function (입력한아이디, 입력한비번, done) {
    try {
        const 결과 = await db.collection('login').findOne({ id: 입력한아이디 });
        if (!결과) {
            return done(null, false, { message: '존재하지 않는 아이디입니다.' });
        }

        if (입력한비번 === 결과.pw) {
            return done(null, 결과); // 로그인 성공
        } else {
            return done(null, false, { message: '비밀번호가 틀렸습니다.' });
        }
    } catch (error) {
        return done(error);
    }
}));

passport.serializeUser(function (user, done) {
    done(null, user.id); // 세션에 사용자 id 저장
});

passport.deserializeUser(async function (아이디, done) {
    try {
        const 결과 = await db.collection('login').findOne({ id: 아이디 });
        if (!결과) {
            return done(null, false);
        }
        done(null, 결과); // 세션에서 사용자 정보 복원
    } catch (error) {
        done(error);
    }
});

async function connectDB() {
    try {
        const client = new MongoClient(uri);
        await client.connect();
        db = client.db('myDB'); // DB 연결 설정
        console.log("✅ MongoDB 연결 성공!");

        // 서버 시작
        app.listen(8080, () => {
            console.log("🚀 서버가 8080 포트에서 실행 중!");
        });

    } catch (error) {
        console.error("❌ MongoDB 연결 실패:", error);
    }
}

// DB 객체를 다른 모듈에서도 사용할 수 있도록 내보내기
module.exports = { app, db };

// 서버 실행
connectDB();