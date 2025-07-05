import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../hooks/useTheme'

interface Resource {
  id: string
  name: string
  slug: string
  description: string
  long_description?: string
  category: string
  subcategory?: string
  platform: string[]
  version: string
  author: {
    id: string
    username: string
    avatar_url?: string
  }
  downloads: number
  rating: number
  rating_count: number
  featured: boolean
  verified: boolean
  tags?: string[]
  screenshots?: string[]
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
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
          ellipse at 50% 0%,
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
    ${({ theme }) => theme.colors.terminal.cyan},
    ${({ theme }) => theme.colors.interactive.accent}
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      filter: drop-shadow(0 0 30px ${theme.colors.terminal.cyan});
      text-shadow: 0 0 20px ${theme.colors.terminal.blue};
    ` : ''
  };

  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`

const Subtitle = styled(motion.p)`
  font-size: 1.3rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.5;
`

const FilterSection = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  position: relative;
  z-index: 1;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`

const SearchInput = styled(motion.input)`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 2px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => theme.colors.background.card};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1.1rem;
  flex: 1;
  max-width: 500px;
  transition: all ${({ theme }) => theme.animations.duration.fast} ease;

  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      background: rgba(26, 26, 46, 0.5);
      backdrop-filter: blur(15px);
      border: 2px solid rgba(51, 102, 255, 0.3);
      box-shadow: 0 0 20px rgba(51, 102, 255, 0.2);
    ` : ''
  };

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.border.focus};
    
    ${({ theme }) => 
      theme.name === 'Retro Futuristic Hologram' ? `
        border-color: ${theme.colors.terminal.cyan};
        box-shadow: 0 0 30px rgba(0, 245, 255, 0.4);
      ` : ''
    };
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`

const CategoryTabs = styled(motion.div)`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  justify-content: center;

  @media (min-width: 768px) {
    justify-content: flex-start;
  }
`

const CategoryTab = styled(motion.button)<{ active: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
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
  font-size: 0.95rem;
  white-space: nowrap;

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

const ResourceGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.lg};
  }
`

const ResourceCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.background.card};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all ${({ theme }) => theme.animations.duration.normal} ease;

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
          ${theme.colors.terminal.cyan}88,
          transparent
        );
      }
      
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(
          circle at 50% 0%,
          rgba(51, 102, 255, 0.05) 0%,
          transparent 50%
        );
        pointer-events: none;
      }
    ` : ''
  };

  &:hover {
    transform: translateY(-8px);
    border-color: ${({ theme }) => theme.colors.border.hover};
    
    ${({ theme }) => 
      theme.name === 'Retro Futuristic Hologram' ? `
        border-color: rgba(0, 245, 255, 0.6);
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4), 0 0 40px rgba(51, 102, 255, 0.3);
      ` : ''
    };
  }
`

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  position: relative;
  z-index: 1;
`

const ResourceName = styled.h3`
  font-size: 1.4rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  line-height: 1.3;
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      color: ${theme.colors.terminal.cyan};
      text-shadow: 0 0 10px ${theme.colors.terminal.cyan}44;
    ` : ''
  };
`

const AuthorName = styled.span`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.text.muted};
  font-weight: 500;
`

const BadgeContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`

const Badge = styled.span<{ variant: 'featured' | 'verified' | 'platform' | 'category' }>`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  
  ${({ theme, variant }) => {
    switch (variant) {
      case 'featured':
        return `
          background: ${theme.colors.status.warning}22;
          color: ${theme.colors.status.warning};
          border: 1px solid ${theme.colors.status.warning}44;
        `
      case 'verified':
        return `
          background: ${theme.colors.status.success}22;
          color: ${theme.colors.status.success};
          border: 1px solid ${theme.colors.status.success}44;
        `
      case 'platform':
        return `
          background: ${theme.colors.interactive.primary}22;
          color: ${theme.colors.interactive.primary};
          border: 1px solid ${theme.colors.interactive.primary}44;
        `
      case 'category':
        return `
          background: ${theme.colors.border.primary}22;
          color: ${theme.colors.text.secondary};
          border: 1px solid ${theme.colors.border.primary};
        `
    }
  }}
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      backdrop-filter: blur(5px);
      box-shadow: 0 0 5px currentColor;
    ` : ''
  };
