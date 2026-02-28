import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { MarketplaceItem } from '../../frontend/src/types/marketplace'

export type RepoCatalogCategory = 'plugin' | 'skill' | 'mcp' | 'workflow' | 'prompt'

export interface RepoCatalogItem extends MarketplaceItem {
  sourcePath: string
}

export interface RepoCatalog {
  generatedAt: string
  repoUrl: string
  items: RepoCatalogItem[]
}

interface ItemSeed {
  id: string
  kind: MarketplaceItem['kind']
  name: string
  summary: string
  tags: string[]
  installCommand: string
  repoUrl: string
  docsUrl?: string
  tier: MarketplaceItem['tier']
  releasedAt: string
  category: RepoCatalogCategory
  author: string
  sourcePath: string
}

const REPO_URL = 'https://github.com/aegntic/cldcde'
const RAW_REPO_URL = 'https://raw.githubusercontent.com/aegntic/cldcde/main'
const DEFAULT_PLATFORMS = ['macos', 'linux', 'windows']
const FEATURED_ITEM_COUNT = 6

const readText = (targetPath: string): string => {
  try {
    return readFileSync(targetPath, 'utf8')
  } catch {
    return ''
  }
}

const readJson = (targetPath: string): Record<string, any> | null => {
  try {
    return JSON.parse(readText(targetPath))
  } catch {
    return null
  }
}

const git = (repoRoot: string, args: string[]): string => {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
  } catch {
    return ''
  }
}

const dedupe = (values: string[]): string[] => {
  const seen = new Set<string>()
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const titleize = (value: string): string =>
  value
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())

const trimScope = (value: string): string => value.replace(/^@[^/]+\//, '')

const parseHeadingAndSummary = (text: string, fallbackName: string): { name: string; summary: string } => {
  if (!text.trim()) {
    return {
      name: titleize(fallbackName),
      summary: 'Repo-synced item. Add a README or metadata file for a richer listing.'
    }
  }

  const lines = text.split(/\r?\n/)
  const heading = lines.find((line) => /^#\s+/.test(line))?.replace(/^#\s+/, '').trim() || titleize(fallbackName)

  let inCode = false
  const summaryLines: string[] = []
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line.startsWith('```')) {
      inCode = !inCode
      continue
    }
    if (inCode || !line) {
      if (summaryLines.length) break
      continue
    }
    if (line.startsWith('#') || line.startsWith('>') || line.startsWith('- ') || /^\d+\./.test(line)) {
      continue
    }
    summaryLines.push(line)
    if (summaryLines.join(' ').length >= 220) break
  }

  return {
    name: heading,
    summary:
      summaryLines.join(' ').slice(0, 240) ||
      'Repo-synced item. Add a README or metadata file for a richer listing.'
  }
}

