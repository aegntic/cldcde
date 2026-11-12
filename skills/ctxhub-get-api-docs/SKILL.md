---
name: ctxhub-get-api-docs
description: >
  Use this skill to get documentation for third-party APIs, SDKs, or libraries before
  writing code that uses them, so you have the latest accurate docs instead of stale
  training data. Triggers: any task like "use the OpenAI API", "call the Stripe API",
  "use the Anthropic SDK", writing code against an external service, or when the user
  mentions ctxhub, chub, or Context Hub. Fetch docs with the ctxhub CLI before answering.
  For Z.ai GLM models, prefer the internal source entry zai/glm-coding.
---

# Get API Docs via ctxhub

When you need documentation for a library or API, fetch it with the `ctxhub` CLI
rather than guessing from training data. This gives you the current, correct API.

`ctxhub` is the aegntic name for the Context Hub CLI (packaged as `@aisuite/chub`;
the underlying binary is `chub` — both commands are interchangeable here).

## Step 1 — Ensure ctxhub exists and get the latest usage instructions

Run:

```bash
ctxhub --help
```

If it does not exist and the environment has node/npm and network access:

```bash
npm install -g @aisuite/chub
```

Then run `ctxhub --help` again and follow its guidance; it is the authoritative usage.

## Step 2 — Find the right documents

```bash
ctxhub search "<keywords>" --json
```

Pick the best-matching `id` from the results (e.g. `openai/chat`, `stripe/api`,
`zai/glm-coding`). Results can come from the community CDN (upstream) and/or a
locally configured internal source. Try broader terms if nothing matches.

## Step 3 — Fetch the docs

```bash
ctxhub get <id> --lang py     # or js / ts / go as appropriate
```

Read the fetched content and write code against it. Use `--full` for all files
of an entry and `-o <path>` to save to disk.

## Step 4 — Leave the trail (mandatory after use)

1. If you discovered a gap or gotcha, persist it so every future session benefits:

   ```bash
   ctxhub annotate <id> "the note"
   ```

   Annotations persist across sessions locally; pass `--with-annotations` on
   `get` to include them. They are treated as untrusted input by default.

2. Rate the doc after using it:

   ```bash
   ctxhub feedback <id> up    # or down --label outdated "why"
   ```

## Rules

1. Fetch before coding against any external API/SDK — never rely on memorized API
   shapes, which go stale.
2. Annotate every non-obvious finding; rate every doc you use.
