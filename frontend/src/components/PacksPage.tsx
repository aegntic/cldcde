import React, { useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'
import { motion, useScroll, useTransform } from 'framer-motion'
import { AsciiHeading } from './AsciiHeading'
import { selectCatalogInstallCommand } from '../lib/marketplaceApi'

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

type KindFilter = 'all' | 'skill' | 'plugin'
type TierFilter = 'all' | 'free' | 'pro'
type ReleaseFilter = 'all' | 'new' | 'stable'

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

const machinePanel = css`
  position: relative;
  border: 1px solid ${({ theme }) => `${theme.colors.border.primary}dd`};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background:
    linear-gradient(165deg, ${({ theme }) => `${theme.colors.background.card}f2`} 0%, ${({ theme }) => `${theme.colors.background.secondary}e1`} 100%);
  box-shadow:
    0 12px 36px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.1;
    background-image:
      linear-gradient(to right, ${({ theme }) => `${theme.colors.border.secondary}99`} 1px, transparent 1px),
      linear-gradient(to bottom, ${({ theme }) => `${theme.colors.border.secondary}80`} 1px, transparent 1px);
    background-size: 22px 22px;
    mask-image: radial-gradient(circle at 20% 15%, black 30%, transparent 90%);
  }
`

const PageContainer = styled.div`
  min-height: 100vh;
  max-width: 1220px;
  margin: 0 auto;
  padding: calc(80px + ${({ theme }) => theme.spacing.xl}) ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.xl};
  position: relative;
  overflow: hidden;
`

const DepthScene = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
`

const WireframePlane = styled(motion.div)`
  position: absolute;
  inset: -14% -18%;
  opacity: 0.17;
  background-image:
    linear-gradient(to right, ${({ theme }) => `${theme.colors.border.secondary}a0`} 1px, transparent 1px),
    linear-gradient(to bottom, ${({ theme }) => `${theme.colors.border.secondary}7f`} 1px, transparent 1px);
  background-size: 52px 52px;
  transform: perspective(1000px) rotateX(62deg) scale(1.4);
  transform-origin: 50% 0;
  filter: blur(0.2px);
`

const DepthHalo = styled(motion.div)<{ $size: string; $top: string; $left?: string; $right?: string }>`
  position: absolute;
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left || 'auto'};
  right: ${({ $right }) => $right || 'auto'};
  border-radius: 48% 52% 58% 42% / 46% 40% 60% 54%;
  background:
    radial-gradient(circle at 30% 30%, ${({ theme }) => `${theme.colors.interactive.primary}6e`} 0%, transparent 65%),
    radial-gradient(circle at 70% 70%, ${({ theme }) => `${theme.colors.interactive.accent}5a`} 0%, transparent 72%);
  filter: blur(20px);
  opacity: 0.56;
`

const DepthRidge = styled(motion.div)`
  position: absolute;
  width: 72vw;
  max-width: 900px;
  height: 320px;
  left: -14%;
  top: 38%;
  border-radius: 42% 58% 52% 48% / 50% 42% 58% 50%;
  border: 1px solid ${({ theme }) => `${theme.colors.border.secondary}88`};
  background:
    linear-gradient(120deg, ${({ theme }) => `${theme.colors.background.secondary}99`} 0%, transparent 70%),
    radial-gradient(circle at 50% 50%, ${({ theme }) => `${theme.colors.interactive.primary}22`} 0%, transparent 78%);
  filter: blur(2px);
  opacity: 0.62;
`

const ContentLayer = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  gap: ${({ theme }) => theme.spacing.xl};
`

const Header = styled(motion.header)`
  ${machinePanel};
  padding: clamp(1.1rem, 2.8vw, 2rem);
  text-align: center;
`

const Title = styled(AsciiHeading)`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
`

const Subtitle = styled.p`
  margin: 0 auto;
  max-width: 860px;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.65;
  font-size: 1.04rem;
`

const DockRow = styled.div`
  ${machinePanel};
  padding: ${({ theme }) => theme.spacing.sm};
  position: sticky;
  top: 78px;
  z-index: 12;
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: center;
`

const DockButton = styled.button`
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => `${theme.colors.background.secondary}e8`};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.46rem 0.86rem;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.interactive.primary};
    color: ${({ theme }) => theme.colors.interactive.primary};
    transform: translateY(-1px);
  }
`

