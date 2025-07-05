import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../hooks/useTheme'

interface NewsArticle {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: { username: string; avatar_url?: string }
  category: string
  tags: string[]
  featured: boolean
  view_count: number
  like_count: number
  comment_count: number
  published_at: string
  og_image?: string
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
          ellipse at 80% 20%,
          rgba(51, 102, 255, 0.08) 0%,
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
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.terminal.cyan},
    ${({ theme }) => theme.colors.terminal.blue}
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      filter: drop-shadow(0 0 20px ${theme.colors.terminal.cyan});
    ` : ''
  };
`

const CategoryTabs = styled(motion.div)`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
`

const CategoryTab = styled(motion.button)<{ active: boolean }>`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 2px solid ${({ theme, active }) => 
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
      border: 2px solid ${active 
        ? 'rgba(0, 245, 255, 0.8)' 
        : 'rgba(51, 102, 255, 0.3)'
      };
      box-shadow: ${active 
        ? '0 0 25px rgba(51, 102, 255, 0.5)' 
        : '0 0 15px rgba(51, 102, 255, 0.2)'
      };
    ` : ''
  };

  &:hover {
    transform: translateY(-3px);
    
    ${({ theme }) => 
      theme.name === 'Retro Futuristic Hologram' ? `
        box-shadow: 0 0 30px rgba(51, 102, 255, 0.4);
      ` : ''
    };
  }
`

const NewsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${({ theme }) => theme.spacing.xxl};
  position: relative;
  z-index: 1;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.xl};
  }
`

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`

const FeaturedArticle = styled(motion.article)`
  background: ${({ theme }) => theme.colors.background.card};
  border: 2px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  cursor: pointer;
  position: relative;

  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      background: rgba(26, 26, 46, 0.4);
      backdrop-filter: blur(20px);
      border: 2px solid rgba(51, 102, 255, 0.4);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3), 0 0 40px rgba(51, 102, 255, 0.2);
      
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
          ${theme.colors.terminal.cyan},
          ${theme.colors.terminal.blue},
          transparent
        );
        animation: hologram-slide 3s ease-in-out infinite;
      }
    ` : ''
  };

  &:hover {
    transform: translateY(-6px);
    border-color: ${({ theme }) => theme.colors.border.focus};
    
    ${({ theme }) => 
      theme.name === 'Retro Futuristic Hologram' ? `
        border-color: rgba(0, 245, 255, 0.8);
        box-shadow: 0 16px 50px rgba(0, 0, 0, 0.4), 0 0 50px rgba(51, 102, 255, 0.4);
      ` : ''
    };
  }

  @keyframes hologram-slide {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(0%); }
    100% { transform: translateX(100%); }
  }
`

const ArticleImage = styled.div<{ image?: string }>`
  height: 250px;
  background: ${({ image, theme }) => 
    image 
      ? `url(${image})` 
      : `linear-gradient(135deg, ${theme.colors.terminal.blue}22, ${theme.colors.terminal.cyan}22)`
  };
  background-size: cover;
  background-position: center;
  position: relative;

  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          45deg,
          transparent 30%,
          ${theme.colors.terminal.cyan}11 50%,
          transparent 70%
        );
      }
    ` : ''
  };
`

const ArticleContent = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
`

const ArticleTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  line-height: 1.3;
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      color: ${theme.colors.terminal.cyan};
      text-shadow: 0 0 10px ${theme.colors.terminal.cyan}44;
    ` : ''
  };
`

const ArticleExcerpt = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const ArticleMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 0.9rem;
`

const ArticleStats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 0.9rem;
`

const StatItem = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      color: ${theme.colors.terminal.cyan};
      text-shadow: 0 0 5px ${theme.colors.terminal.cyan}33;
    ` : ''
  };
`

const RegularArticle = styled(motion.article)`
  background: ${({ theme }) => theme.colors.background.card};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast} ease;

  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      background: rgba(26, 26, 46, 0.3);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(51, 102, 255, 0.3);
      box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
    ` : ''
  };

  &:hover {
    transform: translateY(-3px);
    border-color: ${({ theme }) => theme.colors.border.hover};
    
    ${({ theme }) => 
      theme.name === 'Retro Futuristic Hologram' ? `
        border-color: rgba(0, 245, 255, 0.5);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(51, 102, 255, 0.3);
      ` : ''
    };
  }
`

const RegularTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  line-height: 1.4;
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      color: ${theme.colors.terminal.cyan};
    ` : ''
  };
`

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`

const SidebarSection = styled(motion.div)`
  background: ${({ theme }) => theme.colors.background.card};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};

  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      background: rgba(26, 26, 46, 0.3);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(51, 102, 255, 0.3);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
    ` : ''
  };
`

const SidebarTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      color: ${theme.colors.terminal.cyan};
      text-shadow: 0 0 10px ${theme.colors.terminal.cyan}44;
    ` : ''
  };
`

const TrendingItem = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.secondary};
  cursor: pointer;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    color: ${({ theme }) => theme.colors.interactive.primary};
  }
`

