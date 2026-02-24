import React, { useState, useEffect } from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeProvider, useTheme, createGlobalStyles } from './hooks/useTheme'
import { LoginModal } from './components/LoginModal'
import { ProfileSetupModal } from './components/ProfileSetupModal'
import { ExtensionBrowser } from './components/ExtensionBrowser'
import { MCPBrowser } from './components/MCPBrowser'
import { NewsPage } from './components/NewsPage'
import { DocsPage } from './components/DocsPage'
import { SettingsDocsPage } from './components/SettingsDocsPage'
import { PacksPage } from './components/PacksPage'
import { ThemeToggle } from './components/ThemeToggle'
import { TerminalHeader } from './components/TerminalHeader'
import { config } from './config'

const GlobalStyle = createGlobalStyle`
  ${({ theme }) => createGlobalStyles(theme)}
`

const AppContainer = styled.div`
  min-height: 100vh;
  color: ${({ theme }) => theme.colors.text.primary};
  position: relative;
  overflow-x: hidden;
`

const AmbientBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;

  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    filter: blur(12px);
    opacity: 0.5;
    animation: drift 16s ease-in-out infinite;
  }

  &::before {
    width: 42vw;
    height: 42vw;
    min-width: 320px;
    min-height: 320px;
    top: -14vw;
    left: -8vw;
    background: radial-gradient(circle, ${({ theme }) => `${theme.colors.interactive.accent}45`} 0%, transparent 70%);
  }

  &::after {
    width: 36vw;
    height: 36vw;
    min-width: 260px;
    min-height: 260px;
    top: -10vw;
    right: -6vw;
    background: radial-gradient(circle, ${({ theme }) => `${theme.colors.interactive.primary}50`} 0%, transparent 68%);
    animation-delay: 3s;
  }

  @keyframes drift {
    0%,
    100% { transform: translate3d(0, 0, 0); }
    50% { transform: translate3d(0, 24px, 0); }
  }
`

const GridOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to right, ${({ theme }) => `${theme.colors.border.secondary}22`} 1px, transparent 1px),
    linear-gradient(to bottom, ${({ theme }) => `${theme.colors.border.secondary}22`} 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
`

const ThemeTransitionOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.background.primary};
  z-index: 9999;
  pointer-events: none;
`

const MainContent = styled(motion.main)`
  position: relative;
  z-index: 1;
`

const StatusPill = styled(motion.div)<{ status: 'checking' | 'online' | 'offline' }>`
  position: fixed;
  bottom: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  z-index: 900;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 0.5rem 0.85rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => `${theme.colors.background.card}dd`};
  backdrop-filter: blur(10px);
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.78rem;
  letter-spacing: 0.04em;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ status, theme }) => {
      if (status === 'online') return theme.colors.status.success
      if (status === 'offline') return theme.colors.status.error
      return theme.colors.status.info
    }};
    box-shadow: ${({ status, theme }) => {
      if (status === 'online') return `0 0 12px ${theme.colors.status.success}`
      if (status === 'offline') return `0 0 10px ${theme.colors.status.error}`
      return `0 0 10px ${theme.colors.status.info}`
    }};
  }
`

const HomeShell = styled.section`
  max-width: 1280px;
  margin: 0 auto;
  padding: clamp(6rem, 9vw, 8rem) clamp(1rem, 3vw, 2.5rem) 3rem;
  display: grid;
  gap: 1.6rem;
`

const HeroGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 1.2rem;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`

const HeroCard = styled(motion.div)`
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: linear-gradient(
    160deg,
    ${({ theme }) => `${theme.colors.background.card}f2`} 0%,
    ${({ theme }) => `${theme.colors.background.secondary}d9`} 100%
  );
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: clamp(1.1rem, 2.8vw, 2rem);
  backdrop-filter: blur(8px);
`

const Eyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.7rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  background: ${({ theme }) => `${theme.colors.background.secondary}c7`};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.text.secondary};
`

const HeroTitle = styled(motion.h1)`
  margin-top: 1rem;
  font-family: ${({ theme }) => theme.fonts.sans};
  font-weight: 700;
  line-height: 1.06;
  letter-spacing: -0.03em;
  font-size: clamp(2.1rem, 6vw, 4.8rem);
  color: ${({ theme }) => theme.colors.text.primary};
