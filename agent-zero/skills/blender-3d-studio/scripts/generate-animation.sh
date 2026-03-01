#!/bin/bash

# Blender 3D Animation Studio - Animation Generator
# Generates procedural animations for 3D models

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESOURCES_DIR="$(dirname "$SCRIPT_DIR")/resources"

# Default configuration
INPUT_FILE=""
OUTPUT_FILE=""
ANIMATION_TYPE="rotate_spin"
DURATION="30"
FRAME_RATE="30"
EASE_IN="true"
EASE_OUT="true"
LOOP_ANIMATION="false"

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
    echo "Blender 3D Animation Studio - Animation Generator"
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Generates procedural animations for 3D models"
    echo ""
    echo "Required Options:"
    echo "  -i, --input FILE      Input .blend file"
    echo "  -o, --output FILE     Output .blend file path"
    echo ""
    echo "Animation Options:"
    echo "  -t, --type TYPE       Animation type (default: rotate_spin)"
    echo "  -d, --duration SEC    Animation duration in seconds (default: 30)"
    echo "  -f, --fps FPS         Frame rate (default: 30)"
    echo "  -l, --loop            Loop animation (default: false)"
    echo ""
    echo "Easing Options:"
    echo "  --ease-in             Enable ease-in (default: true)"
    echo "  --ease-out            Enable ease-out (default: true)"
    echo ""
    echo "Other Options:"
    echo "  -c, --config FILE     Custom configuration file"
    echo "  -v, --verbose         Detailed output"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Animation Types:"
    echo "  rotate_spin           Rotation and spinning motion"
    echo "  bounce               Physics-based bouncing"
    echo "  morph                Shape morphing and transformation"
    echo "  camera               Camera movement and tracking"
    echo "  particle             Particle effects and simulation"
    echo "  wave                 Wave deformation animation"
    echo ""
    echo "Examples:"
    echo "  $0 -i model.blend -o animated_model.blend"
    echo "  $0 -i logo.blend -o logo_spin.blend -t rotate_spin -d 15"
    echo "  $0 -i character.blend -o character_bounce.blend -t bounce -l"
    echo "  $0 -i scene.blend -o scene_camera.blend -t camera -d 20"
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
        -t|--type)
            ANIMATION_TYPE="$2"
            shift 2
            ;;
        -d|--duration)
            DURATION="$2"
            shift 2
            ;;
        -f|--fps)
            FRAME_RATE="$2"
            shift 2
            ;;
        -l|--loop)
            LOOP_ANIMATION="true"
            shift
            ;;
        --ease-in)
            EASE_IN="true"
            shift
            ;;
        --ease-out)
            EASE_OUT="true"
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
    OUTPUT_FILE="${name_no_ext}_${ANIMATION_TYPE}.blend"
fi

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    log_error "Input file not found: $INPUT_FILE"
    exit 1
fi

# Validate animation type
case "$ANIMATION_TYPE" in
    "rotate_spin"|"bounce"|"morph"|"camera"|"particle"|"wave")
        log_verbose "Animation type: $ANIMATION_TYPE"
        ;;
    *)
        log_error "Invalid animation type: $ANIMATION_TYPE"
        log_info "Valid types: rotate_spin, bounce, morph, camera, particle, wave"
        exit 1
        ;;
esac

# Validate numeric parameters
if ! [[ "$DURATION" =~ ^[0-9]+(\.[0-9]+)?$ ]] || [ "$(echo "$DURATION < 1" | bc -l)" -eq 1 ]; then
    log_error "Invalid duration: $DURATION (must be >= 1 second)"
    exit 1
fi

if ! [[ "$FRAME_RATE" =~ ^[0-9]+$ ]] || [ "$FRAME_RATE" -lt 12 ] || [ "$FRAME_RATE" -gt 120 ]; then
    log_error "Invalid frame rate: $FRAME_RATE (must be 12-120)"
    exit 1
fi

# Check for Blender installation
if ! command -v blender &> /dev/null; then
    log_error "Blender is not installed or not in PATH"
    exit 1
fi

