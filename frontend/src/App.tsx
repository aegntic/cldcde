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
import { NeoLanding } from './components/NeoLanding'
import { ThemeToggle } from './components/ThemeToggle'
import { TerminalHeader } from './components/TerminalHeader'
import { AsciiHeading } from './components/AsciiHeading'
import { config } from './config'
import { fetchMarketplaceCatalog } from './lib/marketplaceApi'
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

const BOOT_VIDEO = '/media/landing/create-seamless-loop-v2.mp4'
const LANDING_LOOP_VIDEO = '/media/landing/create-seamless-loop-v2-boomerang.mp4'
const LANDING_POSTER = '/media/landing/create-seamless-loop-v2-poster.jpg'
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

const HomeRevealSurface = styled(motion.div)`
  width: 100%;
  transform-origin: 50% 0%;
  will-change: transform, opacity, filter;
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

  @media (max-width: 640px) {
    bottom: ${({ theme }) => theme.spacing.sm};
    right: ${({ theme }) => theme.spacing.sm};
    padding: 0.34rem 0.54rem;
    font-size: 0.62rem;
    gap: 0.34rem;
  }

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

const BootOverlay = styled(motion.div)<{ $poster: string }>`
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: ${({ theme }) => theme.colors.background.primary};
  background-image: url(${({ $poster }) => $poster});
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
    radial-gradient(circle at 52% 30%, rgba(5, 16, 30, 0.04) 0%, rgba(5, 16, 30, 0.24) 75%),
    linear-gradient(180deg, rgba(3, 9, 20, 0.16) 0%, rgba(3, 9, 20, 0.24) 100%);
`

const BootTopMask = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: clamp(66px, 14dvh, 130px);
  background: linear-gradient(180deg, rgba(3, 9, 20, 0.86) 0%, rgba(3, 9, 20, 0.2) 78%, transparent 100%);
  z-index: 1;
  pointer-events: none;
`

const BootBottomMask = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: clamp(72px, 18dvh, 180px);
  background: linear-gradient(180deg, transparent 0%, rgba(3, 9, 20, 0.26) 34%, rgba(3, 9, 20, 0.86) 100%);
  z-index: 1;
  pointer-events: none;
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

    > * {
      flex: 1 1 calc(33.333% - 0.4rem);
      min-width: 92px;
    }
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

const HeroBackdrop = styled.div<{ $poster: string }>`
  position: absolute;
  inset: 0;
  background-image: url(${({ $poster }) => $poster});
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

const HeroTopMask = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: clamp(58px, 11dvh, 112px);
  z-index: 4;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(3, 9, 20, 0.76) 0%, rgba(3, 9, 20, 0.14) 76%, transparent 100%);
`

const HeroBottomMask = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: clamp(64px, 14dvh, 148px);
  z-index: 4;
  pointer-events: none;
  background: linear-gradient(180deg, transparent 0%, rgba(3, 9, 20, 0.26) 32%, rgba(3, 9, 20, 0.78) 100%);
`

const HeroCornerMask = styled.div<{ $side: 'left' | 'right' }>`
  position: absolute;
  bottom: 0;
  ${({ $side }) => ($side === 'left' ? 'left: 0;' : 'right: 0;')}
  width: clamp(70px, 10vw, 140px);
  height: clamp(54px, 11vh, 96px);
  z-index: 4;
  pointer-events: none;
  background: ${({ $side }) =>
    $side === 'left'
      ? 'linear-gradient(90deg, rgba(3, 9, 20, 0.88) 0%, rgba(3, 9, 20, 0) 100%)'
      : 'linear-gradient(270deg, rgba(3, 9, 20, 0.88) 0%, rgba(3, 9, 20, 0) 100%)'};
`

const HeroVideoStage = styled.div`
  position: relative;
  z-index: 2;
  min-height: inherit;
  display: flex;
  align-items: flex-end;
