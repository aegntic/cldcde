import { applyStripeStatus, type EntitlementStore } from './entitlements'

export interface StripeLikeEvent {
  type: string
  data: {
    object: Record<string, any>
  }
}

const emailFrom = (object: Record<string, any>): string => {
  const email =
    object.customer_details?.email ||
    object.customer_email ||
    object.receipt_email ||
    object.customer?.email ||
    ''
  return String(email).trim().toLowerCase()
}

export const handleStripeEvent = async (event: StripeLikeEvent, store: EntitlementStore): Promise<{ granted: boolean; reason: string }> => {
  const object = event.data.object
  const email = emailFrom(object)
  const sku = String(object.metadata?.sku || object.subscription_details?.metadata?.sku || '')

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    if (object.payment_status && object.payment_status !== 'paid') {
      return { granted: false, reason: 'unpaid_session' }
    }
    if (!email) return { granted: false, reason: 'missing_email' }
    await store.put({
      email,
      sku: sku || 'pro_monthly',
      status: 'active',
      stripeCustomerId: object.customer || undefined,
      stripeSubscriptionId: object.subscription || undefined,
      updatedAt: new Date().toISOString()
    })
    return { granted: true, reason: 'checkout_paid' }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    if (!email && !object.customer) return { granted: false, reason: 'missing_customer' }
    const key = email || String(object.customer)
    const existing = email ? await store.get(email) : null
    await store.put({
      email: existing?.email || key,
      sku: existing?.sku || sku || 'pro_monthly',
      status: event.type === 'customer.subscription.deleted' ? 'canceled' : applyStripeStatus(String(object.status || '')),
      stripeCustomerId: object.customer || existing?.stripeCustomerId,
      stripeSubscriptionId: object.id || existing?.stripeSubscriptionId,
      updatedAt: new Date().toISOString()
    })
    return { granted: object.status === 'active' || object.status === 'trialing', reason: event.type }
  }

  if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
    if (!email) return { granted: false, reason: 'missing_email' }
    const existing = await store.get(email)
    await store.put({
      email,
      sku: existing?.sku || sku || 'pro_monthly',
      status: event.type === 'invoice.paid' ? 'active' : 'past_due',
      stripeCustomerId: object.customer || existing?.stripeCustomerId,
      stripeSubscriptionId: object.subscription || existing?.stripeSubscriptionId,
      updatedAt: new Date().toISOString()
    })
    return { granted: event.type === 'invoice.paid', reason: event.type }
  }

  return { granted: false, reason: 'ignored' }
}
