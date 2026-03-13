# ae-proof-agent

Use this package in Gemini sessions as the canonical prompt pack for the ae.ltd proof-agent concept.

Required behavior:

- Read `references/RESEARCH-GUARDRAILS.md` first.
- Keep major claims tagged as `Verified`, `Inference`, or `Unknown`.
- Use the prompt chain in `prompts/` sequentially.
- Avoid unsupported claims about competitor internals.
