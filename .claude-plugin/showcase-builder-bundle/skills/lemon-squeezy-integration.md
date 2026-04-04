---
name: Lemon Squeezy Integration
description: |
  Lemon Squeezy payment integration with merchant of record benefits. Handles global tax collection, license key generation, subscription management, and EU digital VAT compliance. Perfect for selling digital tools and products internationally without tax headaches.
---

## Overview

Lemon Squeezy acts as the merchant of record, handling all tax collection, payment processing, and compliance for you. Perfect for indie developers selling globally without worrying about VAT, sales tax, or regional regulations.

## Why Lemon Squeezy?

### Merchant of Record Benefits

✅ **Global Tax Compliance**
- Collects and remits VAT in EU
- Handles US sales tax
- Manages regional tax laws
- You never touch tax money

✅ **No Paperwork**
- No tax registrations needed
- No complex compliance
- No accounting headaches
- Just get paid

✅ **Developer Friendly**
- Simple API
- Webhooks for everything
- License key generation
- Subscription management
- Customer portal built-in

### Comparison

| Feature | Stripe | Lemon Squeezy |
|---------|--------|---------------|
| Tax Handling | You handle it | They handle it ✅ |
| License Keys | Custom build | Built-in ✅ |
| EU VAT | You remit | They remit ✅ |
| Setup Time | 2+ hours | 15 minutes ✅ |
| Best For | SaaS | Digital products ✅ |

## Quick Start

### 1. Create Account

```bash
# Sign up at lemonsqueezy.com
# Connect your bank account
# Create your first product
```

### 2. Get API Keys

```env
# .env.local
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_STORE_ID=...
LEMONSQUEEZY_WEBHOOK_SECRET=...
```

### 3. Install SDK

```bash
npm install lemonsqueezy.ts
```

## Product Setup

### Create Product in Dashboard

1. Go to Products → Create Product
2. Set name, description, price
3. Generate license keys (optional)
4. Copy Variant ID

### Or Create Programmatically

```typescript
// lemonsqueezy/products.ts
import { LemonsqueezyClient } from 'lemonsqueezy.ts';

const client = new LemonsqueezyClient(process.env.LEMONSQUEEZY_API_KEY);

const product = await client.createProduct({
  name: 'Pro Tool License',
  description: 'Lifetime license',
  storeId: process.env.LEMONSQUEEZY_STORE_ID,
});

const variant = await client.createVariant({
  productId: product.data.id,
  name: 'Single License',
  price: 4900, // $49.00 in cents
});
```

## Checkout Implementation

### 1. Generate Checkout URL

```typescript
// app/api/checkout/route.ts
import { LemonsqueezyClient } from 'lemonsqueezy.ts';

const client = new LemonsqueezyClient(process.env.LEMONSQUEEZY_API_KEY);

export async function POST(req: Request) {
  const { variantId, toolId } = await req.json();

  const checkout = await client.createCheckout({
    attributes: {
      checkout_data: {
        variant_id: variantId,
        custom: {
          tool_id: toolId,
          user_id: userId,
        },
      },
      checkout_options: {
        button_color: '#4ECDC4',
      },
      product_options: {
        redirect_url: `${process.env.NEXT_PUBLIC_URL}/success`,
        receipt_button_text: 'Go to Dashboard',
        receipt_link_url: `${process.env.NEXT_PUBLIC_URL}/licenses`,
      },
    },
  });

  return Response.json({ url: checkout.data.attributes.url });
}
```

### 2. Client-Side Redirect

```typescript
// components/BuyButton.tsx
'use client';

export function BuyButton({ variantId, toolId }) {
  const handlePurchase = async () => {
    const { url } = await fetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ variantId, toolId }),
    }).then(r => r.json());

    window.location.href = url;
  };

  return (
    <button onClick={handlePurchase}>
      Buy License - $49
    </button>
  );
}
```

## License Keys

### Automatic Generation

Lemon Squeezy automatically generates license keys when you enable it:

```typescript
// Webhook: order_created
interface LicenseKey {
  license_key: string;
  activation_limit: number;
  days_valid: number; // null = lifetime
}

async function handleOrderCreated(order: any) {
  const { license_key } = order.attributes.first_order_item;

  // Save to database
  await saveLicense({
    key: license_key,
    userId: order.attributes.custom.user_id,
    toolId: order.attributes.custom.tool_id,
    activationLimit: 5, // Can activate on 5 machines
  });
}
```

### License Validation API

