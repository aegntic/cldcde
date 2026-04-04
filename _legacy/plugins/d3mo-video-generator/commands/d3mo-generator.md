---
name: d3mo-generator
description: Professional video production system using Remotion and advanced animation techniques for demos, tutorials, and marketing content by ae.ltd
version: 1.0.0
parameters:
  type: object
  properties:
    action:
      type: string
      enum: [generate, record, animate, optimize, deploy, template, preview, render]
      description: D3MO video production action to perform
    video_type:
      type: string
      enum: [executive-presentation, saas-demo, marketing-campaign, tutorial-series, product-launch, corporate-training, social-stories]
      description: Type of video to generate
    template_style:
      type: string
      enum: [cinematic, modern-minimal, corporate-bold, tech-focused, creative-dynamic, professional-clean]
      default: "modern-minimal"
      description: Visual style and template design approach
    target_platforms:
      type: array
      items:
        type: string
        enum: [youtube, instagram, tiktok, linkedin, website, twitter, facebook, vimeo]
      description: Platforms to optimize video for
    duration:
      type: string
      enum: [30s, 60s, 90s, 2min, 3min, 5min, custom]
      default: "60s"
      description: Target video duration
    recording_options:
      type: object
      properties:
        screen_capture:
          type: boolean
          default: false
          description: Include screen recording with smart effects
        cursor_tracking:
          type: boolean
          default: true
          description: Enable intelligent cursor tracking and highlights
        auto_zoom:
          type: boolean
          default: true
          description: Automatic zoom and pan effects
        audio_source:
          type: string
          enum: [microphone, system-audio, both, none]
          default: "microphone"
          description: Audio input source for recording
      description: Screen recording and audio configuration
    animation_features:
      type: array
      items:
        type: string
        enum: [3d-transforms, advanced-easing, data-visualization, interactive-elements, particle-effects, text-animations, logo-intro]
      description: Advanced animation features to include
    quality_settings:
      type: string
      enum: [draft, standard, high-quality, 4k, cinema]
      default: "high-quality"
      description: Video rendering quality and resolution
    branding:
      type: object
      properties:
        logo_url:
          type: string
          description: Company or product logo URL
        color_scheme:
          type: array
          items:
            type: string
          description: Brand color palette (hex codes)
        font_family:
          type: string
          default: "Inter"
          description: Typography family for text elements
        brand_guidelines:
          type: string
          description: URL to brand guidelines document
      description: Brand identity and style configuration
  required: [action, video_type]
---

# D3MO Video Generator by ae.ltd

**ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ**
**ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ**

Professional video production system that transforms Claude into a complete video studio using Remotion and advanced animation techniques. Create stunning demos, tutorials, and marketing content with AI-enhanced production workflows.

## Core Capabilities

- **Advanced Remotion Engine**: Professional-grade TypeScript compositions with type safety
- **AI-Enhanced Screen Recording**: Intelligent cursor tracking, auto-zoom, and smart highlights
- **Multi-Platform Optimization**: Native format optimization for YouTube, Instagram, TikTok, LinkedIn
- **Professional Post-Processing**: Color grading, audio enhancement, subtitle generation
- **Template Library**: 50+ professional templates across industries and use cases
- **Performance Monitoring**: GPU acceleration, render time optimization, quality metrics
- **Quality Assurance**: 10-category automated testing with accessibility compliance

## Video Production Templates

### Executive Presentations
- **Cinematic Openings**: Professional brand reveals with dramatic effects
- **Data Visualization**: Interactive charts, graphs, and animated statistics
- **Corporate Storytelling**: Narrative-driven presentations with emotional impact
- **Boardroom Quality**: Professional-grade content suitable for executive audiences

### SaaS Platform Demos
- **Interactive Screen Recording**: Smart cursor tracking with automatic zoom highlights
- **Feature Showcases**: Step-by-step product demonstrations with smooth transitions
- **Browser Chrome Simulation**: Authentic browser interface for realistic demos
- **Performance Metrics**: Real-time performance indicators and success metrics

### Marketing Campaigns
- **High-Energy Openings**: Attention-grabbing intros with dynamic effects
- **Value Proposition**: Clear benefit communication with visual demonstrations
- **Social Proof Integration**: Customer testimonials and case study highlights
- **Conversion-Focused**: Strategic CTAs optimized for viewer action

### Tutorial Series
- **Educational Content**: Professional learning modules with clear explanations
- **Interactive Elements**: On-screen annotations, quizzes, and engagement features
- **Progressive Complexity**: Structured content from beginner to advanced
- **Assessment Integration**: Knowledge checks and certificate generation

### Product Launches
- **Dramatic Reveals**: Cinematic product reveals with countdown timers
- **Feature Highlighting**: Key features showcased with compelling visuals
- **Urgency Elements**: Limited-time messaging and scarcity indicators
- **Cross-Platform Campaigns**: Coordinated launch across multiple platforms

