import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import facultyRoutes from './routes/faculty.routes';
import studentRoutes from './routes/student.routes';
import examRoutes from './routes/exam.routes';
import reportRoutes from './routes/report.routes';
import { SocketService } from './services/socket.service';
import { errorHandler } from './middleware/errorHandler';

import fs from 'fs';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '';

// Flexible CORS for local dev and Render deployments
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.onrender.com') ||
      (CLIENT_ORIGIN && origin === CLIENT_ORIGIN)
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    platform: 'CampusExam AI',
    timestamp: new Date().toISOString(),
    sandbox: {
      python: true,
      dockerIsolated: false,
    },
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/reports', reportRoutes);

// Serve frontend static build if it exists (e.g. on Render unified deployment)
const frontendDistCandidates = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
];
const frontendDist = frontendDistCandidates.find((p) => fs.existsSync(p));

if (frontendDist) {
  console.log(`📦 Serving production frontend build from: ${frontendDist}`);
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

// Initialize Socket.IO for real-time exam monitoring
SocketService.initialize(server, CLIENT_ORIGIN || '*');

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 CampusExam AI Server running on port ${PORT}`);
  console.log(`📡 Real-time Socket.IO proctoring active`);
  console.log(`🔒 Security RBAC & Autograding Engine ready`);
  console.log(`===============================================`);
});

export { app, server };
