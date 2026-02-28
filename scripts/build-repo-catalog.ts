import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { buildRepoCatalog } from './lib/repoCatalog'

const repoRoot = path.resolve(import.meta.dir, '..')
const outputPath = process.argv[2]

if (!outputPath) {
  console.error('Usage: bun scripts/build-repo-catalog.ts <output-path>')
  process.exit(1)
}

const catalog = buildRepoCatalog(repoRoot)
mkdirSync(path.dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
console.log(`[OK] Repo catalog written to ${outputPath} (${catalog.items.length} items)`)
