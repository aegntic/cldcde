import { afterEach, describe, expect, mock, test } from 'bun:test'
import { submitLeadCapture } from './leads'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('submitLeadCapture', () => {
  test('validates email before sending the request', async () => {
    await expect(
      submitLeadCapture({
        email: 'not-an-email',
        source: 'home-hero',
        intent: 'both'
      })
    ).rejects.toThrow('Enter a valid email address.')
  })

  test('posts normalized capture payload to the leads endpoint', async () => {
    const fetchMock = mock(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body || '{}'))

      expect(body).toEqual({
        email: 'operator@aegntic.ai',
        source: 'auth-modal',
        intent: 'both'
      })

      return {
        ok: true,
        status: 200,
        json: async () => ({ message: 'Saved.' })
      } as Response
    })

    globalThis.fetch = fetchMock as unknown as typeof fetch

    const result = await submitLeadCapture({
      email: 'operator@aegntic.ai',
      source: 'auth-modal',
      intent: 'both'
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.message).toBe('Saved.')
  })
})
