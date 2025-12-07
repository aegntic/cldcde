#!/bin/bash
# Background removal script for marketplace images
# Run this in Claude terminal: bash /home/ae/AE/01_Laboratory/cldcde/website/marketplace/remove-backgrounds.sh

IMAGE_DIR="/home/ae/AE/01_Laboratory/cldcde/website/marketplace/public/images"

echo "Installing rembg if not present..."
pip install rembg pillow --quiet 2>/dev/null

echo "Processing images in $IMAGE_DIR..."

for img in "$IMAGE_DIR"/logo_*.png "$IMAGE_DIR"/product-*.png "$IMAGE_DIR"/category-*.png; do
    if [ -f "$img" ]; then
        echo "Processing: $(basename "$img")"
        rembg i "$img" "$img"
    fi
done

echo "Done! All backgrounds removed."
