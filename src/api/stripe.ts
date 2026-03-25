/**
 * Stripe Checkout API Routes
 * Handles plugin pack purchases for cldcde.cc
 */

import { Hono } from 'hono'

const stripeRoutes = new Hono<{ Bindings: Env }>()

// Plugin pack definitions
const PACKS = {
  starter: {
    name: 'Claude Code Starter Pack',
    price: 2900, // $29
    plugins: ['debt-sentinel', 'spec-lock'],
    features: ['Anti-pattern detection', 'Doc sync', 'Debt reports']
  },
  pro: {
    name: 'Claude Code Pro Pack',
    price: 9900, // $99
    plugins: ['debt-sentinel', 'spec-lock', 'red-team-tribunal', 'compound-engineering', 'visual-regression'],
    features: ['Everything in Starter', 'Multi-agent review', 'CI/CD integration', 'Visual regression']
  },
  enterprise: {
    name: 'Claude Code Enterprise Pack',
    price: 29900, // $299
    plugins: ['debt-sentinel', 'spec-lock', 'red-team-tribunal', 'compound-engineering', 'visual-regression', 'viral-automation-suite', 'youtube-creator-pro', 'cloud-agents'],
    features: ['Everything in Pro', 'Viral automation', 'YouTube tools', 'Cloud deployment']
  }
}

// GET /api/stripe/packs - List available packs
stripeRoutes.get('/packs', (c) => {
  return c.json({
    packs: Object.entries(PACKS).map(([id, pack]) => ({
      id,
      name: pack.name,
      price: pack.price / 100,
      price_display: `$${pack.price / 100}/mo`,
      plugins: pack.plugins,
      features: pack.features
    }))
  })
})

// POST /api/stripe/checkout - Create checkout session
stripeRoutes.post('/checkout', async (c) => {
  const body = await c.req.json()
  const { packId, email, successUrl, cancelUrl } = body

  const pack = PACKS[packId as keyof typeof PACKS]
  if (!pack) {
    return c.json({ error: 'Invalid pack' }, 400)
  }

  // Create Stripe checkout session
  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      'mode': 'subscription',
      'payment_method_types[]': 'card',
      'customer_email': email || '',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][product_data][name]': pack.name,
      'line_items[0][price_data][product_data][description]': pack.features.join(' • '),
      'line_items[0][price_data][product_data][metadata][pack_id]': packId,
      'line_items[0][price_data][product_data][metadata][plugins]': pack.plugins.join(','),
      'line_items[0][price_data][recurring][interval]': 'month',
      'line_items[0][price_data][unit_amount]': String(pack.price),
      'line_items[0][quantity]': '1',
      'success_url': successUrl || `${c.req.header('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': cancelUrl || `${c.req.header('origin')}/checkout/cancel`,
      'metadata[pack_id]': packId,
      'metadata[plugins]': pack.plugins.join(',')
    })
  })

  if (!stripeResponse.ok) {
    const error = await stripeResponse.text()
    console.error('Stripe error:', error)
    return c.json({ error: 'Failed to create checkout session' }, 500)
  }

  const session = await stripeResponse.json() as any

  return c.json({
    url: session.url,
    sessionId: session.id
  })
})

// POST /api/stripe/webhook - Handle Stripe webhooks
stripeRoutes.post('/webhook', async (c) => {
  const payload = await c.req.text()
  const sig = c.req.header('stripe-signature')

  if (!sig) {
    return c.json({ error: 'Missing signature' }, 400)
  }

  // Verify webhook signature
  const stripeResponse = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
    headers: {
      'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}`
    }
  })

  // For now, log the webhook event
  // In production, verify signature properly
  const event = JSON.parse(payload)

  console.log(`[STRIPE WEBHOOK] ${event.type}`, event.data?.object?.id)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any
      const packId = session.metadata?.pack_id
      const customerId = session.customer
      const customerEmail = session.customer_email

      console.log(`✅ Checkout completed: pack=${packId}, customer=${customerEmail}`)

      // TODO: Grant plugin access in Supabase
      // await grantPluginAccess(customerEmail, packId)
      break
    }

    case 'customer.subscription.created': {
      console.log(`📝 Subscription created: ${event.data.object.id}`)
      break
    }

    case 'customer.subscription.deleted': {
      console.log(`❌ Subscription cancelled: ${event.data.object.id}`)
      // TODO: Revoke plugin access
      break
    }

    case 'invoice.paid': {
      console.log(`💰 Invoice paid: ${event.data.object.id}`)
      break
    }
  }

  return c.json({ received: true })
})

// GET /api/stripe/session/:id - Get checkout session status
stripeRoutes.get('/session/:id', async (c) => {
  const sessionId = c.req.param('id')

  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: {
      'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}`
    }
  })

  if (!response.ok) {
    return c.json({ error: 'Session not found' }, 404)
  }

  const session = await response.json() as any

  return c.json({
    id: session.id,
    status: session.status,
    payment_status: session.payment_status,
    customer_email: session.customer_email,
    pack_id: session.metadata?.pack_id,
    plugins: session.metadata?.plugins?.split(',') || []
  })
})

export default stripeRoutes
