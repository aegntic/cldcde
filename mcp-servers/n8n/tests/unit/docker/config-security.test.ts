import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('Config File Security Tests', () => {
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
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-security-test-'));
    configPath = path.join(tempDir, 'config.json');
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('Command injection prevention', () => {
    it('should prevent basic command injection attempts', () => {
      const maliciousConfigs = [
        { cmd: "'; echo 'hacked' > /tmp/hacked.txt; '" },
        { cmd: '"; echo "hacked" > /tmp/hacked.txt; "' },
        { cmd: '`echo hacked > /tmp/hacked.txt`' },
        { cmd: '$(echo hacked > /tmp/hacked.txt)' },
        { cmd: '| echo hacked > /tmp/hacked.txt' },
        { cmd: '|| echo hacked > /tmp/hacked.txt' },
        { cmd: '& echo hacked > /tmp/hacked.txt' },
        { cmd: '&& echo hacked > /tmp/hacked.txt' },
        { cmd: '; echo hacked > /tmp/hacked.txt' },
        { cmd: '\n echo hacked > /tmp/hacked.txt \n' },
        { cmd: '\r\n echo hacked > /tmp/hacked.txt \r\n' }
      ];

      maliciousConfigs.forEach((config, index) => {
        fs.writeFileSync(configPath, JSON.stringify(config));
        const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
          encoding: 'utf8',
          env: cleanEnv
        });
        
        // The output should safely quote the malicious content
        expect(output).toContain("export CMD='");
        
        // Verify that the output contains a properly quoted export
        expect(output).toContain("export CMD='");
        
        // Create a test script to verify safety
        const testScript = `#!/bin/sh
set -e
${output}
# If command injection worked, this would fail
test -f /tmp/hacked.txt && exit 1
echo "SUCCESS: No injection occurred"
`;
        
        const tempScript = path.join(tempDir, `test-injection-${index}.sh`);
        fs.writeFileSync(tempScript, testScript);
        fs.chmodSync(tempScript, '755');
        
        const result = execSync(tempScript, { encoding: 'utf8', env: cleanEnv });
        expect(result.trim()).toBe('SUCCESS: No injection occurred');
        
        // Double-check no files were created
        expect(fs.existsSync('/tmp/hacked.txt')).toBe(false);
      });
    });

    it('should handle complex nested injection attempts', () => {
      const config = {
        database: {
          host: "localhost'; DROP TABLE users; --",
          port: 5432,
          credentials: {
            password: "$( cat /etc/passwd )",
            backup_cmd: "`rm -rf /`"
          }
        },
        scripts: {
          init: "#!/bin/bash\nrm -rf /\nexit 0"
        }
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      // All values should be safely quoted
      expect(output).toContain("DATABASE_HOST='localhost'\"'\"'; DROP TABLE users; --'");
      expect(output).toContain("DATABASE_CREDENTIALS_PASSWORD='$( cat /etc/passwd )'");
      expect(output).toContain("DATABASE_CREDENTIALS_BACKUP_CMD='`rm -rf /`'");
      expect(output).toContain("SCRIPTS_INIT='#!/bin/bash\nrm -rf /\nexit 0'");
    });

    it('should handle Unicode and special characters safely', () => {
      const config = {
        unicode: "Hello 世界 🌍",
        emoji: "🚀 Deploy! 🎉",
        special: "Line1\nLine2\tTab\rCarriage",
        quotes_mix: `It's a "test" with 'various' quotes`,
        backslash: "C:\\Users\\test\\path",
        regex: "^[a-zA-Z0-9]+$",
        json_string: '{"key": "value"}',
        xml_string: '<tag attr="value">content</tag>',
        sql_injection: "1' OR '1'='1",
        null_byte: "test\x00null",
        escape_sequences: "test\\n\\r\\t\\b\\f"
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      // All special characters should be preserved within quotes
      expect(output).toContain("UNICODE='Hello 世界 🌍'");
      expect(output).toContain("EMOJI='🚀 Deploy! 🎉'");
      expect(output).toContain("SPECIAL='Line1\nLine2\tTab\rCarriage'");
      expect(output).toContain("BACKSLASH='C:\\Users\\test\\path'");
      expect(output).toContain("REGEX='^[a-zA-Z0-9]+$'");
      expect(output).toContain("SQL_INJECTION='1'\"'\"' OR '\"'\"'1'\"'\"'='\"'\"'1'");
    });
  });

  describe('Shell metacharacter handling', () => {
    it('should safely handle all shell metacharacters', () => {
      const config = {
        dollar: "$HOME $USER ${PATH}",
        backtick: "`date` `whoami`",
        parentheses: "$(date) $(whoami)",
        semicolon: "cmd1; cmd2; cmd3",
        ampersand: "cmd1 & cmd2 && cmd3",
        pipe: "cmd1 | cmd2 || cmd3",
        redirect: "cmd > file < input >> append",
        glob: "*.txt ?.log [a-z]*",
        tilde: "~/home ~/.config",
        exclamation: "!history !!",
        question: "file? test?",
        asterisk: "*.* *",
        brackets: "[abc] [0-9]",
        braces: "{a,b,c} ${var}",
        caret: "^pattern^replacement^",
        hash: "#comment # another",
        at: "@variable @{array}"
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      // Verify all metacharacters are safely quoted
      const lines = output.trim().split('\n');
      lines.forEach(line => {
        // Each line should be in the format: export KEY='value'
        expect(line).toMatch(/^export [A-Z_]+='.*'$/);
      });
      
      // Test that the values are safe when evaluated
      const testScript = `
#!/bin/sh
set -e
${output}
# If any metacharacters were unescaped, these would fail
test "\$DOLLAR" = '\$HOME \$USER \${PATH}'
test "\$BACKTICK" = '\`date\` \`whoami\`'
test "\$PARENTHESES" = '\$(date) \$(whoami)'
test "\$SEMICOLON" = 'cmd1; cmd2; cmd3'
test "\$PIPE" = 'cmd1 | cmd2 || cmd3'
echo "SUCCESS: All metacharacters safely contained"
`;
      
      const tempScript = path.join(tempDir, 'test-metachar.sh');
      fs.writeFileSync(tempScript, testScript);
      fs.chmodSync(tempScript, '755');
      
      const result = execSync(tempScript, { encoding: 'utf8', env: cleanEnv });
      expect(result.trim()).toBe('SUCCESS: All metacharacters safely contained');
    });
  });

  describe('Escaping edge cases', () => {
    it('should handle consecutive single quotes', () => {
      const config = {
        test1: "'''",
        test2: "It'''s",
        test3: "start'''middle'''end",
        test4: "''''''''",
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      // Verify the escaping is correct
      expect(output).toContain(`TEST1=''"'"''"'"''"'"'`);
      expect(output).toContain(`TEST2='It'"'"''"'"''"'"'s'`);
    });

    it('should handle empty and whitespace-only values', () => {
      const config = {
        empty: "",
        space: " ",
        spaces: "   ",
        tab: "\t",
        newline: "\n",
        mixed_whitespace: " \t\n\r "
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      expect(output).toContain("EMPTY=''");
      expect(output).toContain("SPACE=' '");
      expect(output).toContain("SPACES='   '");
      expect(output).toContain("TAB='\t'");
      expect(output).toContain("NEWLINE='\n'");
      expect(output).toContain("MIXED_WHITESPACE=' \t\n\r '");
    });

    it('should handle very long values', () => {
      const longString = 'a'.repeat(10000) + "'; echo 'injection'; '" + 'b'.repeat(10000);
      const config = {
        long_value: longString
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      expect(output).toContain('LONG_VALUE=');
      expect(output.length).toBeGreaterThan(20000);
      // The injection attempt should be safely quoted
      expect(output).toContain("'\"'\"'; echo '\"'\"'injection'\"'\"'; '\"'\"'");
    });
  });

  describe('Environment variable name security', () => {
    it('should handle potentially dangerous key names', () => {
      const config = {
        "PATH": "should-not-override",
        "LD_PRELOAD": "dangerous",
        "valid_key": "safe_value",
        "123invalid": "should-be-skipped",
        "key-with-dash": "should-work",
        "key.with.dots": "should-work",
        "KEY WITH SPACES": "should-work"
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      // Dangerous variables should be blocked
      expect(output).not.toContain("export PATH=");
      expect(output).not.toContain("export LD_PRELOAD=");
      
      // Valid keys should be converted to safe names
      expect(output).toContain("export VALID_KEY='safe_value'");
      expect(output).toContain("export KEY_WITH_DASH='should-work'");
      expect(output).toContain("export KEY_WITH_DOTS='should-work'");
      expect(output).toContain("export KEY_WITH_SPACES='should-work'");
      
      // Invalid starting with number should be prefixed with _
      expect(output).toContain("export _123INVALID='should-be-skipped'");
    });
  });

  describe('Real-world attack scenarios', () => {
    it('should prevent path traversal attempts', () => {
      const config = {
        file_path: "../../../etc/passwd",
        backup_location: "../../../../../../tmp/evil",
        template: "${../../secret.key}",
        include: "<?php include('/etc/passwd'); ?>"
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      // Path traversal attempts should be preserved as strings, not resolved
      expect(output).toContain("FILE_PATH='../../../etc/passwd'");
      expect(output).toContain("BACKUP_LOCATION='../../../../../../tmp/evil'");
      expect(output).toContain("TEMPLATE='${../../secret.key}'");
      expect(output).toContain("INCLUDE='<?php include('\"'\"'/etc/passwd'\"'\"'); ?>'");
    });

    it('should handle polyglot payloads safely', () => {
      const config = {
        // JavaScript/Shell polyglot
        polyglot1: "';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//--></SCRIPT>\">'><SCRIPT>alert(String.fromCharCode(88,83,83))</SCRIPT>",
        // SQL/Shell polyglot
        polyglot2: "1' OR '1'='1' /*' or 1=1 # ' or 1=1-- ' or 1=1;--",
        // XML/Shell polyglot
        polyglot3: "<?xml version=\"1.0\"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]><foo>&xxe;</foo>"
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      // All polyglot payloads should be safely quoted
      const lines = output.trim().split('\n');
      lines.forEach(line => {
        if (line.startsWith('export POLYGLOT')) {
          // Should be safely wrapped in single quotes with proper escaping
          expect(line).toMatch(/^export POLYGLOT[0-9]='.*'$/);
          // The dangerous content is there but safely quoted
          // What matters is that when evaluated, it's just a string
        }
      });
    });
  });

  describe('Stress testing', () => {
    it('should handle deeply nested malicious structures', () => {
      const createNestedMalicious = (depth: number): any => {
        if (depth === 0) {
          return "'; rm -rf /; '";
        }
        return {
          [`level${depth}`]: createNestedMalicious(depth - 1),
          [`inject${depth}`]: "$( echo 'level " + depth + "' )"
        };
      };

      const config = createNestedMalicious(10);
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      // Should handle deep nesting without issues
      expect(output).toContain("LEVEL10_LEVEL9_LEVEL8");
      expect(output).toContain("'\"'\"'; rm -rf /; '\"'\"'");
      
      // All injection attempts should be quoted
      const lines = output.trim().split('\n');
      lines.forEach(line => {
        if (line.includes('INJECT')) {
          expect(line).toContain("$( echo '\"'\"'level");
        }
      });
    });

    it('should handle mixed attack vectors in single config', () => {
      const config = {
        normal_value: "This is safe",
        sql_injection: "1' OR '1'='1",
        cmd_injection: "; cat /etc/passwd",
        xxe_attempt: '<!ENTITY xxe SYSTEM "file:///etc/passwd">',
        code_injection: "${constructor.constructor('return process')().exit()}",
        format_string: "%s%s%s%s%s%s%s%s%s%s",
        buffer_overflow: "A".repeat(10000),
        null_injection: "test\x00admin",
        ldap_injection: "*)(&(1=1",
        xpath_injection: "' or '1'='1",
        template_injection: "{{7*7}}",
        ssti: "${7*7}",
        crlf_injection: "test\r\nSet-Cookie: admin=true",
        host_header: "evil.com\r\nX-Forwarded-Host: evil.com",
        cache_poisoning: "index.html%0d%0aContent-Length:%200%0d%0a%0d%0aHTTP/1.1%20200%20OK"
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const output = execSync(`node "${parseConfigPath}" "${configPath}"`, { 
        encoding: 'utf8',
        env: cleanEnv
      });
      
      // Verify each attack vector is safely handled
      expect(output).toContain("NORMAL_VALUE='This is safe'");
      expect(output).toContain("SQL_INJECTION='1'\"'\"' OR '\"'\"'1'\"'\"'='\"'\"'1'");
      expect(output).toContain("CMD_INJECTION='; cat /etc/passwd'");
      expect(output).toContain("XXE_ATTEMPT='<!ENTITY xxe SYSTEM \"file:///etc/passwd\">'");
      expect(output).toContain("CODE_INJECTION='${constructor.constructor('\"'\"'return process'\"'\"')().exit()}'");
      
      // Verify no actual code execution occurs
      const evalTest = `${output}\necho "Test completed successfully"`;
      const result = execSync(evalTest, { shell: '/bin/sh', encoding: 'utf8' });
      expect(result).toContain("Test completed successfully");
    });
  });
});