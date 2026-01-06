import { VercelRequest, VercelResponse } from '@vercel/node'
import path from 'path'

// Cache for loaded modules
let app: ((req: VercelRequest, res: VercelResponse) => void) | null = null
let getDbConnection: (() => Promise<void>) | null = null

function loadBackend() {
  if (!app) {
    // Try multiple path strategies
    const possiblePaths = [
      path.join(process.cwd(), 'dist'),           // Working directory
      path.join(__dirname, '..', 'dist'),         // Relative to this file
      path.join(__dirname, 'dist'),               // Same directory
      '/var/task/dist'                            // Vercel default
    ]
    
    let loadedApp = null
    let loadedDb = null
    let usedPath = ''
    
    for (const distPath of possiblePaths) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const appModule = require(path.join(distPath, 'app.cjs'))
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const dbModule = require(path.join(distPath, 'data', 'db', 'index.cjs'))
        
        loadedApp = appModule.default
        loadedDb = dbModule.getDbConnection
        usedPath = distPath
        console.log('Successfully loaded backend from:', distPath)
        break
      } catch (e) {
        console.log('Failed to load from:', distPath)
        continue
      }
    }
    
    if (!loadedApp || !loadedDb) {
      throw new Error(`Could not load backend from any path. Tried: ${possiblePaths.join(', ')}. CWD: ${process.cwd()}, __dirname: ${__dirname}`)
    }
    
    app = loadedApp
    getDbConnection = loadedDb
  }
  return { app: app!, getDbConnection: getDbConnection! }
}

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { app, getDbConnection } = loadBackend()
    await getDbConnection()
    return app(req, res)
  } catch (error) {
    console.error('Serverless function error:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    const stack = error instanceof Error ? error.stack : undefined
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message,
        isReadableMessage: false,
        debug: {
          error: stack?.split('\n').slice(0, 5),
          cwd: process.cwd(),
          dirname: __dirname
        }
      }
    })
  }
}

