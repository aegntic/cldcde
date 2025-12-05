# Codecov Setup Guide

This guide explains how to set up and configure Codecov for the n8n-MCP project.

## Prerequisites

1. A Codecov account (sign up at https://codecov.io)
2. Repository admin access to add the CODECOV_TOKEN secret

## Setup Steps

### 1. Get Your Codecov Token

1. Sign in to [Codecov](https://codecov.io)
2. Add your repository: `czlonkowski/n8n-mcp`
3. Copy the upload token from the repository settings

### 2. Add Token to GitHub Secrets

1. Go to your GitHub repository settings
2. Navigate to `Settings` → `Secrets and variables` → `Actions`
3. Click "New repository secret"
4. Name: `CODECOV_TOKEN`
5. Value: Paste your Codecov token
6. Click "Add secret"

### 3. Update the Badge Token

Edit the README.md file and replace `YOUR_TOKEN` in the Codecov badge with your actual token:

```markdown
[![codecov](https://codecov.io/gh/czlonkowski/n8n-mcp/graph/badge.svg?token=YOUR_ACTUAL_TOKEN)](https://codecov.io/gh/czlonkowski/n8n-mcp)
```

Note: The token in the badge URL is a read-only token and safe to commit.

## Configuration Details

### codecov.yml

The configuration file sets:
- **Target coverage**: 80% for both project and patch
- **Coverage precision**: 2 decimal places
- **Comment behavior**: Comments on all PRs with coverage changes
- **Ignored files**: Test files, scripts, node_modules, and build outputs

### GitHub Actions

The workflow:
1. Runs tests with coverage using `npm run test:coverage`
2. Generates LCOV format coverage report
3. Uploads to Codecov using the official action
4. Fails the build if upload fails

### Vitest Configuration

Coverage settings in `vitest.config.ts`:
- **Provider**: V8 (fast and accurate)
- **Reporters**: text, json, html, and lcov
- **Thresholds**: 80% lines, 80% functions, 75% branches, 80% statements

## Viewing Coverage

### Local Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

### Online Coverage

1. Visit https://codecov.io/gh/czlonkowski/n8n-mcp
2. View detailed reports, graphs, and file-by-file coverage
3. Check PR comments for coverage changes

## Troubleshooting

### Coverage Not Uploading

1. Verify CODECOV_TOKEN is set in GitHub secrets
2. Check GitHub Actions logs for errors
3. Ensure coverage/lcov.info is generated

### Badge Not Showing

1. Wait a few minutes after first upload
2. Verify the token in the badge URL is correct
3. Check if the repository is public/private settings match

### Low Coverage Areas

Current areas with lower coverage that could be improved:
- HTTP server implementations
- MCP index files
- Some edge cases in validators

## Best Practices

1. **Write tests first**: Aim for TDD when adding features
2. **Focus on critical paths**: Prioritize testing core functionality
3. **Mock external dependencies**: Use MSW for HTTP, mock for databases
4. **Keep coverage realistic**: 80% is good, 100% isn't always practical
5. **Monitor trends**: Watch coverage over time, not just absolute numbers

## Resources

- [Codecov Documentation](https://docs.codecov.io/)
- [Vitest Coverage](https://vitest.dev/guide/coverage.html)
- [GitHub Actions + Codecov](https://github.com/codecov/codecov-action)