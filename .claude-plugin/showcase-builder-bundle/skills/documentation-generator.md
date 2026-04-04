---
name: Documentation Generator
description: |
  Automatically generate beautiful documentation from GitHub README files and code comments. Creates interactive docs, API references, and guides with zero manual work. Syncs automatically with your repositories for always-up-to-date documentation.
---

## Overview

Documentation Generator transforms your README files and code into beautiful, searchable documentation. No more manual doc maintenance - just update your README and watch the docs regenerate automatically.

## Core Features

- ✅ **Auto-Sync** - Pulls from GitHub automatically
- ✅ **Markdown Processing** - Converts README to docs
- ✅ **API Reference** - Extracts from code comments
- ✅ **Interactive Examples** - Code snippets with syntax highlighting
- ✅ **Search** - Full-text search across all docs
- ✅ **Versioning** - Multiple documentation versions
- ✅ **Dark Mode** - Developer-friendly theme
- ✅ **Mobile Ready** - Responsive design

## Quick Start

### Setup

```bash
# Install dependencies
npm install react-markdown rehype-highlight remark-gfm

# Create docs directory
mkdir -p docs/[tool-name]
```

### Configure

```typescript
// docs.config.ts
export default {
  repositories: [
    {
      owner: 'your-username',
      name: 'tool-1',
      branch: 'main',
    },
    {
      owner: 'your-username',
      name: 'tool-2',
      branch: 'main',
    },
  ],
  outputDir: 'docs',
  syncInterval: '1h', // Auto-sync every hour
};
```

### Generate Docs

```bash
npm run docs:sync
```

## Document Structure

### Auto-Generated Layout

```
docs/
├── tool-1/
│   ├── index.mdx           # From README.md
│   ├── installation.mdx    # Install section
│   ├── usage.mdx          # Usage examples
│   ├── api.mdx            # API reference
│   └── contributing.mdx   # Contributing guide
├── tool-2/
│   └── ...
└── index.mdx              # Homepage
```

## README Processing

### Section Detection

```markdown
<!-- README.md -->

# Tool Name

## Description
This tool does amazing things...

## Installation
\`\`\`bash
npm install tool-name
\`\`\`

## Usage
\`\`\`typescript
import { Tool } from 'tool-name';
\`\`\`

## API
See API docs...

## Contributing
We welcome contributions...
```

**Converts to:**

```
docs/tool/
├── index.mdx          # Title + Description
├── installation.mdx   # Installation section
├── usage.mdx         # Usage section
├── api.mdx          # API section
└── contributing.mdx # Contributing section
```

## API Reference Generation

### JSDoc Extraction

```typescript
// src/index.ts

/**
 * Main tool class for processing data
 * @class DataProcessor
 * @example
 * const processor = new DataProcessor();
 * const result = await processor.process(data);
 */
export class DataProcessor {
  /**
   * Process input data and return results
   * @param {InputData} data - The data to process
   * @param {Options} options - Processing options
   * @returns {Promise<OutputData>} Processed data
   * @example
   * const result = await processor.process(
   *   { items: [1, 2, 3] },
   *   { parallel: true }
   * );
   */
  async process(
    data: InputData,
    options?: Options
  ): Promise<OutputData> {
    // Implementation
  }
}
```

**Generates:**

```markdown
<!-- docs/tool/api.mdx -->

# API Reference

## Class: DataProcessor

Main tool class for processing data

### Constructor

```typescript
const processor = new DataProcessor();
```

### Methods

#### process()

Process input data and return results

**Parameters:**
- `data` (InputData) - The data to process
- `options?` (Options) - Processing options

**Returns:** Promise<OutputData>

**Example:**

\`\`\`typescript
const result = await processor.process(
  { items: [1, 2, 3] },
  { parallel: true }
);
\`\`\`
```

## Interactive Examples

### Code Execution

