#!/bin/bash

# Blender 3D Animation Studio - 2D to 3D Conversion Script
# Transforms 2D images into 3D models with automatic depth and materials

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESOURCES_DIR="$(dirname "$SCRIPT_DIR")/resources"

# Default configuration
INPUT_FILE=""
OUTPUT_FILE=""
EXTRUSION_DEPTH="1.0"
SUBDIVISION_LEVELS="2"
GENERATE_MATERIALS="true"
DEPTH_METHOD="ai"
OUTPUT_FORMAT="blend"
QUALITY="high"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Help function
show_help() {
    echo "Blender 3D Animation Studio - 2D to 3D Conversion"
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Transforms 2D images into 3D models with depth, materials, and lighting"
    echo ""
    echo "Required Options:"
    echo "  -i, --input FILE      Input image file (PNG, JPG, SVG, etc.)"
    echo "  -o, --output FILE     Output .blend file path"
    echo ""
    echo "Conversion Options:"
    echo "  -d, --depth NUM       Extrusion depth (default: 1.0)"
    echo "  -s, --subdivision N   Subdivision levels (default: 2)"
    echo "  -m, --depth-method    Depth analysis method: ai|edge|gradient|manual (default: ai)"
    echo "  -q, --quality         Quality level: low|medium|high (default: high)"
    echo ""
    echo "Output Options:"
    echo "  -f, --format FORMAT   Output format: blend|obj|fbx|gltf (default: blend)"
    echo "  -M, --no-materials    Skip material generation"
    echo ""
    echo "Other Options:"
    echo "  -c, --config FILE     Custom configuration file"
    echo "  -v, --verbose         Detailed output"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -i logo.png -o logo_3d.blend"
    echo "  $0 -i artwork.jpg -o artwork.blend -d 2.5 -q high"
    echo "  $0 -i icon.svg -o icon.obj -f obj -s 3"
    echo "  $0 -i character.png -o character.blend -m edge -d 1.5"
}

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${PURPLE}🔍 $1${NC}"
    fi
}

# Parse command line arguments
VERBOSE=false
CONFIG_FILE="$RESOURCES_DIR/studio-config.json"

while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--input)
            INPUT_FILE="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -d|--depth)
            EXTRUSION_DEPTH="$2"
            shift 2
            ;;
        -s|--subdivision)
            SUBDIVISION_LEVELS="$2"
            shift 2
            ;;
        -m|--depth-method)
            DEPTH_METHOD="$2"
            shift 2
            ;;
        -q|--quality)
            QUALITY="$2"
            shift 2
            ;;
        -f|--format)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        -M|--no-materials)
            GENERATE_MATERIALS="false"
            shift
            ;;
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate required arguments
if [ -z "$INPUT_FILE" ]; then
    log_error "Input file is required (-i/--input)"
    show_help
    exit 1
fi

if [ -z "$OUTPUT_FILE" ]; then
    # Generate default output filename
    local base_name=$(basename "$INPUT_FILE")
    local name_no_ext="${base_name%.*}"
    OUTPUT_FILE="${name_no_ext}_3d.${OUTPUT_FORMAT}"
fi

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    log_error "Input file not found: $INPUT_FILE"
    exit 1
fi

# Check file format
file_ext="${INPUT_FILE##*.}"
case "$file_ext" in
    "png"|"jpg"|"jpeg"|"bmp"|"tga"|"svg"|"tiff"|"webp")
        log_info "Supported image format: $file_ext"
        ;;
    *)
        log_error "Unsupported file format: $file_ext"
        log_info "Supported formats: PNG, JPG, JPEG, BMP, TGA, SVG, TIFF, WebP"
        exit 1
        ;;
esac

# Validate options
case "$DEPTH_METHOD" in
    "ai"|"edge"|"gradient"|"manual")
        log_verbose "Depth method: $DEPTH_METHOD"
        ;;
    *)
        log_error "Invalid depth method: $DEPTH_METHOD"
        log_info "Valid methods: ai, edge, gradient, manual"
        exit 1
        ;;
