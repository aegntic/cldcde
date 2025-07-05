import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../hooks/useTheme'

interface NewsArticle {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  author: {
    id: string
    username: string
    avatar_url?: string
  }
  category: string
  tags: string[]
  featured: boolean
  pinned: boolean
  external_url?: string
  source?: string
  view_count: number
  like_count: number
  comment_count: number
  status: string
  published_at: string
  created_at: string
}

interface RSSSource {
  id: string
  name: string
  url: string
  category: string
  active: boolean
  last_fetched?: string
  error_count: number
}

const Container = styled(motion.div)`
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.background.primary};
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      position: relative;
      
      &::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(
          ellipse at 30% 30%,
          rgba(51, 102, 255, 0.1) 0%,
          transparent 50%
        );
        pointer-events: none;
        z-index: 0;
      }
    ` : ''
  };
`

const Header = styled(motion.div)`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  position: relative;
  z-index: 1;
`

const Title = styled(motion.h1)`
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.terminal.blue},
    ${({ theme }) => theme.colors.terminal.purple},
    ${({ theme }) => theme.colors.interactive.accent}
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      filter: drop-shadow(0 0 30px ${theme.colors.terminal.purple});
      text-shadow: 0 0 20px ${theme.colors.terminal.blue};
    ` : ''
  };

  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`

const TabContainer = styled(motion.div)`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`

const Tab = styled(motion.button)<{ active: boolean }>`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme, active }) => 
    active ? theme.colors.border.focus : theme.colors.border.primary
  };
  background: ${({ theme, active }) => 
    active ? theme.colors.interactive.primary : theme.colors.background.card
  };
  color: ${({ theme, active }) => 
    active ? 'white' : theme.colors.text.primary
  };
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast} ease;
  font-weight: 600;
  font-size: 1rem;

  ${({ theme, active }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      background: ${active 
        ? 'rgba(51, 102, 255, 0.8)' 
        : 'rgba(26, 26, 46, 0.5)'
      };
      backdrop-filter: blur(15px);
      border: 1px solid ${active 
        ? 'rgba(0, 245, 255, 0.8)' 
        : 'rgba(51, 102, 255, 0.3)'
      };
      box-shadow: ${active 
        ? '0 0 25px rgba(51, 102, 255, 0.4)' 
        : '0 0 15px rgba(51, 102, 255, 0.2)'
      };
    ` : ''
  };

  &:hover {
    transform: translateY(-2px);
    
    ${({ theme }) => 
      theme.name === 'Retro Futuristic Hologram' ? `
        box-shadow: 0 0 30px rgba(51, 102, 255, 0.4);
      ` : ''
    };
  }
`

const NewsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const NewsCard = styled(motion.div)<{ featured?: boolean; pinned?: boolean }>`
  background: ${({ theme }) => theme.colors.background.card};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  cursor: pointer;
  position: relative;
  overflow: hidden;

  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      background: rgba(26, 26, 46, 0.3);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(51, 102, 255, 0.3);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(
          90deg,
          transparent,
          ${theme.colors.terminal.purple}88,
          transparent
        );
      }
    ` : ''
  };

  ${({ featured, theme }) => featured && `
    border-color: ${theme.colors.status.warning};
    box-shadow: 0 0 20px ${theme.colors.status.warning}33;
  `}

  ${({ pinned, theme }) => pinned && `
    border-color: ${theme.colors.status.info};
    box-shadow: 0 0 20px ${theme.colors.status.info}33;
  `}

  &:hover {
    transform: translateY(-4px);
    border-color: ${({ theme }) => theme.colors.border.hover};
    
    ${({ theme }) => 
      theme.name === 'Retro Futuristic Hologram' ? `
        border-color: rgba(0, 245, 255, 0.6);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(51, 102, 255, 0.3);
      ` : ''
    };
  }
`

const NewsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const NewsTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  line-height: 1.4;
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      color: ${theme.colors.terminal.cyan};
      text-shadow: 0 0 8px ${theme.colors.terminal.cyan}44;
    ` : ''
  };
`

const NewsContent = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  font-size: 0.95rem;
`

const NewsMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text.muted};
`

const NewsStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`

const StatItem = styled.div`
  text-align: center;
