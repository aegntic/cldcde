# 🎨 Showcase Builder Bundle

**Complete toolkit for building awesome tool showcase websites with e-commerce integration**

Part of the CLDCDE Ecosystem by ae.ltd

---

## ✨ What This Bundle Gives You

A complete, production-ready system for showcasing your tools with payment integration, automation, and beautiful design.

### 🎯 Perfect For

- ✅ **Open Source Tools** - Beautiful portfolios for your projects
- ✅ **Digital Products** - Sell licenses and subscriptions
- ✅ **SaaS Products** - Complete landing pages with pricing
- ✅ **Agency Portfolios** - Showcase client work

---

## 📦 What's Included

### 🖼️ Design Skills

1. **Frontend Design (Official Anthropic)**
   - Bespoke, minimalist UI design
   - Avoids generic AI aesthetics (no purple gradients!)
   - Production-grade code quality
   - Framework-agnostic patterns

2. **3D Showcase Components**
   - Interactive 3D cards using Spline
   - Depth-based animations
   - Mobile responsive

### 💰 Payment Integration

3. **Stripe Integration**
   - One-time payments
   - Subscriptions
   - Webhook handling
   - Customer portal

4. **Lemon Squeezy Integration**
   - Merchant of record (tax handling!)
   - License key generation
   - Subscription + one-time payments
   - Perfect for digital products

5. **PayPal Integration**
   - Express checkout
   - Recurring billing
   - Alternative payment option

### 📚 Documentation

6. **Documentation Generator**
   - Auto-sync from GitHub READMEs
   - API reference generation
   - Interactive code examples
   - Full-text search

### 🚀 Automation

7. **Ralph Integration**
   - Build entire site overnight
   - Autonomous development loops
   - Self-correcting code
   - Multi-phase projects

---

## 🎯 Tech Stack

```yaml
Frontend:
  Framework: Next.js 15
  UI: React 19
  Styling: Tailwind CSS v4
  Animations: Framer Motion
  3D: Spline
  Language: TypeScript

Backend:
  CMS: Supabase
  API: Cloudflare Workers
  Database: PostgreSQL

Payments:
  Primary: Stripe
  Secondary: Lemon Squeezy
  Alternative: PayPal

Analytics:
  Primary: Plausible (privacy-friendly)
  Fallback: Fathom

Deployment:
  Hosting: Cloudflare Pages
  Edge: Cloudflare Workers
  CDN: Cloudflare CDN
```

---

## 🚀 Quick Start

### Installation Complete! ✅

The bundle has been installed to your system. Here's how to use it:

### Option 1: Interactive Quick Start

```bash
./showcase-builder-start.sh
```

This gives you a menu with 8 options:
1. Start Phase 1 (Foundation)
2. Start Phase 2 (Design System)
3. Start Phase 3 (Tool Showcase)
4. Start Phase 4 (Payments)
5. Start Phase 5 (Documentation)
6. Start Phase 6 (Deployment)
7. **Run All Phases (Overnight Build)** ⭐
8. Exit

### Option 2: Manual Ralph Loops

```bash
# Phase 1: Foundation
/ralph-loop "$(cat .claude/ralph-templates/showcase-builder/phase-1-foundation.md)" \
  --max-iterations 50

# Phase 2: Design System
/ralph-loop "$(cat .claude/ralph-templates/showcase-builder/phase-2-design.md)" \
  --max-iterations 50

# Phase 3: Tool Showcase
/ralph-loop "$(cat .claude/ralph-templates/showcase-builder/phase-3-showcase.md)" \
  --max-iterations 60

# Phase 4: Payment Integration
/ralph-loop "$(cat .claude/ralph-templates/showcase-builder/phase-4-payments.md)" \
  --max-iterations 80

# Phase 5: Documentation
/ralph-loop "$(cat .claude/ralph-templates/showcase-builder/phase-5-docs.md)" \
  --max-iterations 50

# Phase 6: Deployment
/ralph-loop "$(cat .claude/ralph-templates/showcase-builder/phase-6-deploy.md)" \
  --max-iterations 40
```

### Option 3: Overnight Build (Recommended!) 🌙

Run the quick-start script and choose option 7. This will:
- Build all 6 phases sequentially
- Take 6-8 hours to complete
- Produce a fully deployed, production-ready site
- Let you sleep while Claude works!

---

## 📁 What Was Created

```
.claude-plugin/showcase-builder-bundle/
├── plugin.json                          # Bundle manifest
├── INSTALL.md                           # Installation script
├── README.md                            # This file
└── skills/
    ├── frontend-design.md               # Anthropic official frontend design
    ├── stripe-integration.md            # Stripe payment guide
    ├── lemon-squeezy-integration.md     # Lemon Squeezy guide
    └── documentation-generator.md       # Auto-docs generator

.claude/skills/                          # Symlinks to above skills
├── frontend-design.md
├── stripe-integration.md
├── lemon-squeezy-integration.md
└── documentation-generator.md

.claude/ralph-templates/showcase-builder/
├── phase-1-foundation.md                # Next.js setup
├── phase-2-design.md                    # Design system
├── phase-3-showcase.md                  # Tool showcase
├── phase-4-payments.md                  # Payment integration
├── phase-5-docs.md                      # Documentation
└── phase-6-deploy.md                    # Deployment

showcase-builder-start.sh                # Quick-start script
```

