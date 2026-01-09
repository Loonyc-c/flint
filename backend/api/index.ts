// Configure path aliases for runtime resolution
import path from 'path'

const basePath = path.join(__dirname, '..')

// Try to use module-alias, but fall back to tsconfig-paths only if it fails
// (module-alias may fail in Vercel if package.json isn't in expected location)
let moduleAlias: any
try {
  moduleAlias = require('module-alias')
  moduleAlias.addAlias('@', path.join(basePath, 'src'))
  moduleAlias.addAlias('@shared', path.join(basePath, 'src/shared-types'))
} catch (error) {
  // module-alias initialization failed, will rely on tsconfig-paths only
  console.warn('[Path Aliases] module-alias initialization failed, using tsconfig-paths only:', error)
}

// Register tsconfig-paths (primary or fallback path resolution)
import * as tsConfigPaths from 'tsconfig-paths'
import * as tsConfig from '../tsconfig.json'
tsConfigPaths.register({
  baseUrl: basePath,
  paths: tsConfig.compilerOptions.paths,
})

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
    const isDev = process.env.NODE_ENV === 'development'
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    const stack = error instanceof Error ? error.stack : undefined
    console.error('Serverless function error:', message, stack)

    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: isDev ? message : 'Internal Server Error',
        isReadableMessage: false,
        ...(isDev && { debug: stack?.split('\n').slice(0, 5) }),
      },
    })
  }
}
