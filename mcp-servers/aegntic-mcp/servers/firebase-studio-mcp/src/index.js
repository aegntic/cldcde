/**
 * Entry point for Firebase Studio MCP Server
 */

const { exec } = require('child_process');
const os = require('os');
const server = require('./server');

// We must use try-catch because the shared utilities may not exist in earlier versions
let findAvailablePort;
try {
  const portUtils = require('../../shared/utils/port-utils');
  findAvailablePort = portUtils.findAvailablePort;
} catch (error) {
  // Fallback implementation if shared utils aren't available
  findAvailablePort = async (port) => port;
}

// Default port and environment variable
const DEFAULT_PORT = 3000;
const PORT_ENV_VAR = 'MCP_PORT';

// Function to get local IP addresses
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const interfaceName in interfaces) {
    const interfaceInfo = interfaces[interfaceName];
    for (const info of interfaceInfo) {
      // Skip internal and non-IPv4 addresses
      if (!info.internal && info.family === 'IPv4') {
        addresses.push(info.address);
      }
    }
  }
  
  return addresses;
}

// Start server with flexible port
async function startServer() {
  try {
    // Get preferred port from environment or use default
    const preferredPort = parseInt(process.env[PORT_ENV_VAR], 10) || DEFAULT_PORT;
    
    // Find an available port
    const port = await findAvailablePort(preferredPort);
    
    // Start the server
    await server.start({ port });
    
    console.log(`\n🚀 Firebase Studio MCP Server running on port ${port}`);
    
    // If we're using a different port than preferred, show a notice
    if (port !== preferredPort) {
      console.log(`ℹ️  Note: Port ${preferredPort} was not available, using port ${port} instead.`);
      console.log(`ℹ️  You can set a different starting port with the ${PORT_ENV_VAR} environment variable.`);
    }
    
    // Show connection URLs
    console.log('\n📋 Connection URL for Claude:');
    console.log(`   http://localhost:${port}`);
    
    // Show IP-based URLs (helpful for mobile or other devices)
    const ipAddresses = getLocalIpAddresses();
    if (ipAddresses.length > 0) {
      console.log('\n📱 Connection URLs for other devices on the same network:');
      ipAddresses.forEach(ip => {
        console.log(`   http://${ip}:${port}`);
      });
    }
    
    // List available methods
    console.log('\n🔧 Available methods:');
    server.methods.forEach(method => {
      console.log(` - ${method.name}: ${method.description}`);
    });
    
    // Check if required tools are available
    exec('firebase --version', (error) => {
      if (error) {
        console.log('\n⚠️  WARNING: Firebase CLI not found in PATH');
        console.log('   Run ./setup.sh to install the required tools');
      }
    });
    
    exec('gcloud --version', (error) => {
      if (error) {
        console.log('\n⚠️  WARNING: Google Cloud SDK not found in PATH');
        console.log('   Run ./setup.sh to install the required tools');
      }
    });
  } catch (error) {
    console.error('\n❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();