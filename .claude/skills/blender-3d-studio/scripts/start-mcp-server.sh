#!/bin/bash

# Blender 3D Animation Studio - MCP Server
# Model Context Protocol server for Blender automation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESOURCES_DIR="$(dirname "$SCRIPT_DIR")/resources"

# Default configuration
SERVER_PORT="8080"
HOST="localhost"
ENABLE_API="true"
ENABLE_RENDER_QUEUE="true"
MAX_CONCURRENT_JOBS="4"
LOG_LEVEL="info"
CACHE_DIR="./cache"
DAEMON_MODE="false"
DEBUG_MODE="false"

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
    echo "Blender 3D Animation Studio - MCP Server"
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Starts the MCP server for Blender automation and remote control"
    echo ""
    echo "Server Options:"
    echo "  -p, --port PORT        Server port (default: 8080)"
    echo "  -h, --host HOST        Server host (default: localhost)"
    echo "  -d, --daemon           Run in daemon mode"
    echo ""
    echo "Feature Options:"
    echo "  --enable-api           Enable REST API (default: true)"
    echo "  --enable-queue         Enable render queue (default: true)"
    echo "  --max-jobs NUM         Max concurrent jobs (default: 4)"
    echo ""
    echo "Debug Options:"
    echo "  --debug                Enable debug mode"
    echo "  -v, --verbose          Verbose logging"
    echo "  -q, --quiet            Minimal logging"
    echo ""
    echo "Storage Options:"
    echo "  --cache-dir DIR        Cache directory (default: ./cache)"
    echo "  --log-level LEVEL      Log level: debug|info|warn|error (default: info)"
    echo ""
    echo "Other Options:"
    echo "  -c, --config FILE      Custom configuration file"
    echo "  --stop                 Stop running server"
    echo "  --status               Show server status"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                      # Start server with defaults"
    echo "  $0 -p 9000 -d           # Start on port 9000 in daemon mode"
    echo "  $0 --debug --verbose    # Start with debug logging"
    echo "  $0 --stop               # Stop running server"
}

# Logging functions
log_info() {
    if [ "$QUIET" != true ]; then
        echo -e "${BLUE}ℹ️  $1${NC}"
    fi
}

log_success() {
    if [ "$QUIET" != true ]; then
        echo -e "${GREEN}✅ $1${NC}"
    fi
}

log_warning() {
    if [ "$QUIET" != true ]; then
        echo -e "${YELLOW}⚠️  $1${NC}"
    fi
}

log_error() {
    if [ "$QUIET" != true ]; then
        echo -e "${RED}❌ $1${NC}"
    fi
}

log_verbose() {
    if [ "$VERBOSE" = true ] && [ "$QUIET" != true ]; then
        echo -e "${PURPLE}🔍 $1${NC}"
    fi
}

# Parse command line arguments
VERBOSE=false
QUIET=false
CONFIG_FILE="$RESOURCES_DIR/studio-config.json"
STOP_SERVER=false
SHOW_STATUS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            SERVER_PORT="$2"
            shift 2
            ;;
        -h|--host)
            HOST="$2"
            shift 2
            ;;
        -d|--daemon)
            DAEMON_MODE=true
            shift
            ;;
        --enable-api)
            ENABLE_API="true"
            shift
            ;;
        --enable-queue)
            ENABLE_RENDER_QUEUE="true"
            shift
            ;;
        --max-jobs)
            MAX_CONCURRENT_JOBS="$2"
            shift 2
            ;;
        --debug)
            DEBUG_MODE="true"
            LOG_LEVEL="debug"
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -q|--quiet)
            QUIET=true
            shift
            ;;
        --cache-dir)
            CACHE_DIR="$2"
            shift 2
            ;;
        --log-level)
            LOG_LEVEL="$2"
            shift 2
            ;;
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        --stop)
            STOP_SERVER=true
            shift
            ;;
        --status)
            SHOW_STATUS=true
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

# Check for Python and required packages
if ! command -v python3 &> /dev/null; then
    log_error "Python 3 is required but not installed"
    exit 1
fi

# Check for Blender
if ! command -v blender &> /dev/null; then
    log_error "Blender is required but not installed"
    exit 1
fi

