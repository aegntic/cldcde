#!/usr/bin/env node

/**
 * Extract changelog content for a specific version
 * Used by GitHub Actions to extract release notes
 */

const fs = require('fs');
const path = require('path');

function extractChangelog(version, changelogPath) {
  try {
    if (!fs.existsSync(changelogPath)) {
      console.error(`Changelog file not found at ${changelogPath}`);
      process.exit(1);
    }

    const content = fs.readFileSync(changelogPath, 'utf8');
    const lines = content.split('\n');
    
    // Find the start of this version's section
    const versionHeaderRegex = new RegExp(`^## \\[${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`);
    let startIndex = -1;
    let endIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (versionHeaderRegex.test(lines[i])) {
        startIndex = i;
        break;
      }
    }
    
    if (startIndex === -1) {
      console.error(`No changelog entries found for version ${version}`);
      process.exit(1);
    }
    
    // Find the end of this version's section (next version or end of file)
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (lines[i].startsWith('## [') && !lines[i].includes('Unreleased')) {
        endIndex = i;
        break;
      }
    }
    
    if (endIndex === -1) {
      endIndex = lines.length;
    }
    
    // Extract the section content
    const sectionLines = lines.slice(startIndex, endIndex);
    
    // Remove the version header and any trailing empty lines
    let contentLines = sectionLines.slice(1);
    while (contentLines.length > 0 && contentLines[contentLines.length - 1].trim() === '') {
      contentLines.pop();
    }
    
    if (contentLines.length === 0) {
      console.error(`No content found for version ${version}`);
      process.exit(1);
    }
    
    const releaseNotes = contentLines.join('\n').trim();
    
    // Write to stdout for GitHub Actions
    console.log(releaseNotes);
    
  } catch (error) {
    console.error(`Error extracting changelog: ${error.message}`);
    process.exit(1);
  }
}

// Parse command line arguments
const version = process.argv[2];
const changelogPath = process.argv[3];

if (!version || !changelogPath) {
  console.error('Usage: extract-changelog.js <version> <changelog-path>');
  process.exit(1);
}

extractChangelog(version, changelogPath);