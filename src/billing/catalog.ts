export type BillingSku = 'pro_monthly' | 'pro_yearly' | 'founding_yearly'

export type BillingMode = 'subscription' | 'payment'

export interface BillingPlan {
  sku: BillingSku
  name: string
  mode: BillingMode
  amountCents: number
  interval?: 'month' | 'year'
  trialDays?: number
  foundingCap?: number
}

export const BILLING_PLANS: Record<BillingSku, BillingPlan> = {
  pro_monthly: {
    sku: 'pro_monthly',
    name: 'CLDCDE Pro Monthly',
    mode: 'subscription',
    amountCents: 1900,
    interval: 'month',
    trialDays: 7
  },
  pro_yearly: {
    sku: 'pro_yearly',
    name: 'CLDCDE Pro Yearly',
    mode: 'subscription',
    amountCents: 14900,
    interval: 'year',
    trialDays: 7
  },
  founding_yearly: {
    sku: 'founding_yearly',
    name: 'CLDCDE Founding Yearly',
    mode: 'subscription',
    amountCents: 9900,
    interval: 'year',
    foundingCap: 50
  }
}

export const priceEnvKey = (sku: BillingSku): string => {
  if (sku === 'pro_monthly') return 'STRIPE_PRICE_PRO_MONTHLY'
  if (sku === 'pro_yearly') return 'STRIPE_PRICE_PRO_YEARLY'
  return 'STRIPE_PRICE_FOUNDING_YEARLY'
}

export const isBillingSku = (value: string): value is BillingSku =>
  value === 'pro_monthly' || value === 'pro_yearly' || value === 'founding_yearly'
