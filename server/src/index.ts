import express from 'express';
import cors from 'cors';
import { createProxyMiddleware, Options as proxyOptions } from 'http-proxy-middleware';
const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === "production" ? process.env.FRONTEND : 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

const proxyOptions = {
  target: 'https://api.binance.com',
  changeOrigin: true,
  pathRewrite: {
    '^/binance': '',
  },
  onProxyRes: (proxyRes: import('http').IncomingMessage, req: Request, res: Response) => {
    proxyRes.headers['Access-Control-Allow-Origin'] =
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND
        : 'http://localhost:5173';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST';
  },
}

app.use('/binance', createProxyMiddleware(proxyOptions));

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
