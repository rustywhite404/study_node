const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const app = express(); 

const uri = "mongodb+srv://rustywhite404:패스워드@cluster0.qw0l4.mongodb.net/myDB?retryWrites=true&w=majority&appName=Cluster0";


app.use(express.urlencoded({extended: true})) 

// app.listen(8080, function() {
//     console.log('listening on 8080')
// })

app.get('/', function(요청, 응답) {
    응답.sendFile(__dirname + '/index.html')
});

app.get('/pet', function(요청, 응답) { 
    응답.send('펫용품 사시오')
  })

app.get('/write', function(요청, 응답){
    응답.sendFile(__dirname + '/write.html')
})

app.post('/add', function(요청, 응답){
    console.log(요청.body);
    응답.send('전송 완료');
})

async function startServer() {
    try {
        // MongoDB 연결
        const client = new MongoClient(uri);
        await client.connect();
        console.log("✅ MongoDB 연결 성공!");

        // Express 서버 시작
        app.listen(8080, () => {
            console.log("🚀 서버가 8080 포트에서 실행 중!");
        });

    } catch (error) {
        console.error("❌ MongoDB 연결 실패:", error);
    }
}

startServer();