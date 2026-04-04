import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { useRealtimeFeed } from '../hooks/useRealtimeFeed'
import { ActivityFeedItem } from '../../../src/realtime/types'

interface ActivityFeedProps {
  maxItems?: number
  height?: string
  showPresence?: boolean
  currentPage?: string
  targetId?: string
  targetType?: 'extension' | 'mcp'
  userId?: string
  className?: string
}

const FeedContainer = styled.div<{ height?: string }>`
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  height: ${props => props.height || '400px'};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: ${props => props.theme.fontFamily};
`

const FeedHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.theme.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Title = styled.h3`
  margin: 0;
  font-size: 14px;
  color: ${props => props.theme.text};
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`

const StatusIndicator = styled.div<{ connected: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${props => props.connected ? props.theme.success : props.theme.error};
`

const StatusDot = styled.div<{ connected: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.connected ? props.theme.success : props.theme.error};
  animation: ${props => props.connected ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`

const FeedContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.background};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 4px;
    
    &:hover {
      background: ${props => props.theme.secondary};
    }
  }
`

const ActivityItem = styled(motion.div)`
  padding: 8px 12px;
  margin-bottom: 4px;
  background: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.hover};
    border-color: ${props => props.theme.primary};
  }
`

const ActivityIcon = styled.div<{ iconType: string }>`
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => {
    switch (props.iconType) {
      case 'plus': return props.theme.success
      case 'star': return props.theme.warning
      case 'download': return props.theme.info
      case 'user': return props.theme.primary
      case 'trophy': return props.theme.warning
      default: return props.theme.secondary
    }
  }};
`

const ActivityContent = styled.div`
  flex: 1;
  min-width: 0;
`

const ActivityText = styled.div`
  color: ${props => props.theme.text};
  word-wrap: break-word;
`

const ActivityTime = styled.div`
  color: ${props => props.theme.secondary};
  font-size: 11px;
  margin-top: 2px;
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${props => props.theme.secondary};
  text-align: center;
  padding: 32px;
`

const PresenceBar = styled.div`
  padding: 8px 16px;
  background: ${props => props.theme.surface};
  border-top: 1px solid ${props => props.theme.border};
  font-size: 12px;
  color: ${props => props.theme.secondary};
  display: flex;
  align-items: center;
  gap: 8px;
`

const UserCount = styled.span`
  color: ${props => props.theme.primary};
  font-weight: 600;
`

// Icon components
const getIcon = (type: string) => {
  switch (type) {
    case 'plus':
      return '+'
    case 'star':
      return '★'
    case 'download':
      return '↓'
    case 'user':
      return '@'
    case 'trophy':
      return '🏆'
    case 'server':
      return '◼'
    case 'comment':
      return '◗'
    default:
      return '•'
  }
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  maxItems = 50,
  height,
  showPresence = true,
  currentPage,
  targetId,
  targetType,
  userId,
  className
}) => {
  const {
    activities,
    presenceUsers,
    connectionStatus,
    clearActivities
  } = useRealtimeFeed({
    maxItems,
    enablePresence: showPresence,
    presencePage: currentPage,
    presenceTargetId: targetId,
    presenceTargetType: targetType,
    userId
  })
  
  const contentRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)
  
  // Auto-scroll to new items if user is at bottom
  useEffect(() => {
    if (shouldAutoScroll.current && contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }, [activities])
  
  // Check if user has scrolled away from top
  const handleScroll = () => {
    if (contentRef.current) {
      shouldAutoScroll.current = contentRef.current.scrollTop < 50
    }
  }
  
  return (
    <FeedContainer height={height} className={className}>
      <FeedHeader>
        <Title>Activity Feed</Title>
        <StatusIndicator connected={connectionStatus.connected}>
          <StatusDot connected={connectionStatus.connected} />
          {connectionStatus.connected ? 'Live' : connectionStatus.reconnecting ? 'Reconnecting...' : 'Offline'}
        </StatusIndicator>
      </FeedHeader>
      
      <FeedContent ref={contentRef} onScroll={handleScroll}>
        <AnimatePresence>
          {activities.length === 0 ? (
            <EmptyState>
              <div style={{ fontSize: '48px', opacity: 0.2, marginBottom: '16px' }}>
                ◗
              </div>
              <div>No activities yet</div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                Activities will appear here in real-time
              </div>
            </EmptyState>
          ) : (
            activities.map((activity) => (
              <ActivityItem
                key={activity.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ActivityIcon iconType={activity.iconType || 'activity'}>
                  {getIcon(activity.iconType || 'activity')}
                </ActivityIcon>
                <ActivityContent>
                  <ActivityText>{activity.actionText}</ActivityText>
                  <ActivityTime>{activity.formattedTime}</ActivityTime>
                </ActivityContent>
              </ActivityItem>
            ))
          )}
        </AnimatePresence>
      </FeedContent>
      
      {showPresence && presenceUsers.length > 0 && (
        <PresenceBar>
          <StatusDot connected={true} />
          <UserCount>{presenceUsers.length}</UserCount>
          {presenceUsers.length === 1 ? 'user' : 'users'} currently viewing
        </PresenceBar>
      )}
    </FeedContainer>
  )
}