export const EnhancedNewsPage: React.FC = () => {
  const { currentTheme } = useTheme()
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'All News', icon: '📰' },
    { id: 'official', name: 'Official', icon: '🏢' },
    { id: 'community', name: 'Community', icon: '👥' },
    { id: 'updates', name: 'Updates', icon: '🔄' },
    { id: 'tutorials', name: 'Tutorials', icon: '📚' },
  ]

  useEffect(() => {
    // Mock data for demonstration
    setNews([
      {
        id: '1',
        title: 'OpenRouter Deep Dive: The AI Gateway Revolution',
        slug: 'openrouter-deep-dive',
        excerpt: 'Exploring how OpenRouter is transforming AI access with unified APIs, cost optimization, and seamless model switching.',
        content: 'Full article content here...',
        author: { username: 'iamcatface' },
        category: 'community',
        tags: ['openrouter', 'ai', 'api'],
        featured: true,
        view_count: 1234,
        like_count: 89,
        comment_count: 23,
        published_at: '2024-01-25',
        og_image: 'https://example.com/openrouter-hero.jpg'
      },
      {
        id: '2',
        title: 'Claude Code 2.0: Enhanced MCP Support',
        slug: 'claude-code-2-mcp',
        excerpt: 'Major update brings improved Model Context Protocol integration and better extension management.',
        content: 'Full article content here...',
        author: { username: 'anthropic' },
        category: 'official',
        tags: ['claude', 'mcp', 'update'],
        featured: false,
        view_count: 856,
        like_count: 45,
        comment_count: 12,
        published_at: '2024-01-23'
      },
      {
        id: '3',
        title: 'Building Your First MCP Server',
        slug: 'first-mcp-server',
        excerpt: 'A step-by-step guide to creating custom MCP servers for Claude Code integration.',
        content: 'Full article content here...',
        author: { username: 'devtools' },
        category: 'tutorials',
        tags: ['tutorial', 'mcp', 'development'],
        featured: false,
        view_count: 642,
        like_count: 34,
        comment_count: 8,
        published_at: '2024-01-22'
      }
    ])
    setLoading(false)
  }, [])

  const filteredNews = news.filter(article => 
    selectedCategory === 'all' || article.category === selectedCategory
  )

  const featuredArticle = filteredNews.find(article => article.featured)
  const regularArticles = filteredNews.filter(article => !article.featured)

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.2rem', color: currentTheme.colors.text.secondary }}>
            Loading news...
          </div>
        </div>
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
          News & Updates
        </Title>
      </Header>

      <CategoryTabs
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {categories.map((category) => (
          <CategoryTab
            key={category.id}
            active={selectedCategory === category.id}
            onClick={() => setSelectedCategory(category.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {category.icon} {category.name}
          </CategoryTab>
        ))}
      </CategoryTabs>

      <NewsGrid
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <MainContent>
          {featuredArticle && (
            <FeaturedArticle
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <ArticleImage image={featuredArticle.og_image} />
              <ArticleContent>
                <ArticleTitle>{featuredArticle.title}</ArticleTitle>
                <ArticleExcerpt>{featuredArticle.excerpt}</ArticleExcerpt>
                <ArticleMeta>
                  <AuthorInfo>
                    👤 {featuredArticle.author.username} • {featuredArticle.published_at}
                  </AuthorInfo>
                  <ArticleStats>
                    <StatItem>👁️ {featuredArticle.view_count}</StatItem>
                    <StatItem>❤️ {featuredArticle.like_count}</StatItem>
                    <StatItem>💬 {featuredArticle.comment_count}</StatItem>
                  </ArticleStats>
                </ArticleMeta>
              </ArticleContent>
            </FeaturedArticle>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <AnimatePresence>
              {regularArticles.map((article) => (
                <RegularArticle
                  key={article.id}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  whileHover={{ scale: 1.02 }}
                  layout
                >
                  <RegularTitle>{article.title}</RegularTitle>
                  <ArticleExcerpt style={{ marginBottom: '1rem' }}>
                    {article.excerpt}
                  </ArticleExcerpt>
                  <ArticleMeta>
                    <AuthorInfo>
                      👤 {article.author.username} • {article.published_at}
                    </AuthorInfo>
                    <ArticleStats>
                      <StatItem>👁️ {article.view_count}</StatItem>
                      <StatItem>❤️ {article.like_count}</StatItem>
                    </ArticleStats>
                  </ArticleMeta>
                </RegularArticle>
              ))}
            </AnimatePresence>
          </div>
        </MainContent>

        <Sidebar>
          <SidebarSection>
            <SidebarTitle>🔥 Trending</SidebarTitle>
            <TrendingItem>OpenRouter API Gateway Explained</TrendingItem>
            <TrendingItem>MCP Server Best Practices</TrendingItem>
            <TrendingItem>Claude Code Extension Development</TrendingItem>
            <TrendingItem>Community Showcase: Top Extensions</TrendingItem>
          </SidebarSection>

          <SidebarSection>
            <SidebarTitle>📊 Platform Stats</SidebarTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <StatItem>🚀 Extensions: 156</StatItem>
              <StatItem>🛠️ MCP Servers: 89</StatItem>
              <StatItem>👥 Users: 1,234</StatItem>
              <StatItem>📥 Downloads: 45,678</StatItem>
            </div>
          </SidebarSection>
        </Sidebar>
      </NewsGrid>
    </Container>
  )
}