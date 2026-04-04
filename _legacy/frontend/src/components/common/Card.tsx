import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

interface CardProps {
  title: string
  description: string
  author: string
  tags: string[]
  stats: {
    downloads: number
    rating: number
  }
  platform: string[]
  category: string
  version?: string
  onClick?: () => void
  className?: string
}

const CardContainer = styled(motion.div)`
  background: ${({ theme }) => theme.colors.background.card};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast} ${({ theme }) => theme.animations.easing.default};
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.hover};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:active {
    transform: translateY(0);
  }
`

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  line-height: 1.2;
  flex: 1;
  margin-right: ${({ theme }) => theme.spacing.sm};
`

const Version = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.text.muted};
  background: ${({ theme }) => theme.colors.background.secondary};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`

const Description = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`

const Author = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-family: ${({ theme }) => theme.fonts.mono};
`

const Category = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.interactive.accent};
  background: ${({ theme }) => theme.colors.background.secondary};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  text-transform: lowercase;
`

const PlatformList = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`

const PlatformBadge = styled.span`
  font-size: 0.7rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.text.muted};
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  padding: 2px ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  text-transform: uppercase;
`

const TagsList = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`

const Tag = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.terminal.cyan};
  background: ${({ theme }) => theme.colors.background.secondary};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
`

const Stats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
`

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
`

const StatIcon = styled.span`
  font-size: 0.9rem;
`

const StatValue = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 500;
`

const RatingStars = styled.div`
  display: flex;
  gap: 1px;
`

const Star = styled.span<{ filled: boolean }>`
  color: ${({ filled, theme }) => 
    filled ? theme.colors.terminal.yellow : theme.colors.border.primary
  };
  font-size: 0.8rem;
`

// Utility function to format download count
const formatDownloads = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

// Utility function to render star rating
const renderStars = (rating: number) => {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Star key={i} filled={true}>★</Star>)
    } else if (i === fullStars && hasHalfStar) {
      stars.push(<Star key={i} filled={true}>☆</Star>)
    } else {
      stars.push(<Star key={i} filled={false}>☆</Star>)
    }
  }

  return stars
}

const Card: React.FC<CardProps> = ({
  title,
  description,
  author,
  tags,
  stats,
  platform,
  category,
  version,
  onClick,
  className
}) => {
  return (
    <CardContainer
      className={className}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CardHeader>
        <Title>{title}</Title>
        {version && <Version>v{version}</Version>}
      </CardHeader>

      <Description>{description}</Description>

      <MetaInfo>
        <Author>@{author}</Author>
        <Category>{category}</Category>
      </MetaInfo>

      <PlatformList>
        {platform.map((p) => (
          <PlatformBadge key={p}>{p}</PlatformBadge>
        ))}
      </PlatformList>

      {tags.length > 0 && (
        <TagsList>
          {tags.slice(0, 3).map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
          {tags.length > 3 && (
            <Tag>+{tags.length - 3} more</Tag>
          )}
        </TagsList>
      )}

      <Stats>
        <StatItem>
          <StatIcon>📥</StatIcon>
          <StatValue>{formatDownloads(stats.downloads)}</StatValue>
        </StatItem>

        <StatItem>
          <RatingStars>
            {renderStars(stats.rating)}
          </RatingStars>
          <StatValue>{stats.rating.toFixed(1)}</StatValue>
        </StatItem>
      </Stats>
    </CardContainer>
  )
}

export { Card }
