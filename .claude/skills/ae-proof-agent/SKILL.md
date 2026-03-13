---
name: ae-proof-agent
description: Diligence-grade product and technical analysis for the ae.ltd proof-agent concept, including comparison against Cursor and Omnara, MVP and production architecture, red-team review, and build-vs-buy evaluation. Use when Codex needs to create or critique PRDs, tech specs, competitive diligence, leadership memos, or multi-agent evaluation packs for agent-runtime, demo-agent, or proof-agent products.
---

# ae-proof-agent

Read `references/RESEARCH-GUARDRAILS.md` first.

Then use the bundle in this order:

1. Read `references/COMPETITIVE-DILIGENCE.md`.
2. Use `references/PRD.md` and `references/TECHSPEC.md` as the base spec.
3. Run the prompt chain in `prompts/` when generating comparable multi-agent outputs.
4. Score outputs with `templates/SCORECARD.md`.
5. Assemble the final memo with `templates/FINAL-REPORT-OUTLINE.md`.

Rules:

- Separate `Verified`, `Inference`, and `Unknown`.
- Do not invent backend details, customer metrics, or infra choices.
- Use exact dates for recent releases and product changes.
- Prefer primary sources when browsing is required.
- Optimize for decision quality, not volume.

Use the prompt chain like this:

- `prompts/01-DISCOVERY.md` for a source-grounded brief
- `prompts/02-PRD.md` for product requirements
- `prompts/03-TECHSPEC.md` for implementation planning
- `prompts/04-REDTEAM.md` for failure analysis
- `prompts/05-SYNTHESIS.md` for the final leadership memo
