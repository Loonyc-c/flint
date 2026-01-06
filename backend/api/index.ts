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

  // Try multiple possible dist locations used by Vercel bundling
  const candidateDistPaths = [
    path.join(process.cwd(), 'dist'),
    path.join(__dirname, 'dist'),
    path.join(__dirname, '..', 'dist'),
    '/var/task/dist'
  ]

  let appModule: any = null
  let dbModule: any = null
  for (const distPath of candidateDistPaths) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      appModule = require(path.join(distPath, 'app.cjs'))
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      dbModule = require(path.join(distPath, 'data', 'db', 'index.cjs'))
      console.log('Loaded backend from', distPath)
      break
    } catch (err) {
      console.log('Failed to load backend from', distPath)
      continue
    }
  }

  if (!appModule || !dbModule) {
    throw new Error(`Cannot load backend dist. Tried: ${candidateDistPaths.join(', ')}, cwd=${process.cwd()}, dirname=${__dirname}`)
  }

  cachedApp = appModule.default
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

