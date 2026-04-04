---
name: Dodo Payments Integration
description: |
  Complete Dodo Payments integration with checkout sessions API for international payments. Supports PPP (Purchasing Power Parity) pricing, subscriptions, and multi-currency checkout. Modern API with flexible checkout flow introduced August 2025.
---

## Overview

Dodo Payments provides modern payment infrastructure with international reach and PPP-based pricing. The Checkout Sessions API (August 2025) offers flexible, customizable checkout flows.

## Core Features

- Checkout Sessions API (modern approach)
- International payment support
- PPP-based pricing tiers
- Subscription management
- Multi-currency checkout
- Webhook handling
- Test mode

## Quick Start

### Installation

```bash
npm install @dodopayments/express
# or
npm install dodopayments
```

### Environment Setup

```env
# .env.local
DODO_PUBLIC_KEY=pk_dodo_...
DODO_SECRET_KEY=sk_dodo_...
DODO_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_URL=https://yourdomain.com
```

### Basic Configuration

```typescript
// lib/dodo.ts
import DodoPayments from 'dodopayments';

export const dodo = new DodoPayments(process.env.DODO_SECRET_KEY!, {
  apiVersion: '2025-08',
  baseURL: 'https://api.dodopayments.com',
});
```

## Checkout Implementation

### Create Checkout Session

```typescript
// app/api/checkout/route.ts
import { dodo } from '@/lib/dodo';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const {
    priceId,
    toolId,
    quantity = 1,
    customerEmail
  } = await req.json();

  try {
    const session = await dodo.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Tool License',
              metadata: { toolId },
            },
            unit_amount: 4900, // $49.00
          },
          quantity,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/tools/${toolId}`,
      customer_email: customerEmail,
      metadata: {
        toolId,
        userId: getUserId(req),
      },
      // PPP pricing support
      payment_intent_data: {
        metadata: {
          ppp_enabled: 'true',
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Dodo checkout error:', error);
    return NextResponse.json(
      { error: 'Payment initialization failed' },
      { status: 500 }
    );
  }
}
```

### Client-Side Checkout

```typescript
// components/PurchaseButton.tsx
'use client';

import { useState } from 'react';

export function PurchaseButton({
  priceId,
  toolId
}: {
  priceId: string;
  toolId: string;
}) {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, toolId }),
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      className="button-noir"
    >
      {loading ? 'PROCESSING' : 'ACQUIRE LICENSE'}
    </button>
  );
}
```

## PPP Pricing

### Purchasing Power Parity Implementation

```typescript
// lib/pricing.ts
interface PPPRegion {
  country: string;
  multiplier: number;
  currency: string;
}

const PPP_REGIONS: PPPRegion[] = [
  { country: 'US', multiplier: 1.0, currency: 'USD' },
  { country: 'IN', multiplier: 0.25, currency: 'INR' },
  { country: 'BR', multiplier: 0.4, currency: 'BRL' },
  { country: 'NG', multiplier: 0.3, currency: 'NGN' },
  { country: 'CN', multiplier: 0.5, currency: 'CNY' },
];

export function getPPPPrice(
  basePriceUSD: number,
  countryCode: string
): { price: number; currency: string } {
  const region = PPP_REGIONS.find(
    r => r.country === countryCode
  ) || PPP_REGIONS[0];

  return {
    price: Math.round(basePriceUSD * region.multiplier),
    currency: region.currency,
  };
}

// Detect user country
export async function detectCountry(): Promise<string> {
  const response = await fetch('https://ipapi.co/country');
  return await response.text();
}
```

### PPP Checkout

```typescript
// app/api/checkout-ppp/route.ts
import { getPPPPrice, detectCountry } from '@/lib/pricing';

