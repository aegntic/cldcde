# Complete Installation Guide

**ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ**
**ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ**

This comprehensive guide covers the complete installation of the CLDCDE ecosystem, including all core components, plugins, and configuration steps.

## Prerequisites

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Ubuntu 20.04+
- **Memory**: Minimum 8GB RAM (16GB recommended)
- **Storage**: Minimum 10GB free space
- **Network**: Stable internet connection

### Software Dependencies
- **Node.js**: Version 18.0 or higher
- **Bun**: Version 1.0 or higher (recommended)
- **Git**: Version 2.30 or higher
- **OBS Studio**: Version 28.0 or higher (for streaming features)

### Hardware Requirements
- **CPU**: Multi-core processor (4+ cores recommended)
- **GPU**: Dedicated GPU recommended for streaming and video processing
- **Webcam**: HD webcam for streaming
- **Microphone**: Quality microphone for audio recording

## Installation Steps

### Step 1: Install Core Dependencies

#### Windows
```powershell
# Install Chocolatey (if not already installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install dependencies
choco install nodejs git obs-studio

# Install Bun
powershell -c "irm bun.sh/install.ps1 | iex"
```

#### macOS
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node git obs-studio bun

# Install OBS Studio
brew install --cask obs
```

#### Linux (Ubuntu/Debian)
```bash
# Update package manager
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt install git

# Install OBS Studio
sudo apt install obs-studio

# Install Bun
curl -fsSL https://bun.sh/install | bash
```

### Step 2: Install CLDCDE Core

#### Option A: NPM Installation (Recommended for most users)
```bash
# Install CLDCDE CLI globally
npm install -g @cldcde/cli

# Verify installation
cldcde --version
```

#### Option B: Source Installation (Recommended for developers)
```bash
# Clone repository
git clone https://github.com/aegntic/cldcde.git
cd cldcde

# Install dependencies
bun install

# Build project
bun run build

# Link for global access
bun link

# Verify installation
cldcde --version
```

### Step 3: Initial Configuration

#### Create Configuration Directory
```bash
# Create config directory
mkdir -p ~/.cldcde

# Initialize configuration
cldcde init
```

#### Configure Basic Settings
```bash
# Run initial setup wizard
cldcde setup

# Answer the interactive prompts:
# - Default installation directory
# - Plugin preferences
# - API provider selection
# - Privacy settings
```

### Step 4: Install Essential Plugins

#### OBS Studio Control Plugin
```bash
# Install from marketplace
cldcde plugin install obs-studio-control

# Or install manually
npm install @cldcde/obs-studio-control

# Configure OBS connection
cldcde obs setup
```

#### YouTube Creator Plugin
```bash
# Install from marketplace
cldcde plugin install youtube-creator

# Run YouTube setup wizard
cldcde youtube setup

# Configure API credentials
# 1. Visit Google Cloud Console
# 2. Create new project
# 3. Enable YouTube Data API v3
# 4. Generate OAuth2 credentials
# 5. Enter credentials when prompted
```

### Step 5: Configure OBS Studio

#### Enable WebSocket Plugin
1. Open OBS Studio
2. Go to **Tools** → **WebSocket Server Settings**
3. Enable **WebSocket Server**
4. Set **Port** to 4444 (default)
5. Set **Password** (optional but recommended)
6. Click **Apply**

#### Configure Scenes
```bash
# Run OBS scene setup
cldcde obs scenes setup

# Follow the interactive guide to create:
# - Starting Soon scene
# - Main Content scene
# - BRB (Be Right Back) scene
# - Ending scene
```

### Step 6: Configure YouTube Integration

#### Test YouTube Connection
```bash
# Test API connection
cldcde youtube test-connection

# Verify channel access
cldcde youtube verify-channel

# Test upload permissions
cldcde youtube test-upload-permissions
```

#### Set Upload Defaults
```bash
# Configure default video settings
cldcde youtube config set-defaults

