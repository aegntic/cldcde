import React, { useState } from 'react'
import styled from 'styled-components'
import { ShareModal } from './ShareModal'
import { formatDistanceToNow } from 'date-fns'

interface NewsCardProps {
  news: {
    id: string
    title: string
    slug: string
    summary: string
    author_name: string
    published_at: string
    reading_time: number
    tags: string[]
    view_count: number
    share_count: number
    featured_image?: string
  }
}

const Card = styled.article`
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};
  cursor: pointer;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.border.focus};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`

const FeaturedImage = styled.div<{ src?: string }>`
  width: 100%;
  height: 200px;
  background: ${({ src, theme }) => 
    src ? `url(${src})` : theme.colors.background.tertiary
  };
  background-size: cover;
  background-position: center;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const Title = styled.h3`
  font-size: 1.3rem;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.3;
`

const Summary = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Meta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text.muted};
`

const Author = styled.span`
  color: ${({ theme }) => theme.colors.interactive.primary};
`

const Stats = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

const Stat = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const Tag = styled.span`
  background: ${({ theme }) => theme.colors.background.tertiary};
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 0.8rem;
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const ReadMore = styled.a`
  color: ${({ theme }) => theme.colors.interactive.primary};
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  
  &:hover {
    text-decoration: underline;
  }
`

const ShareButton = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};
  
  &:hover {
    background: ${({ theme }) => theme.colors.background.tertiary};
    border-color: ${({ theme }) => theme.colors.interactive.primary};
  }
`

export const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  const [showShareModal, setShowShareModal] = useState(false)

  const timeAgo = formatDistanceToNow(new Date(news.published_at), { addSuffix: true })

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on share button or link
    if ((e.target as HTMLElement).closest('button, a')) {
      return
    }
    window.location.href = `/news/${news.slug}`
  }

  return (
    <>
      <Card onClick={handleCardClick}>
        {news.featured_image && (
          <FeaturedImage src={news.featured_image} />
        )}
        
        <Title>{news.title}</Title>
        
        <Meta>
          <div>
            By <Author>{news.author_name}</Author> • {timeAgo} • {news.reading_time} min read
          </div>
        </Meta>
        
        <Summary>{news.summary}</Summary>
        
        {news.tags.length > 0 && (
          <Tags>
            {news.tags.map(tag => (
              <Tag key={tag}>#{tag}</Tag>
            ))}
          </Tags>
        )}
        
        <Stats>
          <Stat>
            👁️ {news.view_count} views
          </Stat>
          <Stat>
            🔗 {news.share_count} shares
          </Stat>
        </Stats>
        
        <Actions>
          <ReadMore href={`/news/${news.slug}`}>
            Read full article →
          </ReadMore>
          <ShareButton 
            onClick={(e) => {
              e.stopPropagation()
              setShowShareModal(true)
            }}
          >
            <span>🔗</span> Share
          </ShareButton>
        </Actions>
      </Card>
      
      {showShareModal && (
        <ShareModal
          news={news}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  )
}