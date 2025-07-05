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
  font-size: clamp(0.3rem, 1.2vw, 0.7rem);
  line-height: 1;
  color: ${({ theme }) => theme.colors.terminal.blue};
  text-shadow: 0 0 10px currentColor;
  white-space: pre;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  transition: all ${({ theme }) => theme.animations.duration.normal} ${({ theme }) => theme.animations.easing.default};
  position: relative;
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' 
      ? `
        background: linear-gradient(
          45deg,
          ${theme.colors.terminal.blue},
          ${theme.colors.terminal.cyan},
          ${theme.colors.terminal.purple}
        );
        background-size: 300% 300%;
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: hologram-shift 4s ease-in-out infinite;
        filter: drop-shadow(0 0 20px ${theme.colors.terminal.cyan});
        
        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            0deg,
            transparent 95%,
            ${theme.colors.terminal.cyan}33 100%
          );
          background-size: 100% 2px;
          animation: scan 0.15s linear infinite;
          pointer-events: none;
        }
        
        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(
            ellipse at center,
            transparent 60%,
            ${theme.colors.terminal.blue}11 100%
          );
          pointer-events: none;
        }
      ` 
      : theme.name === 'Futuristic Monochrome' 
      ? 'filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.5));' 
      : 'none'
  };

  @keyframes hologram-shift {
    0% {
      background-position: 0% 50%;
    }
    25% {
      background-position: 100% 50%;
    }
    50% {
      background-position: 50% 100%;
    }
    75% {
      background-position: 0% 50%;
    }
    100% {
      background-position: 50% 0%;
    }
  }

  @keyframes scan {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 0 2px;
    }
  }

  @media (max-width: 768px) {
    font-size: clamp(0.2rem, 2.5vw, 0.45rem);
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
  position: relative;
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' 
      ? `
        filter: drop-shadow(0 0 30px ${theme.colors.terminal.cyan});
        text-shadow: 0 0 20px ${theme.colors.terminal.blue};
        
        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            45deg,
            transparent 30%,
            ${theme.colors.terminal.cyan}22 50%,
            transparent 70%
          );
          background-size: 200% 200%;
          animation: shine 2s ease-in-out infinite;
          pointer-events: none;
        }
        
        &::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            ${theme.colors.terminal.cyan}88,
            transparent
          );
          animation: glow-line 3s ease-in-out infinite;
          pointer-events: none;
        }
      ` 
      : ''
  };

  @keyframes gradient-shift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  @keyframes shine {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  @keyframes glow-line {
    0%, 100% {
      opacity: 0;
      transform: scaleX(0);
    }
    50% {
      opacity: 1;
      transform: scaleX(1);
    }
  }
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
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' 
      ? `
        backdrop-filter: blur(10px);
        box-shadow: 0 0 20px rgba(51, 102, 255, 0.3);
        
        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: left 0.6s ease;
        }
        
        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            45deg,
            transparent 30%,
            ${theme.colors.terminal.cyan}11 50%,
            transparent 70%
          );
          background-size: 200% 200%;
          animation: button-glow 3s ease-in-out infinite;
          pointer-events: none;
        }
      ` 
      : ''
  };

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
    
    ${({ theme }) => 
      theme.name === 'Retro Futuristic Hologram' 
        ? `
          box-shadow: 0 0 30px rgba(51, 102, 255, 0.5);
          
          &::before {
            left: 100%;
          }
        ` 
        : ''
    };
  }

  &:active {
    transform: translateY(0);
  }

  @keyframes button-glow {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
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
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' 
      ? `
        background: rgba(15, 15, 32, 0.8);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(51, 102, 255, 0.3);
        box-shadow: 0 0 20px rgba(51, 102, 255, 0.2);
        
        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            ${theme.colors.terminal.cyan}88,
            transparent
          );
        }
      ` 
      : ''
  };
`

const StatusDot = styled.div<{ connected: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ connected, theme }) => 
    connected ? theme.colors.status.success : theme.colors.status.error
  };
  animation: ${({ connected, theme }) => 
    connected 
      ? theme.name === 'Retro Futuristic Hologram' 
        ? 'hologram-pulse 2s infinite' 
        : 'pulse 2s infinite'
      : 'none'
  };
  
  ${({ theme, connected }) => 
    theme.name === 'Retro Futuristic Hologram' && connected
      ? `
        box-shadow: 0 0 10px ${theme.colors.status.success};
        
        &::before {
          content: '';
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: transparent;
          border: 1px solid ${theme.colors.status.success}44;
          animation: hologram-ripple 2s infinite;
          margin: -2px;
        }
      `
      : ''
  };

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }

  @keyframes hologram-pulse {
    0% { 
      opacity: 1; 
      box-shadow: 0 0 5px currentColor;
    }
    50% { 
      opacity: 0.7; 
      box-shadow: 0 0 20px currentColor;
    }
    100% { 
      opacity: 1; 
      box-shadow: 0 0 5px currentColor;
    }
  }

  @keyframes hologram-ripple {
    0% {
      transform: scale(0.8);
      opacity: 1;
    }
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }
`

// Enhanced ASCII Art for CLDCDE+ with holographic effects
const asciiArt = `
╔════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                        ║
║    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ║
║    ░█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█░  ║
║    ░█  ██████╗██╗     ██████╗  ██████╗██████╗ ███████╗  ██╗        ██╗     ██╗ █░  ║
║    ░█ ██╔════╝██║     ██╔══██╗██╔════╝██╔══██╗██╔════╝  ██║        ██║     ██║ █░  ║
║    ░█ ██║     ██║     ██║  ██║██║     ██║  ██║█████╗  ██╗ ██║        ██║     ██║ █░  ║
║    ░█ ██║     ██║     ██║  ██║██║     ██║  ██║██╔══╝  ╚██╗██║        ██║     ╚██╗█░  ║
║    ░█ ╚██████╗███████╗██████╔╝╚██████╗██████╔╝███████╗  ╚████║        ██║      ╚██░  ║
║    ░█  ╚═════╝╚══════╝╚═════╝  ╚═════╝╚═════╝ ╚══════╝   ╚═══╝        ╚═╝       ╚═░  ║
║    ░█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█░  ║
║    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ║
║                                                                                        ║
║           ████████████████████████████████████████████████████████████████████         ║
║           ██                                                                  ██         ║
║           ██    🌟 COMMUNITY EXTENSIONS FOR CLAUDE CODE 🚀                   ██         ║
║           ██                                                                  ██         ║
║           ██    ┌─────────────────────────────────────────────────────────┐  ██         ║
║           ██    │  • MCP Servers & Custom Extensions                     │  ██         ║
║           ██    │  • Cross-Platform Installation (macOS/Linux/Windows)   │  ██         ║
║           ██    │  • Secure User Data Storage                            │  ██         ║
║           ██    │  • Community-Driven Development Tools                  │  ██         ║
║           ██    │  • Real-time Analytics & Monitoring                    │  ██         ║
║           ██    │  • Retro Futuristic Holographic Interface              │  ██         ║
║           ██    └─────────────────────────────────────────────────────────┘  ██         ║
║           ██                                                                  ██         ║
║           ████████████████████████████████████████████████████████████████████         ║
║                                                                                        ║
║    ════════════════════════════════════════════════════════════════════════════════     ║
║    ║ SYSTEM STATUS: ONLINE │ THEME: HOLOGRAPHIC │ RUNTIME: BUN │ DB: SUPABASE ║     ║
║    ════════════════════════════════════════════════════════════════════════════════     ║
║                                                                                        ║
╚════════════════════════════════════════════════════════════════════════════════════════╝
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
