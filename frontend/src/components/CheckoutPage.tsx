/**
 * cldcde.cc Checkout Page
 * Tactile UI design with green accent (#00ff00)
 * GSAP animations + Three.js geometric background
 */

import { useEffect, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import gsap from 'gsap'
import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS - Tactile UI with cldcde green accent
// ═══════════════════════════════════════════════════════════════

const colors = {
  bg: '#0a0a0a',
  bgElevated: '#141414',
  bgCard: '#1a1a1a',
  fg: '#ffffff',
  fgMuted: '#888888',
  accent: '#00ff00',
  accentDim: '#00cc00',
  accentGlow: 'rgba(0, 255, 0, 0.15)',
  border: '#2a2a2a',
  borderHover: '#3a3a3a',
  success: '#00ff88',
  warning: '#ffaa00',
}

const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
}

const radii = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
}

// ═══════════════════════════════════════════════════════════════
// STYLED COMPONENTS - Tactile UI
// ═══════════════════════════════════════════════════════════════

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`

const Container = styled.div`
  min-height: 100vh;
  background: ${colors.bg};
  color: ${colors.fg};
  position: relative;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`

const CanvasContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.4;
`

const Content = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: ${spacing.xxl} ${spacing.lg};

  @media (max-width: 768px) {
    padding: ${spacing.lg} ${spacing.md};
  }
`

const Header = styled.header`
  text-align: center;
  margin-bottom: ${spacing.xxl};
`

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: ${spacing.md};

  span {
    color: ${colors.accent};
  }
`

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${spacing.sm};
  background: ${colors.accentGlow};
  border: 1px solid ${colors.accent}33;
  padding: ${spacing.sm} ${spacing.md};
  border-radius: ${radii.full};
  font-size: 0.875rem;
  color: ${colors.accent};
  margin-bottom: ${spacing.lg};
`

const Title = styled.h1`
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: ${spacing.md};

  .highlight {
    color: ${colors.accent};
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: ${colors.accent};
      border-radius: 2px;
      opacity: 0.3;
    }
  }
`

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: ${colors.fgMuted};
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`

const TimerSection = styled.div`
  text-align: center;
  margin: ${spacing.xl} 0;
`

const TimerLabel = styled.p`
  font-size: 0.875rem;
  color: ${colors.fgMuted};
  margin-bottom: ${spacing.sm};
`

const TimerDisplay = styled.div`
  display: inline-flex;
  gap: ${spacing.md};
  background: ${colors.bgElevated};
  padding: ${spacing.md} ${spacing.xl};
  border-radius: ${radii.lg};
  border: 1px solid ${colors.border};
`

const TimeUnit = styled.div`
  text-align: center;

  .value {
    font-size: 2rem;
    font-weight: 700;
    color: ${colors.accent};
    font-variant-numeric: tabular-nums;
  }

  .label {
    font-size: 0.75rem;
    color: ${colors.fgMuted};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`

const SocialProof = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${spacing.xl};
  margin: ${spacing.xl} 0;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: ${spacing.lg};
  }
`

const ProofItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  color: ${colors.fgMuted};
  font-size: 0.875rem;

  svg {
    color: ${colors.accent};
  }
`

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${spacing.lg};
  margin-bottom: ${spacing.xxl};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
`

interface CardProps {
  $featured?: boolean
  $popular?: boolean
}

const PricingCard = styled.div<CardProps>`
  position: relative;
  background: ${colors.bgCard};
  border-radius: ${radii.xl};
  padding: ${spacing.xl};
  border: 1px solid ${({ $featured }) => $featured ? colors.accent : colors.border};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  ${({ $featured }) => $featured && `
    transform: scale(1.02);
    box-shadow:
      0 0 0 1px ${colors.accent}33,
      0 20px 40px -20px ${colors.accentGlow},
      0 40px 80px -40px ${colors.accent}22;
  `}

  &:hover {
    border-color: ${({ $featured }) => $featured ? colors.accent : colors.borderHover};
    transform: ${({ $featured }) => $featured ? 'scale(1.04)' : 'translateY(-4px)'};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${({ $featured }) => $featured
      ? `linear-gradient(90deg, ${colors.accent}, ${colors.accentDim})`
      : 'transparent'};
  }
`

const PopularBadge = styled.div`
  position: absolute;
  top: ${spacing.md};
  right: ${spacing.md};
  background: ${colors.accent};
  color: ${colors.bg};
  font-size: 0.75rem;
  font-weight: 600;
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${radii.full};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const CardHeader = styled.div`
  margin-bottom: ${spacing.lg};
`

const PlanName = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: ${spacing.sm};
`

const PlanPrice = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${spacing.xs};

  .currency {
    font-size: 1.5rem;
    color: ${colors.fgMuted};
  }

  .amount {
    font-size: 3rem;
    font-weight: 800;
    color: ${colors.accent};
  }

  .period {
    font-size: 1rem;
    color: ${colors.fgMuted};
  }
`

