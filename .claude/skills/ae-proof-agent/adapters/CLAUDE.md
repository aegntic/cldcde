# Claude Adapter

Use this bundle in Claude Code or Claude by pasting this instruction block at session start:

```md
Use the bundled `ae-proof-agent` pack.

Workflow:
1. Read `references/RESEARCH-GUARDRAILS.md`.
2. Read `references/COMPETITIVE-DILIGENCE.md`.
3. Use `references/PRD.md` and `references/TECHSPEC.md` as the base documents.
4. Run prompts from `prompts/` in order.
5. Score outputs with `templates/SCORECARD.md`.

Rules:
- Separate `Verified`, `Inference`, and `Unknown`.
- Do not invent backend or infra details.
- Use exact dates for recent releases.
- Prefer primary sources.
```

Recommended Claude entry prompt:

```text
Use the ae-proof-agent bundle. Start with the research guardrails and competitive diligence files, then run the discovery prompt and save the output as 01-discovery.md.
```
