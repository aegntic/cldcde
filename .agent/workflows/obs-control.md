---
description: Control OBS Studio for streaming, recording, and scene management
---

# OBS Studio Control Workflow

Interactive OBS Studio control with real-time status monitoring and automation.

## Setup Requirements

1. **OBS Studio** installed with OBS WebSocket enabled
2. **OBS WebSocket** plugin configured (port 4455 default)
3. **NPM Dependencies** installed

## Quick Start

### Enable OBS WebSocket
1. Open OBS Studio
2. Go to Tools → WebSocket Server Settings
3. Enable WebSocket Server
4. Note the port (default: 4455) and password

### Install Plugin Dependencies
```bash
cd /home/ae/AE/01_Laboratory/cldcde/plugins/obs-studio-control
npm install
```

## Available Commands

### Stream Control
- **Start Stream**: Begin live streaming to configured platform
- **Stop Stream**: End the current stream
- **Get Stream Status**: Check if streaming, uptime, bitrate

### Recording Control
- **Start Recording**: Begin local recording
- **Stop Recording**: End recording and save file
- **Pause/Resume**: Pause or resume recording

### Scene Management
- **List Scenes**: Get all available scenes
- **Switch Scene**: Change to a specific scene
- **Get Current Scene**: Check active scene

### Source Control
- **Show/Hide Source**: Toggle source visibility
- **Mute/Unmute Audio**: Control audio sources
- **Set Volume**: Adjust audio levels

### Advanced Features
- **Virtual Camera**: Start/stop virtual camera
- **Screenshot**: Capture current output
- **Studio Mode**: Toggle studio mode

## Example Usage

### Connect to OBS
```typescript
const obs = new OBSController({
  address: 'localhost:4455',
  password: 'your-websocket-password'
});
await obs.connect();
```

### Scene Switching
```typescript
// List all scenes
const scenes = await obs.getScenes();

// Switch to a scene
await obs.switchScene('Gaming Scene');
```

### Stream Control
```typescript
// Start streaming
await obs.startStream();

// Check status
const status = await obs.getStreamStatus();
console.log(`Streaming: ${status.streaming}`);
console.log(`Uptime: ${status.uptime}`);
```

### Recording
```typescript
await obs.startRecording();
// ... record content ...
await obs.stopRecording();
```

## Configuration

Default connection settings:
```json
{
  "address": "localhost:4455",
  "password": "",
  "reconnect": true,
  "reconnectInterval": 5000
}
```

## Troubleshooting

**Cannot connect to OBS**
- Verify OBS is running
- Check WebSocket server is enabled
- Confirm port and password are correct
- Check firewall settings

**Scene not found**
- Use exact scene name (case-sensitive)
- Call `getScenes()` to list available scenes

---
*ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ*
