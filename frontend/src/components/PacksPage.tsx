import React, { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { AnimatePresence, motion } from 'framer-motion'
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

type AssetCatalogItem = {
  id: string
  asciiTitle: string
  kind: 'skill' | 'plugin'
  packTier: 'free' | 'pro'
  release: 'new' | 'stable'
  version: string
  summary: string
  details: string
  docsPath: string
  tags: string[]
  featured?: boolean
  npmPackage?: string
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
        workflow_docs: 47,
        prompt_docs: 26
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
        workflow_docs: 47,
        prompt_docs: 26
      },
      downloads: {
        zip: '/static/downloads/ae-ltd/ae-ltd-creator-pro-v1.1.0.zip',
        tar_gz: '/static/downloads/ae-ltd/ae-ltd-creator-pro-v1.1.0.tar.gz',
        manifest: '/static/downloads/ae-ltd/ae-ltd-creator-pro-v1.1.0-manifest.json'
      }
    }
  ]
}

const FALLBACK_TAR_BY_TIER: Record<'free' | 'pro', string> = {
  free: '/static/downloads/ae-ltd/ae-ltd-viral-free-v1.1.0.tar.gz',
  pro: '/static/downloads/ae-ltd/ae-ltd-creator-pro-v1.1.0.tar.gz'
}

