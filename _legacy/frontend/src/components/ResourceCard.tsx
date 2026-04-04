import React, { useState } from 'react'
import styled from 'styled-components'
import { DownloadModal } from './DownloadModal'

interface ResourceCardProps {
  resource: {
    id: string
    name: string
    description: string
    author: string
    github_url?: string
    download_url?: string
    download_count: number
    github_stars: number
    type: 'extension' | 'mcp_server'
    featured?: boolean
  }
  isAuthenticated: boolean
}

const Card = styled.div`
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};
  position: relative;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.border.focus};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`

const FeaturedBadge = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.interactive.primary};
  color: white;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
`

const Title = styled.h3`
  font-size: 1.2rem;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.primary};
`

const Description = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text.muted};
`

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`

const Author = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  span {
    color: ${({ theme }) => theme.colors.interactive.primary};
  }
`

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ variant, theme }) => 
    variant === 'primary' ? theme.colors.interactive.primary : 'transparent'
  };
  color: ${({ variant, theme }) => 
    variant === 'primary' ? 'white' : theme.colors.text.primary
  };
  border: 1px solid ${({ variant, theme }) => 
    variant === 'primary' ? theme.colors.interactive.primary : theme.colors.border.primary
  };
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};
  
  &:hover {
    background: ${({ variant, theme }) => 
      variant === 'primary' ? theme.colors.interactive.primaryHover : theme.colors.background.tertiary
    };
    transform: translateY(-1px);
  }
`

export const ResourceCard: React.FC<ResourceCardProps> = ({ 
  resource, 
  isAuthenticated 
}) => {
  const [showDownloadModal, setShowDownloadModal] = useState(false)

  const handleDownloadClick = () => {
    setShowDownloadModal(true)
  }

  const handleGitHubClick = () => {
    window.open(resource.github_url, '_blank')
  }

  return (
    <>
      <Card>
        {resource.featured && <FeaturedBadge>Featured</FeaturedBadge>}
        
        <Title>{resource.name}</Title>
        <Author>by <span>{resource.author}</span></Author>
        <Description>{resource.description}</Description>
        
        <Meta>
          <MetaItem>
            ⬇️ {resource.download_count || 0} downloads
          </MetaItem>
          <MetaItem>
            ⭐ {resource.github_stars || 0} stars
          </MetaItem>
        </Meta>
        
        <Actions>
          <Button variant="primary" onClick={handleDownloadClick}>
            Download
          </Button>
          {resource.github_url && (
            <Button variant="secondary" onClick={handleGitHubClick}>
              View on GitHub
            </Button>
          )}
        </Actions>
      </Card>
      
      {showDownloadModal && (
        <DownloadModal
          resource={resource}
          onClose={() => setShowDownloadModal(false)}
          isAuthenticated={isAuthenticated}
        />
      )}
    </>
  )
}