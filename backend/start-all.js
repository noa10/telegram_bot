// This script starts both the Express server and the Telegram bot
require('dotenv').config();

// Import the server (which also imports the bot)
const app = require('./server');

const PORT = process.env.PORT || 3001;

// Start the Express server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Telegram bot is active`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
