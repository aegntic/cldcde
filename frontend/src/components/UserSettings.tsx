import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { config } from '../config'
import {
  FilterPill,
  MarketplacePanel,
  NeonButton,
  SectionHeaderAscii,
  SectionLead,
  SectionRail
} from './common/marketplace'

interface UserSettingsProps {
  user: any
  onUpdate: (user: any) => void
}

const Group = styled(MarketplacePanel)`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
`

const OptionRow = styled.label`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: start;
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => `${theme.colors.background.secondary}c4`};
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.84rem;
  line-height: 1.45;

  input[type='checkbox'] {
    margin-top: 0.15rem;
    accent-color: ${({ theme }) => theme.colors.interactive.primary};
  }
`

const OptionTitle = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.74rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Feedback = styled.div<{ $tone: 'ok' | 'error' }>`
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'ok' ? `${theme.colors.status.success}66` : `${theme.colors.status.error}66`)};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => `${theme.colors.background.secondary}cc`};
  color: ${({ theme, $tone }) => ($tone === 'ok' ? theme.colors.status.success : theme.colors.status.error)};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.78rem;
  padding: ${({ theme }) => theme.spacing.sm};
`

export const UserSettings: React.FC<UserSettingsProps> = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preferences, setPreferences] = useState({
    mailing_list_opt_in: true,
    newsletter: true,
    product_updates: true,
    community_digest: true,
    promotional: false
  })

  useEffect(() => {
    if (user?.profile) {
      setPreferences({
        mailing_list_opt_in: user.profile.mailing_list_opt_in ?? true,
        ...(user.profile.mailing_preferences || {
          newsletter: true,
          product_updates: true,
          community_digest: true,
          promotional: false
        })
      })
    }
  }, [user])

  const handleSave = async () => {
    setLoading(true)
    setSaved(false)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${config.api.baseUrl}/users/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          mailing_list_opt_in: preferences.mailing_list_opt_in,
          mailing_preferences: {
            newsletter: preferences.newsletter,
            product_updates: preferences.product_updates,
            community_digest: preferences.community_digest,
            promotional: preferences.promotional
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update preferences')
      }

      const updatedUser = await response.json()
      onUpdate(updatedUser)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2800)
    } catch (err) {
      console.error('Failed to save preferences:', err)
      setError('Could not save preferences. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribeAll = () => {
    setPreferences({
      mailing_list_opt_in: false,
      newsletter: false,
      product_updates: false,
      community_digest: false,
      promotional: false
    })
  }

  return (
    <SectionRail>
      <SectionHeaderAscii text="USER SETTINGS" size="section" level={2} />
      <SectionLead>Control notifications and release updates for your account.</SectionLead>

      <Group>
        <OptionRow>
          <input
            type="checkbox"
            checked={preferences.mailing_list_opt_in}
            onChange={(event) =>
              setPreferences({
                ...preferences,
                mailing_list_opt_in: event.target.checked
              })
            }
          />
          <div>
            <OptionTitle>Mailing List</OptionTitle>
            Enable core release emails and operational updates.
          </div>
        </OptionRow>

        {preferences.mailing_list_opt_in && (
          <>
            <OptionRow>
              <input
                type="checkbox"
                checked={preferences.newsletter}
                onChange={(event) => setPreferences({ ...preferences, newsletter: event.target.checked })}
              />
              <div>
                <OptionTitle>Weekly Newsletter</OptionTitle>
                Digest of new plugins, MCP servers, and pack improvements.
              </div>
            </OptionRow>

            <OptionRow>
              <input
                type="checkbox"
                checked={preferences.product_updates}
                onChange={(event) => setPreferences({ ...preferences, product_updates: event.target.checked })}
              />
              <div>
                <OptionTitle>Product Updates</OptionTitle>
                Detailed release notes for major feature updates.
              </div>
            </OptionRow>

            <OptionRow>
              <input
                type="checkbox"
                checked={preferences.community_digest}
                onChange={(event) => setPreferences({ ...preferences, community_digest: event.target.checked })}
              />
              <div>
                <OptionTitle>Community Digest</OptionTitle>
                Highlights from ecosystem contributions and launch stories.
              </div>
            </OptionRow>

            <OptionRow>
              <input
                type="checkbox"
                checked={preferences.promotional}
                onChange={(event) => setPreferences({ ...preferences, promotional: event.target.checked })}
              />
              <div>
                <OptionTitle>Promotional Offers</OptionTitle>
                Optional partner announcements and special offers.
              </div>
            </OptionRow>
          </>
        )}

        <ButtonRow>
          <NeonButton type="button" onClick={handleSave} disabled={loading} whileTap={{ scale: 0.98 }}>
            {loading ? 'Saving...' : 'Save Preferences'}
          </NeonButton>

          {preferences.mailing_list_opt_in && (
            <NeonButton type="button" $tone="ghost" onClick={handleUnsubscribeAll} whileTap={{ scale: 0.98 }}>
              Unsubscribe All
            </NeonButton>
          )}

          <FilterPill type="button" $active>
            account:{' '}
            {(user?.email as string | undefined)?.split('@')[0] || 'operator'}
          </FilterPill>
        </ButtonRow>

        {saved && <Feedback $tone="ok">Preferences saved.</Feedback>}
        {error && <Feedback $tone="error">{error}</Feedback>}
      </Group>
    </SectionRail>
  )
}
