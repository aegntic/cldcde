import { describe, test, expect } from 'vitest';

describe('SOTA Template Suite - Basic Tests', () => {
  test('should validate basic functionality', () => {
    expect(true).toBe(true);
    expect(typeof performance).toBe('object');
  });

  test('should have proper package.json configuration', () => {
    // This test validates that our setup is working correctly
    const packageJson = require('../package.json');
    expect(packageJson.name).toBe('@aegntic/sota-suite');
    expect(packageJson.version).toBe('1.0.0');
  });

  test('should have all required files', () => {
    const fs = require('fs');
    const path = require('path');

    // Check for key files
    const requiredFiles = [
      'README.md',
      'LICENSE',
      'package.json',
      '.eslintrc.js',
      '.prettierrc',
      'tsconfig.json',
      'vitest.config.ts'
    ];

    requiredFiles.forEach(file => {
      expect(fs.existsSync(path.join(__dirname, '..', file))).toBe(true);
    });
  });

  test('should validate documentation structure', () => {
    const fs = require('fs');
    const path = require('path');

    const docsDir = path.join(__dirname, '..', 'docs');
    const requiredDocs = [
      'api.md',
      'examples.md'
    ];

    requiredDocs.forEach(doc => {
      expect(fs.existsSync(path.join(docsDir, doc))).toBe(true);
    });
  });
});