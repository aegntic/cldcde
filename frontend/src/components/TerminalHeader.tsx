import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

interface TerminalHeaderProps {
  user?: {
    username: string
    id: string
    profile?: {
      avatar_url?: string
    }
  } | null
  onLoginClick?: () => void
  onNavigate?: (path: string) => void
}

const Header = styled(motion.header)`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: ${({ theme }) => theme.colors.background.primary}cc;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
`

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
`

const Logo = styled(motion.a)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: 700;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: none;
  cursor: pointer;
`

const LogoIcon = styled.span`
  font-size: 1.3rem;
  color: ${({ theme }) => theme.colors.terminal.blue};
`

const LogoText = styled.span`
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.terminal.blue},
    ${({ theme }) => theme.colors.terminal.cyan}
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 768px) {
    gap: ${({ theme }) => theme.spacing.md};
  }
`

const NavLink = styled(motion.a)`
  color: ${({ theme }) => theme.colors.text.secondary};
  text-decoration: none;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.9rem;
  font-weight: 500;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.background.secondary};
  }

  @media (max-width: 768px) {
    display: none;
  }
`

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => theme.colors.interactive.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: 600;
  font-size: 0.9rem;
`

const Username = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.9rem;

  @media (max-width: 480px) {
    display: none;
  }
`

const LoginButton = styled(motion.button)`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.interactive.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};

  &:hover {
    background: ${({ theme }) => theme.colors.interactive.primaryHover};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`

const StatusDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.status.success};
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.1);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
`

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1.2rem;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};

  @media (max-width: 768px) {
    display: block;
  }
`

const TerminalHeader: React.FC<TerminalHeaderProps> = ({ user, onLoginClick, onNavigate }) => {
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (onNavigate) onNavigate('/')
  }

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate(path)
    } else if (path.startsWith('http')) {
      window.open(path, '_blank')
    }
  }

  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase()
  }

  return (
    <Header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <HeaderContent>
        <Logo
          href="/"
          onClick={handleLogoClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogoIcon>⚡</LogoIcon>
          <LogoText>CLDCDE.CC</LogoText>
          <StatusDot />
        </Logo>

        <Navigation>
          <NavLink
            href="/extensions"
            onClick={(e) => handleNavClick(e, '/extensions')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Extensions
          </NavLink>
          <NavLink
            href="/mcp"
            onClick={(e) => handleNavClick(e, '/mcp')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            MCP Servers
          </NavLink>
          <NavLink
            href="/news"
            onClick={(e) => handleNavClick(e, '/news')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            News
          </NavLink>
          <NavLink
            href="/docs"
            onClick={(e) => handleNavClick(e, '/docs')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Docs
          </NavLink>
          <NavLink
            href="https://github.com/anthropics/claude-code"
            onClick={(e) => handleNavClick(e, 'https://github.com/anthropics/claude-code')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            GitHub
          </NavLink>

          {user ? (
            <UserInfo>
              <Username>@{user.email?.split('@')[0] || 'user'}</Username>
              <UserAvatar>
                {user.profile?.avatar_url || user.email?.charAt(0).toUpperCase() || 'U'}
              </UserAvatar>
            </UserInfo>
          ) : (
            <LoginButton
              onClick={onLoginClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Login
            </LoginButton>
          )}

          <MobileMenuButton>☰</MobileMenuButton>
        </Navigation>
      </HeaderContent>
    </Header>
  )
}

export { TerminalHeader }
