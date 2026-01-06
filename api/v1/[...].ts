import { VercelRequest, VercelResponse } from '@vercel/node'

// Import from the pre-built backend bundle
// @ts-expect-error - Importing from compiled output
import app from '../../backend/dist/app.cjs'
// @ts-expect-error - Importing from compiled output  
import { getDbConnection } from '../../backend/dist/data/db/index.cjs'

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await getDbConnection()
    return app(req, res)
  } catch (error) {
    console.error('Failed to connect to MongoDB in Serverless Function', error)
    res.status(500).json({ success: false, error: 'Internal Server Error' })
  }
}