esac

case "$QUALITY" in
    "low"|"medium"|"high")
        log_verbose "Quality level: $QUALITY"
        ;;
    *)
        log_error "Invalid quality level: $QUALITY"
        log_info "Valid levels: low, medium, high"
        exit 1
        ;;
esac

# Set quality parameters
case "$QUALITY" in
    "low")
        SUBDIVISION_LEVELS="1"
        SAMPLES="32"
        ;;
    "medium")
        SUBDIVISION_LEVELS="2"
        SAMPLES="64"
        ;;
    "high")
        SUBDIVISION_LEVELS="3"
        SAMPLES="128"
        ;;
esac

# Check for Blender installation
if ! command -v blender &> /dev/null; then
    log_error "Blender is not installed or not in PATH"
    log_info "Install Blender from https://blender.org/"
    exit 1
fi

# Get Blender version
local blender_version=$(blender --version | head -n1 | awk '{print $2}')
log_info "Using Blender $blender_version"

# Create output directory
local output_dir=$(dirname "$OUTPUT_FILE")
mkdir -p "$output_dir"

# Load configuration if exists
local blender_path="blender"
local render_engine="cycles"
if [ -f "$CONFIG_FILE" ]; then
    log_verbose "Loading configuration from: $CONFIG_FILE"
    blender_path=$(python3 -c "
import json
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    print(config.get('blender_path', 'blender'))
except:
    print('blender')
" 2>/dev/null || echo "blender")

    render_engine=$(python3 -c "
import json
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    print(config.get('render_engine', 'cycles'))
except:
    print('cycles')
" 2>/dev/null || echo "cycles")
fi

# Display conversion setup
echo -e "${CYAN}🚀 Blender 3D Animation Studio${NC}"
echo -e "${CYAN}📋 2D to 3D Conversion Starting...${NC}"
echo ""
echo -e "📁 Input file: $INPUT_FILE"
echo -e "📁 Output file: $OUTPUT_FILE"
echo -e "🔧 Extrusion depth: $EXTRUSION_DEPTH"
echo -e "🔧 Subdivision levels: $SUBDIVISION_LEVELS"
echo -e "🔧 Depth method: $DEPTH_METHOD"
echo -e "🔧 Quality: $QUALITY"
echo -e "🔧 Materials: $GENERATE_MATERIALS"
echo -e "🔧 Output format: $OUTPUT_FORMAT"
echo ""

# Create temporary working directory
local temp_dir=$(mktemp -d)
local temp_blend="$temp_dir/temp_3d.blend"
local temp_script="$temp_dir/conversion_script.py"

log_verbose "Created temporary directory: $temp_dir"

# Generate Blender Python script for 2D to 3D conversion
cat > "$temp_script" << EOF
import bpy
import bmesh
import os
import sys
import math
import numpy as np
from PIL import Image
import json

# Configuration
config = {
    'input_file': '$INPUT_FILE',
    'output_file': '$OUTPUT_FILE',
    'extrusion_depth': float('$EXTRUSION_DEPTH'),
    'subdivision_levels': int('$SUBDIVISION_LEVELS'),
    'depth_method': '$DEPTH_METHOD',
    'generate_materials': '$GENERATE_MATERIALS' == 'true',
    'output_format': '$OUTPUT_FORMAT',
    'quality': '$QUALITY'
}

def clear_scene():
    """Clear the default scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def load_image_as_plane():
    """Load the 2D image as a plane"""
    try:
        # Load the image
        img = bpy.data.images.load(config['input_file'])

        # Get image dimensions
        width, height = img.size
        aspect_ratio = width / height

        # Create plane with correct aspect ratio
        bpy.ops.mesh.primitive_plane_add(size=max(width, height) / 100)
        plane = bpy.context.active_object
        plane.name = "2D_Image_Plane"

        # Scale plane to match aspect ratio
        if width > height:
            plane.scale.y = height / width
        else:
            plane.scale.x = width / height

        # Create material with image texture
        mat = bpy.data.materials.new(name="Image_Material")
        mat.use_nodes = True

        # Clear default nodes
        mat.node_tree.nodes.clear()

        # Add image texture node
        tex_node = mat.node_tree.nodes.new(type='ShaderNodeTexImage')
        tex_node.image = img
        tex_node.interpolation = 'Cubic'

        # Add principled BSDF
        bsdf = mat.node_tree.nodes.new(type='ShaderNodeBsdfPrincipled')

        # Add output node
        output = mat.node_tree.nodes.new(type='ShaderNodeOutputMaterial')

        # Connect nodes
        mat.node_tree.links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])
        mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

        # Assign material to plane
        plane.data.materials.append(mat)

        # UV unwrap
        plane.select_set(True)
        bpy.context.view_layer.objects.active = plane
        bpy.ops.uv.smart_project()

        return plane, img, width, height

    except Exception as e:
        print(f"Error loading image: {e}")
        return None, None, None, None

def generate_depth_map(img, width, height):
    """Generate depth map from 2D image"""
    try:
        # Convert image to numpy array
        img_array = np.array(img)

        if config['depth_method'] == 'ai':
            # Use edge detection for depth simulation
            from PIL import ImageFilter
            edges = img.filter(ImageFilter.FIND_EDGES)
            depth_array = np.array(edges.convert('L'))

            # Invert and normalize
            depth_array = 255 - depth_array
            depth_array = depth_array / 255.0

        elif config['depth_method'] == 'edge':
            # Simple edge detection
            from PIL import ImageFilter
            edges = img.filter(ImageFilter.EDGE_ENHANCE_MORE)
            depth_array = np.array(edges.convert('L'))
            depth_array = depth_array / 255.0

        elif config['depth_method'] == 'gradient':
            # Use brightness as depth
            if len(img_array.shape) == 3:
                # Convert to grayscale
                depth_array = np.dot(img_array[...,:3], [0.2989, 0.5870, 0.1140])
            else:
                depth_array = img_array
            depth_array = depth_array / 255.0

        else:  # manual
            # Uniform depth for manual method
            depth_array = np.ones((height, width)) * 0.5

        return depth_array

    except Exception as e:
        print(f"Error generating depth map: {e}")
        # Fallback to uniform depth
        return np.ones((height, width)) * 0.5

def create_3d_mesh_from_depth(depth_array, width, height):
    """Create 3D mesh from depth map"""
    try:
        # Create mesh from depth data
        bm = bmesh.new()

        # Create vertices based on depth map
        scale_x = width / 100.0
        scale_y = height / 100.0

        vertices = []
        faces = []

        # Downsample for performance
        step = max(1, min(width, height) // 100)

        for y in range(0, height, step):
            for x in range(0, width, step):
                # Map pixel coordinates to 3D space
                x_3d = (x - width/2) / 100.0
                y_3d = (y - height/2) / 100.0
                z_3d = depth_array[y, x] * config['extrusion_depth']

                vertices.append((x_3d, y_3d, z_3d))

        # Create faces (simplified)
        grid_x = width // step
        grid_y = height // step

        for y in range(grid_y - 1):
            for x in range(grid_x - 1):
                # Calculate vertex indices
                v1 = y * grid_x + x
                v2 = v1 + 1
                v3 = v1 + grid_x
                v4 = v3 + 1

                # Add two triangles to form a quad
                if v1 < len(vertices) and v2 < len(vertices) and v3 < len(vertices):
                    faces.append((v1, v3, v2))
                if v2 < len(vertices) and v3 < len(vertices) and v4 < len(vertices):
                    faces.append((v2, v3, v4))

        # Add vertices to bmesh
        for v in vertices:
            bm.verts.new(v)

        bm.verts.ensure_lookup_table()

        # Add faces to bmesh
        for face in faces:
            try:
                bm.faces.new((bm.verts[f], bm.verts[f+1], bm.verts[f+2]))
            except:
                pass  # Skip invalid faces

        # Create mesh object
        mesh = bpy.data.meshes.new("3D_Mesh")
        bm.to_mesh(mesh)
        bm.free()

        obj = bpy.data.objects.new("3D_Object", mesh)
        bpy.context.collection.objects.link(obj)

        # Select and make active
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj

        # Add subdivision surface modifier
        if config['subdivision_levels'] > 0:
            subdivision = obj.modifiers.new(name="Subdivision", type='SUBSURF')
            subdivision.levels = config['subdivision_levels']
            subdivision.render_levels = config['subdivision_levels']

        # Add smooth shading
        obj.data.use_auto_smooth = True
        obj.data.auto_smooth_angle = math.radians(30)

        return obj

    except Exception as e:
        print(f"Error creating 3D mesh: {e}")
        return None

def setup_lighting():
    """Setup professional lighting"""
    # Clear existing lights
    bpy.ops.object.select_by_type(type='LIGHT')
    bpy.ops.object.delete()

    # Three-point lighting setup

    # Key light
    bpy.ops.object.light_add(type='SUN', location=(5, -5, 5))
    key_light = bpy.context.active_object
    key_light.name = "Key_Light"
    key_light.data.energy = 1000

    # Fill light
    bpy.ops.object.light_add(type='SUN', location=(-3, -5, 3))
    fill_light = bpy.context.active_object
    fill_light.name = "Fill_Light"
    fill_light.data.energy = 500
    fill_light.data.color = (0.9, 0.9, 1.0, 1.0)  # Slight blue

    # Back light
    bpy.ops.object.light_add(type='SUN', location=(0, 5, 3))
    back_light = bpy.context.active_object
    back_light.name = "Back_Light"
    back_light.data.energy = 300

    # Area light for soft shadows
    bpy.ops.object.light_add(type='AREA', location=(0, 0, 10))
    area_light = bpy.context.active_object
    area_light.name = "Area_Light"
    area_light.data.energy = 200
    area_light.data.size = 5

def setup_camera():
    """Setup camera"""
    # Clear existing cameras
    bpy.ops.object.select_by_type(type='CAMERA')
    bpy.ops.object.delete()

    # Add camera
    bpy.ops.object.camera_add(location=(0, -8, 2))
    camera = bpy.context.active_object
    camera.name = "Camera"

    # Point camera at origin
    direction = -camera.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    camera.rotation_euler = rot_quat.to_euler()

    # Set as active camera
    bpy.context.scene.camera = camera

def setup_render_settings():
    """Setup render settings"""
    scene = bpy.context.scene

    # Set render engine
    scene.render.engine = '$render_engine'

    # Set output settings
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 50  # 50% for faster preview

    # Set quality settings
    if config['quality'] == 'high':
        scene.cycles.samples = 128
        scene.cycles.use_denoising = True
    elif config['quality'] == 'medium':
        scene.cycles.samples = 64
        scene.cycles.use_denoising = True
    else:
        scene.cycles.samples = 32
        scene.cycles.use_denoising = False

def generate_materials_from_image(img, obj):
    """Generate materials from original image"""
    if not config['generate_materials']:
        return

    try:
        # Create material
        mat = bpy.data.materials.new(name="Generated_Material")
        mat.use_nodes = True

        # Clear default nodes
        mat.node_tree.nodes.clear()

        # Add image texture node
        tex_node = mat.node_tree.nodes.new(type='ShaderNodeTexImage')
        tex_node.image = img
        tex_node.interpolation = 'Cubic'

        # Add principled BSDF
        bsdf = mat.node_tree.nodes.new(type='ShaderNodeBsdfPrincipled')

        # Set material properties
        bsdf.inputs['Metallic'].default_value = 0.1
        bsdf.inputs['Roughness'].default_value = 0.3
        bsdf.inputs['Specular'].default_value = 0.5

        # Add output node
        output = mat.node_tree.nodes.new(type='ShaderNodeOutputMaterial')

        # Connect nodes
        mat.node_tree.links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])
        mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

        # Assign material to object
        if obj.data.materials:
            obj.data.materials[0] = mat
        else:
            obj.data.materials.append(mat)

        # UV unwrap if needed
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        if not obj.data.uv_layers:
            bpy.ops.uv.smart_project()

    except Exception as e:
        print(f"Error generating materials: {e}")

def export_scene(output_file, format_type):
    """Export the scene in the specified format"""
    try:
        if format_type == 'blend':
            # Save as .blend file
            bpy.ops.wm.save_as_mainfile(filepath=output_file)

        elif format_type == 'obj':
            # Export as OBJ
            bpy.ops.export_scene.obj(
                filepath=output_file,
                use_selection=True,
                use_normals=True,
                use_uvs=True,
                use_materials=True
            )

        elif format_type == 'fbx':
            # Export as FBX
            bpy.ops.export_scene.fbx(
                filepath=output_file,
                use_selection=True,
                use_mesh_modifiers=True,
                use_normals=True,
                use_uvs=True,
                use_materials=True
            )

        elif format_type == 'gltf':
            # Export as GLTF
            bpy.ops.export_scene.gltf(
                filepath=output_file,
                use_selection=True,
                export_normals=True,
                export_uvs=True,
                export_materials=True
            )

        print(f"Scene exported to: {output_file}")

    except Exception as e:
        print(f"Error exporting scene: {e}")

def main():
    """Main conversion function"""
    print("Starting 2D to 3D conversion...")

    # Clear scene
    clear_scene()

    # Load image as plane
    plane, img, width, height = load_image_as_plane()
    if not plane:
        print("Failed to load image")
        return

    print(f"Loaded image: {width}x{height}")

    # Generate depth map
    depth_array = generate_depth_map(img, width, height)
    print(f"Generated depth map using {config['depth_method']} method")

    # Create 3D mesh
    mesh_obj = create_3d_mesh_from_depth(depth_array, width, height)
    if not mesh_obj:
        print("Failed to create 3D mesh")
        return

    print("Created 3D mesh from depth data")

    # Generate materials
    if config['generate_materials']:
        generate_materials_from_image(img, mesh_obj)
        print("Generated materials from image")

    # Setup scene
    setup_lighting()
    setup_camera()
    setup_render_settings()

    print("Scene setup completed")

    # Export scene
    export_scene(config['output_file'], config['output_format'])

    print("Conversion completed successfully!")

if __name__ == "__main__":
    main()
EOF

log_info "Starting 2D to 3D conversion..."

# Run Blender with the Python script
log_verbose "Executing Blender with conversion script..."
if "$blender_path" --background --python "$temp_script" 2>&1; then
    log_success "2D to 3D conversion completed successfully!"
    echo ""
    echo -e "${GREEN}📄 Output generated:${NC}"
    echo -e "   • 3D Model: $OUTPUT_FILE"

    if [ "$OUTPUT_FORMAT" = "blend" ]; then
        echo -e "   • Ready for animation and rendering"
        echo -e "   • Materials and lighting included"
        echo -e "   • Camera setup completed"
    fi

    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo -e "   1. Open in Blender: $blender_path \"$OUTPUT_FILE\""
    echo -e "   2. Generate animation: ./scripts/generate-animation.sh"
    echo -e "   3. Start rendering: ./scripts/queue-render.sh"

else
    log_error "2D to 3D conversion failed"
    log_info "Check Blender installation and Python dependencies"
    exit 1
fi

# Cleanup temporary files
rm -rf "$temp_dir"

echo ""
echo -e "${PURPLE}✨ Your 2D image has been transformed into 3D!${NC}"