---
name: NotebookLM + n8n Content Automation
description: |
  Automatic news and blog writing via NotebookLM integrated with n8n workflows. Generates unique, useful, and accurate content for maximum SEO. Leverages Google's NotebookLM for research synthesis and n8n for workflow automation.
---

## Overview

Automated content generation system combining Google's NotebookLM for research and synthesis with n8n workflow automation. Produces high-quality, SEO-optimized content automatically.

## Core Components

### NotebookLM (Research & Synthesis)
- Multi-source research aggregation
- Automatic summarization
- Fact verification and citation
- Natural language generation
- Multi-language support (50+ languages)

### n8n (Workflow Automation)
- Scheduled content generation
- Multi-step processing pipelines
- Integration with CMS
- Quality control checks
- Publishing automation

## Architecture

```
[Data Sources] -> [n8n Workflow] -> [NotebookLM API] -> [Content Draft] -> [Quality Check] -> [Publish]
      |                |                |                  |                |
   GitHub            Trigger          Research          Edit/Review       CMS
   News APIs         Schedule         Synthesize        SEO Check         API
   RSS Feeds         Filter           Generate          Plagiarism       Email
   Docs              Categorize       Citations         Check            Newsletter
```

## Setup

### Prerequisites

```bash
# Install n8n
npm install -g n8n

# Or use Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Install NotebookLM API client
npm install @apify/clearpath/notebooklm-api
```

### Environment Configuration

```env
# .env.local
NOTEBOOKLM_API_KEY=...
N8N_ENCRYPTION_KEY=...
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
CMS_API_ENDPOINT=...
CMS_API_KEY=...
```

## NotebookLM Integration

### API Client Setup

```typescript
// lib/notebooklm.ts
import { NotebookLMApiClient } from '@apify/clearpath/notebooklm-api';

export const notebooklm = new NotebookLMApiClient({
  apiKey: process.env.NOTEBOOKLM_API_KEY,
});

export async function generateContent(sources: ContentSource[], topic: string) {
  const notebook = await notebooklm.createNotebook({
    title: topic,
    sources: sources.map(source => ({
      url: source.url,
      type: source.type,
    })),
  });

  const content = await notebooklm.generateContent({
    notebookId: notebook.id,
    prompt: `Write a comprehensive, SEO-optimized article about ${topic}. Include:
    - Engaging introduction
    - Key insights from sources
    - Practical examples
    - Conclusion
    - Meta description
    - Focus on unique, valuable information`,
    format: 'markdown',
    tone: 'professional',
    wordCount: 1500,
  });

  return content;
}
```

### Content Generation Workflow

```typescript
// workflows/generate-article.ts
export async function generateArticle(topic: string, researchDepth: number) {
  // Step 1: Gather sources
  const sources = await gatherSources(topic, researchDepth);

  // Step 2: Create NotebookLM notebook
  const notebook = await notebooklm.createNotebook({
    title: topic,
    sources: sources,
  });

  // Step 3: Generate initial draft
  const draft = await notebooklm.generateContent({
    notebookId: notebook.id,
    prompt: generatePrompt(topic),
    format: 'markdown',
  });

  // Step 4: Extract citations
  const citations = await notebooklm.getCitations({
    notebookId: notebook.id,
    contentId: draft.id,
  });

  // Step 5: Generate SEO metadata
  const seo = await generateSEOMetadata(draft.content, topic);

  return {
    content: draft.content,
    citations,
    seo,
    sources: sources.map(s => s.url),
  };
}

function generatePrompt(topic: string): string {
  return `Write a comprehensive technical article about ${topic}.

Requirements:
1. Unique insights not found in other articles
2. Practical examples and code snippets where applicable
3. Clear structure with headings and subheadings
4. SEO-optimized with natural keyword usage
5. Factual accuracy with citations
6. Professional but accessible tone
7. 1500-2000 words
8. Include meta description

Target audience: Developers and technical professionals

Focus on:
- Actionable insights
- Real-world applications
- Future trends and predictions
- Common pitfalls to avoid`;
}
```

