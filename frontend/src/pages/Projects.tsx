// Projects Page - CLDCDE Pro
// By FrontendNinja - Production Ready

import { useEffect, useState } from 'react'
import { apiClient, type User, type Project } from '../api/client'
import Layout from '../components/Layout'
import './Projects.css'

interface ProjectsProps {
  user: User
}

export default function Projects({ user }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)


  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const result = await apiClient.listProjects()
      if (result.data) {
        setProjects(result.data)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (data: any) => {
    try {
      const result = await apiClient.createProject(data)
      if (result.data) {
        setProjects([...projects, result.data])
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }



  const getProjectStats = (project: Project) => {
    const activeWorkflows = project.workflows?.filter(w => w.status === 'active').length || 0
    const completedWorkflows = project.workflows?.filter(w => w.status === 'completed').length || 0
    const totalWorkflows = project.workflows?.length || 0
    
    return { activeWorkflows, completedWorkflows, totalWorkflows }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'var(--accent-danger)'
      case 'admin': return 'var(--accent-primary)'
      case 'member': return 'var(--status-success)'
      case 'viewer': return 'var(--text-secondary)'
      default: return 'var(--text-tertiary)'
    }
  }

  return (
    <Layout user={user}>
      <div className="page-header">
        <div className="header-row">
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="page-description">
              Organize workflows and collaborate with your team
            </p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowCreateModal(true)}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 110 1.5H8.5v4.25a.75.75 0 11-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z"/>
            </svg>
            New Project
          </button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Loading projects...</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => {
              const stats = getProjectStats(project)
              return (
                <div key={project.id} className="project-card">
                  <div className="project-header">
                    <div className="project-icon">
                      <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M1.75 0A1.75 1.75 0 000 1.75v12.5C0 15.216.784 16 1.75 16h12.5A1.75 1.75 0 0016 14.25V1.75A1.75 1.75 0 0014.25 0H1.75zM1.5 1.75a.25.25 0 01.25-.25h12.5a.25.25 0 01.25.25v12.5a.25.25 0 01-.25.25H1.75a.25.25 0 01-.25-.25V1.75zM11.75 3a.75.75 0 00-.75.75v7.5a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75zm-8.25.75a.75.75 0 011.5 0v5.5a.75.75 0 01-1.5 0v-5.5zM8 3a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5A.75.75 0 008 3z"/>
                      </svg>
                    </div>
                    <div className="project-info">
                      <h3 className="project-name">{project.name}</h3>
                      {project.visibility === 'private' && (
                        <span className="project-badge private">
                          <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M4 4v2-.5V4a1.5 1.5 0 113 0v1.5V4a1.5 1.5 0 113 0v1.5V4a1.5 1.5 0 113 0v5.5a2.5 2.5 0 01-2.5 2.5H5.5A3.5 3.5 0 012 8.5V6l.724-.447A.5.5 0 013 5.5V4a1.5 1.5 0 013 0zm-.5 0v1.5V4a.5.5 0 00-1 0v1.5V4a.5.5 0 01-1 0v1.293l-.854.52A.5.5 0 000 6.279V8.5A4.5 4.5 0 004.5 13h6a3.5 3.5 0 003.5-3.5V4a.5.5 0 00-1 0v5.5a2.5 2.5 0 01-2.5 2.5h-6A3.5 3.5 0 011 8.5V6.764l1.5-.928V4a.5.5 0 00-1 0v1.5V4a.5.5 0 01-1 0zm5 0v1.5V4a.5.5 0 00-1 0v1.5V4a.5.5 0 01-1 0v1.5V4a.5.5 0 00-1 0v1.5V4a.5.5 0 010-1z"/>
                          </svg>
                          Private
                        </span>
                      )}
                    </div>
                  </div>

                  {project.description && (
                    <p className="project-description">{project.description}</p>
                  )}

                  <div className="project-stats">
                    <div className="stat">
                      <span className="stat-value">{stats.activeWorkflows}</span>
                      <span className="stat-label">Active</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{stats.completedWorkflows}</span>
                      <span className="stat-label">Completed</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{stats.totalWorkflows}</span>
                      <span className="stat-label">Total</span>
                    </div>
                  </div>

                  {project.members && project.members.length > 0 && (
                    <div className="project-members">
                      <div className="members-header">
                        <span className="members-label">Team Members</span>
                        <button className="add-member-btn">
                          <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 110 1.5H8.5v4.25a.75.75 0 11-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z"/>
                          </svg>
                        </button>
                      </div>
                      <div className="members-list">
                        {project.members.slice(0, 5).map((member) => (
                          <div key={member.user_id} className="member-avatar" title={`${member.user?.username || 'User'} (${member.role})`}>
                            <img 
                              src={member.user?.avatar_url || `https://avatars.githubusercontent.com/u/${member.user_id}?v=4`} 
                              alt={member.user?.username || 'User'}
                            />
                            <span 
                              className="member-role"
                              style={{ backgroundColor: getRoleColor(member.role) }}
                            />
                          </div>
                        ))}
                        {project.members.length > 5 && (
                          <div className="member-avatar more">
                            +{project.members.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="project-footer">
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => console.log('View project details:', project.id)}
                    >
                      View Details
                    </button>
                    <span className="project-date">
                      Created {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Empty State */}
            {projects.length === 0 && (
              <div className="empty-state">
                <svg width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M1.75 0A1.75 1.75 0 000 1.75v12.5C0 15.216.784 16 1.75 16h12.5A1.75 1.75 0 0016 14.25V1.75A1.75 1.75 0 0014.25 0H1.75zM1.5 1.75a.25.25 0 01.25-.25h12.5a.25.25 0 01.25.25v12.5a.25.25 0 01-.25.25H1.75a.25.25 0 01-.25-.25V1.75z"/>
                  <path d="M8 4a.75.75 0 01.75.75v2.5h2.5a.75.75 0 010 1.5h-2.5v2.5a.75.75 0 01-1.5 0v-2.5h-2.5a.75.75 0 010-1.5h2.5v-2.5A.75.75 0 018 4z"/>
                </svg>
                <h3>No projects yet</h3>
                <p>Create your first project to organize workflows and collaborate with your team.</p>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  Create Project
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateProject}
        />
      )}
    </Layout>
  )
}

// Create Project Modal Component
function CreateProjectModal({ 
  onClose, 
  onCreate 
}: { 
  onClose: () => void
  onCreate: (data: any) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'private' as 'private' | 'public'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(formData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Project</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., E-commerce Platform"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your project..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Visibility</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.visibility === 'private'}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'private' | 'public' })}
                />
                <span className="radio-text">
                  <strong>Private</strong>
                  <small>Only team members can view this project</small>
                </span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'private' | 'public' })}
                />
                <span className="radio-text">
                  <strong>Public</strong>
                  <small>Anyone can view this project</small>
                </span>
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}