`

const GradientWord = styled.span`
  display: inline-block;
  background: linear-gradient(
    120deg,
    ${({ theme }) => theme.colors.interactive.primary} 0%,
    ${({ theme }) => theme.colors.interactive.accent} 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
`

const HeroLead = styled(motion.p)`
  margin-top: 1rem;
  max-width: 62ch;
  font-size: clamp(1rem, 1.45vw, 1.2rem);
  line-height: 1.65;
  color: ${({ theme }) => theme.colors.text.secondary};
`

const ButtonRow = styled(motion.div)`
  margin-top: 1.35rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
`

const ActionButton = styled(motion.button)<{ variant?: 'primary' | 'secondary' | 'ghost' }>`
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme, variant }) =>
    variant === 'primary'
      ? theme.colors.interactive.primary
      : variant === 'secondary'
      ? theme.colors.interactive.accent
      : theme.colors.border.primary};
  background: ${({ theme, variant }) =>
    variant === 'primary'
      ? theme.colors.interactive.primary
      : variant === 'secondary'
      ? theme.colors.interactive.accent
      : `${theme.colors.background.secondary}d9`};
  color: ${({ theme, variant }) =>
    variant === 'ghost' ? theme.colors.text.primary : theme.colors.text.inverse};
  padding: 0.72rem 1rem;
  font-family: ${({ theme }) => theme.fonts.sans};
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
    filter: saturate(1.05);
  }
`

const HeroMeta = styled(motion.div)`
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

const MetaChip = styled.span`
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  padding: 0.3rem 0.65rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
`

const SectionLabel = styled.h2`
  margin: 0 0 0.85rem;
  font-size: 1rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.text.secondary};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

const FlowLane = styled.div`
  display: grid;
  gap: 0.6rem;
`

const FlowStep = styled(motion.div)`
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 0.8rem;
  background: ${({ theme }) => `${theme.colors.background.secondary}c7`};
`

const StepTitle = styled.h3`
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.text.primary};
`

const StepText = styled.p`
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.text.secondary};
`

const PipelineRow = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`

const GateList = styled.div`
  display: grid;
  gap: 0.55rem;
`

const GateItem = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  background: ${({ theme }) => `${theme.colors.background.secondary}bf`};
`

const GateTitle = styled.span`
  font-size: 0.92rem;
  color: ${({ theme }) => theme.colors.text.primary};
`

const GateTag = styled.span<{ tone: 'ok' | 'warn' | 'neutral' }>`
  border-radius: ${({ theme }) => theme.borderRadius.full};
  padding: 0.25rem 0.55rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: ${({ theme }) => theme.fonts.mono};
  border: 1px solid ${({ theme, tone }) => {
    if (tone === 'ok') return `${theme.colors.status.success}66`
    if (tone === 'warn') return `${theme.colors.status.warning}66`
    return theme.colors.border.secondary
  }};
  color: ${({ theme, tone }) => {
    if (tone === 'ok') return theme.colors.status.success
    if (tone === 'warn') return theme.colors.status.warning
    return theme.colors.text.tertiary
  }};
`

const ModuleGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.9rem;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`

const ModuleCard = styled(motion.button)`
  text-align: left;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: linear-gradient(
    150deg,
    ${({ theme }) => `${theme.colors.background.card}ef`} 0%,
    ${({ theme }) => `${theme.colors.background.secondary}d4`} 100%
  );
  padding: 0.95rem;
  cursor: pointer;
  color: inherit;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
    border-color: ${({ theme }) => theme.colors.border.hover};
  }
`

const ModuleTitle = styled.h3`
  margin: 0 0 0.3rem;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
`

const ModuleText = styled.p`
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.text.secondary};
`

const FooterSignal = styled(motion.div)`
  border-top: 1px solid ${({ theme }) => theme.colors.border.secondary};
  padding-top: 0.9rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
`

const AffiliationChip = styled.span`
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  padding: 0.28rem 0.65rem;
  font-size: 0.7rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.text.tertiary};
`

