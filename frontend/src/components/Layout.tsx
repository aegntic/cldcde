// Layout Component - CLDCDE Pro
// By FrontendNinja - Production Ready

import { NavLink, useNavigate } from 'react-router-dom'
import { type User } from '../api/client'
import './Layout.css'

interface LayoutProps {
  user: User
  children: React.ReactNode
}

export default function Layout({ user, children }: LayoutProps) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    // Clear auth and redirect
    localStorage.removeItem('auth_token')
    navigate('/login')
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="app-logo">
            <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/>
            </svg>
          </div>
          <h2>CLDCDE Pro</h2>
        </div>

        <nav className="nav-menu">
          <NavLink to="/" className="nav-item">
            <svg className="nav-icon" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5 8 5.961 14.154 3.5 8.186 1.113zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6z"/>
            </svg>
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/repositories" className="nav-item">
            <svg className="nav-icon" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/>
            </svg>
            <span>Repositories</span>
          </NavLink>

          <NavLink to="/workflows" className="nav-item">
            <svg className="nav-icon" fill="currentColor" viewBox="0 0 16 16">
              <path d="M1.5 3.25a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zm5.677-.177L9.573.677A.25.25 0 0110 .854v2.792a.25.25 0 01-.427.177L7.177 6.22a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm0 9.5a.75.75 0 100 1.5.75.75 0 000-1.5zm8.25.75a.75.75 0 101.5 0 .75.75 0 00-1.5 0zm3-8.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
            </svg>
            <span>Workflows</span>
          </NavLink>

          <NavLink to="/projects" className="nav-item">
            <svg className="nav-icon" fill="currentColor" viewBox="0 0 16 16">
              <path d="M1.75 0A1.75 1.75 0 000 1.75v12.5C0 15.216.784 16 1.75 16h12.5A1.75 1.75 0 0016 14.25V1.75A1.75 1.75 0 0014.25 0H1.75zM1.5 1.75a.25.25 0 01.25-.25h12.5a.25.25 0 01.25.25v12.5a.25.25 0 01-.25.25H1.75a.25.25 0 01-.25-.25V1.75zM11.75 3a.75.75 0 00-.75.75v7.5a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75zm-8.25.75a.75.75 0 011.5 0v5.5a.75.75 0 01-1.5 0v-5.5zM8 3a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5A.75.75 0 008 3z"/>
            </svg>
            <span>Projects</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <img 
              src={user.avatar_url || `https://avatars.githubusercontent.com/u/${user.id}?v=4`} 
              alt={user.username}
              className="user-avatar"
            />
            <span className="user-name">{user.username}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M2 2.75C2 1.784 2.784 1 3.75 1h2.5a.75.75 0 010 1.5h-2.5a.25.25 0 00-.25.25v10.5c0 .138.112.25.25.25h2.5a.75.75 0 010 1.5h-2.5A1.75 1.75 0 012 13.25V2.75zm10.44 4.5H6.75a.75.75 0 000 1.5h5.69l-1.97 1.97a.75.75 0 101.06 1.06l3.25-3.25a.75.75 0 000-1.06l-3.25-3.25a.75.75 0 10-1.06 1.06l1.97 1.97z"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}