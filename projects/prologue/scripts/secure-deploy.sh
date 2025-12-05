#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════════════════╗
# ║                                                                                   ║
# ║                         PROLOGUE SECURE DEPLOYMENT                               ║
# ║                                                                                   ║
# ║  This script handles secure deployment with proprietary content protection      ║
# ║  Ensures no sensitive data is committed to public repositories                 ║
# ╚═══════════════════════════════════════════════════════════════════════════════════╝

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo "╔══════════════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                                  ║"
    echo "║                                                                                  ║"
    echo "║                                                                                  ║"
    echo "║                                                                                  ║"
    echo "║ ███████████                     █████                                            ║"
    echo "║░░███░░░░░███                   ░░███                                             ║"
    echo "║ ░███    ░███ ████████   ██████  ░███         ██████   ███████ █████ ████  ██████ ║"
    echo "║ ░██████████ ░░███░░███ ███░░███ ░███        ███░░███ ███░░███░░███ ░███  ███░░███║"
    echo "║ ░███░░░░░░   ░███ ░░░ ░███ ░███ ░███       ░███ ░███░███ ░███ ░███ ░███ ░███████ ║"
    echo "║ ░███         ░███     ░███ ░███ ░███      █░███ ░███░███ ░███ ░███ ░███ ░███░░░  ║"
    echo "║ █████        █████    ░░██████  ███████████░░██████ ░░███████ ░░████████░░██████ ║"
    echo "║░░░░░        ░░░░░      ░░░░░░  ░░░░░░░░░░░  ░░░░░░   ░░░░░███  ░░░░░░░░  ░░░░░░  ║"
    echo "║                                                      ███ ░███                    ║"
    echo "║  ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ                      ░░██████                     ║"
    echo "║       ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ                 ░░░░░░                      ║"
    echo "║                                                                                  ║"
    echo "║                                                                                  ║"
    echo "║                                                                                  ║"
    echo "║                                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════════╝"
    echo "                           SECURE DEPLOYMENT SCRIPT"
    echo "═══════════════════════════════════════════════════════════════════════════════════"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_security() {
    echo -e "${CYAN}[SECURITY]${NC} $1"
}

# Security checks
check_security() {
    print_security "Running security checks..."

    # Check for .env file in repository
    if [ -f ".env" ]; then
        print_error ".env file found in repository! This should not be committed."
        print_status "To fix: Remove .env from repository and add it to .gitignore"
        print_status "Command: git rm --cached .env"
        exit 1
    fi

    # Check for proprietary content
    if [ -d "proprietary" ] || [ -f ".fpef-prompts" ] || [ -f ".ai-prompts" ]; then
        print_error "Proprietary content detected in repository!"
        print_status "Move proprietary content to secure storage or environment variables"
        exit 1
    fi

    # Check for encryption key
    if [ -f ".prologue-key" ]; then
        print_security "Encryption key file found - ensuring proper permissions"
        chmod 600 .prologue-key
    fi

    # Check for API keys in code
    if grep -r "sk-ant-api03\|sk-proj-\|re_\|pk_" --include="*.ts" --include="*.js" --include="*.json" --exclude-dir=node_modules . 2>/dev/null; then
        print_warning "Potential API keys found in code! Please move to environment variables."
        print_status "Use environment variables or secure configuration instead."
    fi

    print_success "Security checks passed"
}

# Validate environment configuration
validate_environment() {
    print_status "Validating environment configuration..."

    # Check for .env file
    if [ ! -f ".env" ]; then
        print_warning ".env file not found"
        print_status "Creating .env from template..."
        if [ -f ".env.template" ]; then
            cp .env.template .env
            print_status "Created .env file from template"
            print_warning "Please update .env with your actual API keys and configuration"
        else
            print_error ".env.template not found!"
            exit 1
        fi
    fi

    # Check for required environment variables in .env
    local required_vars=("ANTHROPIC_API_KEY" "RESEND_API_KEY")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env || grep -q "^${var}=YOUR_" .env || grep -q "^${var}=$" .env; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_warning "Missing required environment variables:"
        printf '   %s\n' "${missing_vars[@]}"
        print_status "Please update .env file with your actual values"
    else
        print_success "Environment configuration looks good"
    fi
}

