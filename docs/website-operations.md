# CLDCDE Website Operations

This runbook defines the canonical way to build, validate, preview, and deploy `cldcde.cc`.

## Source of Truth

- Frontend app source: `frontend/src/`
- Worker/API source: `src/`
- Cloudflare Pages artifact: `.pages-dist/` (generated)
- Pack downloads served by website: `public/downloads/ae-ltd/`
- Deploy workflow: `.github/workflows/deploy.yml`

## Required Tools

- Bun 1.x
- Python 3 (for local preview + packager)
- Wrangler CLI authenticated to Cloudflare account

## Local Workflow

1. Install dependencies:
```bash
bun install
```

2. Build Pages artifact:
```bash
bun run site:build
```

3. Validate artifact:
```bash
bun run site:check
```

4. Preview locally:
```bash
bun run site:preview
# open http://127.0.0.1:4173
```

## Pack Workflow (AE.LTD bundles)

1. Validate skill metadata (requires PyYAML):
```bash
bun run packs:validate-skills
```

2. Build downloadable packs:
```bash
bun run packs:build
```

3. Rebuild site bundle to include updated downloads:
```bash
bun run site:build
bun run site:check
```

## Production Deploy

Safe deploy (clean working tree recommended):
```bash
bun run site:deploy
wrangler deploy -c wrangler.toml
```

Optional local hot deploy from a dirty tree:
```bash
bun run site:deploy:dirty
```

Run DB schema migration when schema changes:
```bash
wrangler d1 execute cldcde-content --file=./migrations/001_initial_schema.sql
```

## CI/CD Behavior

- Pull requests: run tests + build/validate only
- Push to `main` (and manual dispatch): deploy worker, deploy Pages, run D1 migration
- Deploys use `.pages-dist` to avoid publishing incorrect artifacts

## Required GitHub Secrets

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ZONE_ID` (optional, only for cache purge step)
