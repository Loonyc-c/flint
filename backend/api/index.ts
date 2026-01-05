import app from '../src/app'
import { getDbConnection } from '../src/data/db'
import { VercelRequest, VercelResponse } from '@vercel/node'

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Ensure DB is connected before handling request
    await getDbConnection()
    return app(req, res)
  } catch (error) {
    console.error('Failed to connect to MongoDB in Serverless Function', error)
    res.status(500).json({ success: false, error: 'Internal Server Error' })
  }
}
