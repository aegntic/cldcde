# Security Policy

## Supported Versions

We actively maintain the latest release. Security fixes are applied to the
main branch and released as soon as possible.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report security issues privately via GitHub's built-in private vulnerability
reporting:

1. Go to the [Security tab](../../security) of this repository.
2. Click **"Report a vulnerability"**.
3. Fill in the details and submit.

You can also email the maintainers directly at the address listed in the
repository's GitHub profile if private reporting is unavailable.

We aim to acknowledge reports within **48 hours** and provide a remediation
timeline within **7 days**.

## Secrets Management

- All secrets (API tokens, passwords, private keys) **must** be stored in
  [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
  or Cloudflare's secrets store — never committed to the repository.
- Use `.env.example` as a template with placeholder values only.
- Cloudflare Worker secrets should be set via `wrangler secret put` or the
  Cloudflare dashboard, not in `wrangler.toml` or source files.
- Account-specific dashboard URLs (e.g. `dash.cloudflare.com/<account-id>`)
  and internal identifiers must not appear in documentation or code. Use the
  base URL `https://dash.cloudflare.com/` with a note to log in instead.

## Secret Scanning

This repository uses [Gitleaks](https://github.com/gitleaks/gitleaks) to scan
for accidentally committed secrets:

- **CI**: A GitHub Actions workflow runs on every push and pull request.
- **Local**: Install [pre-commit](https://pre-commit.com/) and run
  `pre-commit install` to enable the Gitleaks hook before each commit:

  ```bash
  pip install pre-commit   # or: brew install pre-commit
  pre-commit install
  ```

If a secret is accidentally committed, **rotate it immediately** and follow
[GitHub's guide on removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).
