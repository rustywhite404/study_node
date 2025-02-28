const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const app = express(); 
let db;

const uri = "mongodb+srv://rustywhite404:%40Rkgus6628@cluster0.qw0l4.mongodb.net/myDB?retryWrites=true&w=majority&appName=Cluster0";
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true})) 

app.get('/', function(요청, 응답) {
    응답.sendFile(__dirname + '/index.html')
});

app.get('/pet', function(요청, 응답) { 
    응답.send('펫용품 사시오')
  })

app.get('/write', function(요청, 응답){
    응답.sendFile(__dirname + '/write.html')
})
 

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