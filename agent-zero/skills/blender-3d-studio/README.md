# Blender 3D Animation Studio

Professional-grade Blender automation skill specializing in 2D-to-3D transformation and animation workflows with MCP server integration.

## 🚀 Quick Start

### Transform 2D Image to 3D Model
```bash
cd ~/.claude/skills/blender-3d-studio
./scripts/2d-to-3d.sh -i logo.png -o logo_3d.blend
```

### Create Animation
```bash
./scripts/generate-animation.sh -i logo_3d.blend -t rotate_spin -d 15
```

### Start MCP Server
```bash
./scripts/start-mcp-server.sh -p 8080
```

### Queue Render Job
```bash
./scripts/queue-render.sh -i animated_logo.blend -q high
```

## 📋 Features

### 2D-to-3D Transformation
- **AI-powered depth analysis** with multiple depth generation methods
- **Automatic mesh generation** with optimized topology
- **Material creation** from source images
- **Professional lighting** setups

### Animation Generation
- **6 animation types**: rotate_spin, bounce, morph, camera, particle, wave
- **Procedural keyframing** with easing functions
- **Physics simulation** integration
- **Camera movement** patterns

### MCP Server Integration
- **REST API** for remote automation
- **WebSocket support** for real-time updates
- **Job queue management** with priority system
- **Distributed rendering** capabilities

### Render Management
- **Queue-based rendering** with job priorities
- **Distributed processing** across multiple nodes
- **Quality presets** (low, medium, high)
- **Progress monitoring** and status tracking

## 🎯 Use Cases

### Logo Animation
Transform company logos into professional 3D animated sequences for marketing and branding.

### Product Visualization
Convert product photos into interactive 3D models for e-commerce and presentations.

### Architectural Visualization
Transform 2D architectural drawings into 3D models and walkthrough animations.

### Content Creation
Automate animation workflows for social media, presentations, and video production.

## 🔧 Configuration

Edit `resources/studio-config.json` to customize:
- Blender path and render settings
- Quality and performance parameters
- MCP server configuration
- File format and compression settings

## 📚 Documentation

### Main Skill File
- `SKILL.md` - Complete documentation and usage guide

### Scripts Directory
- `scripts/2d-to-3d.sh` - 2D to 3D conversion automation
- `scripts/generate-animation.sh` - Animation generation
- `scripts/start-mcp-server.sh` - MCP server management
- `scripts/queue-render.sh` - Render queue management

### Resources Directory
- `resources/templates/` - Animation and project templates
- `resources/presets/` - Material and lighting presets
- `resources/studio-config.json` - Main configuration file

## 🌐 MCP API Endpoints

### Conversion Endpoints
- `POST /convert` - Convert 2D images to 3D models
- `POST /animate` - Generate animations from 3D models
- `POST /render` - Queue render jobs

### Management Endpoints
- `GET /health` - Server health check
- `GET /status` - Server and queue status
- `GET /jobs` - Job information and progress
- `GET /queue` - Render queue information

## 🔗 Integration

### With Other Skills
- **UltraPlan**: Project planning and resource management
- **FPEF Framework**: Problem analysis for pipeline issues
- **MCP Universal Manager**: Cross-platform server coordination

### External Tools
- Blender 4.0+ for 3D modeling and rendering
- Python 3.10+ for scripting and automation
- FFmpeg for video post-processing
- Node.js for web-based dashboards (optional)

## 📊 Performance

### 2D-to-3D Conversion
- **Typical processing time**: 2-10 minutes per image
- **Supported formats**: PNG, JPG, SVG, BMP, TGA, TIFF
- **Output formats**: BLEND, OBJ, FBX, GLTF

### Animation Generation
- **Processing time**: 1-5 minutes per animation
- **Frame rates**: 12-120 fps supported
- **Max duration**: Unlimited (memory dependent)

### Rendering Performance
- **Single GPU**: 1-5 minutes per frame (depending on complexity)
- **Distributed rendering**: 4x speed improvement with 4 nodes
- **Quality levels**: Low (32 samples), Medium (64 samples), High (128+ samples)

## 🛠️ Requirements

### System Requirements
- **CPU**: Multi-core processor (8+ cores recommended)
- **RAM**: 16GB minimum, 32GB+ recommended
- **GPU**: NVIDIA CUDA-compatible (RTX series recommended)
- **Storage**: SSD with 10GB+ free space

### Software Requirements
- **Blender 4.0+** with Python scripting enabled
- **Python 3.10+** with standard libraries
- **FFmpeg** (for video output, optional)

### Network Requirements
- **LAN** for distributed rendering
- **2GB+ bandwidth** for remote collaboration
- **Open ports** (8080 default) for MCP server

## 🤝 Support

### Troubleshooting
1. Check Blender installation: `blender --version`
2. Verify Python modules: `python3 -c "import bpy"`
3. Test MCP server: `curl http://localhost:8080/health`

### Common Issues
- **Memory errors**: Reduce resolution or subdivision levels
- **Slow rendering**: Enable GPU acceleration and distributed rendering
- **Import failures**: Check file formats and permissions

### Getting Help
- Review `SKILL.md` for detailed documentation
- Check script logs for error messages
- Use `--verbose` flag for detailed debugging output

---

**Created by:** Blender 3D Animation Studio Skill
**Version:** 1.0.0
**Last Updated:** December 20, 2025