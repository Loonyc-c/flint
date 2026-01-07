import 'dotenv/config'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import { createErrorhandler } from '@/shared/api/handler'
import { apiErrorHandler } from '@/shared/api/error'
import publicRouter from '@/routes/public'
import protectedRouter from '@/routes/protected'

const app = express()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

// CORS handled at Vercel wrapper level (api/index.ts)
app.use(express.json())

app.use('/v1/auth', authLimiter)
app.use('/v1', publicRouter)
app.use('/v1', protectedRouter)
app.use(createErrorhandler(apiErrorHandler))

export default app
