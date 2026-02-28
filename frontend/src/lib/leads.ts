import { z } from 'zod'
import { config } from '../config'

const leadCaptureSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  source: z.string().trim().min(1).max(80).optional().default('unknown'),
  intent: z.enum(['updates', 'access', 'both']).optional().default('both'),
  notes: z.string().trim().max(400).optional()
})

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>

export async function submitLeadCapture(input: LeadCaptureInput) {
  const parsed = leadCaptureSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || 'Enter a valid email address.')
  }

  const payload = parsed.data
  const response = await fetch(`${config.api.baseUrl}/leads/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Email capture failed. Please try again.')
  }

  return data as { message: string; id?: string | null }
}

export { leadCaptureSchema }
