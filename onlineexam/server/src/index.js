import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import examRoutes from './routes/exams.js'
import submissionRoutes from './routes/submissions.js'
import { MongoMemoryServer } from 'mongodb-memory-server'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import studentsRoutes from './routes/students.js'
import User from './models/User.js'
import crypto from 'crypto'

dotenv.config()

const app = express()
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.get('/api', (req, res) => res.json({ ok: true, name: 'OnlineExam API', version: '0.1.0' }))
app.use('/api/auth', authRoutes)
app.use('/api/exams', examRoutes)
app.use('/api/submissions', submissionRoutes)
app.use('/api/students', studentsRoutes)
// monitor routes will be attached after io is created

const MONGO_URI = process.env.MONGO_URI
const PORT = Number(process.env.PORT || 4000)

async function start() {
  try {
    if (MONGO_URI) {
      try {
        await mongoose.connect(MONGO_URI)
        console.log('Mongo connected (MONGO_URI)')
      } catch (e) {
        console.warn('Failed to connect to MONGO_URI, starting in-memory MongoDB...')
        const mem = await MongoMemoryServer.create()
        const uri = mem.getUri()
        await mongoose.connect(uri)
        console.log('Mongo connected (in-memory)')
      }
    } else {
      const mem = await MongoMemoryServer.create()
      const uri = mem.getUri()
      await mongoose.connect(uri)
      console.log('Mongo connected (in-memory)')
    }
    // Admin user is created via web setup flow (/api/auth/admin-setup)

    const server = http.createServer(app)
    const io = new SocketIOServer(server, { cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' } })
    app.set('io', io)

    io.on('connection', (socket) => {
      socket.on('tab-event', (data) => {
        // broadcast to admins/monitors; for now, echo back
        io.emit('tab-event', { ...data, sid: socket.id, at: Date.now() })
      })
    })

    // attach monitor routes after io is set
    const { default: monitorRoutes } = await import('./routes/monitor.js')
    app.use('/api/monitor', monitorRoutes)

    server.listen(PORT, () => console.log(`API on http://localhost:${PORT}`))
  } catch (err) {
    console.error('Mongo startup error:', err.message)
    process.exit(1)
  }
}

start()
