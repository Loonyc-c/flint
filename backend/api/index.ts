import { VercelRequest, VercelResponse } from '@vercel/node'
import app from '../src/app'
import { getDbConnection } from '../src/data/db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`[Vercel Handler] Incoming request: ${req.method} ${req.url}`)
  try {
    // Connect to DB
    console.log('[Vercel Handler] Connecting to DB...')
    await getDbConnection()
    console.log('[Vercel Handler] DB Connected. Passing to Express app...')

    // Pass request to Express app which handles CORS
    return app(req, res)
  } catch (error) {
    console.error('[Vercel Handler] CRITICAL ERROR:', error)
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