const Section = styled(motion.section)`
  scroll-margin-top: 150px;
`

const SectionTitle = styled(AsciiHeading)`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const SectionSubtitle = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.55;
`

const AffiliationsPanel = styled.div`
  ${machinePanel};
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
  font-size: 0.82rem;

  &:hover {
    border-color: ${({ theme }) => theme.colors.interactive.primary};
    color: ${({ theme }) => theme.colors.interactive.primary};
  }
`

const SpotlightGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`

const SpotlightCard = styled(motion.button)`
  ${machinePanel};
  width: 100%;
  text-align: left;
  padding: ${({ theme }) => theme.spacing.md};
  cursor: pointer;
  transform-style: preserve-3d;

  &:hover {
    border-color: ${({ theme }) => theme.colors.interactive.primary};
  }
`

const MiniMetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`

const MetaBadge = styled.span<{ tone?: 'new' | 'stable' | 'skill' | 'plugin' | 'free' | 'pro' }>`
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  padding: 0.2rem 0.45rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${({ tone, theme }) => {
    if (tone === 'new') return `${theme.colors.status.success}2a`
    if (tone === 'skill') return `${theme.colors.interactive.primary}1f`
    if (tone === 'plugin') return `${theme.colors.interactive.accent}1d`
    if (tone === 'pro') return `${theme.colors.interactive.accent}33`
    if (tone === 'free') return `${theme.colors.status.info}20`
    return theme.colors.background.secondary
  }};
  color: ${({ theme }) => theme.colors.text.secondary};
`

const SpotlightTitle = styled(AsciiHeading)`
  margin: ${({ theme }) => theme.spacing.sm} 0;
`

const SpotlightSummary = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.5;
`

const SpotlightHint = styled.span`
  margin-top: ${({ theme }) => theme.spacing.sm};
  display: inline-flex;
  color: ${({ theme }) => theme.colors.interactive.primary};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.76rem;
`

const ExplorerShell = styled.div`
  display: grid;
  grid-template-columns: minmax(300px, 0.88fr) minmax(320px, 1.12fr);
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 1040px) {
    grid-template-columns: 1fr;
  }
`

const RailPanel = styled.div`
  ${machinePanel};
  padding: ${({ theme }) => theme.spacing.md};
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
`

const SearchInput = styled.input`
  width: 100%;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => `${theme.colors.background.secondary}e6`};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.84rem;
  padding: 0.62rem 0.78rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.interactive.primary};
    box-shadow: 0 0 0 1px ${({ theme }) => `${theme.colors.interactive.primary}66`};
  }
`

const FilterLabel = styled.div`
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`

const FilterButton = styled.button<{ $active: boolean }>`
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.interactive.primary : theme.colors.border.secondary)};
  background: ${({ theme, $active }) =>
    $active ? `${theme.colors.interactive.primary}22` : `${theme.colors.background.secondary}cc`};
  color: ${({ theme, $active }) => ($active ? theme.colors.interactive.primary : theme.colors.text.secondary)};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.73rem;
  text-transform: uppercase;
  padding: 0.3rem 0.62rem;
  cursor: pointer;
`

const AssetList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
`

const AssetRowButton = styled.button<{ $active: boolean }>`
  width: 100%;
  text-align: left;
  border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.interactive.primary : theme.colors.border.primary)};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme, $active }) =>
    $active ? `${theme.colors.interactive.primary}14` : `${theme.colors.background.secondary}ba`};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  transition: all 0.16s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.interactive.primary};
    transform: translateX(2px);
  }
`

const AssetRowTitle = styled.div`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.84rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

const AssetRowSummary = styled.p`
  margin: ${({ theme }) => theme.spacing.xs} 0 0;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 0.8rem;
  line-height: 1.45;
`

const ShowMoreButton = styled.button`
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.76rem;
  padding: 0.44rem 0.76rem;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.interactive.primary};
    color: ${({ theme }) => theme.colors.interactive.primary};
  }
`

const EmptyState = styled.div`
  border: 1px dashed ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.muted};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.82rem;
