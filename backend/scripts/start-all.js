// This script starts both the Express server and the Telegram bot
require('dotenv').config();
const axios = require('axios');

// Import the server (which also imports the bot)
const app = require('./server');

const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Start the Express server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Telegram bot is active`);

  // Set up self-ping to keep the server alive in production
  if (isProduction) {
    setupKeepAlive();
  }
});

// Function to set up keep-alive pings
function setupKeepAlive() {
  const API_URL = process.env.API_URL || `http://localhost:${PORT}`;
  const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes

  console.log(`Setting up keep-alive pings to ${API_URL}/api/health every ${PING_INTERVAL/1000} seconds`);

  // Function to ping the health endpoint
  async function pingServer() {
    try {
      const response = await axios.get(`${API_URL}/api/health`);
      console.log(`[${new Date().toISOString()}] Keep-alive ping successful:`,
        response.data ? response.data.status : 'OK');
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Keep-alive ping failed:`, error.message);
    }
  }

  // Initial ping after a short delay
  setTimeout(pingServer, 10000);

  // Set up interval for regular pings
  setInterval(pingServer, PING_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // Keep the process running despite the error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection:', reason);
  // Keep the process running despite the rejection
});