`

const Description = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  position: relative;
  z-index: 1;
  font-size: 0.95rem;
`

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const Tag = styled.span`
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.tertiary};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 0.8rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
`

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: auto;
  position: relative;
  z-index: 1;
`

const StatItem = styled.div`
  text-align: center;
`

const StatValue = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      color: ${theme.colors.terminal.cyan};
      text-shadow: 0 0 8px ${theme.colors.terminal.cyan}44;
    ` : ''
  };
`

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.text.muted};
  font-weight: 500;
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

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: ${({ theme }) => theme.colors.text.muted};
  font-family: ${({ theme }) => theme.fonts.mono};
  text-align: center;
  gap: ${({ theme }) => theme.spacing.md};
  font-size: 1.1rem;
`

export const EnhancedResourceGallery: React.FC = () => {
  const { currentTheme } = useTheme()
  const [resources, setResources] = useState<Resource[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Mock data for demonstration - in production, fetch from API
    setCategories([
      { id: 'all', name: 'All Resources', slug: 'all', icon: '🎯', color: '#3B82F6' },
      { id: '1', name: 'Productivity', slug: 'productivity', icon: '⚡', color: '#3B82F6' },
      { id: '2', name: 'Development', slug: 'development', icon: '🛠️', color: '#10B981' },
      { id: '3', name: 'AI & ML', slug: 'ai-ml', icon: '🤖', color: '#8B5CF6' },
      { id: '4', name: 'Content Creation', slug: 'content', icon: '🎨', color: '#F59E0B' },
      { id: '5', name: 'Database', slug: 'database', icon: '🗄️', color: '#EF4444' },
    ])

    setResources([
      {
        id: '1',
        name: 'Claude CLI Shortcuts Pro',
        slug: 'claude-shortcuts-pro',
        description: 'Advanced shortcut system for Claude CLI with auto-execute, templates, and experimental development features for power users.',
        category: 'productivity',
        platform: ['macos', 'linux', 'windows'],
        version: '2.1.0',
        author: { id: '1', username: 'iamcatface', avatar_url: '' },
        downloads: 2847,
        rating: 4.9,
        rating_count: 127,
        featured: true,
        verified: true,
        tags: ['shortcuts', 'productivity', 'cli', 'automation'],
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-03-10T00:00:00Z'
      },
      {
        id: '2',
        name: 'AI Code Review Assistant',
        slug: 'ai-code-review',
        description: 'Intelligent code review system that analyzes code quality, suggests improvements, and enforces coding standards.',
        category: 'development',
        platform: ['macos', 'linux'],
        version: '1.4.2',
        author: { id: '2', username: 'devmaster', avatar_url: '' },
        downloads: 1923,
        rating: 4.8,
        rating_count: 89,
        featured: true,
        verified: true,
        tags: ['code-review', 'ai', 'quality', 'automation'],
        created_at: '2024-01-20T00:00:00Z',
        updated_at: '2024-03-05T00:00:00Z'
      },
      {
        id: '3',
        name: 'Database Schema Analyzer',
        slug: 'db-schema-analyzer',
        description: 'Automatically analyzes database schemas and generates TypeScript interfaces, Zod schemas, and SQL migrations.',
        category: 'database',
        platform: ['macos', 'linux', 'windows'],
        version: '1.2.1',
        author: { id: '3', username: 'dbexpert', avatar_url: '' },
        downloads: 1456,
        rating: 4.7,
        rating_count: 64,
        featured: false,
        verified: true,
        tags: ['database', 'typescript', 'schema', 'migration'],
        created_at: '2024-02-01T00:00:00Z',
        updated_at: '2024-03-01T00:00:00Z'
      },
      {
        id: '4',
        name: 'Content Generator Suite',
        slug: 'content-generator',
        description: 'Complete content creation toolkit with AI-powered writing, image generation, and social media optimization.',
        category: 'content',
        platform: ['macos', 'windows'],
        version: '3.0.0',
        author: { id: '4', username: 'contentpro', avatar_url: '' },
        downloads: 3241,
        rating: 4.6,
        rating_count: 156,
        featured: true,
        verified: false,
        tags: ['content', 'ai', 'writing', 'social-media'],
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-03-15T00:00:00Z'
      },
      {
        id: '5',
        name: 'ML Model Trainer',
        slug: 'ml-trainer',
        description: 'Streamlined machine learning model training with automated hyperparameter tuning and model evaluation.',
        category: 'ai-ml',
        platform: ['linux'],
        version: '0.9.5',
        author: { id: '5', username: 'mlresearcher', avatar_url: '' },
        downloads: 892,
        rating: 4.5,
        rating_count: 34,
        featured: false,
        verified: true,
        tags: ['machine-learning', 'training', 'automation', 'evaluation'],
        created_at: '2024-02-15T00:00:00Z',
        updated_at: '2024-03-08T00:00:00Z'
      }
    ])
    
    setLoading(false)
  }, [])

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory
    const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  const handleResourceClick = (resource: Resource) => {
    console.log('Resource clicked:', resource)
    // In production, navigate to resource detail page
  }

  if (loading) {
    return (
      <Container>
        <LoadingState>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Loading enhanced resources...
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
          Enhanced Resource Gallery
        </Title>
        <Subtitle
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Discover powerful Claude Code extensions and MCP servers with advanced categorization, 
          user reviews, and community-driven ratings
        </Subtitle>
      </Header>

      <FilterSection
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <SearchInput
          type="text"
          placeholder="Search resources by name, description, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          whileFocus={{ scale: 1.02 }}
        />
        
        <CategoryTabs>
          {categories.map((category) => (
            <CategoryTab
              key={category.id}
              active={selectedCategory === category.slug}
              onClick={() => setSelectedCategory(category.slug)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category.icon} {category.name}
            </CategoryTab>
          ))}
        </CategoryTabs>
      </FilterSection>

      <ResourceGrid
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <AnimatePresence>
          {filteredResources.length > 0 ? (
            filteredResources.map((resource, index) => (
              <ResourceCard
                key={resource.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleResourceClick(resource)}
                layout
              >
                <CardHeader>
                  <div>
                    <ResourceName>{resource.name}</ResourceName>
                    <AuthorName>by {resource.author.username}</AuthorName>
                  </div>
                  <BadgeContainer>
                    {resource.featured && (
                      <Badge variant="featured">⭐ Featured</Badge>
                    )}
                    {resource.verified && (
                      <Badge variant="verified">✓ Verified</Badge>
                    )}
                  </BadgeContainer>
                </CardHeader>

                <Description>{resource.description}</Description>

                <BadgeContainer style={{ marginBottom: '1rem' }}>
                  <Badge variant="category">{resource.category}</Badge>
                  {resource.platform.map((platform) => (
                    <Badge key={platform} variant="platform">
                      {platform}
                    </Badge>
                  ))}
                </BadgeContainer>

                {resource.tags && resource.tags.length > 0 && (
                  <TagsContainer>
                    {resource.tags.map((tag) => (
                      <Tag key={tag}>#{tag}</Tag>
                    ))}
                  </TagsContainer>
                )}

                <StatsContainer>
                  <StatItem>
                    <StatValue>{formatNumber(resource.downloads)}</StatValue>
                    <StatLabel>Downloads</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>★ {resource.rating}</StatValue>
                    <StatLabel>Rating ({resource.rating_count})</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue>v{resource.version}</StatValue>
                    <StatLabel>Version</StatLabel>
                  </StatItem>
                </StatsContainer>
              </ResourceCard>
            ))
          ) : (
            <EmptyState>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                🔍
              </motion.div>
              <div>No resources found matching your criteria</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                Try adjusting your search or selecting a different category
              </div>
            </EmptyState>
          )}
        </AnimatePresence>
      </ResourceGrid>
    </Container>
  )
}