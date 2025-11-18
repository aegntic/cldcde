import React, { useState } from 'react'
import styled from 'styled-components'
import { ActivityFeed } from './ActivityFeed'
import { motion } from 'framer-motion'

interface RealtimePanelProps {
  userId?: string
  className?: string
}

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  border-bottom: 1px solid ${props => props.theme.border};
  padding: 0 16px;
`

const Tab = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  padding: 12px 16px;
  font-family: ${props => props.theme.fontFamily};
  font-size: 14px;
  color: ${props => props.active ? props.theme.primary : props.theme.secondary};
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.text};
  }
  
  ${props => props.active && `
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: ${props.theme.primary};
    }
  `}
`

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
`

const StatCard = styled(motion.div)`
  background: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  padding: 16px;
  text-align: center;
`

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${props => props.theme.primary};
  margin-bottom: 4px;
`

const StatLabel = styled.div`
  font-size: 12px;
  color: ${props => props.theme.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const NotificationBadge = styled.span`
  background: ${props => props.theme.error};
  color: ${props => props.theme.background};
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  margin-left: 4px;
`

export const RealtimePanel: React.FC<RealtimePanelProps> = ({ userId, className }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'stats' | 'notifications'>('feed')
  
  // Mock stats for demonstration
  const stats = {
    activeUsers: 42,
    todayDownloads: 1337,
    newExtensions: 7,
    newReviews: 23
  }
  
  return (
    <PanelContainer className={className}>
      <TabContainer>
        <Tab 
          active={activeTab === 'feed'} 
          onClick={() => setActiveTab('feed')}
        >
          Live Feed
        </Tab>
        <Tab 
          active={activeTab === 'stats'} 
          onClick={() => setActiveTab('stats')}
        >
          Stats
        </Tab>
        {userId && (
          <Tab 
            active={activeTab === 'notifications'} 
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
            <NotificationBadge>3</NotificationBadge>
          </Tab>
        )}
      </TabContainer>
      
      {activeTab === 'feed' && (
        <ActivityFeed
          height="500px"
          showPresence={true}
          currentPage="home"
          userId={userId}
        />
      )}
      
      {activeTab === 'stats' && (
        <StatsContainer>
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <StatValue>{stats.activeUsers}</StatValue>
            <StatLabel>Active Users</StatLabel>
          </StatCard>
          
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatValue>{stats.todayDownloads}</StatValue>
            <StatLabel>Downloads Today</StatLabel>
          </StatCard>
          
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatValue>{stats.newExtensions}</StatValue>
            <StatLabel>New Extensions</StatLabel>
          </StatCard>
          
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StatValue>{stats.newReviews}</StatValue>
            <StatLabel>Reviews Today</StatLabel>
          </StatCard>
        </StatsContainer>
      )}
      
      {activeTab === 'notifications' && userId && (
        <div style={{ padding: '32px', textAlign: 'center', color: '#666' }}>
          Notifications coming soon...
        </div>
      )}
    </PanelContainer>
  )
}