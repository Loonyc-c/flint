import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createErrorhandler } from '@/shared/api/handler'
import { apiErrorHandler } from '@/shared/api/error'
import publicRouter from '@/routes/public'
import protectedRouter from '@/routes/protected'

const app = express()

const rawOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean)

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server or same-origin (no origin header)
    if (!origin) return callback(null, true)
    const normalized = origin.replace(/\/$/, '')
    const allowed = rawOrigins.includes(normalized)
    if (allowed) return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}

app.use(cors(corsOptions))
app.use(express.json())

app.use('/v1', publicRouter)
app.use('/v1', protectedRouter)
app.use(createErrorhandler(apiErrorHandler))

export default app
