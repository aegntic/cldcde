import React, { useEffect, useMemo, useState } from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import { AnimatePresence, motion } from 'framer-motion'
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
import { AsciiHeading } from './components/AsciiHeading'
import { config } from './config'
import { fetchMarketplaceCatalog, fetchMarketplaceFeatured } from './lib/marketplaceApi'
import type { MarketplaceItem } from './types/marketplace'
import {
  Badge,
  DepthScene,
  IsoCard,
  MarketplaceShell,
  MarketplacePanel,
  NeonButton,
  SectionHeaderAscii,
  SectionLead,
  SectionRail,
  TagChip
} from './components/common/marketplace'

const GlobalStyle = createGlobalStyle`
  ${({ theme }) => createGlobalStyles(theme)}
`

type Page =
  | 'home'
  | 'extensions'
  | 'mcp'
  | 'packs'
  | 'docs'
  | 'news'
  | 'settings'

const R2_PUBLIC_BASE = 'https://pub-5720f0c8abe84850a71c8d81dcd6f928.r2.dev'
const LANDING_VIDEO = `${R2_PUBLIC_BASE}/media/landing/grok-launch-v5.mp4`
const LANDING_POSTER = `${R2_PUBLIC_BASE}/media/landing/grok-launch-v5-poster.png`
const LANDING_MEDIA_ORIGIN = '50% 60%'
const LANDING_MEDIA_SCALE = 1.05

const AppContainer = styled.div`
  min-height: 100vh;
  color: ${({ theme }) => theme.colors.text.primary};
  position: relative;
`

const HeaderVisibility = styled.div<{ $hidden: boolean }>`
  visibility: ${({ $hidden }) => ($hidden ? 'hidden' : 'visible')};
  pointer-events: ${({ $hidden }) => ($hidden ? 'none' : 'auto')};
`

const MainContent = styled(motion.main)<{ $hidden: boolean }>`
  position: relative;
  z-index: 1;
  visibility: ${({ $hidden }) => ($hidden ? 'hidden' : 'visible')};
  pointer-events: ${({ $hidden }) => ($hidden ? 'none' : 'auto')};
`

const ThemeTransitionOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.background.primary};
  z-index: 9999;
  pointer-events: none;
`

const StatusPill = styled(motion.div)<{ status: 'checking' | 'online' | 'offline' }>`
  position: fixed;
  bottom: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  z-index: 900;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 0.48rem 0.8rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => `${theme.colors.background.card}de`};
  backdrop-filter: blur(10px);
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.74rem;
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

const BootOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: ${({ theme }) => theme.colors.background.primary};
  background-image: url(${LANDING_POSTER});
  background-size: cover;
  background-position: center center;
  overflow: hidden;
`

const BootVideo = styled.video`
  position: absolute;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  object-fit: cover;
  object-position: center center;
  transform: scale(${LANDING_MEDIA_SCALE});
  transform-origin: ${LANDING_MEDIA_ORIGIN};
  image-rendering: auto;
`

const BootVeil = styled.div`
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(4, 10, 20, 0.02) 0%, rgba(4, 10, 20, 0.09) 100%);
`

const BootControls = styled.div`
  position: absolute;
  right: clamp(0.7rem, 2vw, 1.2rem);
  bottom: clamp(0.7rem, 2vw, 1.2rem);
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 0.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => `${theme.colors.border.primary}aa`};
  background: rgba(3, 9, 20, 0.38);
  backdrop-filter: blur(5px);

  @media (max-width: 700px) {
    left: 0.5rem;
    right: 0.5rem;
    justify-content: center;
  }
`

const HomeHero = styled.section`
  min-height: 100dvh;
  position: relative;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  overflow: hidden;
`

const HomeHeroRail = styled(SectionRail)`
  margin-top: calc(-1 * (86px + ${({ theme }) => theme.spacing.xl}));
`

const HeroBackdrop = styled.div`
  position: absolute;
  inset: 0;
  background-image: url(${LANDING_POSTER});
  background-size: cover;
  background-position: center center;
  transform: scale(${LANDING_MEDIA_SCALE});
  transform-origin: ${LANDING_MEDIA_ORIGIN};
  opacity: 1;
  filter: none;
