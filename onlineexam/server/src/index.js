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

// Fix: Trim CLIENT_ORIGIN to remove any trailing spaces or hidden characters
const clientOrigin = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').trim();

// Middleware
app.use(
  cors({
    origin: clientOrigin, // Use trimmed value
    credentials: true, // needed for cookies
  })
);
app.use(express.json({ limit: '1mb' }));

// Default root route
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'OnlineExam API is running!' });
});

// Health check route
app.get('/api/health', (req, res) => res.json({ ok: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/students', studentsRoutes);

// Optional: general API info route
app.get('/api', (req, res) => {
  res.json({ ok: true, name: 'OnlineExam API', version: '0.1.0' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err); // logs full error on Render
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

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
        console.warn(
          'Failed to connect to MONGO_URI, starting in-memory MongoDB...'
        );
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
      cors: {
        origin: clientOrigin, // Use trimmed value here too
        credentials: true,
      },
    });
    app.set('io', io);

    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);

      socket.on('tab-event', (data) => {
        io.emit('tab-event', { ...data, sid: socket.id, at: Date.now() });
      });
    });

    // Monitor routes (optional)
    const { default: monitorRoutes } = await import('./routes/monitor.js');
    app.use('/api/monitor', monitorRoutes);

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
