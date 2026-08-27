export type EntitlementStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'none'

export interface Entitlement {
  email: string
  sku: string
  status: EntitlementStatus
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  updatedAt: string
}

export interface EntitlementStore {
  get(email: string): Promise<Entitlement | null>
  put(entitlement: Entitlement): Promise<void>
  countFounding(): Promise<number>
}

export const canDownloadPro = (entitlement: Entitlement | null): boolean => {
  if (!entitlement) return false
  return entitlement.status === 'active' || entitlement.status === 'trialing'
}

export const applyStripeStatus = (status: string): EntitlementStatus => {
  if (status === 'active' || status === 'trialing' || status === 'past_due' || status === 'canceled') {
    return status
  }
  if (status === 'unpaid' || status === 'incomplete') return 'past_due'
  return 'none'
}

export const memoryEntitlementStore = (): EntitlementStore => {
  const rows = new Map<string, Entitlement>()
  return {
    async get(email) {
      return rows.get(email.toLowerCase()) || null
    },
    async put(entitlement) {
      rows.set(entitlement.email.toLowerCase(), entitlement)
    },
    async countFounding() {
      return [...rows.values()].filter((row) => row.sku === 'founding_yearly' && canDownloadPro(row)).length
    }
  }
}
