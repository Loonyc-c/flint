import { VercelRequest, VercelResponse } from '@vercel/node'
import path from 'path'

let cachedApp: ((req: VercelRequest, res: VercelResponse) => Promise<unknown> | unknown) | null =
  null
let cachedGetDbConnection: (() => Promise<void>) | null = null
const ALLOWED_ORIGIN = process.env.CLIENT_URL || '*'
const ALLOWED_METHODS = 'GET,POST,PUT,DELETE,PATCH,OPTIONS'
const ALLOWED_HEADERS = 'Content-Type,Authorization'

function loadBackend() {
  if (cachedApp && cachedGetDbConnection) return { app: cachedApp, getDbConnection: cachedGetDbConnection }

  const distPath = path.join(__dirname, '..', 'dist')

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const appModule = require(path.join(distPath, 'app.cjs'))
  cachedApp = appModule.default

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dbModule = require(path.join(distPath, 'data', 'db', 'index.cjs'))
  cachedGetDbConnection = dbModule.getDbConnection

  return { app: cachedApp, getDbConnection: cachedGetDbConnection }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Always set CORS headers
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS)
    res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS)

    // Handle preflight early without touching the DB
    if (req.method === 'OPTIONS') {
      return res.status(204).end()
    }

    const { app, getDbConnection } = loadBackend()
    await getDbConnection()
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
        debug: stack?.split('\n').slice(0, 5)
      }
    })
  }
}

