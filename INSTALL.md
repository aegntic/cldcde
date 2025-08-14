# MEMre.quest Installation Guide

## Quick Install

### Option 1: Download & Install
```bash
# Download the package
wget https://github.com/aegntic/cldcde/raw/main/memre/download/memre-quest-v1.0.0.tar.gz

# Extract
tar -xzf memre-quest-v1.0.0.tar.gz

# Install
cd memre-quest
chmod +x bin/memre-quest
sudo cp bin/memre-quest /usr/local/bin/

# Or add to PATH
export PATH="$PWD/bin:$PATH"
```

### Option 2: Git Clone
```bash
# Clone the repository
git clone https://github.com/aegntic/cldcde.git
cd cldcde/memre/download

# Make executable
chmod +x bin/memre-quest

# Add to PATH
export PATH="$PWD/bin:$PATH"
```

### Option 3: Direct Download
```bash
# Download just the executable
curl -L https://github.com/aegntic/cldcde/raw/main/memre/download/bin/memre-quest -o memre-quest
chmod +x memre-quest
sudo mv memre-quest /usr/local/bin/
```

## Verify Installation

```bash
memre-quest --version
memre-quest --help
```

## Quick Start

```bash
# Start 80% context monitoring
memre-quest start

# Check status
memre-quest status
```

## Links

- Homepage: https://cldcde.cc
- Repository: https://github.com/aegntic/cldcde/memre/download
- Download: https://github.com/aegntic/cldcde/raw/main/memre/download/memre-quest-v1.0.0.tar.gz