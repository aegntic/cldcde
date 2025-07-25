# Repository Cleanup Plan for aegntic/cldcde

## Current Issues
- Multiple deployment configurations (wrangler.toml, wrangler-v2.toml, wrangler-ultra.toml)
- Scattered documentation (12+ markdown files at root level)
- Redundant API implementations (worker.ts, worker-v2.ts, worker-ultra.ts)
- Mixed build artifacts and source code
- Inconsistent naming conventions
- Multiple setup wizards and scripts

## Proposed Clean Structure

```
cldcde/
├── README.md                     # Main project overview
├── CONTRIBUTING.md               # How to contribute
├── LICENSE                       # MIT license
├── CHANGELOG.md                  # Version history
├── .gitignore                   # Comprehensive gitignore
├── package.json                 # Main package file
├── tsconfig.json                # TypeScript config
├── wrangler.toml.template       # Cloudflare config template
│
├── docs/                        # All documentation
│   ├── deployment/
│   │   ├── cloudflare.md
│   │   ├── supabase.md
│   │   └── zero-cost-guide.md
│   ├── setup/
│   │   ├── github-oauth.md
│   │   └── environment.md
│   └── architecture/
│       ├── overview.md
│       └── database-schema.md
│
├── src/                         # Main application code
│   ├── worker.ts               # Single main worker
│   ├── api/                    # API endpoints
│   ├── db/                     # Database connections
│   ├── auth/                   # Authentication
│   ├── cache/                  # Caching layer
│   ├── search/                 # Search functionality
│   └── types/                  # TypeScript types
│
├── frontend/                    # React frontend
│   ├── src/
│   ├── dist/                   # Build output (gitignored)
│   └── package.json
│
├── scripts/                     # Utility scripts
│   ├── setup.ts               # Single setup script
│   ├── migrate.ts              # Database migrations
│   └── deploy.ts               # Deployment helper
│
├── migrations/                  # Database migrations
│   └── supabase/
│
└── tests/                       # Test files
    ├── api/
    └── frontend/
```

## Cleanup Actions

### 1. Consolidate Documentation
- Move all docs to `docs/` folder with logical structure
- Remove duplicate/outdated files
- Create comprehensive README.md

### 2. Simplify Deployment
- Keep one wrangler.toml.template
- Remove versioned deployment files
- Single deployment script

### 3. Clean Source Code
- Consolidate worker files into single worker.ts
- Remove redundant API versions
- Standardize naming conventions

### 4. Remove Build Artifacts
- Clean dist/, node_modules/, target/
- Update .gitignore to be comprehensive
- Remove log files and temporary files

### 5. Organize Scripts
- Single setup script instead of multiple wizards
- Remove redundant installation scripts
- Keep only essential utility scripts

## Files to Delete
- Multiple wrangler configs (keep template only)
- Redundant deployment docs
- Old worker versions
- Log files and screenshots
- Temporary test files
- Multiple setup wizards

## Files to Keep
- Core application code (src/)
- Frontend application
- Database schemas
- Essential scripts
- License and main README