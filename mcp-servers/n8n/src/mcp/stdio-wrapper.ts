#!/usr/bin/env node

/**
 * Stdio wrapper for MCP server
 * Ensures clean JSON-RPC communication by suppressing all non-JSON output
 */

// CRITICAL: Set environment BEFORE any imports to prevent any initialization logs
process.env.MCP_MODE = 'stdio';
process.env.DISABLE_CONSOLE_OUTPUT = 'true';
process.env.LOG_LEVEL = 'error';

// Suppress all console output before anything else
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;
const originalConsoleDebug = console.debug;
const originalConsoleTrace = console.trace;
const originalConsoleDir = console.dir;
const originalConsoleTime = console.time;
const originalConsoleTimeEnd = console.timeEnd;

// Override ALL console methods to prevent any output
console.log = () => {};
console.error = () => {};
console.warn = () => {};
console.info = () => {};
console.debug = () => {};
console.trace = () => {};
console.dir = () => {};
console.time = () => {};
console.timeEnd = () => {};
console.timeLog = () => {};
console.group = () => {};
console.groupEnd = () => {};
console.table = () => {};
console.clear = () => {};
console.count = () => {};
console.countReset = () => {};

// Import and run the server AFTER suppressing output
import { N8NDocumentationMCPServer } from './server';

let server: N8NDocumentationMCPServer | null = null;

async function main() {
  try {
    server = new N8NDocumentationMCPServer();
    await server.run();
  } catch (error) {
    // In case of fatal error, output to stderr only
    originalConsoleError('Fatal error:', error);
    process.exit(1);
  }
}

// Handle uncaught errors silently
process.on('uncaughtException', (error) => {
  originalConsoleError('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  originalConsoleError('Unhandled rejection:', reason);
  process.exit(1);
});

// Handle termination signals for proper cleanup
let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  // Log to stderr only (not stdout which would corrupt JSON-RPC)
  originalConsoleError(`Received ${signal}, shutting down gracefully...`);
  
  try {
    // Shutdown the server if it exists
    if (server) {
      await server.shutdown();
    }
  } catch (error) {
    originalConsoleError('Error during shutdown:', error);
  }
  
  // Close stdin to signal we're done reading
  process.stdin.pause();
  process.stdin.destroy();
  
  // Exit with timeout to ensure we don't hang
  setTimeout(() => {
    process.exit(0);
  }, 500).unref(); // unref() allows process to exit if this is the only thing keeping it alive
  
  // But also exit immediately if nothing else is pending
  process.exit(0);
}

// Register signal handlers
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGHUP', () => void shutdown('SIGHUP'));

// Also handle stdin close (when Claude Desktop closes the pipe)
process.stdin.on('end', () => {
  originalConsoleError('stdin closed, shutting down...');
  void shutdown('STDIN_CLOSE');
});

main();