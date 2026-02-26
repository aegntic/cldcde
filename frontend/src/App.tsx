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

const BOOT_SESSION_KEY = 'cldcde_market_boot_v1_seen'
const LANDING_VIDEO = '/static/media/landing/grok-launch-v1.mp4'
const LANDING_POSTER = '/static/media/landing/grok-launch-v1-poster.jpg'

const AppContainer = styled.div`
  min-height: 100vh;
  color: ${({ theme }) => theme.colors.text.primary};
  position: relative;
`

const MainContent = styled(motion.main)`
  position: relative;
  z-index: 1;
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
  background: ${({ theme }) => `${theme.colors.background.primary}f1`};
  display: grid;
  place-items: center;
  padding: 1rem;
`

const BootVideo = styled.video`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.18);
  opacity: 0.84;
  filter: blur(8px) saturate(1.16) contrast(1.08) brightness(0.56);
`

const BootVeil = styled.div`
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 25% 15%, rgba(90, 230, 255, 0.16) 0%, transparent 42%),
    radial-gradient(circle at 75% 20%, rgba(88, 246, 203, 0.15) 0%, transparent 44%),
    linear-gradient(180deg, rgba(5, 12, 24, 0.42) 0%, rgba(5, 12, 24, 0.92) 100%);
`

const BootPanel = styled(MarketplacePanel)`
  width: min(900px, 100%);
  z-index: 2;
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  text-align: center;
`

const BootTitle = styled(AsciiHeading)`
  margin: 0;
`

const BootCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.84rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const BootActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const HomeHero = styled.section`
  min-height: min(760px, calc(100vh - 86px));
  position: relative;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.lg};
`

const HeroVideo = styled.video`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  transform: scale(1.24);
  opacity: 0.6;
  filter: blur(10px) saturate(1.16) contrast(1.12) brightness(0.44);
`

const HeroOverlay = styled.div`
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 24% 22%, rgba(73, 230, 255, 0.2) 0%, transparent 34%),
    radial-gradient(circle at 82% 18%, rgba(95, 255, 190, 0.14) 0%, transparent 36%),
    radial-gradient(circle at 50% 48%, rgba(6, 12, 22, 0.46) 0%, rgba(6, 12, 22, 0.74) 52%, rgba(6, 12, 22, 0.88) 100%),
    linear-gradient(180deg, rgba(6, 12, 22, 0.6) 0%, rgba(6, 12, 22, 0.94) 100%);
`

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  min-height: inherit;
  padding: clamp(1rem, 3vw, 2rem);
  display: grid;
  align-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  max-width: 760px;
`

const HeroHeading = styled(AsciiHeading)`
  margin: 0;
`

const HeroLead = styled.p`
  margin: 0;
  font-size: clamp(0.98rem, 1.45vw, 1.14rem);
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.text.secondary};
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

