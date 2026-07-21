#!/bin/bash

# Blender 3D Animation Studio - Render Queue
# Manages rendering jobs with distributed rendering support

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESOURCES_DIR="$(dirname "$SCRIPT_DIR")/resources"

# Default configuration
INPUT_FILE=""
OUTPUT_DIR=""
QUALITY="medium"
SAMPLES="64"
RESOLUTION="1080"
FRAME_START="1"
FRAME_END="250"
ENGINE="cycles"
DISTRIBUTE="false"
RENDER_NODES=""

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
    echo "Blender 3D Animation Studio - Render Queue"
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Queues and manages rendering jobs for Blender animations"
    echo ""
    echo "Required Options:"
    echo "  -i, --input FILE      Input .blend file"
    echo ""
    echo "Output Options:"
    echo "  -o, --output DIR      Output directory for frames (default: ./render_output)"
    echo "  -f, --frames START-END Frame range (default: 1-250)"
    echo ""
    echo "Render Options:"
    echo "  -q, --quality LEVEL   Quality: low|medium|high (default: medium)"
    echo "  -s, --samples NUM     Sample count (overrides quality)"
    echo "  -r, --resolution RES  Output resolution (default: 1080p)"
    echo "  -e, --engine ENGINE   Render engine: cycles|eevee (default: cycles)"
    echo ""
    echo "Distributed Rendering:"
    echo "  -d, --distribute       Enable distributed rendering"
    echo "  -n, --nodes LIST      Comma-separated list of render nodes"
    echo ""
    echo "Other Options:"
    echo "  -p, --priority NUM    Job priority (1-10, default: 5)"
    echo "  -c, --config FILE     Custom configuration file"
    echo "  --queue-only          Only add to queue, don't start"
    echo "  --status              Show render queue status"
    echo "  --stop                Stop render queue"
    echo "  -v, --verbose         Detailed output"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -i animation.blend -q high"
    echo "  $0 -i scene.blend -f 1-120 -o ./frames/"
    echo "  $0 -i complex.blend -d -n node1,node2,node3"
    echo "  $0 --status"
    echo ""
    echo "Quality Presets:"
    echo "  low:    32 samples, 50% resolution, faster rendering"
    echo "  medium: 64 samples, 75% resolution, balanced quality"
    echo "  high:   128 samples, 100% resolution, best quality"
}

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${PURPLE}🔍 $1${NC}"
    fi
}

# Parse command line arguments
VERBOSE=false
CONFIG_FILE="$RESOURCES_DIR/studio-config.json"
QUEUE_ONLY=false
SHOW_STATUS=false
STOP_QUEUE=false
PRIORITY="5"

while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--input)
            INPUT_FILE="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -f|--frames)
            FRAME_RANGE="$2"
            FRAME_START="${FRAME_RANGE%%-*}"
            FRAME_END="${FRAME_RANGE##*-}"
            shift 2
            ;;
        -q|--quality)
            QUALITY="$2"
            shift 2
            ;;
        -s|--samples)
            SAMPLES="$2"
            shift 2
            ;;
        -r|--resolution)
            RESOLUTION="$2"
            shift 2
            ;;
        -e|--engine)
            ENGINE="$2"
            shift 2
            ;;
        -d|--distribute)
            DISTRIBUTE="true"
            shift
            ;;
        -n|--nodes)
            RENDER_NODES="$2"
            shift 2
            ;;
        -p|--priority)
            PRIORITY="$2"
            shift 2
            ;;
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        --queue-only)
            QUEUE_ONLY=true
            shift
            ;;
        --status)
            SHOW_STATUS=true
            shift
            ;;
        --stop)
            STOP_QUEUE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
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

# Load configuration if exists
if [ -f "$CONFIG_FILE" ]; then
    log_verbose "Loading configuration from: $CONFIG_FILE"
    RENDER_ENGINE=$(python3 -c "
import json
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    print(config.get('render_engine', 'cycles'))
except:
    print('cycles')
" 2>/dev/null || echo "cycles")

    if [ -z "$SAMPLES" ]; then
        SAMPLES=$(python3 -c "
import json
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    print(config.get('samples', '64'))
except:
    print('64')
" 2>/dev/null || echo "64")
    fi
fi

# Set quality presets
if [ -z "$SAMPLES" ]; then
    case "$QUALITY" in
        "low")
            SAMPLES="32"
            RESOLUTION_SCALE="50"
            ;;
        "medium")
            SAMPLES="64"
            RESOLUTION_SCALE="75"
            ;;
        "high")
            SAMPLES="128"
            RESOLUTION_SCALE="100"
            ;;
        *)
            SAMPLES="64"
            RESOLUTION_SCALE="75"
            ;;
    esac
