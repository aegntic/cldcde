import { Hono } from 'hono'
import { z } from 'zod'

const leadsRoutes = new Hono<{
  Bindings: {
    RESEND_API_KEY?: string
  }
}>()

const subscribeSchema = z.object({
  email: z.string().email(),
  source: z.string().trim().min(1).max(80).optional().default('unknown'),
  intent: z.enum(['updates', 'access', 'both']).optional().default('both'),
  notes: z.string().trim().max(400).optional()
})

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

leadsRoutes.post('/subscribe', async (c) => {
  try {
    if (!c.env.RESEND_API_KEY) {
      return c.json({ error: 'Email capture is temporarily unavailable.' }, 503)
    }

    const body = subscribeSchema.parse(await c.req.json())
    const receivedAt = new Date().toISOString()
    const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unavailable'
    const userAgent = c.req.header('User-Agent') || 'unavailable'
    const origin = c.req.header('Origin') || 'unavailable'
    const notes = body.notes?.trim() || 'none'

    const subjectPrefix =
      body.intent === 'access'
        ? 'Access request'
        : body.intent === 'updates'
        ? 'Updates request'
        : 'Launch lead'

    const payload = {
      from: 'CLDCDE <onboarding@resend.dev>',
      to: ['aegntic@gmail.com'],
      reply_to: body.email,
      subject: `[CLDCDE] ${subjectPrefix} from ${body.source}`,
      text: [
        `Email: ${body.email}`,
        `Intent: ${body.intent}`,
        `Source: ${body.source}`,
        `Origin: ${origin}`,
        `Received: ${receivedAt}`,
        `IP: ${ipAddress}`,
        `User-Agent: ${userAgent}`,
        `Notes: ${notes}`
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#101828">
          <h2 style="margin:0 0 12px">New CLDCDE lead</h2>
          <p style="margin:0 0 12px"><strong>Email:</strong> ${escapeHtml(body.email)}</p>
          <p style="margin:0 0 12px"><strong>Intent:</strong> ${escapeHtml(body.intent)}</p>
          <p style="margin:0 0 12px"><strong>Source:</strong> ${escapeHtml(body.source)}</p>
          <p style="margin:0 0 12px"><strong>Origin:</strong> ${escapeHtml(origin)}</p>
          <p style="margin:0 0 12px"><strong>Received:</strong> ${escapeHtml(receivedAt)}</p>
          <p style="margin:0 0 12px"><strong>IP:</strong> ${escapeHtml(ipAddress)}</p>
          <p style="margin:0 0 12px"><strong>User-Agent:</strong> ${escapeHtml(userAgent)}</p>
          <p style="margin:0"><strong>Notes:</strong> ${escapeHtml(notes)}</p>
        </div>
      `
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const resendData = await resendResponse.json().catch(() => null)

    if (!resendResponse.ok) {
      console.error('Lead capture failed:', resendData)
      return c.json({ error: 'Email capture failed. Please try again shortly.' }, 502)
    }

    return c.json({
      message: 'Saved. We will send access and release updates to that address.',
      id: resendData?.id || null
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0]?.message || 'Invalid email address.' }, 400)
    }

    console.error('Lead capture error:', error)
    return c.json({ error: 'Email capture failed. Please try again shortly.' }, 500)
  }
})

export default leadsRoutes