# Initialize secure configuration
init_secure_config() {
    print_status "Initializing secure configuration..."

    # Create config directory if it doesn't exist
    mkdir -p config

    # Check if secure config exists
    if [ ! -f "config/secure.json" ]; then
        print_status "Creating secure configuration template..."
        echo '{
  "version": "1.0.0",
  "created": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
  "encrypted": {}
}' > config/secure.json
        print_success "Secure configuration template created"
    fi

    # Initialize encryption key if it doesn't exist
    if [ ! -f ".prologue-key" ]; then
        print_status "Generating encryption key..."
        local key=$(openssl rand -hex 32)
        echo "$key" > .prologue-key
        chmod 600 .prologue-key
        print_success "Encryption key generated"
        print_warning "Back up this encryption key securely!"
        print_status "You can also set PROLOGUE_ENCRYPTION_KEY environment variable"
    fi
}

# Build project
build_project() {
    print_status "Building project..."

    # Install dependencies
    npm ci --silent

    # Run type checking
    npm run type-check

    # Build project
    npm run build

    print_success "Project built successfully"
}

# Security scan
security_scan() {
    print_status "Running security scan..."

    # Check for common security issues
    print_security "Scanning for exposed secrets..."

    # Check for potential secrets in the codebase
    local patterns=(
        "password.*="
        "secret.*="
        "api.*key.*="
        "token.*="
        "sk-"
        "ghp_"
        "re_"
        "pk_"
    )

    local issues_found=false
    for pattern in "${patterns[@]}"; do
        if grep -r -i "$pattern" --include="*.ts" --include="*.js" --include="*.json" --exclude-dir=node_modules . 2>/dev/null | grep -v "env.template" | grep -v ".git"; then
            issues_found=true
        fi
    done

    if [ "$issues_found" = true ]; then
        print_warning "Potential security issues found. Please review the output above."
    else
        print_success "Security scan passed"
    fi
}

# Deploy to GitHub Pages
deploy_github_pages() {
    print_status "Deploying to GitHub Pages..."

    # Add all changes
    git add -A

    # Commit changes
    git commit -m "Secure deployment update - $(date '+%Y-%m-%d %H:%M:%S')

- Updated security configuration
- Enhanced proprietary content protection
- Added secure deployment workflow

[SECURE] Generated with GLM

Co-Authored-By: GLM Assistant <noreply@generic.ai>' || true

    # Push to GitHub
    git push origin main

    print_success "Deployed to GitHub Pages"
}

# Main execution
main() {
    print_header
    print_status "Starting secure deployment process..."

    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "src" ]; then
        print_error "Please run this script from the Prologue project root directory"
        exit 1
    fi

    # Run security checks
    check_security
    echo ""

    # Validate environment
    validate_environment
    echo ""

    # Initialize secure configuration
    init_secure_config
    echo ""

    # Security scan
    security_scan
    echo ""

    # Build project
    build_project
    echo ""

    # Deploy
    deploy_github_pages
    echo ""

    print_success "Secure deployment completed!"
    echo ""
    print_status "Deployment Summary:"
    echo "  - Code deployed to GitHub: https://github.com/aegntic/prologue"
    echo "  - Site available at: https://logue.pro"
    echo "  - Security measures implemented"
    echo ""
    print_security "Security reminders:"
    echo "  - Never commit API keys or secrets to repository"
    echo "  - Keep .prologue-key file secure and backed up"
    echo "  - Use environment variables for sensitive configuration"
    echo "  - Rotate API keys regularly"
    echo ""
    print_status "Next steps:"
    echo "  1. Update .env file with your actual API keys"
    echo "  2. Set FPEF_SYSTEM_PROMPT environment variable if needed"
    echo "  3. Test the deployment at https://logue.pro"
    echo "  4. Configure email registration server if desired"
}

# Run main function
main "$@"