`

const HeroWire = styled.div`
  position: absolute;
  inset: 12% -20% -44%;
  background-image:
    linear-gradient(to right, rgba(74, 154, 214, 0.2) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(74, 154, 214, 0.16) 1px, transparent 1px);
  background-size: 44px 44px;
  transform: perspective(1150px) rotateX(70deg) scale(1.32);
  transform-origin: center top;
  opacity: 0.22;
`

const HeroOverlay = styled.div`
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 9%, rgba(96, 255, 226, 0.06) 0%, transparent 34%),
    radial-gradient(circle at 84% 12%, rgba(99, 198, 255, 0.06) 0%, transparent 32%),
    linear-gradient(180deg, rgba(3, 9, 19, 0.02) 0%, rgba(3, 9, 19, 0.12) 100%);
`

const HeroVideoStage = styled.div`
  position: relative;
  z-index: 2;
  min-height: inherit;
  display: flex;
  align-items: flex-end;
`

const HeroPrimary = styled(MarketplacePanel)`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding: clamp(1rem, 2.4vw, 1.8rem);
  background: linear-gradient(156deg, rgba(2, 10, 22, 0.84) 0%, rgba(2, 10, 22, 0.7) 100%);
`

const HeroSecondary = styled(MarketplacePanel)`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  align-content: start;
  padding: clamp(1rem, 2.2vw, 1.5rem);
  background: linear-gradient(160deg, rgba(3, 13, 28, 0.88) 0%, rgba(3, 13, 28, 0.76) 100%);
`

const HeroLogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const HeroLogoMark = styled.img`
  width: clamp(62px, 7.4vw, 92px);
  height: clamp(62px, 7.4vw, 92px);
  border-radius: ${({ theme }) => theme.borderRadius.md};
  object-fit: cover;
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  box-shadow: ${({ theme }) => theme.shadows.glow};
`

const HeroHeading = styled(AsciiHeading)`
  margin: 0;
`

const HeroMiniNav = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.tertiary};
  text-transform: uppercase;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  font-family: ${({ theme }) => theme.fonts.mono};
`

const HeroTagline = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: clamp(1.5rem, 3vw, 2.4rem);
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.primary};
`

const HeroLead = styled.p`
  margin: 0;
  font-size: clamp(0.94rem, 1.4vw, 1.08rem);
  line-height: 1.68;
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 62ch;
`

const HeroActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`

const HeroMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`

const IsoCity = styled.div`
  height: 280px;
  border: 1px solid ${({ theme }) => `${theme.colors.border.secondary}d8`};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background:
    radial-gradient(circle at 26% 24%, rgba(82, 233, 255, 0.24) 0%, transparent 44%),
    radial-gradient(circle at 68% 40%, rgba(89, 255, 191, 0.2) 0%, transparent 48%),
    linear-gradient(150deg, rgba(8, 23, 40, 0.9) 0%, rgba(5, 16, 31, 0.84) 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 18% 8% 10%;
    border-radius: 10px;
    background:
      repeating-linear-gradient(
        to right,
        rgba(114, 219, 255, 0.24) 0,
        rgba(114, 219, 255, 0.24) 8px,
        transparent 8px,
        transparent 16px
      ),
      repeating-linear-gradient(
        to bottom,
        rgba(114, 219, 255, 0.2) 0,
        rgba(114, 219, 255, 0.2) 6px,
        transparent 6px,
        transparent 14px
      );
    transform: perspective(900px) rotateX(58deg);
    transform-origin: center bottom;
    opacity: 0.3;
  }

  &::after {
    content: '';
    position: absolute;
    width: 62%;
    height: 42%;
    left: 18%;
    top: 26%;
    border-radius: 10px;
    background:
      linear-gradient(170deg, rgba(138, 234, 255, 0.5) 0%, transparent 44%),
      linear-gradient(160deg, rgba(48, 118, 190, 0.46) 0%, rgba(14, 49, 86, 0.16) 100%);
    box-shadow:
      -52px -8px 0 -30px rgba(99, 230, 255, 0.5),
      -76px 26px 0 -32px rgba(81, 214, 255, 0.48),
      46px 12px 0 -26px rgba(118, 253, 205, 0.44),
      70px -16px 0 -34px rgba(95, 210, 255, 0.42);
    transform: perspective(1000px) rotateX(54deg) rotateZ(-16deg);
  }
`

const HomeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`

const FeaturePanel = styled(MarketplacePanel)`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`

const FeatureSplit = styled.div`
  display: grid;
  grid-template-columns: 0.88fr 1.12fr;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`

