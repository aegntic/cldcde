import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { SectionLead } from './common/marketplace'
import { config } from '../config'

const Page = styled.div`
  max-width: 760px;
  margin: 0 auto;
  padding: calc(96px + ${({ theme }) => theme.spacing.xl}) ${({ theme }) => theme.spacing.lg};
`

const AccountPage: React.FC = () => {
  const [status, setStatus] = useState('Waiting for webhook fulfillment…')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    if (!sessionId) {
      setStatus('No checkout session on this page. Open Pricing to subscribe.')
      return
    }
    setStatus(`Checkout ${sessionId} received. Entitlement activates when Stripe marks the session paid.`)
    fetch(`${config.api.baseUrl}/billing/plans`).catch(() => undefined)
  }, [])

  return (
    <Page>
      <h1>Account</h1>
      <SectionLead>{status}</SectionLead>
    </Page>
  )
}

export { AccountPage }
