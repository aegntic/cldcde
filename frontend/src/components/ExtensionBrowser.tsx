import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from './common/Card'

interface ExtensionBrowserProps {
  onClose: () => void
  user?: {
    username: string
    id: string
  } | null
}

interface Extension {
  id: string
  name: string
  description: string
  author: string
  tags: string[]
  downloads: number
  rating: number
  platform: string[]
  category: string
  version: string
  repository: string
  installScript: string
}

interface MCPServer {
  id: string
  name: string
  description: string
  author: string
  tags: string[]
  downloads: number
  rating: number
  platform: string[]
  category: string
  version: string
  repository: string
  installScript: string
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing.lg};
`

const BrowserContainer = styled(motion.div)`
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(10px);
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => theme.colors.background.secondary};
`

const Title = styled.h2`
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 1.5rem;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.background.tertiary};
  }
`

const FilterBar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.secondary};
  background: ${({ theme }) => theme.colors.background.card};
  flex-wrap: wrap;
  align-items: center;
`

const TabContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
`

const Tab = styled.button<{ active: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ active, theme }) => 
    active ? theme.colors.interactive.primary : theme.colors.background.secondary
  };
  color: ${({ active, theme }) => 
    active ? 'white' : theme.colors.text.secondary
  };
  border: 1px solid ${({ active, theme }) => 
    active ? theme.colors.interactive.primary : theme.colors.border.primary
  };
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: 500;
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};

  &:hover {
    background: ${({ active, theme }) => 
      active ? theme.colors.interactive.primaryHover : theme.colors.background.tertiary
    };
  }
`

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.sans};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.border.focus};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.border.focus}33;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`

const FilterSelect = styled.select`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.sans};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.border.focus};
  }
`

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.lg};
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  min-height: 100px;
`

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: ${({ theme }) => theme.colors.text.muted};
  font-family: ${({ theme }) => theme.fonts.mono};
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: ${({ theme }) => theme.colors.text.muted};
  font-family: ${({ theme }) => theme.fonts.mono};
  text-align: center;
  gap: ${({ theme }) => theme.spacing.md};
`

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border.secondary};
`

const PageButton = styled.button<{ active?: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ active, theme }) => 
    active ? theme.colors.interactive.primary : theme.colors.background.secondary
  };
  color: ${({ active, theme }) => 
    active ? 'white' : theme.colors.text.primary
  };
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-family: ${({ theme }) => theme.fonts.mono};
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};

  &:hover:not(:disabled) {
    background: ${({ active, theme }) => 
      active ? theme.colors.interactive.primaryHover : theme.colors.background.tertiary
    };
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const ExtensionBrowser: React.FC<ExtensionBrowserProps> = ({ onClose, user }) => {
  const [activeTab, setActiveTab] = useState<'extensions' | 'mcp'>('extensions')
  const [extensions, setExtensions] = useState<Extension[]>([])
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [sortBy, setSortBy] = useState('downloads')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = async () => {
    setLoading(true)
    try {
      const endpoint = activeTab === 'extensions' ? '/api/extensions' : '/api/mcp'
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sort: sortBy,
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(platformFilter && { platform: platformFilter })
      })

      const response = await fetch(`${endpoint}?${params}`)
      const data = await response.json()

      if (response.ok) {
        if (activeTab === 'extensions') {
          setExtensions(data.extensions || [])
        } else {
          setMcpServers(data.mcpServers || [])
        }
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        console.error('Failed to fetch data:', data.error)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab, currentPage, searchTerm, categoryFilter, platformFilter, sortBy])

  const handleItemClick = (item: Extension | MCPServer) => {
    console.log('Item clicked:', item)
    // In a real implementation, this would open a detail modal or navigate to a detail page
  }

  const renderItems = () => {
    const items = activeTab === 'extensions' ? extensions : mcpServers

    if (loading) {
      return <LoadingState>Loading...</LoadingState>
    }

    if (items.length === 0) {
      return (
        <EmptyState>
          <span>🔍</span>
          <div>No {activeTab} found matching your criteria</div>
        </EmptyState>
      )
    }

    return (
      <Grid>
        <AnimatePresence>
          {items.map((item, index) => (
            <Card
              key={item.id}
              title={item.name}
              description={item.description}
              author={item.author}
              tags={item.tags}
              stats={{
                downloads: item.downloads,
                rating: item.rating
              }}
              platform={item.platform}
              category={item.category}
              version={item.version}
              onClick={() => handleItemClick(item)}
            />
          ))}
        </AnimatePresence>
      </Grid>
    )
  }

  const categoryOptions = activeTab === 'extensions' 
    ? ['productivity', 'development', 'content', 'filesystem', 'database']
    : ['filesystem', 'database', 'api', 'tools', 'utilities']

  return (
    <Overlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <BrowserContainer
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Header>
          <Title>
            <span>📦</span>
            Browse {activeTab === 'extensions' ? 'Extensions' : 'MCP Servers'}
          </Title>
          <CloseButton onClick={onClose}>×</CloseButton>
        </Header>

        <FilterBar>
          <TabContainer>
            <Tab
              active={activeTab === 'extensions'}
              onClick={() => {
                setActiveTab('extensions')
                setCurrentPage(1)
              }}
            >
              Extensions
            </Tab>
            <Tab
              active={activeTab === 'mcp'}
              onClick={() => {
                setActiveTab('mcp')
                setCurrentPage(1)
              }}
            >
              MCP Servers
            </Tab>
          </TabContainer>

          <SearchInput
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
          />

          <FilterSelect
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="">All Categories</option>
            {categoryOptions.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={platformFilter}
            onChange={(e) => {
              setPlatformFilter(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="">All Platforms</option>
            <option value="macos">macOS</option>
            <option value="linux">Linux</option>
            <option value="windows">Windows</option>
          </FilterSelect>

          <FilterSelect
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="downloads">Most Downloads</option>
            <option value="rating">Highest Rated</option>
            <option value="created">Newest</option>
            <option value="updated">Recently Updated</option>
            <option value="name">Name (A-Z)</option>
          </FilterSelect>
        </FilterBar>

        <Content>
          {renderItems()}
        </Content>

        {totalPages > 1 && (
          <Pagination>
            <PageButton
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Previous
            </PageButton>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page = i + 1
              if (totalPages > 5 && currentPage > 3) {
                page = currentPage - 2 + i
                if (page > totalPages) page = totalPages - 4 + i
              }
              
              return (
                <PageButton
                  key={page}
                  active={page === currentPage}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </PageButton>
              )
            })}
            
            <PageButton
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next →
            </PageButton>
          </Pagination>
        )}
      </BrowserContainer>
    </Overlay>
  )
}

export { ExtensionBrowser }
