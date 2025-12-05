#!/usr/bin/env node

/**
 * Pre-release preparation script
 * Validates and prepares everything needed for a successful release
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const readline = require('readline');

// Color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function header(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🚀 ${title}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

class ReleasePreparation {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  /**
   * Get current version and ask for new version
   */
  async getVersionInfo() {
    const packageJson = require(path.join(this.rootDir, 'package.json'));
    const currentVersion = packageJson.version;
    
    log(`\nCurrent version: ${currentVersion}`, 'blue');
    
    const newVersion = await this.askQuestion('\nEnter new version (e.g., 2.10.0): ');
    
    if (!newVersion || !this.isValidSemver(newVersion)) {
      error('Invalid semantic version format');
      throw new Error('Invalid version');
    }
    
    if (this.compareVersions(newVersion, currentVersion) <= 0) {
      error('New version must be greater than current version');
      throw new Error('Version not incremented');
    }
    
    return { currentVersion, newVersion };
  }

  /**
   * Validate semantic version format (strict semver compliance)
   */
  isValidSemver(version) {
    // Strict semantic versioning regex
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return semverRegex.test(version);
  }

  /**
   * Compare two semantic versions
   */
  compareVersions(v1, v2) {
    const parseVersion = (v) => v.split('-')[0].split('.').map(Number);
    const [v1Parts, v2Parts] = [parseVersion(v1), parseVersion(v2)];
    
    for (let i = 0; i < 3; i++) {
      if (v1Parts[i] > v2Parts[i]) return 1;
      if (v1Parts[i] < v2Parts[i]) return -1;
    }
    return 0;
  }

  /**
   * Update version in package files
   */
  updateVersions(newVersion) {
    log('\n📝 Updating version in package files...', 'blue');
    
    // Update package.json
    const packageJsonPath = path.join(this.rootDir, 'package.json');
    const packageJson = require(packageJsonPath);
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    success('Updated package.json');
    
    // Sync to runtime package
    try {
      execSync('npm run sync:runtime-version', { cwd: this.rootDir, stdio: 'pipe' });
      success('Synced package.runtime.json');
    } catch (err) {
      warning('Could not sync runtime version automatically');
      
      // Manual sync
      const runtimeJsonPath = path.join(this.rootDir, 'package.runtime.json');
      if (fs.existsSync(runtimeJsonPath)) {
        const runtimeJson = require(runtimeJsonPath);
        runtimeJson.version = newVersion;
        fs.writeFileSync(runtimeJsonPath, JSON.stringify(runtimeJson, null, 2) + '\n');
        success('Manually synced package.runtime.json');
      }
    }
  }

  /**
   * Update changelog
   */
  async updateChangelog(newVersion) {
    const changelogPath = path.join(this.rootDir, 'docs/CHANGELOG.md');
    
    if (!fs.existsSync(changelogPath)) {
      warning('Changelog file not found, skipping update');
      return;
    }
    
    log('\n📋 Updating changelog...', 'blue');
    
    const content = fs.readFileSync(changelogPath, 'utf8');
    const today = new Date().toISOString().split('T')[0];
    
    // Check if version already exists in changelog
    const versionRegex = new RegExp(`^## \\[${newVersion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'm');
    if (versionRegex.test(content)) {
      info(`Version ${newVersion} already exists in changelog`);
      return;
    }
    
    // Find the Unreleased section
    const unreleasedMatch = content.match(/^## \[Unreleased\]\s*\n([\s\S]*?)(?=\n## \[|$)/m);
    
    if (unreleasedMatch) {
      const unreleasedContent = unreleasedMatch[1].trim();
      
      if (unreleasedContent) {
        log('\nFound content in Unreleased section:', 'blue');
        log(unreleasedContent.substring(0, 200) + '...', 'yellow');
        
        const moveContent = await this.askQuestion('\nMove this content to the new version? (y/n): ');
        
        if (moveContent.toLowerCase() === 'y') {
          // Move unreleased content to new version
          const newVersionSection = `## [${newVersion}] - ${today}\n\n${unreleasedContent}\n\n`;
          const updatedContent = content.replace(
            /^## \[Unreleased\]\s*\n[\s\S]*?(?=\n## \[)/m,
            `## [Unreleased]\n\n${newVersionSection}## [`
          );
          
          fs.writeFileSync(changelogPath, updatedContent);
          success(`Moved unreleased content to version ${newVersion}`);
        } else {
          // Just add empty version section
          const newVersionSection = `## [${newVersion}] - ${today}\n\n### Added\n- \n\n### Changed\n- \n\n### Fixed\n- \n\n`;
          const updatedContent = content.replace(
            /^## \[Unreleased\]\s*\n/m,
            `## [Unreleased]\n\n${newVersionSection}`
          );
          
          fs.writeFileSync(changelogPath, updatedContent);
          warning(`Added empty version section for ${newVersion} - please fill in the changes`);
        }
      } else {
        // Add empty version section
        const newVersionSection = `## [${newVersion}] - ${today}\n\n### Added\n- \n\n### Changed\n- \n\n### Fixed\n- \n\n`;
        const updatedContent = content.replace(
          /^## \[Unreleased\]\s*\n/m,
          `## [Unreleased]\n\n${newVersionSection}`
        );
        
        fs.writeFileSync(changelogPath, updatedContent);
        warning(`Added empty version section for ${newVersion} - please fill in the changes`);
      }
    } else {
      warning('Could not find Unreleased section in changelog');
    }
    
    info('Please review and edit the changelog before committing');
  }

  /**
   * Run tests and build
   */
  async runChecks() {
    log('\n🧪 Running pre-release checks...', 'blue');
    
    try {
      // Run tests
      log('Running tests...', 'blue');
      execSync('npm test', { cwd: this.rootDir, stdio: 'inherit' });
      success('All tests passed');
      
      // Run build
      log('Building project...', 'blue');
      execSync('npm run build', { cwd: this.rootDir, stdio: 'inherit' });
      success('Build completed');
      
      // Rebuild database
      log('Rebuilding database...', 'blue');
      execSync('npm run rebuild', { cwd: this.rootDir, stdio: 'inherit' });
      success('Database rebuilt');
      
      // Run type checking
      log('Type checking...', 'blue');
      execSync('npm run typecheck', { cwd: this.rootDir, stdio: 'inherit' });
      success('Type checking passed');
      
    } catch (err) {
      error('Pre-release checks failed');
      throw err;
    }
  }

  /**
   * Create git commit
   */
  async createCommit(newVersion) {
    log('\n📝 Creating git commit...', 'blue');
    
    try {
      // Check git status
      const status = execSync('git status --porcelain', { 
        cwd: this.rootDir, 
        encoding: 'utf8' 
      });
      
      if (!status.trim()) {
        info('No changes to commit');
        return;
      }
      
      // Show what will be committed
      log('\nFiles to be committed:', 'blue');
      execSync('git diff --name-only', { cwd: this.rootDir, stdio: 'inherit' });
      
      const commit = await this.askQuestion('\nCreate commit for release? (y/n): ');
      
      if (commit.toLowerCase() === 'y') {
        // Add files
        execSync('git add package.json package.runtime.json docs/CHANGELOG.md', { 
          cwd: this.rootDir, 
          stdio: 'pipe' 
        });
        
        // Create commit
        const commitMessage = `chore: release v${newVersion}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;
        
        const result = spawnSync('git', ['commit', '-m', commitMessage], { 
          cwd: this.rootDir, 
          stdio: 'pipe',
          encoding: 'utf8'
        });
        
        if (result.error || result.status !== 0) {
          throw new Error(`Git commit failed: ${result.stderr || result.error?.message}`);
        }
        
        success(`Created commit for v${newVersion}`);
        
        const push = await this.askQuestion('\nPush to trigger release workflow? (y/n): ');
        
        if (push.toLowerCase() === 'y') {
          // Add confirmation for destructive operation
          warning('\n⚠️  DESTRUCTIVE OPERATION WARNING ⚠️');
          warning('This will trigger a PUBLIC RELEASE that cannot be undone!');
          warning('The following will happen automatically:');
          warning('• Create GitHub release with tag');
          warning('• Publish package to NPM registry');
          warning('• Build and push Docker images');
          warning('• Update documentation');
          
          const confirmation = await this.askQuestion('\nType "RELEASE" (all caps) to confirm: ');
          
          if (confirmation === 'RELEASE') {
            execSync('git push', { cwd: this.rootDir, stdio: 'inherit' });
            success('Pushed to remote repository');
            log('\n🎉 Release workflow will be triggered automatically!', 'green');
            log('Monitor progress at: https://github.com/czlonkowski/n8n-mcp/actions', 'blue');
          } else {
            warning('Release cancelled. Commit created but not pushed.');
            info('You can push manually later to trigger the release.');
          }
        } else {
          info('Commit created but not pushed. Push manually to trigger release.');
        }
      }
      
    } catch (err) {
      error(`Git operations failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Display final instructions
   */
  displayInstructions(newVersion) {
    header('Release Preparation Complete');
    
    log('📋 What happens next:', 'blue');
    log(`1. The GitHub Actions workflow will detect the version change to v${newVersion}`, 'green');
    log('2. It will automatically:', 'green');
    log('   • Create a GitHub release with changelog content', 'green');
    log('   • Publish the npm package', 'green');
    log('   • Build and push Docker images', 'green');
    log('   • Update documentation badges', 'green');
    log('\n🔍 Monitor the release at:', 'blue');
    log('   • GitHub Actions: https://github.com/czlonkowski/n8n-mcp/actions', 'blue');
    log('   • NPM Package: https://www.npmjs.com/package/n8n-mcp', 'blue');
    log('   • Docker Images: https://github.com/czlonkowski/n8n-mcp/pkgs/container/n8n-mcp', 'blue');
    
    log('\n✅ Release preparation completed successfully!', 'green');
  }

  /**
   * Main execution flow
   */
  async run() {
    try {
      header('n8n-MCP Release Preparation');
      
      // Get version information
      const { currentVersion, newVersion } = await this.getVersionInfo();
      
      log(`\n🔄 Preparing release: ${currentVersion} → ${newVersion}`, 'magenta');
      
      // Update versions
      this.updateVersions(newVersion);
      
      // Update changelog
      await this.updateChangelog(newVersion);
      
      // Run pre-release checks
      await this.runChecks();
      
      // Create git commit
      await this.createCommit(newVersion);
      
      // Display final instructions
      this.displayInstructions(newVersion);
      
    } catch (err) {
      error(`Release preparation failed: ${err.message}`);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }
}

// Run the script
if (require.main === module) {
  const preparation = new ReleasePreparation();
  preparation.run().catch(err => {
    console.error('Release preparation failed:', err);
    process.exit(1);
  });
}

module.exports = ReleasePreparation;