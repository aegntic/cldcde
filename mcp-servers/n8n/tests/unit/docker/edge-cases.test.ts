import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('Docker Config Edge Cases', () => {
  let tempDir: string;
  let configPath: string;
  const parseConfigPath = path.resolve(__dirname, '../../../docker/parse-config.js');

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cases-test-'));
    configPath = path.join(tempDir, 'config.json');
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('Data type edge cases', () => {
    it('should handle JavaScript number edge cases', () => {
      // Note: JSON.stringify converts Infinity/-Infinity/NaN to null
      // So we need to test with a pre-stringified JSON that would have these values
      const configJson = `{
        "max_safe_int": ${Number.MAX_SAFE_INTEGER},
        "min_safe_int": ${Number.MIN_SAFE_INTEGER},
        "positive_zero": 0,
        "negative_zero": -0,
        "very_small": 1e-308,
        "very_large": 1e308,
        "float_precision": 0.30000000000000004
      }`;
      fs.writeFileSync(configPath, configJson);

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { encoding: 'utf8' });
      
      expect(output).toContain(`export MAX_SAFE_INT='${Number.MAX_SAFE_INTEGER}'`);
      expect(output).toContain(`export MIN_SAFE_INT='${Number.MIN_SAFE_INTEGER}'`);
      expect(output).toContain("export POSITIVE_ZERO='0'");
      expect(output).toContain("export NEGATIVE_ZERO='0'"); // -0 becomes 0 in JSON
      expect(output).toContain("export VERY_SMALL='1e-308'");
      expect(output).toContain("export VERY_LARGE='1e+308'");
      expect(output).toContain("export FLOAT_PRECISION='0.30000000000000004'");
      
      // Test null values (what Infinity/NaN become in JSON)
      const configWithNull = { test_null: null, test_array: [1, 2], test_undefined: undefined };
      fs.writeFileSync(configPath, JSON.stringify(configWithNull));
      const output2 = execSync(`node "${parseConfigPath}" "${configPath}"`, { encoding: 'utf8' });
      // null values and arrays are skipped
      expect(output2).toBe('');
    });

    it('should handle unusual but valid JSON structures', () => {
      const config = {
        "": "empty key",
        "123": "numeric key",
        "true": "boolean key",
        "null": "null key",
        "undefined": "undefined key",
        "[object Object]": "object string key",
        "key\nwith\nnewlines": "multiline key",
        "key\twith\ttabs": "tab key",
        "🔑": "emoji key",
        "ключ": "cyrillic key",
        "キー": "japanese key",
        "مفتاح": "arabic key"
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { encoding: 'utf8' });
      
      // Empty key is skipped (becomes EMPTY_KEY and then filtered out)
      expect(output).not.toContain("empty key");
      
      // Numeric key gets prefixed with underscore
      expect(output).toContain("export _123='numeric key'");
      
      // Other keys are transformed
      expect(output).toContain("export TRUE='boolean key'");
      expect(output).toContain("export NULL='null key'");
      expect(output).toContain("export UNDEFINED='undefined key'");
      expect(output).toContain("export OBJECT_OBJECT='object string key'");
      expect(output).toContain("export KEY_WITH_NEWLINES='multiline key'");
      expect(output).toContain("export KEY_WITH_TABS='tab key'");
      
      // Non-ASCII characters are replaced with underscores
      // But if the result is empty after sanitization, they're skipped
      const lines = output.trim().split('\n');
      // emoji, cyrillic, japanese, arabic keys all become empty after sanitization and are skipped
      expect(lines.length).toBe(7); // Only the ASCII-based keys remain
    });

    it('should handle circular reference prevention in nested configs', () => {
      // Create a config that would have circular references if not handled properly
      const config = {
        level1: {
          level2: {
            level3: {
              circular_ref: "This would reference level1 in a real circular structure"
            }
          },
          sibling: {
            ref_to_level2: "Reference to sibling"
          }
        }
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { encoding: 'utf8' });
      
      expect(output).toContain("export LEVEL1_LEVEL2_LEVEL3_CIRCULAR_REF='This would reference level1 in a real circular structure'");
      expect(output).toContain("export LEVEL1_SIBLING_REF_TO_LEVEL2='Reference to sibling'");
    });
  });

  describe('File system edge cases', () => {
    it('should handle permission errors gracefully', () => {
      if (process.platform === 'win32') {
        // Skip on Windows as permission handling is different
        return;
      }

      // Create a file with no read permissions
      fs.writeFileSync(configPath, '{"test": "value"}');
      fs.chmodSync(configPath, 0o000);

      try {
        const output = execSync(`node "${parseConfigPath}" "${configPath}" 2>&1`, { encoding: 'utf8' });
        // Should exit silently even with permission error
        expect(output).toBe('');
      } finally {
        // Restore permissions for cleanup
        fs.chmodSync(configPath, 0o644);
      }
    });

    it('should handle symlinks correctly', () => {
      const actualConfig = path.join(tempDir, 'actual-config.json');
      const symlinkPath = path.join(tempDir, 'symlink-config.json');
      
      fs.writeFileSync(actualConfig, '{"symlink_test": "value"}');
      fs.symlinkSync(actualConfig, symlinkPath);

      const output = execSync(`node "${parseConfigPath}" "${symlinkPath}"`, { encoding: 'utf8' });
      
      expect(output).toContain("export SYMLINK_TEST='value'");
    });

    it('should handle very large config files', () => {
      // Create a large config with many keys
      const largeConfig: Record<string, any> = {};
      for (let i = 0; i < 10000; i++) {
        largeConfig[`key_${i}`] = `value_${i}`;
      }
      fs.writeFileSync(configPath, JSON.stringify(largeConfig));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { encoding: 'utf8' });
      
      const lines = output.trim().split('\n');
      expect(lines.length).toBe(10000);
      expect(output).toContain("export KEY_0='value_0'");
      expect(output).toContain("export KEY_9999='value_9999'");
    });
  });

  describe('JSON parsing edge cases', () => {
    it('should handle various invalid JSON formats', () => {
      const invalidJsonCases = [
        '{invalid}', // Missing quotes
        "{'single': 'quotes'}", // Single quotes
        '{test: value}', // Unquoted keys
        '{"test": undefined}', // Undefined value
        '{"test": function() {}}', // Function
        '{,}', // Invalid structure
        '{"a": 1,}', // Trailing comma
        'null', // Just null
        'true', // Just boolean
        '"string"', // Just string
        '123', // Just number
        '[]', // Empty array
        '[1, 2, 3]', // Array
      ];

      invalidJsonCases.forEach(invalidJson => {
        fs.writeFileSync(configPath, invalidJson);
        const output = execSync(`node "${parseConfigPath}" "${configPath}" 2>&1`, { encoding: 'utf8' });
        // Should exit silently on invalid JSON
        expect(output).toBe('');
      });
    });

    it('should handle Unicode edge cases in JSON', () => {
      const config = {
        // Various Unicode scenarios
        zero_width: "test\u200B\u200C\u200Dtest", // Zero-width characters
        bom: "\uFEFFtest", // Byte order mark
        surrogate_pair: "𝕳𝖊𝖑𝖑𝖔", // Mathematical bold text
        rtl_text: "مرحبا mixed עברית", // Right-to-left text
        combining: "é" + "é", // Combining vs precomposed
        control_chars: "test\u0001\u0002\u0003test",
        emoji_zwj: "👨‍👩‍👧‍👦", // Family emoji with ZWJ
        invalid_surrogate: "test\uD800test", // Invalid surrogate
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { encoding: 'utf8' });
      
      // All Unicode should be preserved in values
      expect(output).toContain("export ZERO_WIDTH='test\u200B\u200C\u200Dtest'");
      expect(output).toContain("export BOM='\uFEFFtest'");
      expect(output).toContain("export SURROGATE_PAIR='𝕳𝖊𝖑𝖑𝖔'");
      expect(output).toContain("export RTL_TEXT='مرحبا mixed עברית'");
      expect(output).toContain("export COMBINING='éé'");
      expect(output).toContain("export CONTROL_CHARS='test\u0001\u0002\u0003test'");
      expect(output).toContain("export EMOJI_ZWJ='👨‍👩‍👧‍👦'");
      // Invalid surrogate gets replaced with replacement character
      expect(output).toContain("export INVALID_SURROGATE='test�test'");
    });
  });

  describe('Environment variable edge cases', () => {
    it('should handle environment variable name transformations', () => {
      const config = {
        "lowercase": "value",
        "UPPERCASE": "value",
        "camelCase": "value",
        "PascalCase": "value",
        "snake_case": "value",
        "kebab-case": "value",
        "dot.notation": "value",
        "space separated": "value",
        "special!@#$%^&*()": "value",
        "123starting-with-number": "value",
        "ending-with-number123": "value",
        "-starting-with-dash": "value",
        "_starting_with_underscore": "value"
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { encoding: 'utf8' });
      
      // Check transformations
      expect(output).toContain("export LOWERCASE='value'");
      expect(output).toContain("export UPPERCASE='value'");
      expect(output).toContain("export CAMELCASE='value'");
      expect(output).toContain("export PASCALCASE='value'");
      expect(output).toContain("export SNAKE_CASE='value'");
      expect(output).toContain("export KEBAB_CASE='value'");
      expect(output).toContain("export DOT_NOTATION='value'");
      expect(output).toContain("export SPACE_SEPARATED='value'");
      expect(output).toContain("export SPECIAL='value'"); // special chars removed
      expect(output).toContain("export _123STARTING_WITH_NUMBER='value'"); // prefixed
      expect(output).toContain("export ENDING_WITH_NUMBER123='value'");
      expect(output).toContain("export STARTING_WITH_DASH='value'"); // dash removed
      expect(output).toContain("export STARTING_WITH_UNDERSCORE='value'"); // Leading underscore is trimmed
    });

    it('should handle conflicting keys after transformation', () => {
      const config = {
        "test_key": "underscore",
        "test-key": "dash",
        "test.key": "dot",
        "test key": "space",
        "TEST_KEY": "uppercase",
        nested: {
          "test_key": "nested_underscore"
        }
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { encoding: 'utf8' });
      
      // All should be transformed to TEST_KEY
      const lines = output.trim().split('\n');
      const testKeyLines = lines.filter(line => line.includes("TEST_KEY='"));
      
      // Script outputs all unique TEST_KEY values it encounters
      // The parser processes keys in order, outputting each unique var name once
      expect(testKeyLines.length).toBeGreaterThanOrEqual(1);
      
      // Nested one has different prefix
      expect(output).toContain("export NESTED_TEST_KEY='nested_underscore'");
    });
  });

  describe('Performance edge cases', () => {
    it('should handle extremely deep nesting efficiently', () => {
      // Create very deep nesting (script allows up to depth 10, which is 11 levels)
      const createDeepNested = (depth: number, value: any = "deep_value"): any => {
        if (depth === 0) return value;
        return { nested: createDeepNested(depth - 1, value) };
      };

      // Create nested object with exactly 10 levels
      const config = createDeepNested(10);
      fs.writeFileSync(configPath, JSON.stringify(config));

      const start = Date.now();
      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { encoding: 'utf8' });
      const duration = Date.now() - start;

      // Should complete in reasonable time even with deep nesting
      expect(duration).toBeLessThan(1000); // Less than 1 second
      
      // Should produce the deeply nested key with 10 levels
      const expectedKey = Array(10).fill('NESTED').join('_');
      expect(output).toContain(`export ${expectedKey}='deep_value'`);
      
      // Test that 11 levels also works (script allows up to depth 10 = 11 levels)
      const deepConfig = createDeepNested(11);
      fs.writeFileSync(configPath, JSON.stringify(deepConfig));
      const output2 = execSync(`node "${parseConfigPath}" "${configPath}"`, { encoding: 'utf8' });
      const elevenLevelKey = Array(11).fill('NESTED').join('_');
      expect(output2).toContain(`export ${elevenLevelKey}='deep_value'`); // 11 levels present
      
      // Test that 12 levels gets completely blocked (beyond depth limit)
      const veryDeepConfig = createDeepNested(12);
      fs.writeFileSync(configPath, JSON.stringify(veryDeepConfig));
      const output3 = execSync(`node "${parseConfigPath}" "${configPath}"`, { encoding: 'utf8' });
      // With 12 levels, recursion limit is exceeded and no output is produced
      expect(output3).toBe(''); // No output at all
    });

    it('should handle wide objects efficiently', () => {
      // Create object with many keys at same level
      const config: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        config[`key_${i}`] = {
          nested_a: `value_a_${i}`,
          nested_b: `value_b_${i}`,
          nested_c: {
            deep: `deep_${i}`
          }
        };
      }
      fs.writeFileSync(configPath, JSON.stringify(config));

      const start = Date.now();
      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { encoding: 'utf8' });
      const duration = Date.now() - start;

      // Should complete efficiently
      expect(duration).toBeLessThan(2000); // Less than 2 seconds
      
      const lines = output.trim().split('\n');
      expect(lines.length).toBe(3000); // 3 values per key × 1000 keys (nested_c.deep is flattened)
      
      // Verify format
      expect(output).toContain("export KEY_0_NESTED_A='value_a_0'");
      expect(output).toContain("export KEY_999_NESTED_C_DEEP='deep_999'");
    });
  });

  describe('Mixed content edge cases', () => {
    it('should handle mixed valid and invalid content', () => {
      const config = {
        valid_string: "normal value",
        valid_number: 42,
        valid_bool: true,
        invalid_undefined: undefined,
        invalid_function: null, // Would be a function but JSON.stringify converts to null
        invalid_symbol: null, // Would be a Symbol but JSON.stringify converts to null
        valid_nested: {
          inner_valid: "works",
          inner_array: ["ignored", "array"],
          inner_null: null
        }
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { encoding: 'utf8' });
      
      // Only valid values should be exported
      expect(output).toContain("export VALID_STRING='normal value'");
      expect(output).toContain("export VALID_NUMBER='42'");
      expect(output).toContain("export VALID_BOOL='true'");
      expect(output).toContain("export VALID_NESTED_INNER_VALID='works'");
      
      // null values, undefined (becomes undefined in JSON), and arrays are not exported
      expect(output).not.toContain('INVALID_UNDEFINED');
      expect(output).not.toContain('INVALID_FUNCTION');
      expect(output).not.toContain('INVALID_SYMBOL');
      expect(output).not.toContain('INNER_ARRAY');
      expect(output).not.toContain('INNER_NULL');
    });
  });

  describe('Real-world configuration scenarios', () => {
    it('should handle typical n8n-mcp configuration', () => {
      const config = {
        mcp_mode: "http",
        auth_token: "bearer-token-123",
        server: {
          host: "0.0.0.0",
          port: 3000,
          cors: {
            enabled: true,
            origins: ["http://localhost:3000", "https://app.example.com"]
          }
        },
        database: {
          node_db_path: "/data/nodes.db",
          template_cache_size: 100
        },
        logging: {
          level: "info",
          format: "json",
          disable_console_output: false
        },
        features: {
          enable_templates: true,
          enable_validation: true,
          validation_profile: "ai-friendly"
        }
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      // Run with a clean set of environment variables to avoid conflicts
      // We need to preserve PATH so node can be found
      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: { PATH: process.env.PATH, NODE_ENV: 'test' } // Only include PATH and NODE_ENV
      });
      
      // Verify all configuration is properly exported with export prefix
      expect(output).toContain("export MCP_MODE='http'");
      expect(output).toContain("export AUTH_TOKEN='bearer-token-123'");
      expect(output).toContain("export SERVER_HOST='0.0.0.0'");
      expect(output).toContain("export SERVER_PORT='3000'");
      expect(output).toContain("export SERVER_CORS_ENABLED='true'");
      expect(output).toContain("export DATABASE_NODE_DB_PATH='/data/nodes.db'");
      expect(output).toContain("export DATABASE_TEMPLATE_CACHE_SIZE='100'");
      expect(output).toContain("export LOGGING_LEVEL='info'");
      expect(output).toContain("export LOGGING_FORMAT='json'");
      expect(output).toContain("export LOGGING_DISABLE_CONSOLE_OUTPUT='false'");
      expect(output).toContain("export FEATURES_ENABLE_TEMPLATES='true'");
      expect(output).toContain("export FEATURES_ENABLE_VALIDATION='true'");
      expect(output).toContain("export FEATURES_VALIDATION_PROFILE='ai-friendly'");
      
      // Arrays should be ignored
      expect(output).not.toContain('ORIGINS');
    });
  });
});