#!/usr/bin/env node
/**
 * Parse JSON config file and output shell-safe export commands
 * Only outputs variables that aren't already set in environment
 * 
 * Security: Uses safe quoting without any shell execution
 */

const fs = require('fs');

// Debug logging support
const DEBUG = process.env.DEBUG_CONFIG === 'true';

function debugLog(message) {
  if (DEBUG) {
    process.stderr.write(`[parse-config] ${message}\n`);
  }
}

const configPath = process.argv[2] || '/app/config.json';
debugLog(`Using config path: ${configPath}`);

// Dangerous environment variables that should never be set
const DANGEROUS_VARS = new Set([
  'PATH', 'LD_PRELOAD', 'LD_LIBRARY_PATH', 'LD_AUDIT',
  'BASH_ENV', 'ENV', 'CDPATH', 'IFS', 'PS1', 'PS2', 'PS3', 'PS4',
  'SHELL', 'BASH_FUNC', 'SHELLOPTS', 'GLOBIGNORE',
  'PERL5LIB', 'PYTHONPATH', 'NODE_PATH', 'RUBYLIB'
]);

/**
 * Sanitize a key name for use as environment variable
 * Converts to uppercase and replaces invalid chars with underscore
 */
function sanitizeKey(key) {
  // Convert to string and handle edge cases
  const keyStr = String(key || '').trim();
  
  if (!keyStr) {
    return 'EMPTY_KEY';
  }
  
  // Special handling for NODE_DB_PATH to preserve exact casing
  if (keyStr === 'NODE_DB_PATH') {
    return 'NODE_DB_PATH';
  }
  
  const sanitized = keyStr
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') // Trim underscores
    .replace(/^(\d)/, '_$1'); // Prefix with _ if starts with number
  
  // If sanitization results in empty string, use a default
  return sanitized || 'EMPTY_KEY';
}

/**
 * Safely quote a string for shell use
 * This follows POSIX shell quoting rules
 */
function shellQuote(str) {
  // Remove null bytes which are not allowed in environment variables
  str = str.replace(/\x00/g, '');
  
  // Always use single quotes for consistency and safety
  // Single quotes protect everything except other single quotes
  return "'" + str.replace(/'/g, "'\"'\"'") + "'";
}

try {
  if (!fs.existsSync(configPath)) {
    debugLog(`Config file not found at: ${configPath}`);
    process.exit(0); // Silent exit if no config file
  }

  let configContent;
  let config;
  
  try {
    configContent = fs.readFileSync(configPath, 'utf8');
    debugLog(`Read config file, size: ${configContent.length} bytes`);
  } catch (readError) {
    // Silent exit on read errors
    debugLog(`Error reading config: ${readError.message}`);
    process.exit(0);
  }
  
  try {
    config = JSON.parse(configContent);
    debugLog(`Parsed config with ${Object.keys(config).length} top-level keys`);
  } catch (parseError) {
    // Silent exit on invalid JSON
    debugLog(`Error parsing JSON: ${parseError.message}`);
    process.exit(0);
  }
  
  // Validate config is an object
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    // Silent exit on invalid config structure
    process.exit(0);
  }
  
  // Convert nested objects to flat environment variables
  const flattenConfig = (obj, prefix = '', depth = 0) => {
    const result = {};
    
    // Prevent infinite recursion
    if (depth > 10) {
      return result;
    }
    
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeKey(key);
      
      // Skip if sanitization resulted in EMPTY_KEY (indicating invalid key)
      if (sanitizedKey === 'EMPTY_KEY') {
        debugLog(`Skipping key '${key}': invalid key name`);
        continue;
      }
      
      const envKey = prefix ? `${prefix}_${sanitizedKey}` : sanitizedKey;
      
      // Skip if key is too long
      if (envKey.length > 255) {
        debugLog(`Skipping key '${envKey}': too long (${envKey.length} chars)`);
        continue;
      }
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively flatten nested objects
        Object.assign(result, flattenConfig(value, envKey, depth + 1));
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        // Only include if not already set in environment
        if (!process.env[envKey]) {
          let stringValue = String(value);
          
          // Handle special JavaScript number values
          if (typeof value === 'number') {
            if (!isFinite(value)) {
              if (value === Infinity) {
                stringValue = 'Infinity';
              } else if (value === -Infinity) {
                stringValue = '-Infinity';
              } else if (isNaN(value)) {
                stringValue = 'NaN';
              }
            }
          }
          
          // Skip if value is too long
          if (stringValue.length <= 32768) {
            result[envKey] = stringValue;
          }
        }
      }
    }
    
    return result;
  };
  
  // Output shell-safe export commands
  const flattened = flattenConfig(config);
  const exports = [];
  
  for (const [key, value] of Object.entries(flattened)) {
    // Validate key name (alphanumeric and underscore only)
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
      continue; // Skip invalid variable names
    }
    
    // Skip dangerous variables
    if (DANGEROUS_VARS.has(key) || key.startsWith('BASH_FUNC_')) {
      debugLog(`Warning: Ignoring dangerous variable: ${key}`);
      process.stderr.write(`Warning: Ignoring dangerous variable: ${key}\n`);
      continue;
    }
    
    // Safely quote the value
    const quotedValue = shellQuote(value);
    exports.push(`export ${key}=${quotedValue}`);
  }
  
  // Use process.stdout.write to ensure output goes to stdout
  if (exports.length > 0) {
    process.stdout.write(exports.join('\n') + '\n');
  }
  
} catch (error) {
  // Silent fail - don't break the container startup
  process.exit(0);
}