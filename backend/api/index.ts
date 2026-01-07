import { VercelRequest, VercelResponse } from '@vercel/node'
import app from '../src/app'
import { getDbConnection } from '../src/data/db'

const ALLOWED_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || ''
  const isAllowed = ALLOWED_ORIGINS.includes(origin)

  // Set CORS headers - these will be sent with the response
  if (isAllowed || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*')
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

  // Handle OPTIONS preflight immediately
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    await getDbConnection()
    
    // Pass to Express - headers already set above will be included in response
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
