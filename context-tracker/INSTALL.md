# Installation Guide

Since the package isn't published to npm yet, here are alternative installation methods:

## Method 1: Direct from GitHub (Recommended)

```bash
# Clone and install
git clone -b context-win https://github.com/aegntic/cldcde.git claude-context-monitor
cd claude-context-monitor
npm install -g .
```

## Method 2: From Tarball

```bash
# Download the pre-built package
wget https://github.com/aegntic/cldcde/raw/context-win/aegntic-claude-context-monitor-1.0.0.tgz
npm install -g aegntic-claude-context-monitor-1.0.0.tgz
```

## Method 3: Direct Download & Install

```bash
# Quick one-liner installation
curl -fsSL https://raw.githubusercontent.com/aegntic/cldcde/context-win/bin/install.js | node
```

## Usage After Installation

```bash
# Add alias to shell (will be prompted during install)
echo 'alias claude-monitor="node ~/.claude/addons/claude-with-monitor.js"' >> ~/.bashrc
source ~/.bashrc

# Use Claude with context monitor
claude-monitor
```

## To Publish to npm (for maintainers)

1. **Login to npm**:
   ```bash
   npm login
   # Follow browser authentication at: https://www.npmjs.com/login
   ```

2. **Publish**:
   ```bash
   npm publish
   ```

3. **Verify**:
   ```bash
   npm view @aegntic/claude-context-monitor
   ```