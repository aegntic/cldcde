# AE.LTD Packs on CLDCDE

Distribution is centralized in `github.com/aegntic/cldcde` and published through the `cldcde.cc` website.

## Affiliation Footprint

- `cldcde.cc`
- `aegntic.ai`
- `ae.ltd`
- `clawreform.com`

## Included Sources

- Core + niche AE.LTD skills under `skills/`
- Curated plugins under `plugins/` including:
  - `notebooklm-pro`
  - `google-labs-extension`
  - `create-worktrees`
  - `mutation-tester`
  - `context7-docs`
  - `n8n-workflow`
  - `visual-regression`
- MCP assets under `mcp-servers/` including `quick-data` and `obsidian-elite-rag` from `aegntic-MCP`
- CLAUDE template baselines under `templates/claude-md/`

## Build

```bash
bun run packs:build
```

Outputs are published to `public/downloads/ae-ltd` and served via `/static/downloads/ae-ltd`.