else
    RESOLUTION_SCALE="100"
fi

# Set resolution based on input
case "$RESOLUTION" in
    "720"|"720p")
        RESOLUTION_X="1280"
        RESOLUTION_Y="720"
        ;;
    "1080"|"1080p")
        RESOLUTION_X="1920"
        RESOLUTION_Y="1080"
        ;;
    "1440"|"1440p"|"2k")
        RESOLUTION_X="2560"
        RESOLUTION_Y="1440"
        ;;
    "2160"|"2160p"|"4k")
        RESOLUTION_X="3840"
        RESOLUTION_Y="2160"
        ;;
    *)
        RESOLUTION_X="1920"
        RESOLUTION_Y="1080"
        ;;
esac

# Apply resolution scale
RESOLUTION_X=$((RESOLUTION_X * RESOLUTION_SCALE / 100))
RESOLUTION_Y=$((RESOLUTION_Y * RESOLUTION_SCALE / 100))

# Validate arguments
if [ "$SHOW_STATUS" = false ] && [ "$STOP_QUEUE" = false ] && [ -z "$INPUT_FILE" ]; then
    log_error "Input file is required (-i/--input)"
    show_help
    exit 1
fi

# Validate frame range
if ! [[ "$FRAME_START" =~ ^[0-9]+$ ]] || [ "$FRAME_START" -lt 1 ]; then
    log_error "Invalid start frame: $FRAME_START"
    exit 1
fi

if ! [[ "$FRAME_END" =~ ^[0-9]+$ ]] || [ "$FRAME_END" -lt "$FRAME_START" ]; then
    log_error "Invalid end frame: $FRAME_END"
    exit 1
fi

# Check for Blender installation
if ! command -v blender &> /dev/null; then
    log_error "Blender is not installed or not in PATH"
    exit 1
fi

# Set default output directory
if [ -z "$OUTPUT_DIR" ]; then
    OUTPUT_DIR="./render_output_$(date +%Y%m%d_%H%M%S)"
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Render queue management
QUEUE_DIR="$HOME/.blender_render_queue"
mkdir -p "$QUEUE_DIR/jobs"
mkdir -p "$QUEUE_DIR/active"

PID_FILE="$QUEUE_DIR/render_queue.pid"
LOG_FILE="$QUEUE_DIR/render_queue.log"

# Function to generate unique job ID
generate_job_id() {
    echo "render_job_$(date +%Y%m%d_%H%M%S)_$$"
}

# Function to add job to queue
add_job_to_queue() {
    local job_id=$(generate_job_id)
    local job_file="$QUEUE_DIR/jobs/${job_id}.json"

    # Create job metadata
    cat > "$job_file" << EOF
{
    "id": "$job_id",
    "input_file": "$INPUT_FILE",
    "output_dir": "$OUTPUT_DIR",
    "frame_start": $FRAME_START,
    "frame_end": $FRAME_END,
    "samples": $SAMPLES,
    "resolution_x": $RESOLUTION_X,
    "resolution_y": $RESOLUTION_Y,
    "engine": "$ENGINE",
    "quality": "$QUALITY",
    "priority": $PRIORITY,
    "distribute": $DISTRIBUTE,
    "render_nodes": "$RENDER_NODES",
    "status": "queued",
    "created_at": "$(date -Iseconds)",
    "started_at": null,
    "completed_at": null,
    "progress": 0,
    "error": null
}
EOF

    echo "$job_id"
}

