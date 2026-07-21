#!/bin/bash
# List all components in a category

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIBRARY_DIR="$(dirname "$SCRIPT_DIR")/library"

# Parse arguments
CATEGORY="$1"

if [ -z "$CATEGORY" ]; then
  echo "Usage: $0 <category>"
  echo ""
  echo "Available categories:"
  echo "  components/navigation"
  echo "  components/cards"
  echo "  components/buttons"
  echo "  components/forms"
  echo "  components/overlays"
  echo "  components/typography"
  echo "  patterns/grid-systems"
  echo "  patterns/hero-sections"
  echo "  patterns/content-flow"
  echo "  patterns/data-display"
  echo "  layouts/landing"
  echo "  layouts/dashboard"
  echo "  layouts/editorial"
  echo "  layouts/app-shell"
  echo "  animations/entrances"
  echo "  animations/interactions"
  echo "  animations/scroll-effects"
  echo "  animations/loaders"
  echo ""
  echo "To list all components:"
  echo "  $0 --all"
  exit 1
fi

if [ "$CATEGORY" = "--all" ]; then
  echo "📚 Avant-Garde Frontend Architect - Component Library"
  echo "===================================================="
  echo ""
  find "$LIBRARY_DIR" -name "*.md" -type f | while read -r file; do
    relative_path="${file#$LIBRARY_DIR/}"
    category=$(dirname "$relative_path")
    name=$(basename "$file" .md)
    title=$(head -n 1 "$file" | sed 's/^# //')
    description=$(grep -A 1 "^## Description" "$file" | tail -n 1 | sed 's/^[[:space:]]*//')

    if [ -n "$title" ] && [ "$title" != "${NAME}" ]; then
      echo "📦 $category"
      echo "   $title"
      if [ -n "$description" ] && [ "$description" != "No description provided." ]; then
        echo "   └─ $description"
      fi
      echo ""
    fi
  done
else
  CATEGORY_DIR="$LIBRARY_DIR/$CATEGORY"

  if [ ! -d "$CATEGORY_DIR" ]; then
    echo "Category not found: $CATEGORY"
    exit 1
  fi

  echo "📚 $CATEGORY"
  echo "=================="
  echo ""

  for file in "$CATEGORY_DIR"/*.md; do
    if [ -f "$file" ]; then
      name=$(basename "$file" .md)
      title=$(head -n 1 "$file" | sed 's/^# //')
      description=$(grep -A 1 "^## Description" "$file" | tail -n 1 | sed 's/^[[:space:]]*//')

      echo "📦 $title ($name)"
      if [ -n "$description" ] && [ "$description" != "No description provided." ]; then
        echo "   └─ $description"
      fi
      echo ""
    fi
  done
fi
