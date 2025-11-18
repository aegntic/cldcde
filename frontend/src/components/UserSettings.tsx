import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { config } from '../config'

interface UserSettingsProps {
  user: any
  onUpdate: (user: any) => void
}

const SettingsContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`

const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
`

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
`

const PreferenceGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  
  input[type="checkbox"] {
    margin-right: ${({ theme }) => theme.spacing.sm};
    cursor: pointer;
    
    &:checked {
      accent-color: ${({ theme }) => theme.colors.interactive.primary};
    }
  }
`

const Description = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-left: 1.5rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const SaveButton = styled.button`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.interactive.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};
  
  &:hover {
    background: ${({ theme }) => theme.colors.interactive.primaryHover};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const SuccessMessage = styled.div`
  color: ${({ theme }) => theme.colors.status.success};
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.status.success}33;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`

export const UserSettings: React.FC<UserSettingsProps> = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [preferences, setPreferences] = useState({
    mailing_list_opt_in: true,
    newsletter: true,
    product_updates: true,
    community_digest: true,
    promotional: false
  })

  useEffect(() => {
    // Load user preferences
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

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${config.api.baseUrl}/users/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save preferences:', error)
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
    <SettingsContainer>
      <Section>
        <SectionTitle>Email Preferences</SectionTitle>
        
        <PreferenceGroup>
          <CheckboxLabel>
            <input
              type="checkbox"
              checked={preferences.mailing_list_opt_in}
              onChange={(e) => setPreferences({ ...preferences, mailing_list_opt_in: e.target.checked })}
            />
            Subscribe to mailing list
          </CheckboxLabel>
          <Description>
            Receive emails about new features and updates. We promise not to spam you or sell your data to third parties.
          </Description>
        </PreferenceGroup>

        {preferences.mailing_list_opt_in && (
          <>
            <PreferenceGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={preferences.newsletter}
                  onChange={(e) => setPreferences({ ...preferences, newsletter: e.target.checked })}
                />
                Weekly Newsletter
              </CheckboxLabel>
              <Description>
                Get a weekly digest of new extensions, top-rated resources, and community highlights.
              </Description>
            </PreferenceGroup>

            <PreferenceGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={preferences.product_updates}
                  onChange={(e) => setPreferences({ ...preferences, product_updates: e.target.checked })}
                />
                Product Updates
              </CheckboxLabel>
              <Description>
                Be the first to know about new features and improvements to the platform.
              </Description>
            </PreferenceGroup>

            <PreferenceGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={preferences.community_digest}
                  onChange={(e) => setPreferences({ ...preferences, community_digest: e.target.checked })}
                />
                Community Digest
              </CheckboxLabel>
              <Description>
                Monthly roundup of community contributions, discussions, and events.
              </Description>
            </PreferenceGroup>

            <PreferenceGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={preferences.promotional}
                  onChange={(e) => setPreferences({ ...preferences, promotional: e.target.checked })}
                />
                Promotional Emails
              </CheckboxLabel>
              <Description>
                Occasional special offers and partner promotions (max 1 per month).
              </Description>
            </PreferenceGroup>
          </>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <SaveButton onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Preferences'}
          </SaveButton>
          
          {preferences.mailing_list_opt_in && (
            <SaveButton 
              onClick={handleUnsubscribeAll}
              style={{ background: 'transparent', border: '1px solid currentColor', color: 'inherit' }}
            >
              Unsubscribe from All
            </SaveButton>
          )}
        </div>

        {saved && <SuccessMessage>Your preferences have been saved!</SuccessMessage>}
      </Section>
    </SettingsContainer>
  )
}