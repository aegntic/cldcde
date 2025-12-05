#!/usr/bin/env node

/**
 * Sync version from package.json to package.runtime.json and README.md
 * This ensures all files always have the same version
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageRuntimePath = path.join(__dirname, '..', 'package.runtime.json');
const readmePath = path.join(__dirname, '..', 'README.md');

try {
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const version = packageJson.version;
  
  // Read package.runtime.json
  const packageRuntime = JSON.parse(fs.readFileSync(packageRuntimePath, 'utf-8'));
  
  // Update version if different
  if (packageRuntime.version !== version) {
    packageRuntime.version = version;
    
    // Write back with proper formatting
    fs.writeFileSync(
      packageRuntimePath, 
      JSON.stringify(packageRuntime, null, 2) + '\n',
      'utf-8'
    );
    
    console.log(`✅ Updated package.runtime.json version to ${version}`);
  } else {
    console.log(`✓ package.runtime.json already at version ${version}`);
  }
  
  // Update README.md version badge
  let readmeContent = fs.readFileSync(readmePath, 'utf-8');
  const versionBadgeRegex = /(\[!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-)[^-]+(-.+?\)\])/;
  const newVersionBadge = `$1${version}$2`;
  const updatedReadmeContent = readmeContent.replace(versionBadgeRegex, newVersionBadge);
  
  if (updatedReadmeContent !== readmeContent) {
    fs.writeFileSync(readmePath, updatedReadmeContent);
    console.log(`✅ Updated README.md version badge to ${version}`);
  } else {
    console.log(`✓ README.md already has version badge ${version}`);
  }
} catch (error) {
  console.error('❌ Error syncing version:', error.message);
  process.exit(1);
}