const ASSET_CATALOG: AssetCatalogItem[] = [
  {
    id: 'google-labs-extension',
    asciiTitle: 'GOOGLE LABS EXTENSION',
    kind: 'plugin',
    packTier: 'free',
    release: 'new',
    version: '1.1.0',
    summary: 'Terminal bridge for Stitch, Whisk, and Flow pipelines with reusable compound workflow steps.',
    details:
      'Adds Labs-focused commands that let creators run visual generation chains from terminal and package assets quickly.',
    docsPath: 'plugins/google-labs-extension',
    tags: ['stitch', 'whisk', 'flow', 'pipeline'],
    featured: true,
    npmPackage: '@aegntic/google-labs-extension'
  },
  {
    id: 'notebooklm-pro',
    asciiTitle: 'NOTEBOOKLM PRO',
    kind: 'plugin',
    packTier: 'free',
    release: 'new',
    version: '1.1.0',
    summary: 'Session-based research workflows with cross-source synthesis and conversational context carryover.',
    details:
      'Optimized for long-form research sessions, source-grounded synthesis, and research exports that slot into creator workflows.',
    docsPath: 'plugins/notebooklm-pro',
    tags: ['research', 'rag', 'analysis', 'knowledge'],
    featured: true,
    npmPackage: '@aegntic/notebooklm-pro'
  },
  {
    id: 'compound-engineering',
    asciiTitle: 'COMPOUND ENGINEERING',
    kind: 'plugin',
    packTier: 'pro',
    release: 'new',
    version: '1.1.0',
    summary: 'Quality-gate orchestrator that chains Debt Sentinel, Spec Lock, and Red Team Tribunal.',
    details:
      'Enforces staged pre-edit and post-edit checks so high-risk changes get blocked before they reach release branches.',
    docsPath: 'plugins/compound-engineering',
    tags: ['quality-gates', 'review', 'ci', 'orchestration'],
    featured: true
  },
  {
    id: 'ae-ltd-visual-regression-forge',
    asciiTitle: 'VISUAL REGRESSION FORGE',
    kind: 'skill',
    packTier: 'pro',
    release: 'new',
    version: '1.1.0',
    summary: 'Image diff guardrails for launch assets, hero shots, and high-signal UI release checks.',
    details:
      'Compares baseline and candidate outputs, then raises visible drift flags before pack exports or public launch.',
    docsPath: 'skills/ae-ltd-visual-regression-forge',
    tags: ['visual diff', 'qa', 'release'],
    featured: true
  },
  {
    id: 'ae-ltd-context7-radar',
    asciiTitle: 'CONTEXT7 RADAR',
    kind: 'skill',
    packTier: 'free',
    release: 'stable',
    version: '1.1.0',
    summary: 'Context grounding layer for resilient long-session execution and reference stability.',
    details:
      'Keeps context focus across multi-step tasks and avoids drift when switching between code, docs, and launch workflows.',
    docsPath: 'skills/ae-ltd-context7-radar',
    tags: ['context', 'grounding', 'stability']
  },
  {
    id: 'ae-ltd-mcp-foundry',
    asciiTitle: 'MCP FOUNDRY',
    kind: 'skill',
    packTier: 'free',
    release: 'stable',
    version: '1.1.0',
    summary: 'MCP composition starter for packaging data sources and tool chains into reusable agent interfaces.',
    details:
      'Designed for building production-ready MCP bundles quickly, then wiring them into Codex, Agent Zero, and ClawReform stacks.',
    docsPath: 'skills/ae-ltd-mcp-foundry',
    tags: ['mcp', 'integration', 'tooling']
  },
  {
    id: 'ae-ltd-mutation-gate',
    asciiTitle: 'MUTATION GATE',
    kind: 'skill',
    packTier: 'free',
    release: 'stable',
    version: '1.1.0',
    summary: 'Adversarial mutation checks that stress outputs before publishing workflows and prompts.',
    details:
      'Injects perturbations into outputs and workflows, then scores resilience so brittle variants can be removed.',
    docsPath: 'skills/ae-ltd-mutation-gate',
    tags: ['mutation', 'adversarial', 'validation']
  },
  {
    id: 'ae-ltd-n8n-orbit',
    asciiTitle: 'N8N ORBIT',
    kind: 'skill',
    packTier: 'free',
    release: 'stable',
    version: '1.1.0',
    summary: 'Natural-language to n8n workflow generation for creator operations and content automation.',
    details:
      'Turns workflow intent into runnable n8n shapes and reusable JSON snippets for faster automation setup.',
    docsPath: 'skills/ae-ltd-n8n-orbit',
    tags: ['automation', 'n8n', 'workflow']
  },
  {
    id: 'ae-ltd-worktree-mesh',
    asciiTitle: 'WORKTREE MESH',
    kind: 'skill',
    packTier: 'free',
    release: 'stable',
    version: '1.1.0',
    summary: 'Parallel branch execution pattern for fast experiments without polluting the main branch.',
    details:
      'Coordinates multiple worktrees with clear sync discipline for high-volume iteration and cleaner release candidates.',
    docsPath: 'skills/ae-ltd-worktree-mesh',
    tags: ['git', 'worktree', 'parallel']
  },
  {
    id: 'create-worktrees',
    asciiTitle: 'CREATE WORKTREES',
    kind: 'plugin',
    packTier: 'free',
    release: 'stable',
    version: '1.1.0',
    summary: 'Fast branch workspace provisioning for parallel implementation and review tracks.',
    details:
      'Automates setup and teardown of isolated branches so feature and hotfix work can run in parallel.',
    docsPath: 'plugins/create-worktrees',
    tags: ['git', 'branching', 'ops']
  },
  {
    id: 'context7-docs',
    asciiTitle: 'CONTEXT7 DOCS',
    kind: 'plugin',
    packTier: 'free',
    release: 'stable',
    version: '1.1.0',
    summary: 'Documentation lens that stays grounded to local context before generating implementation outputs.',
    details:
      'Improves doc-driven implementation quality by keeping retrieval anchored to relevant project state.',
    docsPath: 'plugins/context7-docs',
    tags: ['docs', 'retrieval', 'context']
  },
  {
    id: 'mutation-tester',
    asciiTitle: 'MUTATION TESTER',
    kind: 'plugin',
    packTier: 'free',
    release: 'stable',
    version: '1.1.0',
    summary: 'Output resilience checker that catches fragile prompt/workflow combinations.',
    details:
      'Applies deliberate mutations and computes survival rate so unstable prompt chains can be rewritten.',
    docsPath: 'plugins/mutation-tester',
    tags: ['testing', 'mutation', 'quality']
  },
  {
    id: 'n8n-workflow',
    asciiTitle: 'N8N WORKFLOW',
    kind: 'plugin',
    packTier: 'free',
    release: 'stable',
    version: '1.1.0',
    summary: 'n8n workflow helpers for templating, conversion, and multi-step automation setup.',
    details:
      'Speeds up repeatable automation handoff by packaging reusable n8n units inside the AE.LTD ecosystem.',
    docsPath: 'plugins/n8n-workflow',
    tags: ['n8n', 'automation', 'templates']
  },
  {
    id: 'visual-regression',
    asciiTitle: 'VISUAL REGRESSION',
    kind: 'plugin',
    packTier: 'free',
    release: 'stable',
    version: '1.1.0',
    summary: 'Visual diff checks for interface and campaign-asset deltas across releases.',
    details:
      'Adds confidence gates for launch assets by identifying visual drift against known-good baselines.',
    docsPath: 'plugins/visual-regression',
    tags: ['visual', 'diff', 'release']
  },
  {
    id: 'ae-ltd-claude-template-switchboard',
    asciiTitle: 'TEMPLATE SWITCHBOARD',
    kind: 'skill',
    packTier: 'pro',
    release: 'stable',
    version: '1.1.0',
    summary: 'Template orchestration layer for fast Claude.md baseline switching across multiple projects.',
    details:
      'Keeps execution style consistent when moving between repos by routing to the right template profile.',
    docsPath: 'skills/ae-ltd-claude-template-switchboard',
    tags: ['templates', 'routing', 'profiles']
  }
]

