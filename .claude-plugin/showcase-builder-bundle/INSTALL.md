#!/bin/bash
# Showcase Builder Bundle - Installation Script
# Part of CLDCDE Ecosystem

set -e

echo "🚀 Showcase Builder Bundle - Installation"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v bun &> /dev/null; then
    echo "⚠️  Bun not found. Highly recommended for faster development."
    echo "   Install: curl -fsSL https://bun.sh/install | bash"
fi

echo -e "${GREEN}✓ Prerequisites met${NC}"
echo ""

# Install to Claude Code skills directory
CLAUDE_SKILLS_DIR=".claude/skills"
BUNDLE_DIR=".claude-plugin/showcase-builder-bundle"

echo -e "${BLUE}Installing skills to ${CLAUDE_SKILLS_DIR}...${NC}"

# Create symlinks for each skill
skills=("frontend-design" "stripe-integration" "lemon-squeezy-integration" "documentation-generator")

for skill in "${skills[@]}"; do
    if [ -f "${BUNDLE_DIR}/skills/${skill}.md" ]; then
        echo "  → Installing ${skill}..."
        ln -sf "../../${BUNDLE_DIR}/skills/${skill}.md" "${CLAUDE_SKILLS_DIR}/${skill}.md"
    else
        echo "  ⚠️  ${skill} not found, skipping..."
    fi
done

echo -e "${GREEN}✓ Skills installed${NC}"
echo ""

# Create Ralph templates for bundle
echo -e "${BLUE}Creating Ralph templates...${NC}"

mkdir -p ".claude/ralph-templates/showcase-builder"

cat > ".claude/ralph-templates/showcase-builder/phase-1-foundation.md" << 'EOF'
# Phase 1: Foundation

Initialize Next.js 15 project with TypeScript, Tailwind CSS v4, and Framer Motion.

Requirements:
- Next.js 15 + React 19
- TypeScript configuration
- Tailwind CSS v4 with custom theme
- Framer Motion for animations
- Supabase client setup
- Environment variables

Steps:
1. Create Next.js app: bun create next-app
2. Install dependencies: tailwindcss framer-motion @supabase/supabase-js
3. Configure Tailwind with custom theme (no purple!)
4. Set up directory structure
5. Create base layout
6. Configure environment variables
7. Test build: bun run build

Success criteria:
- App builds without errors
- Tailwind styles working
- Dark mode configured
- Supabase client connects

Output <promise>PHASE1_COMPLETE</promise>
EOF

cat > ".claude/ralph-templates/showcase-builder/phase-2-design.md" << 'EOF'
# Phase 2: Design System

Create bespoke design system with unique visual identity.

Requirements:
- Custom color palette (avoid purple gradients)
- Typography scale
- Spacing system
- Component library structure
- Dark mode as default
- 3D card components with Spline

Design Principles:
- Intentional minimalism
- Strong visual hierarchy
- Mobile-first responsive
- Accessible (WCAG AA)
- Fast and performant

Components to create:
- Button (primary, secondary, ghost)
- Card (3D interactive)
- Badge
- Input fields
- Modal
- Toast notifications

Output <promise>PHASE2_COMPLETE</promise>
EOF

cat > ".claude/ralph-templates/showcase-builder/phase-3-showcase.md" << 'EOF'
# Phase 3: Tool Showcase

Build tool showcase grid with 3D interactive cards.

Requirements:
- Fetch tools from GitHub API
- Create 3D card component
- Implement filtering/searching
- Add animations (Framer Motion)
- Lazy loading
- Responsive grid layout

Features:
- Grid view / List view toggle
- Filter by category
- Search by name/description
- Sort by stars/date
- GitHub stats display
- Install command copying

Output <promise>PHASE3_COMPLETE</promise>
EOF

cat > ".claude/ralph-templates/showcase-builder/phase-4-payments.md" << 'EOF'
# Phase 4: Payment Integration

Integrate Stripe, Lemon Squeezy, and PayPal.

Requirements:
- Stripe checkout (one-time)
- Lemon Squeezy (subscriptions + licenses)
- PayPal (alternative payment)
- Customer dashboard
- Webhook handlers
- License management

Pages:
- Pricing page with tier toggle
- Checkout success/failure
- Customer dashboard
- License management
- Subscription management

Security:
- Webhook signature verification
- API key validation
- User authentication
- Secure license storage

Output <promise>PHASE4_COMPLETE</promise>
EOF

cat > ".claude/ralph-templates/showcase-builder/phase-5-docs.md" << 'EOF'
# Phase 5: Documentation

Auto-generate documentation from GitHub repositories.

Requirements:
- Sync README files
- Generate API reference
- Create usage examples
- Interactive code snippets
- Full-text search
- Version support

