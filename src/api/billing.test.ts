import { describe, expect, test } from 'bun:test'
import { BILLING_PLANS, isBillingSku } from '../billing/catalog'

describe('billing catalog', () => {
  test('recognizes v1 skus only', () => {
    expect(isBillingSku('pro_monthly')).toBe(true)
    expect(isBillingSku('pro_yearly')).toBe(true)
    expect(isBillingSku('founding_yearly')).toBe(true)
    expect(isBillingSku('connect_seller')).toBe(false)
  })

  test('founding cohort is capped at 50', () => {
    expect(BILLING_PLANS.founding_yearly.foundingCap).toBe(50)
    expect(BILLING_PLANS.pro_monthly.amountCents).toBe(1900)
    expect(BILLING_PLANS.pro_yearly.amountCents).toBe(14900)
  })
})