const PlanDescription = styled.p`
  color: ${colors.fgMuted};
  font-size: 0.875rem;
  margin-top: ${spacing.sm};
`

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: ${spacing.lg} 0;
`

const FeatureItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: ${spacing.sm};
  padding: ${spacing.sm} 0;
  color: ${colors.fgMuted};
  font-size: 0.875rem;

  svg {
    flex-shrink: 0;
    color: ${colors.accent};
    margin-top: 2px;
  }
`

const CTAButton = styled.button<{ $featured?: boolean }>`
  width: 100%;
  padding: ${spacing.md} ${spacing.lg};
  border-radius: ${radii.md};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  position: relative;
  overflow: hidden;

  ${({ $featured }) => $featured ? `
    background: ${colors.accent};
    color: ${colors.bg};

    &:hover {
      background: ${colors.accentDim};
      transform: translateY(-2px);
      box-shadow: 0 10px 20px -10px ${colors.accentGlow};
    }
  ` : `
    background: transparent;
    color: ${colors.fg};
    border: 1px solid ${colors.border};

    &:hover {
      border-color: ${colors.accent};
      color: ${colors.accent};
    }
  `}

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const Guarantee = styled.div`
  text-align: center;
  padding: ${spacing.lg};
  background: ${colors.bgElevated};
  border-radius: ${radii.lg};
  border: 1px solid ${colors.border};
  margin-bottom: ${spacing.xl};

  p {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${spacing.sm};
    color: ${colors.fgMuted};
    font-size: 0.875rem;

    svg {
      color: ${colors.accent};
    }
  }
`

const Testimonials = styled.div`
  margin-top: ${spacing.xxl};
`

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: ${spacing.xl};
`

const TestimonialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${spacing.lg};
`

const TestimonialCard = styled.div`
  background: ${colors.bgCard};
  border-radius: ${radii.lg};
  padding: ${spacing.lg};
  border: 1px solid ${colors.border};

  p {
    color: ${colors.fg};
    font-size: 0.9375rem;
    line-height: 1.6;
    margin-bottom: ${spacing.md};
  }

  cite {
    display: flex;
    align-items: center;
    gap: ${spacing.sm};
    font-style: normal;
    color: ${colors.fgMuted};
    font-size: 0.875rem;

    strong {
      color: ${colors.fg};
    }
  }
`

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${colors.accentGlow};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.accent};
  font-weight: 600;
`

const Footer = styled.footer`
  text-align: center;
  padding: ${spacing.xl} 0;
  color: ${colors.fgMuted};
  font-size: 0.875rem;

  a {
    color: ${colors.accent};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`

const LoadingOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 3px solid ${colors.border};
  border-top-color: ${colors.accent};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

// ═══════════════════════════════════════════════════════════════
// THREE.JS BACKGROUND - Geometric mesh grid
// ═══════════════════════════════════════════════════════════════

function GeometricBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Create grid mesh
    const gridGeometry = new THREE.PlaneGeometry(30, 30, 30, 30)
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    })
    const grid = new THREE.Mesh(gridGeometry, gridMaterial)
    grid.rotation.x = -Math.PI / 3
    grid.position.z = -5
    scene.add(grid)

    // Add subtle animated lines
    const linesMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.1
    })

    const linesGroup = new THREE.Group()
    for (let i = 0; i < 5; i++) {
      const points = []
      for (let j = -10; j <= 10; j += 0.5) {
        points.push(new THREE.Vector3(j, (i - 2) * 2, 0))
      }
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.Line(lineGeometry, linesMaterial)
      line.position.z = -3
      linesGroup.add(line)
    }
    scene.add(linesGroup)

    camera.position.z = 8

    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      grid.rotation.z += 0.001
      linesGroup.children.forEach((line, i) => {
        line.position.y = Math.sin(Date.now() * 0.001 + i * 0.5) * 0.3
      })

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      renderer.dispose()
      containerRef.current?.removeChild(renderer.domElement)
    }
  }, [])

  return <CanvasContainer ref={containerRef} />
}

// ═══════════════════════════════════════════════════════════════
// PRICING DATA
// ═══════════════════════════════════════════════════════════════

