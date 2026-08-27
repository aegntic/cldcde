import { Hono } from 'hono'
import { canDownloadPro } from '../billing/entitlements'
import { getEntitlementStore } from './billing'

export const entitlementRoutes = new Hono()

entitlementRoutes.get('/me', async (c) => {
  const email = (c.req.query('email') || '').trim().toLowerCase()
  if (!email) return c.json({ error: 'email required' }, 400)
  const row = await getEntitlementStore().get(email)
  return c.json({
    entitlement: row,
    pro: canDownloadPro(row)
  })
})

export const downloadRoutes = new Hono()

downloadRoutes.get('/pro/latest', async (c) => {
  const email = (c.req.query('email') || '').trim().toLowerCase()
  const row = await getEntitlementStore().get(email)
  if (!canDownloadPro(row)) {
    return c.json({ error: 'Pro entitlement required.' }, 402)
  }
  return c.json({
    version: 'pending-pack',
    message: 'Pro zip will be published to R2 after the private packager run.',
    entitled: true
  })
})

export const updateRoutes = new Hono()

updateRoutes.get('/latest', async (c) => {
  const email = (c.req.query('email') || '').trim().toLowerCase()
  const row = await getEntitlementStore().get(email)
  if (!canDownloadPro(row)) {
    return c.json({ error: 'Pro entitlement required.' }, 401)
  }
  return c.json({
    version: new Date().toISOString().slice(0, 10),
    channel: 'pro',
    checksum: null
  })
})
