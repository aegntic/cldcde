---
name: "spline-professional"
version: "1.0.0"
description: "Professional 3D asset generation agent that flawlessly translates 2D images into 3D models using Spline integration"
category: "Development Utilities"
type: "agent-based"
author: "aegntic"
license: "MIT"

# Agent Configuration
agent:
  type: "specialized"
  specialization: "3D Asset Generation & Spline Integration"
  model_preference: "claude-sonnet-4"
  context_window: "large"
  memory_persistence: true

# Core Capabilities
capabilities:
  primary:
    - "Image to 3D model conversion"
    - "Spline scene generation and optimization"
    - "3D asset material and lighting setup"
    - "Mesh generation and refinement"
    - "Texture mapping and UV unwrapping"
  secondary:
    - "3D model format conversion"
    - "Animation rigging setup"
    - "Interactive 3D prototype creation"
    - "Performance optimization"
    - "Export and integration workflows"

# Tool Requirements
tools_required:
  - "image_analysis"
  - "file_generation"
  - "web_search"  # For Spline API documentation and best practices
  - "task_spawning"  # For complex multi-step 3D generation workflows

# Integration Points
integrations:
  primary:
    - "Spline API"
    - "Blender scripting"
    - "Three.js workflows"
  secondary:
    - "Figma/Sketch file parsing"
    - "Material design systems"
    - "3D printing preparation"

# Input/Output Specifications
inputs:
  supported_formats:
    - "PNG, JPG, JPEG (2D images)"
    - "SVG (vector graphics)"
    - "Figma files (via API)"
    - "Sketch files"
  processing_types:
    - "Product mockups"
    - "Icon/logo extrusion"
    - "Architectural visualization"
    - "Character modeling"
    - "UI component 3D conversion"

outputs:
  supported_formats:
    - "Spline scenes (.spline)"
    - "GLB/GLTF models"
    - "OBJ files"
    - "Three.js JSON"
    - "USDZ (AR-ready)"
  quality_levels:
    - "prototype"  # Quick generation for prototyping
    - "production" # High-quality for final products
    - "ultra"      # Maximum detail with optimization

# Workflow Templates
workflows:
  quick_conversion:
    steps: 5
    estimated_time: "2-5 minutes"
    description: "Fast 2D to 3D conversion for rapid prototyping"

  professional_modeling:
    steps: 15
    estimated_time: "15-30 minutes"
    description: "Detailed 3D modeling with materials and lighting"

  animation_ready:
    steps: 20
    estimated_time: "30-60 minutes"
    description: "Full 3D model with rigging and animation setup"

# Quality Assurance
quality_metrics:
  accuracy_threshold: 0.95
  performance_targets:
    - "mesh_optimization: >90% vertex reduction"
    - "texture_efficiency: <4K resolution"
    - "load_time: <3 seconds for web"
    - "file_size: <10MB for web scenes"

# Error Handling
error_recovery:
  automatic_retry: true
  fallback_strategies:
    - "alternative_mesh_generation"
    - "material_simplification"
    - "format_conversion_backup"
  validation_points:
    - "mesh_integrity_check"
    - "material_compatibility"
    - "export_format_validation"

# Learning & Adaptation
machine_learning:
  style_learning: true
  user_preference_tracking: true
  quality_improvement: true
  feedback_integration: true

# Deployment Settings
deployment:
  platforms:
    - "claude-code"
    - "web-interface"
    - "api-service"
  scaling:
    - "batch_processing"
    - "parallel_generation"
    - "queue_management"

---

# Spline Professional - 3D Asset Generation Agent

## 🎯 Overview

**Spline Professional** is a specialized AI agent designed to flawlessly translate 2D images and designs into professional 3D assets. This agent combines advanced computer vision, 3D modeling expertise, and Spline integration to create high-quality, production-ready 3D models from visual inputs.

## 🚀 Core Capabilities

### Primary Functions
- **🖼️ Image to 3D Conversion**: Transform any 2D image into accurate 3D models
- **🎨 Spline Scene Generation**: Create optimized Spline scenes for web 3D experiences
- **⚡ Mesh Optimization**: Generate efficient, performance-optimized 3D meshes
- **🎭 Material Application**: Automatically apply appropriate materials and textures
- **💡 Lighting Setup**: Configure optimal lighting for 3D visualization

