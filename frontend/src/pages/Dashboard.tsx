// Dashboard Page - CLDCDE Pro
// By FrontendNinja - Production Ready

import { useEffect, useState } from 'react'
import { apiClient, type User, type ActivityStats, type Activity } from '../api/client'
import Layout from '../components/Layout'

interface DashboardProps {
  user: User
}

export default function Dashboard({ user }: DashboardProps) {
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [statsResult, activitiesResult] = await Promise.all([
        apiClient.getActivityStats(),
        apiClient.getActivityFeed(10)
      ])

      if (statsResult.data) setStats(statsResult.data)
      if (activitiesResult.data) setActivities(activitiesResult.data)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'commit':
        return (
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43.75a4.002 4.002 0 01-7.86 0H.75a.75.75 0 110-1.5h3.32a4.001 4.001 0 017.86 0h3.32a.75.75 0 110 1.5h-3.32z"/>
          </svg>
        )
      case 'pull_request':
        return (
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"/>
          </svg>
        )
      default:
        return (
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM1.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm13 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
          </svg>
        )
    }
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <Layout user={user}>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">
          Monitor your autonomous development orchestration
        </p>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total Activities</div>
                <div className="stat-value">{stats?.total_activities || 0}</div>
                <div className="stat-change positive">
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3.47 7.78a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0l4.25 4.25a.75.75 0 01-1.06 1.06L9 4.81v7.44a.75.75 0 01-1.5 0V4.81L4.53 7.78a.75.75 0 01-1.06 0z"/>
                  </svg>
                  <span>12% from last week</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Today's Activities</div>
                <div className="stat-value">{stats?.activities_today || 0}</div>
                <div className="stat-change positive">
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3.47 7.78a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0l4.25 4.25a.75.75 0 01-1.06 1.06L9 4.81v7.44a.75.75 0 01-1.5 0V4.81L4.53 7.78a.75.75 0 01-1.06 0z"/>
                  </svg>
                  <span>5 more than yesterday</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">This Week</div>
                <div className="stat-value">{stats?.activities_this_week || 0}</div>
                <div className="stat-change negative">
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M12.53 8.22a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0l-4.25-4.25a.75.75 0 111.06-1.06L7 11.19V3.75a.75.75 0 011.5 0v7.44l2.97-2.97a.75.75 0 011.06 0z"/>
                  </svg>
                  <span>3% from last week</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Active Workflows</div>
                <div className="stat-value">7</div>
                <div className="stat-change positive">
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3.47 7.78a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0l4.25 4.25a.75.75 0 01-1.06 1.06L9 4.81v7.44a.75.75 0 01-1.5 0V4.81L4.53 7.78a.75.75 0 01-1.06 0z"/>
                  </svg>
                  <span>2 new today</span>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="activity-feed">
              <div className="activity-header">
                <h2 className="card-title">Recent Activity</h2>
                <button className="btn btn-sm btn-secondary">View All</button>
              </div>
              <div className="activity-list">
                {activities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className={`activity-icon ${activity.entity_type}`}>
                      {getActivityIcon(activity.action_type)}
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">{activity.description}</div>
                      <div className="activity-meta">
                        {activity.user?.username || 'System'} • {getRelativeTime(activity.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}