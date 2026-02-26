import { config } from '../config'
import type { MarketplaceFeatured, MarketplaceFilterState, MarketplaceItem } from '../types/marketplace'

type UnknownRecord = Record<string, any>
type PackTier = 'free' | 'pro'
type AssetKind = 'skill' | 'plugin'

const nowIso = () => new Date().toISOString()

const safeArray = (value: any): any[] => (Array.isArray(value) ? value : [])

const asNumber = (value: any, fallback = 0): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const asString = (value: any, fallback = ''): string => (typeof value === 'string' ? value : fallback)

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const normalizeInstallCommand = (value: any, fallbackName: string): string => {
  if (typeof value === 'string' && value.trim().length) return value
  return `npm install -g ${fallbackName}`
}

const normalizeTags = (value: any): string[] =>
  safeArray(value)
    .map((item) => asString(item).trim())
    .filter(Boolean)

const normalizePlatform = (value: any): string[] => {
  const items = normalizeTags(value)
  return items.length ? items : ['macos', 'linux', 'windows']
}

const normalizeDate = (value: any): string => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? nowIso() : parsed.toISOString()
}

const DEFAULT_PACK_TAR_BY_TIER: Record<PackTier, string> = {
  free: '/static/downloads/ae-ltd/ae-ltd-viral-free-v1.1.0.tar.gz',
  pro: '/static/downloads/ae-ltd/ae-ltd-creator-pro-v1.1.0.tar.gz'
}

const toAbsoluteUrl = (value: string, baseUrl: string): string => {
  if (!value) return value
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return `${baseUrl}${value.startsWith('/') ? value : `/${value}`}`
}

const derivePackRoot = (tarPath: string, fallbackRoot: string): string => {
  const fileName = tarPath.split('/').pop()
  if (!fileName || !fileName.endsWith('.tar.gz')) return fallbackRoot
  return fileName.replace(/\.tar\.gz$/, '')
}

export interface CatalogInstallCommandInput {
  id: string
  kind: AssetKind
  packTier: PackTier
  npmPackage?: string
  packTarByTier?: Record<PackTier, string>
  baseUrl?: string
}

export const selectCatalogInstallCommand = ({
  id,
  kind,
  packTier,
  npmPackage,
  packTarByTier = DEFAULT_PACK_TAR_BY_TIER,
  baseUrl = 'https://cldcde.cc'
}: CatalogInstallCommandInput): string => {
  if (npmPackage) {
    return `npm install -g ${npmPackage}`
  }

  const tarPath = packTarByTier[packTier]
  const tarUrl = toAbsoluteUrl(tarPath, baseUrl)
  const fallbackRoot = packTier === 'free' ? 'ae-ltd-viral-free-v1.1.0' : 'ae-ltd-creator-pro-v1.1.0'
  const packRoot = derivePackRoot(tarPath, fallbackRoot)

  if (kind === 'skill') {
    return `tmp="$(mktemp -d)" && \\
curl -fsSL "${tarUrl}" -o "$tmp/pack.tar.gz" && \\
tar -xzf "$tmp/pack.tar.gz" -C "$tmp" && \\
mkdir -p ~/.codex/skills ~/.zeroclaw/workspace/skills ~/.clawreform/workspace/skills && \\
cp -R "$tmp/${packRoot}/bundle/skills/${id}" ~/.codex/skills/ && \\
cp -R "$tmp/${packRoot}/bundle/skills/${id}" ~/.zeroclaw/workspace/skills/ && \\
cp -R "$tmp/${packRoot}/bundle/skills/${id}" ~/.clawreform/workspace/skills/ && \\
echo "[OK] Installed ${id}"`
  }

  return `tmp="$(mktemp -d)" && \\
curl -fsSL "${tarUrl}" -o "$tmp/pack.tar.gz" && \\
tar -xzf "$tmp/pack.tar.gz" -C "$tmp" && \\
target="\${AE_PLUGIN_DIR:-$HOME/.ae-ltd/plugins}" && \\
mkdir -p "$target" && \\
cp -R "$tmp/${packRoot}/bundle/plugins/${id}" "$target/" && \\
echo "[OK] Installed ${id} to $target"`
}

const normalizeExtensionLike = (
  item: UnknownRecord,
  kind: 'extension' | 'mcp',
  fallbackPrefix: string
): MarketplaceItem => {
  const name = asString(item.name, `${fallbackPrefix} item`)
  const slug = asString(item.slug, slugify(name || `${fallbackPrefix}-${item.id || 'item'}`))
  return {
    id: asString(item.id, slug || `${fallbackPrefix}-${Math.random().toString(16).slice(2, 8)}`),
    kind,
    name,
    slug,
    summary: asString(item.description || item.summary, 'No description provided yet.'),
    tags: normalizeTags(item.tags),
    downloads: asNumber(item.downloads),
    rating: asNumber(item.rating, 0),
    verified: Boolean(item.verified),
    installCommand: normalizeInstallCommand(item.installScript || item.install_command, `@aegntic/${slug || fallbackPrefix}`),
    repoUrl: asString(item.repository || item.repoUrl || item.homepage, ''),
    docsUrl: asString(item.documentation || item.docsUrl || item.docs || item.readme || item.homepage, ''),
    tier: kind === 'mcp' ? 'pro' : 'free',
    releasedAt: normalizeDate(item.updatedAt || item.updated_at || item.createdAt || item.created_at),
    category: asString(item.category, kind),
    platform: normalizePlatform(item.platform),
    author: asString(item.author, 'community'),
    featured: Boolean(item.featured)
  }
}

