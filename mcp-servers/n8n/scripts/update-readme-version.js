#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Read README.md
const readmePath = path.join(__dirname, '..', 'README.md');
let readmeContent = fs.readFileSync(readmePath, 'utf8');

// Update the version badge on line 5
// The pattern matches: [![Version](https://img.shields.io/badge/version-X.X.X-blue.svg)]
const versionBadgeRegex = /(\[!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-)[^-]+(-.+?\)\])/;
const newVersionBadge = `$1${version}$2`;

readmeContent = readmeContent.replace(versionBadgeRegex, newVersionBadge);

// Write back to README.md
fs.writeFileSync(readmePath, readmeContent);

console.log(`✅ Updated README.md version badge to v${version}`);