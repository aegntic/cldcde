# AE.LTD Packager (`aegntic/cldcde`)

Builds self-contained pack artifacts for `cldcde.cc`, branded for AE.LTD and affiliated projects (`aegntic.ai`, `ae.ltd`, `clawreform.com`).

## Output

Artifacts are written to:

- `public/downloads/ae-ltd/*.zip`
- `public/downloads/ae-ltd/*.tar.gz`
- `public/downloads/ae-ltd/latest.json`
- `public/downloads/ae-ltd/build-report.json`
- `public/downloads/ae-ltd/checksums.txt`

These are web-servable via:

- `/static/downloads/ae-ltd/...`

## Build

```bash
cd website/ae-ltd-packager
python3 scripts/build_packs.py
```

Build a single pack:

```bash
cd website/ae-ltd-packager
python3 scripts/build_packs.py --only ae-ltd-viral-free
```

Validate skill metadata:

```bash
cd website/ae-ltd-packager
python3 scripts/validate_skills.py
```

## Install from a Pack

After extracting a built archive:

```bash
python install/install.py \
  --install-skills \
  --install-agent-zero \
  --install-zeroclaw
```

Optional Agent Zero path override:

```bash
python install/install.py --install-agent-zero --agent-zero-path "/path/to/agent-zero-data/skills"
```
