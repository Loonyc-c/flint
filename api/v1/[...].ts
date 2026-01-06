import { VercelRequest, VercelResponse } from '@vercel/node'

// Import from the pre-built backend bundle (built by tsup during Vercel build)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../../backend/dist/app.cjs').default
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDbConnection } = require('../../backend/dist/data/db/index.cjs')

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await getDbConnection()

    // Strip /api prefix so Express routes match correctly
    // Vercel rewrites /v1/* to /api/v1/*, but Express expects /v1/*
    if (req.url?.startsWith('/api')) {
      req.url = req.url.replace(/^\/api/, '')
    }

    return app(req, res)
  } catch (error) {
    console.error('Failed to connect to MongoDB in Serverless Function', error)
    res.status(500).json({ success: false, error: 'Internal Server Error' })
  }
}
