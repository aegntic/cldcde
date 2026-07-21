#!/bin/bash
# Search component library by keyword

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIBRARY_DIR="$(dirname "$SCRIPT_DIR")/library"

KEYWORD="$1"

if [ -z "$KEYWORD" ]; then
  echo "Usage: $0 <keyword>"
  echo ""
  echo "Example: $0 glass"
  echo "         $0 navigation"
  echo "         $0 animation"
  exit 1
fi

echo "🔍 Searching for: $KEYWORD"
echo "========================="
echo ""

found=0

# Search in all markdown files
find "$LIBRARY_DIR" -name "*.md" -type f | while read -r file; do
  # Search in filename
  filename=$(basename "$file" .md)
  if [[ "$filename" == *"$KEYWORD"* ]]; then
    relative_path="${file#$LIBRARY_DIR/}"
    title=$(head -n 1 "$file" | sed 's/^# //')
    echo "📦 $title"
    echo "   📁 $relative_path"
    echo ""
    ((found++))
  fi

  # Search in content
  if grep -qi "$KEYWORD" "$file"; then
    relative_path="${file#$LIBRARY_DIR/}"
    title=$(head -n 1 "$file" | sed 's/^# //')
    description=$(grep -A 1 "^## Description" "$file" | tail -n 1 | sed 's/^[[:space:]]*//')

    echo "📦 $title"
    echo "   📁 $relative_path"
    if [ -n "$description" ] && [ "$description" != "No description provided." ]; then
      echo "   └─ $description"
    fi

    # Show matching lines
    matches=$(grep -i -n "$KEYWORD" "$file" | head -n 3)
    if [ -n "$matches" ]; then
      echo "   🎯 Matches:"
      echo "$matches" | sed 's/^/      /'
    fi
    echo ""
    ((found++))
  fi
done

if [ $found -eq 0 ]; then
  echo "❌ No components found matching '$KEYWORD'"
  echo ""
  echo "Try:"
  echo "  - A different keyword"
  echo "  - Broader search term"
  echo "  - Check spelling"
  exit 1
fi