const normalizePack = (pack: UnknownRecord): MarketplaceItem => {
  const name = asString(pack.name, 'AE.LTD Pack')
  const slug = slugify(name || 'ae-ltd-pack')
  const tarGz = asString(pack.downloads?.tar_gz, '/static/downloads/ae-ltd/latest.tar.gz')
  const prefixName = asString(pack.id, slug || 'ae-ltd-pack')
  return {
    id: asString(pack.id, slug),
    kind: 'pack',
    name,
    slug,
    summary: asString(pack.tagline, 'Curated bundle of skills, plugins, workflows, and MCP integrations.'),
    tags: ['bundle', 'marketplace', 'skills', 'plugins'],
    downloads: asNumber(pack.counts?.plugins) + asNumber(pack.counts?.skills) + asNumber(pack.counts?.mcps),
    rating: pack.tier === 'pro' ? 4.9 : 4.7,
    verified: true,
    installCommand: `tmp="$(mktemp -d)" && curl -fsSL "https://cldcde.cc${tarGz}" -o "$tmp/pack.tar.gz" && tar -xzf "$tmp/pack.tar.gz" -C "$tmp" && python3 "$tmp/${prefixName}/install/install.py" --install-skills --install-agent-zero --install-zeroclaw`,
    repoUrl: 'https://github.com/aegntic/cldcde',
    docsUrl: 'https://github.com/aegntic/cldcde/tree/main/website/ae-ltd-packager',
    tier: pack.tier === 'pro' ? 'pro' : 'free',
    releasedAt: normalizeDate(pack.generated_at || pack.updated_at || pack.created_at),
    category: 'pack',
    platform: ['macos', 'linux', 'windows'],
    author: 'AE.LTD',
    featured: pack.tier === 'pro'
  }
}

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Request failed: ${url} (${res.status})`)
  }
  return res.json()
}

const normalizeFeaturedFeed = (raw: any, fallback: MarketplaceItem[]): MarketplaceFeatured => {
  const fromFeed = safeArray(raw?.items || raw?.featured_extensions || raw?.featured || raw?.data).map((item) =>
    normalizeExtensionLike(item, 'extension', 'featured')
  )

  const featured = fromFeed.length ? fromFeed.slice(0, 6) : fallback.filter((item) => item.featured).slice(0, 6)
  const trending = [...fallback].sort((a, b) => b.downloads - a.downloads).slice(0, 8)
  const newest = [...fallback]
    .sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime())
    .slice(0, 8)

  return { featured, trending, newest }
}

export const fetchMarketplaceCatalog = async (): Promise<MarketplaceItem[]> => {
  const [extensionsRaw, mcpRaw, packRaw] = await Promise.allSettled([
    fetchJson(`${config.api.baseUrl}/extensions`),
    fetchJson(`${config.api.baseUrl}/mcp`),
    fetchJson('/static/downloads/ae-ltd/latest.json')
  ])

  const extensions =
    extensionsRaw.status === 'fulfilled'
      ? safeArray(extensionsRaw.value.extensions || extensionsRaw.value.data).map((item) =>
          normalizeExtensionLike(item, 'extension', 'extension')
        )
      : []

  const mcpServers =
    mcpRaw.status === 'fulfilled'
      ? safeArray(mcpRaw.value.mcpServers || mcpRaw.value.data).map((item) =>
          normalizeExtensionLike(item, 'mcp', 'mcp')
        )
      : []

  const packs =
    packRaw.status === 'fulfilled'
      ? safeArray(packRaw.value.packs).map((pack) => normalizePack(pack))
      : []

  return [...extensions, ...mcpServers, ...packs]
}

export const fetchMarketplaceFeatured = async (fallback: MarketplaceItem[]): Promise<MarketplaceFeatured> => {
  try {
    const raw = await fetchJson(`${config.api.baseUrl}/featured`)
    return normalizeFeaturedFeed(raw, fallback)
  } catch {
    return normalizeFeaturedFeed({}, fallback)
  }
}

export const fetchMarketplaceNews = async (): Promise<Array<{ id: string; title: string; summary: string; publishedAt: string; tags: string[] }>> => {
  try {
    const raw = await fetchJson(`${config.api.baseUrl}/news`)
    const items = safeArray(raw.news || raw.data || raw)
    return items.slice(0, 12).map((item: UnknownRecord, index) => ({
      id: asString(item.id, String(index + 1)),
      title: asString(item.title, 'Untitled release note'),
      summary: asString(item.summary || item.excerpt || item.content, '').slice(0, 220),
      publishedAt: normalizeDate(item.published_at || item.created_at || item.updated_at),
      tags: normalizeTags(item.tags)
    }))
  } catch {
    return []
  }
}

export const applyMarketplaceFilters = (
  items: MarketplaceItem[],
  filters: MarketplaceFilterState
): MarketplaceItem[] => {
  const q = filters.search.trim().toLowerCase()

  const filtered = items.filter((item) => {
    if (filters.kind !== 'all' && item.kind !== filters.kind) return false
    if (filters.tier !== 'all' && item.tier !== filters.tier) return false
    if (filters.verifiedOnly && !item.verified) return false
    if (filters.category && filters.category !== 'all' && item.category !== filters.category) return false
    if (filters.tags.length > 0 && !filters.tags.every((tag) => item.tags.includes(tag))) return false

    if (!q) return true

    const haystack = [item.name, item.summary, item.tags.join(' '), item.author, item.category].join(' ').toLowerCase()
    return haystack.includes(q)
  })

  return filtered.sort((a, b) => {
    switch (filters.sort) {
      case 'downloads':
      case 'trending':
        return b.downloads - a.downloads
      case 'rating':
        return b.rating - a.rating
      case 'newest':
        return new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime()
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })
}
