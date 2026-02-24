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
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => `${theme.colors.background.primary}d9`};
  backdrop-filter: blur(12px);
`

const HeaderContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0.85rem 1rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.9rem;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`

const Logo = styled(motion.a)`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text.primary};
`

const LogoMark = styled.span`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  background: linear-gradient(
    140deg,
    ${({ theme }) => theme.colors.interactive.primary} 0%,
    ${({ theme }) => theme.colors.interactive.accent} 100%
  );
  color: ${({ theme }) => theme.colors.text.inverse};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

const LogoStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`

const LogoText = styled.span`
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: 1rem;
  letter-spacing: 0.01em;
  font-weight: 700;
`

const Subline = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.67rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
  text-transform: uppercase;
  letter-spacing: 0.08em;
`

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
`

const NavLink = styled(motion.a)`
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  padding: 0.34rem 0.72rem;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    border-color: ${({ theme }) => theme.colors.border.hover};
    background: ${({ theme }) => `${theme.colors.background.secondary}b8`};
  }
`

const UserPanel = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.55rem;

  @media (max-width: 980px) {
    justify-content: flex-start;
  }
`

const UserAvatar = styled.div`
  width: 30px;
  height: 30px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => theme.colors.interactive.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.inverse};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem;
  font-weight: 700;
`

const Username = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`

const LoginButton = styled(motion.button)`
  border: 1px solid ${({ theme }) => theme.colors.interactive.primary};
  background: ${({ theme }) => theme.colors.interactive.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 0.45rem 0.8rem;
  font-family: ${({ theme }) => theme.fonts.sans};
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.interactive.primaryHover};
    transform: translateY(-1px);
  }
`

const TerminalHeader: React.FC<TerminalHeaderProps> = ({ user, onLoginClick, onNavigate }) => {
  const handleLogoClick = (event: React.MouseEvent) => {
    event.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (onNavigate) onNavigate('/')
  }

  const handleNavClick = (event: React.MouseEvent, path: string) => {
    event.preventDefault()
    if (onNavigate && path.startsWith('/')) {
      onNavigate(path)
      return
    }
    if (path.startsWith('http')) {
      window.open(path, '_blank')
    }
  }

  return (
    <Header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, delay: 0.08 }}
    >
      <HeaderContent>
        <Logo href="/" onClick={handleLogoClick} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <LogoMark>AE</LogoMark>
          <LogoStack>
            <LogoText>CLDCDE.CC</LogoText>
            <Subline>AE.LTD :: Google Labs x Compound Engineering</Subline>
          </LogoStack>
        </Logo>

        <Navigation>
          {[
            { label: 'Extensions', path: '/extensions' },
            { label: 'MCP', path: '/mcp' },
            { label: 'Packs', path: '/packs' },
            { label: 'Docs', path: '/docs' },
            { label: 'News', path: '/news' },
            { label: 'GitHub', path: 'https://github.com/aegntic/cldcde' }
          ].map((item) => (
            <NavLink
              key={item.label}
              href={item.path}
              onClick={(event) => handleNavClick(event, item.path)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              {item.label}
            </NavLink>
          ))}
        </Navigation>

        <UserPanel>
          {user ? (
            <>
              <Username>@{(user as any)?.email?.split('@')[0] || 'operator'}</Username>
              <UserAvatar>{(user as any)?.email?.charAt(0)?.toUpperCase() || 'U'}</UserAvatar>
            </>
          ) : (
            <LoginButton onClick={onLoginClick} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              Login
            </LoginButton>
          )}
        </UserPanel>
      </HeaderContent>
    </Header>
  )
}

export { TerminalHeader }
