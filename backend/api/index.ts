import { VercelRequest, VercelResponse } from '@vercel/node'
import app from '../src/app'
import { getDbConnection } from '../src/data/db'

const ALLOWED_ORIGIN = process.env.CLIENT_URL || '*'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  try {
    // Connect to DB
    await getDbConnection()

    // Pass request to Express app
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
        debug: stack?.split('\n').slice(0, 5),
      },
    })
  }
}
