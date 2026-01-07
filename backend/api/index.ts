import { VercelRequest, VercelResponse } from '@vercel/node'
import app from '../src/app'
import { getDbConnection } from '../src/data/db'

const ALLOWED_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Get origin from request
  const origin = req.headers.origin || ''
  const isAllowed = ALLOWED_ORIGINS.includes(origin)

  // DEBUG LOGGING
  console.log('=== CORS DEBUG ===')
  console.log('CLIENT_URL env:', process.env.CLIENT_URL)
  console.log('ALLOWED_ORIGINS:', ALLOWED_ORIGINS)
  console.log('Request origin:', origin)
  console.log('Is allowed:', isAllowed)
  console.log('Request method:', req.method)
  console.log('Request path:', req.url)

  // Set CORS headers for all requests
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    console.log('✅ Set Access-Control-Allow-Origin:', origin)
  } else {
    console.log('❌ Origin not allowed!')
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight')
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
