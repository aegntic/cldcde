#!/usr/bin/env bash
#
# example.sh - Example script demonstrating skill script patterns
#

set -e

echo "=== Example Skill Script ==="
echo ""

# Environment detection
echo "Environment:"
echo "  PWD: $PWD"
echo "  USER: $USER"
echo "  DATE: $(date)"
echo ""

# Feature detection
echo "Available tools:"
command -v python3 &>/dev/null && echo "  ✓ Python 3"
command -v node &>/dev/null && echo "  ✓ Node.js"
command -v docker &>/dev/null && echo "  ✓ Docker"
echo ""

# Example operation
echo "Example operation complete!"
exit 0
