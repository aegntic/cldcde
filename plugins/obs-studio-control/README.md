╔────────────────────────────────────────────────────────────╗
│                                                            │
│                                                            │
│    █████████   ███████████   ███████████   ███████████     │
│   ███░░░░░███ ░░███░░███░░███░░███░░███░░███░███░░░░░███    │
│  ░███    ░░░  ░███ ░███ ░███ ░███ ░███ ░███░███    ░███    │
│  ░░█████████  ░███ ░███ ░███ ░███ ░███ ░███░███████████    │
│   ░░░░░░░░███ ░███ ░███ ░███ ░███ ░███ ░███░███░░░░░███    │
│   ███    ░███ ░███ ░███ ░███ ░███ ░███ ░███░███    ░███    │
│  ░░█████████  ███████████  ███████████  ██████████ █████   │
│   ░░░░░░░░░  ░░░░░░░░░░░  ░░░░░░░░░░░  ░░░░░░░░░ ░░░░░    │
│ ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ                              │
│  ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ                           │
│                                                            │
╚────────────────────────────────────────────────────────────╝

# OBS Studio Control Plugin

**ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ**
**ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ**

**Professional OBS Studio Control and Stream Management Plugin**

## Overview

The OBS Studio Control Plugin provides comprehensive control over OBS Studio directly from the CLDCDE ecosystem. Features interactive scene management, real-time stream monitoring, automated transitions, and advanced streaming tools.

## Key Features

### Stream Control
- **Scene Management**: Interactive scene switching and preview
- **Source Control**: Audio/video source management
- **Transitions**: Automated and manual scene transitions
- **Recording**: Start/stop recording with custom settings

### Real-time Monitoring
- **Stream Health**: Monitor bitrate, FPS, and dropped frames
- **Audio Levels**: Live audio metering and mixing
- **Performance**: CPU and GPU usage monitoring
- **Chat Integration**: Live chat overlay and moderation

### Automation
- **Smart Transitions**: Context-aware scene switching
- **Schedule Management**: Automated stream scheduling
- **Alert Systems**: Custom alerts and notifications
- **Backup Streaming**: Failover to backup servers

## Installation

### Prerequisites
- OBS Studio 28.0 or higher
- CLDCDE ecosystem installed
- WebSocket plugin enabled in OBS

### Setup
1. Install via CLDCDE marketplace
2. Enable WebSocket in OBS (Tools → WebSocket Server Settings)
3. Configure connection settings
4. Start using interactive controls

## Interactive Menu System

The plugin features a comprehensive interactive menu system that guides users through complex operations:

### Main Menu Options
1. **Quick Controls** - Fast access to common actions
2. **Scene Management** - Advanced scene operations
3. **Stream Settings** - Configuration and monitoring
4. **Automation Rules** - Set up automated workflows
5. **Analytics** - Performance and engagement metrics

### Interactive Features
- **AskUserQuestion Integration**: Smart prompts for complex operations
- **Context-Aware Actions**: Menu adapts to current stream state
- **Guided Workflows**: Step-by-step assistance for new users
- **Expert Mode**: Direct control for advanced users

## API Integration

```typescript
import { OBSControl } from '@cldcde/obs-studio-control';

const obs = new OBSControl({
  host: 'localhost',
  port: 4444,
  password: 'your-websocket-password'
});

// Interactive scene switching
const scene = await obs.askUserQuestion({
  question: 'Which scene would you like to switch to?',
  options: [
    { label: 'Starting Soon', value: 'starting-soon' },
    { label: 'Main Content', value: 'main-content' },
    { label: 'BRB Screen', value: 'brb-screen' },
    { label: 'Ending Screen', value: 'ending-screen' }
  ]
});

await obs.switchScene(scene.value);
```

## Configuration

### Connection Settings
```json
{
  "connection": {
    "host": "localhost",
    "port": 4444,
    "password": "",
    "autoReconnect": true,
    "timeout": 5000
  }
}
```

### Scene Presets
```json
{
  "scenes": {
    "starting-soon": {
      "sources": ["overlay", "countdown", "chat"],
      "transition": "fade",
      "duration": 1000
    },
    "main-content": {
      "sources": ["webcam", "game-capture", "overlay"],
      "transition": "cut",
      "duration": 0
    }
  }
}
```

## Advanced Features

### Smart Scene Detection
- Automatically detects content type
- Suggests optimal scene layouts
- Learns from user preferences

### Performance Optimization
- GPU-accelerated transitions
- Efficient resource management
- Real-time performance tuning

### Collaboration Tools
- Remote control access
- Multi-operator support
- Role-based permissions

## Troubleshooting

### Common Issues

**WebSocket Connection Failed**
- Check OBS WebSocket server is running
- Verify firewall settings
- Confirm correct port and password

**Scene Switching Lag**
- Reduce transition duration
- Check system resources
- Optimize scene complexity

**Audio Issues**
- Verify audio device settings
- Check audio monitoring levels
- Reset audio sources

### Debug Mode
Enable debug logging for advanced troubleshooting:

```typescript
const obs = new OBSControl({
  debug: true,
  logLevel: 'verbose'
});
```

## Development

### Building from Source
```bash
git clone https://github.com/aegntic/cldcde-plugins.git
cd obs-studio-control
bun install
bun run build
```

### Contributing
1. Fork the repository
2. Create feature branch
3. Submit pull request
4. Follow code style guidelines

## Support

- **Documentation**: https://docs.cldcde.cc/obs-studio-control
- **Issues**: https://github.com/aegntic/cldcde-plugins/issues
- **Discord**: https://discord.gg/cldcde
- **Support**: support@cldcde.cc

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

Built by the AEGNTIC AI Ecosystems team for professional streamers.

**ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ**