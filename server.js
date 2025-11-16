// 필요한 모듈(Express)을 불러옵니다.
const express = require('express');

// Express 애플리케이션을 생성합니다.
const app = express();
const PORT = 3000;

// JSON 요청 본문(Body)을 파싱할 수 있도록 설정합니다.
app.use(express.json());

// 루트 경로 ('/')에 대한 기본 응답
app.get('/', (req, res) => {
  res.send('Welcome to the Simple POC Server! Try accessing /api/hello');
});

// POC API 엔드포인트
app.get('/api/hello', (req, res) => {
  const currentTime = new Date().toLocaleString('ko-KR');
  console.log(`[${currentTime}] /api/hello 요청 수신됨`);
  
  // JSON 형식으로 응답을 보냅니다.
  res.status(200).json({
    message: "POC 프로젝트 성공!",
    status: "OK",
    timestamp: currentTime,
    info: "이 코드는 Node.js와 Express로 실행되었습니다."
  });
});

// 서버를 지정된 포트에서 시작합니다.
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log('API Endpoint: http://localhost:3000/api/hello');
});