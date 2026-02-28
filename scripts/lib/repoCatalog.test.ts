import { describe, expect, test } from 'bun:test'
import { applyRepoFeatured, classifyRepoPath } from './repoCatalog'

describe('repoCatalog', () => {
  test('classifies repo paths into catalog categories', () => {
    expect(classifyRepoPath('plugins/google-labs-extension/package.json')).toBe('plugin')
    expect(classifyRepoPath('skills/ae-ltd-context7-radar/SKILL.toml')).toBe('skill')
    expect(classifyRepoPath('mcp-servers/quick-data/main.py')).toBe('mcp')
    expect(classifyRepoPath('.github/workflows/deploy.yml')).toBe('workflow')
    expect(classifyRepoPath('mcp-servers/obsidian-elite-rag/prompts/ai-collaboration.md')).toBe('prompt')
    expect(classifyRepoPath('README.md')).toBeNull()
  })

  test('marks the newest repo items as featured first', () => {
    const featured = applyRepoFeatured([
      { name: 'Old', releasedAt: '2026-02-01T00:00:00.000Z', featured: false },
      { name: 'Newest', releasedAt: '2026-02-04T00:00:00.000Z', featured: false },
      { name: 'Mid', releasedAt: '2026-02-03T00:00:00.000Z', featured: false }
    ])

    expect(featured.map((item) => item.name)).toEqual(['Newest', 'Mid', 'Old'])
    expect(featured.every((item) => item.featured)).toBe(true)
  })
})
