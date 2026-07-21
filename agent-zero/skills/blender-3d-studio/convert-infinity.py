#!/usr/bin/env python3

import bpy
import os
import sys

def clear_scene():
    """Clear the default scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def create_infinity_3d():
    """Create a 3D infinity symbol from scratch"""

    # Create a simple 3D infinity symbol using curves
    # We'll create a figure-8 shape with beveled curves

    # Create a Bézier curve
    bpy.ops.curve.primitive_bezier_curve_add()
    curve_obj = bpy.context.active_object
    curve_obj.name = "Infinity_Curve"

    # Convert to mesh for extrusion
    bpy.ops.object.convert(target='MESH')
    infinity_obj = bpy.context.active_object
    infinity_obj.name = "Infinity_3D"

    # Enter Edit Mode to modify the curve points
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.curve.select_all(action='SELECT')

    # Scale and position the curve
    bpy.ops.transform.resize(value=(4, 2, 1))
    bpy.ops.transform.translate(value=(0, 0, 0))

    # Exit Edit Mode
    bpy.ops.object.mode_set(mode='OBJECT')

    # Apply transforms
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Add Solidify modifier for 3D extrusion
    solidify = infinity_obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    solidify.thickness = 0.3
    solidify.offset = 1.0

    # Add Subdivision Surface for smooth curves
    subdivision = infinity_obj.modifiers.new(name="Subdivision", type='SUBSURF')
    subdivision.levels = 2
    subdivision.render_levels = 3

    # Add Bevel for rounded edges
    bevel = infinity_obj.modifiers.new(name="Bevel", type='BEVEL')
    bevel.width = 0.05
    bevel.segments = 8

    return infinity_obj

def create_material(obj):
    """Create cyan-to-blue gradient material"""

    # Create material
    mat = bpy.data.materials.new(name="Infinity_Material")
    mat.use_nodes = True

    # Clear default nodes
    mat.node_tree.nodes.clear()

    # Add ColorRamp for gradient
    color_ramp = mat.node_tree.nodes.new(type='ShaderNodeValToRGB')

    # Set gradient colors (cyan to blue)
    color_ramp.color_ramp.elements[0].color = (0.0, 1.0, 1.0, 1.0)  # Cyan
    color_ramp.color_ramp.elements[1].color = (0.0, 0.0, 1.0, 1.0)  # Blue

    # Add Principled BSDF
    bsdf = mat.node_tree.nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Metallic'].default_value = 0.3
    bsdf.inputs['Roughness'].default_value = 0.2
    bsdf.inputs['Specular'].default_value = 0.5

    # Add Output node
    output = mat.node_tree.nodes.new(type='ShaderNodeOutputMaterial')

    # Connect nodes
    mat.node_tree.links.new(color_ramp.outputs['Color'], bsdf.inputs['Base Color'])
    mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

    # Assign material to object
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

def setup_lighting():
    """Setup professional lighting"""

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
    scene.render.resolution_percentage = 25  # 25% for faster preview

    # Set quality settings
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True

    # Set background color
    world = scene.world
    if not world.use_nodes:
        world.use_nodes = True
        world.node_tree.nodes.clear()

        bg_node = world.node_tree.nodes.new(type='ShaderNodeBackground')
        output_node = world.node_tree.nodes.new(type='ShaderNodeOutputWorld')

        # Light gray background
        bg_node.inputs['Color'].default_value = (0.8, 0.8, 0.8, 1.0)
        world.node_tree.links.new(bg_node.outputs['Background'], output_node.inputs['Background'])

def main():
    """Main conversion function"""
    print("Starting 2D to 3D conversion of infinity symbol...")

    # Clear scene
    clear_scene()

    # Create 3D infinity symbol
    infinity_obj = create_infinity_3d()
    print("Created 3D infinity symbol geometry")

    # Create and assign material
    create_material(infinity_obj)
    print("Applied cyan-to-blue gradient material")

    # Setup scene
    setup_lighting()
    setup_camera()
    setup_render_settings()
    print("Setup professional lighting and camera")

    # Save the result
    output_file = 'infinity_3d.blend'
    bpy.ops.wm.save_as_mainfile(filepath=output_file)

    print(f"Conversion completed successfully: {output_file}")
    print(f"File size: {os.path.getsize(output_file) / 1024:.1f} KB")

if __name__ == "__main__":
    main()