# Gemini Adapter

Use this bundle in Gemini CLI or Gemini-based agents as a shared prompt pack.

Bootstrap instruction:

```text
Load the ae-proof-agent bundle. Read references/RESEARCH-GUARDRAILS.md first, then references/COMPETITIVE-DILIGENCE.md. Use the prompt files in prompts/ sequentially and keep all major claims tagged as Verified, Inference, or Unknown.
```

Gemini-specific guidance:

- Keep outputs compact and source-grounded.
- Do not smooth over missing evidence with speculation.
- Prefer using the scorecard after each major draft, not only at the end.
