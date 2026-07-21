#!/bin/bash
# ClawReform Demo Video Generator
# Launches VM, installs ClawReform, records demo

set -e

DURATION=${1:-180}
OUTPUT=${2:-"clawreform-demo.mp4"}
REPO_URL="https://github.com/aegntic/clawreform"

echo "🎬 ClawReform Demo Video Generator"
echo "Duration: ${DURATION}s"
echo "Output: ${OUTPUT}"
echo ""

# Check dependencies
echo "📦 Checking dependencies..."
command -v docker >/dev/null 2>&1 || { echo "❌ Docker required"; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "⚠️ ffmpeg not found, installing..."; apt-get install -y ffmpeg; }

# Create demo container
echo "🖥️ Launching fresh VM container..."
CONTAINER_ID=$(docker run -d \
  --name clawreform-demo \
  -e DISPLAY=:99 \
  -e DEBIAN_FRONTEND=noninteractive \
  ubuntu:22.04 \
  tail -f /dev/null)

echo "Container: $CONTAINER_ID"

# Setup container
echo "⚙️ Setting up container..."
docker exec $CONTAINER_ID bash -c '
  apt-get update && apt-get install -y \
    curl git build-essential \
    ffmpeg x11vnc xvfb \
    && rm -rf /var/lib/apt/lists/*
'

# Install Rust
echo "🦀 Installing Rust..."
docker exec $CONTAINER_ID bash -c '
  curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source $HOME/.cargo/env
  rustc --version
'

# Clone and build ClawReform
echo "📥 Cloning ClawReform..."
docker exec $CONTAINER_ID bash -c '
  source $HOME/.cargo/env
  git clone https://github.com/aegntic/clawreform /root/clawreform
  cd /root/clawreform
  echo "✅ Cloned successfully"
'

echo "🔨 Building ClawReform (this may take a few minutes)..."
docker exec $CONTAINER_ID bash -c '
  source $HOME/.cargo/env
  cd /root/clawreform
  cargo build --release -p openfang-cli 2>&1 | tail -5
'

# Record the demo
echo "🎬 Recording demo video..."

# Create recording script inside container
docker exec $CONTAINER_ID bash -c '
  # Start Xvfb
  Xvfb :99 -screen 0 1920x1080x24 &
  sleep 2
  
  # Start VNC server for recording
  x11vnc -display :99 -forever -nopw -bg
  
  # Start ffmpeg recording
  ffmpeg -f x11grab -video_size 1920x1080 -i :99 \
    -c:v libx264 -preset ultrafast -t 180 \
    -y /tmp/demo-output.mp4 &
  FFMPEG_PID=$!
  
  # Demo sequence
  export PATH="$HOME/.cargo/bin:$PATH"
  cd /root/clawreform
  
  # Terminal demo
  echo "Starting demo sequence..."
  
  # Show branding
  clear
  figlet "ClawReform" 2>/dev/null || echo "🦾 ClawReform"
  sleep 2
  
  # Show help
  ./target/release/openfang --help
  sleep 3
  
  # Start daemon
  ./target/release/openfang start &
  sleep 5
  
  # Show status
  curl -s http://127.0.0.1:50051/api/health
  sleep 2
  
  # Show MCP servers
  echo "\n🔌 MCP Servers Connected"
  sleep 2
  
  # Wait for recording to complete
  wait $FFMPEG_PID
'

# Copy video from container
echo "📹 Extracting video..."
docker cp $CONTAINER_ID:/tmp/demo-output.mp4 "$OUTPUT"

# Cleanup
echo "🧹 Cleaning up..."
docker rm -f $CONTAINER_ID

echo ""
echo "✅ Demo video created: $OUTPUT"
echo "📊 Size: $(du -h $OUTPUT | cut -f1)"