# Function to show render queue status
show_queue_status() {
    echo -e "${CYAN}📊 Blender Render Queue Status${NC}"
    echo ""

    # Count jobs by status
    local queued_jobs=0
    local active_jobs=0
    local completed_jobs=0
    local failed_jobs=0

    for job_file in "$QUEUE_DIR/jobs"/*.json; do
        if [ -f "$job_file" ]; then
            local status=$(python3 -c "
import json
try:
    with open('$job_file', 'r') as f:
        job = json.load(f)
    print(job.get('status', 'unknown'))
except:
    print('unknown')
" 2>/dev/null || echo "unknown")

            case "$status" in
                "queued") ((queued_jobs++)) ;;
                "active") ((active_jobs++)) ;;
                "completed") ((completed_jobs++)) ;;
                "failed") ((failed_jobs++)) ;;
            esac
        fi
    done

    echo -e "${BLUE}Job Summary:${NC}"
    echo -e "   • Queued: $queued_jobs"
    echo -e "   • Active: $active_jobs"
    echo -e "   • Completed: $completed_jobs"
    echo -e "   • Failed: $failed_jobs"
    echo ""

    # Show active jobs details
    if [ "$active_jobs" -gt 0 ]; then
        echo -e "${GREEN}Active Jobs:${NC}"
        for job_file in "$QUEUE_DIR/jobs"/*.json; do
            if [ -f "$job_file" ]; then
                local status=$(python3 -c "
import json
try:
    with open('$job_file', 'r') as f:
        job = json.load(f)
    if job.get('status') == 'active':
        print(f\"{job['id']}|{job.get('progress', 0)}|{job.get('input_file', 'unknown')}\")
except:
    pass
" 2>/dev/null || echo "")

                if [ -n "$status" ]; then
                    IFS='|' read -r job_id progress input_file <<< "$status"
                    local filename=$(basename "$input_file")
                    echo -e "   • $job_id: $filename (${progress}%)"
                fi
            fi
        done
        echo ""
    fi

    # Check if render queue process is running
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${GREEN}✅ Render queue process is running (PID: $pid)${NC}"
        else
            echo -e "${RED}❌ Render queue process is not running${NC}"
            rm -f "$PID_FILE"
        fi
    else
        echo -e "${YELLOW}⚠️  Render queue process is not running${NC}"
    fi
}

# Function to stop render queue
stop_render_queue() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        log_info "Stopping render queue process (PID: $pid)..."

        if kill "$pid" 2>/dev/null; then
            # Wait for graceful shutdown
            local count=0
            while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
                sleep 1
                ((count++))
            done

            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null
                log_warning "Render queue process was force killed"
            else
                log_success "Render queue process stopped gracefully"
            fi

            rm -f "$PID_FILE"
        else
            log_error "Failed to stop render queue process"
        fi
    else
        log_info "Render queue process is not running"
    fi

    # Mark active jobs as stopped
    for job_file in "$QUEUE_DIR/jobs"/*.json; do
        if [ -f "$job_file" ]; then
            local status=$(python3 -c "
import json
try:
    with open('$job_file', 'r') as f:
        job = json.load(f)
    if job.get('status') == 'active':
        job['status'] = 'stopped'
        job['completed_at'] = '$(date -Iseconds)'
        with open('$job_file', 'w') as f:
            json.dump(job, f, indent=2)
except:
    pass
" 2>/dev/null || true)
        fi
    done
}

# Function to process render queue
process_render_queue() {
    log_verbose "Starting render queue processor..."

    while true; do
        # Find highest priority queued job
        local next_job=""
        local highest_priority=0

        for job_file in "$QUEUE_DIR/jobs"/*.json; do
            if [ -f "$job_file" ]; then
                local job_info=$(python3 -c "
import json
try:
    with open('$job_file', 'r') as f:
        job = json.load(f)
    if job.get('status') == 'queued':
        print(f\"{job['id']}|{job.get('priority', 5)}\")
except:
    pass
" 2>/dev/null || echo "")

                if [ -n "$job_info" ]; then
                    IFS='|' read -r job_id priority <<< "$job_info"
                    if [ "$priority" -gt "$highest_priority" ]; then
                        highest_priority="$priority"
                        next_job="$job_id"
                    fi
                fi
            fi
        done

        # Process next job if available
        if [ -n "$next_job" ]; then
            log_info "Processing render job: $next_job"
            execute_render_job "$next_job"
        else
            sleep 5  # Wait before checking queue again
        fi
    done
}

# Function to execute render job
execute_render_job() {
    local job_id="$1"
    local job_file="$QUEUE_DIR/jobs/${job_id}.json"

    # Update job status to active
    python3 -c "
import json
try:
    with open('$job_file', 'r') as f:
        job = json.load(f)
    job['status'] = 'active'
    job['started_at'] = '$(date -Iseconds)'
    with open('$job_file', 'w') as f:
        json.dump(job, f, indent=2)
except:
    pass
"

    # Get job parameters
    local job_params=$(python3 -c "
import json
try:
    with open('$job_file', 'r') as f:
        job = json.load(f)
    print(f\"{job['input_file']}|{job['output_dir']}|{job['frame_start']}|{job['frame_end']}|{job['samples']}|{job['resolution_x']}|{job['resolution_y']}|{job['engine']}\")
except:
    pass
" 2>/dev/null || echo "")

    if [ -n "$job_params" ]; then
        IFS='|' read -r input_file output_dir frame_start frame_end samples res_x res_y engine <<< "$job_params"

        # Create render script
        local render_script="$QUEUE_DIR/render_${job_id}.py"
        cat > "$render_script" << EOF
import bpy
import os

# Load the blend file
bpy.ops.wm.open_mainfile(filepath='$input_file')

# Configure render settings
scene = bpy.context.scene
scene.render.engine = '$engine'
scene.render.filepath = '$output_dir/'
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_depth = '8'

# Set resolution
scene.render.resolution_x = $res_x
scene.render.resolution_y = $res_y
scene.render.resolution_percentage = 100

# Set frame range
scene.frame_start = $frame_start
scene.frame_end = $frame_end

# Configure samples for Cycles
if '$engine' == 'CYCLES':
    scene.cycles.samples = $samples
    scene.cycles.use_denoising = True

# Render animation
bpy.ops.render.render(animation=True)
EOF

        # Execute render
        log_verbose "Starting Blender render for job $job_id"
        if blender --background --python "$render_script" >> "$LOG_FILE" 2>&1; then
            # Update job status to completed
            python3 -c "
import json
try:
    with open('$job_file', 'r') as f:
        job = json.load(f)
    job['status'] = 'completed'
    job['progress'] = 100
    job['completed_at'] = '$(date -Iseconds)'
    with open('$job_file', 'w') as f:
        json.dump(job, f, indent=2)
except:
    pass
"
            log_success "Render job $job_id completed successfully"
        else
            # Update job status to failed
            python3 -c "
import json
try:
    with open('$job_file', 'r') as f:
        job = json.load(f)
    job['status'] = 'failed'
    job['error'] = 'Render execution failed'
    job['completed_at'] = '$(date -Iseconds)'
    with open('$job_file', 'w') as f:
        json.dump(job, f, indent=2)
except:
    pass
"
            log_error "Render job $job_id failed"
        fi

        # Cleanup render script
        rm -f "$render_script"
    fi
}

# Handle status command
if [ "$SHOW_STATUS" = true ]; then
    show_queue_status
    exit 0
fi

# Handle stop command
if [ "$STOP_QUEUE" = true ]; then
    stop_render_queue
    exit 0
fi

# Display render setup
echo -e "${CYAN}🚀 Blender 3D Animation Studio${NC}"
echo -e "${CYAN}🎬 Render Queue Management${NC}"
echo ""
echo -e "📁 Input file: $INPUT_FILE"
echo -e "📁 Output directory: $OUTPUT_DIR"
echo -e "🎞️  Frame range: $FRAME_START - $FRAME_END"
echo -e "🎨 Quality: $QUALITY"
echo -e "🔢 Samples: $SAMPLES"
echo -e "📺 Resolution: ${RESOLUTION_X}x${RESOLUTION_Y}"
echo -e "⚙️  Engine: $ENGINE"
echo -e "🏎️  Priority: $PRIORITY"
echo -e "🌐 Distributed: $DISTRIBUTE"
echo ""

# Add job to queue
local job_id=$(add_job_to_queue)
log_success "Render job added to queue: $job_id"

if [ "$QUEUE_ONLY" = true ]; then
    echo ""
    echo -e "${BLUE}💡 To start rendering, run:${NC}"
    echo -e "   $0 --status    # Check queue status"
    echo -e "   $0             # Start queue processor"
else
    # Start render queue processor if not running
    if ! check_server_status; then
        log_info "Starting render queue processor..."

        # Start queue processor in background
        (
            echo $$ > "$PID_FILE"
            process_render_queue
        ) &

        log_success "Render queue processor started"
        echo -e "   • Job ID: $job_id"
        echo -e "   • Log: $LOG_FILE"
    else
        log_info "Render queue processor is already running"
        echo -e "   • Job queued with ID: $job_id"
    fi
fi

echo ""
echo -e "${BLUE}🔗 Monitor progress:${NC}"
echo -e "   • Queue status: $0 --status"
echo -e "   • Stop queue: $0 --stop"
echo ""

# Show initial status
show_queue_status

echo -e "${GREEN}✨ Your render job is queued and ready to process!${NC}"