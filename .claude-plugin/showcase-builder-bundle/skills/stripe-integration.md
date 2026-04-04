---
name: Stripe Integration
description: |
  Complete Stripe payment gateway integration for Next.js applications. Handles one-time payments, subscriptions, invoicing, and webhooks with proper security and error handling. Includes checkout sessions, customer portal, and test mode support.
---

## Overview

Stripe Integration skill provides everything needed to accept payments in your showcase site. From simple one-time purchases to complex subscription models, this skill handles it all with production-ready code.

## Core Features

- ✅ Checkout Sessions - Hosted payment pages
- ✅ Subscriptions - Recurring billing management
- ✅ Webhooks - Real-time event handling
- ✅ Customer Portal - Self-service management
- ✅ Test Mode - Development without real money
- ✅ Security - Webhook signature verification
- ✅ Error Handling - Graceful failure recovery
- ✅ Type Safety - Full TypeScript support

## Quick Start

### Installation

```bash
npm install stripe @stripe/stripe-js
```

### Environment Setup

```env
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Basic Usage

```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});
```

## Payment Flows

### One-Time Payment

**1. Create Checkout Session**

```typescript
// app/api/checkout/route.ts
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { priceId, toolId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/tools/${toolId}`,
    metadata: {
      toolId,
    },
  });

  return NextResponse.json({ url: session.url });
}
```

**2. Client-Side Checkout**

```typescript
// components/PurchaseButton.tsx
'use client';

import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export function PurchaseButton({ priceId, toolId }) {
  const handleClick = async () => {
    const stripe = await stripePromise;

    const { data } = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, toolId }),
    }).then(r => r.json());

    window.location.href = data.url;
  };

  return <button onClick={handleClick}>Buy Now</button>;
}
```

**3. Success Page**

```typescript
// app/success/page.tsx
import { stripe } from '@/lib/stripe';

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id: string };
}) {
  const session = await stripe.checkout.sessions.retrieve(
    searchParams.session_id
  );

  return (
    <div>
      <h1>Payment Successful!</h1>
      <p>Thank you for your purchase.</p>
      {/* Display order details */}
    </div>
  );
}
```

### Subscription Payments

**1. Create Subscription**

```typescript
// app/api/subscribe/route.ts
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const { priceId, userId } = await req.json();

  // Create or get customer
  const customer = await stripe.customers.create({
    metadata: { userId },
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    customer: customer.id,
    subscription_data: {
      metadata: { userId },
    },
  });

  return Response.json({ url: session.url });
}
```

**2. Customer Portal**

```typescript
// app/api/portal/route.ts
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const { customerId } = await req.json();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
  });

  return Response.json({ url: session.url });
}
```

## Webhooks

### Setup

```typescript
// app/api/webhooks/stripe/route.ts
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;
    default:
      console.log(`Unhandled event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, toolId } = session.metadata!;

  if (session.mode === 'payment') {
    // One-time purchase
    await createLicense({
      userId,
      toolId,
      sessionId: session.id,
      amount: session.amount_total! / 100,
    });
  } else if (session.mode === 'subscription') {
    // Subscription created
    await activateSubscription({
      userId,
      subscriptionId: session.subscription as string,
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await cancelSubscription(subscription.id);
}
```

### Local Webhook Testing

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
```

## Pricing & Products

### Create Products in Dashboard

1. Go to Stripe Dashboard → Products
2. Create product for each tool/license
3. Add pricing (one-time or recurring)
4. Copy Price IDs

### Or Create Programmatically

```typescript
// scripts/create-products.ts
const product = await stripe.products.create({
  name: 'Pro Tool License',
  description: 'Lifetime license for Pro Tool',
  metadata: {
    toolId: 'pro-tool',
  },
});

const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 4900, // $49.00
  currency: 'usd',
});
```

## Database Integration

### Schema (Supabase/PostgreSQL)

```sql
-- Licenses table
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  tool_id TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10,2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
);
```

### Supabase Integration

```typescript
// lib/db.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createLicense(data: {
  userId: string;
  toolId: string;
  sessionId: string;
  amount: number;
}) {
  const { error } = await supabase.from('licenses').insert({
    user_id: data.userId,
    tool_id: data.toolId,
    stripe_session_id: data.sessionId,
    amount: data.amount,
  });

  if (error) throw error;
}
```

## Security Best Practices

### 1. Webhook Signature Verification

✅ Always verify webhook signatures
✅ Use environment variables for secrets
✅ Implement rate limiting
✅ Log all webhook events

### 2. API Key Safety

```typescript
// Server-side only
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Client-safe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Customer Authentication

```typescript
// Verify user owns payment before showing details
export async function getLicense(userId: string, licenseId: string) {
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('id', licenseId)
    .eq('user_id', userId) // User must own this license
    .single();

  if (error || !data) {
    throw new Error('License not found');
  }

  return data;
}
```

## Testing

### Test Mode

```env
STRIPE_SECRET_KEY=sk_test_...
```

### Test Cards

```
Card Number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
Postal: Any 5 digits
```

### Test Scenarios

```bash
# Successful payment
stripe trigger checkout.session.completed

# Failed payment
stripe trigger payment_intent.payment_failed

# Subscription cancelled
stripe trigger customer.subscription.deleted
```

## Error Handling

### Graceful Degradation

```typescript
export async function createCheckoutSession(priceId: string) {
  try {
    const session = await stripe.checkout.sessions.create({
      // ... config
    });
    return { success: true, url: session.url };
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe error:', error.message);
      return {
        success: false,
        error: 'Payment service unavailable. Please try again.',
      };
    }
    throw error;
  }
}
```

## Advanced Features

### Trials and Coupons

```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  subscription_data: {
    trial_period_days: 14,
  },
  discounts: [
    {
      coupon: 'LAUNCH20', // 20% off
    },
  ],
});
```

### Metered Billing

```typescript
const price = await stripe.prices.create({
  product: productId,
  unit_amount: 100, // $1 per unit
  currency: 'usd',
  recurring: {
    interval: 'month',
    usage_type: 'metered',
  },
});
```

### Multi-Quantity

```typescript
const session = await stripe.checkout.sessions.create({
  line_items: [{
    price: priceId,
    quantity: 5, // Buy 5 licenses
  }],
});
```

## Monitoring

### Dashboard

- Real-time metrics
- Payment success rate
- Revenue tracking
- Customer insights

### Alerts

```typescript
// Setup webhook monitoring
async function handlePaymentFailure(event: Stripe.Event) {
  // Notify admin
  await notifyAdmin({
    type: 'payment_failed',
    amount: event.data.object.amount,
    customer: event.data.object.customer,
  });

  // Create support ticket
  await createSupportTicket({
    subject: 'Payment failed',
    customerId: event.data.object.customer,
  });
}
```

## Resources

### Official Documentation
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Next.js Integration Guide](https://stripe.com/docs/payments/quickstart)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing Guide](https://stripe.com/docs/testing)

### Tools
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Stripe React SDK](https://stripe.com/docs/stripe-js/react)

---

**Part of the Showcase Builder Bundle**