## n8n Workflow Configuration

### Workflow 1: Daily News Generation

```json
{
  "name": "Daily Tech News Generator",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 9 * * 1-5"
            }
          ]
        }
      },
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger"
    },
    {
      "parameters": {
        "url": "https://techcrunch.com/feed/",
        "options": {}
      },
      "name": "Fetch Tech News",
      "type": "n8n-nodes-base.rssFeedRead"
    },
    {
      "parameters": {
        "jsCode": "// Filter and categorize news\nconst items = $input.all();\nconst categorized = {\n  ai: [],\n  devtools: [],\n  cloud: [],\n  security: []\n};\n\nfor (const item of items) {\n  const category = categorizeNews(item.title);\n  if (categorized[category]) {\n    categorized[category].push(item);\n  }\n}\n\nreturn Object.entries(categorized).map(([cat, items]) => ({\n  json: { category: cat, items: items.slice(0, 5) }\n}));"
      },
      "name": "Categorize News",
      "type": "n8n-nodes-base.code"
    },
    {
      "parameters": {
        "url": "={{$env.NOTEBOOKLM_WEBHOOK}}/generate",
        "authentication": "genericCredentialType",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{JSON.stringify({\n  topic: $json.category + ' tech news ' + new Date().toISOString().split('T')[0],\n  sources: $json.items.map(i => i.url),\n  type: 'news_summary'\n})}}",
        "options": {}
      },
      "name": "Generate Summary",
      "type": "n8n-nodes-base.httpRequest"
    },
    {
      "parameters": {
        "conditions": {
          "options": [
            {
              "value": 200,
              "condition": "equals"
            }
          ]
        },
        "combineOperation": "any"
      },
      "name": "Check Success",
      "type": "n8n-nodes-base.if"
    },
    {
      "parameters": {
        "url": "={{$env.CMS_API_ENDPOINT}}/posts",
        "authentication": "genericCredentialType",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{{\n  title: $json.topic,\n  content: $json.content,\n  categories: [$json.category],\n  published: false,\n  meta: $json.seo\n}}}",
        "options": {}
      },
      "name": "Save Draft to CMS",
      "type": "n8n-nodes-base.httpRequest"
    },
    {
      "parameters": {
        "url": "={{$env.CMS_API_ENDPOINT}}/posts/{{$json.id}}/publish",
        "method": "PATCH",
        "authentication": "genericCredentialType"
      },
      "name": "Publish Article",
      "type": "n8n-nodes-base.httpRequest"
    }
  ]
}
```

### Workflow 2: Tool Showcase Updates

```json
{
  "name": "Weekly Tool Roundup",
  "nodes": [
    {
      "name": "Weekly Schedule",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [{ "expression": "0 10 * * 1" }]
        }
      }
    },
    {
      "name": "Fetch GitHub Repos",
      "type": "n8n-nodes-base.githubTrigger",
      "parameters": {
        "event": "repository",
        "filters": {
          "owner": "your-username"
        }
      }
    },
    {
      "name": "Analyze with RuVector",
      "type": "@n8n/n8n-nodes-ruvector.search",
      "parameters": {
        "collection": "showcase_tools",
        "limit": 10
      }
    },
    {
      "name": "Generate Content",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{$env.NOTEBOOKLM_WEBHOOK}}/generate",
        "method": "POST",
        "jsonBody": "={{{\n  topic: 'Top Developer Tools This Week',\n  sources: $json.tools.map(t => t.url),\n  type: 'tool_showcase'\n}}}"
      }
    },
    {
      "name": "Quality Check",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Check content quality\nconst content = $json.content;\nconst checks = {\n  wordCount: content.split(' ').length,\n  readability: calculateReadability(content),\n  seo: checkSEOScore(content),\n  uniqueness: await checkPlagiarism(content)\n};\n\nif (checks.wordCount < 1000) {\n  throw new Error('Content too short');\n}\n\nif (checks.uniqueness < 0.8) {\n  throw new Error('Content not unique enough');\n}\n\nreturn { json: { content, checks } };"
      }
    },
    {
      "name": "Publish",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{$env.CMS_API_ENDPOINT}}/posts",
        "method": "POST"
      }
    }
  ]
}
```

