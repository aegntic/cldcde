import { describe, expect, test } from 'bun:test'
import { canDownloadPro, memoryEntitlementStore } from '../billing/entitlements'

describe('pro downloads', () => {
  test('anonymous users cannot download pro', () => {
    expect(canDownloadPro(null)).toBe(false)
  })

  test('active and trialing can download, past_due cannot', async () => {
    const store = memoryEntitlementStore()
    await store.put({
      email: 'ok@example.com',
      sku: 'pro_monthly',
      status: 'active',
      updatedAt: new Date().toISOString()
    })
    await store.put({
      email: 'late@example.com',
      sku: 'pro_monthly',
      status: 'past_due',
      updatedAt: new Date().toISOString()
    })
    expect(canDownloadPro(await store.get('ok@example.com'))).toBe(true)
    expect(canDownloadPro(await store.get('late@example.com'))).toBe(false)
  })
})