## Commands

### `/d3mo-generator generate [parameters]`
Generate complete video productions with AI-enhanced content and professional animations.

**Usage Examples:**
```bash
# Generate executive presentation
/d3mo-generator generate action=generate video_type=executive-presentation template_style=cinematic duration=3min quality_settings=4k

# Create SaaS platform demo with screen recording
/d3mo-generator generate action=generate video_type=saas-demo recording_options='{"screen_capture": true, "cursor_tracking": true, "auto_zoom": true}' target_platforms='["youtube", "website"]'

# Produce marketing campaign video
/d3mo-generator generate action=generate video_type=marketing-campaign template_style=creative-dynamic animation_features='["3d-transforms", "particle-effects", "logo-intro"]'

# Generate tutorial series
/d3mo-generator generate action=generate video_type=tutorial-series duration=5min quality_settings=high-quality animation_features='["interactive-elements", "data-visualization"]'
```

### `/d3mo-generator record [parameters]`
Capture intelligent screen recordings with AI-enhanced effects and professional production.

**Usage Examples:**
```bash
# Record software demo with smart effects
/d3mo-generator record action=record video_type=saas-demo recording_options='{"screen_capture": true, "cursor_tracking": true, "auto_zoom": true, "audio_source": "microphone"}'

# Record tutorial with system audio
/d3mo-generator record action=record video_type=tutorial-series recording_options='{"screen_capture": true, "audio_source": "system-audio", "cursor_tracking": true}'

# Record presentation with voiceover
/d3mo-generator record action=record video_type=executive-presentation recording_options='{"audio_source": "microphone", "cursor_tracking": false}'
```

### `/d3mo-generator animate [parameters]`
Create advanced animations with sophisticated effects and professional motion graphics.

**Usage Examples:**
```bash
# Create cinematic 3D animations
/d3mo-generator animate action=animate video_type=executive-presentation animation_features='["3d-transforms", "advanced-easing", "logo-intro"]' template_style=cinematic

# Generate data visualization animations
/d3mo-generator animate action=animate video_type=marketing-campaign animation_features='["data-visualization", "text-animations"]' quality_settings=4k

# Create interactive tutorial animations
/d3mo-generator animate action=animate video_type=tutorial-series animation_features='["interactive-elements", "particle-effects"]'
```

### `/d3mo-generator optimize [parameters]`
Optimize videos for maximum performance and platform compatibility.

**Usage Examples:**
```bash
# Optimize for multiple platforms
/d3mo-generator optimize action=optimize target_platforms='["youtube", "instagram", "tiktok", "linkedin"]' quality_settings=high-quality

# Mobile optimization
/d3mo-generator optimize action=optimize target_platforms='["instagram", "tiktok"]' quality_settings=standard

# Website optimization with adaptive streaming
/d3mo-generator optimize action=optimize target_platforms='["website"]' quality_settings=4k
```

### `/d3mo-generator deploy [parameters]`
Deploy optimized videos across multiple platforms with automated distribution.

**Usage Examples:**
```bash
# Deploy to social media platforms
/d3mo-generator deploy action=deploy target_platforms='["youtube", "instagram", "tiktok"]' video_type=marketing-campaign

# Deploy to website and LinkedIn
/d3mo-generator deploy action=deploy target_platforms='["website", "linkedin"]' video_type=executive-presentation

# Deploy tutorial series
/d3mo-generator deploy action=deploy target_platforms='["youtube", "website"]' video_type=tutorial-series
```

### `/d3mo-generator template [parameters]`
Access and customize professional video templates with brand integration.

**Usage Examples:**
```bash
# Create custom branded template
/d3mo-generator template action=template video_type=executive-presentation branding='{"logo_url": "https://company.com/logo.png", "color_scheme": ["#1a1a1a", "#0066cc"], "font_family": "Inter"}'

# Generate marketing template variations
/d3mo-generator template action=template video_type=marketing-campaign template_style=creative-dynamic

# Create tutorial template series
/d3mo-generator template action=template video_type=tutorial-series animation_features='["interactive-elements", "data-visualization"]'
```

### `/d3mo-generator preview [parameters]`
Generate real-time previews and iterations for video production refinement.

**Usage Examples:**
```bash
# Preview executive presentation
/d3mo-generator preview action=preview video_type=executive-presentation quality_settings=standard

# Preview marketing campaign variations
/d3mo-generator preview action=preview video_type=marketing-campaign template_style='["modern-minimal", "creative-dynamic"]'

# Preview multi-platform versions
/d3mo-generator preview action=preview target_platforms='["youtube", "instagram", "tiktok"]'
```

### `/d3mo-generator render [parameters]`
Render final videos with professional quality and platform-specific optimization.

