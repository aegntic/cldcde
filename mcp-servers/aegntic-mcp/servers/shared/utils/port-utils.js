/**
 * Port utility functions for MCP servers
 */

const net = require('net');

/**
 * Check if a port is available
 * @param {number} port - Port to check
 * @returns {Promise<boolean>} - True if port is available, false otherwise
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        // Other errors are considered as port available for simplicity
        resolve(true);
      }
    });
    
    server.once('listening', () => {
      // Close the server and report port as available
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

/**
 * Find an available port, starting from preferredPort
 * @param {number} preferredPort - Starting port to check
 * @param {number} maxAttempts - Maximum attempts before giving up (optional)
 * @returns {Promise<number>} - Available port
 */
async function findAvailablePort(preferredPort, maxAttempts = 100) {
  let currentPort = preferredPort;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    // Check if current port is available
    const available = await isPortAvailable(currentPort);
    
    if (available) {
      return currentPort;
    }
    
    // Move to next port
    currentPort++;
    attempts++;
  }
  
  // If we couldn't find an available port after maxAttempts,
  // return the next port after all our attempts
  // (last resort, might still fail when used)
  return currentPort;
}

module.exports = {
  isPortAvailable,
  findAvailablePort
};