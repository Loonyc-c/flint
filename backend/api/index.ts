import { VercelRequest, VercelResponse } from '@vercel/node'
import app from '../src/app'
import { getDbConnection } from '../src/data/db'

const ALLOWED_ORIGIN = process.env.CLIENT_URL || '*'
const ALLOWED_METHODS = 'GET,POST,PUT,DELETE,PATCH,OPTIONS'
const ALLOWED_HEADERS = 'Content-Type,Authorization'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Always set CORS headers
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS)
    res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS)

    // Handle preflight early without touching the DB
    if (req.method === 'OPTIONS') {
      return res.status(204).end()
    }

    // Connect to DB
    await getDbConnection()
    
    // Pass request to Express app
    // Note: app is an express application which is compatible with (req, res) signature
    // but TypeScript might complain if types don't perfectly align. 
    // Casting or wrapping might be needed if strict.
    // However, Express app handles (req, res) just fine.
    return app(req, res)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    const stack = error instanceof Error ? error.stack : undefined
    console.error('Serverless function error:', message, stack)
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