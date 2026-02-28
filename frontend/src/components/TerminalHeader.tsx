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
  currentPath?: string
  authAvailable?: boolean
}

const Header = styled(motion.header)`
  position: sticky;
  top: 0;
  z-index: 110;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  background:
    linear-gradient(165deg, ${({ theme }) => `${theme.colors.background.primary}ea`} 0%, ${({ theme }) => `${theme.colors.background.secondary}e1`} 100%);
  backdrop-filter: blur(12px);
`

const HeaderContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0.74rem 1rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.9rem;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    gap: 0.7rem;
  }

  @media (max-width: 640px) {
    padding: 0.62rem 0.8rem;
    gap: 0.55rem;
  }
`

const Logo = styled(motion.a)`
  display: flex;
  align-items: center;
  gap: 0.62rem;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text.primary};

  @media (max-width: 640px) {
    gap: 0.55rem;
  }
`

const LogoMark = styled.img`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: block;
  object-fit: cover;
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => theme.colors.background.secondary};
  box-shadow: ${({ theme }) => theme.shadows.glow};
  filter: saturate(1.08) brightness(1.04);
`

const LogoStack = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.05;
`

const LogoText = styled.span`
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: 0.98rem;
  letter-spacing: 0.03em;

  @media (max-width: 640px) {
    font-size: 0.9rem;
  }
`

const Subline = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.63rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
  text-transform: uppercase;
  letter-spacing: 0.08em;

  @media (max-width: 640px) {
    font-size: 0.54rem;
    letter-spacing: 0.05em;
  }
`

const NavigationRail = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;

  @media (max-width: 640px) {
    justify-content: flex-start;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 0.12rem;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`

const NavLink = styled(motion.button)<{ $active: boolean }>`
  border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.interactive.primary : theme.colors.border.secondary)};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme, $active }) =>
    $active ? `${theme.colors.interactive.primary}26` : `${theme.colors.background.secondary}c9`};
  color: ${({ theme, $active }) => ($active ? theme.colors.interactive.primary : theme.colors.text.secondary)};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 0.33rem 0.68rem;
  cursor: pointer;

  @media (max-width: 640px) {
    flex: 0 0 auto;
    font-size: 0.68rem;
    padding: 0.3rem 0.6rem;
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

  @media (max-width: 640px) {
    width: 100%;
  }
`

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => `${theme.colors.interactive.primary}2c`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.78rem;
  letter-spacing: 0.05em;
`

const Username = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`

const LoginButton = styled(motion.button)`
  border: 1px solid ${({ theme }) => theme.colors.interactive.primary};
  background: ${({ theme }) => `${theme.colors.interactive.primary}28`};
  color: ${({ theme }) => theme.colors.text.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 0.42rem 0.78rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.76rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;

  @media (max-width: 640px) {
    width: 100%;
    justify-content: center;
    text-align: center;
  }
`

const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  user,
  onLoginClick,
  onNavigate,
  currentPath = '/',
  authAvailable = true
}) => {
  const nav = [
    { label: 'Home', path: '/' },
    { label: 'Marketplace', path: '/extensions' },
    { label: 'MCP', path: '/mcp' },
    { label: 'Packs', path: '/packs' },
    { label: 'Docs', path: '/docs' },
    { label: 'News', path: '/news' },
    { label: 'Settings', path: '/settings' },
    { label: 'GitHub', path: 'https://github.com/aegntic/cldcde' }
  ]

  const openPath = (path: string) => {
    if (path.startsWith('http')) {
      window.open(path, '_blank')
      return
    }
    if (onNavigate) onNavigate(path)
  }

  return (
    <Header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.36, delay: 0.05 }}
    >
      <HeaderContent>
        <Logo
          href="/"
          onClick={(event) => {
            event.preventDefault()
            openPath('/')
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <LogoMark
            src="/media/branding/glass-character-mark.png"
            alt="CLDCDE glass glyph"
            loading="eager"
            decoding="async"
          />
          <LogoStack>
            <LogoText>CLDCDE.CC</LogoText>
            <Subline>Claude Code : : Plugins + Skills + MCP + Labs</Subline>
          </LogoStack>
        </Logo>

        <NavigationRail>
          {nav.map((item) => (
            <NavLink
              key={item.label}
              type="button"
              $active={!item.path.startsWith('http') && currentPath === item.path}
              onClick={() => openPath(item.path)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              {item.label}
            </NavLink>
          ))}
        </NavigationRail>

        <UserPanel>
          {user ? (
            <>
              <Username>@{(user as any)?.email?.split('@')[0] || 'operator'}</Username>
              <UserAvatar>{(user as any)?.email?.charAt(0)?.toUpperCase() || 'U'}</UserAvatar>
            </>
          ) : (
            <LoginButton type="button" onClick={onLoginClick} whileTap={{ scale: 0.98 }}>
              {authAvailable ? 'Login / Register' : 'Get Access / Updates'}
            </LoginButton>
          )}
        </UserPanel>
      </HeaderContent>
    </Header>
  )
}

export { TerminalHeader }
