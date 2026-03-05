#!/bin/bash
# Get and display a component's implementation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIBRARY_DIR="$(dirname "$SCRIPT_DIR")/library"

NAME="$1"

if [ -z "$NAME" ]; then
  echo "Usage: $0 <component-name>"
  echo ""
  echo "Example: $0 floating-asymmetric-nav"
  echo "         $0 holographic-glass-card"
  exit 1
fi

# Search for the component
FOUND=0

find "$LIBRARY_DIR" -name "*.md" -type f | while read -r file; do
  filename=$(basename "$file" .md)

  if [[ "$filename" == *"$NAME"* ]]; then
    FOUND=1
    relative_path="${file#$LIBRARY_DIR/}"

    echo "📦 Component: $filename"
    echo "📁 Location: $relative_path"
    echo "=================================================================="
    echo ""
    cat "$file"
    echo ""
    echo "=================================================================="
    echo "✅ End of component"
    exit 0
  fi
done

if [ $FOUND -eq 0 ]; then
  echo "❌ Component not found: $NAME"
  echo ""
  echo "To search for components:"
  echo "  ./scripts/search-library.sh $NAME"
  echo ""
  echo "To list all components:"
  echo "  ./scripts/list-components.sh --all"
  exit 1
fi