# Create output directory
local output_dir=$(dirname "$OUTPUT_FILE")
mkdir -p "$output_dir"

# Calculate total frames
local total_frames=$(echo "$DURATION * $FRAME_RATE" | bc)

# Display animation setup
echo -e "${CYAN}🚀 Blender 3D Animation Studio${NC}"
echo -e "${CYAN}🎬 Animation Generation Starting...${NC}"
echo ""
echo -e "📁 Input file: $INPUT_FILE"
echo -e "📁 Output file: $OUTPUT_FILE"
echo -e "🎭 Animation type: $ANIMATION_TYPE"
echo -e "⏱️  Duration: $DURATION seconds"
echo -e "🎞️  Frame rate: $FRAME_RATE fps"
echo -e "🎞️  Total frames: $total_frames"
echo -e "🔄 Loop: $LOOP_ANIMATION"
echo -e "🎢 Ease-in: $EASE_IN"
echo -e "🎢 Ease-out: $EASE_OUT"
echo ""

# Create temporary working directory
local temp_dir=$(mktemp -d)
local temp_script="$temp_dir/animation_script.py"

log_verbose "Created temporary directory: $temp_dir"

# Generate Blender Python script for animation
cat > "$temp_script" << EOF
import bpy
import math
import random
from datetime import datetime

# Configuration
config = {
    'input_file': '$INPUT_FILE',
    'output_file': '$OUTPUT_FILE',
    'animation_type': '$ANIMATION_TYPE',
    'duration': float('$DURATION'),
    'frame_rate': int('$FRAME_RATE'),
    'total_frames': $total_frames,
    'ease_in': '$EASE_IN' == 'true',
    'ease_out': '$EASE_OUT' == 'true',
    'loop_animation': '$LOOP_ANIMATION' == 'true'
}

def ease_in_out_cubic(t):
    """Cubic ease-in-out function"""
    if config['ease_in'] and t < 0.5:
        return 4 * t * t * t
    elif config['ease_out'] and t >= 0.5:
        return 1 - pow(-2 * t + 2, 3) / 2
    else:
        return t

def setup_scene():
    """Setup scene for animation"""
    # Set frame rate and duration
    scene = bpy.context.scene
    scene.render.fps = config['frame_rate']
    scene.frame_end = config['total_frames']

    # Set render settings for preview
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 25  # 25% for faster preview

    # Enable motion blur for better animation quality
    scene.render.use_motion_blur = True
    scene.render.motion_blur_shutter = 0.5

def animate_rotate_spin():
    """Animate rotation and spinning"""
    objects = bpy.context.selected_objects
    if not objects:
        objects = bpy.context.scene.objects

    for obj in objects:
        if obj.type == 'MESH':
            # Clear existing animation
            obj.animation_data_clear()

            # Set keyframes for rotation
            obj.rotation_euler = (0, 0, 0)
            obj.keyframe_insert(data_path="rotation_euler", frame=1)

            # Rotation animation
            total_rotation = 6.28319  # 2π radians (360 degrees)

            for frame in range(1, config['total_frames'] + 1):
                t = frame / config['total_frames']
                eased_t = ease_in_out_cubic(t)

                # Multiple axis rotation for complex motion
                rotation_x = total_rotation * eased_t * 0.3
                rotation_y = total_rotation * eased_t * 0.7
                rotation_z = total_rotation * eased_t

                obj.rotation_euler = (rotation_x, rotation_y, rotation_z)
                obj.keyframe_insert(data_path="rotation_euler", frame=frame)

            # Set interpolation to ease-in-out
            if obj.animation_data and obj.animation_data.action:
                for fcurve in obj.animation_data.action.fcurves:
                    for keyframe in fcurve.keyframe_points:
                        keyframe.interpolation = 'AUTO'

