import { VercelRequest, VercelResponse } from '@vercel/node'

// Import from the pre-built backend bundle (built by tsup during Vercel build)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../../backend/dist/app.cjs').default
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDbConnection } = require('../../backend/dist/data/db/index.cjs')

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await getDbConnection()
    return app(req, res)
  } catch (error) {
    console.error('Failed to connect to MongoDB in Serverless Function', error)
    res.status(500).json({ success: false, error: 'Internal Server Error' })
  }
}
