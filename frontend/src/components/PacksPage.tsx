import React, { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { AsciiHeading } from './AsciiHeading'

type PackCounts = {
  skills: number
  mcps: number
  plugins: number
  workflow_docs: number
  prompt_docs: number
}

type PackEntry = {
  id: string
  name: string
  tier: 'free' | 'pro'
  tagline: string
  upgrade_url?: string
  counts: PackCounts
  downloads: {
    zip: string
    tar_gz: string
    manifest: string
  }
}

type PackManifest = {
  brand: string
  affiliations: string[]
  version: string
  generated_at: string
  packs: PackEntry[]
}

const FALLBACK_MANIFEST: PackManifest = {
  brand: 'AE.LTD',
  affiliations: ['cldcde.cc', 'aegntic.ai', 'ae.ltd', 'clawreform.com'],
  version: '1.1.0',
  generated_at: new Date().toISOString(),
  packs: [
    {
      id: 'ae-ltd-viral-free',
      name: 'AE.LTD Viral Free',
      tier: 'free',
      tagline: 'Cross-platform launch kit with niche plugin gems and MCP-ready workflows.',
      upgrade_url: 'https://ae.ltd/pro',
      counts: {
        skills: 5,
        mcps: 3,
        plugins: 7,
        workflow_docs: 46,
        prompt_docs: 25
      },
      downloads: {
        zip: '/static/downloads/ae-ltd/ae-ltd-viral-free-v1.1.0.zip',
        tar_gz: '/static/downloads/ae-ltd/ae-ltd-viral-free-v1.1.0.tar.gz',
        manifest: '/static/downloads/ae-ltd/ae-ltd-viral-free-v1.1.0-manifest.json'
      }
    },
    {
      id: 'ae-ltd-creator-pro',
      name: 'AE.LTD Creator Pro',
      tier: 'pro',
      tagline: 'Full ecosystem pack with advanced MCP graph + premium automation playbooks.',
      upgrade_url: 'https://ae.ltd/pro',
      counts: {
        skills: 7,
        mcps: 4,
        plugins: 24,
        workflow_docs: 46,
        prompt_docs: 25
      },
      downloads: {
        zip: '/static/downloads/ae-ltd/ae-ltd-creator-pro-v1.1.0.zip',
        tar_gz: '/static/downloads/ae-ltd/ae-ltd-creator-pro-v1.1.0.tar.gz',
        manifest: '/static/downloads/ae-ltd/ae-ltd-creator-pro-v1.1.0-manifest.json'
      }
    }
  ]
}

const PageContainer = styled.div`
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.xl};
  padding-top: calc(80px + ${({ theme }) => theme.spacing.xl});
  max-width: 1200px;
  margin: 0 auto;
`

const Header = styled(motion.div)`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

const Title = styled(AsciiHeading)`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 880px;
  margin: 0 auto;
  line-height: 1.6;
`

const Section = styled(motion.section)`
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

const SectionTitle = styled(AsciiHeading)`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const AffiliationCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ theme }) => theme.colors.background.card};
  padding: ${({ theme }) => theme.spacing.lg};
`

const PillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Pill = styled.a`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: none;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.85rem;

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.focus};
    color: ${({ theme }) => theme.colors.interactive.primary};
  }
`

const PackGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`

const PackCard = styled(motion.div)`
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ theme }) => theme.colors.background.card};
  padding: ${({ theme }) => theme.spacing.lg};
`

const PackHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const PackName = styled(AsciiHeading)`
  margin: 0;
`

const TierBadge = styled.span<{ tier: string }>`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme, tier }) =>
    tier === 'pro' ? theme.colors.interactive.accent : theme.colors.background.secondary};
  color: ${({ theme, tier }) =>
    tier === 'pro' ? '#fff' : theme.colors.text.primary};
  font-size: 0.75rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: 700;
  text-transform: uppercase;
`

const Tagline = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  line-height: 1.5;
`

const CountGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const CountItem = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.sm};
`

const CountLabel = styled.div`
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 0.75rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  text-transform: uppercase;
`

const CountValue = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1.1rem;
  font-weight: 700;
`

const ActionRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`

const ActionLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: none;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.85rem;

  &:hover {
    border-color: ${({ theme }) => theme.colors.interactive.primary};
    color: ${({ theme }) => theme.colors.interactive.primary};
  }
`

const InstallBlock = styled.pre`
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  overflow-x: auto;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text.primary};
`

const GemList = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.text.secondary};

  li {
    margin-bottom: ${({ theme }) => theme.spacing.xs};
  }
`

const InlineCode = styled.code`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: 2px 6px;
  font-family: ${({ theme }) => theme.fonts.mono};
