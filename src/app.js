const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// 1. CORS Configuration (Allows Lovable.dev, localhost, or any configured origins)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['*'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: This origin is not allowed.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 2. Request Parsing Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 3. Logger Middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 4. Static Uploads Folder
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 5. Health Check & Welcome Endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 SmartResume AI Backend API is running smoothly!',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

const { suggestSkills } = require('./controllers/analysisController');

// 6. API Route Mounting
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/resumes', resumeRoutes); // plural alias
app.use('/api/analyze', analysisRoutes);
app.use('/api/resumes/analyze', analysisRoutes); // alias
app.post('/api/suggest-skills', suggestSkills); // direct alias
app.post('/api/suggest_skills', suggestSkills); // direct alias
app.use('/api/dashboard', dashboardRoutes);

// 7. 404 Catch-All Route
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// 8. Global Error Handler
app.use(errorHandler);

module.exports = app;
