import { describe, expect, test } from 'bun:test'
import { canDownloadPro, memoryEntitlementStore } from './entitlements'
import { handleStripeEvent } from './webhooks'

describe('stripe webhook fulfillment', () => {
  test('grants entitlement only when checkout payment_status is paid', async () => {
    const store = memoryEntitlementStore()
    const unpaid = await handleStripeEvent(
      {
        type: 'checkout.session.completed',
        data: {
          object: {
            payment_status: 'unpaid',
            customer_details: { email: 'buyer@example.com' },
            metadata: { sku: 'pro_monthly' }
          }
        }
      },
      store
    )
    expect(unpaid.granted).toBe(false)
    expect(await store.get('buyer@example.com')).toBeNull()

    const paid = await handleStripeEvent(
      {
        type: 'checkout.session.completed',
        data: {
          object: {
            payment_status: 'paid',
            customer_details: { email: 'buyer@example.com' },
            metadata: { sku: 'pro_monthly' },
            customer: 'cus_123',
            subscription: 'sub_123'
          }
        }
      },
      store
    )
    expect(paid.granted).toBe(true)
    const row = await store.get('buyer@example.com')
    expect(row?.status).toBe('active')
    expect(canDownloadPro(row)).toBe(true)
  })

  test('async success after unpaid completed still grants once', async () => {
    const store = memoryEntitlementStore()
    await handleStripeEvent(
      {
        type: 'checkout.session.completed',
        data: { object: { payment_status: 'unpaid', customer_details: { email: 'later@example.com' }, metadata: { sku: 'pro_yearly' } } }
      },
      store
    )
    const later = await handleStripeEvent(
      {
        type: 'checkout.session.async_payment_succeeded',
        data: { object: { payment_status: 'paid', customer_details: { email: 'later@example.com' }, metadata: { sku: 'pro_yearly' } } }
      },
      store
    )
    expect(later.granted).toBe(true)
    expect(canDownloadPro(await store.get('later@example.com'))).toBe(true)
  })

  test('payment_failed revokes downloads', async () => {
    const store = memoryEntitlementStore()
    await handleStripeEvent(
      {
        type: 'checkout.session.completed',
        data: { object: { payment_status: 'paid', customer_details: { email: 'due@example.com' }, metadata: { sku: 'pro_monthly' } } }
      },
      store
    )
    await handleStripeEvent(
      {
        type: 'invoice.payment_failed',
        data: { object: { customer_email: 'due@example.com', customer: 'cus_due' } }
      },
      store
    )
    expect(canDownloadPro(await store.get('due@example.com'))).toBe(false)
  })

  test('subscription deleted cancels entitlement', async () => {
    const store = memoryEntitlementStore()
    await handleStripeEvent(
      {
        type: 'checkout.session.completed',
        data: { object: { payment_status: 'paid', customer_details: { email: 'out@example.com' }, metadata: { sku: 'pro_monthly' } } }
      },
      store
    )
    await handleStripeEvent(
      {
        type: 'customer.subscription.deleted',
        data: { object: { customer_email: 'out@example.com', status: 'canceled', customer: 'cus_out' } }
      },
      store
    )
    expect(canDownloadPro(await store.get('out@example.com'))).toBe(false)
  })
})
