import React from 'react'
import styled from 'styled-components'
import { useFeaturedSection, useHomepageHero } from '../hooks/useDynamicContent'
import { Loader } from './Loader'

// Styled components
const HeroSection = styled.section`
  padding: 2rem;
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border};
  margin-bottom: 2rem;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
`

const StatCard = styled.div`
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  padding: 1.5rem;
  text-align: center;
  
  h3 {
    color: ${props => props.theme.primary};
    font-size: 2rem;
    margin: 0;
  }
  
  p {
    color: ${props => props.theme.text};
    margin: 0.5rem 0 0;
  }
`

const FeaturedSection = styled.section`
  margin: 2rem 0;
  
  h2 {
    color: ${props => props.theme.heading};
    border-bottom: 2px solid ${props => props.theme.border};
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`

const ItemGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
`

const ItemCard = styled.div`
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  padding: 1rem;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.primary};
    transform: translateY(-2px);
  }
  
  h3 {
    color: ${props => props.theme.primary};
    margin: 0 0 0.5rem;
  }
  
  p {
    color: ${props => props.theme.text};
    font-size: 0.9rem;
    margin: 0.5rem 0;
  }
  
  .meta {
    display: flex;
    justify-content: space-between;
    margin-top: 1rem;
    font-size: 0.8rem;
    color: ${props => props.theme.mutedText};
  }
`

const RefreshButton = styled.button`
  background: none;
  border: 1px solid ${props => props.theme.primary};
  color: ${props => props.theme.primary};
  padding: 0.25rem 0.75rem;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background: ${props => props.theme.primary};
    color: ${props => props.theme.background};
  }
`

const ConnectionIndicator = styled.div<{ connected: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: ${props => props.connected ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)'};
  border: 1px solid ${props => props.connected ? '#00ff00' : '#ff0000'};
  color: ${props => props.connected ? '#00ff00' : '#ff0000'};
  font-size: 0.8rem;
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    animation: ${props => props.connected ? 'pulse 2s infinite' : 'none'};
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`

// Homepage Hero Component
export const HomepageHero: React.FC = () => {
  const { stats, trending, latestActivity, isLoading, connectionStatus } = useHomepageHero()

  if (isLoading) {
    return (
      <HeroSection>
        <Loader />
      </HeroSection>
    )
  }

  return (
    <HeroSection>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Claude Extensions Platform</h1>
        {connectionStatus && (
          <ConnectionIndicator connected={connectionStatus.connected}>
            {connectionStatus.connected ? 'Live Updates' : 'Reconnecting...'}
          </ConnectionIndicator>
        )}
      </div>

      <StatsGrid>
        <StatCard>
          <h3>{stats.extensionCount.toLocaleString()}</h3>
          <p>Extensions</p>
        </StatCard>
        <StatCard>
          <h3>{stats.mcpCount.toLocaleString()}</h3>
          <p>MCP Servers</p>
        </StatCard>
        <StatCard>
          <h3>{stats.userCount.toLocaleString()}</h3>
          <p>Community Members</p>
        </StatCard>
        <StatCard>
          <h3>{stats.totalDownloads.toLocaleString()}</h3>
          <p>Total Downloads</p>
        </StatCard>
      </StatsGrid>

      {latestActivity && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0, 255, 0, 0.1)', border: '1px solid #00ff00' }}>
          <strong>Latest Activity:</strong> {latestActivity.actionText} - {latestActivity.formattedTime}
        </div>
      )}

      {trending.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Trending Now</h3>
          <ItemGrid>
            {trending.map(item => (
              <ItemCard key={item.id}>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className="meta">
                  <span>{item.downloads} downloads</span>
                  <span>★ {item.rating.toFixed(1)}</span>
                </div>
              </ItemCard>
            ))}
          </ItemGrid>
        </div>
      )}
    </HeroSection>
  )
}

// Featured Section Component
interface FeaturedSectionProps {
  type: 'trending' | 'new' | 'popular'
  title: string
  autoRefresh?: boolean
}

export const FeaturedContentSection: React.FC<FeaturedSectionProps> = ({ type, title, autoRefresh = false }) => {
  const { items, totalCount, isLoading, isExpanded, setIsExpanded, hasUpdates, refresh } = useFeaturedSection(type, { autoRefresh })

  if (isLoading) {
    return (
      <FeaturedSection>
        <h2>{title}</h2>
        <Loader />
      </FeaturedSection>
    )
  }

  return (
    <FeaturedSection>
      <h2>
        <span>
          {title} {hasUpdates && <span style={{ color: '#00ff00', fontSize: '0.8rem' }}>(New updates available)</span>}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {totalCount > 6 && (
            <RefreshButton onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? 'Show Less' : `Show All (${totalCount})`}
            </RefreshButton>
          )}
          <RefreshButton onClick={refresh}>Refresh</RefreshButton>
        </div>
      </h2>

      <ItemGrid>
        {items.map(item => (
          <ItemCard key={item.id}>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <div className="meta">
              <span>{item.category}</span>
              <span>{item.downloads} downloads</span>
              <span>★ {item.rating.toFixed(1)}</span>
            </div>
          </ItemCard>
        ))}
      </ItemGrid>
    </FeaturedSection>
  )
}

// Example usage in a page component
export const HomePage: React.FC = () => {
  return (
    <div>
      <HomepageHero />
      <FeaturedContentSection type="trending" title="🔥 Trending Extensions" autoRefresh />
      <FeaturedContentSection type="new" title="✨ New Arrivals" autoRefresh />
      <FeaturedContentSection type="popular" title="⭐ Popular MCP Servers" />
    </div>
  )
}