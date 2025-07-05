import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../hooks/useTheme'

interface Extension {
  id: string
  name: string
  slug: string
  description: string
  category: string
  platform: string[]
  version: string
  author: { username: string; avatar_url?: string }
  downloads: number
  rating: number
  rating_count: number
  featured: boolean
  verified: boolean
  tags: string[]
  created_at: string
}

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  color: string
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
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.terminal.blue},
    ${({ theme }) => theme.colors.terminal.cyan}
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      filter: drop-shadow(0 0 20px ${theme.colors.terminal.cyan});
      text-shadow: 0 0 20px ${theme.colors.terminal.blue};
    ` : ''
  };
`

const Subtitle = styled(motion.p)`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 600px;
  margin: 0 auto;
`

const SearchAndFilters = styled(motion.div)`
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
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 2px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => theme.colors.background.card};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1rem;
  flex: 1;
  transition: all ${({ theme }) => theme.animations.duration.fast} ease;

  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      background: rgba(26, 26, 46, 0.5);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(51, 102, 255, 0.3);
      box-shadow: 0 0 15px rgba(51, 102, 255, 0.2);
    ` : ''
  };

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.border.focus};
    
    ${({ theme }) => 
      theme.name === 'Retro Futuristic Hologram' ? `
        border-color: ${theme.colors.terminal.cyan};
        box-shadow: 0 0 25px rgba(0, 245, 255, 0.4);
      ` : ''
    };
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`

const FilterTabs = styled(motion.div)`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`

const FilterTab = styled(motion.button)<{ active: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
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
  font-weight: 500;

  ${({ theme, active }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      background: ${active 
        ? 'rgba(51, 102, 255, 0.8)' 
        : 'rgba(26, 26, 46, 0.5)'
      };
      backdrop-filter: blur(10px);
      border: 1px solid ${active 
        ? 'rgba(0, 245, 255, 0.8)' 
        : 'rgba(51, 102, 255, 0.3)'
      };
      box-shadow: ${active 
        ? '0 0 20px rgba(51, 102, 255, 0.4)' 
        : '0 0 10px rgba(51, 102, 255, 0.2)'
      };
    ` : ''
  };

  &:hover {
    transform: translateY(-2px);
    
    ${({ theme }) => 
      theme.name === 'Retro Futuristic Hologram' ? `
        box-shadow: 0 0 25px rgba(51, 102, 255, 0.4);
      ` : ''
    };
  }
`

const ExtensionGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.lg};
  }
`

const ExtensionCard = styled(motion.div)`
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
      backdrop-filter: blur(15px);
      border: 1px solid rgba(51, 102, 255, 0.3);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
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

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  position: relative;
  z-index: 1;
`

const ExtensionName = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      color: ${theme.colors.terminal.cyan};
      text-shadow: 0 0 10px ${theme.colors.terminal.cyan}44;
    ` : ''
  };
`

const AuthorName = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text.muted};
`

const Badges = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`

const Badge = styled.span<{ variant: 'featured' | 'verified' | 'platform' }>`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 0.8rem;
  font-weight: 500;
  
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
  line-height: 1.5;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  position: relative;
  z-index: 1;
`

const Stats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  position: relative;
  z-index: 1;
`

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text.muted};
`

const StatValue = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  
  ${({ theme }) => 
    theme.name === 'Retro Futuristic Hologram' ? `
      color: ${theme.colors.terminal.cyan};
      text-shadow: 0 0 5px ${theme.colors.terminal.cyan}44;
    ` : ''
  };
`

export const EnhancedExtensionBrowser: React.FC = () => {
  const { currentTheme } = useTheme()
  const [extensions, setExtensions] = useState<Extension[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Mock data for demonstration
    setCategories([
      { id: 'all', name: 'All', slug: 'all', icon: '🎯', color: '#3B82F6' },
      { id: '1', name: 'Productivity', slug: 'productivity', icon: '⚡', color: '#3B82F6' },
      { id: '2', name: 'Development', slug: 'development', icon: '🛠️', color: '#10B981' },
      { id: '3', name: 'AI & ML', slug: 'ai-ml', icon: '🤖', color: '#8B5CF6' },
    ])

    setExtensions([
      {
        id: '1',
        name: 'Claude CLI Shortcuts',
        slug: 'claude-shortcuts',
        description: 'Comprehensive shortcut system for Claude CLI with auto-execute and experimental development features',
        category: 'productivity',
        platform: ['macos', 'linux', 'windows'],
        version: '1.0.0',
        author: { username: 'iamcatface' },
        downloads: 156,
        rating: 4.8,
        rating_count: 23,
        featured: true,
        verified: true,
        tags: ['shortcuts', 'productivity', 'cli'],
        created_at: '2024-01-15'
      },
      {
        id: '2',
        name: 'Experimental Development System',
        slug: 'experimental-dev',
        description: 'AI-driven parallel development workflow that creates 3 approaches and synthesizes optimal solutions',
        category: 'development',
        platform: ['macos', 'linux'],
        version: '1.0.0',
        author: { username: 'iamcatface' },
        downloads: 89,
        rating: 4.9,
        rating_count: 18,
        featured: false,
        verified: true,
        tags: ['development', 'ai', 'automation'],
        created_at: '2024-01-20'
      }
    ])
    
    setLoading(false)
  }, [])

  const filteredExtensions = extensions.filter(ext => {
    const matchesCategory = selectedCategory === 'all' || ext.category === selectedCategory
    const matchesSearch = ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ext.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.2rem', color: currentTheme.colors.text.secondary }}>
            Loading extensions...
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
          Extension Gallery
        </Title>
        <Subtitle
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Discover and install Claude Code extensions across all platforms
        </Subtitle>
      </Header>

      <SearchAndFilters
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <SearchInput
          type="text"
          placeholder="Search extensions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          whileFocus={{ scale: 1.02 }}
        />
        
        <FilterTabs>
          {categories.map((category) => (
            <FilterTab
              key={category.id}
              active={selectedCategory === category.slug}
              onClick={() => setSelectedCategory(category.slug)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category.icon} {category.name}
            </FilterTab>
          ))}
        </FilterTabs>
      </SearchAndFilters>

      <ExtensionGrid
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, staggerChildren: 0.1 }}
      >
        <AnimatePresence>
          {filteredExtensions.map((extension) => (
            <ExtensionCard
              key={extension.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              whileHover={{ scale: 1.02 }}
              layout
            >
              <CardHeader>
                <div>
                  <ExtensionName>{extension.name}</ExtensionName>
                  <AuthorName>by {extension.author.username}</AuthorName>
                </div>
                <Badges>
                  {extension.featured && (
                    <Badge variant="featured">⭐ Featured</Badge>
                  )}
                  {extension.verified && (
                    <Badge variant="verified">✓ Verified</Badge>
                  )}
                </Badges>
              </CardHeader>

              <Description>{extension.description}</Description>

              <Badges style={{ marginBottom: '1rem' }}>
                {extension.platform.map((platform) => (
                  <Badge key={platform} variant="platform">
                    {platform}
                  </Badge>
                ))}
              </Badges>

              <Stats>
                <StatItem>
                  📥 <StatValue>{extension.downloads}</StatValue> downloads
                </StatItem>
                <StatItem>
                  ⭐ <StatValue>{extension.rating}</StatValue> ({extension.rating_count})
                </StatItem>
                <StatItem>
                  📅 <StatValue>v{extension.version}</StatValue>
                </StatItem>
              </Stats>
            </ExtensionCard>
          ))}
        </AnimatePresence>
      </ExtensionGrid>
    </Container>
  )
}