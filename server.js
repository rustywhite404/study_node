const express = require('express');
const app = express(); 

app.use(express.urlencoded({extended: true})) 

app.listen(8080, function() {
    console.log('listening on 8080')
})

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