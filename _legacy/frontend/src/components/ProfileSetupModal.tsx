import React, { useState } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { config } from '../config'

interface ProfileSetupModalProps {
  onClose: () => void
  onComplete: (profile: any) => void
  user: any
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing.md};
`

const Modal = styled(motion.div)`
  background: ${({ theme }) => theme.colors.background.modal};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 500px;
  width: 100%;
  position: relative;
  backdrop-filter: blur(10px);
`

const Title = styled.h2`
  font-size: 1.5rem;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
`

const Subtitle = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
`

const Input = styled.input`
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: 1rem;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.border.focus};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.border.focus}33;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`

const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const AvatarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
  max-height: 200px;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.background.secondary};
`

const AvatarOption = styled.button<{ selected: boolean }>`
  width: 60px;
  height: 60px;
  border: 2px solid ${({ selected, theme }) => 
    selected ? theme.colors.interactive.primary : theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ selected, theme }) => 
    selected ? theme.colors.background.secondary : theme.colors.background.primary};
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  position: relative;

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.focus};
    transform: scale(1.05);
  }

  ${({ selected, theme }) => selected && `
    &::after {
      content: '✓';
      position: absolute;
      bottom: -2px;
      right: -2px;
      background: ${theme.colors.interactive.primary};
      color: white;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
    }
  `}
`

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ variant, theme }) => 
    variant === 'secondary' ? 'transparent' : theme.colors.interactive.primary};
  color: ${({ variant, theme }) => 
    variant === 'secondary' ? theme.colors.text.secondary : 'white'};
  border: 1px solid ${({ variant, theme }) => 
    variant === 'secondary' ? theme.colors.border.primary : theme.colors.interactive.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.fonts.sans};
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};

  &:hover {
    background: ${({ variant, theme }) => 
      variant === 'secondary' ? theme.colors.background.secondary : theme.colors.interactive.primaryHover};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.status.error};
  font-size: 0.85rem;
  margin-top: ${({ theme }) => theme.spacing.xs};
`

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

// Default avatars - mix of emojis and ASCII art
const DEFAULT_AVATARS = [
  '🤖', '👾', '🚀', '💻', '🔧', '⚡', '🎯', '🎨',
  '🧠', '💡', '🔍', '📡', '🛸', '🌟', '🔮', '🎪',
  '🦾', '🤯', '🧬', '🔬', '🪐', '🌌', '🎭', '🎲',
  '◉', '◎', '◈', '◊', '▣', '▤', '▥', '▦',
  '♠', '♣', '♥', '♦', '★', '☆', '✦', '✧'
]

const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ onClose, onComplete, user }) => {
  const [username, setUsername] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  // Check username availability
  const checkUsername = async (value: string) => {
    if (value.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setIsCheckingUsername(true)
    try {
      const response = await fetch(`${config.api.baseUrl}/users/check-username?username=${value}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const data = await response.json()
      setUsernameAvailable(data.available)
    } catch (err) {
      console.error('Username check failed:', err)
    } finally {
      setIsCheckingUsername(false)
    }
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    setUsername(value)
    setError(null)
    
    // Debounce username check
    const timeoutId = setTimeout(() => checkUsername(value), 500)
    return () => clearTimeout(timeoutId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Validate username
      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters')
      }
      if (username.length > 20) {
        throw new Error('Username must be 20 characters or less')
      }
      if (!usernameAvailable) {
        throw new Error('Username is already taken')
      }

      // Update user profile
      const response = await fetch(`${config.api.baseUrl}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
        setError('Failed to update profile. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <Overlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Modal
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Title>Welcome to cldcde.cc! 🎉</Title>
        <Subtitle>Let's set up your profile</Subtitle>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="username">Choose your username</Label>
            <Input
              id="username"
              type="text"
              placeholder="cooldev123"
              value={username}
              onChange={handleUsernameChange}
              pattern="[a-z0-9_-]+"
              maxLength={20}
              required
            />
            {isCheckingUsername && (
              <small style={{ color: 'gray' }}>Checking availability...</small>
            )}
            {!isCheckingUsername && usernameAvailable === true && username.length >= 3 && (
              <small style={{ color: 'green' }}>✓ Username available</small>
            )}
            {!isCheckingUsername && usernameAvailable === false && (
              <small style={{ color: 'red' }}>✗ Username already taken</small>
            )}
          </FormGroup>

          <FormGroup>
            <Label>Pick your avatar</Label>
            <AvatarGrid>
              {DEFAULT_AVATARS.map((avatar, index) => (
                <AvatarOption
                  key={index}
                  type="button"
                  selected={selectedAvatar === avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  {avatar}
                </AvatarOption>
              ))}
            </AvatarGrid>
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <ButtonGroup>
            <Button type="button" variant="secondary" onClick={handleSkip}>
              Skip for now
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || username.length < 3 || !usernameAvailable}
            >
              {isLoading ? <LoadingSpinner /> : 'Complete Setup'}
            </Button>
          </ButtonGroup>
        </Form>
      </Modal>
    </Overlay>
  )
}

export { ProfileSetupModal }