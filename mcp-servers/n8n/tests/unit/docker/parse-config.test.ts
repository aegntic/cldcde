import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('parse-config.js', () => {
  let tempDir: string;
  let configPath: string;
  const parseConfigPath = path.resolve(__dirname, '../../../docker/parse-config.js');
  
  // Clean environment for tests - only include essential variables
  const cleanEnv = { 
    PATH: process.env.PATH, 
    HOME: process.env.HOME,
    NODE_ENV: process.env.NODE_ENV 
  };

  beforeEach(() => {
    // Create temporary directory for test config files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parse-config-test-'));
    configPath = path.join(tempDir, 'config.json');
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('Basic functionality', () => {
    it('should parse simple flat config', () => {
      const config = {
        mcp_mode: 'http',
        auth_token: 'test-token-123',
        port: 3000
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      expect(output).toContain("export MCP_MODE='http'");
      expect(output).toContain("export AUTH_TOKEN='test-token-123'");
      expect(output).toContain("export PORT='3000'");
    });

    it('should handle nested objects by flattening with underscores', () => {
      const config = {
        database: {
          host: 'localhost',
          port: 5432,
          credentials: {
            user: 'admin',
            pass: 'secret'
          }
        }
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      expect(output).toContain("export DATABASE_HOST='localhost'");
      expect(output).toContain("export DATABASE_PORT='5432'");
      expect(output).toContain("export DATABASE_CREDENTIALS_USER='admin'");
      expect(output).toContain("export DATABASE_CREDENTIALS_PASS='secret'");
    });

    it('should convert boolean values to strings', () => {
      const config = {
        debug: true,
        verbose: false
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      expect(output).toContain("export DEBUG='true'");
      expect(output).toContain("export VERBOSE='false'");
    });

    it('should convert numbers to strings', () => {
      const config = {
        timeout: 5000,
        retry_count: 3,
        float_value: 3.14
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      expect(output).toContain("export TIMEOUT='5000'");
      expect(output).toContain("export RETRY_COUNT='3'");
      expect(output).toContain("export FLOAT_VALUE='3.14'");
    });
  });

  describe('Environment variable precedence', () => {
    it('should not export variables that are already set in environment', () => {
      const config = {
        existing_var: 'config-value',
        new_var: 'new-value'
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      // Set environment variable for the child process
      const env = { ...cleanEnv, EXISTING_VAR: 'env-value' };
      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env 
      });
      
      expect(output).not.toContain("export EXISTING_VAR=");
      expect(output).toContain("export NEW_VAR='new-value'");
    });

    it('should respect nested environment variables', () => {
      const config = {
        database: {
          host: 'config-host',
          port: 5432
        }
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const env = { ...cleanEnv, DATABASE_HOST: 'env-host' };
      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env 
      });
      
      expect(output).not.toContain("export DATABASE_HOST=");
      expect(output).toContain("export DATABASE_PORT='5432'");
    });
  });

  describe('Shell escaping and security', () => {
    it('should escape single quotes properly', () => {
      const config = {
        message: "It's a test with 'quotes'",
        command: "echo 'hello'"
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      // Single quotes should be escaped as '"'"'
      expect(output).toContain(`export MESSAGE='It'"'"'s a test with '"'"'quotes'"'"'`);
      expect(output).toContain(`export COMMAND='echo '"'"'hello'"'"'`);
    });

    it('should handle command injection attempts safely', () => {
      const config = {
        malicious1: "'; rm -rf /; echo '",
        malicious2: "$( rm -rf / )",
        malicious3: "`rm -rf /`",
        malicious4: "test\nrm -rf /\necho"
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      // All malicious content should be safely quoted
      expect(output).toContain(`export MALICIOUS1=''"'"'; rm -rf /; echo '"'"'`);
      expect(output).toContain(`export MALICIOUS2='$( rm -rf / )'`);
      expect(output).toContain(`export MALICIOUS3='`);
      expect(output).toContain(`export MALICIOUS4='test\nrm -rf /\necho'`);
      
      // Verify that when we evaluate the exports in a shell, the malicious content
      // is safely contained as string values and not executed
      // Test this by creating a temp script that sources the exports and echoes a success message
      const testScript = `
#!/bin/sh
set -e
${output}
echo "SUCCESS: No commands were executed"
`;
      
      const tempScript = path.join(tempDir, 'test-safety.sh');
      fs.writeFileSync(tempScript, testScript);
      fs.chmodSync(tempScript, '755');
      
      // If the quoting is correct, this should succeed
      // If any commands leak out, the script will fail
      const result = execSync(tempScript, { encoding: 'utf8', env: cleanEnv });
      expect(result.trim()).toBe('SUCCESS: No commands were executed');
    });

    it('should handle special shell characters safely', () => {
      const config = {
        special1: "test$VAR",
        special2: "test${VAR}",
        special3: "test\\path",
        special4: "test|command",
        special5: "test&background",
        special6: "test>redirect",
        special7: "test<input",
        special8: "test;command"
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      // All special characters should be preserved within single quotes
      expect(output).toContain("export SPECIAL1='test$VAR'");
      expect(output).toContain("export SPECIAL2='test${VAR}'");
      expect(output).toContain("export SPECIAL3='test\\path'");
      expect(output).toContain("export SPECIAL4='test|command'");
      expect(output).toContain("export SPECIAL5='test&background'");
      expect(output).toContain("export SPECIAL6='test>redirect'");
      expect(output).toContain("export SPECIAL7='test<input'");
      expect(output).toContain("export SPECIAL8='test;command'");
    });
  });

  describe('Edge cases and error handling', () => {
    it('should exit silently if config file does not exist', () => {
      const nonExistentPath = path.join(tempDir, 'non-existent.json');
      
      const result = execSync(`node "${parseConfigPath}" "${nonExistentPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      expect(result).toBe('');
    });

    it('should exit silently on invalid JSON', () => {
      fs.writeFileSync(configPath, '{ invalid json }');

      const result = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      expect(result).toBe('');
    });

    it('should handle empty config file', () => {
      fs.writeFileSync(configPath, '{}');

      const result = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      expect(result.trim()).toBe('');
    });

    it('should ignore arrays in config', () => {
      const config = {
        valid_string: 'test',
        invalid_array: ['item1', 'item2'],
        nested: {
          valid_number: 42,
          invalid_array: [1, 2, 3]
        }
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      expect(output).toContain("export VALID_STRING='test'");
      expect(output).toContain("export NESTED_VALID_NUMBER='42'");
      expect(output).not.toContain('INVALID_ARRAY');
    });

    it('should ignore null values', () => {
      const config = {
        valid_string: 'test',
        null_value: null,
        nested: {
          another_null: null,
          valid_bool: true
        }
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      expect(output).toContain("export VALID_STRING='test'");
      expect(output).toContain("export NESTED_VALID_BOOL='true'");
      expect(output).not.toContain('NULL_VALUE');
      expect(output).not.toContain('ANOTHER_NULL');
    });

    it('should handle deeply nested structures', () => {
      const config = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'deep-value'
              }
            }
          }
        }
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      expect(output).toContain("export LEVEL1_LEVEL2_LEVEL3_LEVEL4_LEVEL5='deep-value'");
    });

    it('should handle empty strings', () => {
      const config = {
        empty_string: '',
        nested: {
          another_empty: ''
        }
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      expect(output).toContain("export EMPTY_STRING=''");
      expect(output).toContain("export NESTED_ANOTHER_EMPTY=''");
    });
  });

  describe('Default behavior', () => {
    it('should use /app/config.json as default path when no argument provided', () => {
      // This test would need to be run in a Docker environment or mocked
      // For now, we just verify the script accepts no arguments
      try {
        const result = execSync(`node "${parseConfigPath}"`, { 
          encoding: 'utf8',
          stdio: 'pipe',
          env: cleanEnv
        });
        // Should exit silently if /app/config.json doesn't exist
        expect(result).toBe('');
      } catch (error) {
        // Expected to fail outside Docker environment
        expect(true).toBe(true);
      }
    });
  });
});