`

const StatValue = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      color: ${theme.colors.terminal.cyan};
      text-shadow: 0 0 5px ${theme.colors.terminal.cyan}44;
    ` : ''
  };
`

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.text.muted};
`

const RSSSourcesPanel = styled(motion.div)`
  background: ${({ theme }) => theme.colors.background.card};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      background: rgba(26, 26, 46, 0.3);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(51, 102, 255, 0.3);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    ` : ''
  };
`

const RSSSourceItem = styled.div<{ active: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme, active }) => 
    active ? theme.colors.status.success : theme.colors.border.secondary
  };
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme, active }) => 
    active ? theme.colors.status.success + '11' : theme.colors.background.secondary
  };
`

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: ${({ theme }) => theme.colors.text.muted};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 1.1rem;
`

export const EnhancedNewsManager: React.FC = () => {
  const { currentTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<'news' | 'rss' | 'analytics'>('news')
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [rssSources, setRssSources] = useState<RSSSource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for demonstration
    setNewsArticles([
      {
        id: '1',
        title: 'Claude 3.5 Sonnet: Enhanced Code Generation Capabilities',
        slug: 'claude-3-5-sonnet-enhanced-code',
        excerpt: 'Anthropic announces major improvements to Claude 3.5 Sonnet with better code understanding.',
        content: 'Anthropic has released significant improvements to Claude 3.5 Sonnet, focusing on enhanced code generation capabilities, better debugging support, and faster response times for development tasks.',
        author: { id: '1', username: 'Anthropic', avatar_url: '' },
        category: 'official',
        tags: ['claude', 'ai', 'code-generation', 'updates'],
        featured: true,
        pinned: false,
        source: 'Anthropic Blog',
        view_count: 4521,
        like_count: 328,
        comment_count: 67,
        status: 'published',
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Community Spotlight: Top 10 Extensions This Month',
        slug: 'community-top-extensions-march',
        excerpt: 'Discover the most popular Claude Code extensions that are transforming developer workflows.',
        content: 'This month\'s community highlights feature the most downloaded and highest-rated extensions, including new productivity tools, AI assistants, and development utilities.',
        author: { id: '2', username: 'cldcde-team', avatar_url: '' },
        category: 'community',
        tags: ['community', 'extensions', 'spotlight', 'productivity'],
        featured: false,
        pinned: true,
        view_count: 2847,
        like_count: 198,
        comment_count: 43,
        status: 'published',
        published_at: new Date(Date.now() - 86400000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '3',
        title: 'MCP Protocol Updates: What Developers Need to Know',
        slug: 'mcp-protocol-updates-march',
        excerpt: 'Key updates to the Model Context Protocol that affect MCP server development.',
        content: 'The latest MCP protocol updates introduce new capabilities for server developers, including improved error handling, enhanced security features, and better performance optimizations.',
        author: { id: '3', username: 'protocol-team', avatar_url: '' },
        category: 'technical',
        tags: ['mcp', 'protocol', 'development', 'updates'],
        featured: false,
        pinned: false,
        view_count: 1634,
        like_count: 124,
        comment_count: 29,
        status: 'published',
        published_at: new Date(Date.now() - 172800000).toISOString(),
        created_at: new Date(Date.now() - 172800000).toISOString()
      }
    ])

    setRssSources([
      {
        id: '1',
        name: 'Anthropic Blog',
        url: 'https://anthropic.com/rss',
        category: 'official',
        active: true,
        last_fetched: new Date(Date.now() - 3600000).toISOString(),
        error_count: 0
      },
      {
        id: '2',
        name: 'Claude AI Subreddit',
        url: 'https://reddit.com/r/ClaudeAI/.rss',
        category: 'community',
        active: true,
        last_fetched: new Date(Date.now() - 7200000).toISOString(),
        error_count: 0
      },
      {
        id: '3',
        name: 'GitHub Claude Releases',
        url: 'https://github.com/anthropics/releases.atom',
        category: 'technical',
        active: false,
        error_count: 3
      }
    ])

    setLoading(false)
  }, [])

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

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

  const handleArticleClick = (article: NewsArticle) => {
    console.log('Article clicked:', article)
    // In production, navigate to article detail page
  }

  if (loading) {
    return (
      <Container>
        <LoadingState>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Loading news management...
          </motion.div>
        </LoadingState>
      </Container>
    )
  }

  return (
    <Container
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <Header>
        <Title
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Advanced News Management
        </Title>
      </Header>

      <TabContainer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Tab
          active={activeTab === 'news'}
          onClick={() => setActiveTab('news')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          📰 News Articles
        </Tab>
        <Tab
          active={activeTab === 'rss'}
          onClick={() => setActiveTab('rss')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          📡 RSS Sources
        </Tab>
        <Tab
          active={activeTab === 'analytics'}
          onClick={() => setActiveTab('analytics')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          📊 Analytics
        </Tab>
      </TabContainer>

      <AnimatePresence mode="wait">
        {activeTab === 'news' && (
          <motion.div
            key="news"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <NewsGrid>
              {newsArticles.map((article, index) => (
                <NewsCard
                  key={article.id}
                  featured={article.featured}
                  pinned={article.pinned}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleArticleClick(article)}
                >
                  <NewsHeader>
                    <div>
                      <NewsTitle>{article.title}</NewsTitle>
                      <NewsMeta>
                        <span>{formatDate(article.published_at)}</span>
                        <span>•</span>
                        <span>{article.author.username}</span>
                        <span>•</span>
                        <span>{article.category}</span>
                        {article.featured && <span style={{ color: '#F59E0B' }}>• ⭐ Featured</span>}
                        {article.pinned && <span style={{ color: '#3B82F6' }}>• 📌 Pinned</span>}
                      </NewsMeta>
                    </div>
                  </NewsHeader>

                  <NewsContent>
                    {article.excerpt || article.content}
                  </NewsContent>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {article.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          backgroundColor: currentTheme.colors.background.secondary,
                          color: currentTheme.colors.text.tertiary,
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.8rem',
                          fontFamily: currentTheme.fonts.mono
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <NewsStats>
                    <StatItem>
                      <StatValue>{formatNumber(article.view_count)}</StatValue>
                      <StatLabel>Views</StatLabel>
                    </StatItem>
                    <StatItem>
                      <StatValue>{formatNumber(article.like_count)}</StatValue>
                      <StatLabel>Likes</StatLabel>
                    </StatItem>
                    <StatItem>
                      <StatValue>{formatNumber(article.comment_count)}</StatValue>
                      <StatLabel>Comments</StatLabel>
                    </StatItem>
                  </NewsStats>
                </NewsCard>
              ))}
            </NewsGrid>
          </motion.div>
        )}

        {activeTab === 'rss' && (
          <motion.div
            key="rss"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <RSSSourcesPanel>
              <h3 style={{ marginBottom: '1.5rem', color: currentTheme.colors.text.primary }}>
                RSS Feed Sources
              </h3>
              {rssSources.map(source => (
                <RSSSourceItem key={source.id} active={source.active}>
                  <div>
                    <h4 style={{ color: currentTheme.colors.text.primary, marginBottom: '0.25rem' }}>
                      {source.name}
                    </h4>
                    <p style={{ color: currentTheme.colors.text.muted, fontSize: '0.9rem' }}>
                      {source.url}
                    </p>
                    {source.last_fetched && (
                      <p style={{ color: currentTheme.colors.text.muted, fontSize: '0.8rem' }}>
                        Last fetched: {formatDate(source.last_fetched)}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      color: source.active ? currentTheme.colors.status.success : currentTheme.colors.status.error,
                      fontWeight: 600,
                      marginBottom: '0.25rem'
                    }}>
                      {source.active ? '✅ Active' : '❌ Inactive'}
                    </div>
                    {source.error_count > 0 && (
                      <div style={{ color: currentTheme.colors.status.warning, fontSize: '0.8rem' }}>
                        {source.error_count} error(s)
                      </div>
                    )}
                  </div>
                </RSSSourceItem>
              ))}
            </RSSSourcesPanel>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ textAlign: 'center', padding: '4rem 0' }}
          >
            <h3 style={{ color: currentTheme.colors.text.primary, marginBottom: '1rem' }}>
              📊 Analytics Dashboard
            </h3>
            <p style={{ color: currentTheme.colors.text.secondary }}>
              News analytics and performance metrics coming soon...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  )
}