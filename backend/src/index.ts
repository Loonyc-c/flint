import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { getDbConnection } from './data/db'
import { createErrorhandler } from '@/shared/api/handler'
import { apiErrorHandler } from '@/shared/api/error'
import publicRouter from '@/routes/public'

const app = express()

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000'

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(express.json())
const port = 9999

app.use('/v1', publicRouter)
app.use(createErrorhandler(apiErrorHandler))

app.listen(port, async () => {
  try {
    await getDbConnection()
    console.log('✅ MongoDB connected')
    console.log(`✅ V1 Server listening on port ${port}`)
  } catch (e) {
    console.error('❌ Failed to connect to MongoDB', e)
    process.exit(1)
  }
})
