# Phase 5: Automated Content Generation

Set up NotebookLM + n8n workflow for automatic news and blog generation with SEO optimization.

## Requirements

- NotebookLM API integration
- n8n workflows configured
- Daily news generation
- Weekly tool roundups
- SEO optimization
- Automatic publishing to CMS
- Newsletter integration

## n8n Workflows

### Workflow 1: Daily Tech News

Trigger: Every weekday at 9:00 AM

1. Fetch RSS feeds (TechCrunch, Hacker News, etc.)
2. Categorize by topic (AI, devtools, cloud, security)
3. Send to NotebookLM API with sources
4. Generate summary article (300-500 words)
5. Quality check (plagiarism, readability)
6. Save draft to CMS
7. Publish at 10:00 AM
8. Send to newsletter list

### Workflow 2: Weekly Tool Showcase

Trigger: Every Monday at 10:00 AM

1. Query RuVector for trending tools
2. Fetch GitHub repositories
3. Generate in-depth reviews (1500-2000 words)
4. Create comparison charts
5. Add code examples
6. Quality check
7. Publish on Wednesday
8. Social media promotion

### Workflow 3: Tutorial Content

Trigger: Weekly (Tuesday/Thursday)

1. Analyze community questions
2. Select popular topics
3. Gather documentation and examples
4. Generate step-by-step tutorial (2000-2500 words)
5. Add diagrams and code
6. Preview and edit
7. Publish Friday morning

## Implementation

### NotebookLM Client
```typescript
// lib/notebooklm.ts
import { NotebookLMApiClient } from '@apify/clearpath/notebooklm-api';

export const notebooklm = new NotebookLMApiClient({
  apiKey: process.env.NOTEBOOKLM_API_KEY,
});

export async function generateArticle(sources: Source[], topic: string, type: ArticleType) {
  const notebook = await notebooklm.createNotebook({
    title: topic,
    sources: sources.map(s => ({ url: s.url, type: s.type })),
  });

  const prompt = generatePrompt(topic, type);

  const content = await notebooklm.generateContent({
    notebookId: notebook.id,
    prompt,
    format: 'markdown',
    tone: 'professional',
    wordCount: type === 'news' ? 500 : type === 'review' ? 2000 : 2500,
  });

  return content;
}

function generatePrompt(topic: string, type: ArticleType): string {
  const prompts = {
    news: `Create a concise tech news summary about ${topic}.
Include top 3 stories, trending topics, and implications.
Under 500 words. Use bullet points.`,

    review: `Write an in-depth, unbiased review of ${topic}.
Include: overview, key features, setup, examples, pros/cons, comparisons, recommendations.
2000 words. Technical but accessible.`,

    tutorial: `Create a step-by-step tutorial for ${topic}.
Include: prerequisites, setup with code, implementation, troubleshooting, testing.
2500 words. Practical and actionable.`,
  };

  return prompts[type];
}
```

### n8n Workflow API Integration
```typescript
// app/api/webhooks/n8n/route.ts
import { verifyWebhookSignature } from '@/lib/n8n';

export async function POST(req: Request) {
  const signature = req.headers.get('x-n8n-webhook-signature')!;
  const body = await req.text();

  if (!verifyWebhookSignature(body, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  switch (event.type) {
    case 'article.generated':
      await handleArticleGenerated(event.data);
      break;
    case 'article.published':
      await handleArticlePublished(event.data);
      break;
  }

  return Response.json({ received: true });
}

async function handleArticleGenerated(data: ArticleData) {
  // Save to CMS
  const post = await cms.posts.create({
    title: data.title,
    content: data.content,
    status: 'draft',
    categories: data.categories,
    meta: data.seo,
  });

  // Send for review if needed
  if (data.requiresReview) {
    await sendToReviewQueue(post.id);
  }
}
```

### Content Automation Service
```typescript
// lib/content-automation.ts
export class ContentAutomation {
  async generateDailyNews() {
    const sources = await this.fetchNewsSources();
    const categorized = await this.categorizeNews(sources);

    const articles = [];

    for (const [category, items] of Object.entries(categorized)) {
      const content = await notebooklm.generateArticle({
        sources: items.slice(0, 5),
        topic: `${category} tech news - ${new Date().toISOString().split('T')[0]}`,
        type: 'news',
      });

      articles.push({
        title: content.title,
        content: content.markdown,
        category,
        sources: items.map(i => i.url),
        generatedAt: new Date(),
      });
    }

    return articles;
  }

  async generateToolReview(toolName: string, repoUrl: string) {
    const sources = [
      repoUrl,
      await this.fetchDocumentation(repoUrl),
      await this.fetchReviews(toolName),
    ];

    const content = await notebooklm.generateArticle({
      sources,
      topic: `${toolName} - Comprehensive Review`,
      type: 'review',
    });

    return content;
  }
}
```

## SEO Optimization

### Automatic SEO Metadata
```typescript
// lib/seo-generator.ts
export async function generateSEO(content: string, topic: string) {
  const keywords = await this.extractKeywords(content);
  const summary = await this.generateSummary(content);

  return {
    title: this.generateTitle(topic),
    description: summary.substring(0, 160),
    keywords: keywords.join(', '),
    ogTitle: this.generateTitle(topic),
    ogDescription: summary.substring(0, 200),
    ogImage: await this.generateOGImage(topic),
    twitterCard: 'summary_large_image',
    schema: this.generateSchemaOrg(content, topic),
  };
}

async function extractKeywords(content: string): Promise<string[]> {
  const vector = await generateEmbedding(content);
  const phrases = await ruvector.extractKeyPhrases(vector, { limit: 10 });
  return phrases;
}
```

### Quality Control
```typescript
// lib/quality-control.ts
export async function qualityCheck(content: string): Promise<QCResult> {
  const checks = await Promise.all([
    this.checkPlagiarism(content),
    this.checkReadability(content),
    this.checkSEOScore(content),
    this.checkWordCount(content),
  ]);

  return {
    passed: checks.every(c => c.passed),
    plagiarism: checks[0],
    readability: checks[1],
    seo: checks[2],
    wordCount: checks[3],
  };
}

async function checkPlagiarism(content: string): Promise<QCCheck> {
  const chunks = content.split(/\n\n+/);
  let uniqueScore = 1.0;

  for (const chunk of chunks) {
    const vector = await generateEmbedding(chunk);
    const similar = await ruvector.search(vector, {
      threshold: 0.95,
      limit: 1,
    });

    if (similar.length > 0) {
      uniqueScore -= 0.1;
    }
  }

  return {
    passed: uniqueScore >= 0.8,
    score: uniqueScore,
    issues: uniqueScore < 0.8 ? ['Potential plagiarism detected'] : [],
  };
}
```

## Success Criteria

- NotebookLM API integrated
- n8n workflows configured
- Daily news generation working
- Weekly tool reviews automated
- SEO optimization applied
- Quality checks passing
- Content publishing to CMS
- Newsletter distribution active
- No emojis in generated content
- Monochrome noir theme maintained

Output <promise>PHASE5_COMPLETE</promise>
