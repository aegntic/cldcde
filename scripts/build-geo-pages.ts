import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const outDir = process.argv[2] || path.join(process.cwd(), '.pages-dist')
const catalogPath = path.join(outDir, 'static/catalog/repo-index.json')

interface CatalogFile {
  generatedAt?: string
  items?: Array<{ slug: string; name: string; kind: string; summary: string; installCommand?: string; tier?: string }>
}

const origin = 'https://cldcde.cc'
const staticPages = ['/', '/extensions', '/mcp', '/packs', '/pricing', '/docs', '/news', '/llms.txt']

const sitemapUrls = [...staticPages]

if (existsSync(catalogPath)) {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as CatalogFile
  for (const item of catalog.items || []) {
    const slug = item.slug || item.name
    if (!slug) continue
    const folder = item.kind === 'mcp' ? 'mcp' : item.kind === 'pack' ? 'packs' : item.kind === 'skill' ? 'skills' : 'plugins'
    const dir = path.join(outDir, folder, slug)
    mkdirSync(dir, { recursive: true })
    const url = `${origin}/${folder}/${slug}`
    sitemapUrls.push(`/${folder}/${slug}`)
    writeFileSync(
      path.join(dir, 'index.html'),
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${item.name} — CLDCDE</title><meta name="description" content="${(item.summary || '').replace(/"/g, '&quot;')}"><link rel="canonical" href="${url}"></head><body><h1>${item.name}</h1><p>${item.summary || ''}</p><pre>${item.installCommand || ''}</pre><p>Tier: ${item.tier || 'free'}</p><p><a href="${origin}">Back to CLDCDE</a></p></body></html>`
    )
    writeFileSync(path.join(dir, `${slug}.md`), `# ${item.name}\n\n${item.summary || ''}\n\nInstall:\n\n\`\`\`\n${item.installCommand || ''}\n\`\`\`\n`)
  }
}

writeFileSync(
  path.join(outDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls
    .map((url) => `  <url><loc>${origin}${url === '/' ? '/' : url}</loc></url>`)
    .join('\n')}\n</urlset>\n`
)

console.log(`[OK] GEO pages + sitemap written (${sitemapUrls.length} urls)`)
