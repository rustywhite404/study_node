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
    try {
        const data = req.body; // 클라이언트가 보낸 데이터를 받음
        await db.collection('post').insertOne(data);
        console.log('✅ 데이터 저장 완료:', data);
        res.send("데이터 저장 완료!");
    } catch (error) {
        console.error("❌ 데이터 저장 실패:", error);
        res.status(500).send("데이터 저장 실패!");
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