const toAbsoluteUrl = (value: string): string => {
  if (!value) return value
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return `https://cldcde.cc${value.startsWith('/') ? value : `/${value}`}`
}

const toGithubTreeUrl = (docsPath: string): string => `https://github.com/aegntic/cldcde/tree/main/${docsPath}`

const derivePackRoot = (tarPath: string, fallbackRoot: string): string => {
  const fileName = tarPath.split('/').pop()
  if (!fileName) return fallbackRoot
  if (!fileName.endsWith('.tar.gz')) return fallbackRoot
  return fileName.replace(/\.tar\.gz$/, '')
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

const SectionSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: -0.55rem 0 ${({ theme }) => theme.spacing.lg};
  line-height: 1.55;
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
  color: ${({ theme, tier }) => (tier === 'pro' ? '#fff' : theme.colors.text.primary)};
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

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.background.secondary};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.85rem;
  cursor: pointer;

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

const InlineCode = styled.code`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: 2px 6px;
  font-family: ${({ theme }) => theme.fonts.mono};
`

const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`

const TileWrap = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
`

const AssetTile = styled(motion.button)<{ $expanded: boolean; $featured?: boolean }>`
  width: 100%;
  text-align: left;
  border: 1px solid
    ${({ theme, $expanded }) =>
      $expanded ? theme.colors.interactive.primary : theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ theme, $featured }) =>
    $featured
      ? `linear-gradient(150deg, ${theme.colors.background.card} 0%, ${theme.colors.background.secondary} 100%)`
      : theme.colors.background.card};
  padding: ${({ theme }) => theme.spacing.md};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.interactive.primary};
    transform: translateY(-2px);
  }
`

const AssetMetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`

const MetaGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`

const MetaBadge = styled.span<{ tone?: 'new' | 'stable' | 'skill' | 'plugin' }>`
  padding: 0.22rem 0.48rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  background: ${({ tone, theme }) => {
    if (tone === 'new') return `${theme.colors.status.success}20`
    if (tone === 'skill') return `${theme.colors.interactive.primary}18`
    if (tone === 'plugin') return `${theme.colors.interactive.accent}18`
    return theme.colors.background.secondary
  }};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const TileName = styled(AsciiHeading)`
  margin: ${({ theme }) => theme.spacing.sm} 0 ${({ theme }) => theme.spacing.sm};
`

const TileSummary = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.5;
  font-size: 0.95rem;
`

const ExpandHint = styled.span`
  margin-top: ${({ theme }) => theme.spacing.sm};
  display: inline-flex;
  color: ${({ theme }) => theme.colors.interactive.primary};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.78rem;
`

const AssetDetails = styled(motion.div)`
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => `${theme.colors.background.secondary}d9`};
  padding: ${({ theme }) => theme.spacing.md};
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
`

