/**
 * This script pings the server periodically to keep it alive
 * It can be run as a separate process or as a cron job
 */

const axios = require('axios');
require('dotenv').config();

// Get the server URL from environment variables or use a default
const API_URL = process.env.API_URL || 'http://localhost:3001';
const PING_INTERVAL = process.env.PING_INTERVAL || 5 * 60 * 1000; // 5 minutes by default

console.log(`Keep-alive script started for ${API_URL}`);
console.log(`Will ping every ${PING_INTERVAL / 1000} seconds`);

// Function to ping the health endpoint
async function pingServer() {
  try {
    const startTime = Date.now();
    const response = await axios.get(`${API_URL}/api/health`);
    const responseTime = Date.now() - startTime;
    
    console.log(`[${new Date().toISOString()}] Server ping successful (${responseTime}ms): ${JSON.stringify(response.data)}`);
    return true;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Server ping failed:`, error.message);
    return false;
  }
}

// Initial ping
pingServer();

// Set up interval for regular pings
setInterval(pingServer, PING_INTERVAL);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Keep-alive script terminated');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Keep-alive script terminated');
  process.exit(0);
});