---

## 🎨 Design Philosophy

### Avoiding Generic AI Aesthetics

This bundle specifically avoids the typical "purple gradient" AI-generated look. Instead:

- **Intentional minimalism** - Less is more
- **Unique color palettes** - Coral, teal, gold, charcoal
- **Bespoke layouts** - Asymmetric, grid-breaking
- **Dark mode default** - Developer-friendly
- **3D elements** - Interactive Spline cards

### Visual Differentiation

Your tool showcase will stand out with:
- Interactive 3D cards for each tool
- Smooth animations (not distracting)
- Clear visual hierarchy
- Strong typography
- Purposeful white space

---

## 💡 Usage Examples

### Open Source Tool Showcase

```typescript
// Display your GitHub tools automatically
const tools = await fetch('https://api.github.com/users/yourname/repos');

<ToolGrid>
  {tools.map(tool => (
    <ToolCard3D key={tool.id} tool={tool} />
  ))}
</ToolGrid>
```

### Selling Digital Products

```typescript
// One-time purchase with Stripe
<BuyButton
  priceId="price_1234"
  toolId="pro-tool"
  paymentProvider="stripe"
/>

// Subscription with Lemon Squeezy
<SubscribeButton
  variantId="5678"
  paymentProvider="lemon-squeezy"
/>
```

### Auto-Generated Documentation

```markdown
Just update your README.md and the docs automatically sync!

Features:
- Pulls from GitHub automatically
- Extracts API reference from JSDoc
- Creates interactive examples
- Full-text search
- Multiple versions
```

---

## 🎓 Learning Resources

Each skill includes comprehensive documentation:

### Frontend Design
- Official Anthropic skill
- Production-grade UI patterns
- Accessibility best practices
- Performance optimization

### Payment Integration
- Complete implementation guides
- Webhook handling
- Security best practices
- Testing strategies

### Documentation
- MDX processing
- GitHub integration
- Search implementation
- Version management

---

## 🔧 Configuration

### Environment Variables

```env
# .env.local
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Lemon Squeezy
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_STORE_ID=...
LEMONSQUEEZY_WEBHOOK_SECRET=...

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=...

# Deployment
NEXT_PUBLIC_URL=https://yourdomain.com
```

---

## 🚀 Deployment

### Cloudflare Pages (Recommended)

1. Connect your GitHub repo
2. Build command: `bun run build`
3. Output directory: `.next`
4. Add environment variables
5. Deploy!

### Automatic Deployments

Every push to `main` triggers:
- Build and test
- Generate documentation
- Deploy to production
- Update analytics

---

## 📊 Features by Tier

### Core (Free)
- ✅ All frontend design features
- ✅ Tool showcase grid
- ✅ GitHub integration
- ✅ Auto documentation
- ✅ One payment provider
- ✅ Community support

### Pro (Also Free - Open Source!)
- ✅ All Core features
- ✅ Multi-payment providers
- ✅ Customer dashboard
- ✅ License management
- ✅ Priority support
- ✅ Advanced analytics

**Note:** This bundle is 100% open source. All features are free!

---

## 🤝 Contributing

This is an open source project. Contributions welcome!

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR

---

## 📞 Support

### Community
- GitHub Issues
- CLDCDE Discord
- Community forums

### Documentation
- Full skill docs in `skills/` directory
- Ralph templates in `.claude/ralph-templates/`
- Quick-start script: `./showcase-builder-start.sh`

---

## 🙏 Acknowledgments

### Official Sources
- [Anthropic Frontend Design Skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)
- [Stripe Documentation](https://stripe.com/docs)
- [Lemon Squeezy API](https://docs.lemonsqueezy.com/api)
- [Next.js Documentation](https://nextjs.org/docs)

### Inspiration
- Vercel's design system
- Stripe's documentation
- Lemon Squeezy's UX
- Awesome Claude community

---

## 📄 License

MIT License - Feel free to use, modify, and distribute.

---

## 🎉 You're Ready!

Your showcase builder bundle is installed and ready to use.

**Next Step:**
```bash
./showcase-builder-start.sh
```

Choose option 7 to build your entire site overnight! 🌙

**Built with ❤️ by ae.ltd**
**Part of the CLDCDE Ecosystem**

---

## 📚 Quick Links

- [Full Documentation](.claude-plugin/showcase-builder-bundle/skills/)
- [Ralph Templates](.claude/ralph-templates/showcase-builder/)
- [Installation Script](.claude-plugin/showcase-builder-bundle/INSTALL.md)
- [CLDCDE Platform](https://cldcde.cc)

---

**Remember:** This bundle uses your existing skills (Ralph, Spline Professional, GitHub automation) plus adds the new payment and frontend skills. Everything works together seamlessly!

Happy building! 🚀
