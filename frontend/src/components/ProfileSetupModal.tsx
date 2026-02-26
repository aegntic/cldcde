import React, { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { config } from '../config'
import {
  Badge,
  FilterPill,
  MarketplacePanel,
  NeonButton,
  SectionHeaderAscii,
  SectionLead
} from './common/marketplace'

interface ProfileSetupModalProps {
  onClose: () => void
  onComplete: (profile: any) => void
  user: any
}

const AVATAR_CHOICES = [
  '[[]]',
  '<::>',
  '{##}',
  '<00>',
  '{::}',
  '<##>',
  '[//]',
  '<||>',
  '{==}',
  '[<>]',
  '{@@}',
  '<++>'
]

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 1200;
  padding: ${({ theme }) => theme.spacing.md};
  background:
    radial-gradient(circle at 18% 12%, rgba(73, 221, 255, 0.13) 0%, transparent 40%),
    radial-gradient(circle at 84% 18%, rgba(80, 245, 200, 0.1) 0%, transparent 42%),
    rgba(2, 7, 16, 0.78);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
`

const Modal = styled(MarketplacePanel).attrs({
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.98 },
  transition: { duration: 0.18 }
})`
  width: min(640px, 100%);
  max-height: min(92vh, 780px);
  overflow: auto;
  position: relative;
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`

const TopRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const CloseButton = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => `${theme.colors.background.secondary}d8`};
  color: ${({ theme }) => theme.colors.text.secondary};
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    border-color: ${({ theme }) => theme.colors.interactive.primary};
  }
`

const Form = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`

const Field = styled.label`
  display: grid;
  gap: 0.42rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.74rem;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.text.tertiary};
  text-transform: uppercase;
`

const Input = styled.input`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => `${theme.colors.background.secondary}dc`};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: 0.95rem;
  padding: 0.66rem 0.78rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.interactive.primary};
    box-shadow: 0 0 0 1px ${({ theme }) => `${theme.colors.interactive.primary}66`};
  }
`

const StatusRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`

const AvatarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(78px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
`

const AvatarButton = styled(FilterPill)<{ $selected: boolean }>`
  min-height: 48px;
  justify-content: center;
  font-size: 0.84rem;
  background: ${({ theme, $selected }) =>
    $selected ? `${theme.colors.interactive.primary}28` : `${theme.colors.background.secondary}ca`};
  color: ${({ theme }) => theme.colors.text.primary};
`

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Msg = styled.div<{ $kind: 'error' | 'ok' }>`
  border: 1px solid
    ${({ theme, $kind }) => ($kind === 'error' ? `${theme.colors.status.error}66` : `${theme.colors.status.success}66`)};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => `${theme.colors.background.secondary}cc`};
  color: ${({ theme, $kind }) => ($kind === 'error' ? theme.colors.status.error : theme.colors.status.success)};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.78rem;
  padding: ${({ theme }) => theme.spacing.sm};
`

const Spinner = styled.span`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: currentColor;
  display: inline-block;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

const sanitizeUsername = (value: string): string => value.toLowerCase().replace(/[^a-z0-9_-]/g, '')

const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ onClose, onComplete, user }) => {
  const [username, setUsername] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_CHOICES[0])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    const candidate = username.trim()
    if (candidate.length < 3) {
      setUsernameAvailable(null)
      setIsCheckingUsername(false)
      return
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setIsCheckingUsername(true)
      try {
        const response = await fetch(`${config.api.baseUrl}/users/check-username?username=${encodeURIComponent(candidate)}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        })
        const data = await response.json()
        if (!cancelled) {
          setUsernameAvailable(Boolean(data.available))
        }
      } catch (err) {
        console.error('Username check failed:', err)
        if (!cancelled) {
          setUsernameAvailable(null)
        }
      } finally {
        if (!cancelled) {
          setIsCheckingUsername(false)
        }
      }
    }, 320)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [username])

  const canSubmit = useMemo(
    () => username.length >= 3 && username.length <= 20 && usernameAvailable === true,
    [username, usernameAvailable]
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters.')
      }
      if (username.length > 20) {
        throw new Error('Username must be 20 characters or less.')
      }
      if (usernameAvailable !== true) {
        throw new Error('Username is not available yet.')
      }

      const response = await fetch(`${config.api.baseUrl}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          username,
          avatar_url: selectedAvatar
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      const updatedProfile = await response.json()
      onComplete(updatedProfile)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to update profile.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Overlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Modal>
        <TopRow>
          <Badge $tone="new">New Operator</Badge>
          <CloseButton type="button" onClick={onClose} aria-label="Close profile setup">
            ×
          </CloseButton>
        </TopRow>

        <SectionHeaderAscii text="PROFILE SETUP" size="card" level={2} />
        <SectionLead>
          Configure a unique profile handle and avatar signature for marketplace activity.
          {user?.email ? ` Signed in as ${user.email}.` : ''}
        </SectionLead>

        <Form onSubmit={handleSubmit}>
          <Field>
            Username
            <Input
              id="username"
              type="text"
              placeholder="operator_handle"
              value={username}
              onChange={(event) => {
                setUsername(sanitizeUsername(event.target.value))
                setError(null)
              }}
              maxLength={20}
              autoComplete="off"
              required
            />
          </Field>

          <StatusRow>
            {isCheckingUsername && <Badge>checking availability</Badge>}
            {!isCheckingUsername && username.length >= 3 && usernameAvailable === true && <Badge $tone="new">username available</Badge>}
            {!isCheckingUsername && username.length >= 3 && usernameAvailable === false && <Badge $tone="tier">username taken</Badge>}
          </StatusRow>

          <Field>
            Avatar Signature
            <AvatarGrid>
              {AVATAR_CHOICES.map((avatar) => (
                <AvatarButton
                  key={avatar}
                  type="button"
                  $active={selectedAvatar === avatar}
                  $selected={selectedAvatar === avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  {avatar}
                </AvatarButton>
              ))}
            </AvatarGrid>
          </Field>

          {error && <Msg $kind="error">{error}</Msg>}

          <ActionRow>
            <NeonButton type="button" $tone="ghost" onClick={onClose} whileTap={{ scale: 0.98 }}>
              Skip for now
            </NeonButton>
            <NeonButton type="submit" disabled={isLoading || !canSubmit} whileTap={{ scale: 0.98 }}>
              {isLoading ? <Spinner aria-hidden /> : 'Complete setup'}
            </NeonButton>
          </ActionRow>
        </Form>
      </Modal>
    </Overlay>
  )
}

export { ProfileSetupModal }
