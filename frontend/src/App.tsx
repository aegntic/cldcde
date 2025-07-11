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
import { ThemeToggle } from './components/ThemeToggle'
import { TerminalHeader } from './components/TerminalHeader'

// Global styles with theme integration
const GlobalStyle = createGlobalStyle`
  ${({ theme }) => createGlobalStyles(theme)}
`

const AppContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  position: relative;
  overflow-x: hidden;
`

const ThemeTransitionOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ theme }) => theme.colors.background.primary};
  z-index: 9999;
  pointer-events: none;
`

const MainContent = styled(motion.main)`
  position: relative;
  z-index: 1;
`

const HeroSection = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  position: relative;
`

const ASCIIContainer = styled(motion.div)`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: clamp(0.4rem, 1.5vw, 0.8rem);
  line-height: 1;
  color: ${({ theme }) => theme.colors.terminal.blue};
  text-shadow: 0 0 10px currentColor;
  white-space: pre;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  filter: ${({ theme }) => 
    theme.name === 'Futuristic Monochrome' 
      ? 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))' 
      : 'none'
  };
  transition: all ${({ theme }) => theme.animations.duration.normal} ${({ theme }) => theme.animations.easing.default};

  @media (max-width: 768px) {
    font-size: clamp(0.25rem, 3vw, 0.5rem);
  }
`

const Title = styled(motion.h1)`
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: 700;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.terminal.blue},
    ${({ theme }) => theme.colors.terminal.cyan},
    ${({ theme }) => theme.colors.interactive.accent}
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
`

const Subtitle = styled(motion.p)`
  font-size: clamp(1rem, 2.5vw, 1.5rem);
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  max-width: 600px;
  line-height: 1.4;
`

const ActionButtons = styled(motion.div)`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const Button = styled(motion.button)<{ variant?: 'primary' | 'secondary' | 'accent' }>`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme, variant }) => {
    switch (variant) {
      case 'primary': return theme.colors.interactive.primary
      case 'accent': return theme.colors.interactive.accent
      default: return theme.colors.border.primary
    }
  }};
  background: ${({ theme, variant }) => {
    switch (variant) {
      case 'primary': return theme.colors.interactive.primary
      case 'accent': return theme.colors.interactive.accent
      default: return theme.colors.interactive.secondary
    }
  }};
  color: ${({ theme, variant }) => 
    variant === 'primary' || variant === 'accent' ? 'white' : theme.colors.text.primary
  };
  font-family: ${({ theme }) => theme.fonts.sans};
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
    background: ${({ theme, variant }) => {
      switch (variant) {
        case 'primary': return theme.colors.interactive.primaryHover
        case 'accent': return theme.colors.interactive.accentHover
        default: return theme.colors.interactive.secondaryHover
      }
    }};
  }

  &:active {
    transform: translateY(0);
  }
`

const StatusIndicator = styled(motion.div)`
  position: fixed;
  top: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background.card};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.9rem;
`

