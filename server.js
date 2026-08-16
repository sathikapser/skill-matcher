require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`
=====================================================
🚀 SmartResume AI Server is running!
📡 URL: http://localhost:${PORT}
🩺 Health Check: http://localhost:${PORT}/api/health
📁 Uploads: http://localhost:${PORT}/uploads
🛠️  Environment: ${process.env.NODE_ENV || 'development'}
=====================================================
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`💥 Unhandled Rejection: ${err.message}`);
  // Keep server running in development for convenience
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`💥 Uncaught Exception: ${err.message}`);
});