```typescript
// app/api/licenses/validate/route.ts
import { LemonsqueezyClient } from 'lemonsqueezy.ts';

const client = new LemonsqueezyClient(process.env.LEMONSQUEEZY_API_KEY);

export async function POST(req: Request) {
  const { licenseKey, instanceId } = await req.json();

  const validation = await client.validateLicense({
    license_key: licenseKey,
    instance_id: instanceId, // Machine identifier
  });

  return Response.json({
    valid: validation.valid,
    activation: {
      usage: validation.meta.license_key.activation_usage,
      limit: validation.meta.license_key.activation_limit,
    },
  });
}
```

## Webhooks

### Setup

```typescript
// app/api/webhooks/lemonsqueezy/route.ts
import crypto from 'crypto';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('x-signature')!;

  // Verify webhook signature
  const hmac = crypto
    .createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== hmac) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  switch (event.meta.event_name) {
    case 'order_created':
      await handleOrderCreated(event);
      break;
    case 'subscription_created':
      await handleSubscriptionCreated(event);
      break;
    case 'subscription_updated':
      await handleSubscriptionUpdated(event);
      break;
    case 'subscription_cancelled':
      await handleSubscriptionCancelled(event);
      break;
    case 'license_key_created':
      await handleLicenseKeyCreated(event);
      break;
  }

  return Response.json({ received: true });
}

async function handleOrderCreated(event: any) {
  const { first_order_item } = event.data.attributes;
  const { user_id, tool_id } = event.data.attributes.custom;

  await createLicense({
    key: first_order_item.license_key,
    userId: user_id,
    toolId: tool_id,
  });

  // Send email
  await sendLicenseEmail({
    email: event.data.attributes.user_email,
    licenseKey: first_order_item.license_key,
  });
}
```

### Local Testing

```bash
# Use ngrok or similar for local testing
ngrok http 3000

# Update webhook URL in Lemon Squeezy dashboard
```

## Subscriptions

### Create Subscription Product

```typescript
// In Lemon Squeezy dashboard:
// 1. Create product with "Subscription" variant
// 2. Set billing interval (monthly/yearly)
// 3. Enable trial (optional)
```

### Checkout Flow

```typescript
// Same as one-time, just with subscription variant ID
const checkout = await client.createCheckout({
  attributes: {
    checkout_data: {
      variant_id: subscriptionVariantId,
    },
  },
});
```

### Pause/Cancel Management

```typescript
// Customer portal (built-in)
const { url } = await fetch('/api/portal', {
  method: 'POST',
  body: JSON.stringify({ subscriptionId }),
}).then(r => r.json());

// Redirect customer to manage their subscription
window.location.href = url;
```

## Database Schema

### PostgreSQL Schema

```sql
-- Licenses
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  tool_id TEXT NOT NULL,
  license_key TEXT UNIQUE NOT NULL,
  activation_limit INTEGER DEFAULT 5,
  activation_usage INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ, -- NULL for lifetime
  created_at TIMESTAMPTZ DEFAULT NOW(),
);

-- Subscriptions
CREATE TABLE lemon_squeezy_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  subscription_id INTEGER UNIQUE NOT NULL,
  product_id INTEGER NOT NULL,
  variant_id INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  renews_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  order_id INTEGER UNIQUE NOT NULL,
  total DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'paid',
  created_at TIMESTAMPTZ DEFAULT NOW(),
);
```

## Pricing Strategies

### Tiered Pricing

```typescript
const products = {
  starter: {
    variantId: '123456',
    price: 29,
    features: ['Basic features', '1 seat'],
  },
  pro: {
    variantId: '234567',
    price: 79,
    features: ['All features', '5 seats', 'Priority support'],
  },
  enterprise: {
    variantId: '345678',
    price: 199,
    features: ['Unlimited seats', 'Custom support', 'SLA'],
  },
};
```

### Quantity Discounts

```typescript
// In Lemon Squeezy dashboard:
// Set up quantity-based pricing
// 1-9: $49
// 10-49: $39 (20% off)
// 50+: $29 (40% off)
```

### Bundles

```typescript
// Create bundle product
const bundle = await client.createProduct({
  name: 'Complete Tool Bundle',
  description: 'All 5 tools at 40% discount',
  variants: [
    { name: 'Bundle License', price: 14900 }, // $149 (normally $245)
  ],
});
```

## Customer Experience

### Thank You Page

```typescript
// app/success/page.tsx
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { order_id: string };
}) {
  const order = await getOrder(searchParams.order_id);

  return (
    <div className="thank-you">
      <h1>🎉 Purchase Successful!</h1>

      {order.first_order_item.license_key && (
        <div className="license-key">
          <h3>Your License Key:</h3>
          <code>{order.first_order_item.license_key}</code>
          <button onClick={() => copyToClipboard(licenseKey)}>
            Copy
          </button>
        </div>
      )}

      <div className="order-details">
        <p>Order ID: {order.order_id}</p>
        <p>Total: ${order.total}</p>
      </div>

      <Link href="/dashboard">Go to Dashboard</Link>
    </div>
  );
}
```

