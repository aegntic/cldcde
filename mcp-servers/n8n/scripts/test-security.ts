#!/usr/bin/env node
import axios from 'axios';
import { spawn } from 'child_process';

async function testMaliciousHeaders() {
  console.log('🔒 Testing Security Fixes...\n');
  
  // Start server with TRUST_PROXY enabled
  const serverProcess = spawn('node', ['dist/mcp/index.js'], {
    env: {
      ...process.env,
      MCP_MODE: 'http',
      AUTH_TOKEN: 'test-security-token-32-characters-long',
      PORT: '3999',
      TRUST_PROXY: '1'
    }
  });

  // Wait for server to start
  await new Promise(resolve => {
    serverProcess.stdout.on('data', (data) => {
      if (data.toString().includes('Press Ctrl+C to stop')) {
        resolve(undefined);
      }
    });
  });

  const testCases = [
    {
      name: 'Valid proxy headers',
      headers: {
        'X-Forwarded-Host': 'example.com',
        'X-Forwarded-Proto': 'https'
      }
    },
    {
      name: 'Malicious host header (with path)',
      headers: {
        'X-Forwarded-Host': 'evil.com/path/to/evil',
        'X-Forwarded-Proto': 'https'
      }
    },
    {
      name: 'Malicious host header (with @)',
      headers: {
        'X-Forwarded-Host': 'user@evil.com',
        'X-Forwarded-Proto': 'https'
      }
    },
    {
      name: 'Invalid hostname (multiple dots)',
      headers: {
        'X-Forwarded-Host': '.....',
        'X-Forwarded-Proto': 'https'
      }
    },
    {
      name: 'IPv6 address',
      headers: {
        'X-Forwarded-Host': '[::1]:3000',
        'X-Forwarded-Proto': 'https'
      }
    }
  ];

  for (const testCase of testCases) {
    try {
      const response = await axios.get('http://localhost:3999/', {
        headers: testCase.headers,
        timeout: 2000
      });
      
      const endpoints = response.data.endpoints;
      const healthUrl = endpoints?.health?.url || 'N/A';
      
      console.log(`✅ ${testCase.name}`);
      console.log(`   Response: ${healthUrl}`);
      
      // Check if malicious headers were blocked
      if (testCase.name.includes('Malicious') || testCase.name.includes('Invalid')) {
        if (healthUrl.includes('evil.com') || healthUrl.includes('@') || healthUrl.includes('.....')) {
          console.log('   ❌ SECURITY ISSUE: Malicious header was not blocked!');
        } else {
          console.log('   ✅ Malicious header was blocked');
        }
      }
    } catch (error) {
      console.log(`❌ ${testCase.name} - Request failed`);
    }
    console.log('');
  }

  serverProcess.kill();
}

testMaliciousHeaders().catch(console.error);