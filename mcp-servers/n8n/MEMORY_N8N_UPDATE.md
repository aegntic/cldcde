# n8n Update Process - Quick Reference

## Quick One-Command Update

For a complete update with tests and publish preparation:

```bash
npm run update:all
```

This single command will:
1. ✅ Check for n8n updates and ask for confirmation
2. ✅ Update all n8n dependencies to latest compatible versions
3. ✅ Run all 1,182 tests (933 unit + 249 integration)
4. ✅ Validate critical nodes
5. ✅ Build the project
6. ✅ Bump the version
7. ✅ Update README badges
8. ✅ Prepare everything for npm publish
9. ✅ Create a comprehensive commit

## Manual Steps (if needed)

### Quick Steps to Update n8n

```bash
# 1. Update n8n dependencies automatically
npm run update:n8n

# 2. Run tests
npm test

# 3. Validate the update
npm run validate

# 4. Build
npm run build

# 5. Bump version
npm version patch

# 6. Update README badges manually
# - Update version badge
# - Update n8n version badge

# 7. Commit and push
git add -A
git commit -m "chore: update n8n to vX.X.X

- Updated n8n from X.X.X to X.X.X
- Updated n8n-core from X.X.X to X.X.X
- Updated n8n-workflow from X.X.X to X.X.X
- Updated @n8n/n8n-nodes-langchain from X.X.X to X.X.X
- Rebuilt node database with XXX nodes
- Sanitized XXX workflow templates (if present)
- All 1,182 tests passing (933 unit, 249 integration)
- All validation tests passing

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main
```

## What the Commands Do

### `npm run update:all`
This comprehensive command:
1. Checks current branch and git status
2. Shows current versions and checks for updates
3. Updates all n8n dependencies to compatible versions
4. **Runs the complete test suite** (NEW!)
5. Validates critical nodes
6. Builds the project
7. Bumps the patch version
8. Updates version badges in README
9. Creates a detailed commit with all changes
10. Provides next steps for GitHub release and npm publish

### `npm run update:n8n`
This command:
1. Checks for the latest n8n version
2. Updates n8n and all its required dependencies (n8n-core, n8n-workflow, @n8n/n8n-nodes-langchain)
3. Runs `npm install` to update package-lock.json
4. Automatically rebuilds the node database
5. Sanitizes any workflow templates to remove API tokens
6. Shows you exactly what versions were updated

### `npm run validate`
- Validates critical nodes (httpRequest, code, slack, agent)
- Shows database statistics
- Confirms everything is working correctly

### `npm test`
- Runs all 1,182 tests
- Unit tests: 933 tests across 30 files
- Integration tests: 249 tests across 14 files
- Must pass before publishing!

## Important Notes

1. **Always run on main branch** - Make sure you're on main and it's clean
2. **The update script is smart** - It automatically syncs all n8n dependencies to compatible versions
3. **Tests are required** - The publish script now runs tests automatically
4. **Database rebuild is automatic** - The update script handles this for you
5. **Template sanitization is automatic** - Any API tokens in workflow templates are replaced with placeholders
6. **Docker image builds automatically** - Pushing to GitHub triggers the workflow

## GitHub Push Protection

As of July 2025, GitHub's push protection may block database pushes if they contain API tokens in workflow templates. Our rebuild process now automatically sanitizes these tokens, but if you encounter push protection errors:

1. Make sure you've run the latest rebuild with `npm run rebuild`
2. Verify sanitization with `npm run sanitize:templates`
3. If push is still blocked, use the GitHub web interface to review and allow the push

## Time Estimate
- Total time: ~5-7 minutes
- Test suite: ~2.5 minutes
- npm install and database rebuild: ~2-3 minutes
- The rest: seconds

## Troubleshooting

If tests fail:
1. Check the test output for specific failures
2. Run `npm run test:unit` or `npm run test:integration` separately
3. Fix any issues before proceeding with the update

If validation fails:
1. Check the error message - usually it's a node type reference issue
2. The update script handles most compatibility issues automatically
3. If needed, check the GitHub Actions logs for the dependency update workflow

## Alternative: Check First
To see what would be updated without making changes:
```bash
npm run update:n8n:check
```

This shows you the available updates without modifying anything.

## Publishing to npm

After updating:
```bash
# Prepare for publish (runs tests automatically)
npm run prepare:publish

# Follow the instructions to publish with OTP
cd npm-publish-temp
npm publish --otp=YOUR_OTP_CODE
```

## Creating a GitHub Release

After pushing:
```bash
gh release create vX.X.X --title "vX.X.X" --notes "Updated n8n to vX.X.X"
```