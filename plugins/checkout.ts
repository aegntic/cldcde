/**
 * cldcde.cc Plugin Marketplace Checkout
 * Stripe-powered plugin pack purchases
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

interface PluginPack {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  plugins: string[];
  features: string[];
}

const PACKS: Record<string, PluginPack> = {
  starter: {
    id: 'starter',
    name: 'Claude Code Starter Pack',
    price: 2900, // $29 in cents
    interval: 'month',
    plugins: ['debt-sentinel', 'spec-lock'],
    features: [
      'Real-time anti-pattern detection',
      'Documentation sync monitoring',
      'Session debt reports',
      'Community support'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Claude Code Pro Pack',
    price: 9900, // $99 in cents
    interval: 'month',
    plugins: [
      'debt-sentinel',
      'spec-lock',
      'red-team-tribunal',
      'compound-engineering',
      'visual-regression'
    ],
    features: [
      'Everything in Starter',
      'Multi-agent adversarial code review',
      'Automated CI/CD integration',
      'Visual regression testing',
      'Priority support'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Claude Code Enterprise Pack',
    price: 29900, // $299 in cents
    interval: 'month',
    plugins: [
      'debt-sentinel',
      'spec-lock',
      'red-team-tribunal',
      'compound-engineering',
      'visual-regression',
      'viral-automation-suite',
      'youtube-creator-pro',
      'cloud-agents'
    ],
    features: [
      'Everything in Pro',
      'Viral content automation',
      'YouTube creator tools',
      'Cloud agent deployment',
      'Dedicated success manager',
      'SLA guarantee'
    ]
  }
};

export async function createCheckoutSession(
  packId: string,
  customerId?: string,
  successUrl?: string,
  cancelUrl?: string
): Promise<{ url: string; sessionId: string }> {
  const pack = PACKS[packId];

  if (!pack) {
    throw new Error(`Invalid pack: ${packId}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customerId,
    line_items: [{
    price_data: {
      currency: 'usd',
      product_data: {
        name: pack.name,
        description: pack.features.slice(0, 3).join(' • '),
        metadata: {
          pack_id: packId,
          plugins: pack.plugins.join(',')
        }
      },
      recurring: {
        interval: pack.interval,
        interval_count: 1
      },
      unit_amount: pack.price
    },
    quantity: 1
  }],
    success_url: successUrl || `${process.env.BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${process.env.BASE_URL}/checkout/cancel`,
    metadata: {
    pack_id: packId,
    plugins: pack.plugins.join(',')
    },
    subscription_data: {
    metadata: {
    pack_id: packId
    }
  }
  });

  return {
    url: session.url || '',
    sessionId: session.id
  };
}

export async function handleWebhook(payload: string, signature: string): Promise<void> {
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET || ''
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      const packId = session.metadata?.pack_id;
      const customerId = session.customer as string;

      console.log(`[STRIPE] Checkout completed: pack=${packId}, customer=${customerId}`);

      // Grant access to plugins
      // In production, this would update Supabase/database
      break;
    }

    case 'customer.subscription.created': {
      const subscription = event.data.object as any;
      console.log(`[STRIPE] Subscription created: ${subscription.id}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any;
      console.log(`[STRIPE] Subscription cancelled: ${subscription.id}`);
      // Revoke plugin access
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as any;
      console.log(`[STRIPE] Invoice paid: ${invoice.id}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as any;
      console.log(`[STRIPE] Payment failed: ${invoice.id}`);
      break;
    }
  }
}

export { PACKS };