```tsx
// components/ExampleViewer.tsx
'use client';

import { useState } from 'react';
import { Sandpack } from '@codesandbox/sandpack-react';

export function ExampleViewer({ code }: { code: string }) {
  const [view, setView] = useState('preview');

  return (
    <div className="example">
      <div className="example-header">
        <button onClick={() => setView('code')}>Code</button>
        <button onClick={() => setView('preview')}>Preview</button>
      </div>

      {view === 'code' ? (
        <pre><code>{code}</code></pre>
      ) : (
        <Sandpack
          template="react"
          code={code}
          theme="dark"
        />
      )}
    </div>
  );
}
```

### Usage in Docs

```markdown
## Usage

Here's a simple example:

<ExampleViewer code={`
import { Tool } from 'tool';

const tool = new Tool();
const result = tool.process(data);
console.log(result);
`} />
```

## Auto-Sync with GitHub

### GitHub Webhook

```typescript
// app/api/webhooks/github/route.ts
import { verifySignature } from '@/lib/github';
import { syncDocs } from '@/lib/docs-generator';

export async function POST(req: Request) {
  const signature = req.headers.get('x-hub-signature-256')!;

  if (!verifySignature(await req.text(), signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = await req.json();

  if (payload.ref === 'refs/heads/main') {
    // Rebuild docs
    await syncDocs(payload.repository.name);
  }

  return Response.json({ received: true });
}
```

### Sync Function

```typescript
// lib/docs-generator.ts
import octokit from '@octokit/rest';
import fs from 'fs/promises';
import { parseReadme } from './readme-parser';

export async function syncDocs(repoName: string) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  // Fetch README
  const { data: readme } = await octokit.repos.getReadme({
    owner: 'your-username',
    repo: repoName,
  });

  const content = Buffer.from(readme.content, 'base64').toString();

  // Parse sections
  const sections = parseReadme(content);

  // Generate MDX files
  for (const [sectionName, sectionContent] of Object.entries(sections)) {
    await fs.writeFile(
      `docs/${repoName}/${sectionName}.mdx`,
      sectionContent
    );
  }

  // Extract API docs from source
  await extractApiDocs(repoName);
}
```

## Search Implementation

### Index Generation

```typescript
// lib/search-index.ts
import { buildIndex } from 'simple-docs-search';

export async function buildSearchIndex() {
  const docs = await glob('docs/**/*.mdx');

  const index = buildIndex(docs, {
    fields: ['title', 'content', 'category'],
    storeDocuments: true,
  });

  await fs.writeFile(
    'public/search-index.json',
    JSON.stringify(index)
  );
}
```

### Search Component

```tsx
// components/Search.tsx
'use client';

import { useState } from 'react';
import { useFlexSearch } from 'react-flexsearch-hooks';

export function Search() {
  const [query, setQuery] = useState('');
  const results = useFlexSearch(query, 'content', index);

  return (
    <div className="search">
      <input
        type="text"
        placeholder="Search documentation..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="results">
        {results.map(result => (
          <ResultCard key={result.id} result={result} />
        ))}
      </div>
    </div>
  );
}
```

## Versioning

### Multi-Version Support

```typescript
// docs/versions.json
{
  "tool-name": {
    "latest": "2.0.0",
    "versions": ["2.0.0", "1.5.0", "1.0.0"],
    "stable": "1.5.0"
  }
}
```

### Version Selector

```tsx
// components/VersionSelector.tsx
export function VersionSelector({ tool }: { tool: string }) {
  const versions = useVersions(tool);
  const [version, setVersion] = useState(versions.latest);

  return (
    <select value={version} onChange={(e) => setVersion(e.target.value)}>
      {versions.versions.map(v => (
        <option key={v} value={v}>
          {v === versions.latest ? `${v} (latest)` : v}
        </option>
      ))}
    </select>
  );
}
```

## Navigation

### Auto-Generated Sidebar

