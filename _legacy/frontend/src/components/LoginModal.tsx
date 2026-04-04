import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { z } from 'zod'
import { config } from '../config'

interface LoginModalProps {
  onClose: () => void
  onLogin: (user: any) => void
  onShowProfileSetup?: (user: any) => void
}

// Validation schemas (matching backend)
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

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
  max-width: 400px;
  width: 100%;
  position: relative;
  backdrop-filter: blur(10px);
`

const CloseButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 1.5rem;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.background.secondary};
  }
`

const TabContainer = styled.div`
  display: flex;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.secondary};
`

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  background: none;
  border: none;
  color: ${({ active, theme }) => 
    active ? theme.colors.text.primary : theme.colors.text.muted
  };
  font-weight: ${({ active }) => active ? '600' : 'normal'};
  cursor: pointer;
  border-bottom: 2px solid ${({ active, theme }) => 
    active ? theme.colors.interactive.primary : 'transparent'
  };
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
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

const PasswordStrengthContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xs};
`

const PasswordStrengthBar = styled.div<{ strength: number }>`
  height: 4px;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: 2px;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${({ strength }) => strength}%;
    background: ${({ strength, theme }) => 
      strength < 25 ? theme.colors.status.error :
      strength < 50 ? '#ff9800' :
      strength < 75 ? '#ffeb3b' :
      theme.colors.status.success
    };
    transition: all 0.3s ease;
  }
`

const PasswordRequirements = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.muted};
`

const Requirement = styled.div<{ met: boolean }>`
  color: ${({ met, theme }) => met ? theme.colors.status.success : theme.colors.text.muted};
  &::before {
    content: ${({ met }) => met ? '"✓ "' : '"○ "'};
  }
`

const SubmitButton = styled.button`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.interactive.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.fonts.sans};
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};

  &:hover {
    background: ${({ theme }) => theme.colors.interactive.primaryHover};
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
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.status.error}33;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`

const SuccessMessage = styled.div`
  color: ${({ theme }) => theme.colors.status.success};
  font-size: 0.85rem;
  margin-top: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.status.success}33;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
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

const SmallCheckboxGroup = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`

const SmallCheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  
  input[type="checkbox"] {
    margin-right: ${({ theme }) => theme.spacing.xs};
    margin-top: 1px;
    cursor: pointer;
    transform: scale(0.8);
    
    &:checked {
      accent-color: ${({ theme }) => theme.colors.interactive.primary};
    }
  }
`

const SmallFinePrint = styled.div`
  margin-top: 2px;
  font-size: 0.65rem;
  color: ${({ theme }) => theme.colors.text.muted};
  line-height: 1.3;
  
  a {
    color: ${({ theme }) => theme.colors.interactive.primary};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin, onShowProfileSetup }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })

  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    mailingListOptIn: true  // Default to checked
  })

  // Password strength calculation
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[a-z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 12.5
    if (/[^A-Za-z0-9]/.test(password)) strength += 12.5
    return Math.min(strength, 100)
  }

  const passwordRequirements = {
    length: registerForm.password.length >= 8,
    uppercase: /[A-Z]/.test(registerForm.password),
    lowercase: /[a-z]/.test(registerForm.password),
    number: /[0-9]/.test(registerForm.password),
    special: /[^A-Za-z0-9]/.test(registerForm.password)
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      // Validate form
      const validatedData = loginSchema.parse(loginForm)

      // Call API
      const response = await fetch(`${config.api.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validatedData)
      })

      const data = await response.json()
      console.log('Login response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store token and user data
      if (data.token) {
        localStorage.setItem('token', data.token)
      } else {
        console.warn('No token received in login response')
      }
      
      if (data.user) {
        onLogin(data.user)
        setSuccess('Login successful!')
      } else {
        throw new Error('No user data received')
      }
      
      // Close modal after a brief delay
      setTimeout(() => {
        onClose()
      }, 1000)

    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      // Validate form
      const validatedData = registerSchema.parse(registerForm)

      // Call API without username
      console.log('Registering with URL:', `${config.api.baseUrl}/auth/register`)
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

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Store token and user data
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      onLogin(data.user)
      
      // Show profile setup modal for new users
      if (onShowProfileSetup) {
        onClose()  // Close login modal immediately
        onShowProfileSetup(data.user)  // Show profile setup
      } else {
        setSuccess('Registration successful!')
        // Close modal after a brief delay
        setTimeout(() => {
          onClose()
        }, 2000)
      }

    } catch (err) {
      console.error('Registration error:', err)
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message)
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
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <Modal
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <CloseButton onClick={onClose}>×</CloseButton>

        <TabContainer>
          <Tab
            active={activeTab === 'login'}
            onClick={() => {
              setActiveTab('login')
              setError(null)
              setSuccess(null)
            }}
          >
            Login
          </Tab>
          <Tab
            active={activeTab === 'register'}
            onClick={() => {
              setActiveTab('register')
              setError(null)
              setSuccess(null)
            }}
          >
            Register
          </Tab>
        </TabContainer>

        <AnimatePresence mode="wait">
          {activeTab === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <Form onSubmit={handleLoginSubmit}>
                <FormGroup>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </FormGroup>

                <SubmitButton type="submit" disabled={isLoading}>
                  {isLoading ? <LoadingSpinner /> : 'Login'}
                </SubmitButton>
              </Form>
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Form onSubmit={handleRegisterSubmit}>
                <FormGroup>
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="your@email.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Create a strong password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                  />
                  {registerForm.password && (
                    <PasswordStrengthContainer>
                      <PasswordStrengthBar strength={calculatePasswordStrength(registerForm.password)} />
                      <PasswordRequirements>
                        <Requirement met={passwordRequirements.length}>
                          At least 8 characters
                        </Requirement>
                        <Requirement met={passwordRequirements.uppercase}>
                          One uppercase letter
                        </Requirement>
                        <Requirement met={passwordRequirements.lowercase}>
                          One lowercase letter
                        </Requirement>
                        <Requirement met={passwordRequirements.number}>
                          One number
                        </Requirement>
                        <Requirement met={passwordRequirements.special}>
                          One special character (!@#$%^&*)
                        </Requirement>
                      </PasswordRequirements>
                    </PasswordStrengthContainer>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="register-confirm-password">Confirm Password</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    required
                  />
                </FormGroup>

                <SubmitButton type="submit" disabled={isLoading}>
                  {isLoading ? <LoadingSpinner /> : 'Register'}
                </SubmitButton>

                <SmallCheckboxGroup>
                  <SmallCheckboxLabel>
                    <input
                      type="checkbox"
                      checked={registerForm.mailingListOptIn}
                      onChange={(e) => setRegisterForm({ ...registerForm, mailingListOptIn: e.target.checked })}
                    />
                    <div>
                      <span>Join our mailing list</span>
                      <SmallFinePrint>
                        We'll send occasional updates about new features. 
                        No spam, unsubscribe anytime.
                        {' '}<a href="/privacy" target="_blank">Privacy</a>
                      </SmallFinePrint>
                    </div>
                  </SmallCheckboxLabel>
                </SmallCheckboxGroup>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
      </Modal>
    </Overlay>
  )
}

export { LoginModal }