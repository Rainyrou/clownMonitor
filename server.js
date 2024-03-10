import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com;"
  );
  next();
});

app.post('/report', (req, res) => {
  console.log('收到监控数据：', req.body);
  res.status(200).send('数据已接收');
});

app.listen(PORT, () => {
  console.log(`监控服务器运行在 http://localhost:${PORT}`);
});
