import { VercelRequest, VercelResponse } from '@vercel/node'
import app from '../src/app'
import { getDbConnection } from '../src/data/db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Connect to DB
    await getDbConnection()
    
    // Pass request to Express app which handles CORS
    return app(req, res)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    const stack = error instanceof Error ? error.stack : undefined
    console.error('Serverless function error:', message, stack)
    
    // Set CORS headers for error responses
    const origin = req.headers.origin
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Access-Control-Allow-Credentials', 'true')
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message,
        isReadableMessage: false,
        debug: stack?.split('\n').slice(0, 5)
      }
    })
  }
}