const plans = [
  {
    id: 'starter',
    name: 'Starter Pack',
    price: 29,
    description: 'Essential code quality tools for individual developers',
    features: [
      'Real-time anti-pattern detection',
      'Documentation sync monitoring',
      'Session debt reports',
      'Community support',
      '3 projects',
      '1 team member'
    ],
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    price: 99,
    description: 'Complete quality assurance suite for professional teams',
    features: [
      'Everything in Starter',
      'Multi-agent adversarial code review',
      'Automated CI/CD integration',
      'Visual regression testing',
      'Quality metrics dashboard',
      'Priority support',
      '10 projects',
      '5 team members'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    price: 299,
    description: 'Full platform access for scaling organizations',
    features: [
      'Everything in Pro',
      'Mutation testing',
      'Viral content automation',
      'YouTube creator tools',
      'Cloud agent deployment',
      'Custom plugin development',
      'Dedicated success manager',
      'SLA guarantee',
      'Unlimited projects',
      'Unlimited team members'
    ],
    popular: false
  }
]

const testimonials = [
  {
    quote: "Debt Sentinel caught architectural issues I would have missed. Saved us weeks of refactoring.",
    author: "Sarah Chen",
    role: "CTO at Scale",
    initial: "SC"
  },
  {
    quote: "The Red Team Tribunal is like having a panel of senior engineers reviewing every PR.",
    author: "Marcus Johnson",
    role: "Staff Engineer at Fintech",
    initial: "MJ"
  },
  {
    quote: "Compound Engineering changed how we ship. Every commit is now a polished feature.",
    author: "Alex Rivera",
    role: "Founder at DevTools",
    initial: "AR"
  }
]

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 })
  const [userCount] = useState(2847)

  const titleRef = useRef<HTMLHeadingElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return { hours: 23, minutes: 59, seconds: 59 }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // GSAP entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power4.out'
      })

      gsap.from('.pricing-card', {
        y: 80,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        delay: 0.3
      })

      gsap.from('.social-proof', {
        scale: 0.9,
        opacity: 0,
        duration: 0.6,
        ease: 'back.out(1.7)',
        delay: 0.6
      })

      gsap.from('.testimonial-card', {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.8
      })
    })

    return () => ctx.revert()
  }, [])

  const handleCheckout = async (packId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId })
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setLoading(false)
    }
  }

  return (
    <Container>
      <GeometricBackground />

      <Content>
        <Header>
          <Logo>
            CLDCDE<span>.CC</span>
          </Logo>

          <Badge ref={titleRef as any}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Limited Time: 40% off annual plans
          </Badge>

          <Title>
            Supercharge Your <span className="highlight">Claude Code</span>
            <br />
            Development Workflow
          </Title>

          <Subtitle>
            Enterprise-grade code quality tools that integrate seamlessly with Claude Code.
            Ship faster with confidence.
          </Subtitle>
        </Header>

        <TimerSection className="social-proof">
          <TimerLabel>Offer expires in</TimerLabel>
          <TimerDisplay>
            <TimeUnit>
              <div className="value">{String(timeLeft.hours).padStart(2, '0')}</div>
              <div className="label">Hours</div>
            </TimeUnit>
            <TimeUnit>
              <div className="value">{String(timeLeft.minutes).padStart(2, '0')}</div>
              <div className="label">Minutes</div>
            </TimeUnit>
            <TimeUnit>
              <div className="value">{String(timeLeft.seconds).padStart(2, '0')}</div>
              <div className="label">Seconds</div>
            </TimeUnit>
          </TimerDisplay>
        </TimerSection>

        <SocialProof className="social-proof">
          <ProofItem>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <strong>{userCount.toLocaleString()}</strong> developers
          </ProofItem>
          <ProofItem>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <strong>4.9/5</strong> rating
          </ProofItem>
          <ProofItem>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <strong>10M+</strong> code analyses
          </ProofItem>
        </SocialProof>

        <PricingGrid ref={cardsRef}>
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              className="pricing-card"
              $featured={plan.popular}
              $popular={plan.popular}
            >
              {plan.popular && <PopularBadge>Most Popular</PopularBadge>}

              <CardHeader>
                <PlanName>{plan.name}</PlanName>
                <PlanPrice>
                  <span className="currency">$</span>
                  <span className="amount">{plan.price}</span>
                  <span className="period">/mo</span>
                </PlanPrice>
                <PlanDescription>{plan.description}</PlanDescription>
              </CardHeader>

              <FeatureList>
                {plan.features.map((feature, i) => (
                  <FeatureItem key={i}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {feature}
                  </FeatureItem>
                ))}
              </FeatureList>

              <CTAButton
                $featured={plan.popular}
                onClick={() => handleCheckout(plan.id)}
                disabled={loading}
              >
                {loading ? 'Processing...' : plan.popular ? 'Get Started Now' : 'Choose Plan'}
              </CTAButton>
            </PricingCard>
          ))}
        </PricingGrid>

        <Guarantee>
          <p>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
            <strong>30-day money-back guarantee.</strong> No questions asked. Cancel anytime.
          </p>
        </Guarantee>

        <Testimonials>
          <SectionTitle>Trusted by Developers</SectionTitle>
          <TestimonialGrid>
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} className="testimonial-card">
                <p>"{t.quote}"</p>
                <cite>
                  <Avatar>{t.initial}</Avatar>
                  <span><strong>{t.author}</strong>, {t.role}</span>
                </cite>
              </TestimonialCard>
            ))}
          </TestimonialGrid>
        </Testimonials>

        <Footer>
          <p>
            Questions? <a href="mailto:support@cldcde.cc">support@cldcde.cc</a>
          </p>
          <p style={{ marginTop: '8px' }}>
            Powered by <a href="https://stripe.com" target="_blank" rel="noopener">Stripe</a> •
            Secured by Cloudflare
          </p>
        </Footer>
      </Content>

      {loading && (
        <LoadingOverlay>
          <LoadingSpinner />
        </LoadingOverlay>
      )}
    </Container>
  )
}
