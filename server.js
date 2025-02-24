const express = require('express');
const app = express();

app.listen(8080, function() {
    console.log('listening on 8080')
})

app.get('/', function(요청, 응답) {
    응답.sendFile(__dirname + '/index.html')
});

app.get('/pet', function(요청, 응답) { 
    응답.send('펫용품 사시오')
  })

app.get('/beauty', function(요청, 응답){
    응답.send('뷰티용품 사시오')
})