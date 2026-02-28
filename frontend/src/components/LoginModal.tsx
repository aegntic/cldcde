import React, { useMemo, useState } from 'react'
import styled from 'styled-components'
import { AnimatePresence, motion } from 'framer-motion'
import { z } from 'zod'
import { config } from '../config'
import {
  Badge,
  FilterPill,
  MarketplacePanel,
  NeonButton,
  SectionHeaderAscii,
  SectionLead,
  TagChip
} from './common/marketplace'
import { submitLeadCapture } from '../lib/leads'

interface LoginModalProps {
  onClose: () => void
  onLogin: (user: any) => void
  onShowProfileSetup?: (user: any) => void
  authAvailable: boolean
}

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  })

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 1200;
  padding: ${({ theme }) => theme.spacing.md};
  background:
    radial-gradient(circle at 18% 12%, rgba(71, 216, 255, 0.12) 0%, transparent 40%),
    radial-gradient(circle at 85% 20%, rgba(98, 248, 203, 0.1) 0%, transparent 44%),
    rgba(2, 7, 16, 0.76);
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
  width: min(560px, 100%);
  max-height: min(92vh, 760px);
  overflow: auto;
  position: relative;
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
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

const TabRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`

const Form = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Field = styled.label`
  display: grid;
  gap: 0.4rem;
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
  background: ${({ theme }) => `${theme.colors.background.secondary}de`};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: 0.95rem;
  padding: 0.64rem 0.76rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.interactive.primary};
    box-shadow: 0 0 0 1px ${({ theme }) => `${theme.colors.interactive.primary}66`};
  }
`

const StrengthWrap = styled.div`
  display: grid;
  gap: 0.45rem;
`

const StrengthMeter = styled.div<{ $strength: number }>`
  width: 100%;
  height: 5px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => `${theme.colors.background.primary}cc`};
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${({ $strength }) => `${$strength}%`};
    background: ${({ theme, $strength }) => {
      if ($strength < 25) return theme.colors.status.error
      if ($strength < 50) return theme.colors.status.warning
      if ($strength < 75) return theme.colors.status.info
      return theme.colors.status.success
    }};
    transition: width 180ms ease;
  }
`

const Requirements = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`

const FinePrint = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.45;

  input[type='checkbox'] {
    margin-top: 0.15rem;
    accent-color: ${({ theme }) => theme.colors.interactive.primary};
  }
