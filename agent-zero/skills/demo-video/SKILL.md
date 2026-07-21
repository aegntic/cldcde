---
name: demo-video
description: Create demo videos of ClawReform by launching VMs, installing from scratch, and recording the process
version: 0.1.0
author: ClawReform
tags: [demo, video, vm, automation, recording]
---

# Demo Video Skill

Create automated demo videos of ClawReform by:
1. Launching a fresh VM (Docker container or cloud VM)
2. Installing ClawReform from GitHub
3. Recording the entire process with screen capture
4. Demonstrating key features
5. Producing a polished demo video

## Requirements

- Docker (for local VM simulation)
- ffmpeg (for screen recording)
- xdotool, x11vnc (for X11 automation)

## Usage

```
./scripts/create-demo.sh --duration 180 --output clawreform-demo.mp4
```

## Demo Script

The demo covers:
1. Fresh Ubuntu/Debian container launch
2. Installing Rust and dependencies
3. Cloning ClawReform from GitHub
4. Building ClawReform
5. Starting the daemon
6. Demonstrating self-modification
7. Showing MCP servers connecting
8. Chatting with ClawReform

## Output

- MP4 video file (configurable duration)
- Thumbnail image
- Subtitle file (optional)
