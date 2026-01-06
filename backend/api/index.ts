import { VercelRequest, VercelResponse } from '@vercel/node'

// Simple health check to verify the function works
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Return debug info to diagnose the environment
  res.status(200).json({
    success: true,
    data: {
      message: 'Backend serverless function is working',
      method: req.method,
      url: req.url,
      cwd: process.cwd(),
      dirname: __dirname,
      env: {
        MONGO_URL: process.env.MONGO_URL ? 'SET' : 'NOT SET',
        MONGO_DB: process.env.MONGO_DB ? 'SET' : 'NOT SET',
        JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
        CLIENT_URL: process.env.CLIENT_URL ? 'SET' : 'NOT SET'
      }
    }
  })
}