`

export const PacksPage: React.FC = () => {
  const [manifest, setManifest] = useState<PackManifest>(FALLBACK_MANIFEST)
  const [source, setSource] = useState<'live' | 'fallback'>('fallback')

  useEffect(() => {
    let mounted = true

    const loadManifest = async () => {
      try {
        const response = await fetch('/static/downloads/ae-ltd/latest.json')
        if (!response.ok) {
          throw new Error(`Failed to load manifest (${response.status})`)
        }

        const data = await response.json()
        if (mounted && data?.packs?.length) {
          setManifest(data)
          setSource('live')
        }
      } catch (error) {
        console.warn('Using fallback pack manifest:', error)
      }
    }

    loadManifest()
    return () => {
      mounted = false
    }
  }, [])

  const affiliationLinks = useMemo(() => {
    const defaults = ['cldcde.cc', 'aegntic.ai', 'ae.ltd', 'clawreform.com']
    const sources = manifest.affiliations?.length ? manifest.affiliations : defaults
    return Array.from(new Set(sources))
  }, [manifest.affiliations])

  return (
    <PageContainer>
      <Header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Title text="AE.LTD SKILL SETS" size="hero" level={1} align="center" />
        <Subtitle>
          Packaged through <InlineCode>github.com/aegntic/cldcde</InlineCode> and published for{' '}
          <InlineCode>cldcde.cc</InlineCode>. Built to stay self-contained, installable on macOS/Linux/Windows,
          and compatible with Codex, Agent Zero, ZeroClaw, and ClawReform.
        </Subtitle>
      </Header>

      <Section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SectionTitle text="AFFILIATIONS" size="section" level={2} />
        <AffiliationCard>
          <PillRow>
            {affiliationLinks.map((item) => (
              <Pill key={item} href={`https://${item}`} target="_blank" rel="noopener noreferrer">
                {item}
              </Pill>
            ))}
            <Pill href="https://github.com/aegntic/cldcde" target="_blank" rel="noopener noreferrer">
              github.com/aegntic/cldcde
            </Pill>
          </PillRow>
        </AffiliationCard>
      </Section>

      <Section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <SectionTitle text="PACK DOWNLOADS" size="section" level={2} />
        <PackGrid>
          {manifest.packs.map((pack, index) => (
            <PackCard
              key={pack.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + index * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <PackHeader>
                <PackName text={pack.name.toUpperCase()} size="micro" level={3} />
                <TierBadge tier={pack.tier}>{pack.tier}</TierBadge>
              </PackHeader>

              <Tagline>{pack.tagline}</Tagline>

              <CountGrid>
                <CountItem>
                  <CountLabel>Skills</CountLabel>
                  <CountValue>{pack.counts.skills}</CountValue>
                </CountItem>
                <CountItem>
                  <CountLabel>MCPs</CountLabel>
                  <CountValue>{pack.counts.mcps}</CountValue>
                </CountItem>
                <CountItem>
                  <CountLabel>Plugins</CountLabel>
                  <CountValue>{pack.counts.plugins}</CountValue>
                </CountItem>
                <CountItem>
                  <CountLabel>Workflow Docs</CountLabel>
                  <CountValue>{pack.counts.workflow_docs}</CountValue>
                </CountItem>
              </CountGrid>

              <ActionRow>
                <ActionLink href={pack.downloads.zip} target="_blank" rel="noopener noreferrer">
                  Download ZIP
                </ActionLink>
                <ActionLink href={pack.downloads.tar_gz} target="_blank" rel="noopener noreferrer">
                  Download TAR.GZ
                </ActionLink>
                <ActionLink href={pack.downloads.manifest} target="_blank" rel="noopener noreferrer">
                  Manifest
                </ActionLink>
                {pack.upgrade_url && pack.tier === 'free' && (
                  <ActionLink href={pack.upgrade_url} target="_blank" rel="noopener noreferrer">
                    Upgrade Path
                  </ActionLink>
                )}
              </ActionRow>
            </PackCard>
          ))}
        </PackGrid>
      </Section>

      <Section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <SectionTitle text="INSTALL TARGETS" size="section" level={2} />
        <InstallBlock>{`python install/install.py \\
  --install-skills \\
  --install-agent-zero \\
  --install-zeroclaw`}</InstallBlock>
        <Subtitle>
          Build source: <InlineCode>{source === 'live' ? 'latest.json (live)' : 'fallback manifest'}</InlineCode>.
        </Subtitle>
      </Section>

      <Section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <SectionTitle text="NICHE HIDDEN GEMS" size="section" level={2} />
        <GemList>
          <li>Context7 docs grounding via the AE.LTD skill <InlineCode>ae-ltd-context7-radar</InlineCode></li>
          <li>Visual diff quality gates via <InlineCode>ae-ltd-visual-regression-forge</InlineCode></li>
          <li>Natural-language to n8n workflow generation via <InlineCode>ae-ltd-n8n-orbit</InlineCode></li>
          <li>High-signal plugins: <InlineCode>context7-docs</InlineCode>, <InlineCode>visual-regression</InlineCode>, <InlineCode>n8n-workflow</InlineCode>, <InlineCode>create-worktrees</InlineCode>, <InlineCode>mutation-tester</InlineCode></li>
        </GemList>
      </Section>
    </PageContainer>
  )
}