const StatusDot = styled.div<{ connected: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ connected, theme }) => 
    connected ? theme.colors.status.success : theme.colors.status.error
  };
  animation: ${({ connected }) => connected ? 'pulse 2s infinite' : 'none'};

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`

// ASCII Art for the hero section
const asciiArt = `
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║    ████████╗██╗     ██████╗  ██████╗██████╗ ███████╗             ║
║    ██╔═════╝██║     ██╔══██╗██╔════╝██╔══██╗██╔════╝             ║  
║    ██║     ██║     ██║  ██║██║     ██║  ██║█████╗               ║
║    ██║     ██║     ██║  ██║██║     ██║  ██║██╔══╝               ║
║    ╚██████╗███████╗██████╔╝╚██████╗██████╔╝███████╗             ║
║     ╚═════╝╚══════╝╚═════╝  ╚═════╝╚═════╝ ╚══════╝             ║
║                                                                  ║
║         🤖 Community Extensions for Claude Code 🚀               ║
║                                                                  ║
║    ┌─────────────────────────────────────────────────────────┐   ║
║    │  • MCP Servers & Custom Extensions                     │   ║
║    │  • Cross-Platform Installation (macOS/Linux/Windows)   │   ║
║    │  • Secure User Data Storage                            │   ║
║    │  • Community-Driven Development Tools                  │   ║
║    └─────────────────────────────────────────────────────────┘   ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`

function AppContent() {
  const { isTransitioning, currentTheme } = useTheme()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showExtensions, setShowExtensions] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [user, setUser] = useState(null)
  const [newUser, setNewUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('home')

  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/health')
        setIsConnected(response.ok)
      } catch {
        setIsConnected(false)
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const asciiVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1,
        ease: "easeOut"
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
    // Reset all pages first
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
      case '/':
      default:
        setCurrentPage('home')
        break
    }
  }

  return (
    <AppContainer>
      <GlobalStyle />
      
      {/* Theme transition overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <ThemeTransitionOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Status indicator */}
      <StatusIndicator
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <StatusDot connected={isConnected} />
        <span>{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
      </StatusIndicator>

      {/* Theme toggle */}
      <ThemeToggle />

      {/* Terminal header */}
      <TerminalHeader 
        user={user}
        onLoginClick={() => setShowLoginModal(true)}
        onNavigate={handleNavigate}
      />

      <MainContent
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Render different pages based on currentPage */}
        {currentPage === 'home' && (
          <HeroSection>
            {/* ASCII Art */}
            <ASCIIContainer
              variants={asciiVariants}
              initial="hidden"
              animate="visible"
            >
              {asciiArt}
            </ASCIIContainer>

            {/* Main title */}
            <Title variants={itemVariants}>
              CLDCDE.CC
            </Title>

            {/* Subtitle */}
            <Subtitle variants={itemVariants}>
              The unofficial community hub for Claude Code extensions, MCP servers, 
              and development tools. Upload, discover, and install extensions across 
              all platforms.
            </Subtitle>

            {/* Action buttons */}
            <ActionButtons variants={itemVariants}>
              <Button
                variant="primary"
                onClick={handleLogin}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {user ? 'Dashboard' : 'Login / Register'}
              </Button>
              
              <Button
                variant="accent"
                onClick={handleBrowseExtensions}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Browse Extensions
              </Button>
              
              <Button
                variant="secondary"
                onClick={() => handleNavigate('/news')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Latest News
              </Button>
            </ActionButtons>

            {/* Connection info */}
            <motion.div variants={itemVariants}>
              <p style={{ 
                fontFamily: currentTheme.fonts.mono, 
                fontSize: '0.9rem',
                color: currentTheme.colors.text.muted 
              }}>
                Runtime: Bun • Framework: Hono • Database: Supabase • Theme: {currentTheme.name}
              </p>
            </motion.div>
          </HeroSection>
        )}

        {/* Extensions page */}
        {currentPage === 'extensions' && showExtensions && (
          <ExtensionBrowser 
            onClose={() => handleNavigate('/')}
            user={user}
          />
        )}

        {/* MCP Servers page */}
        {currentPage === 'mcp' && <MCPBrowser />}

        {/* News page */}
        {currentPage === 'news' && <NewsPage />}

        {/* Docs page */}
        {currentPage === 'docs' && <DocsPage />}

        {/* Settings page */}
        {currentPage === 'settings' && <SettingsDocsPage />}
      </MainContent>

      {/* Login modal */}
      <AnimatePresence>
        {showLoginModal && (
          <LoginModal 
            onClose={() => setShowLoginModal(false)}
            onLogin={setUser}
            onShowProfileSetup={(user) => {
              setNewUser(user)
              setShowProfileSetup(true)
            }}
          />
        )}
      </AnimatePresence>

      {/* Profile setup modal */}
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
