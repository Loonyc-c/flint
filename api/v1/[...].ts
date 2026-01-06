import app from '../../backend/src/app'
import { getDbConnection } from '../../backend/src/data/db'
import { VercelRequest, VercelResponse } from '@vercel/node'

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    await getDbConnection()
    return app(req, res)
  } catch (error) {
    console.error('Failed to connect to MongoDB in Serverless Function', error)
    res.status(500).json({ success: false, error: 'Internal Server Error' })
  }
}

