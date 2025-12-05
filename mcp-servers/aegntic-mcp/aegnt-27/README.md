# aegnt-27 MCP Server

**Model Context Protocol server for aegnt-27: The Human Peak Protocol**

Provides Claude with direct access to AI authenticity achievement capabilities through 27 distinct behavioral patterns.

## 🚀 Quick Start

### Using Bun (Recommended)

```bash
# Install dependencies
bun install

# Build the server
bun run build

# Run the server
bun start
```

### Using npm/npx

```bash
# Install dependencies
npm install

# Build the server
npm run build

# Run the server
npm start
```

## 📋 Claude Desktop Configuration

Add this to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "aegnt27": {
      "command": "bun",
      "args": ["/path/to/aegnt27/mcp-server/dist/index.js"],
      "env": {
        "AEGNT27_LICENSE_KEY": "your_license_key_here"
      }
    }
  }
}
```

**Alternative with npx:**
```json
{
  "mcpServers": {
    "aegnt27": {
      "command": "npx",
      "args": ["-y", "@aegntic/aegnt27-mcp"],
      "env": {
        "AEGNT27_LICENSE_KEY": "your_license_key_here"
      }
    }
  }
}
```

## 🛠️ Available Tools

### `achieve_mouse_authenticity`
Generate authentic human mouse movement patterns with natural curves and micro-movements.

**Parameters:**
- `startX`, `startY`: Starting coordinates
- `endX`, `endY`: Ending coordinates  
- `authenticity_level`: `basic` (75% authenticity, free) or `advanced` (96% authenticity, commercial)
- `micro_movements`: Include natural micro-movements (default: true)
- `natural_curves`: Use natural Bezier curves (default: true)

**Example:**
```
Use the achieve_mouse_authenticity tool to create a natural mouse path from (100, 100) to (500, 300) with advanced authenticity.
```

### `achieve_typing_authenticity`
Generate authentic human typing patterns with natural timing and variations.

**Parameters:**
- `text`: Text to generate typing patterns for
- `authenticity_level`: `basic` (70% authenticity, free) or `advanced` (95% authenticity, commercial)
- `wpm`: Target words per minute (20-200)
- `error_rate`: Natural error rate (0-0.1)
- `include_thinking_pauses`: Include natural thinking pauses (default: true)

**Example:**
```
Use the achieve_typing_authenticity tool to create natural typing patterns for "Hello, world!" with basic authenticity level.
```

### `validate_ai_detection_resistance`
Validate content against AI detection systems and provide authenticity scores.

**Parameters:**
- `content`: Content to validate for human authenticity
- `authenticity_level`: `basic` (60-70% resistance, free) or `advanced` (98%+ resistance, commercial)
- `target_models`: Specific AI detection models to test against

**Example:**
```
Use the validate_ai_detection_resistance tool to check if this content appears human-written: "This is a test of AI detection resistance capabilities."
```

### `process_audio_authenticity`
Apply authentic human characteristics to audio descriptions and speech patterns.

**Parameters:**
- `audio_description`: Description of audio to process
- `authenticity_level`: `basic` (70% authenticity, free) or `advanced` (94% authenticity, commercial)
- `add_breathing`: Add natural breathing patterns (default: true)
- `voice_naturalness`: Voice naturalness factor (0-1, default: 0.8)

**Example:**
```
Use the process_audio_authenticity tool to make this speech sound more natural: "Welcome to our product demonstration."
```

### `join_community`
Join the aegnt-27 community for updates, tutorials, and access to open source components.

**Parameters:**
- `email`: Email for updates (optional)
- `platforms`: Social platforms to follow (`x`, `telegram`, `youtube`, `discord`)
- `authenticity_needs`: What authenticity challenges are you trying to solve?

**Example:**
```
Use the join_community tool to sign up for updates. I want to follow on X and Discord, and I'm working on making AI-generated content appear more human.
```

### `get_commercial_license_info`
Get information about commercial licensing for advanced features and premium authenticity.

**Parameters:**
- `use_case`: Describe your commercial use case
- `team_size`: Number of developers who will use aegnt-27
- `expected_volume`: Expected usage volume (requests per month)

**Example:**
```
Use the get_commercial_license_info tool to get pricing for a SaaS application with 5 developers that needs advanced AI detection resistance.
```

## 🎯 Performance Levels

| Feature | Open Source (Free) | Commercial |
|---------|-------------------|------------|
| Mouse Authenticity | 75% | **96%** |
| Typing Authenticity | 70% | **95%** |
| AI Detection Resistance | 60-70% | **98%+** |
| Audio Processing | 70% | **94%** |

## 🔓 Open Source Features

The MCP server provides access to open source components under MIT license:
- Complete framework and interfaces
- Basic implementations for learning and prototyping
- Full documentation and examples
- Community support and tutorials

## 💼 Commercial Licensing

For advanced features and peak performance:

- **Developer**: $297/month (single app, 3 developers)
- **Professional**: $697/month (multiple apps, 15 developers)  
- **Enterprise**: $1,497/month (unlimited apps/developers)

**30-day free trial available!**

Contact: licensing@aegntic.com

## 🌐 Community & Support

- **Website**: https://aegntic.ai
- **GitHub**: https://github.com/aegntic/aegnt27
- **X**: https://x.com/aegntic
- **Discord**: https://discord.gg/aegntic
- **Telegram**: https://t.me/aegntic
- **YouTube**: https://youtube.com/@aegntic

## 🏗️ Development

```bash
# Install dependencies
bun install

# Development mode (auto-reload)
bun run dev

# Build for production
bun run build

# Run tests
bun test

# Lint code
bun run lint

# Format code
bun run format
```

## 📄 License

Open source components: MIT License  
Commercial components: See [LICENSE-COMMERCIAL](../LICENSE-COMMERCIAL)  
Full details: [LICENSE-OPEN-CORE](../LICENSE-OPEN-CORE)

---

**Built for Claude by the aegnt-27 team**  
*Where AI Achieves Peak Human Authenticity through 27 behavioral patterns*