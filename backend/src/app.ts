import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { Redis } from 'ioredis'
import { RedisStore } from 'rate-limit-redis'
import { createErrorhandler } from '@/shared/api/handler'
import { apiErrorHandler } from '@/shared/api/error'
import publicRouter from '@/routes/public'
import protectedRouter from '@/routes/protected'
import { circuitBreaker } from '@/utils/circuit-breaker'

const app = express()

app.set('trust proxy', 1)

// Security Headers
app.use(helmet())

console.log('[Express App] Initializing...')

// Initialize Redis Client for Rate Limiting
const redisClient = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : undefined

if (redisClient) {
  console.log('[Express App] Redis connected for rate limiting')
} else {
  console.warn('[Express App] REDIS_URL not set, falling back to memory rate limiting (not recommended for serverless)')
}

// Create sendCommand function for RedisStore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createSendCommand = (client: Redis): any => {
  return async (...args: string[]) => {
    const [command, ...params] = args
    return await client.call(command, ...params)
  }
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: redisClient
    ? new RedisStore({
        sendCommand: createSendCommand(redisClient),
      })
    : undefined,
})

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 60, // Limit each IP to 60 requests per minute
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: redisClient
    ? new RedisStore({
        sendCommand: createSendCommand(redisClient),
      })
    : undefined,
})



const rawOrigins = (process.env.CLIENT_URL || 'http://localhost:3000,http://127.0.0.1:7242')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean)

console.log('[Express App] Allowed Origins:', rawOrigins)

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server or same-origin (no origin header)
    if (!origin) return callback(null, true)
    const normalized = origin.replace(/\/$/, '')
    const allowed = rawOrigins.includes(normalized)
    if (allowed) {
      return callback(null, true)
    }
    console.error(`[CORS Check] Blocked: '${origin}'`)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}

app.use(cors(corsOptions))
app.use(express.json())
app.use('/v1', generalLimiter)

// Health check and API info endpoint
app.get('/', (_req, res) => {
  res.json({
    status: circuitBreaker.isOpen() ? 'degraded' : 'ok',
    system: circuitBreaker.getStats(),
    message: 'Flint Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/v1/auth',
      docs: 'API endpoints are available under /v1/*',
    },
  })
})

app.use('/v1/auth', authLimiter)
app.use('/v1', publicRouter)
app.use('/v1', protectedRouter)
app.use(createErrorhandler(apiErrorHandler))

export default app
