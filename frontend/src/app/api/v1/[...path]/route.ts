import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Cache for loaded modules
let app: ((req: unknown, res: unknown) => void) | null = null
let getDbConnection: (() => Promise<void>) | null = null

async function loadBackend() {
  if (!app) {
    try {
      // Use eval to completely hide from bundler analysis
      // eslint-disable-next-line no-eval
      const loadModule = eval('require')
      
      // Backend dist is copied to .next/server/backend-dist during build
      const cwd = process.cwd()
      const backendDistPath = [cwd, '.next', 'server', 'backend-dist'].join('/')

      const appPath = [backendDistPath, 'app.cjs'].join('/')
      const dbPath = [backendDistPath, 'data', 'db', 'index.cjs'].join('/')

      const appModule = loadModule(appPath)
      app = appModule.default

      const dbModule = loadModule(dbPath)
      getDbConnection = dbModule.getDbConnection
    } catch (error) {
      console.error('Failed to load backend:', error)
      throw error
    }
  }
  return { app: app!, getDbConnection: getDbConnection! }
}

async function handleRequest(req: NextRequest): Promise<NextResponse> {
  try {
    const { app, getDbConnection } = await loadBackend()
    await getDbConnection()

    const url = new URL(req.url)
    // Strip /api to get /v1/...
    const expressPath = url.pathname.replace(/^\/api/, '') + url.search

    const body =
      req.method !== 'GET' && req.method !== 'HEAD' ? await req.json().catch(() => ({})) : undefined

    return new Promise((resolve, reject) => {
      // Set a timeout to catch hanging requests
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout - Express handler did not respond'))
      }, 25000)

      // Create Express-compatible request object
      const expressReq = {
        method: req.method,
        url: expressPath,
        path: expressPath.split('?')[0],
        query: Object.fromEntries(url.searchParams),
        headers: Object.fromEntries(req.headers),
        body,
        params: {},
        get: (name: string) => req.headers.get(name)
      }

      // Create Express-compatible response object
      let statusCode = 200
      const headers: Record<string, string> = {}
      let sent = false

      const expressRes = {
        statusCode: 200,
        status(code: number) {
          statusCode = code
          this.statusCode = code
          return this
        },
        setHeader(name: string, value: string) {
          headers[name.toLowerCase()] = value
          return this
        },
        getHeader(name: string) {
          return headers[name.toLowerCase()]
        },
        json(data: unknown) {
          if (sent) return this
          sent = true
          clearTimeout(timeout)
          headers['content-type'] = 'application/json'
          resolve(new NextResponse(JSON.stringify(data), { status: statusCode, headers }))
          return this
        },
        send(data: unknown) {
          if (sent) return this
          sent = true
          clearTimeout(timeout)
          const body = typeof data === 'object' ? JSON.stringify(data) : String(data)
          if (typeof data === 'object') headers['content-type'] = 'application/json'
          resolve(new NextResponse(body, { status: statusCode, headers }))
          return this
        },
        end(data?: string) {
          if (sent) return this
          sent = true
          clearTimeout(timeout)
          resolve(new NextResponse(data || null, { status: statusCode, headers }))
          return this
        }
      }

      try {
        app(expressReq, expressRes)
      } catch (expressError) {
        clearTimeout(timeout)
        reject(expressError)
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('API route error:', errorMessage, errorStack)

    // Return more detailed error in development-like scenarios
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 500,
          message: errorMessage,
          isReadableMessage: false,
          debug: errorStack?.split('\n').slice(0, 5)
        }
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(req)
}

export async function POST(req: NextRequest) {
  return handleRequest(req)
}

export async function PUT(req: NextRequest) {
  return handleRequest(req)
}

export async function PATCH(req: NextRequest) {
  return handleRequest(req)
}

export async function DELETE(req: NextRequest) {
  return handleRequest(req)
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.CLIENT_URL || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }
  })
}

// Disable body parsing - we handle it ourselves
export const config = {
  api: {
    bodyParser: false
  }
}