const CubeField = styled.div`
  min-height: 230px;
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 30%, rgba(113, 250, 255, 0.24) 0%, transparent 42%),
    linear-gradient(165deg, rgba(8, 23, 42, 0.9) 0%, rgba(6, 17, 32, 0.9) 100%);

  &::before {
    content: '';
    position: absolute;
    width: 68%;
    height: 68%;
    left: 16%;
    top: 16%;
    border-radius: 10px;
    border: 1px solid rgba(114, 219, 255, 0.44);
    transform: rotate(45deg);
    box-shadow:
      -56px -22px 0 -26px rgba(132, 239, 255, 0.58),
      -28px 44px 0 -20px rgba(109, 219, 255, 0.5),
      44px -40px 0 -26px rgba(116, 240, 210, 0.45),
      58px 32px 0 -24px rgba(115, 231, 255, 0.48);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(to right, rgba(56, 118, 173, 0.16) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(56, 118, 173, 0.12) 1px, transparent 1px);
    background-size: 30px 30px;
    opacity: 0.3;
  }
`

const NetworkField = styled(CubeField)`
  background:
    radial-gradient(circle at 28% 72%, rgba(83, 239, 228, 0.2) 0%, transparent 52%),
    linear-gradient(160deg, rgba(7, 23, 42, 0.88) 0%, rgba(4, 16, 33, 0.94) 100%);

  &::before {
    width: 74%;
    height: 60%;
    left: 13%;
    top: 20%;
    border-radius: 999px;
    border: 1px solid rgba(96, 195, 255, 0.42);
    transform: none;
    box-shadow:
      -42px 0 0 -34px rgba(111, 228, 255, 0.54),
      42px 0 0 -34px rgba(111, 228, 255, 0.54),
      0 -36px 0 -30px rgba(111, 228, 255, 0.45),
      0 36px 0 -30px rgba(111, 228, 255, 0.45);
  }
`

const Stack = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
`

const CardTitle = styled(AsciiHeading)`
  margin: 0;
`

const CardText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.58;
`

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`

const PlanCard = styled(IsoCard)<{ $highlight?: boolean }>`
  padding: ${({ theme }) => theme.spacing.md};
  border-color: ${({ theme, $highlight }) => ($highlight ? theme.colors.interactive.primary : theme.colors.border.primary)};
  background:
    linear-gradient(
      160deg,
      ${({ theme, $highlight }) => ($highlight ? `${theme.colors.interactive.primary}28` : `${theme.colors.background.card}f2`)} 0%,
      ${({ theme }) => `${theme.colors.background.secondary}d6`} 100%
    );
`

const PlanPrice = styled.div`
  font-family: ${({ theme }) => theme.fonts.sans};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1.45rem;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.02em;
`

const PlanList = styled.ul`
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  padding-left: 1rem;
  display: grid;
  gap: 0.3rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.88rem;
`

const FeaturedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`

const FooterSignal = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: center;
`

const HomeContentShell = styled(MarketplaceShell)`
  padding-top: ${({ theme }) => theme.spacing.xl};
