import { Hono } from 'hono'
import { BILLING_PLANS, isBillingSku, priceEnvKey, type BillingSku } from '../billing/catalog'
import { memoryEntitlementStore, type EntitlementStore } from '../billing/entitlements'
import { handleStripeEvent } from '../billing/webhooks'

type BillingEnv = {
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
  STRIPE_PRICE_PRO_MONTHLY?: string
  STRIPE_PRICE_PRO_YEARLY?: string
  STRIPE_PRICE_FOUNDING_YEARLY?: string
  APP_ORIGIN?: string
  BILLXML_STRIPE_ACCOUNT?: string
}

const defaultStore = memoryEntitlementStore()

export const getEntitlementStore = (): EntitlementStore => defaultStore

const randomSuffix = () => Math.random().toString(36).slice(2, 10)

export const billingRoutes = new Hono<{ Bindings: BillingEnv }>()

billingRoutes.get('/plans', async (c) => {
  const foundingRemaining = Math.max(0, 50 - (await getEntitlementStore().countFounding()))
  return c.json({
    plans: BILLING_PLANS,
    foundingRemaining,
    live: Boolean(c.env.STRIPE_SECRET_KEY)
  })
})

billingRoutes.post('/checkout', async (c) => {
  if (c.env.BILLXML_STRIPE_ACCOUNT === 'acct_1U7BiYRdqQ8V40zB') {
    return c.json({ error: 'Refusing BILLXML Stripe account for CLDCDE charges.' }, 500)
  }
  if (!c.env.STRIPE_SECRET_KEY) {
    return c.json({ error: 'Billing is not configured yet.' }, 503)
  }
  if (c.env.STRIPE_SECRET_KEY.startsWith('sk_') && !c.env.STRIPE_SECRET_KEY.startsWith('rk_')) {
    return c.json({ error: 'Use a restricted Stripe key (rk_) for CLDCDE.' }, 500)
  }

  const body = await c.req.json().catch(() => ({}))
  const sku = String(body.sku || '')
  if (!isBillingSku(sku)) {
    return c.json({ error: 'Unknown plan.' }, 400)
  }
  const plan = BILLING_PLANS[sku as BillingSku]
  if (plan.foundingCap) {
    const used = await getEntitlementStore().countFounding()
    if (used >= plan.foundingCap) {
      return c.json({ error: 'Founding cohort is full.' }, 409)
    }
  }

  const priceId = c.env[priceEnvKey(sku) as keyof BillingEnv]
  if (!priceId) {
    return c.json({ error: `Missing ${priceEnvKey(sku)}.` }, 503)
  }

  const origin = c.env.APP_ORIGIN || 'https://cldcde.cc'
  const payload = {
    mode: plan.mode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/account?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing`,
    customer_email: typeof body.email === 'string' ? body.email : undefined,
    allow_promotion_codes: true,
    metadata: { sku, ref: typeof body.ref === 'string' ? body.ref : '' },
    subscription_data:
      plan.mode === 'subscription'
        ? {
            trial_period_days: plan.trialDays,
            metadata: { sku }
          }
        : undefined,
    integration_identifier: `cldcde_${sku}_${randomSuffix()}`
  }

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: encodeStripeForm(payload)
  })
  const json = await response.json()
  if (!response.ok) {
    return c.json({ error: 'Stripe checkout failed.', details: json }, 502)
  }
  return c.json({ url: json.url, id: json.id })
})

billingRoutes.post('/portal', async (c) => {
  if (!c.env.STRIPE_SECRET_KEY) {
    return c.json({ error: 'Billing is not configured yet.' }, 503)
  }
  const body = await c.req.json().catch(() => ({}))
  if (!body.customerId) {
    return c.json({ error: 'customerId required.' }, 400)
  }
  const origin = c.env.APP_ORIGIN || 'https://cldcde.cc'
  const params = new URLSearchParams({
    customer: String(body.customerId),
    return_url: `${origin}/account`
  })
  const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  })
  const json = await response.json()
  if (!response.ok) {
    return c.json({ error: 'Portal session failed.', details: json }, 502)
  }
  return c.json({ url: json.url })
})

billingRoutes.post('/webhook', async (c) => {
  if (!c.env.STRIPE_WEBHOOK_SECRET) {
    return c.json({ error: 'Webhook secret missing.' }, 503)
  }
  const signature = c.req.header('stripe-signature')
  if (!signature) {
    return c.json({ error: 'Missing signature.' }, 400)
  }
  const event = await c.req.json().catch(() => null)
  if (!event?.type) {
    return c.json({ error: 'Invalid event.' }, 400)
  }
  const result = await handleStripeEvent(event, getEntitlementStore())
  return c.json(result)
})

const encodeStripeForm = (payload: Record<string, any>, prefix = ''): URLSearchParams => {
  const params = new URLSearchParams()
  const walk = (value: any, path: string) => {
    if (value === undefined || value === null) return
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${path}[${index}]`))
      return
    }
    if (typeof value === 'object') {
      Object.entries(value).forEach(([key, nested]) => walk(nested, path ? `${path}[${key}]` : key))
      return
    }
    params.append(path, String(value))
  }
  walk(payload, prefix)
  return params
}
