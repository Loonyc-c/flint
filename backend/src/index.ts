import app from './app'
import http from 'http'
import { getDbConnection } from './data/db'
import { initializeSocketServer } from './features/realtime/socket'

const server = http.createServer(app)
const port = process.env.PORT || 9999

server.listen(port, async () => {
  try {
    await getDbConnection()
    console.log('✅ MongoDB connected')

    // Initialize Socket.io server
    initializeSocketServer(server)
    console.log('✅ Socket.io initialized')

    console.log(`✅ V1 Server listening on port ${port}`)
  } catch (e) {
    console.error('❌ Failed to connect to MongoDB', e)
    process.exit(1)
  }
})