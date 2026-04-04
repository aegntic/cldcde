import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { config } from '../config'

interface NewsItem {
  id: string
  title: string
  content: string
  excerpt?: string
  author: string
  source: string
  source_url?: string
  tags: string[]
  published_at: string
  created_at: string
  image_url?: string
  featured?: boolean
}

const PageContainer = styled.div`
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.xl};
  padding-top: calc(80px + ${({ theme }) => theme.spacing.xl});
  max-width: 1200px;
  margin: 0 auto;
`

const PageHeader = styled(motion.div)`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

const Title = styled.h1`
  font-size: 3rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.terminal.blue},
    ${({ theme }) => theme.colors.terminal.cyan}
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 600px;
  margin: 0 auto;
`

const NewsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const NewsCard = styled(motion.article)`
  background: ${({ theme }) => theme.colors.background.card};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.focus};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  ${({ featured, theme }) => featured && `
    grid-column: 1 / -1;
    background: ${theme.colors.background.secondary};
    border-color: ${theme.colors.interactive.primary};
    
    &::before {
      content: 'FEATURED';
      position: absolute;
      top: ${theme.spacing.md};
      right: ${theme.spacing.md};
      background: ${theme.colors.interactive.primary};
      color: white;
      padding: ${theme.spacing.xs} ${theme.spacing.sm};
      border-radius: ${theme.borderRadius.sm};
      font-size: 0.75rem;
      font-weight: 600;
      font-family: ${theme.fonts.mono};
    }
  `}
`

const NewsTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.sans};
`

const NewsMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text.muted};
`

const Source = styled.a`
  color: ${({ theme }) => theme.colors.interactive.primary};
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`

const NewsContent = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  p {
    margin-bottom: ${({ theme }) => theme.spacing.sm};
  }
`

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.md};
`

const Tag = styled.span`
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-family: ${({ theme }) => theme.fonts.mono};
`

const LoadingContainer = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl};
  color: ${({ theme }) => theme.colors.text.secondary};
`

const ErrorMessage = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.status.error};
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.status.error}33;
  border-radius: ${({ theme }) => theme.borderRadius.md};
`

const FilterSection = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
  justify-content: center;
`

const FilterButton = styled.button<{ active: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ active, theme }) => 
    active ? theme.colors.interactive.primary : theme.colors.background.secondary};
  color: ${({ active, theme }) => 
    active ? 'white' : theme.colors.text.secondary};
  border: 1px solid ${({ active, theme }) => 
    active ? theme.colors.interactive.primary : theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};

  &:hover {
    background: ${({ active, theme }) => 
      active ? theme.colors.interactive.primaryHover : theme.colors.background.tertiary};
    border-color: ${({ theme }) => theme.colors.border.hover};
  }
`

// Sample news data with OpenRouter review
const SAMPLE_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'OpenRouter: The Ultimate LLM Gateway for Developers',
    content: `OpenRouter has positioned itself as essential infrastructure for the AI development ecosystem. With over 200+ models from 40+ providers accessible through a single API, it's revolutionizing how developers interact with language models.

## What Makes OpenRouter Special?

**Unified API Access**: One API key, one interface, access to GPT-4, Claude, Gemini, Llama, and hundreds more. No more juggling multiple provider accounts.

**Smart Routing**: Automatically selects the best available model based on your requirements - balancing cost, speed, and quality.

**Cost Efficiency**: Pay-as-you-go pricing with no markup on base model costs. Free tier includes access to several high-quality models.

## Developer Experience

The integration is remarkably simple:
- RESTful API with excellent documentation
- SDKs for major languages
- OpenAI-compatible endpoints for drop-in replacement
- Real-time usage tracking and analytics

## Performance & Reliability

With 99.9% uptime and intelligent fallback routing, OpenRouter ensures your applications stay online even when individual providers face outages. The 10-50ms routing overhead is negligible compared to the benefits.

## The Verdict: 9.2/10

OpenRouter has become the de facto standard for production LLM applications. While there's a slight latency overhead and occasional feature parity lag with cutting-edge model capabilities, the benefits far outweigh these minor drawbacks.