```typescript
// lib/sidebar-generator.ts
export function generateSidebar(toolName: string) {
  const files = await glob(`docs/${toolName}/*.mdx`);

  return files.map(file => ({
    title: extractTitle(file),
    path: `/${toolName}/${file.replace('.mdx', '')}`,
    children: extractHeaders(file),
  }));
}
```

### Sidebar Component

```tsx
// components/Sidebar.tsx
export function Sidebar({ tool }: { tool: string }) {
  const sidebar = useSidebar(tool);

  return (
    <nav className="sidebar">
      {sidebar.map(section => (
        <div key={section.title}>
          <h3>{section.title}</h3>
          <ul>
            {section.children.map(child => (
              <li key={child.path}>
                <Link href={child.path}>{child.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
```

## Theming

### Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        docs: {
          bg: '#0B0F19',
          text: '#E2E8F0',
          primary: '#4ECDC4',
          code: '#1E293B',
        },
      },
    },
  },
};
```

### Custom MDX Components

```tsx
// components/MDX.tsx
import { MDXComponents } from 'mdx/types';

export const mdxComponents: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="text-4xl font-bold mb-4">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-3xl font-semibold mb-3">{children}</h2>
  ),
  code: ({ children }) => (
    <code className="bg-docs-code px-2 py-1 rounded">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="bg-docs-code p-4 rounded-lg overflow-x-auto">
      {children}
    </pre>
  ),
};
```

## Performance Optimization

### Static Generation

```typescript
// app/docs/[tool]/[page]/page.tsx
export async function generateStaticParams() {
  const tools = await getToolList();

  const paths = [];

  for (const tool of tools) {
    const pages = await glob(`docs/${tool}/*.mdx`);
    paths.push(...pages.map(page => ({
      tool,
      page: page.replace('.mdx', ''),
    })));
  }

  return paths;
}

export default async function DocPage({
  params,
}: {
  params: { tool: string; page: string };
}) {
  const content = await getDocContent(params.tool, params.page);

  return <MDXRenderer content={content} />;
}
```

## Deployment Automation

### GitHub Actions

```yaml
# .github/workflows/docs.yml
name: Update Documentation

on:
  push:
    branches: [main]
    paths:
      - 'README.md'
      - 'src/**'

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install deps
        run: npm ci

      - name: Generate docs
        run: npm run docs:build

      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Webhook Trigger

```typescript
// Auto-regenerate on README update
app.post('/api/webhooks/docs-updated', async (req, res) => {
  const { repository } = req.body;

  // Regenerate docs for this repo
  await generateDocs(repository.name);

  // Trigger rebuild
  await triggerDeploy();

  res.json({ success: true });
});
```

## Analytics

### Doc Views Tracking

```typescript
// lib/doc-analytics.ts
export async function trackDocView(tool: string, page: string) {
  await analytics.track('doc_viewed', {
    tool,
    page,
    timestamp: new Date(),
  });
}

// Use in page component
useEffect(() => {
  trackDocView(params.tool, params.page);
}, [params.tool, params.page]);
```

### Popular Pages

```typescript
// app/api/docs/stats/route.ts
export async function GET() {
  const stats = await getDocStats();

  return Response.json({
    mostViewed: stats.mostViewed,
    averageTime: stats.avgTimeOnPage,
    bounceRate: stats.bounceRate,
  });
}
```

## Best Practices

### Documentation Structure

✅ **Clear Hierarchy** - Logical section organization
✅ **Code Examples** - Every feature has example
✅ **API Reference** - Complete function/method docs
✅ **Troubleshooting** - Common issues & solutions
✅ **Changelog** - Version history visible

### Writing Style

✅ **Concise** - Get to the point quickly
✅ **Scannable** - Use headings, bullets, code blocks
✅ **Accurate** - Docs match code behavior
✅ **Up-to-date** - Auto-sync keeps current
✅ **Beginner-Friendly** - Explain concepts clearly

## Resources

### Tools
- [MDX](https://mdxjs.com/) - Markdown + JSX
- [Rehype](https://rehypejs.com/) - HTML processor
- [Remark](https://remark.js.org/) - Markdown processor
- [Sandpack](https://codesandbox.io/docs/sandpack) - Live code examples

### Inspiration
- [Stripe Docs](https://stripe.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

---

**Part of the Showcase Builder Bundle**