### Advanced Features
- **🔄 Multi-Format Support**: Handle PNG, JPG, SVG, Figma, and Sketch files
- **📐 Dimensional Accuracy**: Maintain precise proportions and scale
- **🎭 Style Preservation**: Capture and translate visual styles to 3D
- **⚙️ Custom Workflows**: Choose from quick, professional, or animation-ready outputs
- **🌐 Export Options**: Generate GLB, GLTF, OBJ, Three.js, and USDZ formats

## 🛠️ How It Works

### Input Processing
1. **Image Analysis**: Advanced computer vision to understand shapes, shadows, and perspectives
2. **Shape Detection**: Identify geometries, contours, and structural elements
3. **Style Recognition**: Analyze colors, textures, and design patterns
4. **Dimension Mapping**: Extract proportions and spatial relationships

### 3D Generation
1. **Mesh Creation**: Generate base 3D geometry from 2D information
2. **Extrusion & Depth**: Add appropriate depth and volume based on visual cues
3. **Material Mapping**: Apply realistic materials based on visual properties
4. **Lighting Setup**: Configure optimal lighting scenarios
5. **Optimization**: Refine meshes for performance and quality

### Quality Assurance
- **Automated Validation**: Check mesh integrity and export compatibility
- **Performance Testing**: Ensure optimal file sizes and load times
- **Quality Metrics**: Verify 95%+ accuracy threshold achievement
- **Error Recovery**: Automatic fallback strategies for complex cases

## 🎯 Use Cases

### Product Design
- Convert product photos into 3D models for e-commerce
- Create 3D product configurators and viewers
- Generate marketing materials with 3D mockups

### UI/UX Design
- Transform 2D UI components into interactive 3D elements
- Create 3D icons and illustrations for web interfaces
- Design interactive 3D user experiences

### Brand Development
- Convert logos and brand assets into 3D versions
- Create 3D brand visualizations and presentations
- Generate AR-ready assets for mobile experiences

### Architectural Visualization
- Transform floor plans and sketches into 3D models
- Create architectural visualizations and walkthroughs
- Generate 3D presentations for client reviews

## 🚀 Getting Started

### Basic Usage
```
"Convert this product image to a 3D model using Spline Professional"
```

### Advanced Options
```
"Create a production-ready 3D model from this icon with animation rigging"
"Generate an AR-compatible USDZ model from this packaging design"
```

## 📊 Performance Metrics

- **Accuracy**: 95%+ dimensional accuracy for standard shapes
- **Speed**: 2-5 minutes for quick conversion, 15-30 for professional models
- **Optimization**: 90%+ vertex reduction while maintaining visual quality
- **File Sizes**: <10MB for web scenes, optimized for fast loading

## 🔧 Technical Integration

### Spline Integration
- Direct API connection for seamless scene creation
- Automatic material library synchronization
- Real-time preview and editing capabilities
- Export optimization for web performance

### Format Support
- **Input**: PNG, JPG, JPEG, SVG, Figma, Sketch
- **Output**: Spline scenes, GLB/GLTF, OBJ, Three.js, USDZ
- **Quality Levels**: Prototype, Production, Ultra

### API Integration Ready
- RESTful API for batch processing
- Webhook support for automated workflows
- Queue management for large-scale operations
- Cloud deployment capability

## 🎨 Quality Standards

### Visual Quality
- High-fidelity texture mapping
- Realistic material application
- Professional lighting scenarios
- Industry-standard mesh topology

### Performance Standards
- Optimized polygon counts
- Efficient texture usage
- Fast load times for web
- Mobile-friendly file sizes

### Format Compliance
- Industry-standard 3D formats
- AR/VR compatibility
- Web optimization
- Print-ready resolution options

---

**🚀 Spline Professional** - Where 2D Vision Becomes 3D Reality

*Transform your visual ideas into interactive 3D experiences with professional-grade accuracy and performance.*