`

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Msg = styled.div<{ $kind: 'error' | 'success' }>`
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

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin, onShowProfileSetup, authAvailable }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [leadEmail, setLeadEmail] = useState('')

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })

  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    mailingListOptIn: true
  })

  const passwordStrength = useMemo(() => {
    const password = registerForm.password
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[a-z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 12.5
    if (/[^A-Za-z0-9]/.test(password)) strength += 12.5
    return Math.min(strength, 100)
  }, [registerForm.password])

  const passwordRequirements = useMemo(
    () => [
      { label: '8+ chars', met: registerForm.password.length >= 8 },
      { label: 'uppercase', met: /[A-Z]/.test(registerForm.password) },
      { label: 'lowercase', met: /[a-z]/.test(registerForm.password) },
      { label: 'number', met: /[0-9]/.test(registerForm.password) },
      { label: 'special', met: /[^A-Za-z0-9]/.test(registerForm.password) }
    ],
    [registerForm.password]
  )

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  const handleLeadSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    clearMessages()
    setIsLoading(true)

    try {
      const data = await submitLeadCapture({
        email: leadEmail,
        source: 'auth-modal',
        intent: 'both'
      })
      setLeadEmail('')
      setSuccess(data.message)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Email capture failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    clearMessages()
    setIsLoading(true)

    try {
      const validatedData = loginSchema.parse(loginForm)

      const response = await fetch(`${config.api.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validatedData)
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      if (data.token) {
        localStorage.setItem('token', data.token)
      }

      if (!data.user) {
        throw new Error('No user data received')
      }

      onLogin(data.user)
      setSuccess('Login successful.')
      setTimeout(onClose, 900)
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message || 'Invalid credentials.')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    clearMessages()
    setIsLoading(true)

    try {
      const validatedData = registerSchema.parse(registerForm)

      const response = await fetch(`${config.api.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: validatedData.email,
          password: validatedData.password,
          mailingListOptIn: registerForm.mailingListOptIn
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      if (data.token) {
        localStorage.setItem('token', data.token)
      }

      if (!data.user) {
        throw new Error('No user data received')
      }

      onLogin(data.user)

      if (onShowProfileSetup) {
        onClose()
        onShowProfileSetup(data.user)
      } else {
        setSuccess('Registration successful.')
        setTimeout(onClose, 1200)
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message || 'Invalid registration data.')
      } else if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Network error. Please check your connection and try again.')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Overlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <Modal>
        <TopRow>
          <Badge $tone="kind">Auth Gate</Badge>
          <CloseButton type="button" onClick={onClose} aria-label="Close login modal">
            ×
          </CloseButton>
        </TopRow>

        <SectionHeaderAscii
          text={!authAvailable ? 'GET ACCESS UPDATES' : activeTab === 'login' ? 'LOGIN ACCESS' : 'REGISTER ACCESS'}
          size="card"
          level={2}
        />
        <SectionLead>
          {!authAvailable
            ? 'Auth is temporarily offline. Leave your email and we will send launch access and release updates as soon as login is restored.'
            : activeTab === 'login'
            ? 'Sign in to save favorites, sync preferences, and unlock profile settings.'
            : 'Create an account for marketplace personalization and install workflow tracking.'}
        </SectionLead>

        {authAvailable && (
          <TabRow>
            <FilterPill
              type="button"
              $active={activeTab === 'login'}
              onClick={() => {
                setActiveTab('login')
                clearMessages()
              }}
            >
              Login
            </FilterPill>
            <FilterPill
              type="button"
              $active={activeTab === 'register'}
              onClick={() => {
                setActiveTab('register')
                clearMessages()
              }}
            >
              Register
            </FilterPill>
          </TabRow>
        )}

        <AnimatePresence mode="wait">
          {!authAvailable ? (
            <motion.div
              key="lead-capture"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.16 }}
            >
              <Form onSubmit={handleLeadSubmit}>
                <Field>
                  Email
                  <Input
                    id="lead-email"
                    type="email"
                    placeholder="you@domain.com"
                    value={leadEmail}
                    onChange={(event) => setLeadEmail(event.target.value)}
                    required
                  />
                </Field>

                <FinePrint>
                  Existing accounts are paused until auth is restored. This email form keeps launch access and release updates moving.
                </FinePrint>

                <ActionRow>
                  <NeonButton type="submit" whileTap={{ scale: 0.98 }}>
                    {isLoading ? <Spinner aria-hidden /> : 'Get Access Updates'}
                  </NeonButton>
                </ActionRow>
              </Form>
            </motion.div>
          ) : activeTab === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.16 }}
            >
              <Form onSubmit={handleLoginSubmit}>
                <Field>
                  Email
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@domain.com"
                    value={loginForm.email}
                    onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                    required
                  />
                </Field>

                <Field>
                  Password
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                    required
                  />
                </Field>

                <ActionRow>
                  <NeonButton type="submit" whileTap={{ scale: 0.98 }}>
                    {isLoading ? <Spinner aria-hidden /> : 'Login'}
                  </NeonButton>
                </ActionRow>
              </Form>
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.16 }}
            >
              <Form onSubmit={handleRegisterSubmit}>
                <Field>
                  Email
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="you@domain.com"
                    value={registerForm.email}
                    onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                    required
                  />
                </Field>

                <Field>
                  Password
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Create a strong password"
                    value={registerForm.password}
                    onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                    required
                  />
                </Field>

                {registerForm.password.length > 0 && (
                  <StrengthWrap>
                    <StrengthMeter $strength={passwordStrength} />
                    <Requirements>
                      {passwordRequirements.map((item) => (
                        <TagChip key={item.label} style={{ opacity: item.met ? 1 : 0.55 }}>
                          {item.met ? 'ok' : 'req'} {item.label}
                        </TagChip>
                      ))}
                    </Requirements>
                  </StrengthWrap>
                )}

                <Field>
                  Confirm Password
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="Confirm password"
                    value={registerForm.confirmPassword}
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        confirmPassword: event.target.value
                      })
                    }
                    required
                  />
                </Field>

                <FinePrint>
                  <input
                    type="checkbox"
                    checked={registerForm.mailingListOptIn}
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        mailingListOptIn: event.target.checked
                      })
                    }
                  />
                  Receive occasional marketplace updates and release alerts.
                </FinePrint>

                <ActionRow>
                  <NeonButton type="submit" whileTap={{ scale: 0.98 }}>
                    {isLoading ? <Spinner aria-hidden /> : 'Create Account'}
                  </NeonButton>
                </ActionRow>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <Msg $kind="error">{error}</Msg>}
        {success && <Msg $kind="success">{success}</Msg>}
      </Modal>
    </Overlay>
  )
}

export { LoginModal }
