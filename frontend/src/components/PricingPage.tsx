import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { NeonButton, MarketplacePanel, SectionLead } from './common/marketplace'
import { config } from '../config'

const Page = styled.div`
  max-width: 1080px;
  margin: 0 auto;
  padding: calc(96px + ${({ theme }) => theme.spacing.xl}) ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xxl};
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const Price = styled.div`
  font-size: 2.1rem;
  font-family: ${({ theme }) => theme.fonts.sans};
`

const Note = styled.p`
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: 0.88rem;
`

interface PlansResponse {
  foundingRemaining?: number
  live?: boolean
}

const PricingPage: React.FC = () => {
  const [foundingRemaining, setFoundingRemaining] = useState<number>(50)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${config.api.baseUrl}/billing/plans`)
      .then((response) => response.json())
      .then((data: PlansResponse) => {
        if (typeof data.foundingRemaining === 'number') setFoundingRemaining(data.foundingRemaining)
      })
      .catch(() => undefined)
  }, [])

  const checkout = async (sku: string) => {
    setBusy(sku)
    setError(null)
    try {
      const response = await fetch(`${config.api.baseUrl}/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku })
      })
      const data = await response.json()
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Checkout unavailable.')
      }
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout unavailable.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Page>
      <h1>CLDCDE Pro</h1>
      <SectionLead>
        Public catalog stays free. Pro unlocks the private vault, auto-updates, and first-party packs.
      </SectionLead>
      <Grid>
        <MarketplacePanel>
          <h2>Monthly</h2>
          <Price>$19</Price>
          <p>7-day trial. Cancel in Stripe Customer Portal.</p>
          <NeonButton disabled={busy !== null} onClick={() => checkout('pro_monthly')}>
            {busy === 'pro_monthly' ? 'Redirecting…' : 'Start monthly'}
          </NeonButton>
        </MarketplacePanel>
        <MarketplacePanel>
          <h2>Yearly</h2>
          <Price>$149</Price>
          <p>Two months free versus monthly. Same vault access.</p>
          <NeonButton disabled={busy !== null} onClick={() => checkout('pro_yearly')}>
            {busy === 'pro_yearly' ? 'Redirecting…' : 'Start yearly'}
          </NeonButton>
        </MarketplacePanel>
        <MarketplacePanel>
          <h2>Founding</h2>
          <Price>$99</Price>
          <p>{foundingRemaining} of 50 first-year seats left. Real cap, not a fake countdown.</p>
          <NeonButton
            $tone="secondary"
            disabled={busy !== null || foundingRemaining <= 0}
            onClick={() => checkout('founding_yearly')}
          >
            {foundingRemaining <= 0 ? 'Cohort full' : busy === 'founding_yearly' ? 'Redirecting…' : 'Claim founding year'}
          </NeonButton>
        </MarketplacePanel>
      </Grid>
      {error && <Note>{error}</Note>}
      <Note>Fulfillment happens on the Stripe webhook, not the success page. Taxes are collected only after Stripe Tax is registered.</Note>
    </Page>
  )
}

export { PricingPage }
