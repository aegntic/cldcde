# Google Suite Labs Extension

> **Access Google's Experimental AI Tools with Compound Workflows**

[![npm version](https://badge.fury.io/js/%40aegntic%2Fgoogle-labs-extension.svg)](https://www.npmjs.com/package/@aegntic/google-labs-extension)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Unlock the power of Google's cutting-edge AI experiments: **Stitch**, **Whisk**, **Flow**, and more. This extension provides OAuth authentication, browser automation, and intelligent compound workflows that combine multiple tools for enhanced results.

## 🚀 Featured Tools

### **🧵 Stitch** - Visual Storytelling
Transform ideas into visual narratives with AI-generated imagery.
- **Input**: Text prompts, concept descriptions
- **Output**: Visual storyboards, image sequences
- **Compound Use**: Feed Stitch output into Whisk for refinement

### **🎨 Whisk** - Creative Remix
Blend, remix, and transform images with AI-powered creativity.
- **Input**: Images, style references, creative directions
- **Output**: Remixes, variations, style transfers
- **Compound Use**: Use Whisk outputs as Flow inputs for animation

### **🌊 Flow** - Motion & Animation
Bring static visuals to life with AI-generated motion and animation.
- **Input**: Images, visual concepts, style preferences
- **Output**: Animated sequences, motion graphics
- **Compound Use**: Animate Stitch/Whisk outputs for complete stories

### **🔮 Additional Labs**
- **MusicFX** - AI music generation
- **ImageFX** - Advanced image editing
- **VideoFX** - Video creation and editing
- **TextFX** - Creative text generation

## 🎯 Compound Workflows

The magic happens when tools work together:

### **Visual Story Pipeline**
```
Idea → Stitch (visual concepts) → Whisk (refine & style) → Flow (animate)
```

### **Creative Campaign Generator**
```
Brief → TextFX (copy) → ImageFX (visuals) → Whisk (variations) → Flow (motion ads)
```

### **Content Multiplier**
```
Asset → Whisk (10 variations) → Stitch (story versions) → Flow (animated series)
```

## 🔐 Authentication

### OAuth 2.0 Setup
Google Labs requires OAuth authentication. This extension handles it seamlessly:

```bash
# One-time setup
glabs auth

# Browser opens automatically
# Login with Google account
# Grant permissions
# Tokens saved securely
```

### Secure Token Management
- OAuth 2.0 flow with PKCE
- Tokens stored in OS keychain
- Automatic refresh before expiry
- Multi-account support

## 🛠️ Installation

```bash
# Global installation
npm install -g @aegntic/google-labs-extension

# Or use with npx
npx @aegntic/google-labs-extension
```

## 🎮 Usage

### **Interactive Mode**
```bash
glabs interactive
# Arrow-key menu to select tools
```

### **Individual Tools**
```bash
# Stitch - Create visual story
glabs stitch "A cyberpunk city at sunset"

# Whisk - Remix an image
glabs whisk ./my-image.jpg --style "vaporwave"

# Flow - Animate visuals
glabs flow ./my-image.jpg --duration 5s --style "smooth"
```

### **Compound Workflows**
```bash
# Full pipeline: Idea → Stitch → Whisk → Flow
glabs pipeline \
  --input "A floating garden in space" \
  --tools stitch,whisk,flow \
  --output ./space-garden/

# Batch processing
glabs batch \
  --input ./concepts/ \
  --workflow "stitch→whisk→flow" \
  --output ./animated-stories/
```

## 🌐 Browser Automation

Since Google Labs lack APIs, we use intelligent browser automation:

### **Stealth Mode**
- Puppeteer with stealth plugins
- Human-like interaction patterns
- Anti-detection measures
- Rate limiting to avoid blocks

### **Headless & Visible Modes**
```bash
# Headless (background)
glabs stitch "prompt" --headless

# Visible browser (watch the magic)
glabs stitch "prompt" --visible
```

### **Session Persistence**
- Maintains login state
- Reuses browser context
- Parallel processing support
- Automatic retry on failure

## 📊 Workflow Examples

### **Marketing Campaign Creation**
```javascript
// Generate complete campaign assets
glabs.workflow({
  name: "Product Launch Campaign",
  steps: [
    { tool: "textfx", input: "Write 5 taglines for eco-friendly sneakers" },
    { tool: "imagefx", input: "Generate product hero image" },
    { tool: "whisk", input: "Create 10 style variations" },
    { tool: "stitch", input: "Create storyboard for social media" },
    { tool: "flow", input: "Animate hero image for video ads" }
  ],
  output: "./campaign-assets/"
});
```

### **Content Series Generator**
```javascript
// Create episodic content
glabs.series({
  episodes: 5,
  theme: "Space Exploration",
  tools: ["stitch", "whisk", "flow"],
  variations: 3
});
```

## 🔧 Configuration

### **Config File** (`~/.google-labs/config.json`)
```json
{
  "defaultBrowser": "chrome",
  "headless": false,
  "parallelJobs": 3,
  "outputDirectory": "./google-labs-output",
  "rateLimit": {
    "requestsPerMinute": 10,
    "delayBetweenRequests": 2000
  },
  "tools": {
    "stitch": {
      "defaultStyle": "cinematic",
      "maxVariations": 4
    },
    "whisk": {
      "defaultStrength": 0.7,
      "preserveStructure": true
    },
    "flow": {
      "defaultDuration": 3,
      "fps": 30
    }
  }
}
```

## 🛡️ Safety & Ethics

### **Rate Limiting**
- Respects Google Labs usage limits
- Automatic throttling
- Queue management for batch jobs

### **Content Guidelines**
- Automatic content filtering
- NSFW detection
- Copyright awareness
- Usage compliance

### **Privacy**
- Local processing where possible
- No data retention
- Secure credential storage
- Transparent data usage

## 🔌 Integration with @aegntic Ecosystem

### **UltraPlan Pro**
```bash
# Use Google Labs in strategic planning
ultraplan pro execute "Marketing campaign with Google Labs assets"
```

### **Red Team Tribunal**
```bash
# Validate creative outputs
red-team-tribunal --target ./google-labs-output/
```

### **Compound Engineering**
```bash
# Automated quality workflows
compound-engineering --workflow creative-pipeline
```

## 📝 Requirements

- **Node.js** >= 18.0.0
- **Google Account** with Labs access
- **Chrome/Chromium** (auto-downloaded)
- **Stable Internet** (for browser automation)

## 🐛 Troubleshooting

### **OAuth Issues**
```bash
# Re-authenticate
glabs auth --reset
glabs auth
```

### **Browser Detection**
```bash
# Use stealth mode
glabs <command> --stealth
```

### **Rate Limited**
```bash
# Slow down requests
glabs <command> --delay 5000
```

## 🎯 Use Cases

### **Content Creators**
- Batch generate social media assets
- Create animated story series
- Remix existing content

### **Marketing Teams**
- Rapid campaign prototyping
- A/B test creative variations
- Generate multimedia ads

### **Designers**
- Mood board creation
- Style exploration
- Concept visualization

### **Developers**
- UI/UX prototyping
- Asset generation
- Demo content creation

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 🔗 Links

- **NPM**: https://www.npmjs.com/package/@aegntic/google-labs-extension
- **Repository**: https://github.com/aegntic/google-labs-extension
- **Issues**: https://github.com/aegntic/google-labs-extension/issues

---

**Built with ❤️ by the @aegntic team**

*Unlock the future of creative AI with Google Labs*