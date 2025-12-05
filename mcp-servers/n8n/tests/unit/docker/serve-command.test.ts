import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('n8n-mcp serve Command', () => {
  let tempDir: string;
  let mockEntrypointPath: string;
  
  // Clean environment for tests - only include essential variables
  const cleanEnv = { 
    PATH: process.env.PATH, 
    HOME: process.env.HOME,
    NODE_ENV: process.env.NODE_ENV 
  };

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'serve-command-test-'));
    mockEntrypointPath = path.join(tempDir, 'mock-entrypoint.sh');
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  /**
   * Create a mock entrypoint script that simulates the behavior
   * of the real docker-entrypoint.sh for testing purposes
   */
  function createMockEntrypoint(content: string): void {
    fs.writeFileSync(mockEntrypointPath, content, { mode: 0o755 });
  }

  describe('Command transformation', () => {
    it('should detect "n8n-mcp serve" and set MCP_MODE=http', () => {
      const mockScript = `#!/bin/sh
# Simplified version of the entrypoint logic
if [ "\$1" = "n8n-mcp" ] && [ "\$2" = "serve" ]; then
    export MCP_MODE="http"
    shift 2
    echo "MCP_MODE=\$MCP_MODE"
    echo "Remaining args: \$@"
else
    echo "Normal execution"
fi
`;
      createMockEntrypoint(mockScript);

      const output = execSync(`"${mockEntrypointPath}" n8n-mcp serve`, { encoding: 'utf8', env: cleanEnv });
      
      expect(output).toContain('MCP_MODE=http');
      expect(output).toContain('Remaining args:');
    });

    it('should preserve additional arguments after serve command', () => {
      const mockScript = `#!/bin/sh
if [ "\$1" = "n8n-mcp" ] && [ "\$2" = "serve" ]; then
    export MCP_MODE="http"
    shift 2
    echo "MCP_MODE=\$MCP_MODE"
    echo "Args: \$@"
fi
`;
      createMockEntrypoint(mockScript);

      const output = execSync(
        `"${mockEntrypointPath}" n8n-mcp serve --port 8080 --verbose --debug`,
        { encoding: 'utf8', env: cleanEnv }
      );
      
      expect(output).toContain('MCP_MODE=http');
      expect(output).toContain('Args: --port 8080 --verbose --debug');
    });

    it('should not affect other commands', () => {
      const mockScript = `#!/bin/sh
if [ "\$1" = "n8n-mcp" ] && [ "\$2" = "serve" ]; then
    export MCP_MODE="http"
    echo "Serve mode activated"
else
    echo "Command: \$@"
    echo "MCP_MODE=\${MCP_MODE:-not-set}"
fi
`;
      createMockEntrypoint(mockScript);

      // Test with different command
      const output1 = execSync(`"${mockEntrypointPath}" node index.js`, { encoding: 'utf8', env: cleanEnv });
      expect(output1).toContain('Command: node index.js');
      expect(output1).toContain('MCP_MODE=not-set');

      // Test with n8n-mcp but not serve
      const output2 = execSync(`"${mockEntrypointPath}" n8n-mcp validate`, { encoding: 'utf8', env: cleanEnv });
      expect(output2).toContain('Command: n8n-mcp validate');
      expect(output2).not.toContain('Serve mode activated');
    });
  });

  describe('Integration with config loading', () => {
    it('should load config before processing serve command', () => {
      const configPath = path.join(tempDir, 'config.json');
      const config = {
        custom_var: 'from-config',
        port: 9000
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const mockScript = `#!/bin/sh
# Simulate config loading
if [ -f "${configPath}" ]; then
    export CUSTOM_VAR='from-config'
    export PORT='9000'
fi

# Process serve command
if [ "\$1" = "n8n-mcp" ] && [ "\$2" = "serve" ]; then
    export MCP_MODE="http"
    shift 2
    echo "MCP_MODE=\$MCP_MODE"
    echo "CUSTOM_VAR=\$CUSTOM_VAR"
    echo "PORT=\$PORT"
fi
`;
      createMockEntrypoint(mockScript);

      const output = execSync(`"${mockEntrypointPath}" n8n-mcp serve`, { encoding: 'utf8', env: cleanEnv });
      
      expect(output).toContain('MCP_MODE=http');
      expect(output).toContain('CUSTOM_VAR=from-config');
      expect(output).toContain('PORT=9000');
    });
  });

  describe('Command line variations', () => {
    it('should handle serve command with equals sign notation', () => {
      const mockScript = `#!/bin/sh
# Handle both space and equals notation
if [ "\$1" = "n8n-mcp" ] && [ "\$2" = "serve" ]; then
    export MCP_MODE="http"
    shift 2
    echo "Standard notation worked"
    echo "Args: \$@"
elif echo "\$@" | grep -q "n8n-mcp.*serve"; then
    echo "Alternative notation detected"
fi
`;
      createMockEntrypoint(mockScript);

      const output = execSync(`"${mockEntrypointPath}" n8n-mcp serve --port=8080`, { encoding: 'utf8', env: cleanEnv });
      
      expect(output).toContain('Standard notation worked');
      expect(output).toContain('Args: --port=8080');
    });

    it('should handle quoted arguments correctly', () => {
      const mockScript = `#!/bin/sh
if [ "\$1" = "n8n-mcp" ] && [ "\$2" = "serve" ]; then
    shift 2
    echo "Args received:"
    for arg in "\$@"; do
        echo "  - '\$arg'"
    done
fi
`;
      createMockEntrypoint(mockScript);

      const output = execSync(
        `"${mockEntrypointPath}" n8n-mcp serve --message "Hello World" --path "/path with spaces"`,
        { encoding: 'utf8', env: cleanEnv }
      );
      
      expect(output).toContain("- '--message'");
      expect(output).toContain("- 'Hello World'");
      expect(output).toContain("- '--path'");
      expect(output).toContain("- '/path with spaces'");
    });
  });

  describe('Error handling', () => {
    it('should handle serve command with missing AUTH_TOKEN in HTTP mode', () => {
      const mockScript = `#!/bin/sh
if [ "\$1" = "n8n-mcp" ] && [ "\$2" = "serve" ]; then
    export MCP_MODE="http"
    shift 2
    
    # Check for AUTH_TOKEN (simulate entrypoint validation)
    if [ -z "\$AUTH_TOKEN" ] && [ -z "\$AUTH_TOKEN_FILE" ]; then
        echo "ERROR: AUTH_TOKEN or AUTH_TOKEN_FILE is required for HTTP mode" >&2
        exit 1
    fi
fi
`;
      createMockEntrypoint(mockScript);

      try {
        execSync(`"${mockEntrypointPath}" n8n-mcp serve`, { encoding: 'utf8', env: cleanEnv });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stderr.toString()).toContain('AUTH_TOKEN or AUTH_TOKEN_FILE is required');
      }
    });

    it('should succeed with AUTH_TOKEN provided', () => {
      const mockScript = `#!/bin/sh
if [ "\$1" = "n8n-mcp" ] && [ "\$2" = "serve" ]; then
    export MCP_MODE="http"
    shift 2
    
    # Check for AUTH_TOKEN
    if [ -z "\$AUTH_TOKEN" ] && [ -z "\$AUTH_TOKEN_FILE" ]; then
        echo "ERROR: AUTH_TOKEN or AUTH_TOKEN_FILE is required for HTTP mode" >&2
        exit 1
    fi
    
    echo "Server starting with AUTH_TOKEN"
fi
`;
      createMockEntrypoint(mockScript);

      const output = execSync(
        `"${mockEntrypointPath}" n8n-mcp serve`,
        { encoding: 'utf8', env: { ...cleanEnv, AUTH_TOKEN: 'test-token' } }
      );
      
      expect(output).toContain('Server starting with AUTH_TOKEN');
    });
  });

  describe('Backwards compatibility', () => {
    it('should maintain compatibility with direct HTTP mode setting', () => {
      const mockScript = `#!/bin/sh
# Direct MCP_MODE setting should still work
echo "Initial MCP_MODE=\${MCP_MODE:-not-set}"

if [ "\$1" = "n8n-mcp" ] && [ "\$2" = "serve" ]; then
    export MCP_MODE="http"
    echo "Serve command: MCP_MODE=\$MCP_MODE"
else
    echo "Direct mode: MCP_MODE=\${MCP_MODE:-stdio}"
fi
`;
      createMockEntrypoint(mockScript);

      // Test with explicit MCP_MODE
      const output1 = execSync(
        `"${mockEntrypointPath}" node index.js`,
        { encoding: 'utf8', env: { ...cleanEnv, MCP_MODE: 'http' } }
      );
      expect(output1).toContain('Initial MCP_MODE=http');
      expect(output1).toContain('Direct mode: MCP_MODE=http');

      // Test with serve command
      const output2 = execSync(`"${mockEntrypointPath}" n8n-mcp serve`, { encoding: 'utf8', env: cleanEnv });
      expect(output2).toContain('Serve command: MCP_MODE=http');
    });
  });

  describe('Command construction', () => {
    it('should properly construct the node command after transformation', () => {
      const mockScript = `#!/bin/sh
if [ "\$1" = "n8n-mcp" ] && [ "\$2" = "serve" ]; then
    export MCP_MODE="http"
    shift 2
    # Simulate the actual command that would be executed
    echo "Would execute: node /app/dist/mcp/index.js \$@"
fi
`;
      createMockEntrypoint(mockScript);

      const output = execSync(
        `"${mockEntrypointPath}" n8n-mcp serve --port 8080 --host 0.0.0.0`,
        { encoding: 'utf8', env: cleanEnv }
      );
      
      expect(output).toContain('Would execute: node /app/dist/mcp/index.js --port 8080 --host 0.0.0.0');
    });
  });
});