`

const HeroActionLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 6;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: clamp(0.9rem, 2.4vw, 1.8rem);
  pointer-events: none;
`

const HeroActionPanel = styled.div`
  width: min(96vw, 900px);
  pointer-events: auto;
  border: 1px solid ${({ theme }) => `${theme.colors.border.primary}d0`};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: linear-gradient(180deg, rgba(3, 10, 20, 0.78) 0%, rgba(3, 10, 20, 0.54) 100%);
  backdrop-filter: blur(7px);
  box-shadow: ${({ theme }) => theme.shadows.md};
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: clamp(0.8rem, 1.9vw, 1.2rem);
`

const HeroActionTitle = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: clamp(1.05rem, 2.4vw, 2.2rem);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: ${({ theme }) => theme.colors.text.primary};
`

const HeroActionLead = styled.p`
  margin: 0;
  font-size: clamp(0.82rem, 1.2vw, 1rem);
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text.secondary};
`

const HeroActionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
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

  @media (max-width: 640px) {
    padding-top: ${({ theme }) => theme.spacing.lg};
  }
`

const HomeSectionTitle = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: clamp(1.3rem, 2.2vw, 2rem);
  line-height: 1.08;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.primary};
`

const RouteCard = styled(IsoCard)`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};
  align-content: start;

  @media (max-width: 640px) {
    padding: ${({ theme }) => theme.spacing.md};
  }
`

const RouteMetrics = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`

