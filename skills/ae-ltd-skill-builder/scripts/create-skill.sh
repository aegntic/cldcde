#!/usr/bin/env bash
#
# create-skill.sh - Interactive skill scaffolding tool
# Creates a new skill with proper structure, frontmatter, and templates
#
# Usage:
#   ./create-skill.sh                    # Interactive mode
#   ./create-skill.sh my-skill           # Create with name
#   ./create-skill.sh my-skill --basic   # Use basic template
#   ./create-skill.sh my-skill --advanced # Use advanced template
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="${SKILLS_DIR:-$HOME/.agents/skills}"

# Parse arguments
SKILL_NAME=""
TEMPLATE="intermediate"
INTERACTIVE=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --basic)
            TEMPLATE="basic"
            shift
            INTERACTIVE=false
            ;;
        --intermediate)
            TEMPLATE="intermediate"
            shift
            INTERACTIVE=false
            ;;
        --advanced)
            TEMPLATE="advanced"
            shift
            INTERACTIVE=false
            ;;
        --help|-h)
            echo "Usage: $0 [skill-name] [options]"
            echo ""
            echo "Options:"
            echo "  --basic        Use basic template"
            echo "  --intermediate Use intermediate template (default)"
            echo "  --advanced     Use advanced template"
            echo "  --help, -h     Show this help"
            exit 0
            ;;
        -*)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
        *)
            SKILL_NAME="$1"
            INTERACTIVE=false
            shift
            ;;
    esac
done

# Convert name to slug
to_slug() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g'
}

# Interactive prompts
if $INTERACTIVE; then
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════╗"
    echo "║       Claude Skill Creator Wizard          ║"
    echo "╚════════════════════════════════════════════╝"
    echo -e "${NC}"

    read -rp "$(echo -e ${YELLOW}Skill name${NC} (e.g., 'API Builder'): )" SKILL_DISPLAY_NAME
    SKILL_NAME=$(to_slug "$SKILL_DISPLAY_NAME")

    read -rp "$(echo -e ${YELLOW}Description${NC} (what it does): )" SKILL_DESC_WHAT

    read -rp "$(echo -e ${YELLOW}When to use${NC} (trigger conditions): )" SKILL_DESC_WHEN

    read -rp "$(echo -e ${YELLOW}Template${NC} [basic/intermediate/advanced] (default: intermediate): " TEMPLATE_INPUT
    TEMPLATE="${TEMPLATE_INPUT:-intermediate}"

    read -rp "$(echo -e ${YELLOW}Include scripts directory?${NC} [y/N]: " INCLUDE_SCRIPTS
    INCLUDE_SCRIPTS="${INCLUDE_SCRIPTS:-n}"

    read -rp "$(echo -e ${YELLOW}Include resources directory?${NC} [y/N]: " INCLUDE_RESOURCES
    INCLUDE_RESOURCES="${INCLUDE_RESOURCES:-n}"

    read -rp "$(echo -e ${YELLOW}Include hooks?${NC} [y/N]: " INCLUDE_HOOKS
    INCLUDE_HOOKS="${INCLUDE_HOOKS:-n}"

    read -rp "$(echo -e ${YELLOW}Include prompts?${NC} [y/N]: " INCLUDE_PROMPTS
    INCLUDE_PROMPTS="${INCLUDE_PROMPTS:-n}"
else
    SKILL_DISPLAY_NAME="$SKILL_NAME"
    SKILL_DESC_WHAT="A skill for $SKILL_NAME"
    SKILL_DESC_WHEN="Use when working with $SKILL_NAME"
    INCLUDE_SCRIPTS="n"
    INCLUDE_RESOURCES="n"
    INCLUDE_HOOKS="n"
    INCLUDE_PROMPTS="n"
fi

# Create skill directory
SKILL_PATH="$SKILLS_DIR/$SKILL_NAME"

if [[ -d "$SKILL_PATH" ]]; then
    echo -e "${RED}Error: Skill '$SKILL_NAME' already exists at $SKILL_PATH${NC}"
    exit 1
fi

mkdir -p "$SKILL_PATH"

echo -e "${BLUE}Creating skill: $SKILL_NAME${NC}"
echo -e "  Path: $SKILL_PATH"
echo -e "  Template: $TEMPLATE"
echo ""

# Build description
FULL_DESCRIPTION="${SKILL_DESC_WHAT}. ${SKILL_DESC_WHEN}"

# Create SKILL.md based on template
case $TEMPLATE in
    basic)
        cat > "$SKILL_PATH/SKILL.md" << EOF
---
name: "$SKILL_NAME"
description: "$FULL_DESCRIPTION"
---

# ${SKILL_DISPLAY_NAME:-$SKILL_NAME}

## What This Skill Does
${SKILL_DESC_WHAT}

## Quick Start
\`\`\`bash
# Basic usage
\`\`\`

## Step-by-Step Guide

### Step 1: Setup
[Instructions]

### Step 2: Usage
[Instructions]

### Step 3: Verify
[Instructions]

## Troubleshooting
- **Issue**: Problem description
  - **Solution**: Fix description
EOF
        ;;

    intermediate)
        cat > "$SKILL_PATH/SKILL.md" << EOF
---
name: "$SKILL_NAME"
description: "$FULL_DESCRIPTION"
---

# ${SKILL_DISPLAY_NAME:-$SKILL_NAME}

## Prerequisites
- Requirement 1
- Requirement 2

## What This Skill Does
1. Primary function
2. Secondary function
3. Key benefit

## Quick Start
\`\`\`bash
# Most common use case
\`\`\`

---

## Step-by-Step Guide

### Step 1: Initial Setup
\`\`\`bash
# Setup commands
\`\`\`

Expected output:
\`\`\`
Success message
\`\`\`

### Step 2: Configuration
- Configuration option 1
- Configuration option 2

### Step 3: Execution
- Run the main command
- Verify results

---

## Advanced Options

### Option 1: Custom Configuration
\`\`\`bash
# Advanced usage
\`\`\`

### Option 2: Integration
\`\`\`bash
# Integration steps
\`\`\`

---

## Troubleshooting

### Issue: Common Problem
**Symptoms**: What you see
**Cause**: Why it happens
**Solution**: How to fix
\`\`\`bash
# Fix command
\`\`\`

---

## Related Skills
- [Related Skill 1](#)
- [Related Skill 2](#)
EOF
        ;;

    advanced)
        cat > "$SKILL_PATH/SKILL.md" << EOF
---
name: "$SKILL_NAME"
description: "$FULL_DESCRIPTION"
---

# ${SKILL_DISPLAY_NAME:-$SKILL_NAME}

## Overview
${SKILL_DESC_WHAT}

## Prerequisites
- Technology 1 (version X+)
- Technology 2 (version Y+)
- Required credentials or API keys

## What This Skill Does
1. **Core Feature**: Description
2. **Integration**: Description
3. **Automation**: Description

---

## Quick Start (60 seconds)

### Installation
\`\`\`bash
# Install dependencies
\`\`\`

### First Use
\`\`\`bash
# Quick start command
\`\`\`

Expected output:
\`\`\`
✓ Setup complete
✓ Configuration validated
→ Ready to use
\`\`\`

---

## Configuration

### Basic Configuration
Edit \`config.json\`:
\`\`\`json
{
  "mode": "production",
  "features": ["feature1", "feature2"]
}
\`\`\`

### Advanced Configuration
See [Configuration Guide](docs/CONFIGURATION.md)

---

## Step-by-Step Guide

### 1. Initial Setup
[Detailed steps]

### 2. Core Workflow
[Main procedures]

### 3. Integration
[Integration steps]

---

## Advanced Features

### Feature 1: Custom Templates
\`\`\`bash
# Custom template usage
\`\`\`

### Feature 2: Batch Processing
\`\`\`bash
# Batch processing
\`\`\`

### Feature 3: CI/CD Integration
See [CI/CD Guide](docs/CICD.md)

---

## Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| \`setup.sh\` | Initial setup | \`./scripts/setup.sh\` |
| \`run.sh\` | Execute main function | \`./scripts/run.sh\` |

---

## Resources

### Templates
- \`resources/templates/basic.template\` - Basic template
- \`resources/templates/advanced.template\` - Advanced template

### Examples
- \`resources/examples/basic/\` - Simple example
- \`resources/examples/advanced/\` - Complex example

---

## Troubleshooting

### Issue: Installation Failed
**Symptoms**: Error during setup
**Cause**: Missing dependencies
**Solution**:
\`\`\`bash
# Install prerequisites
\`\`\`

### Issue: Configuration Errors
**Solution**: See [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

---

## API Reference
See [API_REFERENCE.md](docs/API_REFERENCE.md) for complete documentation.

## Related Skills
- [Related Skill 1](../related-skill-1/)
- [Related Skill 2](../related-skill-2/)

## Resources
- [Official Documentation](https://example.com/docs)
- [GitHub Repository](https://github.com/example/repo)
EOF
        ;;
esac

# Create optional directories
if [[ "${INCLUDE_SCRIPTS,,}" == "y" ]]; then
    mkdir -p "$SKILL_PATH/scripts"
    cat > "$SKILL_PATH/scripts/setup.sh" << 'EOF'
#!/usr/bin/env bash
# Setup script for skill
set -e

echo "Setting up skill..."

# Add setup commands here

echo "✓ Setup complete"
EOF
    chmod +x "$SKILL_PATH/scripts/setup.sh"
fi

if [[ "${INCLUDE_RESOURCES,,}" == "y" ]]; then
    mkdir -p "$SKILL_PATH/resources/templates"
    mkdir -p "$SKILL_PATH/resources/examples"
    echo "# Templates" > "$SKILL_PATH/resources/templates/.gitkeep"
    echo "# Examples" > "$SKILL_PATH/resources/examples/.gitkeep"
fi

if [[ "${INCLUDE_HOOKS,,}" == "y" ]]; then
    mkdir -p "$SKILL_PATH/hooks"
    cat > "$SKILL_PATH/hooks/pre-task.sh" << 'EOF'
#!/usr/bin/env bash
# Pre-task hook - runs before skill execution
# Use for validation, setup, or state checks
echo "Pre-task hook running..."
EOF
    cat > "$SKILL_PATH/hooks/post-task.sh" << 'EOF'
#!/usr/bin/env bash
# Post-task hook - runs after skill execution
# Use for cleanup, logging, or state updates
echo "Post-task hook running..."
EOF
    chmod +x "$SKILL_PATH/hooks/"*.sh
fi

if [[ "${INCLUDE_PROMPTS,,}" == "y" ]]; then
    mkdir -p "$SKILL_PATH/prompts"
    cat > "$SKILL_PATH/prompts/system.md" << EOF
# System Prompt Extensions

Additional context to inject when this skill is active.

## Context
- Skill: $SKILL_NAME
- Purpose: ${SKILL_DESC_WHAT}

## Instructions
[Additional instructions for Claude when using this skill]
EOF
    cat > "$SKILL_PATH/prompts/examples.md" << 'EOF'
# Example Prompts

## Example 1
User: [example user prompt]
Expected: [expected behavior]

## Example 2
User: [another example]
Expected: [expected behavior]
EOF
fi

echo ""
echo -e "${GREEN}✓ Skill created successfully!${NC}"
echo ""
echo "Structure:"
find "$SKILL_PATH" -type f | sed "s|$SKILL_PATH|$SKILL_NAME|g" | sort

echo ""
echo -e "${CYAN}Next steps:${NC}"
echo "  1. Edit $SKILL_PATH/SKILL.md"
echo "  2. Add your content and examples"
echo "  3. Test with: claude-code"
echo "  4. Validate: ${SCRIPT_DIR}/validate-skill.sh $SKILL_PATH"