## Content Types

### 1. News Summaries

```typescript
// Generate daily tech news summary
async function generateNewsSummary(category: string) {
  const sources = await fetchNewsSources(category);

  const content = await notebooklm.generateContent({
    topic: `${category} tech news - ${new Date().toISOString().split('T')[0]}`,
    sources: sources.slice(0, 10),
    prompt: `Create a concise, informative summary of recent ${category} tech news.

Structure:
1. Top 3 stories with brief analysis
2. Trending topics
3. Notable releases
4. Industry implications

Keep it under 500 words. Use bullet points where appropriate.`,
    format: 'markdown',
  });

  return content;
}
```

### 2. Tool Reviews

```typescript
// Generate in-depth tool review
async function generateToolReview(toolName: string, repoUrl: string) {
  const sources = [
    repoUrl,
    await fetchDocumentation(repoUrl),
    await fetchReviews(toolName),
    await fetchReleases(repoUrl),
  ];

  const content = await notebooklm.generateContent({
    topic: `${toolName} - Comprehensive Review`,
    sources,
    prompt: `Write an in-depth, unbiased review of ${toolName}.

Include:
1. Overview and purpose
2. Key features (technical details)
3. Installation/setup process
4. Usage examples with code
5. Pros and cons
6. Comparison with alternatives
7. Best use cases
8. Bottom line recommendation

Be technical but accessible. 2000-2500 words.`,
    format: 'markdown',
  });

  return content;
}
```

### 3. Tutorial Content

```typescript
// Generate step-by-step tutorial
async function generateTutorial(topic: string, difficulty: 'beginner' | 'intermediate' | 'advanced') {
  const sources = await gatherTutorialSources(topic, difficulty);

  const content = await notebooklm.generateContent({
    topic: `How to ${topic} - ${difficulty} Tutorial`,
    sources,
    prompt: `Create a comprehensive, step-by-step tutorial for ${difficulty} developers.

Structure:
1. Prerequisites (what readers need before starting)
2. Setup instructions with code examples
3. Step-by-step implementation
4. Common pitfalls and solutions
5. Testing and verification
6. Next steps/advanced usage

Use:
- Code blocks with syntax highlighting
- File structure diagrams
- Screenshots descriptions (text-based)
- Troubleshooting section

Make it actionable and practical. 2500-3000 words.`,
    format: 'markdown',
  });

  return content;
}
```

## SEO Optimization

### Automatic SEO Metadata Generation

```typescript
// lib/seo-generator.ts
export async function generateSEOMetadata(content: string, topic: string) {
  const keywords = await extractKeywords(content);
  const summary = await generateSummary(content);

  return {
    title: generateTitle(topic),
    description: summary.substring(0, 160),
    keywords: keywords.join(', '),
    ogTitle: generateTitle(topic),
    ogDescription: summary.substring(0, 200),
    ogImage: await generateOGImage(topic),
    twitterCard: 'summary_large_image',
    canonical: generateCanonical(topic),
    schema: generateSchemaOrg(content, topic),
  };
}

async function extractKeywords(content: string): Promise<string[]> {
  // Use NLP or RuVector to extract important keywords
  const vector = await generateEmbedding(content);
  const phrases = await ruvector.extractKeyPhrases(vector, { limit: 10 });

  return phrases;
}

function generateSchemaOrg(content: string, topic: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: generateTitle(topic),
    description: content.substring(0, 200),
    author: {
      '@type': 'Organization',
      name: 'Your Brand',
    },
    datePublished: new Date().toISOString(),
    keywords: await extractKeywords(content),
  };
}
```

## Quality Control

### Plagiarism Check

