import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

// Cache for loaded modules
let app: ((req: unknown, res: unknown) => void) | null = null
let getDbConnection: (() => Promise<void>) | null = null

// Use indirect require to bypass Turbopack static analysis
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const dynamicRequire = new Function('modulePath', 'return require(modulePath)') as (path: string) => unknown

async function loadBackend() {
  if (!app) {
    try {
      // Use absolute path resolution for the backend dist
      const backendDistPath = path.join(process.cwd(), 'backend-dist')

      const appModule = dynamicRequire(path.join(backendDistPath, 'app.cjs')) as { default: typeof app }
      app = appModule.default

      const dbModule = dynamicRequire(path.join(backendDistPath, 'data', 'db', 'index.cjs')) as {
        getDbConnection: typeof getDbConnection
      }
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

    return new Promise(resolve => {
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
          headers['content-type'] = 'application/json'
          resolve(new NextResponse(JSON.stringify(data), { status: statusCode, headers }))
          return this
        },
        send(data: unknown) {
          if (sent) return this
          sent = true
          const body = typeof data === 'object' ? JSON.stringify(data) : String(data)
          if (typeof data === 'object') headers['content-type'] = 'application/json'
          resolve(new NextResponse(body, { status: statusCode, headers }))
          return this
        },
        end(data?: string) {
          if (sent) return this
          sent = true
          resolve(new NextResponse(data || null, { status: statusCode, headers }))
          return this
        }
      }

      app(expressReq, expressRes)
    })
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 500, message: 'Internal Server Error', isReadableMessage: false }
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
