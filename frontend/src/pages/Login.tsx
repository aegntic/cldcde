// Login Page - CLDCDE Pro
// By FrontendNinja - Production Ready

import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiClient, type User } from '../api/client'
import './Login.css'

interface LoginProps {
  onLogin: (user: User) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Check for GitHub OAuth callback
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    
    if (code && state) {
      handleGitHubCallback(code, state)
    }
  }, [searchParams])

  const handleGitHubCallback = async (code: string, state: string) => {
    // In production, verify state parameter matches what we sent
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/auth/github/callback?code=${code}&state=${state}`, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        apiClient.setToken(data.token)
        onLogin(data.user)
      } else {
        console.error('OAuth callback failed')
      }
    } catch (error) {
      console.error('OAuth error:', error)
    }
  }

  const handleGitHubLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/auth/github`
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/>
            </svg>
          </div>
          <h1>CLDCDE Pro</h1>
          <p className="tagline">Autonomous AI Development Orchestration</p>
        </div>

        <div className="login-body">
          <div className="features">
            <div className="feature">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1.5 3.25a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zm5.677-.177L9.573.677A.25.25 0 0110 .854v2.792a.25.25 0 01-.427.177L7.177 6.22a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm0 9.5a.75.75 0 100 1.5.75.75 0 000-1.5zm8.25.75a.75.75 0 101.5 0 .75.75 0 00-1.5 0zm3-8.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
              </svg>
              <span>Intelligent Workflow Orchestration</span>
            </div>
            <div className="feature">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/>
              </svg>
              <span>GitHub Deep Integration</span>
            </div>
            <div className="feature">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8.5 5.5a.5.5 0 00-1 0v3.362l-1.429 2.38a.5.5 0 10.858.515l1.5-2.5A.5.5 0 008.5 8.5V5.5z"/>
                <path d="M6.5 0a.5.5 0 000 1H7v1.07a7.001 7.001 0 00-3.273 12.474l-.602.602a.5.5 0 00.707.708l.746-.746A6.97 6.97 0 008 16a6.97 6.97 0 003.422-.892l.746.746a.5.5 0 00.707-.708l-.601-.602A7.001 7.001 0 009 2.07V1h.5a.5.5 0 000-1h-3zm1.038 3.018a6.093 6.093 0 01.924 0 6 6 0 11-.924 0zM0 3.5c0 .753.333 1.429.86 1.887A8.035 8.035 0 014 5.02v-1.1a2.5 2.5 0 00-4-.92zM14 4a2.5 2.5 0 00-.86 1.387 8.035 8.035 0 013.14.367A2.5 2.5 0 0014 3.5zm1.86 6.113A7.98 7.98 0 0116 11.5a2.5 2.5 0 00-4 .42v1.1a8.035 8.035 0 013.14-.367zM4 15.02a8.035 8.035 0 01-3.14-.367A2.5 2.5 0 004 12.5v1.1z"/>
              </svg>
              <span>24/7 Autonomous Development</span>
            </div>
            <div className="feature">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0 1A8 8 0 108 0a8 8 0 000 16z"/>
                <path d="M11.354 4.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708-.708l7-7a.5.5 0 01.708 0z"/>
              </svg>
              <span>Elite AI Agent Team</span>
            </div>
          </div>

          <button className="github-login-btn" onClick={handleGitHubLogin}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/>
            </svg>
            Sign in with GitHub
          </button>

          <p className="security-note">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
            </svg>
            Secure authentication via GitHub OAuth 2.0
          </p>
        </div>
      </div>

      <footer className="login-footer">
        <p>Built with ❤️ by the Elite Dev Team</p>
      </footer>
    </div>
  )
}