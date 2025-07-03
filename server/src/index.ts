import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === "production" ? process.env.FRONTEND : 'http://localhost:5173',
  methods: ['GET', 'POST']
}))

app.use('/binance', createProxyMiddleware({
  target: 'https://api.binance.com',
  changeOrigin: true,
  pathRewrite: {
    '^/binance': '',
  },
}));

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