const DetailBody = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.55;
`

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`

const TagChip = styled.span`
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  padding: 0.18rem 0.45rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
`

const CommandLabel = styled.div`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const CommandBlock = styled.pre`
  margin: 0;
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  overflow-x: auto;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-word;
  color: ${({ theme }) => theme.colors.text.primary};
`

const ShowMoreRow = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  display: flex;
  justify-content: center;
`

const ShowMoreButton = styled.button`
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  font-family: ${({ theme }) => theme.fonts.mono};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.interactive.primary};
    color: ${({ theme }) => theme.colors.interactive.primary};
  }
`

const MoreContainer = styled(motion.div)`
  margin-top: ${({ theme }) => theme.spacing.md};
`

export const PacksPage: React.FC = () => {
  const [manifest, setManifest] = useState<PackManifest>(FALLBACK_MANIFEST)
  const [source, setSource] = useState<'live' | 'fallback'>('fallback')
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [showAllItems, setShowAllItems] = useState(false)
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null)

  useEffect(() => {
    if (!copiedItemId) return
    const timer = window.setTimeout(() => setCopiedItemId(null), 1500)
    return () => window.clearTimeout(timer)
  }, [copiedItemId])

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

  const packTarByTier = useMemo(() => {
    const freePack = manifest.packs.find((pack) => pack.tier === 'free')
    const proPack = manifest.packs.find((pack) => pack.tier === 'pro')
    return {
      free: freePack?.downloads.tar_gz || FALLBACK_TAR_BY_TIER.free,
      pro: proPack?.downloads.tar_gz || FALLBACK_TAR_BY_TIER.pro
    }
  }, [manifest.packs])

  const featuredItems = useMemo(() => ASSET_CATALOG.filter((item) => item.featured), [])
  const nonFeaturedItems = useMemo(() => ASSET_CATALOG.filter((item) => !item.featured), [])
  const pinnedItems = useMemo(() => nonFeaturedItems.slice(0, 6), [nonFeaturedItems])
  const extraItems = useMemo(() => nonFeaturedItems.slice(6), [nonFeaturedItems])

  const getInstallCommand = (item: AssetCatalogItem): string => {
    if (item.npmPackage) {
      return `npm install -g ${item.npmPackage}`
    }

    const tarPath = item.packTier === 'free' ? packTarByTier.free : packTarByTier.pro
    const tarUrl = toAbsoluteUrl(tarPath)
    const fallbackRoot = item.packTier === 'free' ? 'ae-ltd-viral-free-v1.1.0' : 'ae-ltd-creator-pro-v1.1.0'
    const packRoot = derivePackRoot(tarPath, fallbackRoot)

    if (item.kind === 'skill') {
      return `tmp="$(mktemp -d)" && \\
curl -fsSL "${tarUrl}" -o "$tmp/pack.tar.gz" && \\
tar -xzf "$tmp/pack.tar.gz" -C "$tmp" && \\
mkdir -p ~/.codex/skills ~/.zeroclaw/workspace/skills ~/.clawreform/workspace/skills && \\
cp -R "$tmp/${packRoot}/bundle/skills/${item.id}" ~/.codex/skills/ && \\
cp -R "$tmp/${packRoot}/bundle/skills/${item.id}" ~/.zeroclaw/workspace/skills/ && \\
cp -R "$tmp/${packRoot}/bundle/skills/${item.id}" ~/.clawreform/workspace/skills/ && \\
echo "[OK] Installed ${item.id}"`
    }

    return `tmp="$(mktemp -d)" && \\
curl -fsSL "${tarUrl}" -o "$tmp/pack.tar.gz" && \\
tar -xzf "$tmp/pack.tar.gz" -C "$tmp" && \\
target="\${AE_PLUGIN_DIR:-$HOME/.ae-ltd/plugins}" && \\
mkdir -p "$target" && \\
cp -R "$tmp/${packRoot}/bundle/plugins/${item.id}" "$target/" && \\
echo "[OK] Installed ${item.id} to $target"`
  }

  const copyInstallCommand = async (item: AssetCatalogItem) => {
    const command = getInstallCommand(item)

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(command)
      } else {
        throw new Error('Clipboard API unavailable')
      }
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = command
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }

    setCopiedItemId(item.id)
  }

  const renderTile = (item: AssetCatalogItem, index: number, delayBase: number) => {
    const isExpanded = expandedItemId === item.id
    const installCommand = getInstallCommand(item)
    const packTarPath = item.packTier === 'free' ? packTarByTier.free : packTarByTier.pro
    const docsUrl = toGithubTreeUrl(item.docsPath)
    const installReferenceUrl = item.npmPackage
      ? `https://www.npmjs.com/package/${item.npmPackage}`
      : toAbsoluteUrl(packTarPath)

    return (
      <TileWrap key={item.id}>
        <AssetTile
          type="button"
          $expanded={isExpanded}
          $featured={item.featured}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delayBase + index * 0.04 }}
          onClick={() => setExpandedItemId((current) => (current === item.id ? null : item.id))}
          whileTap={{ scale: 0.998 }}
        >
          <AssetMetaRow>
            <MetaGroup>
              <MetaBadge tone={item.kind}>{item.kind}</MetaBadge>
              <MetaBadge tone={item.release}>{item.release === 'new' ? 'new release' : 'stable'}</MetaBadge>
            </MetaGroup>
            <MetaBadge>v{item.version}</MetaBadge>
          </AssetMetaRow>

          <TileName text={item.asciiTitle} size="micro" level={3} />
          <TileSummary>{item.summary}</TileSummary>
          <ExpandHint>{isExpanded ? 'Hide details' : 'Show more'}</ExpandHint>
        </AssetTile>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <AssetDetails
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <DetailBody>{item.details}</DetailBody>

              <TagRow>
                {item.tags.map((tag) => (
                  <TagChip key={`${item.id}-${tag}`}>{tag}</TagChip>
                ))}
              </TagRow>

              <CommandLabel>Install In Terminal</CommandLabel>
              <CommandBlock>{installCommand}</CommandBlock>

              <ActionRow>
                <ActionButton type="button" onClick={() => copyInstallCommand(item)}>
                  {copiedItemId === item.id ? 'Copied' : 'Copy Install Command'}
                </ActionButton>
                <ActionLink href={installReferenceUrl} target="_blank" rel="noopener noreferrer">
                  Open Install Source
                </ActionLink>
                <ActionLink href={docsUrl} target="_blank" rel="noopener noreferrer">
                  Docs / Source
                </ActionLink>
              </ActionRow>
            </AssetDetails>
          )}
        </AnimatePresence>
      </TileWrap>
    )
  }

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
        transition={{ delay: 0.26 }}
      >
        <SectionTitle text="FEATURED NEW RELEASES" size="section" level={2} />
        <SectionSubtitle>
          Click any tile to open release context, install details, and terminal-ready commands.
        </SectionSubtitle>
        <TileGrid>{featuredItems.map((item, index) => renderTile(item, index, 0.3))}</TileGrid>
      </Section>

      <Section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <SectionTitle text="SKILLS + PLUGINS INDEX" size="section" level={2} />
        <SectionSubtitle>
          High-signal stable assets. Click a tile for install commands and integration references.
        </SectionSubtitle>

        <TileGrid>{pinnedItems.map((item, index) => renderTile(item, index, 0.34))}</TileGrid>

        {extraItems.length > 0 && (
          <>
            <ShowMoreRow>
              <ShowMoreButton type="button" onClick={() => setShowAllItems((current) => !current)}>
                {showAllItems ? 'Hide extra tiles' : `Show ${extraItems.length} more below`}
              </ShowMoreButton>
            </ShowMoreRow>

            <AnimatePresence initial={false}>
              {showAllItems && (
                <MoreContainer
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <TileGrid>{extraItems.map((item, index) => renderTile(item, index, 0.04))}</TileGrid>
                </MoreContainer>
              )}
            </AnimatePresence>
          </>
        )}
      </Section>

      <Section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
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
    </PageContainer>
  )
}
