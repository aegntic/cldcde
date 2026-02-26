import { afterEach, describe, expect, test } from 'bun:test'
import {
  applyMarketplaceFilters,
  fetchMarketplaceCatalog,
  selectCatalogInstallCommand
} from './marketplaceApi'
import type { MarketplaceItem } from '../types/marketplace'

const originalFetch = globalThis.fetch

const jsonResponse = (data: any, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data
  }) as Response

const makeItem = (overrides: Partial<MarketplaceItem>): MarketplaceItem => ({
  id: 'item-1',
  kind: 'extension',
  name: 'Default Item',
  slug: 'default-item',
  summary: 'Default summary',
  tags: ['default'],
  downloads: 0,
  rating: 0,
  verified: false,
  installCommand: 'npm install -g @aegntic/default-item',
  repoUrl: 'https://github.com/aegntic/default-item',
  tier: 'free',
  releasedAt: '2026-02-01T00:00:00.000Z',
  category: 'general',
  platform: ['macos', 'linux', 'windows'],
  author: 'community',
  featured: false,
  ...overrides
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('marketplaceApi', () => {
  test('normalizes extensions, mcp servers, and packs into one catalog model', async () => {
    globalThis.fetch = (async (url: string | URL | Request) => {
      const target = String(url)

      if (target.includes('/extensions')) {
        return jsonResponse({
          extensions: [
            {
              id: 'ext-1',
              name: 'NotebookLM Pro',
              description: 'Research workflow extension',
              tags: ['research', 'rag'],
              downloads: '12',
              rating: '4.8',
              verified: true,
              installScript: 'npm install -g @aegntic/notebooklm-pro',
              repository: 'https://github.com/aegntic/notebooklm-pro',
              category: 'research',
              platform: ['macos', 'linux'],
              author: 'aegntic',
              updated_at: '2026-02-20T00:00:00.000Z'
            }
          ]
        })
      }

      if (target.includes('/mcp')) {
        return jsonResponse({
          mcpServers: [
            {
              id: 'mcp-1',
              name: 'Google Labs MCP',
              description: 'Labs context bridge',
              tags: ['mcp', 'labs'],
              downloads: 9,
              rating: 4.6,
              install_command: 'npm install -g @aegntic/google-labs-mcp',
              repository: 'https://github.com/aegntic/google-labs-extension',
              updated_at: '2026-02-21T00:00:00.000Z'
            }
          ]
        })
      }

      if (target.includes('/static/downloads/ae-ltd/latest.json')) {
        return jsonResponse({
          packs: [
            {
              id: 'ae-ltd-viral-free',
              name: 'AE.LTD Viral Free',
              tier: 'free',
              tagline: 'Curated launch bundle',
              counts: {
                skills: 5,
                mcps: 3,
                plugins: 7
              },
              downloads: {
                tar_gz: '/static/downloads/ae-ltd/ae-ltd-viral-free-v1.1.0.tar.gz'
              },
              generated_at: '2026-02-22T00:00:00.000Z'
            }
          ]
        })
      }

      return jsonResponse({}, 404)
    }) as typeof fetch

    const catalog = await fetchMarketplaceCatalog()
    expect(catalog.length).toBe(3)

    const extension = catalog.find((item) => item.kind === 'extension')
    const mcp = catalog.find((item) => item.kind === 'mcp')
    const pack = catalog.find((item) => item.kind === 'pack')

    expect(extension?.id).toBe('ext-1')
    expect(extension?.tier).toBe('free')
    expect(extension?.verified).toBe(true)

    expect(mcp?.id).toBe('mcp-1')
    expect(mcp?.tier).toBe('pro')
    expect(mcp?.category).toBe('mcp')

    expect(pack?.id).toBe('ae-ltd-viral-free')
    expect(pack?.verified).toBe(true)
    expect(pack?.installCommand).toContain('python3')
  })

  test('filters and sorts catalog items deterministically', () => {
    const items: MarketplaceItem[] = [
      makeItem({
        id: 'plugin-1',
        name: 'Visual Forge',
        downloads: 42,
        rating: 4.7,
        verified: true,
        tier: 'free',
        category: 'visual',
        tags: ['visual', 'release']
      }),
      makeItem({
        id: 'plugin-2',
        name: 'Visual Shield',
        downloads: 91,
        rating: 4.5,
        verified: true,
        tier: 'free',
        category: 'visual',
        tags: ['visual', 'quality']
      }),
      makeItem({
        id: 'plugin-3',
        name: 'MCP Node',
        kind: 'mcp',
        downloads: 120,
        rating: 4.9,
        verified: false,
        tier: 'pro',
        category: 'mcp',
        tags: ['mcp']
      })
    ]

    const filtered = applyMarketplaceFilters(items, {
      search: 'visual',
      kind: 'all',
      category: 'visual',
      tags: [],
      sort: 'downloads',
      tier: 'free',
      verifiedOnly: true
    })

    expect(filtered.map((item) => item.id)).toEqual(['plugin-2', 'plugin-1'])

    const sortedByRating = applyMarketplaceFilters(items, {
      search: '',
      kind: 'all',
      category: 'all',
      tags: [],
      sort: 'rating',
      tier: 'all',
      verifiedOnly: false
    })

    expect(sortedByRating.map((item) => item.id)).toEqual(['plugin-3', 'plugin-1', 'plugin-2'])
  })

  test('selects install command by package type (npm vs pack)', () => {
    const npmCommand = selectCatalogInstallCommand({
      id: 'google-labs-extension',
      kind: 'plugin',
      packTier: 'free',
      npmPackage: '@aegntic/google-labs-extension'
    })

    expect(npmCommand).toBe('npm install -g @aegntic/google-labs-extension')

    const skillPackCommand = selectCatalogInstallCommand({
      id: 'ae-ltd-context7-radar',
      kind: 'skill',
      packTier: 'free',
      packTarByTier: {
        free: '/static/downloads/ae-ltd/ae-ltd-viral-free-v1.1.0.tar.gz',
        pro: '/static/downloads/ae-ltd/ae-ltd-creator-pro-v1.1.0.tar.gz'
      }
    })

    expect(skillPackCommand).toContain('bundle/skills/ae-ltd-context7-radar')
    expect(skillPackCommand).toContain('~/.codex/skills')
    expect(skillPackCommand).toContain('https://cldcde.cc/static/downloads/ae-ltd/ae-ltd-viral-free-v1.1.0.tar.gz')

    const pluginPackCommand = selectCatalogInstallCommand({
      id: 'context7-docs',
      kind: 'plugin',
      packTier: 'pro',
      packTarByTier: {
        free: '/static/downloads/ae-ltd/ae-ltd-viral-free-v1.1.0.tar.gz',
        pro: '/static/downloads/ae-ltd/ae-ltd-creator-pro-v1.1.0.tar.gz'
      }
    })

    expect(pluginPackCommand).toContain('bundle/plugins/context7-docs')
    expect(pluginPackCommand).toContain('${AE_PLUGIN_DIR:-$HOME/.ae-ltd/plugins}')
  })
})
