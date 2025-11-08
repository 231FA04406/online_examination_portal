// src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { MongoMemoryServer } from 'mongodb-memory-server';

import authRoutes from './routes/auth.js';
import examRoutes from './routes/exams.js';
import submissionRoutes from './routes/submissions.js';
import studentsRoutes from './routes/students.js';

dotenv.config();

const app = express();

// =========================
// Middleware
// =========================
const clientOrigin = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').trim();

app.use(
  cors({
    origin: clientOrigin,
    credentials: true, // allow cookies
  })
);
app.use(express.json({ limit: '1mb' }));

// =========================
// Routes
// =========================
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'OnlineExam API is running!' });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/students', studentsRoutes);

// Optional monitor routes
const { default: monitorRoutes } = await import('./routes/monitor.js');
app.use('/api/monitor', monitorRoutes);

// General API info route
app.get('/api', (req, res) => {
  res.json({ ok: true, name: 'OnlineExam API', version: '0.1.0' });
});

// =========================
// Global Error Handler
// =========================
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// =========================
// Database & Server Setup
// =========================
const MONGO_URI = process.env.MONGO_URI;
const PORT = Number(process.env.PORT || 4000);

async function start() {
  try {
    // Connect to MongoDB
    if (MONGO_URI) {
      try {
        await mongoose.connect(MONGO_URI);
        console.log('Mongo connected (MONGO_URI)');
      } catch (err) {
        console.warn('Failed to connect to MONGO_URI, starting in-memory MongoDB...');
        const mem = await MongoMemoryServer.create();
        await mongoose.connect(mem.getUri());
        console.log('Mongo connected (in-memory)');
      }
    } else {
      const mem = await MongoMemoryServer.create();
      await mongoose.connect(mem.getUri());
      console.log('Mongo connected (in-memory)');
    }

    // HTTP + Socket.io
    const server = http.createServer(app);
    const io = new SocketIOServer(server, {
      cors: { origin: clientOrigin, credentials: true },
    });
    app.set('io', io);

    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);

      socket.on('tab-event', (data) => {
        io.emit('tab-event', { ...data, sid: socket.id, at: Date.now() });
      });
    });

    // Start server
    server.listen(PORT, () => {
      console.log(`API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Mongo startup error:', err.message);
    process.exit(1);
  }
}

start();