export async function POST(req: Request) {
  const { basePrice, toolId } = await req.json();
  const countryCode = await detectCountry();
  const { price, currency } = getPPPPrice(basePrice, countryCode);

  const session = await dodo.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: currency.toLowerCase(),
        unit_amount: price,
        product_data: {
          name: 'Tool License',
          description: `PPP-adjusted price for ${countryCode}`,
        },
      },
      quantity: 1,
    }],
    // ... rest of config
  });

  return NextResponse.json({ url: session.url });
}
```

## Subscription Implementation

### Create Subscription Product

```typescript
// app/api/subscribe/route.ts
export async function POST(req: Request) {
  const { variantId, userId } = await req.json();

  const session = await dodo.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{
      price: variantId,
      quantity: 1,
    }],
    subscription_data: {
      metadata: { userId },
      trial_period_days: 14,
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}
```

### Customer Portal

```typescript
// app/api/portal/route.ts
export async function POST(req: Request) {
  const { customerId } = await req.json();

  const portal = await dodo.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
  });

  return NextResponse.json({ url: portal.url });
}
```

## Webhooks

### Webhook Handler

```typescript
// app/api/webhooks/dodo/route.ts
import { headers } from 'next/headers';
import crypto from 'crypto';
import { dodo } from '@/lib/dodo';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('dodo-signature')!;

  // Verify webhook signature
  const hmac = crypto
    .createHmac('sha256', process.env.DODO_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== hmac) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  const event = JSON.parse(body);

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data);
      break;
    case 'subscription.created':
      await handleSubscriptionCreated(event.data);
      break;
    case 'subscription.updated':
      await handleSubscriptionUpdated(event.data);
      break;
    case 'subscription.cancelled':
      await handleSubscriptionCancelled(event.data);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data);
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: any) {
  const { toolId, userId } = session.metadata;

  if (session.mode === 'payment') {
    // One-time purchase
    await createLicense({
      toolId,
      userId,
      sessionId: session.id,
      amount: session.amount_total / 100,
    });

    // Send confirmation email
    await sendLicenseEmail({
      email: session.customer_email,
      licenseKey: generateLicenseKey(),
    });
  }
}
```

### Local Webhook Testing

```bash
# Use Dodo CLI for local testing
npm install -g @dodopayments/cli

dodo login
dodo listen --forward-to localhost:3000/api/webhooks/dodo

# Trigger test events
dodo trigger checkout.session.completed
```

## Pricing Tiers

### Create Products

```typescript
// scripts/create-products.ts
async function createProducts() {
  // Free tier
  const freeProduct = await dodo.products.create({
    name: 'Starter Access',
    description: 'Free tier with basic features',
  });

  // Pro tier (one-time)
  const proProduct = await dodo.products.create({
    name: 'Pro License',
    description: 'Lifetime access to all features',
  });

  const proPrice = await dodo.prices.create({
    product: proProduct.id,
    unit_amount: 4900,
    currency: 'usd',
  });

  // Enterprise tier (subscription)
  const enterpriseProduct = await dodo.products.create({
    name: 'Enterprise Subscription',
    description: 'Full access + priority support',
  });

  const enterprisePrice = await dodo.prices.create({
    product: enterpriseProduct.id,
    unit_amount: 9900,
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
  });
}
```

### Display Pricing

```typescript
// components/PricingTier.tsx
export function PricingTier({
  tier,
  country = 'US'
}: {
  tier: PricingTier;
  country?: string;
}) {
  const { price, currency } = getPPPPrice(tier.basePrice, country);

  return (
    <div className="pricing-tier wireframe-element">
      <h3 className="heading-card">{tier.name}</h3>

      <div className="pricing-display">
        <span className="price-amount">
          {price / 100}
        </span>
        <span className="price-currency">
          {currency.toUpperCase()}
        </span>
        {tier.interval && (
          <span className="price-interval">
            /{tier.interval}
          </span>
        )}
      </div>

      <ul className="feature-list">
        {tier.features.map(feature => (
          <li key={feature} className="body-small">
            {feature}
          </li>
        ))}
      </ul>

      <PurchaseButton
        priceId={tier.priceId}
        toolId={tier.toolId}
      />
    </div>
  );
}
```

## Database Integration

### Schema

```sql
-- Orders table
CREATE TABLE dodo_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT UNIQUE NOT NULL,
  tool_id TEXT NOT NULL,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  ppp_multiplier DECIMAL(3,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
);