def animate_bounce():
    """Animate bouncing motion"""
    objects = bpy.context.selected_objects
    if not objects:
        objects = bpy.context.scene.objects

    for obj in objects:
        if obj.type == 'MESH':
            # Clear existing animation
            obj.animation_data_clear()

            # Store original location
            original_location = obj.location.copy()

            # Bounce animation parameters
            bounce_height = 2.0
            bounce_frequency = 3.0  # Number of bounces

            for frame in range(1, config['total_frames'] + 1):
                t = frame / config['total_frames']
                eased_t = ease_in_out_cubic(t)

                # Parabolic bounce motion
                bounce_phase = t * bounce_frequency * 2 * math.pi
                bounce_y = abs(math.sin(bounce_phase)) * bounce_height * (1 - t * 0.3)  # Decay

                # Apply bounce with easing
                obj.location.z = original_location.z + bounce_y
                obj.keyframe_insert(data_path="location", frame=frame)

            # Add subtle rotation during bounce
            for frame in range(1, config['total_frames'] + 1):
                t = frame / config['total_frames']
                eased_t = ease_in_out_cubic(t)

                bounce_phase = t * bounce_frequency * 2 * math.pi
                rotation_x = math.sin(bounce_phase) * 0.2

                obj.rotation_euler.x = rotation_x
                obj.keyframe_insert(data_path="rotation_euler", frame=frame)

def animate_morph():
    """Animate shape morphing"""
    objects = bpy.context.selected_objects
    if not objects:
        objects = bpy.context.scene.objects

    for obj in objects:
        if obj.type == 'MESH':
            # Add shape keys if they don't exist
            if not obj.data.shape_keys:
                obj.shape_key_add(name='Basis')

            # Add shape key for morphing
            shape_key = obj.shape_key_add(name='Morph')
            shape_key.value = 0.0

            # Animate shape key
            for frame in range(1, config['total_frames'] + 1):
                t = frame / config['total_frames']
                eased_t = ease_in_out_cubic(t)

                # Sinusoidal morphing
                morph_value = (math.sin(t * math.pi * 2) + 1) / 2 * eased_t

                shape_key.value = morph_value
                shape_key.keyframe_insert(data_path="value", frame=frame)

            # Add scale animation for additional effect
            for frame in range(1, config['total_frames'] + 1):
                t = frame / config['total_frames']
                eased_t = ease_in_out_cubic(t)

                scale_factor = 1.0 + math.sin(t * math.pi * 3) * 0.1 * eased_t

                obj.scale = (scale_factor, scale_factor, scale_factor)
                obj.keyframe_insert(data_path="scale", frame=frame)

def animate_camera():
    """Animate camera movement"""
    # Find or create camera
    camera = None
    for obj in bpy.context.scene.objects:
        if obj.type == 'CAMERA':
            camera = obj
            break

    if not camera:
        bpy.ops.object.camera_add(location=(0, -10, 2))
        camera = bpy.context.active_object

    # Set as active camera
    bpy.context.scene.camera = camera

    # Animate camera movement
    camera.animation_data_clear()

    # Define camera path
    radius = 8.0
    height = 2.0

    for frame in range(1, config['total_frames'] + 1):
        t = frame / config['total_frames']
        eased_t = ease_in_out_cubic(t)

        # Circular camera movement
        angle = t * math.pi * 2  # Full circle

        x = math.cos(angle) * radius
        y = math.sin(angle) * radius
        z = height + math.sin(angle * 2) * 1.0  # Vertical variation

        camera.location = (x, y, z)

        # Point camera at origin
        direction = -camera.location
        rot_quat = direction.to_track_quat('-Z', 'Y')
        camera.rotation_euler = rot_quat.to_euler()

        camera.keyframe_insert(data_path="location", frame=frame)
        camera.keyframe_insert(data_path="rotation_euler", frame=frame)

def animate_particle():
    """Animate particle effects"""
    # Find mesh objects
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']

    if not mesh_objects:
        print("No mesh objects found for particle animation")
        return

    # Create particle system for first mesh object
    obj = mesh_objects[0]

    # Clear existing particle systems
    obj.modifiers.clear()

    # Add particle system
    bpy.ops.object.particle_system_add()
    particle_system = obj.particle_systems.active
    settings = particle_system.settings

    # Configure particle system
    settings.type = 'EMITTER'
    settings.emit_from = 'FACE'
    settings.count = 1000
    settings.frame_start = 1
    settings.frame_end = config['total_frames']
    settings.lifetime = 60
    settings.lifetime_random = 0.5
    settings.normal_factor = 1.0
    settings.factor_random = 0.5
    settings.angular_velocity_factor = 1.0
    settings.use_rotations = True
    settings.rotation_factor_random = 1.0

    # Set particle size
    settings.particle_size = 0.1
    settings.size_random = 0.5

    # Use physics
    settings.physics_type = 'NEWTON'
    settings.mass = 0.01
    settings.use_size = True
    settings.size_random = 0.5

