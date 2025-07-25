# CLDCDE+ Branding Guidelines

## Official Product Name

**Always use `CLDCDE+` (with the plus symbol) when referring to the product.**

## 🚨 **IMPORTANT EXCEPTION: Domain Names**

The website domain `cldcde.cc` does NOT use the plus symbol. This is the ONLY exception to the CLDCDE+ rule.

### ✅ Correct Domain Usage
- `cldcde.cc` (main website)
- `https://cldcde.cc`
- `api.cldcde.cc`
- `@cldcde_cc` (social handles where needed)

### ❌ Incorrect Domain Usage  
- ~~`cldcde+.cc`~~ (never use plus in domain)
- ~~`https://cldcde+.cc`~~

### ✅ Correct Usage
- `CLDCDE+` (product name)
- `CLDCDE+ (Claude Code Plus)`
- `cldcde.cc` (website domain - EXCEPTION: no plus symbol)
- `@cld/package-name` (npm packages)
- `~/.cld/` (local directories)
- `github.com/cldcde+/repo-name` (GitHub repositories)

### ❌ Incorrect Usage
- ~~`CLDCDE`~~ (missing plus symbol)
- ~~`cldcde`~~ (lowercase without plus)
- ~~`CLDCDE Plus`~~ (written out instead of symbol)
- ~~`Claude Code Extras`~~ (old terminology)

## Terminology Guidelines

### Use These Terms Instead of "Extras"
1. **"Plus"** - Primary alternative (e.g., "Claude Code Plus")
2. **"Add-ons"** - When referring to extensions/plugins (e.g., "add-on suite")
3. **"Plug-ins"** - When referring to modular components
4. **"Extensions"** - When referring to functional extensions

### ✅ Approved Terms
- Claude Code Plus
- CLDCDE+ add-ons
- Plus features
- Add-on suite
- Extension suite
- Enhancement suite (acceptable)

### ❌ Deprecated Terms
- ~~Claude Code Extras~~
- ~~CLDCDE Extras~~
- ~~extras directory~~
- ~~extra features~~

## Directory and Package Naming

### ✅ Correct Directory Names
- `~/.cld/` (main configuration directory)
- `~/.cld/config/` (configuration files)
- `~/.cld/themes/` (custom themes)
- `~/.cld/experiments/` (experimental features)

### ✅ Correct Package Names
- `@cld/package-name` (npm packages)
- `@cld/filesystem-mcp` (MCP servers)
- `@cld/database-mcp` (database integrations)

### ❌ Deprecated Directory/Package Names
- ~~`~/.claude-extras/`~~
- ~~`~/.claude-plus/`~~
- ~~`~/.cldcde+/`~~
- ~~`@cldcde+/package-name`~~
- ~~`@cldcde/package-name`~~


## File and Code References

### Package Names
```json
{
  "name": "@cld/package-name",
  "description": "CLDCDE+ package description"
}
```

### URLs and Domains
- Primary domain: `cldcde.cc` (EXCEPTION: no plus symbol for domain)
- API endpoints: `api.cldcde.cc`
- CDN: `cdn.cldcde.cc`

### Social Media Handles
- Twitter/X: `@cldcdeplus_cc` (underscores for compatibility)
- GitHub: `cldcde+` (organization name)
- Discord: `CLDCDE+`

## Documentation Standards

### Headers and Titles
```markdown
# CLDCDE+ Settings Documentation
## What is CLDCDE+?
### CLDCDE+ Installation Guide
```

### Code Examples
```bash
# Check CLDCDE+ status
cldcde+ status

# Install CLDCDE+ add-ons
curl -fsSL https://cldcde+.cc/install | bash
```

### Meta Tags and SEO
```html
<title>CLDCDE+ - Claude Code Plus Hub</title>
<meta name="description" content="CLDCDE+ is the unofficial Claude Code Plus platform for add-ons and extensions">
<meta property="og:title" content="CLDCDE+ - Claude Code Plus">
```

## Implementation Rules

### 1. Global Replace Rules
When updating existing content:
- `CLDCDE` → `CLDCDE+` (add plus symbol for product name)
- `Claude Code Extras` → `Claude Code Plus`
- `cldcde.cc` → `cldcde.cc` (KEEP AS IS - domain exception)
- `@cldcde/` → `@cld/` (simplified package namespace)
- `~/.claude-extras/` → `~/.cld/` (simplified directory)
- `~/.claude-plus/` → `~/.cld/` (simplified directory)
- `~/.cldcde+/` → `~/.cld/` (simplified directory)

### 2. New Content Rules
For all new content:
- Always include the `+` symbol in CLDCDE+
- Use "plus", "add-ons", or "plug-ins" instead of "extras"
- Reference `cldcde.cc` for the website domain (no plus symbol)
- Use `@cld/` for package namespaces
- Use `~/.cld/` for local directories

### 3. Code Standards
```typescript
// ✅ Correct
const config = {
  name: 'cldcde.cc',
  title: 'CLDCDE+ - Claude Code Plus Hub'
}

// ❌ Incorrect
const config = {
  name: 'cldcde.cc',
  title: 'CLDCDE - Claude Code Extras'
}
```

### 4. API Responses
```json
{
  "platform": "CLDCDE+",
  "description": "Claude Code Plus add-ons platform",
  "website": "https://cldcde.cc"
}
```

## Checklist for New Features

When adding new features or content, ensure:

- [ ] Product name uses `CLDCDE+` with plus symbol
- [ ] No usage of "extras" terminology
- [ ] URLs reference `cldcde.cc` domain (no plus symbol)
- [ ] Package names use `@cld/` namespace
- [ ] Directory paths use `~/.cld/`
- [ ] Documentation titles include `CLDCDE+`
- [ ] Meta tags and SEO use "Claude Code Plus"
- [ ] Social media references use consistent handles

## Migration Notes

### Backward Compatibility
- Old URLs should redirect to new `+` versions
- Legacy environment variables should be supported with deprecation warnings
- Old package names should show migration notices

### Deprecation Timeline
1. **Phase 1** (Current): Update all new content to use CLDCDE+
2. **Phase 2** (Next): Add deprecation warnings for old terminology
3. **Phase 3** (Future): Remove support for legacy naming

## Questions?

If you're unsure about branding usage:
1. Check this document first
2. Look for examples in recently updated files
3. Follow the pattern: always include the `+` symbol
4. Use "plus" or "add-ons" instead of "extras"

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Status**: Active Guidelines