```typescript
// lib/plagiarism-check.ts
export async function checkPlagiarism(content: string): Promise<number> {
  const chunks = content.split(/\n\n+/);

  for (const chunk of chunks) {
    const vector = await generateEmbedding(chunk);

    // Search RuVector for similar content
    const similar = await ruvector.search(vector, {
      threshold: 0.95, // Very high similarity
      limit: 1,
    });

    if (similar.length > 0) {
      console.warn('Potential plagiarism detected:', similar[0].metadata);
    }
  }

  // Return uniqueness score (0-1)
  return 1.0; // Placeholder
}
```

### Readability Score

```typescript
// lib/readability.ts
export function calculateReadability(content: string): ReadabilityScore {
  const sentences = content.split(/[.!?]+/);
  const words = content.split(/\s+/);

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = words.reduce((acc, word) =>
    acc + countSyllables(word), 0) / words.length;

  // Flesch Reading Ease
  const fresch = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (avgSyllablesPerWord);

  return {
    flesch: fresch,
    gradeLevel: calculateGradeLevel(fresch),
    avgSentenceLength,
    avgWordLength: words.join('').length / words.length,
  };
}
```

## Publishing Automation

### CMS Integration

```typescript
// lib/cms-publisher.ts
export async function publishToCMS(content: GeneratedContent) {
  // Create post in CMS
  const post = await cms.posts.create({
    title: content.seo.title,
    content: content.markdown,
    excerpt: content.seo.description,
    categories: content.categories,
    tags: content.seo.keywords.split(', '),
    status: 'draft',
    meta: content.seo,
  });

  // Upload featured image
  if (content.featuredImage) {
    const image = await generateFeaturedImage(content.topic);
    await cms.media.upload({
      post_id: post.id,
      file: image,
    });
  }

  // Schedule publication
  await cms.posts.update(post.id, {
    status: 'publish',
    published_at: calculateOptimalPublishTime(),
  });

  return post;
}
```

### Newsletter Distribution

```typescript
// lib/newsletter.ts
export async function sendNewsletter(content: GeneratedContent) {
  const subscribers = await fetchSubscribers();

  for (const subscriber of subscribers) {
    await email.send({
      to: subscriber.email,
      subject: content.seo.title,
      html: generateNewsletterHTML(content),
      text: content.markdown,
    });
  }

  // Track metrics
  await analytics.track('newsletter_sent', {
    subject: content.seo.title,
    recipients: subscribers.length,
  });
}
```

## Performance Monitoring

### Content Analytics

```typescript
// Track content performance
async function trackContentPerformance(postId: string) {
  const metrics = await analytics.getMetrics(postId);

  return {
    views: metrics.pageviews,
    engagement: metrics.avgTimeOnPage,
    bounceRate: metrics.bounceRate,
    shares: metrics.socialShares,
    seoScore: metrics.seoScore,
    conversions: metrics.conversions,
  };
}
```

## Best Practices

### Content Quality Standards

- Minimum 1000 words for articles
- Unique insights not found elsewhere
- Factual accuracy with citations
- Natural language, avoid keyword stuffing
- Mobile-optimized formatting
- Include code examples where relevant
- Update regularly with fresh information

### SEO Best Practices

- Target long-tail keywords
- Use descriptive, catchy titles
- Include meta descriptions
- Add structured data (Schema.org)
- Optimize images (alt text, compression)
- Internal linking between articles
- Fast page load times (<2s)

### Publishing Schedule

- News: Daily (Monday-Friday)
- Tutorials: Weekly (Tuesday/Thursday)
- Tool Reviews: Weekly (Wednesday)
- In-depth Analysis: Bi-weekly
- Roundups: Monthly

## Resources

### Documentation
- [NotebookLM + n8n Integration Guide](https://scalevise.com/resources/notebooklm-with-n8n/)
- [NotebookLM API Documentation](https://apify.com/clearpath/notebooklm-api)
- [n8n Documentation](https://docs.n8n.io)

### Community
- [NotebookLM Reddit Community](https://www.reddit.com/r/NotebookLM/)
- [n8n Community](https://community.n8n.io/)
- [Content Creators with n8n](https://www.analyticsvidhya.com/blog/2025/03/content-creator-agent-with-n8n/)

---

**Part of the Showcase Builder Bundle**
