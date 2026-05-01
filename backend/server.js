require('./utils/logger'); // Initialize custom logger first
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('mongo-sanitize');
const { connectDB } = require('./config/db');

dotenv.config();
const app = express();

// Security Middleware
app.use(helmet()); // Security headers
app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.query = mongoSanitize(req.query);
  req.params = mongoSanitize(req.params);
  next();
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // General limit
  message: 'Too many requests, please try again later'
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Strict limit for auth (signup/login)
  message: 'Too many login/signup attempts, please try again after 15 minutes'
});
app.use(limiter);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

const path = require('path');

// Initialize database
connectDB().then(() => {
  const authRoutes = require('./routes/auth.routes');
  const projectRoutes = require('./routes/project.routes');
  const taskRoutes = require('./routes/task.routes');
  const notificationRoutes = require('./routes/notification.routes');

  // Routes
  app.use('/auth', authLimiter, authRoutes);
  app.use('/projects', projectRoutes);
  app.use('/tasks', taskRoutes);
  app.use('/notifications', notificationRoutes);

  // SERVE FRONTEND IN PRODUCTION
  if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.resolve(__dirname, '..', 'frontend', 'dist');
    app.use(express.static(frontendPath));
    
    // Express 5 compatible catch-all: Use a middleware instead of a string path
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/auth') && !req.path.startsWith('/projects') && !req.path.startsWith('/tasks') && !req.path.startsWith('/notifications')) {
        return res.sendFile(path.join(frontendPath, 'index.html'));
      }
      next();
    });
  } else {
    app.get('/', (req, res) => {
      res.send('API is running...');
    });
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('Unhandled Express Error:', err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
  });
}).catch(err => {
  console.error("Failed to start server:", err);
});