**Usage Examples:**
```bash
# Render 4K cinema quality
/d3mo-generator render action=render quality_settings=4k video_type=executive-presentation

# Render multi-platform package
/d3mo-generator render action=render target_platforms='["youtube", "instagram", "tiktok", "linkedin"]' quality_settings=high-quality

# Render with custom branding
/d3mo-generator render action=render branding='{"logo_url": "https://company.com/logo.png", "color_scheme": ["#1a1a1a", "#0066cc"]}'
```

## Advanced Features

### AI-Enhanced Screen Recording
- **Smart Cursor Tracking**: AI-powered cursor movement prediction and highlighting
- **Automatic Zoom**: Intelligent zoom-in on relevant UI elements and interactions
- **Noise Reduction**: Advanced audio cleanup and enhancement for voice recordings
- **Real-time Effects**: Live preview of effects during recording sessions

### Professional Animation System
- **Advanced Easing Functions**: Professional bezier curves and timing control
- **3D Transform Support**: Perspective effects and depth manipulation
- **Component Architecture**: Modular, reusable animation components
- **Data Visualization**: Animated charts, graphs, and statistical displays

### Multi-Platform Optimization
- **YouTube**: 1920x1080, 8Mbps, professional encoding with chapters
- **Instagram**: 1080x1920, 5Mbps, mobile-optimized with story format
- **TikTok**: 1080x1920, 4Mbps, short-form optimized with trends
- **LinkedIn**: 1920x1080, 6Mbps, professional quality with captions
- **Website**: Multiple resolutions with adaptive streaming support

### Quality Assurance Framework
- **Automated Testing**: 10-category comprehensive validation system
- **Performance Monitoring**: Real-time rendering analysis and optimization
- **Cross-Platform Compatibility**: Browser and device optimization testing
- **Accessibility Compliance**: WCAG 2.1 standards validation

## Performance Metrics

### Production Efficiency
- **10x faster** video generation with GPU acceleration
- **95% reduction** in manual video production time
- **50+ professional** templates across industries
- **4K cinema** quality rendering support

### Quality Standards
- **Professional broadcast** quality with color grading
- **Automated quality assurance** with 10-category validation
- **Cross-platform** optimization for 10+ platforms
- **Accessibility compliance** with WCAG 2.1 standards

## Integration Examples

### Complete Product Launch Campaign
```bash
# Generate launch video
/d3mo-generator generate action=generate video_type=product-launch template_style=cinematic animation_features='["3d-transforms", "particle-effects", "logo-intro"]'

# Create social media versions
/d3mo-generator optimize action=optimize target_platforms='["instagram", "tiktok", "youtube"]'

# Deploy across platforms
/d3mo-generator deploy action=deploy target_platforms='["youtube", "instagram", "tiktok", "linkedin"]'
```

### SaaS Platform Demo Production
```bash
# Record screen capture with effects
/d3mo-generator record action=record video_type=saas-demo recording_options='{"screen_capture": true, "cursor_tracking": true, "auto_zoom": true}'

# Add professional animations
/d3mo-generator animate action=animate video_type=saas-demo animation_features='["data-visualization", "text-animations"]'

# Optimize for multiple platforms
/d3mo-generator optimize action=optimize target_platforms='["youtube", "website"]'
```

### Executive Presentation Series
```bash
# Create cinematic presentation
/d3mo-generator generate action=generate video_type=executive-presentation template_style=cinematic quality_settings=4k

# Add branding customization
/d3mo-generator template action=template branding='{"logo_url": "https://company.com/logo.png", "color_scheme": ["#1a1a1a", "#0066cc"]}'

# Render professional quality
/d3mo-generator render action=render quality_settings=4k
```

## Technical Specifications

### Rendering Pipeline
- **GPU Acceleration**: NVIDIA CUDA and Apple Silicon Metal support
- **Real-time Preview**: Live editing and adjustments during production
- **Version Control**: Template and project management with Git integration
- **API Integration**: External service connectivity for automated workflows

### Audio Processing
- **Enhancement**: AI-powered noise reduction and audio cleanup
- **Synchronization**: Perfect audio-to-video sync with beat detection
- **Multi-track**: Multiple audio tracks with mixing and mastering
- **Voice-over**: Text-to-speech integration with natural voices

### Post-Processing
- **Color Grading**: Professional color correction and grading
- **Audio Enhancement**: Advanced audio processing and cleanup
- **Subtitle Generation**: Automated subtitle creation and synchronization
- **Format Optimization**: Platform-specific encoding and compression

---

**Built by the AEGNTIC AI Ecosystems team**
**Professional video production with Remotion and AI enhancement**
**ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ**

**Website: https://cldcde.cc/plugins/d3mo-video-generator**
**Support: research@aegntic.ai**