`

const DetailPanel = styled(motion.div)`
  ${machinePanel};
  padding: ${({ theme }) => theme.spacing.md};
  position: sticky;
  top: 132px;
  align-self: start;
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};

  @media (max-width: 1040px) {
    position: relative;
    top: 0;
  }
`

const DetailTitle = styled(AsciiHeading)`
  margin: 0;
`

const DetailBody = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.58;
`

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`

const TagChip = styled.span`
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  padding: 0.18rem 0.42rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
`

const CommandLabel = styled.div`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.73rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
`

const CommandBlock = styled.pre`
  margin: 0;
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.background.primary};
  padding: ${({ theme }) => theme.spacing.sm};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
  color: ${({ theme }) => theme.colors.text.primary};
`

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`

const ActionButton = styled.button`
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8rem;
  padding: 0.46rem 0.72rem;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.interactive.primary};
    color: ${({ theme }) => theme.colors.interactive.primary};
  }
`

const ActionLink = styled.a`
  display: inline-flex;
  align-items: center;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => `${theme.colors.background.secondary}dd`};
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: none;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8rem;
  padding: 0.46rem 0.72rem;

  &:hover {
    border-color: ${({ theme }) => theme.colors.interactive.primary};
    color: ${({ theme }) => theme.colors.interactive.primary};
  }
`

const PackGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`

const PackCard = styled(motion.article)`
  ${machinePanel};
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

const TierBadge = styled.span<{ tier: 'free' | 'pro' }>`
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme, tier }) => (tier === 'pro' ? `${theme.colors.interactive.accent}33` : `${theme.colors.status.info}22`)};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.72rem;
  text-transform: uppercase;
  padding: 0.24rem 0.46rem;
`

const PackTagline = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
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
  font-size: 1.08rem;
  font-weight: 700;