Features:
- Auto-sync from GitHub
- MDX processing
- Syntax highlighting
- Search functionality
- Mobile responsive
- Dark mode

Output <promise>PHASE5_COMPLETE</promise>
EOF

cat > ".claude/ralph-templates/showcase-builder/phase-6-deploy.md" << 'EOF'
# Phase 6: Deployment

Deploy to Cloudflare with CI/CD automation.

Requirements:
- Cloudflare Pages setup
- Workers for API
- Environment configuration
- Analytics integration (Plausible)
- Performance optimization
- Error monitoring

Steps:
1. Create Cloudflare Pages project
2. Configure build settings
3. Set up Workers for API routes
4. Add environment variables
5. Configure custom domain
6. Enable analytics
7. Test deployment
8. Set up GitHub Actions for auto-deploy

Success criteria:
- Site deployed and accessible
- All pages working
- Payments processing
- Analytics tracking
- Fast performance (<2s LCP)

Output <promise>PHASE6_COMPLETE</promise>
EOF

echo -e "${GREEN}✓ Ralph templates created${NC}"
echo ""

# Create quick-start script
echo -e "${BLUE}Creating quick-start script...${NC}"

cat > "showcase-builder-start.sh" << 'EOF'
#!/bin/bash
# Quick Start Script for Showcase Builder

echo "🎨 Showcase Builder - Quick Start"
echo "================================="
echo ""

echo "Choose an option:"
echo "1. Start Phase 1 (Foundation)"
echo "2. Start Phase 2 (Design System)"
echo "3. Start Phase 3 (Tool Showcase)"
echo "4. Start Phase 4 (Payments)"
echo "5. Start Phase 5 (Documentation)"
echo "6. Start Phase 6 (Deployment)"
echo "7. Run All Phases (Overnight Build)"
echo "8. Exit"
echo ""

read -p "Enter choice (1-8): " choice

case $choice in
  1)
    /ralph-loop "$(cat .claude/ralph-templates/showcase-builder/phase-1-foundation.md)" --max-iterations 50
    ;;
  2)
    /ralph-loop "$(cat .claude/ralph-templates/showcase-builder/phase-2-design.md)" --max-iterations 50
    ;;
  3)
    /ralph-loop "$(cat .claude/ralph-templates/showcase-builder/phase-3-showcase.md)" --max-iterations 60
    ;;
  4)
    /ralph-loop "$(cat .claude/ralph-templates/showcase-builder/phase-4-payments.md)" --max-iterations 80
    ;;
  5)
    /ralph-loop "$(cat .claude/ralph-templates/showcase-builder/phase-5-docs.md)" --max-iterations 50
    ;;
  6)
    /ralph-loop "$(cat .claude/ralph-templates/showcase-builder/phase-6-deploy.md)" --max-iterations 40
    ;;
  7)
    echo "🌙 Starting overnight build... Sleep tight!"
    echo "This will take 6-8 hours to complete all phases."
    echo ""
    /ralph-loop "$(cat .claude/ralph-templates/showcase-builder/phase-1-foundation.md)" --max-iterations 50
    /ralph-loop "$(cat .claude/ralph-templates/showcase-builder/phase-2-design.md)" --max-iterations 50
    /ralph-loop "$(cat .claude/ralph-templates/showcase-builder/phase-3-showcase.md)" --max-iterations 60
    /ralph-loop "$(cat .claude/ralph-templates/showcase-builder/phase-4-payments.md)" --max-iterations 80
    /ralph-loop "$(cat .claude/ralph-templates/showcase-builder/phase-5-docs.md)" --max-iterations 50
    /ralph-loop "$(cat .claude/ralph-templates/showcase-builder/phase-6-deploy.md)" --max-iterations 40
    ;;
  8)
    echo "Goodbye! 👋"
    exit 0
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac
EOF

chmod +x showcase-builder-start.sh

echo -e "${GREEN}✓ Quick-start script created: showcase-builder-start.sh${NC}"
echo ""

# Summary
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Installation Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo "📦 Installed Skills:"
echo "  • Frontend Design (Official Anthropic)"
echo "  • Stripe Integration"
echo "  • Lemon Squeezy Integration"
echo "  • Documentation Generator"
echo ""
echo "🚀 Quick Start:"
echo "  Run: ./showcase-builder-start.sh"
echo ""
echo "📚 Ralph Templates:"
echo "  Located in: .claude/ralph-templates/showcase-builder/"
echo ""
echo "💡 Pro Tip:"
echo "  Use option 7 in quick-start to build your entire site overnight!"
echo ""
echo "📖 Documentation:"
echo "  See .claude-plugin/showcase-builder-bundle/ for full docs"
echo ""