### License Dashboard

```typescript
// app/dashboard/licenses/page.tsx
export default async function LicensesPage() {
  const licenses = await getUserLicenses();

  return (
    <div>
      <h1>My Licenses</h1>

      {licenses.map(license => (
        <LicenseCard
          key={license.id}
          license={license}
          tool={getToolDetails(license.tool_id)}
        />
      ))}
    </div>
  );
}

function LicenseCard({ license, tool }) {
  return (
    <div className="license-card">
      <h3>{tool.name}</h3>
      <p>License Key: <code>{license.license_key}</code></p>
      <div className="activations">
        {license.activation_usage} / {license.activation_limit} activations
      </div>
      <div className="actions">
        <button>Download</button>
        <button>View Docs</button>
      </div>
    </div>
  );
}
```

## Advanced Features

### Affiliates

```typescript
// Built-in affiliate system
// In dashboard: Settings → Affiliates

// Create affiliate link
const affiliateUrl = `https://yourstore.lemonsqueezy.com/affiliate/REFERRAL_CODE`;

// Track conversions via webhook
// Webhook event: referral_created
```

### EU VAT Reverse Charge

```typescript
// Lemon Squeezy handles automatically
// For B2B in EU, reverse charge applied
// Customer provides VAT ID on checkout
```

### Custom Fields

```typescript
const checkout = await client.createCheckout({
  attributes: {
    checkout_data: {
      variant_id: variantId,
      custom: {
        user_id: userId,
        tool_id: toolId,
        referral_code: 'CODE123', // Track referrals
        campaign: 'twitter_launch', // Track marketing
      },
    },
  },
});
```

## Analytics

### Dashboard Metrics

```typescript
// Built-in Lemon Squeezy dashboard shows:
// - Revenue over time
// - Orders by country
// - Conversion rates
// - Refunds
// - Subscription churn
```

### Custom Analytics

```typescript
// Track in your own database
async function trackConversion(event: any) {
  await analytics.track('order_completed', {
    orderId: event.data.id,
    revenue: event.data.attributes.total,
    currency: event.data.attributes.currency,
    country: event.data.attributes.user_country,
    tool: event.data.attributes.custom.tool_id,
  });
}
```

## Testing

### Test Mode

```env
# No separate test mode needed
# Use real checkout with test card:
# Card: 4242 4242 4242 4242
```

### Test Scenarios

1. **Successful Purchase**
   - Complete checkout flow
   - Verify license key created
   - Check webhook received

2. **Failed Payment**
   - Use declined card: 4000 0000 0000 0002
   - Verify error handling
   - Check retry logic

3. **Refund**
   - Issue refund in dashboard
   - Verify webhook received
   - Update license status

## Migration from Stripe

### Data Migration

```typescript
// Migrate customers
async function migrateCustomer(stripeCustomerId: string) {
  const customer = await stripe.customers.retrieve(stripeCustomerId);

  // Create checkout link
  const checkout = await client.createCheckout({
    attributes: {
      checkout_data: {
        variant_id: newVariantId,
        custom: {
          email: customer.email,
          name: customer.name,
        },
      },
      product_options: {
        redirect_url: `${process.env.NEXT_PUBLIC_URL}/migration-complete`,
      },
    },
  });

  // Send migration email
  await sendMigrationEmail({
    email: customer.email,
    checkoutUrl: checkout.data.attributes.url,
  });
}
```

## Best Practices

### Security

✅ Verify webhook signatures
✅ Never log full license keys
✅ Use environment variables for API keys
✅ Implement rate limiting
✅ Validate user owns license

### User Experience

✅ Send license email immediately
✅ Show license key on thank you page
✅ Provide copy-to-clipboard button
✅ Show activation limits clearly
✅ Offer self-service management

### Business

✅ Set up affiliate program
✅ Create bundles for higher AOV
✅ Offer volume discounts
✅ Enable trials for subscriptions
✅ Monitor analytics regularly

## Resources

### Official Documentation
- [Lemon Squeezy API Docs](https://docs.lemonsqueezy.com/api)
- [Webhook Reference](https://docs.lemonsqueezy.com/help/webhooks)
- [License Keys Guide](https://docs.lemonsqueezy.com/help/license-keys)

### Tools
- [lemonsqueezy.ts](https://github.com/ijlemonsqueezy/lemonsqueezy.ts) - TypeScript SDK
- [Lemon.js](https://github.com/ljshj12/lemon.js) - Vanilla JS SDK

---

**Perfect For:** Digital products, tools, templates, indie developers

**Part of the Showcase Builder Bundle**
