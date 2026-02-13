#!/usr/bin/env python3

import bpy
import os
import math

def animate_infinity():
    """Create animation for the 3D infinity symbol"""

    scene = bpy.context.scene

    # Set frame rate and duration
    scene.render.fps = 30
    scene.frame_end = 180  # 6 seconds at 30fps

    # Get the infinity object
    infinity_obj = None
    for obj in scene.objects:
        if obj.name == "Infinity_3D":
            infinity_obj = obj
            break

    if not infinity_obj:
        print("Error: Infinity_3D object not found!")
        return False

    # Clear existing animation
    infinity_obj.animation_data_clear()

    # Create rotation animation
    # Rotate around multiple axes for interesting effect
    for frame in range(1, 181):
        scene.frame_set(frame)
        t = frame / 180.0  # Normalized time (0 to 1)

        # Rotation animation
        rotation_x = math.sin(t * math.pi * 2) * 0.3
        rotation_y = math.sin(t * math.pi * 2) * 0.7
        rotation_z = t * math.pi * 2

        infinity_obj.rotation_euler = (rotation_x, rotation_y, rotation_z)
        infinity_obj.keyframe_insert(data_path="rotation_euler", frame=frame)

        # Scale animation (subtle breathing effect)
        scale_factor = 1.0 + math.sin(t * math.pi * 4) * 0.05
        infinity_obj.scale = (scale_factor, scale_factor, scale_factor)
        infinity_obj.keyframe_insert(data_path="scale", frame=frame)

    # Set interpolation to smooth
    if infinity_obj.animation_data and infinity_obj.animation_data.action:
        for fcurve in infinity_obj.animation_data.action.fcurves:
            for keyframe in fcurve.keyframe_points:
                keyframe.interpolation = 'BEZIER'

    return True

def setup_camera_animation():
    """Create camera movement animation"""

    scene = bpy.context.scene

    # Get or create camera
    camera = scene.camera
    if not camera:
        bpy.ops.object.camera_add(location=(0, -8, 2))
        camera = bpy.context.active_object
        camera.name = "Camera"
        scene.camera = camera

    # Clear existing animation
    camera.animation_data_clear()

    # Create orbital camera movement
    radius = 8.0
    height = 2.0

    for frame in range(1, 181):
        scene.frame_set(frame)
        t = frame / 180.0

        # Orbital movement
        angle = t * math.pi * 2  # Full circle

        x = math.cos(angle) * radius
        y = math.sin(angle) * radius
        z = height + math.sin(angle * 2) * 1.0  # Vertical variation

        camera.location = (x, y, z)

        # Point camera at origin with slight up/down movement
        target_height = math.sin(angle) * 0.5
        direction = -camera.location
        direction[2] += target_height
        rot_quat = direction.to_track_quat('-Z', 'Y')
        camera.rotation_euler = rot_quat.to_euler()

        camera.keyframe_insert(data_path="location", frame=frame)
        camera.keyframe_insert(data_path="rotation_euler", frame=frame)

    # Set interpolation
    if camera.animation_data and camera.animation_data.action:
        for fcurve in camera.animation_data.action.fcurves:
            for keyframe in fcurve.keyframe_points:
                keyframe.interpolation = 'BEZIER'

    return True

def setup_animation_settings():
    """Setup animation-specific render settings"""

    scene = bpy.context.scene

    # Animation settings
    scene.frame_start = 1
    scene.frame_end = 180
    scene.render.fps = 30

    # Output settings
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = "/home/ae/AE/.claude/skills/blender-3d-studio/animation_frames/"

    # Ensure output directory exists
    output_dir = "/home/ae/AE/.claude/skills/blender-3d-studio/animation_frames/"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

def main():
    """Main animation generation function"""
    print("Creating 3D infinity symbol animation...")

    # Setup animation settings
    setup_animation_settings()
    print("✓ Configured animation settings")

    # Animate the infinity symbol
    if animate_infinity():
        print("✓ Created rotation animation")
    else:
        print("✗ Failed to animate infinity symbol")
        return

    # Animate camera
    if setup_camera_animation():
        print("✓ Created camera animation")
    else:
        print("✗ Failed to animate camera")
        return

    # Save the animated scene
    output_file = 'infinity_3d_animated.blend'
    bpy.ops.wm.save_as_mainfile(filepath=output_file)

    file_size_kb = os.path.getsize(output_file) / 1024
    print(f"✓ Animation completed: {output_file}")
    print(f"✓ File size: {file_size_kb:.1f} KB")
    print(f"✓ Duration: 6 seconds at 30fps (180 frames)")
    print("✓ Ready for rendering!")

    return True

if __name__ == "__main__":
    main()