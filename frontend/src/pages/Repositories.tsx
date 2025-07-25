// Repositories Page - CLDCDE Pro
// By FrontendNinja - Production Ready

import { useEffect, useState } from 'react'
import { apiClient, type User, type Repository } from '../api/client'
import Layout from '../components/Layout'
import './Repositories.css'

interface RepositoriesProps {
  user: User
}

export default function Repositories({ user }: RepositoriesProps) {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLanguage, setFilterLanguage] = useState('')

  useEffect(() => {
    loadRepositories()
  }, [])

  const loadRepositories = async () => {
    setLoading(true)
    try {
      const result = await apiClient.listRepositories()
      if (result.data) {
        setRepositories(result.data)
      }
    } catch (error) {
      console.error('Failed to load repositories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      await apiClient.syncRepositories()
      await loadRepositories()
    } catch (error) {
      console.error('Failed to sync repositories:', error)
    } finally {
      setSyncing(false)
    }
  }

  const filteredRepos = repositories.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLanguage = !filterLanguage || repo.language === filterLanguage
    return matchesSearch && matchesLanguage
  })

  const languages = [...new Set(repositories.map(r => r.language).filter(Boolean))]

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      TypeScript: '#3178c6',
      JavaScript: '#f1e05a',
      Python: '#3572A5',
      Rust: '#dea584',
      Go: '#00ADD8',
      Java: '#b07219',
      CSS: '#563d7c',
      HTML: '#e34c26',
    }
    return colors[language] || '#8b949e'
  }

  return (
    <Layout user={user}>
      <div className="page-header">
        <div className="header-row">
          <div>
            <h1 className="page-title">Repositories</h1>
            <p className="page-description">
              Manage and monitor your GitHub repositories
            </p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <>
                <div className="spinner-small"></div>
                Syncing...
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 2.5a5.487 5.487 0 00-4.131 1.869l1.204 1.204A.25.25 0 014.896 6H1.25A.25.25 0 011 5.75V2.104a.25.25 0 01.427-.177l1.38 1.38A7.001 7.001 0 0114.95 7.16a.75.75 0 11-1.49.178A5.501 5.501 0 008 2.5zM1.705 8.005a.75.75 0 01.834.656 5.501 5.501 0 009.592 2.97l-1.204-1.204a.25.25 0 01.177-.427h3.646a.25.25 0 01.25.25v3.646a.25.25 0 01-.427.177l-1.38-1.38A7.001 7.001 0 011.05 8.84a.75.75 0 01.656-.834z"/>
                </svg>
                Sync with GitHub
              </>
            )}
          </button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Loading repositories...</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="filters-bar">
              <div className="search-box">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.5 7a4.499 4.499 0 11-8.998 0A4.499 4.499 0 0111.5 7zm-.82 4.74a6 6 0 111.06-1.06l3.04 3.04a.75.75 0 11-1.06 1.06l-3.04-3.04z"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="filter-select"
              >
                <option value="">All languages</option>
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>

              <div className="results-count">
                {filteredRepos.length} {filteredRepos.length === 1 ? 'repository' : 'repositories'}
              </div>
            </div>

            {/* Repository List */}
            <div className="repo-list">
              {filteredRepos.map((repo) => (
                <div key={repo.id} className="repo-card">
                  <div className="repo-icon">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/>
                    </svg>
                  </div>
                  <div className="repo-info">
                    <div className="repo-header">
                      <h3 className="repo-name">{repo.name}</h3>
                      {repo.is_private && (
                        <span className="repo-badge private">Private</span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="repo-description">{repo.description}</p>
                    )}
                    <div className="repo-meta">
                      {repo.language && (
                        <div className="repo-stat">
                          <span 
                            className="language-dot" 
                            style={{ backgroundColor: getLanguageColor(repo.language) }}
                          />
                          <span>{repo.language}</span>
                        </div>
                      )}
                      <div className="repo-stat">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"/>
                        </svg>
                        <span>{formatNumber(repo.stars_count)}</span>
                      </div>
                      <div className="repo-stat">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
                        </svg>
                        <span>{formatNumber(repo.forks_count)}</span>
                      </div>
                      {repo.open_issues_count > 0 && (
                        <div className="repo-stat">
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/>
                          </svg>
                          <span>{formatNumber(repo.open_issues_count)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="repo-action">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 110 1.5H8.5v4.25a.75.75 0 11-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z"/>
                    </svg>
                    Create Workflow
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}