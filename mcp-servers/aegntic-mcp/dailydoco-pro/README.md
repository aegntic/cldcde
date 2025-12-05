# DailyDoco Pro MCP Server

Elite automated documentation platform with AI test audiences and performance analytics.

## Features

- **Project Analysis** - Intelligent project structure analysis and documentation opportunities
- **Video Capture** - Automated screen recording with predictive moment detection
- **AI Test Audience** - Simulate 50-100 synthetic viewers with detailed feedback
- **Personal Branding** - AI-powered brand evolution and optimization
- **Authenticity Engine** - Human-like content generation with 95%+ AI detection resistance
- **Performance Monitor** - Real-time system metrics and optimization insights
- **Video Compilation** - Professional video compilation with AI narration

## Installation

```bash
cd dailydoco-pro
npm install
npm run build
```

## Configuration

Environment variables:
- `USER_EMAIL` - Your email for registration and branding
- `ENABLE_AUTO_REGISTRATION` - Auto-register on first use (default: true)

## MCP Tools

### Project Analysis
- `analyze_project` - Analyze project structure and identify documentation opportunities
- `fingerprint_project` - Generate unique project fingerprint with technology detection
- `get_project_insights` - Get AI-powered insights about documentation opportunities

### Video Capture & Compilation
- `start_capture` - Start intelligent video capture with predictive moment detection
- `stop_capture` - Stop capture and begin processing
- `get_capture_status` - Get real-time capture status and metrics
- `compile_video` - Compile video with AI optimization and professional quality
- `get_compilation_status` - Get video compilation progress and status

### AI Test Audience
- `run_test_audience` - Run AI test audience simulation with 50-100 synthetic viewers
- `generate_personas` - Generate synthetic viewer personas for testing

### Personal Branding
- `analyze_brand_performance` - Analyze personal brand evolution and performance metrics
- `get_brand_recommendations` - Get AI-powered brand optimization recommendations
- `learn_from_performance` - Update brand model with new performance data

### Authenticity & Performance
- `validate_authenticity` - Validate content authenticity and AI detection resistance
- `apply_human_fingerprint` - Apply human authenticity enhancements to content
- `get_system_metrics` - Get real-time system performance metrics
- `run_performance_benchmark` - Run comprehensive performance benchmark
- `optimize_workflow` - Get workflow optimization suggestions

## Usage Examples

```javascript
// Analyze a project
await analyze_project({
  path: "/path/to/project",
  detect_complexity: true,
  include_git_analysis: true
});

// Start video capture
await start_capture({
  project_path: "/path/to/project",
  quality: "1080p",
  ai_optimization: true
});

// Run AI test audience
await run_test_audience({
  video_id: "video-uuid",
  audience_size: 50,
  optimization_focus: ["engagement", "retention"]
});
```

## License

MIT License - Commercial use allowed