const HomeGrid = styled.div`
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
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
  line-height: 1.55;
`

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
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
  const [bootMuted, setBootMuted] = useState(true)
  const [heroMuted, setHeroMuted] = useState(true)
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
    if (currentPage !== 'home') {
      setShowVideoBoot(false)
      return
    }

    let seen = false
    try {
      seen = sessionStorage.getItem(BOOT_SESSION_KEY) === '1'
    } catch {
      seen = false
    }

    if (!seen) {
      setShowVideoBoot(true)
    }
  }, [currentPage])

  useEffect(() => {
    if (!showVideoBoot) return
    const timeout = window.setTimeout(() => {
      try {
        sessionStorage.setItem(BOOT_SESSION_KEY, '1')
      } catch {}
      setShowVideoBoot(false)
    }, 3600)
    return () => window.clearTimeout(timeout)
  }, [showVideoBoot])

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

  return (
    <AppContainer>
      <GlobalStyle />
      <DepthScene />

      <AnimatePresence>
        {showVideoBoot && currentPage === 'home' && (
          <BootOverlay
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BootVideo
              autoPlay
              loop
              muted={bootMuted}
              playsInline
              poster={LANDING_POSTER}
              onError={() => setShowVideoBoot(false)}
            >
              <source src={LANDING_VIDEO} type="video/mp4" />
            </BootVideo>
            <BootVeil />
            <BootPanel initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <BootTitle text="CLDCDE MARKETPLACE" size="hero" level={1} align="center" />
              <BootCopy>plugin + mcp marketplace booting // click enter to continue</BootCopy>
              <BootActions>
                <NeonButton
                  onClick={() => {
                    try {
                      sessionStorage.setItem(BOOT_SESSION_KEY, '1')
                    } catch {}
                    setShowVideoBoot(false)
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Enter Marketplace
                </NeonButton>
                <NeonButton $tone="secondary" onClick={() => setBootMuted((prev) => !prev)} whileTap={{ scale: 0.98 }}>
                  {bootMuted ? 'Unmute' : 'Mute'}
                </NeonButton>
                <NeonButton
                  $tone="ghost"
                  onClick={() => {
                    try {
                      sessionStorage.setItem(BOOT_SESSION_KEY, '1')
                    } catch {}
                    setShowVideoBoot(false)
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Skip
                </NeonButton>
              </BootActions>
            </BootPanel>
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

      <TerminalHeader user={user} onLoginClick={() => setShowLoginModal(true)} onNavigate={navigateTo} currentPath={mapPageToPath(currentPage)} />

      <MainContent initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {currentPage === 'home' && (
          <MarketplaceShell>
            <SectionRail initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <HomeHero>
                <HeroVideo autoPlay loop muted={heroMuted} playsInline poster={LANDING_POSTER}>
                  <source src={LANDING_VIDEO} type="video/mp4" />
                </HeroVideo>
                <HeroOverlay />
                <HeroContent>
                  <Badge $tone="new">Marketplace Live</Badge>
                  <HeroHeading text={'CLDCDE.CC\nPLUGIN MARKET'} size="hero" level={1} />
                  <HeroLead>
                    Discover, evaluate, and install high-signal plugins, MCP servers, and AE.LTD packs in a route-first marketplace surface.
                    Every listing includes install commands for Codex, Agent Zero, ZeroClaw, and ClawReform workflows.
                  </HeroLead>
                  <HeroActionRow>
                    <NeonButton $tone="primary" onClick={() => navigateTo('/extensions')} whileTap={{ scale: 0.98 }}>
                      Browse Plugins
                    </NeonButton>
                    <NeonButton $tone="secondary" onClick={() => navigateTo('/mcp')} whileTap={{ scale: 0.98 }}>
                      Explore MCP
                    </NeonButton>
                    <NeonButton $tone="ghost" onClick={() => navigateTo('/packs')} whileTap={{ scale: 0.98 }}>
                      View Packs
                    </NeonButton>
                    <NeonButton $tone="ghost" onClick={() => setHeroMuted((prev) => !prev)} whileTap={{ scale: 0.98 }}>
                      {heroMuted ? 'Unmute' : 'Mute'}
                    </NeonButton>
                  </HeroActionRow>
                  <HeroMeta>
                    <Badge>{extensionCount} plugins</Badge>
                    <Badge>{mcpCount} mcp servers</Badge>
                    <Badge>{packCount} pack bundles</Badge>
                    <Badge>{catalog.length} total assets</Badge>
                  </HeroMeta>
                </HeroContent>
              </HomeHero>
            </SectionRail>

            <SectionRail initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}>
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

            <SectionRail initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}>
              <HomeGrid>
                <MarketplacePanel>
                  <SectionHeaderAscii text="MARKETPLACE CATEGORIES" size="section" level={2} />
                  <Stack>
                    {[
                      {
                        title: 'Plugins',
                        text: 'Command-focused extensions for execution, content generation, and release automation.',
                        action: '/extensions'
                      },
                      {
                        title: 'MCP Servers',
                        text: 'Data and tool bridges that extend model context and operational coverage.',
                        action: '/mcp'
                      },
                      {
                        title: 'AE.LTD Packs',
                        text: 'Portable bundles with install scripts and curated workflows for rapid startup.',
                        action: '/packs'
                      }
                    ].map((entry) => (
                      <IsoCard key={entry.title} whileHover={{ y: -2 }}>
                        <CardTitle text={entry.title.toUpperCase()} size="micro" level={3} />
                        <CardText>{entry.text}</CardText>
                        <NeonButton
                          style={{ marginTop: '0.7rem' }}
                          onClick={() => navigateTo(entry.action)}
                          whileTap={{ scale: 0.98 }}
                        >
                          Open {entry.title}
                        </NeonButton>
                      </IsoCard>
                    ))}
                  </Stack>
                </MarketplacePanel>

                <MarketplacePanel>
                  <SectionHeaderAscii text="QUALITY + DELIVERY LOOP" size="section" level={2} />
                  <Stack>
                    {[
                      'Spec Lock synchronizes implementation and docs before publish.',
                      'Debt Sentinel flags high-risk patterns prior to release.',
                      'Red Team Tribunal pressure-tests production-ready artifacts.',
                      'Pack outputs include install metadata for terminal onboarding.'
                    ].map((line, index) => (
                      <IsoCard key={line} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * index }}>
                        <CardText>{line}</CardText>
                      </IsoCard>
                    ))}
                  </Stack>
                  <HeroActionRow style={{ marginTop: '0.8rem' }}>
                    <NeonButton $tone="secondary" onClick={() => navigateTo('/docs')} whileTap={{ scale: 0.98 }}>
                      Read Docs
                    </NeonButton>
                    <NeonButton $tone="ghost" onClick={() => navigateTo('/news')} whileTap={{ scale: 0.98 }}>
                      Latest Releases
                    </NeonButton>
                    {!user && (
                      <NeonButton $tone="ghost" onClick={() => setShowLoginModal(true)} whileTap={{ scale: 0.98 }}>
                        Login / Register
                      </NeonButton>
                    )}
                  </HeroActionRow>
                </MarketplacePanel>
              </HomeGrid>
            </SectionRail>

            <SectionRail initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }}>
              <FooterSignal>
                {['cldcde.cc', 'aegntic.ai', 'ae.ltd', 'clawreform.com', 'github.com/aegntic/cldcde'].map((item) => (
                  <Badge key={item}>{item}</Badge>
                ))}
              </FooterSignal>
            </SectionRail>
          </MarketplaceShell>
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