`

const mapPathToPage = (path: string): Page => {
  switch (path) {
    case '/extensions':
      return 'extensions'
    case '/mcp':
      return 'mcp'
    case '/packs':
      return 'packs'
    case '/docs':
      return 'docs'
    case '/news':
      return 'news'
    case '/settings':
      return 'settings'
    default:
      return 'home'
  }
}

const mapPageToPath = (page: Page): string => {
  switch (page) {
    case 'extensions':
      return '/extensions'
    case 'mcp':
      return '/mcp'
    case 'packs':
      return '/packs'
    case 'docs':
      return '/docs'
    case 'news':
      return '/news'
    case 'settings':
      return '/settings'
    default:
      return '/'
  }
}

function AppContent() {
  const { isTransitioning } = useTheme()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [user, setUser] = useState<any>(null)
  const [newUser, setNewUser] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [showVideoBoot, setShowVideoBoot] = useState(false)
  const [bootEligibleForLoad, setBootEligibleForLoad] = useState(() => window.location.pathname === '/')
  const [bootMuted, setBootMuted] = useState(true)
  const [catalog, setCatalog] = useState<MarketplaceItem[]>([])
  const [featured, setFeatured] = useState<MarketplaceItem[]>([])

  useEffect(() => {
    setCurrentPage(mapPathToPage(window.location.pathname))
    const onPop = () => setCurrentPage(mapPathToPage(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

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

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const items = await fetchMarketplaceCatalog()
        if (!mounted) return
        setCatalog(items)
        const feed = await fetchMarketplaceFeatured(items)
        if (!mounted) return
        setFeatured(feed.featured)
      } catch (error) {
        console.warn('Marketplace feed failed:', error)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (currentPage !== 'home' || !bootEligibleForLoad) {
      setShowVideoBoot(false)
      return
    }
    setShowVideoBoot(true)
  }, [currentPage, bootEligibleForLoad])

  const completeBoot = () => {
    setShowVideoBoot(false)
    setBootEligibleForLoad(false)
  }

  const navigateTo = (path: string) => {
    const targetPage = mapPathToPage(path)
    setCurrentPage(targetPage)
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const featuredItems = useMemo(() => featured.slice(0, 6), [featured])
  const extensionCount = useMemo(() => catalog.filter((item) => item.kind === 'extension').length, [catalog])
  const mcpCount = useMemo(() => catalog.filter((item) => item.kind === 'mcp').length, [catalog])
  const packCount = useMemo(() => catalog.filter((item) => item.kind === 'pack').length, [catalog])
  const spotlightItems = useMemo(() => {
    if (featuredItems.length > 0) return featuredItems.slice(0, 3)
    return catalog.slice(0, 3)
  }, [featuredItems, catalog])
  const isHomeBootActive = currentPage === 'home' && showVideoBoot

  useEffect(() => {
    if (!isHomeBootActive) return

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [isHomeBootActive])

  return (
    <AppContainer>
      <GlobalStyle />
      <DepthScene />

      <AnimatePresence>
        {isHomeBootActive && (
          <BootOverlay
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BootVideo
              autoPlay
              muted={bootMuted}
              playsInline
              preload="auto"
              poster={LANDING_POSTER}
              onEnded={completeBoot}
              onError={completeBoot}
            >
              <source src={LANDING_VIDEO} type="video/mp4" />
            </BootVideo>
            <BootVeil />
            <BootControls>
              <NeonButton onClick={completeBoot} whileTap={{ scale: 0.98 }}>
                Enter
              </NeonButton>
              <NeonButton $tone="secondary" onClick={() => setBootMuted((prev) => !prev)} whileTap={{ scale: 0.98 }}>
                {bootMuted ? 'Unmute' : 'Mute'}
              </NeonButton>
              <NeonButton $tone="ghost" onClick={completeBoot} whileTap={{ scale: 0.98 }}>
                Skip
              </NeonButton>
            </BootControls>
          </BootOverlay>
        )}
      </AnimatePresence>

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
        initial={{ opacity: 0, y: -10 }}
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

      <HeaderVisibility $hidden={isHomeBootActive}>
        <TerminalHeader user={user} onLoginClick={() => setShowLoginModal(true)} onNavigate={navigateTo} currentPath={mapPageToPath(currentPage)} />
      </HeaderVisibility>

      <MainContent $hidden={isHomeBootActive} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {currentPage === 'home' && (
          <>
            <HomeHeroRail initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <HomeHero>
                <HeroBackdrop />
                <HeroWire />
                <HeroOverlay />
                <HeroVideoStage />
              </HomeHero>
            </HomeHeroRail>

            <HomeContentShell>
            <SectionRail initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
              <HomeGrid>
                <HeroPrimary initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  <Badge $tone="new">Marketplace Live</Badge>
                  <HeroLogoRow>
                    <HeroLogoMark
                      src="/media/branding/glass-character-mark.png"
                      alt="CLDCDE glass glyph"
                      loading="eager"
                      decoding="async"
                    />
                    <HeroHeading text="CLDCDE.CC" size="hero" level={1} />
                  </HeroLogoRow>
                  <HeroMiniNav>
                    {['Home', 'Features', 'Pricing', 'Community', 'Contact'].map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </HeroMiniNav>
                  <HeroTagline>Build The Future, Block By Block</HeroTagline>
                  <HeroLead>
                    Route-first catalog for plugins, MCP servers, and AE.LTD packs. Every listing includes direct install
                    commands for Codex, Agent Zero, ZeroClaw, and ClawReform.
                  </HeroLead>
                  <HeroActionRow>
                    <NeonButton $tone="primary" onClick={() => navigateTo('/extensions')} whileTap={{ scale: 0.98 }}>
                      Start Creating
                    </NeonButton>
                    <NeonButton $tone="secondary" onClick={() => navigateTo('/mcp')} whileTap={{ scale: 0.98 }}>
                      Explore MCP
                    </NeonButton>
                    <NeonButton $tone="ghost" onClick={() => navigateTo('/packs')} whileTap={{ scale: 0.98 }}>
                      View Packs
                    </NeonButton>
                  </HeroActionRow>
                  <HeroMeta>
                    <Badge>{extensionCount} plugins</Badge>
                    <Badge>{mcpCount} mcp</Badge>
                    <Badge>{packCount} packs</Badge>
                    <Badge>{catalog.length} total assets</Badge>
                  </HeroMeta>
                </HeroPrimary>

                <HeroSecondary initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                  <SectionHeaderAscii text="THE MODULAR REVOLUTION" size="card" level={2} />
                  <CardText>
                    Step confidently through every stage. Build in modular blocks, route installs cleanly, and keep
                    launch-ready prompts, plugins, and MCP endpoints in one surface.
                  </CardText>
                  <IsoCity />
                  <NeonButton $tone="secondary" onClick={() => navigateTo('/docs')} whileTap={{ scale: 0.98 }}>
                    Explore The Builder
                  </NeonButton>
                </HeroSecondary>
              </HomeGrid>
            </SectionRail>

            <SectionRail initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
              <HomeGrid>
                <FeaturePanel>
                  <SectionHeaderAscii text="VISUALIZE YOUR SUCCESS" size="section" level={2} />
                  <HeroLead>
                    View your signal flow before launch. Every install command, plugin dependency, and MCP bridge is represented in
                    one operational frame.
                  </HeroLead>
                  <FeatureSplit>
                    <CubeField />
                    <Stack>
                      <CardText>
                        From concept to release, CLDCDE tracks package quality, install targets, and distribution metadata so
                        execution stays clean.
                      </CardText>
                      <MetaRow>
                        <TagChip>Spec Lock</TagChip>
                        <TagChip>Flow Lane</TagChip>
                        <TagChip>Audit Rail</TagChip>
                      </MetaRow>
                      <NeonButton onClick={() => navigateTo('/extensions')} whileTap={{ scale: 0.98 }}>
                        See It In Action
                      </NeonButton>
                    </Stack>
                  </FeatureSplit>
                </FeaturePanel>

                <FeaturePanel>
                  <SectionHeaderAscii text="PRICING THAT SCALES WITH YOU" size="section" level={2} />
                  <PricingGrid>
                    {[
                      {
                        name: 'Starter',
                        price: '$0 / month',
                        points: ['Public catalog access', 'Core plugin discovery', 'Community support'],
                        cta: 'Get Started'
                      },
                      {
                        name: 'Pro',
                        price: '$29 / month',
                        points: ['Private pack overlays', 'MCP graph presets', 'Priority release feed'],
                        cta: 'Launch Now',
                        highlight: true
                      },
                      {
                        name: 'Enterprise',
                        price: 'Custom',
                        points: ['Dedicated support', 'Custom deployment rail', 'Advanced policy controls'],
                        cta: 'Contact Sales'
                      }
                    ].map((plan) => (
                      <PlanCard key={plan.name} $highlight={plan.highlight} whileHover={{ y: -2 }}>
                        <CardTitle text={plan.name.toUpperCase()} size="micro" level={3} />
                        <PlanPrice>{plan.price}</PlanPrice>
                        <PlanList>
                          {plan.points.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </PlanList>
                        <NeonButton
                          style={{ marginTop: '0.7rem' }}
                          $tone={plan.highlight ? 'primary' : 'secondary'}
                          onClick={() => navigateTo('/packs')}
                          whileTap={{ scale: 0.98 }}
                        >
                          {plan.cta}
                        </NeonButton>
                      </PlanCard>
                    ))}
                  </PricingGrid>
                </FeaturePanel>
              </HomeGrid>
            </SectionRail>

            <SectionRail initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <HomeGrid>
                <FeaturePanel>
                  <SectionHeaderAscii text="EMPOWER YOUR TEAM" size="section" level={2} />
                  <FeatureSplit>
                    <NetworkField />
                    <Stack>
                      <CardText>
                        One shared control surface for creators, engineers, and operators. Ship faster with predictable install paths
                        and reusable workflows.
                      </CardText>
                      <MetaRow>
                        <TagChip>Codex</TagChip>
                        <TagChip>Agent Zero</TagChip>
                        <TagChip>ZeroClaw</TagChip>
                        <TagChip>ClawReform</TagChip>
                      </MetaRow>
                      <HeroActionRow>
                        <NeonButton $tone="secondary" onClick={() => navigateTo('/docs')} whileTap={{ scale: 0.98 }}>
                          Read Docs
                        </NeonButton>
                        <NeonButton $tone="ghost" onClick={() => navigateTo('/settings')} whileTap={{ scale: 0.98 }}>
                          Open Settings
                        </NeonButton>
                      </HeroActionRow>
                    </Stack>
                  </FeatureSplit>
                </FeaturePanel>

                <FeaturePanel>
                  <SectionHeaderAscii text="JOIN THE MOVEMENT" size="section" level={2} />
                  <CardText>
                    Explore curated releases and pick install-ready stacks. Each listing includes command blocks, source links, and
                    package metadata.
                  </CardText>
                  <FeaturedGrid>
                    {spotlightItems.map((item) => (
                      <IsoCard key={item.id} whileHover={{ y: -2 }}>
                        <MetaRow>
                          <Badge $tone="kind">{item.kind}</Badge>
                          <Badge $tone="new">{item.featured ? 'featured' : 'new'}</Badge>
                        </MetaRow>
                        <CardTitle text={item.name.toUpperCase()} size="micro" level={3} />
                        <CardText>{item.summary}</CardText>
                      </IsoCard>
                    ))}
                  </FeaturedGrid>
                  <HeroActionRow>
                    <NeonButton onClick={() => navigateTo('/extensions')} whileTap={{ scale: 0.98 }}>
                      Join The Community
                    </NeonButton>
                    <NeonButton $tone="secondary" onClick={() => navigateTo('/docs')} whileTap={{ scale: 0.98 }}>
                      Browse Docs
                    </NeonButton>
                    <NeonButton $tone="ghost" onClick={() => navigateTo('/news')} whileTap={{ scale: 0.98 }}>
                      Latest News
                    </NeonButton>
                    {!user && (
                      <NeonButton $tone="ghost" onClick={() => setShowLoginModal(true)} whileTap={{ scale: 0.98 }}>
                        Login / Register
                      </NeonButton>
                    )}
                  </HeroActionRow>
                </FeaturePanel>
              </HomeGrid>
            </SectionRail>

            <SectionRail initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <SectionHeaderAscii text="FEATURED RELEASE STRIP" size="section" level={2} />
              <SectionLead>Curated launch-ready assets based on download traction and featured flags.</SectionLead>
              <FeaturedGrid>
                {featuredItems.map((item) => (
                  <IsoCard key={item.id} whileHover={{ y: -2 }}>
                    <MetaRow>
                      <Badge $tone="kind">{item.kind}</Badge>
                      <Badge $tone="new">{item.featured ? 'featured' : 'new'}</Badge>
                      <Badge $tone="tier">{item.tier}</Badge>
                    </MetaRow>
                    <CardTitle text={item.name.toUpperCase()} size="micro" level={3} />
                    <CardText>{item.summary}</CardText>
                    <MetaRow style={{ marginTop: '0.55rem' }}>
                      {item.tags.slice(0, 3).map((tag) => (
                        <TagChip key={`${item.id}-${tag}`}>{tag}</TagChip>
                      ))}
                    </MetaRow>
                  </IsoCard>
                ))}
              </FeaturedGrid>
            </SectionRail>

            <SectionRail initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <FooterSignal>
                {['cldcde.cc', 'aegntic.ai', 'ae.ltd', 'clawreform.com', 'github.com/aegntic/cldcde'].map((item) => (
                  <Badge key={item}>{item}</Badge>
                ))}
              </FooterSignal>
            </SectionRail>
            </HomeContentShell>
          </>
        )}

        {currentPage === 'extensions' && <ExtensionBrowser />}
        {currentPage === 'mcp' && <MCPBrowser />}
        {currentPage === 'news' && <NewsPage />}
        {currentPage === 'docs' && <DocsPage />}
        {currentPage === 'packs' && <PacksPage />}
        {currentPage === 'settings' && <SettingsDocsPage user={user} onUpdateUser={setUser} onLoginClick={() => setShowLoginModal(true)} />}
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
