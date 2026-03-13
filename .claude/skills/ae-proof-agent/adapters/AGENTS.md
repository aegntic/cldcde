# Agent Bundle Adapter

This file exists for tools that look for `AGENTS.md` as the local agent-instruction entrypoint.

Use the `ae-proof-agent` package in this folder.

Required process:

1. Read `references/RESEARCH-GUARDRAILS.md`.
2. Read `references/COMPETITIVE-DILIGENCE.md`.
3. Use `references/PRD.md` and `references/TECHSPEC.md` as the baseline specification.
4. Execute prompt files in `prompts/` in order.
5. Score or compare outputs with `templates/SCORECARD.md`.

Required standards:

- Label material as `Verified`, `Inference`, or `Unknown`.
- Avoid unsupported backend claims.
- Use exact dates for recent releases.
- Prefer primary sources and decision-useful analysis.
