/**
 * Production entry point for Render deployment
 * Includes graceful shutdown and error handling
 */
import app from './app'
import http from 'http'
import { getDbConnection } from './data/db'
import { initializeSocketServer } from './features/realtime/socket'

const server = http.createServer(app)
const port = process.env.PORT || 10000

// Track server state
let isShuttingDown = false

/**
 * Graceful shutdown handler
 */
const shutdown = async (signal: string) => {
  if (isShuttingDown) return
  isShuttingDown = true

  console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`)

  // Stop accepting new connections
  server.close((err) => {
    if (err) {
      console.error('❌ Error closing server:', err)
      process.exit(1)
    }
    console.log('✅ Server closed. No longer accepting connections.')
  })

  // Give existing connections time to complete (30 seconds max)
  const forceShutdownTimeout = setTimeout(() => {
    console.error('❌ Forced shutdown after timeout')
    process.exit(1)
  }, 30000)

  forceShutdownTimeout.unref()

  // Wait a bit for in-flight requests to complete
  await new Promise((resolve) => setTimeout(resolve, 5000))

  console.log('✅ Graceful shutdown complete')
  process.exit(0)
}

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  shutdown('uncaughtException')
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  // Don't exit on unhandled rejections, just log them
})

/**
 * Start the server
 */
const startServer = async () => {
  try {
    console.log('🚀 Starting Flint Backend on Render...')
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)

    // Connect to MongoDB
    await getDbConnection()
    console.log('✅ MongoDB connected')

    // Initialize Socket.io server
    initializeSocketServer(server)
    console.log('✅ Socket.io initialized')

    // Start listening
    server.listen(port, () => {
      console.log(`✅ Server listening on port ${port}`)
      console.log(`🌐 Health check: http://localhost:${port}/`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
