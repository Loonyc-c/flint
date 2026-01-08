import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import { createErrorhandler } from '@/shared/api/handler'
import { apiErrorHandler } from '@/shared/api/error'
import publicRouter from '@/routes/public'
import protectedRouter from '@/routes/protected'

const app = express()

console.log('[Express App] Initializing...')

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

const rawOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean)

console.log('[Express App] Allowed Origins:', rawOrigins)

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    console.log(`[CORS Check] Origin: '${origin}'`)
    // Allow server-to-server or same-origin (no origin header)
    if (!origin) return callback(null, true)
    const normalized = origin.replace(/\/$/, '')
    const allowed = rawOrigins.includes(normalized)
    if (allowed) {
      console.log('[CORS Check] Allowed')
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

app.use('/v1/auth', authLimiter)
app.use('/v1', publicRouter)
app.use('/v1', protectedRouter)
app.use(createErrorhandler(apiErrorHandler))

export default app