def animate_wave():
    """Animate wave deformation"""
    objects = bpy.context.selected_objects
    if not objects:
        objects = bpy.context.scene.objects

    for obj in objects:
        if obj.type == 'MESH':
            # Add wave modifier
            wave_modifier = obj.modifiers.new(name="Wave", type='WAVE')

            # Configure wave modifier
            wave_modifier.use_x = True
            wave_modifier.use_y = True
            wave_modifier.use_z = False

            wave_modifier.falloff = 'SPHERE'
            wave_modifier.height = 0.5

            # Animate wave offset
            for frame in range(1, config['total_frames'] + 1):
                t = frame / config['total_frames']
                eased_t = ease_in_out_cubic(t)

                # Wave animation
                offset = eased_t * 5.0  # Wave travels 5 units

                wave_modifier.offset = offset
                wave_modifier.keyframe_insert(data_path="offset", frame=frame)

def main():
    """Main animation function"""
    print("Starting animation generation...")

    # Load the input file
    bpy.ops.wm.open_mainfile(filepath=config['input_file'])

    # Setup scene
    setup_scene()

    # Generate animation based on type
    if config['animation_type'] == 'rotate_spin':
        animate_rotate_spin()
        print("Generated rotate_spin animation")

    elif config['animation_type'] == 'bounce':
        animate_bounce()
        print("Generated bounce animation")

    elif config['animation_type'] == 'morph':
        animate_morph()
        print("Generated morph animation")

    elif config['animation_type'] == 'camera':
        animate_camera()
        print("Generated camera animation")

    elif config['animation_type'] == 'particle':
        animate_particle()
        print("Generated particle animation")

    elif config['animation_type'] == 'wave':
        animate_wave()
        print("Generated wave animation")

    # Save the animated file
    bpy.ops.wm.save_as_mainfile(filepath=config['output_file'])

    print(f"Animation completed: {config['output_file']}")

if __name__ == "__main__":
    main()
EOF

log_info "Generating $ANIMATION_TYPE animation..."

# Get Blender path
local blender_path="blender"
if [ -f "$CONFIG_FILE" ]; then
    blender_path=$(python3 -c "
import json
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    print(config.get('blender_path', 'blender'))
except:
    print('blender')
" 2>/dev/null || echo "blender")
fi

# Run Blender with the animation script
log_verbose "Executing Blender with animation script..."
if "$blender_path" --background "$INPUT_FILE" --python "$temp_script" 2>&1; then
    log_success "$ANIMATION_TYPE animation generated successfully!"
    echo ""
    echo -e "${GREEN}📄 Animation created:${NC}"
    echo -e "   • Input: $INPUT_FILE"
    echo -e "   • Output: $OUTPUT_FILE"
    echo -e "   • Type: $ANIMATION_TYPE"
    echo -e "   • Duration: $DURATION seconds"
    echo -e "   • Frames: $total_frames @ $FRAME_RATE fps"

    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo -e "   1. Play animation: $blender_path \"$OUTPUT_FILE\""
    echo -e "   2. Render frames: ./scripts/queue-render.sh -i \"$OUTPUT_FILE\""
    echo -e "   3. Create video: ffmpeg -r $FRAME_RATE -i frame_%04d.png -c:v libx264 output.mp4"

else
    log_error "Animation generation failed"
    log_info "Check Blender installation and file compatibility"
    exit 1
fi

# Cleanup temporary files
rm -rf "$temp_dir"

echo ""
echo -e "${PURPLE}✨ Your 3D model is now animated!${NC}"