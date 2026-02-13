#!/usr/bin/env python3

import bpy
import os
import math

def clear_scene():
    """Clear the default scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def create_3d_infinity():
    """Create a 3D infinity symbol using basic meshes"""

    # Create the infinity symbol using two torus objects
    # This simulates the figure-8 shape

    # First torus (left loop)
    bpy.ops.mesh.primitive_torus_add(
        location=(-1.5, 0, 0),
        major_radius=1.0,
        minor_radius=0.3
    )
    torus1 = bpy.context.active_object
    torus1.name = "Infinity_Left"

    # Apply transformations to create the left loop
    bpy.ops.transform.rotate(value=math.radians(45), orient_axis='Y')
    bpy.ops.object.transform_apply(rotation=True, scale=True)

    # Second torus (right loop)
    bpy.ops.mesh.primitive_torus_add(
        location=(1.5, 0, 0),
        major_radius=1.0,
        minor_radius=0.3
    )
    torus2 = bpy.context.active_object
    torus2.name = "Infinity_Right"

    # Apply transformations to create the right loop
    bpy.ops.transform.rotate(value=math.radians(-45), orient_axis='Y')
    bpy.ops.object.transform_apply(rotation=True, scale=True)

    # Join both objects
    bpy.ops.object.select_all(action='SELECT')
    torus1.select_set(True)
    bpy.context.view_layer.objects.active = torus1
    bpy.ops.object.join()

    infinity_obj = bpy.context.active_object
    infinity_obj.name = "Infinity_3D"

    # Add some subdivisions for smoother curves
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.subdivide(number_cuts=2)
    bpy.ops.object.mode_set(mode='OBJECT')

    # Add modifiers for 3D effect
    solidify = infinity_obj.modifiers.new(name="Solidify", type='SOLIDIFY')
    solidify.thickness = 0.1
    solidify.offset = 1.0

    subdivision = infinity_obj.modifiers.new(name="Subdivision", type='SUBSURF')
    subdivision.levels = 2
    subdivision.render_levels = 3

    return infinity_obj

def create_material():
    """Create cyan-to-blue gradient material"""

    # Create material
    mat = bpy.data.materials.new(name="Infinity_Material")
    mat.use_nodes = True

    # Clear default nodes
    mat.node_tree.nodes.clear()

    # Add ColorRamp for gradient
    color_ramp = mat.node_tree.nodes.new(type='ShaderNodeValToRGB')
    color_ramp.location = (-200, 0)

    # Set gradient colors (cyan to blue)
    color_ramp.color_ramp.elements[0].color = (0.0, 1.0, 1.0, 1.0)  # Cyan
    color_ramp.color_ramp.elements[1].color = (0.0, 0.0, 1.0, 1.0)  # Blue

    # Add Principled BSDF
    bsdf = mat.node_tree.nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)

    # Set material properties
    bsdf.inputs['Base Color'].default_value = (0.0, 0.5, 0.8, 1.0)  # Base blue color
    bsdf.inputs['Metallic'].default_value = 0.3
    bsdf.inputs['Roughness'].default_value = 0.2

    # Add Texture Coordinate and Gradient Texture
    tex_coord = mat.node_tree.nodes.new(type='ShaderNodeTexCoord')
    tex_coord.location = (-400, 200)

    gradient = mat.node_tree.nodes.new(type='ShaderNodeTexGradient')
    gradient.gradient_type = 'SPHERICAL'
    gradient.location = (-200, 200)

    # Mix gradient with base color
    mix = mat.node_tree.nodes.new(type='ShaderNodeMixRGB')
    mix.location = (-100, 0)
    mix.inputs['Fac'].default_value = 0.3

    # Add Output node
    output = mat.node_tree.nodes.new(type='ShaderNodeOutputMaterial')
    output.location = (200, 0)

    # Connect nodes
    mat.node_tree.links.new(tex_coord.outputs['Object'], gradient.inputs['Vector'])
    mat.node_tree.links.new(gradient.outputs['Color'], mix.inputs['Color1'])
    mat.node_tree.links.new(color_ramp.outputs['Color'], mix.inputs['Color2'])
    mat.node_tree.links.new(mix.outputs['Color'], bsdf.inputs['Base Color'])
    mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

    return mat

def setup_basic_scene():
    """Setup basic scene with lighting and camera"""

    # Simple lighting
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
    fill_light.data.color = (0.9, 0.9, 1.0)

    # Back light
    bpy.ops.object.light_add(type='SUN', location=(0, 5, 3))
    back_light = bpy.context.active_object
    back_light.name = "Back_Light"
    back_light.data.energy = 200

    # Camera setup
    bpy.ops.object.select_by_type(type='CAMERA')
    bpy.ops.object.delete()

    bpy.ops.object.camera_add(location=(0, -8, 2))
    camera = bpy.context.active_object
    camera.name = "Camera"

    # Point camera at origin
    direction = -camera.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    camera.rotation_euler = rot_quat.to_euler()

    bpy.context.scene.camera = camera

    # Simple render settings
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 25
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True

def main():
    """Main conversion function"""
    print("Creating 3D infinity symbol...")

    # Clear scene
    clear_scene()

    # Create 3D infinity symbol
    infinity_obj = create_3d_infinity()
    print("✓ Created 3D infinity geometry")

    # Create and assign material
    mat = create_material()
    infinity_obj.data.materials.append(mat)
    print("✓ Applied cyan-to-blue gradient material")

    # Setup scene
    setup_basic_scene()
    print("✓ Setup basic lighting and camera")

    # Save the result
    output_file = 'infinity_3d.blend'
    bpy.ops.wm.save_as_mainfile(filepath=output_file)

    file_size_kb = os.path.getsize(output_file) / 1024
    print(f"✓ Conversion completed: {output_file}")
    print(f"✓ File size: {file_size_kb:.1f} KB")
    print("✓ Ready for animation generation!")

if __name__ == "__main__":
    main()