const parseDocstringSummary = (text: string): string => {
  const tripleQuote = text.match(/(?:"""|''')([\s\S]*?)(?:"""|''')/)
  if (!tripleQuote?.[1]) return ''
  return tripleQuote[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' ')
    .slice(0, 240)
}

const yamlScalar = (text: string, key: string): string => {
  const match = text.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, '') || ''
}

const yamlBlock = (text: string, key: string): string => {
  const lines = text.split(/\r?\n/)
  const start = lines.findIndex((line) => line.startsWith(`${key}: |`) || line.startsWith(`${key}: >`))
  if (start === -1) return ''

  const block: string[] = []
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (!line.startsWith('  ')) break
    block.push(line.slice(2).trim())
  }

  return block.join(' ').trim()
}

const yamlList = (text: string, key: string): string[] => {
  const lines = text.split(/\r?\n/)
  const start = lines.findIndex((line) => line.trim() === `${key}:`)
  if (start === -1) return []

  const values: string[] = []
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed) continue
    if (!trimmed.startsWith('- ')) break
    values.push(trimmed.slice(2).trim().replace(/^['"]|['"]$/g, ''))
  }
  return values
}

const tomlSection = (text: string, sectionName: string): string => {
  const match = text.match(new RegExp(`\\[${sectionName}\\]([\\s\\S]*?)(?:\\n\\[[^\\]]+\\]|$)`))
  return match?.[1] || ''
}

const tomlScalar = (text: string, key: string): string => {
  const match = text.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"`, 'm'))
  return match?.[1]?.trim() || ''
}

const tomlArray = (text: string, key: string): string[] => {
  const match = text.match(new RegExp(`^${key}\\s*=\\s*\\[(.+?)\\]`, 'm'))
  if (!match?.[1]) return []
  return Array.from(match[1].matchAll(/"([^"]+)"/g)).map((entry) => entry[1])
}

const inferTier = (tokens: string[]): MarketplaceItem['tier'] => {
  const haystack = tokens.join(' ').toLowerCase()
  return /\b(pro|premium|paid|enterprise)\b/.test(haystack) ? 'pro' : 'free'
}

export const classifyRepoPath = (repoPath: string): RepoCatalogCategory | null => {
  if (/^plugins\//.test(repoPath)) return 'plugin'
  if (/^skills\//.test(repoPath)) return 'skill'
  if (/^mcp-servers\//.test(repoPath) && !/\/prompts\//.test(repoPath)) return 'mcp'
  if (/^\.github\/workflows\/.+\.(yml|yaml)$/i.test(repoPath)) return 'workflow'
  if (/(^|\/)prompts\//.test(repoPath)) return 'prompt'
  return null
}

const newestFirst = <T extends { releasedAt: string; name: string }>(items: T[]): T[] =>
  [...items].sort((left, right) => {
    const diff = new Date(right.releasedAt).getTime() - new Date(left.releasedAt).getTime()
    if (diff !== 0) return diff
    return left.name.localeCompare(right.name)
  })

export const applyRepoFeatured = <T extends { featured?: boolean; releasedAt: string; name: string }>(items: T[]): T[] =>
  newestFirst(items).map((item, index) => ({
    ...item,
    featured: item.featured || index < FEATURED_ITEM_COUNT
  }))

const treeUrl = (repoPath: string): string => `${REPO_URL}/tree/main/${repoPath}`
const fileUrl = (repoPath: string): string => `${REPO_URL}/blob/main/${repoPath}`
const rawUrl = (repoPath: string): string => `${RAW_REPO_URL}/${repoPath}`

const repoCloneInstall = (repoPath: string, destination: string, postInstall?: string): string => {
  const script = [
    'tmp="$(mktemp -d)"',
    `git clone --depth=1 ${REPO_URL}.git "$tmp/cldcde"`,
    `mkdir -p "${destination}"`,
    `cp -R "$tmp/cldcde/${repoPath}" "${destination}/"`,
    postInstall || 'true',
    `echo "[OK] Installed ${repoPath}"`
  ]
  return script.join(' && \\\n')
}

const pluginInstallCommand = (repoPath: string): string =>
  repoCloneInstall(repoPath, '${AE_PLUGIN_DIR:-$HOME/.claude/plugins}')

const skillInstallCommand = (repoPath: string): string =>
  [
    'tmp="$(mktemp -d)"',
    `git clone --depth=1 ${REPO_URL}.git "$tmp/cldcde"`,
    'mkdir -p ~/.codex/skills ~/.zeroclaw/workspace/skills ~/.clawreform/workspace/skills',
    `cp -R "$tmp/cldcde/${repoPath}" ~/.codex/skills/`,
    `cp -R "$tmp/cldcde/${repoPath}" ~/.zeroclaw/workspace/skills/`,
    `cp -R "$tmp/cldcde/${repoPath}" ~/.clawreform/workspace/skills/`,
    `echo "[OK] Installed ${repoPath}"`
  ].join(' && \\\n')

const mcpInstallCommand = (repoPath: string): string => {
  const target = '${AE_MCP_DIR:-$HOME/.ae-ltd/mcp-servers}'
  return [
    'tmp="$(mktemp -d)"',
    `git clone --depth=1 ${REPO_URL}.git "$tmp/cldcde"`,
    `mkdir -p "${target}"`,
    `cp -R "$tmp/cldcde/${repoPath}" "${target}/"`,
    `cd "${target}/${path.posix.basename(repoPath)}"`,
    'if [ -f package.json ]; then npm install; elif [ -f pyproject.toml ]; then (command -v uv >/dev/null 2>&1 && uv sync) || python3 -m pip install -e .; elif [ -f requirements.txt ]; then python3 -m pip install -r requirements.txt; fi',
    `echo "[OK] Installed ${repoPath} to ${target}"`
  ].join(' && \\\n')
}

const workflowInstallCommand = (repoPath: string): string => {
  const fileName = path.posix.basename(repoPath)
  return [
    'mkdir -p .github/workflows',
    `curl -fsSL "${rawUrl(repoPath)}" -o ".github/workflows/${fileName}"`,
    `echo "[OK] Installed workflow ${fileName}"`
  ].join(' && \\\n')
}

const promptInstallCommand = (repoPath: string): string => {
  const fileName = path.posix.basename(repoPath)
  return [
    'target="${AE_PROMPT_DIR:-$HOME/.claude/prompts}"',
    'mkdir -p "$target"',
    `curl -fsSL "${rawUrl(repoPath)}" -o "$target/${fileName}"`,
    `echo "[OK] Installed prompt ${fileName} to $target"`
  ].join(' && \\\n')
}

const buildItem = (seed: ItemSeed): RepoCatalogItem => ({
  id: seed.id,
  kind: seed.kind,
  name: seed.name,
  slug: slugify(seed.id),
  summary: seed.summary,
  tags: dedupe([seed.category, ...seed.tags]),
  downloads: 0,
  rating: 5,
  verified: true,
  installCommand: seed.installCommand,
  repoUrl: seed.repoUrl,
  docsUrl: seed.docsUrl,
  tier: seed.tier,
  releasedAt: seed.releasedAt,
  category: seed.category,
  platform: DEFAULT_PLATFORMS,
  author: seed.author,
  featured: false,
  sourcePath: seed.sourcePath
})

const latestCommitIso = (repoRoot: string, repoPath: string): string => git(repoRoot, ['log', '-1', '--format=%cI', '--', repoPath]) || new Date().toISOString()

const pluginItem = (repoRoot: string, repoPath: string): RepoCatalogItem => {
  const dirPath = path.join(repoRoot, repoPath)
  const packageJson = readJson(path.join(dirPath, 'package.json'))
  const manifestJson = readJson(path.join(dirPath, '.claude-plugin', 'plugin.json')) || readJson(path.join(dirPath, 'manifest.json'))
  const pluginYamlText = readText(path.join(dirPath, 'plugin.yaml'))
  const readmeText = readText(path.join(dirPath, 'README.md'))
  const readme = parseHeadingAndSummary(readmeText, path.posix.basename(repoPath))

  const name =
    yamlScalar(pluginYamlText, 'name') ||
    trimScope(String(packageJson?.name || '')) ||
    String(manifestJson?.name || '') ||
    readme.name

  const summary =
    yamlBlock(pluginYamlText, 'description') ||
    yamlScalar(pluginYamlText, 'description') ||
    String(packageJson?.description || '') ||
    String(manifestJson?.description || '') ||
    readme.summary

  const tags = dedupe([
    ...yamlList(pluginYamlText, 'tags'),
    ...((packageJson?.keywords as string[] | undefined) || []),
    ...((manifestJson?.commands as any[] | undefined) || []).map((value) =>
      typeof value === 'string'
        ? titleize(path.posix.basename(value))
        : titleize(String(value?.name || value?.command || 'command'))
    ),
    path.posix.basename(repoPath)
  ])

  const author = yamlScalar(pluginYamlText, 'author') || String(packageJson?.author || '') || 'AE.LTD'
  const tier = inferTier([name, summary, ...tags])

  return buildItem({
    id: `plugin:${path.posix.basename(repoPath)}`,
    kind: 'extension',
    name: titleize(name),
    summary,
    tags,
    installCommand: pluginInstallCommand(repoPath),
    repoUrl: treeUrl(repoPath),
    docsUrl: readmeText ? fileUrl(`${repoPath}/README.md`) : treeUrl(repoPath),
    tier,
    releasedAt: latestCommitIso(repoRoot, repoPath),
    category: 'plugin',
    author,
    sourcePath: repoPath
  })
}

const skillItem = (repoRoot: string, repoPath: string): RepoCatalogItem => {
  const dirPath = path.join(repoRoot, repoPath)
  const skillTomlText = readText(path.join(dirPath, 'SKILL.toml'))
  const skillSection = tomlSection(skillTomlText, 'skill')
  const readmeText = readText(path.join(dirPath, 'SKILL.md'))
  const readme = parseHeadingAndSummary(readmeText, path.posix.basename(repoPath))

  const name = tomlScalar(skillSection, 'name') || readme.name
  const summary = tomlScalar(skillSection, 'description') || readme.summary
  const tags = dedupe([...tomlArray(skillSection, 'tags'), path.posix.basename(repoPath)])
  const author = tomlScalar(skillSection, 'author') || 'AE.LTD'
  const tier = inferTier([name, summary, ...tags])

  return buildItem({
    id: `skill:${path.posix.basename(repoPath)}`,
    kind: 'extension',
    name,
    summary,
    tags,
    installCommand: skillInstallCommand(repoPath),
    repoUrl: treeUrl(repoPath),
    docsUrl: fileUrl(`${repoPath}/SKILL.md`),
    tier,
    releasedAt: latestCommitIso(repoRoot, repoPath),
    category: 'skill',
    author,
    sourcePath: repoPath
  })
}

const mcpItem = (repoRoot: string, repoPath: string): RepoCatalogItem => {
  const dirPath = path.join(repoRoot, repoPath)
  const packageJson = readJson(path.join(dirPath, 'package.json'))
  const readmeText = readText(path.join(dirPath, 'README.md'))
  const readme = parseHeadingAndSummary(readmeText, path.posix.basename(repoPath))
  const pyprojectText = readText(path.join(dirPath, 'pyproject.toml'))
  const projectSection = tomlSection(pyprojectText, 'project')

  const name = trimScope(String(packageJson?.name || '')) || tomlScalar(projectSection, 'name') || readme.name
  const summary =
    String(packageJson?.description || '') || tomlScalar(projectSection, 'description') || readme.summary
  const tags = dedupe([...(packageJson?.keywords || []), 'mcp', path.posix.basename(repoPath)])
  const author = String(packageJson?.author || '') || 'AE.LTD'
  const tier = inferTier([name, summary, ...tags])

  return buildItem({
    id: `mcp:${path.posix.basename(repoPath)}`,
    kind: 'mcp',
    name: titleize(name),
    summary,
    tags,
    installCommand: mcpInstallCommand(repoPath),
    repoUrl: treeUrl(repoPath),
    docsUrl: readmeText ? fileUrl(`${repoPath}/README.md`) : treeUrl(repoPath),
    tier,
    releasedAt: latestCommitIso(repoRoot, repoPath),
    category: 'mcp',
    author,
    sourcePath: repoPath
  })
}

const workflowItem = (repoRoot: string, repoPath: string): RepoCatalogItem => {
  const fileText = readText(path.join(repoRoot, repoPath))
  const name = yamlScalar(fileText, 'name') || titleize(path.posix.basename(repoPath))
  const triggers = yamlScalar(fileText, 'on') || 'push / pull_request / workflow_dispatch'
  const summary = `GitHub workflow for ${triggers}. Ships repo changes through the CLDCDE automation path.`
  const tier = inferTier([name, summary])

  return buildItem({
    id: `workflow:${path.posix.basename(repoPath)}`,
    kind: 'extension',
    name,
    summary,
    tags: ['github-actions', 'automation', 'workflow'],
    installCommand: workflowInstallCommand(repoPath),
    repoUrl: fileUrl(repoPath),
    docsUrl: fileUrl(repoPath),
    tier,
    releasedAt: latestCommitIso(repoRoot, repoPath),
    category: 'workflow',
    author: 'GitHub Actions',
    sourcePath: repoPath
  })
}

const promptItem = (repoRoot: string, repoPath: string): RepoCatalogItem => {
  const fileText = readText(path.join(repoRoot, repoPath))
  const parsed = repoPath.endsWith('.py')
    ? {
        name: titleize(path.posix.basename(repoPath).replace(/_prompt$/, '')),
        summary: parseDocstringSummary(fileText) || 'Prompt asset extracted from the CLDCDE repo.'
      }
    : parseHeadingAndSummary(fileText, path.posix.basename(repoPath))

  const ownerMatch = repoPath.match(/^mcp-servers\/([^/]+)/)
  const owner = ownerMatch?.[1] ? titleize(ownerMatch[1]) : 'CLDCDE'
  const tier = inferTier([parsed.name, parsed.summary, owner])

  return buildItem({
    id: `prompt:${repoPath}`,
    kind: 'extension',
    name: parsed.name,
    summary: parsed.summary,
    tags: ['prompt', slugify(owner)],
    installCommand: promptInstallCommand(repoPath),
    repoUrl: fileUrl(repoPath),
    docsUrl: fileUrl(repoPath),
    tier,
    releasedAt: latestCommitIso(repoRoot, repoPath),
    category: 'prompt',
    author: owner,
    sourcePath: repoPath
  })
}

const pluginRoots = (trackedPaths: string[]): string[] =>
  Array.from(
    new Set(
      trackedPaths
        .filter((repoPath) => repoPath.startsWith('plugins/'))
        .map((repoPath) => repoPath.split('/').slice(0, 2).join('/'))
    )
  ).sort()

const skillRoots = (trackedPaths: string[]): string[] =>
  Array.from(
    new Set(
      trackedPaths
        .filter((repoPath) => /^skills\/[^/]+\/SKILL\.md$/.test(repoPath) || /^skills\/[^/]+\/SKILL\.toml$/.test(repoPath))
        .map((repoPath) => repoPath.split('/').slice(0, 2).join('/'))
    )
  ).sort()

const mcpRoots = (trackedPaths: string[]): string[] =>
  Array.from(
    new Set(
      trackedPaths
        .filter((repoPath) => repoPath.startsWith('mcp-servers/') && !/\/prompts\//.test(repoPath))
        .map((repoPath) => repoPath.split('/').slice(0, 2).join('/'))
    )
  ).sort()

const workflowPaths = (trackedPaths: string[]): string[] =>
  trackedPaths.filter((repoPath) => /^\.github\/workflows\/[^/]+\.(yml|yaml)$/i.test(repoPath)).sort()

const promptPaths = (trackedPaths: string[]): string[] =>
  trackedPaths
    .filter((repoPath) => /(^|\/)prompts\//.test(repoPath))
    .filter((repoPath) => !/\/tests\//.test(repoPath))
    .filter((repoPath) => !repoPath.endsWith('__init__.py'))
    .filter((repoPath) => /\.(md|txt|py|yaml|yml)$/i.test(repoPath))
    .sort()

export const buildRepoCatalog = (repoRoot: string): RepoCatalog => {
  const trackedPaths = git(repoRoot, ['ls-files'])
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)

  const items: RepoCatalogItem[] = []

  for (const repoPath of pluginRoots(trackedPaths)) {
    items.push(pluginItem(repoRoot, repoPath))
  }

  for (const repoPath of skillRoots(trackedPaths)) {
    items.push(skillItem(repoRoot, repoPath))
  }

  for (const repoPath of mcpRoots(trackedPaths)) {
    items.push(mcpItem(repoRoot, repoPath))
  }

  for (const repoPath of workflowPaths(trackedPaths)) {
    items.push(workflowItem(repoRoot, repoPath))
  }

  for (const repoPath of promptPaths(trackedPaths)) {
    items.push(promptItem(repoRoot, repoPath))
  }

  const featuredItems = applyRepoFeatured(items)
  const sortedItems = newestFirst(featuredItems)

  return {
    generatedAt: new Date().toISOString(),
    repoUrl: REPO_URL,
    items: sortedItems
  }
}