-- Licenses table
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  tool_id TEXT NOT NULL,
  license_key TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES dodo_orders(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
);

-- Subscriptions table
CREATE TABLE dodo_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  subscription_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
);
```

## Security Best Practices

### Webhook Verification

```typescript
// Always verify webhook signatures
function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const hmac = crypto
    .createHmac('sha256', process.env.DODO_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hmac)
  );
}
```

### API Key Protection

```typescript
// Server-side only
const dodo = new DodoPayments(process.env.DODO_SECRET_KEY);

// Client-safe
process.env.NEXT_PUBLIC_DODO_KEY
```

## Error Handling

### Graceful Failure

```typescript
export async function createCheckoutSession(data: CheckoutData) {
  try {
    const session = await dodo.checkout.sessions.create(data);
    return { success: true, url: session.url };
  } catch (error) {
    if (error instanceof DodoPaymentsError) {
      console.error('Dodo error:', error.message);

      return {
        success: false,
        error: userFriendlyMessage(error),
      };
    }

    throw error;
  }
}

function userFriendlyMessage(error: DodoPaymentsError): string {
  switch (error.code) {
    case 'payment_intent_authentication_failure':
      return 'Payment failed. Please try a different payment method.';
    case 'rate_limit':
      return 'Service temporarily unavailable. Please try again.';
    default:
      return 'Unable to process payment. Please contact support.';
  }
}
```

## Testing

### Test Mode

```env
DODO_SECRET_KEY=sk_test_dodo_...
DODO_PUBLIC_KEY=pk_test_dodo_...
```

### Test Cards

```
Successful: 4242 4242 4242 4242
Declined: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
Expired: 4000 0000 0000 0069
```

### Test Scenarios

```bash
# Successful payment
dodo trigger checkout.session.completed

# Failed payment
dodo trigger payment_intent.payment_failed

# Subscription created
dodo trigger subscription.created
```

## Advanced Features

### Multi-Currency

```typescript
const session = await dodo.checkout.sessions.create({
  line_items: [{
    price_data: {
      currency: 'eur', // or gbp, jpy, inr, etc.
      unit_amount: 4500,
      product_data: { name: 'Tool License' },
    },
  }],
});
```

### Trial Periods

```typescript
const session = await dodo.checkout.sessions.create({
  mode: 'subscription',
  subscription_data: {
    trial_period_days: 14,
    trial_settings: {
      end_behavior: {
        missing_payment_method: 'cancel',
      },
    },
  },
});
```

### Custom Metadata

```typescript
const session = await dodo.checkout.sessions.create({
  metadata: {
    userId,
    toolId,
    referralCode,
    utm_source,
    utm_campaign,
  },
});
```

## Monitoring

### Dashboard Metrics

```typescript
// Track conversions
async function trackConversion(event: DodoEvent) {
  await analytics.track('dodo_payment_completed', {
    sessionId: event.data.session.id,
    amount: event.data.session.amount_total,
    currency: event.data.session.currency,
    toolId: event.data.session.metadata.toolId,
    pppMultiplier: event.data.session.metadata.ppp_multiplier,
  });
}
```

## Resources

### Official Documentation
- [Dodo Payments GitHub](https://github.com/dodopayments/dodo-docs)
- [Checkout Sessions API](https://docs.dodopayments.com/api/checkout-sessions)
- [Webhooks Guide](https://docs.dodopayments.com/guides/webhooks)
- [Changelog](https://docs.dodopayments.com/changelog)

### Integration Guides
- [Next.js Integration Tutorial](https://www.jigz.dev/blogs/how-to-integrate-dodo-payments-with-nextjs-for-international-payments)
- [Subscriptions in Next.js](https://sajalbatra.hashnode.dev/dodo-payments-subscription-integration-in-nextjs-typescript-simple-example)
- [PPP Pricing Guide](https://www.paritydeals.com/integrations/dodo-payments/)

### SDKs
- [Python SDK](https://pypi.org/project/dodopayments/)
- [Express Adapter](https://www.npmjs.com/package/@dodopayments/express)

---

**Part of the Showcase Builder Bundle**