# Typical settings:
# - Default privacy: private
# - Default category: 28 (Science & Technology)
# - Default language: en
# - Auto-generate tags: enabled
```

### Step 7: Verify Installation

#### Run System Check
```bash
# Comprehensive system check
cldcde doctor

# This will verify:
# - All dependencies are installed
# - Plugins are working correctly
# - Network connections are functional
# - API integrations are active
```

#### Test Core Features
```bash
# Test OBS connection
cldcde obs test-connection

# Test YouTube API
cldcde youtube test-api

# Test plugin system
cldcde plugin list

# Test CLI functionality
cldcde --help
```

## Configuration Files

### Main Configuration (`~/.cldcde/config.json`)
```json
{
  "version": "1.0.0",
  "installation": {
    "path": "/path/to/cldcde",
    "pluginsPath": "/path/to/plugins"
  },
  "obs": {
    "host": "localhost",
    "port": 4444,
    "autoConnect": true
  },
  "youtube": {
    "defaultPrivacy": "private",
    "defaultCategory": "28",
    "language": "en"
  },
  "ui": {
    "theme": "dark",
    "language": "en"
  },
  "security": {
    "encryptCredentials": true,
    "autoLock": false
  }
}
```

### Plugin Configuration (`~/.cldcde/plugins.json`)
```json
{
  "enabled": [
    "obs-studio-control",
    "youtube-creator"
  ],
  "disabled": [],
  "config": {
    "obs-studio-control": {
      "autoReconnect": true,
      "timeout": 5000
    },
    "youtube-creator": {
      "apiKey": "encrypted-key",
      "autoBackup": true
    }
  }
}
```

## Troubleshooting Installation Issues

### Common Problems

#### Node.js Version Issues
```bash
# Check current Node.js version
node --version

# Update Node.js if needed
nvm install 18
nvm use 18
```

#### Permission Issues (Linux/macOS)
```bash
# Fix permissions for global npm packages
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

#### OBS Connection Issues
1. Verify OBS Studio is running
2. Check WebSocket plugin is enabled
3. Confirm firewall settings
4. Test with `telnet localhost 4444`

#### YouTube API Issues
1. Verify API credentials
2. Check Google Cloud Console project settings
3. Ensure OAuth2 consent screen is configured
4. Test API quota and limits

### Getting Help

#### Diagnostic Information
```bash
# Generate diagnostic report
cldcde doctor --report > diagnostic-report.txt

# Include this file when reporting issues
```

#### Support Channels
- **Documentation**: https://docs.cldcde.cc
- **Discord**: https://discord.gg/cldcde
- **GitHub Issues**: https://github.com/aegntic/cldcde/issues
- **Email Support**: support@cldcde.cc

## Post-Installation Steps

### 1. Update System
```bash
# Update CLDCDE to latest version
cldcde update

# Update all plugins
cldcde plugin update --all
```

### 2. Create Backup
```bash
# Backup configuration
cldcde backup create

# Export settings for migration
cldcde config export > cldcde-settings.json
```

### 3. Security Setup
```bash
# Configure security settings
cldcde security setup

# Enable two-factor authentication if available
cldcde security 2fa enable
```

### 4. Performance Optimization
```bash
# Optimize system settings
cldcde optimize

# Configure performance monitoring
cldcde monitor enable
```

## Next Steps

After completing the installation:

1. **Read the User Guide**: Familiarize yourself with basic concepts
2. **Install Additional Plugins**: Explore the marketplace for more tools
3. **Join the Community**: Connect with other users on Discord
4. **Explore Tutorials**: Watch video tutorials for specific workflows
5. **Configure Workflows**: Set up automated workflows for your content creation

---

**✅ Installation Complete! Welcome to CLDCDE!**

**Need help? Visit our documentation at https://docs.cldcde.cc or join our Discord community.**

**ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ**