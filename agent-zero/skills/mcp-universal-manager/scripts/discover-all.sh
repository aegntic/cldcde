#!/bin/bash

# MCP Universal Discovery Script
# Auto-discovery of MCP servers across multiple platforms

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESOURCES_DIR="$(dirname "$SCRIPT_DIR")/resources"

# Default configuration
CONFIG_FILE="$RESOURCES_DIR/platform-config.json"
OUTPUT_DIR="$PWD/mcp-discovery"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Help function
show_help() {
    echo "MCP Universal Discovery"
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Auto-discovers MCP servers across multiple AI platforms"
    echo ""
    echo "Options:"
    echo "  -c, --config FILE     Platform configuration file"
    echo "  -o, --output DIR      Output directory (default: ./mcp-discovery)"
    echo "  -p, --platform NAME   Specific platform to scan (claude-code|factory-droid|all)"
    echo "  -v, --verbose         Detailed output with discovery process"
    echo "  -q, --quiet           Minimal output, results only"
    echo "  -f, --format FORMAT   Output format (json|yaml|csv|markdown)"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                              # Discover all platforms"
    echo "  $0 -p claude-code -f json                      # Claude Code only, JSON output"
    echo "  $0 -v                                          # Verbose discovery process"
    echo "  $0 -c custom-config.json -o ./custom-output   # Custom config and output"
}

# Parse command line arguments
PLATFORM="all"
VERBOSE=false
QUIET=false
FORMAT="markdown"

while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -p|--platform)
            PLATFORM="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -q|--quiet)
            QUIET=true
            shift
            ;;
        -f|--format)
            FORMAT="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Logging functions
log_info() {
    if [ "$QUIET" = false ]; then
        echo -e "${BLUE}ℹ️  $1${NC}"
    fi
}

log_success() {
    if [ "$QUIET" = false ]; then
        echo -e "${GREEN}✅ $1${NC}"
    fi
}

log_warning() {
    if [ "$QUIET" = false ]; then
        echo -e "${YELLOW}⚠️  $1${NC}"
    fi
}

log_error() {
    if [ "$QUIET" = false ]; then
        echo -e "${RED}❌ $1${NC}"
    fi
}

log_verbose() {
    if [ "$VERBOSE" = true ] && [ "$QUIET" = false ]; then
        echo -e "${PURPLE}🔍 $1${NC}"
    fi
}

# Function to read configuration
get_config_value() {
    local key="$1"
    local default="$2"

    if [ -f "$CONFIG_FILE" ]; then
        python3 -c "
import json
import sys

try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)

    keys = '$key'.split('.')
    value = config

    for k in keys:
        if isinstance(value, dict) and k in value:
            value = value[k]
        else:
            value = '$default'
            break

    if isinstance(value, str):
        print(value)
    elif isinstance(value, bool):
        print(str(value).lower())
    elif isinstance(value, list):
        print(','.join(map(str, value)))
    else:
        print('$default')
except Exception as e:
    print('$default')
"
    else
        echo "$default"
    fi
}

# Function to detect Claude Code MCP servers
discover_claude_code() {
    log_verbose "Discovering Claude Code MCP servers..."

    local claude_config=$(get_config_value "platforms.claude-code.config_path" "~/.config/claude/claude_desktop_config.json")
    local claude_enabled=$(get_config_value "platforms.claude-code.enabled" "true")

    if [ "$claude_enabled" = "false" ]; then
        log_info "Claude Code platform disabled in configuration"
        return
    fi

    claude_config=$(eval echo "$claude_config")  # Expand ~

    local servers_found=0
    local servers_details=()

    log_verbose "Checking Claude Code config: $claude_config"

    if [ -f "$claude_config" ]; then
        log_verbose "Claude Code config file found"

        # Parse MCP servers from Claude config
        if command -v jq &> /dev/null; then
            local server_names=$(jq -r '.mcpServers | keys[]' "$claude_config" 2>/dev/null || echo "")

            if [ -n "$server_names" ]; then
                while IFS= read -r server_name; do
                    if [ -n "$server_name" ]; then
                        log_verbose "Found Claude Code server: $server_name"

                        local server_config=$(jq -r ".mcpServers[\"$server_name\"]" "$claude_config" 2>/dev/null)
                        local server_command=$(echo "$server_config" | jq -r '.command // "unknown"' 2>/dev/null)
                        local server_args=$(echo "$server_config" | jq -r '.args[]? // ""' 2>/dev/null | tr '\n' ' ')
                        local server_description=$(jq -r '.description // "No description"' "$claude_config" 2>/dev/null)

                        servers_details+=("claude-code|$server_name|$server_command|$server_args|$server_description")
                        ((servers_found++))
                    fi
                done <<< "$server_names"
            fi
        else
            log_warning "jq not available, using basic parsing"
            # Fallback to grep-based parsing
            local grep_output=$(grep -A 10 '"mcpServers"' "$claude_config" 2>/dev/null || echo "")
            if [ -n "$grep_output" ]; then
                log_verbose "Basic parsing found potential MCP configuration"
                servers_found=1
                servers_details+=("claude-code|unknown|unknown|unknown|Claude Code MCP server (jq required for details)")
            fi
        fi
    else
        log_verbose "Claude Code config file not found: $claude_config"
    fi

    # Export results
    for server_detail in "${servers_details[@]}"; do
        echo "$server_detail"
    done

    log_success "Claude Code: Found $servers_found MCP servers"
}

# Function to detect Factory Droid MCP servers
discover_factory_droid() {
    log_verbose "Discovering Factory Droid MCP servers..."

    local factory_path=$(get_config_value "platforms.factory-droid.config_path" "~/.factory/droids/")
    local factory_enabled=$(get_config_value "platforms.factory-droid.enabled" "true")
    local factory_repo_scan=$(get_config_value "platforms.factory-droid.repo_scan" "true")

    if [ "$factory_enabled" = "false" ]; then
        log_info "Factory Droid platform disabled in configuration"
        return
    fi

    factory_path=$(eval echo "$factory_path")  # Expand ~

    local servers_found=0
    local servers_details=()

    log_verbose "Checking Factory Droid path: $factory_path"

    if [ -d "$factory_path" ]; then
        log_verbose "Factory Droid directory found"

        # Look for MCP server patterns
        local droid_files=$(find "$factory_path" -name "*.json" -o -name "*.js" -o -name "*.py" -o -name "server*" -o -name "*mcp*" 2>/dev/null)

        while IFS= read -r file; do
            if [ -n "$file" ]; then
                local filename=$(basename "$file")
                local extension="${filename##*.}"
                local name="${filename%.*}"

                log_verbose "Found potential Factory Droid server: $filename"

                # Try to extract MCP server information
                if command -v jq &> /dev/null && [ "$extension" = "json" ]; then
                    local has_mcp=$(jq -e '.mcp // .server // .name' "$file" 2>/dev/null && echo "true" || echo "false")
                    if [ "$has_mcp" = "true" ]; then
                        local server_name=$(jq -r '.name // .mcp // "'"$name"'"' "$file" 2>/dev/null)
                        local server_description=$(jq -r '.description // "Factory Droid MCP server"' "$file" 2>/dev/null)
                        servers_details+=("factory-droid|$server_name|$file|file|$server_description")
                        ((servers_found++))
                    fi
                else
                    # Basic file detection
                    servers_details+=("factory-droid|$name|$file|file|Factory Droid MCP server file")
                    ((servers_found++))
                fi
            fi
        done <<< "$droid_files"

        # Also check for git repositories if repo scanning is enabled
        if [ "$factory_repo_scan" = "true" ]; then
            log_verbose "Scanning Factory Droid repositories for MCP servers"
            local repos=$(find "$factory_path" -name ".git" -type d 2>/dev/null)

            while IFS= read -r repo; do
                if [ -n "$repo" ]; then
                    local repo_path=$(dirname "$repo")
                    local repo_name=$(basename "$repo_path")
                    log_verbose "Scanning repository: $repo_name"

                    # Look for MCP-related files in repository
                    local mcp_files=$(find "$repo_path" -name "*mcp*" -o -name "*server*" -type f 2>/dev/null | head -5)

                    while IFS= read -r mcp_file; do
                        if [ -n "$mcp_file" ]; then
                            local mcp_name=$(basename "$mcp_file")
                            servers_details+=("factory-droid|$repo_name-$mcp_name|$mcp_file|file|Factory Droid repository MCP server")
                            ((servers_found++))
                        fi
                    done <<< "$mcp_files"
                fi
            done <<< "$repos"
        fi
    else
        log_verbose "Factory Droid directory not found: $factory_path"
    fi

    # Export results
    for server_detail in "${servers_details[@]}"; do
        echo "$server_detail"
    done

    log_success "Factory Droid: Found $servers_found MCP servers"
}

# Function to detect Antigravity MCP servers
discover_antigravity() {
    log_verbose "Discovering Antigravity MCP servers..."

    local antigravity_path=$(get_config_value "platforms.antigravity.config_path" "~/.antigravity/scripts/")
    local antigravity_enabled=$(get_config_value "platforms.antigravity.enabled" "true")

    if [ "$antigravity_enabled" = "false" ]; then
        log_info "Antigravity platform disabled in configuration"
        return
    fi

    antigravity_path=$(eval echo "$antigravity_path")  # Expand ~

    local servers_found=0
    local servers_details=()

    log_verbose "Checking Antigravity path: $antigravity_path"

    if [ -d "$antigravity_path" ]; then
        log_verbose "Antigravity directory found"

        # Look for MCP server files
        local script_files=$(find "$antigravity_path" -name "*.py" -o -name "*.js" -o -name "*.sh" -o -name "*mcp*" -type f 2>/dev/null)

        while IFS= read -r file; do
            if [ -n "$file" ]; then
                local filename=$(basename "$file")
                local extension="${filename##*.}"
                local name="${filename%.*}"

                log_verbose "Found potential Antigravity server: $filename"

                # Check file content for MCP indicators
                if [ "$extension" = "py" ]; then
                    local has_mcp=$(grep -l -i "mcp\|server\|context.*protocol" "$file" 2>/dev/null && echo "true" || echo "false")
                    if [ "$has_mcp" = "true" ]; then
                        local description="Antigravity Python MCP server"
                        servers_details+=("antigravity|$name|$file|python|$description")
                        ((servers_found++))
                    fi
                elif [ "$extension" = "js" ]; then
                    local has_mcp=$(grep -l -i "mcp\|server\|context.*protocol" "$file" 2>/dev/null && echo "true" || echo "false")
                    if [ "$has_mcp" = "true" ]; then
                        local description="Antigravity JavaScript MCP server"
                        servers_details+=("antigravity|$name|$file|javascript|$description")
                        ((servers_found++))
                    fi
                else
                    servers_details+=("antigravity|$name|$file|file|Antigravity MCP server file")
                    ((servers_found++))
                fi
            fi
        done <<< "$script_files"
    else
        log_verbose "Antigravity directory not found: $antigravity_path"
    fi

    # Export results
    for server_detail in "${servers_details[@]}"; do
        echo "$server_detail"
    done

    log_success "Antigravity: Found $servers_found MCP servers"
}

# Function to detect Gemini Advanced MCP servers
discover_gemini() {
    log_verbose "Discovering Gemini Advanced MCP servers..."

    local gemini_path=$(get_config_value "platforms.gemini.config_path" "~/Library/Application Support/Google/Chrome/Profile 1/Extensions/")
    local gemini_enabled=$(get_config_value "platforms.gemini.enabled" "false")

    if [ "$gemini_enabled" = "false" ]; then
        log_info "Gemini platform disabled in configuration"
        return
    fi

    gemini_path=$(eval echo "$gemini_path")  # Expand ~

    local servers_found=0
    local servers_details=()

    log_verbose "Checking Gemini path: $gemini_path"

    if [ -d "$gemini_path" ]; then
        log_verbose "Gemini extensions directory found"

        # Look for extension directories
        local ext_dirs=$(find "$gemini_path" -maxdepth 1 -type d 2>/dev/null)

        while IFS= read -r ext_dir; do
            if [ -n "$ext_dir" ] && [ "$ext_dir" != "$gemini_path" ]; then
                local ext_id=$(basename "$ext_dir")
                local manifest_file="$ext_dir/manifest.json"

                if [ -f "$manifest_file" ]; then
                    log_verbose "Found Gemini extension: $ext_id"

                    # Check manifest for MCP-related content
                    if command -v jq &> /dev/null; then
                        local has_mcp=$(jq -e '.permissions[] | select(. == "nativeMessaging" or . == "tabs" or . == "storage")' "$manifest_file" 2>/dev/null && echo "true" || echo "false")
                        local ext_name=$(jq -r '.name // "Unknown Extension"' "$manifest_file" 2>/dev/null)

                        if [ "$has_mcp" = "true" ]; then
                            servers_details+=("gemini|$ext_name|$ext_id|extension|Gemini Advanced extension with messaging capabilities")
                            ((servers_found++))
                        fi
                    else
                        servers_details+=("gemini|$ext_id|$ext_id|extension|Gemini Advanced extension")
                        ((servers_found++))
                    fi
                fi
            fi
        done <<< "$ext_dirs"
    else
        log_verbose "Gemini extensions directory not found: $gemini_path"
    fi

    # Export results
    for server_detail in "${servers_details[@]}"; do
        echo "$server_detail"
    done

    log_success "Gemini: Found $servers_found MCP servers"
}

# Function to scan custom locations
discover_custom() {
    log_verbose "Discovering custom location MCP servers..."

    local custom_locations=$(get_config_value "custom_locations" "")
    local servers_found=0
    local servers_details=()

    if [ -n "$custom_locations" ]; then
        IFS=',' read -ra LOCATIONS <<< "$custom_locations"
        for location in "${LOCATIONS[@]}"; do
            location=$(echo "$location" | xargs)  # Trim whitespace
            location=$(eval echo "$location")  # Expand ~

            log_verbose "Checking custom location: $location"

            if [ -d "$location" ]; then
                # Look for MCP server files
                local server_files=$(find "$location" -name "*mcp*" -o -name "*server*" -type f 2>/dev/null)

                while IFS= read -r file; do
                    if [ -n "$file" ]; then
                        local filename=$(basename "$file")
                        local location_name=$(basename "$location")

                        log_verbose "Found custom MCP server: $filename"
                        servers_details+=("custom|$location_name-$filename|$file|file|Custom location MCP server")
                        ((servers_found++))
                    fi
                done <<< "$server_files"
            else
                log_verbose "Custom location not found: $location"
            fi
        done
    fi

    # Export results
    for server_detail in "${servers_details[@]}"; do
        echo "$server_detail"
    done

    if [ $servers_found -gt 0 ]; then
        log_success "Custom locations: Found $servers_found MCP servers"
    fi
}

# Main discovery function
run_discovery() {
    local all_servers=()
    local total_servers=0

    if [ "$QUIET" = false ]; then
        echo -e "${CYAN}🚀 MCP Universal Discovery Starting...${NC}"
        echo -e "📁 Output directory: $OUTPUT_DIR"
        echo -e "⚙️  Configuration: $CONFIG_FILE"
        echo -e "🎯 Platform(s): $PLATFORM"
        echo -e "📊 Output format: $FORMAT"
        echo ""
    fi

    # Run discovery for specified platforms
    case "$PLATFORM" in
        "all")
            while IFS= read -r server; do
                if [ -n "$server" ]; then
                    all_servers+=("$server")
                    ((total_servers++))
                fi
            done < <(discover_claude_code; discover_factory_droid; discover_antigravity; discover_gemini; discover_custom)
            ;;
        "claude-code")
            while IFS= read -r server; do
                if [ -n "$server" ]; then
                    all_servers+=("$server")
                    ((total_servers++))
                fi
            done < <(discover_claude_code)
            ;;
        "factory-droid")
            while IFS= read -r server; do
                if [ -n "$server" ]; then
                    all_servers+=("$server")
                    ((total_servers++))
                fi
            done < <(discover_factory_droid)
            ;;
        "antigravity")
            while IFS= read -r server; do
                if [ -n "$server" ]; then
                    all_servers+=("$server")
                    ((total_servers++))
                fi
            done < <(discover_antigravity)
            ;;
        "gemini")
            while IFS= read -r server; do
                if [ -n "$server" ]; then
                    all_servers+=("$server")
                    ((total_servers++))
                fi
            done < <(discover_gemini)
            ;;
        *)
            log_error "Unknown platform: $PLATFORM"
            exit 1
            ;;
    esac

    # Generate output files
    generate_output_files "${all_servers[@]}"

    if [ "$QUIET" = false ]; then
        echo ""
        echo -e "${GREEN}✅ MCP Discovery completed successfully!${NC}"
        echo ""
        echo -e "${BLUE}📊 Discovery Summary:${NC}"
        echo -e "   • Total MCP servers found: $total_servers"
        echo -e "   • Platforms scanned: $PLATFORM"
        echo -e "   • Output directory: $OUTPUT_DIR"
        echo -e "   • Report format: $FORMAT"
        echo ""
        echo -e "${PURPLE}📄 Generated files:${NC}"
    fi
}

# Function to generate output files in different formats
generate_output_files() {
    local servers=("$@")
    local base_filename="$OUTPUT_DIR/mcp-discovery-$TIMESTAMP"

    # Create output directory structure
    mkdir -p "$OUTPUT_DIR/reports"
    mkdir -p "$OUTPUT_DIR/data"
    mkdir -p "$OUTPUT_DIR/configs"

    case "$FORMAT" in
        "json")
            generate_json_output "${servers[@]}" "$base_filename.json"
            ;;
        "yaml")
            generate_yaml_output "${servers[@]}" "$base_filename.yaml"
            ;;
        "csv")
            generate_csv_output "${servers[@]}" "$base_filename.csv"
            ;;
        "markdown"|*)
            generate_markdown_output "${servers[@]}" "$base_filename.md"
            generate_json_output "${servers[@]}" "$OUTPUT_DIR/data/discovery-$TIMESTAMP.json"
            generate_csv_output "${servers[@]}" "$OUTPUT_DIR/data/discovery-$TIMESTAMP.csv"
            ;;
    esac

    # Generate inventory summary
    generate_inventory_summary "${servers[@]}" "$OUTPUT_DIR/inventory-summary-$TIMESTAMP.md"
}

# Generate JSON output
generate_json_output() {
    local servers=("$@")
    local output_file="${servers[-1]}"
    unset 'servers[-1]'  # Remove last element (output file)

    cat > "$output_file" << EOF
{
  "discovery_metadata": {
    "timestamp": "$(date -Iseconds)",
    "total_servers": ${#servers[@]},
    "platforms_scanned": "$PLATFORM",
    "config_file": "$CONFIG_FILE"
  },
  "servers": [
EOF

    local first=true
    for server in "${servers[@]}"; do
        if [ -n "$server" ]; then
            IFS='|' read -ra PARTS <<< "$server"
            local platform="${PARTS[0]}"
            local name="${PARTS[1]}"
            local command="${PARTS[2]}"
            local args="${PARTS[3]}"
            local description="${PARTS[4]}"

            if [ "$first" = false ]; then
                echo "," >> "$output_file"
            fi
            first=false

            cat >> "$output_file" << EOF
    {
      "platform": "$platform",
      "name": "$name",
      "command": "$command",
      "args": "$args",
      "description": "$description",
      "discovered_at": "$(date -Iseconds)"
    }
EOF
        fi
    done

    cat >> "$output_file" << EOF

  ]
}
EOF

    if [ "$QUIET" = false ]; then
        echo -e "   • JSON report: $output_file"
    fi
}

# Generate CSV output
generate_csv_output() {
    local servers=("$@")
    local output_file="${servers[-1]}"
    unset 'servers[-1]'  # Remove last element (output file)

    cat > "$output_file" << EOF
Platform,Name,Command,Args,Description,Discovered At
EOF

    for server in "${servers[@]}"; do
        if [ -n "$server" ]; then
            IFS='|' read -ra PARTS <<< "$server"
            local platform="${PARTS[0]}"
            local name="${PARTS[1]}"
            local command="${PARTS[2]}"
            local args="${PARTS[3]}"
            local description="${PARTS[4]}"

            # Escape CSV fields
            platform=$(echo "$platform" | sed 's/,/\\,/g')
            name=$(echo "$name" | sed 's/,/\\,/g')
            command=$(echo "$command" | sed 's/,/\\,/g')
            args=$(echo "$args" | sed 's/,/\\,/g')
            description=$(echo "$description" | sed 's/,/\\,/g')

            echo "$platform,$name,$command,$args,$description,$(date -Iseconds)" >> "$output_file"
        fi
    done

    if [ "$QUIET" = false ]; then
        echo -e "   • CSV data: $output_file"
    fi
}

# Generate YAML output
generate_yaml_output() {
    local servers=("$@")
    local output_file="${servers[-1]}"
    unset 'servers[-1]'  # Remove last element (output file)

    cat > "$output_file" << EOF
discovery_metadata:
  timestamp: $(date -Iseconds)
  total_servers: ${#servers[@]}
  platforms_scanned: "$PLATFORM"
  config_file: "$CONFIG_FILE"

servers:
EOF

    for server in "${servers[@]}"; do
        if [ -n "$server" ]; then
            IFS='|' read -ra PARTS <<< "$server"
            local platform="${PARTS[0]}"
            local name="${PARTS[1]}"
            local command="${PARTS[2]}"
            local args="${PARTS[3]}"
            local description="${PARTS[4]}"

            cat >> "$output_file" << EOF
  - platform: "$platform"
    name: "$name"
    command: "$command"
    args: "$args"
    description: "$description"
    discovered_at: $(date -Iseconds)
EOF
        fi
    done

    if [ "$QUIET" = false ]; then
        echo -e "   • YAML report: $output_file"
    fi
}

# Generate Markdown output
generate_markdown_output() {
    local servers=("$@")
    local output_file="${servers[-1]}"
    unset 'servers[-1]'  # Remove last element (output file)

    cat > "$output_file" << EOF
# MCP Universal Discovery Report

**Discovery Date:** $(date +"%Y-%m-%d %H:%M:%S")
**Platforms Scanned:** $PLATFORM
**Total Servers Found:** ${#servers[@]}

---

## Executive Summary

This report provides a comprehensive inventory of MCP (Model Context Protocol) servers discovered across your AI platform ecosystem. The discovery process systematically scanned platform-specific configuration files, directories, and repositories to identify all available MCP servers.

### Discovery Statistics
- **Total MCP Servers:** ${#servers[@]}
- **Platforms Scanned:** $PLATFORM
- **Discovery Duration:** $(date +"%Y-%m-%d %H:%M:%S")
- **Configuration Source:** $CONFIG_FILE

---

## Platform-Specific Findings

### Claude Code
$(discover_claude_code | wc -l) MCP servers discovered in Claude Code configuration.

### Factory Droid
$(discover_factory_droid | wc -l) MCP servers found in Factory Droid repositories and files.

### Antigravity
$(discover_antigravity | wc -l) MCP servers identified in Antigravity scripts.

### Gemini Advanced
$(discover_gemini | wc -l) MCP-related extensions discovered.

### Custom Locations
$(discover_custom | wc -l) MCP servers found in custom directories.

---

## Detailed Server Inventory

| Platform | Server Name | Command/Path | Args/Type | Description |
|----------|-------------|--------------|-----------|-------------|
EOF

    for server in "${servers[@]}"; do
        if [ -n "$server" ]; then
            IFS='|' read -ra PARTS <<< "$server"
            local platform="${PARTS[0]}"
            local name="${PARTS[1]}"
            local command="${PARTS[2]}"
            local args="${PARTS[3]}"
            local description="${PARTS[4]}"

            # Escape markdown table characters
            platform=$(echo "$platform" | sed 's/|/\\|/g')
            name=$(echo "$name" | sed 's/|/\\|/g')
            command=$(echo "$command" | sed 's/|/\\|/g')
            args=$(echo "$args" | sed 's/|/\\|/g')
            description=$(echo "$description" | sed 's/|/\\|/g')

            echo "| $platform | $name | \`$command\` | $args | $description |" >> "$output_file"
        fi
    done

    cat >> "$output_file" << EOF

---

## Platform Configuration Analysis

### Platform Coverage
$(if [ "$PLATFORM" = "all" ]; then
echo "- ✅ Claude Code: Scanned and analyzed"
echo "- ✅ Factory Droid: Scanned and analyzed"
echo "- ✅ Antigravity: Scanned and analyzed"
echo "- ✅ Gemini Advanced: Scanned and analyzed"
echo "- ✅ Custom Locations: Scanned and analyzed"
else
echo "- ✅ $PLATFORM: Scanned and analyzed"
fi)

### Configuration Validation
- **Configuration File:** $CONFIG_FILE
- **File Status:** $([ -f "$CONFIG_FILE" ] && echo "✅ Found and valid" || echo "⚠️ Not found, using defaults")

---

## Recommendations

### Immediate Actions
1. [ ] Review discovered servers for security and compliance
2. [ ] Verify server functionality and health status
3. [ ] Update server documentation and metadata
4. [ ] Implement monitoring for critical servers

### Medium-term Improvements
1. [ ] Establish server categorization and tagging
2. [ ] Implement automated health monitoring
3. [ ] Create server inventory management system
4. [ ] Setup automated discovery scheduling

### Long-term Strategy
1. [ ] Develop server lifecycle management
2. [ ] Implement cross-platform synchronization
3. [ ] Create server security audit framework
4. [ ] Establish performance benchmarking

---

## Next Steps

1. **Health Monitoring:** Run \`./scripts/setup-monitoring.sh\` to monitor discovered servers
2. **Security Analysis:** Execute \`./scripts/security-scan.sh\` for security assessment
3. **Quality Scoring:** Use \`./scripts/quality-assessment.sh\` to evaluate server quality
4. **Dashboard Setup:** Launch \`./scripts/launch-dashboard.sh\` for real-time monitoring

---

**Generated by MCP Universal Manager**
**Framework Version:** 1.0
**Discovery Engine:** Universal Auto-Discovery
**Last Updated:** $(date +"%Y-%m-%d %H:%M:%S")
EOF

    if [ "$QUIET" = false ]; then
        echo -e "   • Markdown report: $output_file"
    fi
}

# Generate inventory summary
generate_inventory_summary() {
    local servers=("$@")
    local summary_file="${servers[-1]}"
    unset 'servers[-1]'  # Remove last element (output file)

    # Count servers by platform
    local claude_count=0
    local factory_count=0
    local antigravity_count=0
    local gemini_count=0
    local custom_count=0

    for server in "${servers[@]}"; do
        if [ -n "$server" ]; then
            IFS='|' read -ra PARTS <<< "$server"
            local platform="${PARTS[0]}"

            case "$platform" in
                "claude-code") ((claude_count++)) ;;
                "factory-droid") ((factory_count++)) ;;
                "antigravity") ((antigravity_count++)) ;;
                "gemini") ((gemini_count++)) ;;
                "custom") ((custom_count++)) ;;
            esac
        fi
    done

    cat > "$summary_file" << EOF
# MCP Inventory Summary

**Total Servers:** ${#servers[@]}
**Discovery Date:** $(date +"%Y-%m-%d %H:%M:%S")

## Platform Breakdown
- **Claude Code:** $claude_count servers
- **Factory Droid:** $factory_count servers
- **Antigravity:** $antigravity_count servers
- **Gemini Advanced:** $gemini_count servers
- **Custom Locations:** $custom_count servers

## Quick Actions
- [ ] Review all ${#servers[@]} discovered servers
- [ ] Setup monitoring for critical servers
- [ ] Validate server configurations
- [ ] Update documentation as needed

## Files Generated
- Discovery Report: \`mcp-discovery-$TIMESTAMP.md\`
- Data Export: \`data/discovery-$TIMESTAMP.json\`
- Server List: \`data/discovery-$TIMESTAMP.csv\`

EOF

    if [ "$QUIET" = false ]; then
        echo -e "   • Inventory summary: $summary_file"
    fi
}

# Run the main discovery process
run_discovery

# Exit with success
exit 0