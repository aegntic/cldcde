#!/bin/bash

# Simplified test script for 2D to 3D conversion
set -e

echo "🚀 Blender 3D Animation Studio - Test Conversion"
echo ""

# Check if Blender is available
if ! command -v blender &> /dev/null; then
    echo "❌ Blender is not installed or not in PATH"
    echo "Please install Blender from https://blender.org/"
    exit 1
fi

echo "✅ Blender found: $(blender --version | head -n1)"

# Check if input file exists
INPUT_FILE="infinity_symbol.png"
if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Input file not found: $INPUT_FILE"
    exit 1
fi

echo "✅ Input file found: $INPUT_FILE"

# Create simple Python script for 2D to 3D conversion
cat > convert_2d_to_3d.py << 'EOF'
import bpy
import os
import sys

def clear_scene():
    """Clear the default scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def load_image_as_plane():
    """Load the 2D image as a plane"""
    try:
        # Load the image
        img = bpy.data.images.load('infinity_symbol.png')

        # Get image dimensions
        width, height = img.size

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

def create_3d_extrusion(plane, depth=1.0):
    """Create 3D extrusion from 2D plane"""
    try:
        # Add Solidify modifier for extrusion
        solidify = plane.modifiers.new(name="Solidify", type='SOLIDIFY')
        solidify.thickness = depth
        solidify.offset = 1.0  # Extrude outward

        # Add Subdivision Surface for smooth curves
        subdivision = plane.modifiers.new(name="Subdivision", type='SUBSURF')
        subdivision.levels = 2
        subdivision.render_levels = 3

        return True

    except Exception as e:
        print(f"Error creating extrusion: {e}")
        return False

def setup_lighting():
    """Setup basic lighting"""
    # Clear existing lights
    bpy.ops.object.select_by_type(type='LIGHT')
    bpy.ops.object.delete()

    # Key light
    bpy.ops.object.light_add(type='SUN', location=(5, -5, 5))
    key_light = bpy.context.active_object
    key_light.name = "Key_Light"
    key_light.data.energy = 800

    # Fill light
    bpy.ops.object.light_add(type='SUN', location=(-3, -5, 3))
    fill_light = bpy.context.active_object
    fill_light.name = "Fill_Light"
    fill_light.data.energy = 400
    fill_light.data.color = (0.9, 0.9, 1.0, 1.0)

    # Back light
    bpy.ops.object.light_add(type='SUN', location=(0, 5, 3))
    back_light = bpy.context.active_object
    back_light.name = "Back_Light"
    back_light.data.energy = 200

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
    scene.render.engine = 'CYCLES'

    # Set output settings
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 50  # 50% for faster preview

    # Set quality settings
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True

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

    # Create 3D extrusion
    if create_3d_extrusion(plane, depth=1.5):
        print("Created 3D extrusion with depth 1.5")
    else:
        print("Failed to create extrusion")
        return

    # Setup scene
    setup_lighting()
    setup_camera()
    setup_render_settings()

    print("Scene setup completed")

    # Save the result
    output_file = 'infinity_3d.blend'
    bpy.ops.wm.save_as_mainfile(filepath=output_file)

    print(f"Conversion completed successfully: {output_file}")

if __name__ == "__main__":
    main()
EOF

echo "🔧 Created conversion script"

# Run the conversion
echo "🎬 Starting 2D to 3D conversion..."
blender --background --python convert_2d_to_3d.py 2>&1

# Check if output file was created
if [ -f "infinity_3d.blend" ]; then
    echo ""
    echo "✅ 2D to 3D conversion completed successfully!"
    echo ""
    echo "📄 Output file: infinity_3d.blend"
    echo "📁 File size: $(ls -lh infinity_3d.blend | awk '{print $5}')"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Open in Blender: blender infinity_3d.blend"
    echo "   2. Generate animation: ./scripts/generate-animation.sh -i infinity_3d.blend -t rotate_spin"
    echo "   3. Start MCP server: ./scripts/start-mcp-server.sh"
    echo ""
    echo "🎨 Features created:"
    echo "   • 3D extruded infinity symbol"
    echo "   • Material with gradient texture"
    echo "   • Professional lighting setup"
    echo "   • Camera positioning"
    echo "   • Smooth subdivision surfaces"
else
    echo "❌ Conversion failed"
    echo "Check the error messages above"
fi

# Cleanup
rm -f convert_2d_to_3d.py