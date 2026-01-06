import { VercelRequest, VercelResponse } from '@vercel/node'

// Import pre-built backend (built by tsup during Vercel build)
// @ts-expect-error - importing from built CJS files
import app from '../dist/app.cjs'
// @ts-expect-error - importing from built CJS files  
import { getDbConnection } from '../dist/data/db/index.cjs'

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await getDbConnection()
    return app(req, res)
  } catch (error) {
    console.error('Serverless function error:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message,
        isReadableMessage: false
      }
    })
  }
}

