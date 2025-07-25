// Workflows Page - CLDCDE Pro
// By FrontendNinja - Production Ready

import { useEffect, useState } from 'react'
import { apiClient, type User, type Workflow, type Repository } from '../api/client'
import Layout from '../components/Layout'
import './Workflows.css'

interface WorkflowsProps {
  user: User
}

export default function Workflows({ user }: WorkflowsProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [workflowsResult, reposResult] = await Promise.all([
        apiClient.listWorkflows(),
        apiClient.listRepositories()
      ])

      if (workflowsResult.data) setWorkflows(workflowsResult.data)
      if (reposResult.data) setRepositories(reposResult.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkflow = async (data: any) => {
    try {
      const result = await apiClient.createWorkflow(data)
      if (result.data) {
        setWorkflows([...workflows, result.data])
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Failed to create workflow:', error)
    }
  }

  const handlePauseWorkflow = async (id: string) => {
    try {
      await apiClient.pauseWorkflow(id)
      await loadData()
    } catch (error) {
      console.error('Failed to pause workflow:', error)
    }
  }

  const handleResumeWorkflow = async (id: string) => {
    try {
      await apiClient.resumeWorkflow(id)
      await loadData()
    } catch (error) {
      console.error('Failed to resume workflow:', error)
    }
  }

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesStatus = !filterStatus || workflow.status === filterStatus
    const matchesType = !filterType || workflow.type === filterType
    return matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'var(--status-success)'
      case 'paused': return 'var(--status-warning)'
      case 'error': return 'var(--status-error)'
      case 'completed': return 'var(--accent-primary)'
      default: return 'var(--text-secondary)'
    }
  }

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'planning':
        return <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0114.25 16H1.75A1.75 1.75 0 010 14.25V1.75zM1.5 6.5v7.75c0 .138.112.25.25.25H5v-8H1.5zM5 5v-3.25a.25.25 0 00-.25-.25H1.75a.25.25 0 00-.25.25V5H5zm1.5 1.5v8h7.75a.25.25 0 00.25-.25V6.5h-8zm8-1.5h-8v-3.25a.25.25 0 01.25-.25h7.5a.25.25 0 01.25.25V5z"/>
        </svg>
      case 'requirements':
        return <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0114.25 16H1.75A1.75 1.75 0 010 14.25V1.75zm1.75-.25a.25.25 0 00-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25V1.75a.25.25 0 00-.25-.25H1.75zM3.5 6.25a.75.75 0 01.75-.75h7a.75.75 0 010 1.5h-7a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h4a.75.75 0 000-1.5h-4z"/>
        </svg>
      case 'design':
        return <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M2.97 1.35A1 1 0 013.73 1h8.54a1 1 0 01.76.35l2.609 3.044A1.5 1.5 0 0116 5.37v.255a2.375 2.375 0 01-4.25 1.458A2.371 2.371 0 019.875 8 2.37 2.37 0 018 7.083 2.37 2.37 0 016.125 8a2.37 2.37 0 01-1.875-.917A2.375 2.375 0 010 5.625V5.37a1.5 1.5 0 01.361-.976l2.61-3.045zm1.78 4.275a1.375 1.375 0 002.75 0 .5.5 0 011 0 1.375 1.375 0 002.75 0 .5.5 0 011 0 1.375 1.375 0 102.75 0V5.37a.5.5 0 00-.12-.325L12.27 2H3.73L1.12 5.045A.5.5 0 001 5.37v.255a1.375 1.375 0 002.75 0 .5.5 0 011 0zM1.5 8.5A.5.5 0 012 9v6h12V9a.5.5 0 011 0v6h.5a.5.5 0 010 1H.5a.5.5 0 010-1H1V9a.5.5 0 01.5-.5zm2 .5h9a.5.5 0 01.5.5V13a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5V9.5a.5.5 0 01.5-.5z"/>
        </svg>
      case 'implementation':
        return <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4.879 1.885l.002.012c.126.598.283 1.345.284 2.103 0 .918-.223 1.829-.664 2.651a5.367 5.367 0 01-1.79 1.744l-.252.141-.002.012c-.229 1.218.055 2.176.64 2.823a2.81 2.81 0 002.157 1.004c.638 0 1.281-.228 1.888-.688a8.366 8.366 0 001.358-1.222 8.365 8.365 0 001.358 1.222c.607.46 1.25.688 1.888.688a2.81 2.81 0 002.157-1.004c.585-.647.869-1.605.64-2.823l-.002-.012-.252-.141a5.367 5.367 0 01-1.79-1.744 4.514 4.514 0 01-.664-2.651c0-.758.158-1.505.284-2.103l.002-.012c.158-.787.315-1.54.274-2.352C12.604.784 12.329 0 11.243 0c-.787 0-1.745.35-2.912.871a12.39 12.39 0 00-1.326.794 2.23 2.23 0 00-.505.444l.001.001a2.23 2.23 0 00-.505-.444 12.397 12.397 0 00-1.326-.794C3.502.351 2.545 0 1.757 0 .671 0 .396.784.354 1.533c-.04.812.117 1.565.274 2.352h.001zM11.243 1.5c.35 0 .386.13.395.329.024.511-.082 1.124-.238 1.907l-.002.012c-.109.54-.234 1.156-.234 1.752 0 .658.144 1.328.467 1.953a3.867 3.867 0 001.292 1.256c.273.182.506.337.681.468.03.658-.148 1.24-.479 1.607a1.31 1.31 0 01-1.002.456c-.322 0-.689-.134-1.156-.489a6.877 6.877 0 01-1.104-.996L8.5 7.495l-1.363 2.26a6.876 6.876 0 01-1.104.996c-.467.355-.834.49-1.156.49a1.31 1.31 0 01-1.002-.457c-.331-.366-.51-.949-.479-1.607.175-.131.408-.286.682-.468a3.868 3.868 0 001.292-1.256 3.202 3.202 0 00.466-1.953c0-.596-.125-1.211-.233-1.752l-.002-.012c-.157-.783-.263-1.396-.239-1.907.01-.199.046-.329.395-.329.318 0 1.058.254 2.025.697.456.21.883.437 1.218.608V4h.002V2.807c.335-.171.762-.398 1.218-.608.967-.443 1.707-.697 2.025-.697h-.002z"/>
        </svg>
      case 'testing':
        return <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M1.75 2.5a.25.25 0 00-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25V2.75a.25.25 0 00-.25-.25H1.75zM0 2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0114.25 15H1.75A1.75 1.75 0 010 13.25V2.75zm9.22 3.72a.75.75 0 000 1.06L10.69 9 9.22 10.47a.75.75 0 101.06 1.06l2-2a.75.75 0 000-1.06l-2-2a.75.75 0 00-1.06 0zM6.78 6.47a.75.75 0 00-1.06 0l-2 2a.75.75 0 000 1.06l2 2a.75.75 0 101.06-1.06L5.31 9l1.47-1.47a.75.75 0 000-1.06z"/>
        </svg>
      default:
        return null
    }
  }

  return (
    <Layout user={user}>
      <div className="page-header">
        <div className="header-row">
          <div>
            <h1 className="page-title">Workflows</h1>
            <p className="page-description">
              Manage autonomous development workflows
            </p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowCreateModal(true)}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 110 1.5H8.5v4.25a.75.75 0 11-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z"/>
            </svg>
            New Workflow
          </button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Loading workflows...</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="workflow-filters">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="error">Error</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="">All Types</option>
                <option value="feature">Feature</option>
                <option value="bugfix">Bug Fix</option>
                <option value="refactor">Refactor</option>
                <option value="infrastructure">Infrastructure</option>
              </select>

              <div className="workflow-stats">
                <div className="stat-item">
                  <span className="stat-value">{workflows.filter(w => w.status === 'active').length}</span>
                  <span className="stat-label">Active</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{workflows.filter(w => w.status === 'completed').length}</span>
                  <span className="stat-label">Completed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{workflows.length}</span>
                  <span className="stat-label">Total</span>
                </div>
              </div>
            </div>

            {/* Workflow Grid */}
            <div className="workflow-grid">
              {filteredWorkflows.map((workflow) => (
                <div key={workflow.id} className="workflow-card">
                  <div className="workflow-header">
                    <h3 className="workflow-name">{workflow.name}</h3>
                    <span 
                      className={`workflow-status ${workflow.status}`}
                      style={{ color: getStatusColor(workflow.status) }}
                    >
                      {workflow.status}
                    </span>
                  </div>

                  {workflow.description && (
                    <p className="workflow-description">{workflow.description}</p>
                  )}

                  <div className="workflow-meta">
                    <div className="meta-item">
                      <span className="meta-label">Type:</span>
                      <span className="meta-value">{workflow.type}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Phase:</span>
                      <span className="meta-value phase">
                        {getPhaseIcon(workflow.phase)}
                        {workflow.phase}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Priority:</span>
                      <span className={`meta-value priority-${workflow.priority}`}>
                        {workflow.priority}
                      </span>
                    </div>
                  </div>

                  <div className="workflow-progress">
                    <div className="progress-header">
                      <span>Progress</span>
                      <span>{workflow.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${workflow.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="workflow-actions">
                    {workflow.status === 'active' ? (
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => handlePauseWorkflow(workflow.uuid)}
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M5.5 3.5A1.5 1.5 0 017 5v6a1.5 1.5 0 01-3 0V5a1.5 1.5 0 011.5-1.5zm5 0A1.5 1.5 0 0112 5v6a1.5 1.5 0 01-3 0V5a1.5 1.5 0 011.5-1.5z"/>
                        </svg>
                        Pause
                      </button>
                    ) : workflow.status === 'paused' ? (
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleResumeWorkflow(workflow.uuid)}
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M5.604 3.194A.75.75 0 004 3.75v8.5a.75.75 0 001.604.556l5.5-4.25a.75.75 0 000-1.112l-5.5-4.25z"/>
                        </svg>
                        Resume
                      </button>
                    ) : null}
                    <button className="btn btn-sm btn-secondary">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <CreateWorkflowModal
          repositories={repositories}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateWorkflow}
        />
      )}
    </Layout>
  )
}

// Create Workflow Modal Component
function CreateWorkflowModal({ 
  repositories, 
  onClose, 
  onCreate 
}: { 
  repositories: Repository[]
  onClose: () => void
  onCreate: (data: any) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'feature',
    repository_id: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({
      ...formData,
      repository_id: formData.repository_id ? parseInt(formData.repository_id) : undefined
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Workflow</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Workflow Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Implement User Authentication"
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
              placeholder="Describe the workflow objectives..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              className="form-input"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="feature">Feature</option>
              <option value="bugfix">Bug Fix</option>
              <option value="refactor">Refactor</option>
              <option value="infrastructure">Infrastructure</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Repository (Optional)</label>
            <select
              className="form-input"
              value={formData.repository_id}
              onChange={(e) => setFormData({ ...formData, repository_id: e.target.value })}
            >
              <option value="">Select a repository...</option>
              {repositories.map(repo => (
                <option key={repo.id} value={repo.id}>
                  {repo.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Workflow
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}