For cldcde.cc, we've fully integrated OpenRouter to power our AI-assisted features, content generation, and code analysis - all while keeping costs minimal with their generous free tier.`,
    excerpt: 'Deep dive into OpenRouter - the unified API gateway revolutionizing LLM access for developers. One API, 200+ models, smart routing, and cost-effective pricing.',
    author: 'cldcde.cc Team',
    source: 'Platform Review',
    tags: ['openrouter', 'ai', 'llm', 'api', 'developer-tools'],
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    featured: true
  },
  {
    id: '2',
    title: 'Claude 3.5 Sonnet: Enhanced Code Generation Capabilities',
    content: 'Anthropic announces improvements to Claude 3.5 Sonnet with better code understanding, enhanced debugging capabilities, and faster response times for development tasks.',
    author: 'Anthropic',
    source: 'Anthropic Blog',
    source_url: 'https://anthropic.com',
    tags: ['claude', 'ai', 'code-generation', 'updates'],
    published_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '3',
    title: 'New MCP Server: Database Schema Analyzer',
    content: 'Community member releases an MCP server that automatically analyzes database schemas and generates TypeScript interfaces, Zod schemas, and SQL migrations.',
    author: 'Community',
    source: 'GitHub',
    source_url: 'https://github.com/example/mcp-schema-analyzer',
    tags: ['mcp', 'database', 'typescript', 'community'],
    published_at: new Date(Date.now() - 172800000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: '4',
    title: 'Claude Code Extension: Vim Mode Support',
    content: 'Popular VS Code extension adds comprehensive Vim keybindings support for Claude Code, including visual mode, macros, and custom commands.',
    author: 'Extension Developer',
    source: 'VS Code Marketplace',
    source_url: 'https://marketplace.visualstudio.com',
    tags: ['extensions', 'vim', 'productivity', 'vscode'],
    published_at: new Date(Date.now() - 259200000).toISOString(),
    created_at: new Date(Date.now() - 259200000).toISOString()
  }
]

const NewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>(SAMPLE_NEWS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Get all unique tags
  const allTags = Array.from(new Set(news.flatMap(item => item.tags))).sort()

  // Filter news by selected tag
  const filteredNews = selectedTag 
    ? news.filter(item => item.tags.includes(selectedTag))
    : news

  // Sort by date, with featured items first
  const sortedNews = [...filteredNews].sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const handleCardClick = (item: NewsItem) => {
    if (item.source_url) {
      window.open(item.source_url, '_blank')
    }
  }

  return (
    <PageContainer>
      <PageHeader
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Title>News & Updates</Title>
        <Subtitle>
          Latest updates from Anthropic, Claude Code innovations, and community contributions
        </Subtitle>
      </PageHeader>

      <FilterSection>
        <FilterButton
          active={!selectedTag}
          onClick={() => setSelectedTag(null)}
        >
          All Updates
        </FilterButton>
        {allTags.map(tag => (
          <FilterButton
            key={tag}
            active={selectedTag === tag}
            onClick={() => setSelectedTag(tag)}
          >
            {tag}
          </FilterButton>
        ))}
      </FilterSection>

      {loading && (
        <LoadingContainer>
          <p>Loading latest updates...</p>
        </LoadingContainer>
      )}

      {error && (
        <ErrorMessage>
          <p>Error loading news: {error}</p>
        </ErrorMessage>
      )}

      <AnimatePresence mode="wait">
        <NewsGrid>
          {sortedNews.map((item, index) => (
            <NewsCard
              key={item.id}
              featured={item.featured}
              onClick={() => handleCardClick(item)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <NewsTitle>{item.title}</NewsTitle>
              <NewsMeta>
                <span>{formatDate(item.published_at)}</span>
                <span>•</span>
                <span>{item.author}</span>
                <span>•</span>
                {item.source_url ? (
                  <Source href={item.source_url} target="_blank" rel="noopener noreferrer">
                    {item.source}
                  </Source>
                ) : (
                  <span>{item.source}</span>
                )}
              </NewsMeta>
              <NewsContent>
                {item.featured && item.content ? (
                  <div dangerouslySetInnerHTML={{ __html: item.content.replace(/\n/g, '<br />') }} />
                ) : (
                  <p>{item.excerpt || item.content}</p>
                )}
              </NewsContent>
              <TagList>
                {item.tags.map(tag => (
                  <Tag key={tag}>#{tag}</Tag>
                ))}
              </TagList>
            </NewsCard>
          ))}
        </NewsGrid>
      </AnimatePresence>
    </PageContainer>
  )
}

export { NewsPage }