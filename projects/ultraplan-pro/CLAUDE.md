# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

zkFlow.pro is a professional form automation Chrome extension with a Next.js website for license management and payments. The system consists of:

1. **Chrome Extension**: Smart form detection, workflow recording/playback, and automation (Manifest V3)
2. **Website**: Next.js 14 app with Supabase backend and Stripe integration for licensing
3. **Infrastructure**: PostgreSQL database, API endpoints, and webhook handlers

## Architecture

```
zkFlow.pro/
├── extension/              # Chrome extension (Manifest V3)
│   ├── src/
│   │   ├── popup/         # Extension popup UI
│   │   ├── content/       # Content scripts (form detection, recording, playback)
│   │   ├── background/    # Service worker
│   │   └── options/       # Settings page
│   └── assets/            # Icons and styles
│
└── website/               # Next.js 14 website
    ├── app/               # App router pages
    │   ├── api/           # API routes
    │   │   ├── webhooks/  # Stripe webhooks
    │   │   └── validate-license/
    │   ├── auth/          # Authentication pages
    │   ├── dashboard/     # User dashboard
    │   └── pricing/       # Pricing page
    ├── components/        # React components
    ├── lib/               # Core libraries
    └── types/             # TypeScript definitions
```

## Development Commands

### Chrome Extension
```bash
cd extension
npm install                # Install dependencies
npm run build              # Build extension for production
npm run watch              # Watch mode for development
npm run package            # Create zip for Chrome Web Store
npm run generate-icons     # Generate icon sizes
```

### Website
```bash
cd website
npm install                # Install dependencies
npm run dev                # Start development server (http://localhost:3000)
npm run build              # Build for production
npm run lint               # Run ESLint
```

### Database Setup
```bash
# Run the SQL schema in Supabase dashboard
# File: supabase-schema.sql
```

## Key Technologies

### Extension Stack
- **Manifest V3**: Modern Chrome extension architecture
- **Content Scripts**: form-detector.js, flow-recorder.js, flow-player.js
- **Service Worker**: background/service-worker.js
- **Storage**: Chrome Storage API for workflows and settings

### Website Stack
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom brand colors
- **UI Components**: Radix UI primitives
- **Forms**: React Hook Form with Zod validation
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe integration
- **Authentication**: Supabase Auth

## API Endpoints

### License Validation
```typescript
POST /api/validate-license
Body: { 
  licenseKey: string,
  deviceId: string 
}
Response: {
  valid: boolean,
  tier: string,
  message: string
}
```

### Stripe Webhooks
```typescript
POST /api/webhooks/stripe
// Handles subscription events from Stripe
```

## Database Schema

Key tables:
- **profiles**: User accounts linked to auth.users
- **license_keys**: Generated keys with tier and device limits
- **installations**: Track active devices per license
- **form_fills**: Analytics for form automation usage
- **teams**: Team accounts with seat management

Key functions:
- `generate_license_key()`: Create new license for user
- `validate_license()`: Check license validity and device limits
- `track_form_fill()`: Record form automation events

## Extension Architecture

### Content Scripts
1. **form-detector.js**: Analyzes pages for form elements
2. **flow-recorder.js**: Records user interactions into workflows
3. **flow-player.js**: Replays recorded workflows automatically

### Message Passing
```javascript
// Content to Background
chrome.runtime.sendMessage({ 
  action: 'startRecording',
  data: { /* ... */ }
});

// Background to Content
chrome.tabs.sendMessage(tabId, {
  action: 'playWorkflow',
  workflow: { /* ... */ }
});
```

## Configuration Files

### Extension
- `manifest.json`: Extension configuration (permissions, content scripts, etc.)
- `build.sh`: Build script for packaging

### Website
- `.env.local`: Environment variables (Supabase, Stripe keys)
- `next.config.js`: Next.js configuration
- `tailwind.config.ts`: Tailwind CSS with brand colors
- `vercel.json`: Deployment configuration

## Deployment

### Extension
1. Build: `cd extension && npm run build`
2. Package: `npm run package` → creates zkflow-pro.zip
3. Upload to Chrome Web Store

### Website
1. Push to Git repository
2. Deploy via Vercel (auto-deploys from main branch)
3. Configure environment variables in Vercel dashboard
4. Set up DNS (A record: @ → 76.76.21.21, CNAME: www → cname.vercel-dns.com)

## Testing Approach

### Extension Testing
- Manual testing in Chrome (load unpacked from `extension/dist`)
- Test form detection on various websites
- Verify workflow recording and playback
- Check cross-origin permissions

### Website Testing
- Component testing with React Testing Library
- API endpoint testing with Next.js built-in test utilities
- Stripe webhook testing with Stripe CLI
- License validation testing with test keys

## Security Considerations

- Extension uses minimal permissions (activeTab, storage, scripting)
- License keys are generated server-side using cryptographically secure methods
- Stripe webhooks are verified using webhook secrets
- Row Level Security (RLS) enabled on all Supabase tables
- API routes validate authentication before processing

## Common Development Tasks

### Adding New Form Detection Logic
Edit `extension/src/content/form-detector.js` to add new form patterns or field types.

### Creating New API Endpoints
Add route handlers in `website/app/api/` following Next.js 14 App Router conventions.

### Modifying Database Schema
1. Update `supabase-schema.sql`
2. Run migrations in Supabase dashboard
3. Update TypeScript types accordingly

### Updating Extension Permissions
Modify `extension/manifest.json` and test thoroughly as permission changes require user consent.