# Load configuration if exists
if [ -f "$CONFIG_FILE" ]; then
    log_verbose "Loading configuration from: $CONFIG_FILE"
    SERVER_PORT=$(python3 -c "
import json
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    print(config.get('server_port', '$SERVER_PORT'))
except:
    print('$SERVER_PORT')
" 2>/dev/null || echo "$SERVER_PORT")

    ENABLE_API=$(python3 -c "
import json
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    print(str(config.get('enable_api', '$ENABLE_API')).lower())
except:
    print('$ENABLE_API')
" 2>/dev/null || echo "$ENABLE_API")

    ENABLE_RENDER_QUEUE=$(python3 -c "
import json
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    print(str(config.get('enable_render_queue', '$ENABLE_RENDER_QUEUE')).lower())
except:
    print('$ENABLE_RENDER_QUEUE')
" 2>/dev/null || echo "$ENABLE_RENDER_QUEUE")

    MAX_CONCURRENT_JOBS=$(python3 -c "
import json
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    print(config.get('max_concurrent_jobs', '$MAX_CONCURRENT_JOBS'))
except:
    print('$MAX_CONCURRENT_JOBS')
" 2>/dev/null || echo "$MAX_CONCURRENT_JOBS")

    CACHE_DIR=$(python3 -c "
import json
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    print(config.get('cache_directory', '$CACHE_DIR'))
except:
    print('$CACHE_DIR')
" 2>/dev/null || echo "$CACHE_DIR")
fi

# Validate port
if ! [[ "$SERVER_PORT" =~ ^[0-9]+$ ]] || [ "$SERVER_PORT" -lt 1024 ] || [ "$SERVER_PORT" -gt 65535 ]; then
    log_error "Invalid port number: $SERVER_PORT"
    exit 1
fi

# Create cache directory
mkdir -p "$CACHE_DIR"
mkdir -p "$CACHE_DIR/jobs"
mkdir -p "$CACHE_DIR/temp"
mkdir -p "$CACHE_DIR/logs"

# PID file for daemon mode
PID_FILE="$CACHE_DIR/mcp_server.pid"
LOG_FILE="$CACHE_DIR/logs/server.log"

# Function to check if server is running
check_server_status() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0  # Server is running
        else
            rm -f "$PID_FILE"  # Remove stale PID file
            return 1  # Server not running
        fi
    else
        return 1  # Server not running
    fi
}

# Function to stop server
stop_server() {
    if check_server_status; then
        local pid=$(cat "$PID_FILE")
        log_info "Stopping MCP server (PID: $pid)..."

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
                log_warning "Server was force killed"
            else
                log_success "Server stopped gracefully"
            fi

            rm -f "$PID_FILE"
        else
            log_error "Failed to stop server"
        fi
    else
        log_info "Server is not running"
    fi
}

# Function to show server status
show_server_status() {
    if check_server_status; then
        local pid=$(cat "$PID_FILE")
        echo -e "${GREEN}✅ MCP Server is running${NC}"
        echo -e "   PID: $pid"
        echo -e "   Port: $SERVER_PORT"
        echo -e "   Host: $HOST"
        echo -e "   Log: $LOG_FILE"

        # Show additional status via API if available
        if command -v curl &> /dev/null; then
            local health_check=$(curl -s "http://$HOST:$SERVER_PORT/health" 2>/dev/null || echo "")
            if [ -n "$health_check" ]; then
                echo -e "   Health: OK"
            fi
        fi
    else
        echo -e "${RED}❌ MCP Server is not running${NC}"
    fi
}

# Handle stop command
if [ "$STOP_SERVER" = true ]; then
    stop_server
    exit 0
fi

# Handle status command
if [ "$SHOW_STATUS" = true ]; then
    show_server_status
    exit 0
fi

# Check if server is already running
if check_server_status; then
    log_warning "MCP server is already running"
    echo -e "   Use '$0 --stop' to stop the server"
    echo -e "   Use '$0 --status' to check status"
    exit 1
fi

# Create MCP server Python script
MCP_SERVER_SCRIPT="$CACHE_DIR/mcp_server.py"

cat > "$MCP_SERVER_SCRIPT" << 'EOF'
#!/usr/bin/env python3

import json
import os
import sys
import time
import logging
import threading
import subprocess
import tempfile
import uuid
from datetime import datetime
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import socketserver
import signal
import atexit

# Configuration
CONFIG = {
    'host': os.environ.get('MCP_HOST', 'localhost'),
    'port': int(os.environ.get('MCP_PORT', '8080')),
    'enable_api': os.environ.get('MCP_ENABLE_API', 'true').lower() == 'true',
    'enable_render_queue': os.environ.get('MCP_ENABLE_RENDER_QUEUE', 'true').lower() == 'true',
    'max_concurrent_jobs': int(os.environ.get('MCP_MAX_JOBS', '4')),
    'cache_dir': os.environ.get('MCP_CACHE_DIR', './cache'),
    'log_level': os.environ.get('MCP_LOG_LEVEL', 'info'),
    'blender_path': os.environ.get('BLENDER_PATH', 'blender')
}

# Setup logging
logging.basicConfig(
    level=getattr(logging, CONFIG['log_level'].upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(CONFIG['cache_dir'], 'logs', 'server.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Job management
jobs = {}
job_queue = []
active_jobs = set()
job_lock = threading.Lock()

class MCPRequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        """Override to prevent default logging"""
        pass

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        try:
            parsed = urlparse(self.path)
            path = parsed.path
            query = parse_qs(parsed.query)

            if path == '/health':
                self.send_json_response({
                    'status': 'healthy',
                    'timestamp': datetime.now().isoformat(),
                    'version': '1.0.0',
                    'features': {
                        'api': CONFIG['enable_api'],
                        'render_queue': CONFIG['enable_render_queue'],
                        'max_jobs': CONFIG['max_concurrent_jobs']
                    }
                })

            elif path == '/status':
                self.send_json_response({
                    'server': 'running',
                    'active_jobs': len(active_jobs),
                    'queued_jobs': len(job_queue),
                    'total_jobs': len(jobs),
                    'cache_dir': CONFIG['cache_dir']
                })

            elif path == '/jobs':
                job_id = query.get('id', [None])[0]
                if job_id:
                    self.get_job_status(job_id)
                else:
                    self.list_jobs()

            elif path == '/queue':
                self.get_queue_status()

            else:
                self.send_error_response(404, "Endpoint not found")

        except Exception as e:
            logger.error(f"Error handling GET request: {e}")
            self.send_error_response(500, str(e))

    def do_POST(self):
        """Handle POST requests"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)

            try:
                data = json.loads(post_data.decode('utf-8'))
            except json.JSONDecodeError:
                self.send_error_response(400, "Invalid JSON")
                return

            parsed = urlparse(self.path)
            path = parsed.path

            if path == '/convert':
                self.handle_2d_to_3d_conversion(data)

            elif path == '/animate':
                self.handle_animation_request(data)

            elif path == '/render':
                self.handle_render_request(data)

            else:
                self.send_error_response(404, "Endpoint not found")

        except Exception as e:
            logger.error(f"Error handling POST request: {e}")
            self.send_error_response(500, str(e))

    def send_json_response(self, data, status_code=200):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode('utf-8'))

    def send_error_response(self, status_code, message):
        """Send error response"""
        self.send_json_response({
            'error': True,
            'status_code': status_code,
            'message': message
        }, status_code)

    def get_job_status(self, job_id):
        """Get status of a specific job"""
        with job_lock:
            if job_id in jobs:
                job = jobs[job_id]
                self.send_json_response(job)
            else:
                self.send_error_response(404, f"Job {job_id} not found")

    def list_jobs(self):
        """List all jobs"""
        with job_lock:
            self.send_json_response({
                'jobs': list(jobs.values()),
                'total': len(jobs)
            })

    def get_queue_status(self):
        """Get render queue status"""
        with job_lock:
            self.send_json_response({
                'queue_length': len(job_queue),
                'active_jobs': len(active_jobs),
                'max_concurrent': CONFIG['max_concurrent_jobs'],
                'queued_jobs': job_queue[:10]  # Show first 10 queued jobs
            })

    def handle_2d_to_3d_conversion(self, data):
        """Handle 2D to 3D conversion request"""
        try:
            # Validate required fields
            required_fields = ['input_file', 'output_file']
            for field in required_fields:
                if field not in data:
                    self.send_error_response(400, f"Missing required field: {field}")
                    return

            # Create job
            job_id = str(uuid.uuid4())
            job = {
                'id': job_id,
                'type': '2d_to_3d',
                'status': 'queued',
                'created_at': datetime.now().isoformat(),
                'started_at': None,
                'completed_at': None,
                'progress': 0,
                'input_data': data,
                'output_file': data['output_file'],
                'error': None
            }

            # Add to jobs and queue
            with job_lock:
                jobs[job_id] = job
                job_queue.append(job_id)

            # Start job processing
            threading.Thread(target=process_2d_to_3d_job, args=(job_id,), daemon=True).start()

            self.send_json_response({
                'job_id': job_id,
                'status': 'queued',
                'message': '2D to 3D conversion job queued successfully'
            })

        except Exception as e:
            logger.error(f"Error creating 2D to 3D conversion job: {e}")
            self.send_error_response(500, str(e))

    def handle_animation_request(self, data):
        """Handle animation generation request"""
        try:
            # Validate required fields
            required_fields = ['blend_file', 'animation_type']
            for field in required_fields:
                if field not in data:
                    self.send_error_response(400, f"Missing required field: {field}")
                    return

            # Create job
            job_id = str(uuid.uuid4())
            job = {
                'id': job_id,
                'type': 'animation',
                'status': 'queued',
                'created_at': datetime.now().isoformat(),
                'started_at': None,
                'completed_at': None,
                'progress': 0,
                'input_data': data,
                'output_file': data.get('output_file'),
                'error': None
            }

            # Add to jobs and queue
            with job_lock:
                jobs[job_id] = job
                job_queue.append(job_id)

            # Start job processing
            threading.Thread(target=process_animation_job, args=(job_id,), daemon=True).start()

            self.send_json_response({
                'job_id': job_id,
                'status': 'queued',
                'message': 'Animation job queued successfully'
            })

        except Exception as e:
            logger.error(f"Error creating animation job: {e}")
            self.send_error_response(500, str(e))

    def handle_render_request(self, data):
        """Handle render request"""
        try:
            # Validate required fields
            required_fields = ['blend_file']
            for field in required_fields:
                if field not in data:
                    self.send_error_response(400, f"Missing required field: {field}")
                    return

            # Create job
            job_id = str(uuid.uuid4())
            job = {
                'id': job_id,
                'type': 'render',
                'status': 'queued',
                'created_at': datetime.now().isoformat(),
                'started_at': None,
                'completed_at': None,
                'progress': 0,
                'input_data': data,
                'output_file': data.get('output_file'),
                'error': None
            }

            # Add to jobs and queue
            with job_lock:
                jobs[job_id] = job
                job_queue.append(job_id)

            # Start job processing
            threading.Thread(target=process_render_job, args=(job_id,), daemon=True).start()

            self.send_json_response({
                'job_id': job_id,
                'status': 'queued',
                'message': 'Render job queued successfully'
            })

        except Exception as e:
            logger.error(f"Error creating render job: {e}")
            self.send_error_response(500, str(e))

def process_job_queue():
    """Process jobs from the queue"""
    while True:
        job_id = None

        with job_lock:
            if len(active_jobs) < CONFIG['max_concurrent_jobs'] and job_queue:
                job_id = job_queue.pop(0)
                active_jobs.add(job_id)

                # Update job status
                if job_id in jobs:
                    jobs[job_id]['status'] = 'processing'
                    jobs[job_id]['started_at'] = datetime.now().isoformat()

        if job_id:
            # Process job based on type
            try:
                job = jobs[job_id]

                if job['type'] == '2d_to_3d':
                    execute_2d_to_3d_conversion(job_id)
                elif job['type'] == 'animation':
                    execute_animation_generation(job_id)
                elif job['type'] == 'render':
                    execute_render_job(job_id)
                else:
                    logger.error(f"Unknown job type: {job['type']}")

            except Exception as e:
                logger.error(f"Error processing job {job_id}: {e}")
                with job_lock:
                    if job_id in jobs:
                        jobs[job_id]['status'] = 'failed'
                        jobs[job_id]['error'] = str(e)
                        jobs[job_id]['completed_at'] = datetime.now().isoformat()

            finally:
                with job_lock:
                    active_jobs.discard(job_id)

        else:
            time.sleep(1)  # Wait before checking queue again

def execute_2d_to_3d_conversion(job_id):
    """Execute 2D to 3D conversion"""
    try:
        job = jobs[job_id]
        data = job['input_data']

        # Build command
        cmd = [
            CONFIG['blender_path'],
            '--background',
            '--python',
            os.path.join(os.path.dirname(__file__), '..', 'scripts', '2d_to-3d.py'),
            '--input', data['input_file'],
            '--output', data['output_file']
        ]

        # Add optional parameters
        if 'extrusion_depth' in data:
            cmd.extend(['--depth', str(data['extrusion_depth'])])
        if 'quality' in data:
            cmd.extend(['--quality', data['quality']])
        if 'generate_materials' in data:
            cmd.extend(['--materials', str(data['generate_materials']).lower()])

        # Execute command
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        # Update progress
        job['progress'] = 50

        # Wait for completion
        stdout, stderr = process.wait(), ""

        if process.returncode == 0:
            job['status'] = 'completed'
            job['progress'] = 100
            logger.info(f"2D to 3D conversion completed: {job_id}")
        else:
            job['status'] = 'failed'
            job['error'] = stderr
            logger.error(f"2D to 3D conversion failed: {job_id} - {stderr}")

        job['completed_at'] = datetime.now().isoformat()

    except Exception as e:
        logger.error(f"Error executing 2D to 3D conversion {job_id}: {e}")
        with job_lock:
            if job_id in jobs:
                jobs[job_id]['status'] = 'failed'
                jobs[job_id]['error'] = str(e)
                jobs[job_id]['completed_at'] = datetime.now().isoformat()

def execute_animation_generation(job_id):
    """Execute animation generation"""
    # Placeholder for animation generation
    time.sleep(5)  # Simulate processing time

    with job_lock:
        if job_id in jobs:
            jobs[job_id]['status'] = 'completed'
            jobs[job_id]['progress'] = 100
            jobs[job_id]['completed_at'] = datetime.now().isoformat()

def execute_render_job(job_id):
    """Execute render job"""
    # Placeholder for render job
    time.sleep(10)  # Simulate processing time

    with job_lock:
        if job_id in jobs:
            jobs[job_id]['status'] = 'completed'
            jobs[job_id]['progress'] = 100
            jobs[job_id]['completed_at'] = datetime.now().isoformat()

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info("Received shutdown signal, stopping server...")
    sys.exit(0)

def cleanup():
    """Cleanup function"""
    logger.info("Cleaning up...")

# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)
atexit.register(cleanup)

def main():
    """Main server function"""
    logger.info(f"Starting Blender MCP Server on {CONFIG['host']}:{CONFIG['port']}")

    # Start job queue processor
    queue_thread = threading.Thread(target=process_job_queue, daemon=True)
    queue_thread.start()

    # Create server
    server = HTTPServer((CONFIG['host'], CONFIG['port']), MCPRequestHandler)

    logger.info("Blender MCP Server started successfully")
    logger.info(f"Health check: http://{CONFIG['host']}:{CONFIG['port']}/health")
    logger.info(f"Job status: http://{CONFIG['host']}:{CONFIG['port']}/status")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Server interrupted by user")
    finally:
        server.shutdown()
        logger.info("Server shutdown complete")

if __name__ == '__main__':
    main()
EOF

# Make server script executable
chmod +x "$MCP_SERVER_SCRIPT"

# Set environment variables for the server
export MCP_HOST="$HOST"
export MCP_PORT="$SERVER_PORT"
export MCP_ENABLE_API="$ENABLE_API"
export MCP_ENABLE_RENDER_QUEUE="$ENABLE_RENDER_QUEUE"
export MCP_MAX_JOBS="$MAX_CONCURRENT_JOBS"
export MCP_CACHE_DIR="$CACHE_DIR"
export MCP_LOG_LEVEL="$LOG_LEVEL"
export BLENDER_PATH="$blender_path"

echo -e "${CYAN}🚀 Blender 3D Animation Studio - MCP Server${NC}"
echo -e "${CYAN}🌐 Starting MCP server for Blender automation...${NC}"
echo ""
echo -e "📡 Server Configuration:"
echo -e "   • Host: $HOST"
echo -e "   • Port: $SERVER_PORT"
echo -e "   • API: $ENABLE_API"
echo -e "   • Render Queue: $ENABLE_RENDER_QUEUE"
echo -e "   • Max Jobs: $MAX_CONCURRENT_JOBS"
echo -e "   • Cache: $CACHE_DIR"
echo -e "   • Log Level: $LOG_LEVEL"
echo ""

# Start server
if [ "$DAEMON_MODE" = true ]; then
    log_info "Starting server in daemon mode..."
    nohup python3 "$MCP_SERVER_SCRIPT" > "$LOG_FILE" 2>&1 &
    local server_pid=$!
    echo "$server_pid" > "$PID_FILE"

    log_success "MCP Server started in daemon mode"
    echo -e "   PID: $server_pid"
    echo -e "   Log: $LOG_FILE"
    echo -e ""
    echo -e "${BLUE}🔗 API Endpoints:${NC}"
    echo -e "   • Health: http://$HOST:$SERVER_PORT/health"
    echo -e "   • Status: http://$HOST:$SERVER_PORT/status"
    echo -e "   • Jobs: http://$HOST:$SERVER_PORT/jobs"

else
    log_info "Starting server in foreground mode..."
    echo -e "${BLUE}🔗 API Endpoints:${NC}"
    echo -e "   • Health: http://$HOST:$SERVER_PORT/health"
    echo -e "   • Status: http://$HOST:$SERVER_PORT/status"
    echo -e "   • Jobs: http://$HOST:$SERVER_PORT/jobs"
    echo ""
    echo -e "${YELLOW}💡 Press Ctrl+C to stop the server${NC}"
    echo ""

    # Start server in foreground
    python3 "$MCP_SERVER_SCRIPT"
fi

echo ""
echo -e "${GREEN}✨ Blender MCP Server is ready for automation!${NC}"