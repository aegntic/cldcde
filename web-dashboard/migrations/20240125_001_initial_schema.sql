-- Initial Database Schema - Enhanced by BackendArchitect 🏗️
-- CLDCDE Pro Database Schema v1.0

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    github_id TEXT UNIQUE,
    github_username TEXT,
    avatar_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_login TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    permissions TEXT DEFAULT '[]', -- JSON array
    settings TEXT DEFAULT '{}' -- JSON object
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- active, archived, maintenance, planning, on_hold
    visibility TEXT NOT NULL DEFAULT 'private', -- public, private, internal
    owner_id TEXT NOT NULL,
    github_repo TEXT, -- JSON: {owner, repository, url, default_branch, is_private}
    local_path TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_sync TEXT,
    deleted_at TEXT,
    settings TEXT NOT NULL DEFAULT '{}', -- JSON: ProjectSettings
    tags TEXT DEFAULT '[]', -- JSON array
    tech_stack TEXT DEFAULT '[]', -- JSON array
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, ready, running, paused, completed, failed, cancelled
    phase TEXT NOT NULL DEFAULT 'planning', -- planning, requirements, design, tasks, execution, review, deployment
    priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    progress REAL DEFAULT 0.0, -- 0.0 to 100.0
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    assigned_to TEXT,
    estimated_duration INTEGER, -- minutes
    actual_duration INTEGER, -- minutes
    github_repo TEXT,
    config TEXT NOT NULL DEFAULT '{}', -- JSON: WorkflowConfig
    tags TEXT DEFAULT '[]', -- JSON array
    dependencies TEXT DEFAULT '[]', -- JSON array of workflow IDs
    deleted_at TEXT,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Project collaborators table
CREATE TABLE IF NOT EXISTS project_collaborators (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer', -- owner, admin, developer, viewer
    permissions TEXT DEFAULT '[]', -- JSON array
    added_at TEXT NOT NULL,
    added_by TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (added_by) REFERENCES users(id),
    UNIQUE(project_id, user_id)
);

-- Workflow executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    execution_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'running', -- running, completed, failed, cancelled
    started_at TEXT NOT NULL,
    completed_at TEXT,
    started_by TEXT NOT NULL,
    logs TEXT DEFAULT '[]', -- JSON array of log entries
    metrics TEXT DEFAULT '{}', -- JSON: execution metrics
    error_details TEXT, -- JSON: error information if failed
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (started_by) REFERENCES users(id)
);

-- Project activity feed
CREATE TABLE IF NOT EXISTS project_activities (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    activity_type TEXT NOT NULL, -- commit, workflow, deploy, issue, pr, etc.
    actor_id TEXT,
    actor_name TEXT NOT NULL, -- can be system or external service
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    details TEXT DEFAULT '{}', -- JSON: activity-specific details
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id)
);

-- GitHub integrations table
CREATE TABLE IF NOT EXISTS github_integrations (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    project_id TEXT,
    github_user_id TEXT,
    github_username TEXT,
    repository_owner TEXT,
    repository_name TEXT,
    access_token TEXT, -- encrypted
    refresh_token TEXT, -- encrypted
    token_expires_at TEXT,
    webhook_secret TEXT,
    last_sync TEXT,
    sync_status TEXT DEFAULT 'pending', -- pending, syncing, completed, failed
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- System configuration table
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    data_type TEXT NOT NULL DEFAULT 'string', -- string, number, boolean, json
    description TEXT,
    updated_at TEXT NOT NULL,
    updated_by TEXT,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Workflow templates table
CREATE TABLE IF NOT EXISTS workflow_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    config_template TEXT NOT NULL, -- JSON: WorkflowConfig template
    estimated_duration INTEGER, -- minutes
    tags TEXT DEFAULT '[]', -- JSON array
    is_public BOOLEAN DEFAULT FALSE,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- API keys and tokens table
CREATE TABLE IF NOT EXISTS api_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    permissions TEXT DEFAULT '[]', -- JSON array
    expires_at TEXT,
    last_used_at TEXT,
    created_at TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at);

CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_phase ON workflows(phase);
CREATE INDEX IF NOT EXISTS idx_workflows_assigned ON workflows(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON workflows(created_by);
CREATE INDEX IF NOT EXISTS idx_workflows_updated ON workflows(updated_at);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started ON workflow_executions(started_at);

CREATE INDEX IF NOT EXISTS idx_project_activities_project ON project_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_timestamp ON project_activities(timestamp);
CREATE INDEX IF NOT EXISTS idx_project_activities_type ON project_activities(activity_type);

CREATE INDEX IF NOT EXISTS idx_github_integrations_user ON github_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_github_integrations_project ON github_integrations(project_id);
CREATE INDEX IF NOT EXISTS idx_github_integrations_repo ON github_integrations(repository_owner, repository_name);

CREATE INDEX IF NOT EXISTS idx_api_tokens_user ON api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON api_tokens(token_hash);

-- Insert default system configuration
INSERT OR REPLACE INTO system_config (key, value, data_type, description, updated_at) VALUES
('api_version', '1.0.0', 'string', 'Current API version', datetime('now')),
('max_concurrent_workflows', '50', 'number', 'Maximum concurrent workflow executions', datetime('now')),
('session_timeout', '3600', 'number', 'Session timeout in seconds', datetime('now')),
('github_webhook_enabled', 'true', 'boolean', 'Enable GitHub webhook integration', datetime('now')),
('rate_limit_per_hour', '1000', 'number', 'API rate limit per hour per user', datetime('now')),
('max_project_collaborators', '100', 'number', 'Maximum collaborators per project', datetime('now'));

-- Insert default workflow templates
INSERT OR REPLACE INTO workflow_templates (
    id, name, description, category, config_template, estimated_duration,
    tags, is_public, created_by, created_at, updated_at
) VALUES
(
    'frontend-refactor-template',
    'Frontend Refactor',
    'Template for modernizing frontend components and architecture',
    'Development',
    '{"auto_start":false,"retry_on_failure":true,"max_retries":3,"timeout_minutes":720,"notification_channels":["slack"],"env_variables":{}}',
    480,
    '["frontend","react","refactor"]',
    TRUE,
    'system',
    datetime('now'),
    datetime('now')
),
(
    'api-integration-template',
    'API Integration',
    'Template for integrating third-party APIs and services',
    'Integration',
    '{"auto_start":false,"retry_on_failure":true,"max_retries":2,"timeout_minutes":240,"notification_channels":["email"],"env_variables":{}}',
    240,
    '["api","integration","backend"]',
    TRUE,
    'system',
    datetime('now'),
    datetime('now')
);