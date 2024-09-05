import { NextApiRequest, NextApiResponse } from 'next'
import httpProxyMiddleware from 'next-http-proxy-middleware'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Proxy request:', req.url, req.method);
  return httpProxyMiddleware(req, res, {
    target: 'https://api.datawars2.ie',
    changeOrigin: true,
    pathRewrite: {
      '^/api/proxy': '', // remove /api/proxy from the URL
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log('Proxy response:', proxyRes.statusCode, req.url, req.method);
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
    },
  })
}

export const config = {
  api: {
    bodyParser: false,
  },
}