`

const InstallBlock = styled.pre`
  ${machinePanel};
  padding: ${({ theme }) => theme.spacing.md};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.84rem;
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: pre-wrap;
  word-break: break-word;
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
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(ASSET_CATALOG[0]?.id ?? null)
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [releaseFilter, setReleaseFilter] = useState<ReleaseFilter>('all')
  const [showAllAssets, setShowAllAssets] = useState(false)
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null)

  const { scrollYProgress } = useScroll()
  const wireY = useTransform(scrollYProgress, [0, 1], ['0%', '-12%'])
  const haloY = useTransform(scrollYProgress, [0, 1], ['0%', '10%'])
  const ridgeY = useTransform(scrollYProgress, [0, 1], ['0%', '7%'])

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

  const filteredAssets = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return ASSET_CATALOG.filter((item) => {
      if (kindFilter !== 'all' && item.kind !== kindFilter) return false
      if (tierFilter !== 'all' && item.packTier !== tierFilter) return false
      if (releaseFilter !== 'all' && item.release !== releaseFilter) return false
      if (!needle) return true

      const haystack = [
        item.id,
        item.asciiTitle,
        item.summary,
        item.details,
        item.tags.join(' ')
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(needle)
    })
  }, [kindFilter, tierFilter, releaseFilter, query])

  useEffect(() => {
    if (!filteredAssets.length) {
      setSelectedAssetId(null)
      return
    }
    if (!selectedAssetId || !filteredAssets.some((item) => item.id === selectedAssetId)) {
      setSelectedAssetId(filteredAssets[0].id)
    }
  }, [filteredAssets, selectedAssetId])

  const selectedAsset = useMemo(
    () => filteredAssets.find((item) => item.id === selectedAssetId) || filteredAssets[0] || null,
    [filteredAssets, selectedAssetId]
  )

  const visibleAssets = useMemo(
    () => (showAllAssets ? filteredAssets : filteredAssets.slice(0, 8)),
    [filteredAssets, showAllAssets]
  )

  const hiddenAssets = Math.max(filteredAssets.length - visibleAssets.length, 0)

  const getInstallCommand = (item: AssetCatalogItem): string => {
    return selectCatalogInstallCommand({
      id: item.id,
      kind: item.kind,
      packTier: item.packTier,
      npmPackage: item.npmPackage,
      packTarByTier
    })
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

  const jumpTo = (id: string) => {
    const node = document.getElementById(id)
    node?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <PageContainer>
      <DepthScene>
        <WireframePlane style={{ y: wireY }} />
        <DepthHalo $size="36vw" $top="-10%" $left="-8%" style={{ y: haloY }} />
        <DepthHalo $size="28vw" $top="6%" $right="-4%" style={{ y: haloY }} />
        <DepthRidge style={{ y: ridgeY }} />
      </DepthScene>

      <ContentLayer>
        <Header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Title text="AE.LTD MACHINE DECK" size="hero" level={1} align="center" />
          <Subtitle>
            A 3D layered release surface for <InlineCode>skills</InlineCode> and <InlineCode>plugins</InlineCode>,
            built around direct terminal install actions and fast asset triage for Codex, Agent Zero, ZeroClaw, and ClawReform.
          </Subtitle>
        </Header>

        <DockRow>
          <DockButton type="button" onClick={() => jumpTo('packs-affiliations')}>Affiliations</DockButton>
          <DockButton type="button" onClick={() => jumpTo('packs-spotlight')}>Spotlight</DockButton>
          <DockButton type="button" onClick={() => jumpTo('packs-explorer')}>Explorer</DockButton>
          <DockButton type="button" onClick={() => jumpTo('packs-downloads')}>Downloads</DockButton>
          <DockButton type="button" onClick={() => jumpTo('packs-install')}>Install Targets</DockButton>
        </DockRow>

        <Section
          id="packs-affiliations"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <SectionTitle text="AFFILIATIONS" size="section" level={2} />
          <AffiliationsPanel>
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
          </AffiliationsPanel>
        </Section>

        <Section
          id="packs-spotlight"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <SectionTitle text="FEATURED NEW RELEASES" size="section" level={2} />
          <SectionSubtitle>
            Spotlight cards route straight into the explorer detail panel with install-ready commands.
          </SectionSubtitle>
          <SpotlightGrid>
            {featuredItems.map((item, index) => (
              <SpotlightCard
                key={item.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ rotateX: -2, rotateY: 2, y: -3 }}
                onClick={() => {
                  setSelectedAssetId(item.id)
                  jumpTo('packs-explorer')
                }}
              >
                <MiniMetaRow>
                  <MetaBadge tone={item.kind}>{item.kind}</MetaBadge>
                  <MetaBadge tone={item.release}>{item.release}</MetaBadge>
                  <MetaBadge tone={item.packTier}>{item.packTier}</MetaBadge>
                  <MetaBadge>v{item.version}</MetaBadge>
                </MiniMetaRow>
                <SpotlightTitle text={item.asciiTitle} size="micro" level={3} />
                <SpotlightSummary>{item.summary}</SpotlightSummary>
                <SpotlightHint>Open in explorer</SpotlightHint>
              </SpotlightCard>
            ))}
          </SpotlightGrid>
        </Section>

        <Section
          id="packs-explorer"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <SectionTitle text="SKILL + PLUGIN EXPLORER" size="section" level={2} />
          <SectionSubtitle>
            Filter on the left, inspect and install on the right. The detail panel stays pinned for rapid comparison.
          </SectionSubtitle>

          <ExplorerShell>
            <RailPanel>
              <FilterLabel>Search</FilterLabel>
              <SearchInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="search by name, tag, or capability"
              />

              <FilterLabel>Type</FilterLabel>
              <FilterRow>
                {(['all', 'skill', 'plugin'] as KindFilter[]).map((value) => (
                  <FilterButton key={value} type="button" $active={kindFilter === value} onClick={() => setKindFilter(value)}>
                    {value}
                  </FilterButton>
                ))}
              </FilterRow>

              <FilterLabel>Tier</FilterLabel>
              <FilterRow>
                {(['all', 'free', 'pro'] as TierFilter[]).map((value) => (
                  <FilterButton key={value} type="button" $active={tierFilter === value} onClick={() => setTierFilter(value)}>
                    {value}
                  </FilterButton>
                ))}
              </FilterRow>

              <FilterLabel>Release</FilterLabel>
              <FilterRow>
                {(['all', 'new', 'stable'] as ReleaseFilter[]).map((value) => (
                  <FilterButton key={value} type="button" $active={releaseFilter === value} onClick={() => setReleaseFilter(value)}>
                    {value}
                  </FilterButton>
                ))}
              </FilterRow>

              {visibleAssets.length > 0 ? (
                <AssetList>
                  {visibleAssets.map((item) => (
                    <AssetRowButton
                      key={item.id}
                      type="button"
                      $active={selectedAsset?.id === item.id}
                      onClick={() => setSelectedAssetId(item.id)}
                    >
                      <MiniMetaRow>
                        <MetaBadge tone={item.kind}>{item.kind}</MetaBadge>
                        <MetaBadge tone={item.release}>{item.release}</MetaBadge>
                        <MetaBadge>v{item.version}</MetaBadge>
                      </MiniMetaRow>
                      <AssetRowTitle>{item.asciiTitle}</AssetRowTitle>
                      <AssetRowSummary>{item.summary}</AssetRowSummary>
                    </AssetRowButton>
                  ))}
                </AssetList>
              ) : (
                <EmptyState>No assets match the current filters.</EmptyState>
              )}

              {hiddenAssets > 0 && (
                <ShowMoreButton type="button" onClick={() => setShowAllAssets((current) => !current)}>
                  {showAllAssets ? 'Show less' : `Show ${hiddenAssets} more below`}
                </ShowMoreButton>
              )}
            </RailPanel>

            <DetailPanel
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              {selectedAsset ? (
                <>
                  <MiniMetaRow>
                    <MetaBadge tone={selectedAsset.kind}>{selectedAsset.kind}</MetaBadge>
                    <MetaBadge tone={selectedAsset.release}>{selectedAsset.release}</MetaBadge>
                    <MetaBadge tone={selectedAsset.packTier}>{selectedAsset.packTier}</MetaBadge>
                    <MetaBadge>v{selectedAsset.version}</MetaBadge>
                  </MiniMetaRow>

                  <DetailTitle text={selectedAsset.asciiTitle} size="section" level={3} />
                  <DetailBody>{selectedAsset.details}</DetailBody>

                  <TagRow>
                    {selectedAsset.tags.map((tag) => (
                      <TagChip key={`${selectedAsset.id}-${tag}`}>{tag}</TagChip>
                    ))}
                  </TagRow>

                  <CommandLabel>Install In Terminal</CommandLabel>
                  <CommandBlock>{getInstallCommand(selectedAsset)}</CommandBlock>

                  <ActionRow>
                    <ActionButton type="button" onClick={() => copyInstallCommand(selectedAsset)}>
                      {copiedItemId === selectedAsset.id ? 'Copied' : 'Copy Install Command'}
                    </ActionButton>
                    <ActionLink
                      href={
                        selectedAsset.npmPackage
                          ? `https://www.npmjs.com/package/${selectedAsset.npmPackage}`
                          : toAbsoluteUrl(selectedAsset.packTier === 'free' ? packTarByTier.free : packTarByTier.pro)
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Install Source
                    </ActionLink>
                    <ActionLink href={toGithubTreeUrl(selectedAsset.docsPath)} target="_blank" rel="noopener noreferrer">
                      Docs / Source
                    </ActionLink>
                  </ActionRow>
                </>
              ) : (
                <EmptyState>Select an item in the explorer rail to view install details.</EmptyState>
              )}
            </DetailPanel>
          </ExplorerShell>
        </Section>

        <Section
          id="packs-downloads"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <SectionTitle text="PACK DOWNLOADS" size="section" level={2} />
          <PackGrid>
            {manifest.packs.map((pack, index) => (
              <PackCard
                key={pack.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.06 }}
                whileHover={{ y: -2 }}
              >
                <PackHeader>
                  <PackName text={pack.name.toUpperCase()} size="micro" level={3} />
                  <TierBadge tier={pack.tier}>{pack.tier}</TierBadge>
                </PackHeader>

                <PackTagline>{pack.tagline}</PackTagline>

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
          id="packs-install"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <SectionTitle text="INSTALL TARGETS" size="section" level={2} />
          <InstallBlock>{`python install/install.py \\
  --install-skills \\
  --install-agent-zero \\
  --install-zeroclaw`}</InstallBlock>
          <SectionSubtitle>
            Build source: <InlineCode>{source === 'live' ? 'latest.json (live)' : 'fallback manifest'}</InlineCode>.
          </SectionSubtitle>
        </Section>
      </ContentLayer>
    </PageContainer>
  )
}