function AppContent() {
  const { isTransitioning } = useTheme()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showExtensions, setShowExtensions] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [user, setUser] = useState<any>(null)
  const [newUser, setNewUser] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState('home')

  useEffect(() => {
    const apiOrigin = config.api.baseUrl.replace(/\/api\/?$/, '')

    const checkConnection = async () => {
      try {
        const response = await fetch(`${apiOrigin}/health`)
        setConnectionStatus(response.ok ? 'online' : 'offline')
      } catch {
        setConnectionStatus('offline')
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.12
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: 'easeOut'
      }
    }
  }

  const handleLogin = () => {
    setShowLoginModal(true)
  }

  const handleBrowseExtensions = () => {
    if (user) {
      setShowExtensions(true)
    } else {
      setShowLoginModal(true)
    }
  }

  const handleNavigate = (path: string) => {
    setShowExtensions(false)

    switch (path) {
      case '/extensions':
        setCurrentPage('extensions')
        setShowExtensions(true)
        break
      case '/mcp':
        setCurrentPage('mcp')
        break
      case '/docs':
        setCurrentPage('docs')
        break
      case '/settings':
        setCurrentPage('settings')
        break
      case '/news':
        setCurrentPage('news')
        break
      case '/packs':
        setCurrentPage('packs')
        break
      case '/':
      default:
        setCurrentPage('home')
        break
    }
  }

  return (
    <AppContainer>
      <GlobalStyle />
      <AmbientBackdrop />
      <GridOverlay />

      <AnimatePresence>
        {isTransitioning && (
          <ThemeTransitionOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        )}
      </AnimatePresence>

      <StatusPill
        status={connectionStatus}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        {connectionStatus === 'online'
          ? 'API ONLINE'
          : connectionStatus === 'offline'
          ? 'API OFFLINE'
          : 'API CHECKING'}
      </StatusPill>

      <ThemeToggle />

      <TerminalHeader
        user={user}
        onLoginClick={() => setShowLoginModal(true)}
        onNavigate={handleNavigate}
      />

      <MainContent variants={containerVariants} initial="hidden" animate="visible">
        {currentPage === 'home' && (
          <HomeShell>
            <HeroGrid variants={itemVariants}>
              <HeroCard>
                <Eyebrow>Google Labs Pipeline + Compound Engineering</Eyebrow>
                <HeroTitle>
                  Build in <GradientWord>Labs mode</GradientWord>.
                  <br />
                  Ship with <GradientWord>Compound discipline</GradientWord>.
                </HeroTitle>
                <HeroLead>
                  CLDCDE has been rebuilt around two production loops: creative generation through
                  <strong> Stitch → Whisk → Flow</strong>, and delivery hardening through
                  <strong> Safe Edit → Spec Sync → Adversarial Review</strong>.
                </HeroLead>

                <ButtonRow variants={itemVariants}>
                  <ActionButton
                    variant="primary"
                    onClick={() => handleNavigate('/packs')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Open Skill Packs
                  </ActionButton>
                  <ActionButton
                    variant="secondary"
                    onClick={handleBrowseExtensions}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Browse Extensions
                  </ActionButton>
                  <ActionButton
                    variant="ghost"
                    onClick={() => handleNavigate('/news')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    View Latest News
                  </ActionButton>
                  <ActionButton
                    variant="ghost"
                    onClick={handleLogin}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {user ? 'Open Dashboard' : 'Login / Register'}
                  </ActionButton>
                </ButtonRow>

                <HeroMeta variants={itemVariants}>
                  <MetaChip>Runtime: Bun + Hono</MetaChip>
                  <MetaChip>Surface: cldcde.cc</MetaChip>
                  <MetaChip>Distribution: aegntic/cldcde</MetaChip>
                </HeroMeta>
              </HeroCard>

              <HeroCard variants={itemVariants}>
                <SectionLabel>Google Labs Creative Chain</SectionLabel>
                <FlowLane>
                  {[
                    {
                      title: '1. Stitch',
                      text: 'Shape ideas into visual narrative frames and storyboard anchors.'
                    },
                    {
                      title: '2. Whisk',
                      text: 'Remix and multiply variants for style breadth and campaign depth.'
                    },
                    {
                      title: '3. Flow',
                      text: 'Animate selected frames into distribution-ready motion assets.'
                    },
                    {
                      title: '4. Publish',
                      text: 'Route final artifacts into reusable packs and launch prompts.'
                    }
                  ].map((step, index) => (
                    <FlowStep
                      key={step.title}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.22 + index * 0.09 }}
                    >
                      <StepTitle>{step.title}</StepTitle>
                      <StepText>{step.text}</StepText>
                    </FlowStep>
                  ))}
                </FlowLane>
              </HeroCard>
            </HeroGrid>

            <PipelineRow variants={itemVariants}>
              <HeroCard>
                <SectionLabel>Compound Engineering Quality Gates</SectionLabel>
                <GateList>
                  <GateItem>
                    <GateTitle>Debt Sentinel pre-edit scan</GateTitle>
                    <GateTag tone="ok">Block critical debt</GateTag>
                  </GateItem>
                  <GateItem>
                    <GateTitle>Spec Lock drift synchronization</GateTitle>
                    <GateTag tone="neutral">Auto-resolve where possible</GateTag>
                  </GateItem>
                  <GateItem>
                    <GateTitle>Red Team Tribunal adversarial verdict</GateTitle>
                    <GateTag tone="warn">Reject if consensus fails</GateTag>
                  </GateItem>
                </GateList>
              </HeroCard>

              <HeroCard>
                <SectionLabel>Launch Conversion Surface</SectionLabel>
                <StepText>
                  Free pack outputs are deliberately shareable. Every exported artifact carries install metadata
                  and branded entry points into AE.LTD subscription paths without degrading first-use experience.
                </StepText>
                <HeroMeta style={{ marginTop: '0.95rem' }}>
                  <MetaChip>Free tier: viral starter loops</MetaChip>
                  <MetaChip>Pro tier: full automation depth</MetaChip>
                  <MetaChip>X launch kit included</MetaChip>
                </HeroMeta>
              </HeroCard>
            </PipelineRow>

            <ModuleGrid variants={itemVariants}>
              {[
                {
                  title: 'Extension Browser',
                  text: 'Community plugins and execution tooling in one modal surface.',
                  path: '/extensions'
                },
                {
                  title: 'MCP Servers',
                  text: 'Explore server integrations tuned for automation and retrieval.',
                  path: '/mcp'
                },
                {
                  title: 'AE.LTD Packs',
                  text: 'Download self-contained skills, MCPs, prompts, and workflows.',
                  path: '/packs'
                },
                {
                  title: 'Documentation',
                  text: 'Operational references, setup commands, and ecosystem links.',
                  path: '/docs'
                }
              ].map((item) => (
                <ModuleCard
                  key={item.title}
                  onClick={() => handleNavigate(item.path)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ModuleTitle>{item.title}</ModuleTitle>
                  <ModuleText>{item.text}</ModuleText>
                </ModuleCard>
              ))}
            </ModuleGrid>

            <FooterSignal variants={itemVariants}>
              {['cldcde.cc', 'aegntic.ai', 'ae.ltd', 'clawreform.com', 'github.com/aegntic/cldcde'].map((item) => (
                <AffiliationChip key={item}>{item}</AffiliationChip>
              ))}
            </FooterSignal>
          </HomeShell>
        )}

        {currentPage === 'extensions' && showExtensions && (
          <ExtensionBrowser onClose={() => handleNavigate('/')} user={user} />
        )}

        {currentPage === 'mcp' && <MCPBrowser />}
        {currentPage === 'news' && <NewsPage />}
        {currentPage === 'docs' && <DocsPage />}
        {currentPage === 'packs' && <PacksPage />}
        {currentPage === 'settings' && <SettingsDocsPage />}
      </MainContent>

      <AnimatePresence>
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onLogin={setUser}
            onShowProfileSetup={(nextUser) => {
              setNewUser(nextUser)
              setShowProfileSetup(true)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfileSetup && newUser && (
          <ProfileSetupModal
            onClose={() => {
              setShowProfileSetup(false)
              setNewUser(null)
            }}
            onComplete={(profile) => {
              setUser({ ...newUser, profile })
              setShowProfileSetup(false)
              setNewUser(null)
            }}
            user={newUser}
          />
        )}
      </AnimatePresence>
    </AppContainer>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