const ReleaseList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
`

const ReleaseItem = styled(IsoCard)`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
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
  const [authAvailable, setAuthAvailable] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [newUser, setNewUser] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [showVideoBoot, setShowVideoBoot] = useState(false)
  const [bootEligibleForLoad, setBootEligibleForLoad] = useState(() => window.location.pathname === '/')
  const [bootMuted, setBootMuted] = useState(true)
  const bootMedia = useMemo(
    () => ({
      video: BOOT_VIDEO,
      poster: LANDING_POSTER
    }),
    []
  )
  const landingMedia = useMemo(
    () => ({
      video: LANDING_LOOP_VIDEO,
      poster: LANDING_POSTER
    }),
    []
  )
  const [catalog, setCatalog] = useState<MarketplaceItem[]>([])

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
        if (!response.ok) {
          setConnectionStatus('offline')
          setAuthAvailable(false)
          return
        }

        const data = await response.json()
        const supabaseHealthy = data?.services?.supabase === 'healthy'
        const hasAnon = Boolean(data?.env?.hasAnon)
        const hasService = Boolean(data?.env?.hasService)
        setAuthAvailable(supabaseHealthy && hasAnon && hasService)
        setConnectionStatus(data?.status === 'healthy' && supabaseHealthy ? 'online' : 'offline')
      } catch {
        setConnectionStatus('offline')
        setAuthAvailable(false)
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

  const handleBootVideoError = () => {
    completeBoot()
  }

  const navigateTo = (path: string) => {
    const targetPage = mapPathToPage(path)
    setCurrentPage(targetPage)
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const extensionCount = useMemo(() => catalog.filter((item) => item.kind === 'extension').length, [catalog])
  const mcpCount = useMemo(() => catalog.filter((item) => item.kind === 'mcp').length, [catalog])
  const packCount = useMemo(() => catalog.filter((item) => item.kind === 'pack').length, [catalog])
  const spotlightItems = useMemo(() => {
    const featuredItems = catalog.filter((item) => item.featured)
    const ranked = featuredItems.length
      ? featuredItems
      : [...catalog].sort((a, b) => b.downloads - a.downloads || b.rating - a.rating)
    return ranked.slice(0, 3)
  }, [catalog])
  const latestItems = useMemo(
    () =>
      [...catalog]
        .sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime())
        .slice(0, 4),
    [catalog]
  )
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
      {currentPage !== 'home' && <DepthScene />}

      <AnimatePresence>
        {isHomeBootActive && (
          <BootOverlay
            $poster={bootMedia.poster}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BootVideo
              key={bootMedia.video}
              autoPlay
              muted={bootMuted}
              playsInline
              preload="auto"
              poster={bootMedia.poster}
              onEnded={completeBoot}
              onError={handleBootVideoError}
            >
              <source src={bootMedia.video} type="video/mp4" />
            </BootVideo>
            <BootVeil />
            <BootTopMask />
            <BootBottomMask />
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
        <TerminalHeader
          user={user}
          authAvailable={authAvailable}
          onLoginClick={() => setShowLoginModal(true)}
          onNavigate={navigateTo}
          currentPath={mapPageToPath(currentPage)}
        />
      </HeaderVisibility>

      <MainContent $hidden={isHomeBootActive} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {currentPage === 'home' && (
          <HomeRevealSurface
            initial={false}
            animate={isHomeBootActive ? { opacity: 0 } : { opacity: 1 }}
            transition={
              isHomeBootActive
                ? { duration: 0.2, ease: 'easeOut' }
                : { duration: 0.28, ease: 'easeOut' }
            }
          >
            <NeoLanding
              backgroundVideoSrc={landingMedia.video}
              backgroundVideoPoster={landingMedia.poster}
              onOpenExtensions={() => navigateTo('/extensions')}
              onOpenMcp={() => navigateTo('/mcp')}
              onOpenPacks={() => navigateTo('/packs')}
              extensionCount={extensionCount}
              mcpCount={mcpCount}
              packCount={packCount}
              totalCount={catalog.length}
              authAvailable={authAvailable}
            />

            <HomeContentShell>
              <SectionRail initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}>
                <FeaturePanel>
                  <Badge $tone="kind">Continue Below</Badge>
                  <HomeSectionTitle>Plugins, Skills, MCP, And Labs</HomeSectionTitle>
                  <SectionLead>
                    Move straight from the launch screen into installable Claude Code plugins, AE.LTD skill packs, MCP
                    servers, docs, and release notes.
                  </SectionLead>
                  <FeaturedGrid>
                    <RouteCard whileHover={{ y: -4 }}>
                      <Badge $tone="kind">Plugins</Badge>
                      <CardText>
                        Browse install-ready Claude Code plugins with direct commands, source links, and release metadata.
                      </CardText>
                      <RouteMetrics>
                        <TagChip>{extensionCount} listed</TagChip>
                        <TagChip>Install commands</TagChip>
                        <TagChip>Direct install</TagChip>
                      </RouteMetrics>
                      <NeonButton onClick={() => navigateTo('/extensions')} whileTap={{ scale: 0.98 }}>
                        Open Extensions
                      </NeonButton>
                    </RouteCard>

                    <RouteCard whileHover={{ y: -4 }}>
                      <Badge $tone="tier">MCP</Badge>
                      <CardText>
                        Browse MCP servers with setup notes, source links, and release details.
                      </CardText>
                      <RouteMetrics>
                        <TagChip>{mcpCount} listed</TagChip>
                        <TagChip>Server list</TagChip>
                        <TagChip>Setup docs</TagChip>
                      </RouteMetrics>
                      <NeonButton $tone="secondary" onClick={() => navigateTo('/mcp')} whileTap={{ scale: 0.98 }}>
                        Open MCP
                      </NeonButton>
                    </RouteCard>

                    <RouteCard whileHover={{ y: -4 }}>
                      <Badge $tone="new">Packs</Badge>
                      <CardText>
                        Download bundled skill packs and launch kits for Codex, Agent Zero, ZeroClaw, and ClawReform.
                      </CardText>
                      <RouteMetrics>
                        <TagChip>{packCount} bundles</TagChip>
                        <TagChip>Cross-platform</TagChip>
                        <TagChip>AE.LTD</TagChip>
                      </RouteMetrics>
                      <NeonButton $tone="ghost" onClick={() => navigateTo('/packs')} whileTap={{ scale: 0.98 }}>
                        Open Packs
                      </NeonButton>
                    </RouteCard>
                  </FeaturedGrid>
                </FeaturePanel>
              </SectionRail>

              <SectionRail initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}>
                <HomeGrid>
                  <FeaturePanel>
                    <Badge $tone="new">Featured</Badge>
                    <HomeSectionTitle>Featured Releases</HomeSectionTitle>
                    <CardText>
                      Featured items from the live catalog, surfaced for fast evaluation from the home screen.
                    </CardText>
                    <ReleaseList>
                      {spotlightItems.map((item) => (
                        <ReleaseItem key={item.id} whileHover={{ y: -3 }}>
                          <MetaRow>
                            <Badge $tone="kind">{item.kind}</Badge>
                            <Badge $tone={item.featured ? 'new' : 'tier'}>{item.featured ? 'featured' : item.tier}</Badge>
                            {item.verified && <Badge $tone="tier">verified</Badge>}
                          </MetaRow>
                          <HomeSectionTitle as="h3" style={{ fontSize: '1.1rem' }}>
                            {item.name}
                          </HomeSectionTitle>
                          <CardText>{item.summary}</CardText>
                          <RouteMetrics>
                            {item.tags.slice(0, 3).map((tag) => (
                              <TagChip key={`${item.id}-${tag}`}>{tag}</TagChip>
                            ))}
                          </RouteMetrics>
                        </ReleaseItem>
                      ))}
                    </ReleaseList>
                  </FeaturePanel>

                  <FeaturePanel>
                    <Badge $tone="tier">Resources</Badge>
                    <HomeSectionTitle>Docs, Releases, And Settings</HomeSectionTitle>
                    <FeatureSplit>
                      <CubeField />
                      <Stack>
                        <CardText>
                          Documentation, release notes, and account settings stay one click away from the landing screen.
                        </CardText>
                        <RouteMetrics>
                          <TagChip>Docs hub</TagChip>
                          <TagChip>Release feed</TagChip>
                          <TagChip>Profile settings</TagChip>
                        </RouteMetrics>
                        <MetaRow>
                          <NeonButton $tone="secondary" onClick={() => navigateTo('/docs')} whileTap={{ scale: 0.98 }}>
                            Open Docs
                          </NeonButton>
                          <NeonButton $tone="ghost" onClick={() => navigateTo('/news')} whileTap={{ scale: 0.98 }}>
                            Open News
                          </NeonButton>
                          <NeonButton $tone="ghost" onClick={() => navigateTo('/settings')} whileTap={{ scale: 0.98 }}>
                            Open Settings
                          </NeonButton>
                        </MetaRow>
                      </Stack>
                    </FeatureSplit>
                  </FeaturePanel>
                </HomeGrid>
              </SectionRail>

              <SectionRail initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}>
                <FeaturePanel>
                  <Badge $tone="new">Latest</Badge>
                  <HomeSectionTitle>Latest Releases</HomeSectionTitle>
                  <SectionLead>The newest catalog entries, pulled straight into the home page.</SectionLead>
                  <FeaturedGrid>
                    {latestItems.map((item) => (
                      <IsoCard key={item.id} whileHover={{ y: -3 }}>
                        <MetaRow>
                          <Badge $tone="kind">{item.kind}</Badge>
                          <Badge $tone="tier">{item.tier}</Badge>
                        </MetaRow>
                        <HomeSectionTitle as="h3" style={{ fontSize: '1rem' }}>
                          {item.name}
                        </HomeSectionTitle>
                        <CardText>{item.summary}</CardText>
                        <RouteMetrics>
                          <TagChip>{item.author}</TagChip>
                          <TagChip>{item.category}</TagChip>
                        </RouteMetrics>
                      </IsoCard>
                    ))}
                  </FeaturedGrid>
                </FeaturePanel>
              </SectionRail>
            </HomeContentShell>
          </HomeRevealSurface>
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
            authAvailable={authAvailable}
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
