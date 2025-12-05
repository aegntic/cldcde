#!/usr/bin/env node
/**
 * Test script for URL configuration in n8n-MCP HTTP server
 * Tests various BASE_URL, TRUST_PROXY, and proxy header scenarios
 */

import axios from 'axios';
import { spawn } from 'child_process';
import { logger } from '../src/utils/logger';

interface TestCase {
  name: string;
  env: Record<string, string>;
  expectedUrls?: {
    health: string;
    mcp: string;
  };
  proxyHeaders?: Record<string, string>;
}

const testCases: TestCase[] = [
  {
    name: 'Default configuration (no BASE_URL)',
    env: {
      MCP_MODE: 'http',
      AUTH_TOKEN: 'test-token-for-testing-only',
      PORT: '3001'
    },
    expectedUrls: {
      health: 'http://localhost:3001/health',
      mcp: 'http://localhost:3001/mcp'
    }
  },
  {
    name: 'With BASE_URL configured',
    env: {
      MCP_MODE: 'http',
      AUTH_TOKEN: 'test-token-for-testing-only',
      PORT: '3002',
      BASE_URL: 'https://n8n-mcp.example.com'
    },
    expectedUrls: {
      health: 'https://n8n-mcp.example.com/health',
      mcp: 'https://n8n-mcp.example.com/mcp'
    }
  },
  {
    name: 'With PUBLIC_URL configured',
    env: {
      MCP_MODE: 'http',
      AUTH_TOKEN: 'test-token-for-testing-only',
      PORT: '3003',
      PUBLIC_URL: 'https://api.company.com/mcp'
    },
    expectedUrls: {
      health: 'https://api.company.com/mcp/health',
      mcp: 'https://api.company.com/mcp/mcp'
    }
  },
  {
    name: 'With TRUST_PROXY and proxy headers',
    env: {
      MCP_MODE: 'http',
      AUTH_TOKEN: 'test-token-for-testing-only',
      PORT: '3004',
      TRUST_PROXY: '1'
    },
    proxyHeaders: {
      'X-Forwarded-Proto': 'https',
      'X-Forwarded-Host': 'proxy.example.com'
    }
  },
  {
    name: 'Fixed HTTP implementation',
    env: {
      MCP_MODE: 'http',
      USE_FIXED_HTTP: 'true',
      AUTH_TOKEN: 'test-token-for-testing-only',
      PORT: '3005',
      BASE_URL: 'https://fixed.example.com'
    },
    expectedUrls: {
      health: 'https://fixed.example.com/health',
      mcp: 'https://fixed.example.com/mcp'
    }
  }
];

async function runTest(testCase: TestCase): Promise<void> {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log('Environment:', testCase.env);

  const serverProcess = spawn('node', ['dist/mcp/index.js'], {
    env: { ...process.env, ...testCase.env }
  });

  let serverOutput = '';
  let serverStarted = false;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      serverProcess.kill();
      reject(new Error('Server startup timeout'));
    }, 10000);

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      
      if (output.includes('Press Ctrl+C to stop the server')) {
        serverStarted = true;
        clearTimeout(timeout);
        
        // Give server a moment to fully initialize
        setTimeout(async () => {
          try {
            // Test root endpoint
            const rootUrl = `http://localhost:${testCase.env.PORT}/`;
            const rootResponse = await axios.get(rootUrl, {
              headers: testCase.proxyHeaders || {}
            });
            
            console.log('✅ Root endpoint response:');
            console.log(`   - Endpoints: ${JSON.stringify(rootResponse.data.endpoints, null, 2)}`);
            
            // Test health endpoint
            const healthUrl = `http://localhost:${testCase.env.PORT}/health`;
            const healthResponse = await axios.get(healthUrl);
            console.log(`✅ Health endpoint status: ${healthResponse.data.status}`);
            
            // Test MCP info endpoint
            const mcpUrl = `http://localhost:${testCase.env.PORT}/mcp`;
            const mcpResponse = await axios.get(mcpUrl);
            console.log(`✅ MCP info endpoint: ${mcpResponse.data.description}`);
            
            // Check console output
            if (testCase.expectedUrls) {
              const outputContainsExpectedUrls = 
                serverOutput.includes(testCase.expectedUrls.health) &&
                serverOutput.includes(testCase.expectedUrls.mcp);
              
              if (outputContainsExpectedUrls) {
                console.log('✅ Console output shows expected URLs');
              } else {
                console.log('❌ Console output does not show expected URLs');
                console.log('Expected:', testCase.expectedUrls);
              }
            }
            
            serverProcess.kill();
            resolve();
          } catch (error) {
            console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
            serverProcess.kill();
            reject(error);
          }
        }, 500);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });

    serverProcess.on('close', (code) => {
      if (!serverStarted) {
        reject(new Error(`Server exited with code ${code} before starting`));
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  console.log('🚀 n8n-MCP URL Configuration Test Suite');
  console.log('======================================');
  
  for (const testCase of testCases) {
    try {
      await runTest(testCase);
      console.log('✅ Test passed\n');
    } catch (error) {
      console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
      console.log('\n');
    }
  }
  
  console.log('✨ All tests completed');
}

main().catch(console.error);