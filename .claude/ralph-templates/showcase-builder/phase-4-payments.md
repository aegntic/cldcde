# Phase 4: Dodo Payments & PPP Pricing

Integrate Dodo Payments with PPP-based pricing tiers and email capture for newsletter.

## Requirements

- Dodo Payments checkout integration
- PPP (Purchasing Power Parity) pricing
- Three pricing tiers
- Email capture for newsletter
- Skool community link
- Wireframe form styling

## Pricing Structure

### Free Tier
- Price: Free
- Features: Open source tools, community access
- CTA: "GET STARTED"

### Pro Tier (One-Time)
- Price: Base $49, PPP-adjusted by country
- Features: Premium tools, priority support
- CTA: "ACQUIRE LICENSE"
- Payment: Dodo Payments

### Enterprise Tier (Subscription)
- Price: Base $99/mo, PPP-adjusted
- Features: All tools, dedicated support
- CTA: "SUBSCRIBE"
- Payment: Dodo Payments recurring

## Implementation

### PPP Pricing Detection
```typescript
// lib/pricing.ts
export async function detectPPP(): Promise<PPPConfig> {
  const response = await fetch('https://ipapi.co/json');
  const data = await response.json();

  const multipliers: Record<string, number> = {
    'US': 1.0,
    'IN': 0.25,
    'BR': 0.4,
    'NG': 0.3,
    'CN': 0.5,
  };

  return {
    country: data.country_code,
    currency: data.currency,
    multiplier: multipliers[data.country_code] || 1.0,
  };
}

export function getPPPPrice(baseUSD: number, ppp: PPPConfig) {
  return {
    price: Math.round(baseUSD * ppp.multiplier),
    currency: ppp.currency,
    display: formatPrice(baseUSD * ppp.multiplier, ppp.currency),
  };
}
```

### Pricing Section
```tsx
'use client';

import { useState, useEffect } from 'react';

export function PricingSection() {
  const [ppp, setPPP] = useState<PPPConfig | null>(null);

  useEffect(() => {
    detectPPP().then(setPPP);
  }, []);

  return (
    <section id="pricing" className="section-full">
      <h2 className="heading-section">ACQUIRE ACCESS</h2>

      <div className="pricing-grid">
        {/* Free Tier */}
        <PricingTier
          name="STARTER"
          price={0}
          currency="USD"
          features={[
            'Open source tools',
            'Community access',
            'Basic documentation',
          ]}
          cta="GET STARTED"
          variant="free"
        />

        {/* Pro Tier */}
        {ppp && (
          <PricingTier
            name="PROFESSIONAL"
            basePrice={49}
            ppp={ppp}
            features={[
              'All premium tools',
              'Priority support',
              'Advanced tutorials',
              'License keys included',
            ]}
            cta="ACQUIRE LICENSE"
            variant="pro"
          />
        )}

        {/* Enterprise Tier */}
        {ppp && (
          <PricingTier
            name="ENTERPRISE"
            basePrice={99}
            ppp={ppp}
            interval="month"
            features={[
              'Complete tool access',
              'Dedicated support',
              'Custom integrations',
              'SLA guarantee',
            ]}
            cta="SUBSCRIBE"
            variant="enterprise"
          />
        )}
      </div>
    </section>
  );
}
```

### Pricing Card Component
```tsx
function PricingTier({
  name,
  basePrice,
  ppp,
  interval,
  features,
  cta,
  variant
}: PricingTierProps) {
  const price = ppp ? getPPPPrice(basePrice, ppp) : { price: 0, currency: 'USD', display: 'Free' };

  return (
    <div className={`pricing-tier pricing-${variant} wireframe-element`}>
      <div className="tier-header">
        <h3 className="heading-card">{name}</h3>
        {ppp && (
          <span className="label-wireframe">{ppp.country} DETECTED</span>
        )}
      </div>

      <div className="pricing-display">
        <span className="price-amount">{price.display}</span>
        {interval && <span className="price-interval">/{interval}</span>}
      </div>

      <ul className="feature-list">
        {features.map(feature => (
          <li key={feature} className="body-small">
            <span className="feature-check"></span>
            {feature}
          </li>
        ))}
      </ul>

      <PurchaseButton
        tier={variant}
        price={price}
        cta={cta}
      />
    </div>
  );
}
```

### Dodo Checkout
```typescript
// app/api/checkout/route.ts
import { dodo } from '@/lib/dodo';

export async function POST(req: Request) {
  const { tier, priceId, email } = await req.json();

  const session = await dodo.checkout.sessions.create({
    mode: tier === 'enterprise' ? 'subscription' : 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${tier.toUpperCase()} License`,
        },
        unit_amount: priceId,
      },
      }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    customer_email: email,
    metadata: {
      tier,
      newsletter_consent: true,
    },
  });

  return Response.json({ url: session.url });
}
```

## Newsletter Section

```tsx
function NewsletterSection() {
  return (
    <section id="newsletter" className="section-full">
      <h2 className="heading-section">STAY INFORMED</h2>
      <p className="body-large">
        Weekly insights on developer tools, AI automation, and creative workflows.
        No spam, ever.
      </p>

      <EmailCaptureForm />
    </section>
  );
}

function EmailCaptureForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email');

    // Save to database
    await saveEmail(email);

    // Subscribe to newsletter service
    await subscribeToNewsletter(email);

    setStatus('success');
  };

  return (
    <form onSubmit={handleSubmit} className="email-form wireframe-element">
      <div className="form-group">
        <label className="label-wireframe">EMAIL_ADDRESS</label>
        <input
          type="email"
          name="email"
          placeholder="your@email.com"
          className="input-noir"
          required
        />
        <button type="submit" className="button-noir" disabled={status !== 'idle'}>
          {status === 'idle' && 'SUBSCRIBE'}
          {status === 'submitting' && 'PROCESSING'}
          {status === 'success' && 'SUBSCRIBED'}
        </button>
      </div>

      {status === 'success' && (
        <p className="body-small" style={{ color: 'var(--gold-base)' }}>
          Check your inbox to confirm subscription.
        </p>
      )}
    </form>
  );
}
```

## Community Section

```tsx
function CommunitySection() {
  return (
    <section id="community" className="section-full">
      <h2 className="heading-section">JOIN THE COLLECTIVE</h2>
      <p className="body-large">
        Connect with other developers, share workflows, and get exclusive content.
      </p>

      <a
        href="https://your-community.skool.com"
        target="_blank"
        rel="noopener"
        className="skool-cta wireframe-element"
      >
        <div className="cta-visual">
          <svg className="diagram-container" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="var(--noir-platinum)"
              fill="none"
            />
            <circle className="diagram-inner" cx="50" cy="50" r="20" />
            <text className="tech-label">NEURAL_NET_V9</text>
          </svg>
        </div>

        <div className="cta-content">
          <span className="heading-card">Join Community</span>
          <span className="body-small">Exclusive access</span>
        </div>
      </a>
    </section>
  );
}
```

## Success Criteria

- Dodo Payments checkout working
- PPP pricing by country detected
- Three pricing tiers displayed
- Email capture functional
- Skool link prominently displayed
- All wireframe components styled
- No emojis, monochrome noir maintained

Output <promise>PHASE4_COMPLETE</promise>
