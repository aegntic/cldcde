# Phase 6: Deployment & Analytics

Deploy one-page site to Cloudflare with analytics, monitoring, and performance optimization.

## Requirements

- Cloudflare Pages deployment
- Workers for API routes
- Analytics integration (Plausible)
- Performance monitoring
- Error tracking
- SEO validation
- CDN optimization
- DODO webhooks configured

## Deployment Setup

### Cloudflare Pages Configuration
```toml
# wrangler.toml
name = "showcase-site"
compatibility_date = "2024-12-01"

[env.production]
API_URL = "https://api.yoursite.com"
NOTEBOOKLM_API_KEY = "..."
DODO_PUBLIC_KEY = "pk_..."
RUVECTOR_DB_PATH = ".ruvector/db"
```

### Build Configuration
```json
// package.json
{
  "scripts": {
    "build": "next build",
    "deploy": "wrangler pages deploy",
    "dev": "next dev",
    "start": "next start"
  }
}
```

### CNAME Setup
```
# DNS Configuration
Type: CNAME
Name: www
Content: your-site.pages.dev

Type: CNAME
Name: @
Content: your-site.pages.dev
```

## Workers Integration

### API Routes with Workers
```typescript
// wrangler/api/index.ts
import { Router } from 'itty-router';

const router = Router();

// Proxy to Dodo Payments
router.post('/api/checkout', async (request) => {
  const dodo = new DodoPayments(DODO_SECRET_KEY);
  const session = await dodo.checkout.sessions.create(await request.json());

  return Response.json({ url: session.url });
});

// RuVector search endpoint
router.post('/api/search', async (request) => {
  const { query } = await request.json();
  const vector = await generateEmbedding(query);
  const results = await ruvector.search(vector, { limit: 10 });

  return Response.json(results);
});

export default router.fetch;
```

### Worker Deployment
```bash
# Deploy Worker
wrangler deploy

# Deploy Pages
wrangler pages deploy
```

## Analytics Integration

### Plausible Analytics
```typescript
// components/PlausibleProvider.tsx
'use client';

import Script from 'next/script';

export function PlausibleProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Script
        src="https://plausible.io/js/script.js"
        data-domain="yoursite.com"
        strategy="afterInteractive"
      />
    </>
  );
}
```

### Custom Events
```typescript
// lib/analytics.ts
export function trackEvent(event: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).plausible) {
    (window as any).plausible(event, { props: properties });
  }
}

// Track purchases
trackEvent('purchase', { toolId: 'pro-tool', amount: 49 });

// Track signups
trackEvent('signup', { source: 'newsletter' });

// Track tool views
trackEvent('view_tool', { toolId: 'tool-1' });
```

## Performance Optimization

### Image Optimization
```typescript
// components/OptimizedImage.tsx
import Image from 'next/image';

export function WireframeImage({ src, alt, ...props }: ImageProps) {
  return (
    <div className="wireframe-image-container">
      <Image
        {...props}
        src={src}
        alt={alt}
        width={800}
        height={600}
        priority={false}
        loading="lazy"
        className="wireframe-element"
        style={{ filter: 'grayscale(100%)' }}
      />
    </div>
  );
}
```

### Lazy Loading Sections
```typescript
// Lazy load sections for better performance
import dynamic from 'next/dynamic';

const ToolShowcase = dynamic(() => import('@/components/ToolShowcase'), {
  loading: () => <div className="section-placeholder" />,
  ssr: false,
});

const PricingSection = dynamic(() => import('@/components/PricingSection'), {
  loading: () => <div className="section-placeholder" />,
  ssr: false,
});
```

### Cache Strategy
```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
};
```

## Monitoring

### Error Tracking
```typescript
// lib/error-tracking.ts
export function captureError(error: Error, context?: Record<string, any>) {
  console.error('Error captured:', error, context);

  // Send to error tracking service
  fetch('/api/errors', {
    method: 'POST',
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    }),
  });
}
```

### Performance Monitoring
```typescript
// app/api/analytics/route.ts
export async function GET() {
  const metrics = await Promise.all([
    getLCP(), // Largest Contentful Paint
    getFID(), // First Input Delay
    getCLS(), // Cumulative Layout Shift
    getTTFB(), // Time to First Byte
  ]);

  return Response.json({
    lcp: metrics[0],
    fid: metrics[1],
    cls: metrics[2],
    ttfb: metrics[3],
    target: {
      lcp: 2.5,
      fid: 100,
      cls: 0.1,
      ttfb: 600,
    },
  });
}
```

## SEO Validation

### Lighthouse CI
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://yoursite.com
          uploadArtifacts: true
```

### Meta Tags
```typescript
// app/layout.tsx
export const metadata = {
  title: 'Creative Tools Showcase',
  description: 'Curated collection of developer tools and automation platforms.',
  keywords: 'developer tools, automation, AI, SaaS, software',
  authors: [{ name: 'Your Name' }],
  openGraph: {
    title: 'Creative Tools Showcase',
    description: 'Curated collection of developer tools',
    type: 'website',
    url: 'https://yoursite.com',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Creative Tools Showcase',
    description: 'Curated collection of developer tools',
  },
};
```

## Success Criteria

- Site deployed to Cloudflare Pages
- Workers API routes working
- Dodo Payments webhooks configured
- Plausible analytics tracking
- Performance scores >90
- SEO validation passing
- Error tracking active
- Fast page loads (<2s LCP)
- Mobile responsive
- All sections functional
- No emojis anywhere
- Monochrome noir theme perfect
- 3D wireframe components working
- Content automation scheduled

Output <promise>PHASE6_COMPLETE</promise>
