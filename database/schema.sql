-- CLDCDE Pro Production Database Schema
-- Created by DataSorcerer
-- PostgreSQL compatible, SQLite for development

-- Users table (GitHub OAuth)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    github_id INTEGER UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    github_token TEXT, -- Encrypted
    refresh_token TEXT, -- Encrypted
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    INDEX idx_users_github_id (github_id),
    INDEX idx_users_username (username)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sessions_user_id (user_id),
    INDEX idx_sessions_expires_at (expires_at)
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    github_org_id INTEGER UNIQUE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_organizations_slug (slug)
);

-- User organizations (many-to-many)
CREATE TABLE IF NOT EXISTS user_organizations (
    user_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, organization_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Repositories table
CREATE TABLE IF NOT EXISTS repositories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    github_repo_id INTEGER UNIQUE NOT NULL,
    owner VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(512) UNIQUE NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    default_branch VARCHAR(255) DEFAULT 'main',
    language VARCHAR(100),
    stars_count INTEGER DEFAULT 0,
    forks_count INTEGER DEFAULT 0,
    open_issues_count INTEGER DEFAULT 0,
    last_pushed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_repositories_full_name (full_name),
    INDEX idx_repositories_owner (owner)
);

-- User repositories (many-to-many with permissions)
CREATE TABLE IF NOT EXISTS user_repositories (
    user_id INTEGER NOT NULL,
    repository_id INTEGER NOT NULL,
    permission VARCHAR(50) DEFAULT 'read',
    is_favorite BOOLEAN DEFAULT false,
    last_accessed_at TIMESTAMP,
    PRIMARY KEY (user_id, repository_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
    INDEX idx_user_repositories_accessed (user_id, last_accessed_at)
);

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'feature', 'bugfix', 'refactor', 'infrastructure'
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed', 'error'
    phase VARCHAR(50) DEFAULT 'planning', -- 'planning', 'requirements', 'design', 'implementation', 'testing'
    repository_id INTEGER,
    created_by_user_id INTEGER NOT NULL,
    assigned_to_user_id INTEGER,
    progress INTEGER DEFAULT 0,
    priority VARCHAR(20) DEFAULT 'medium',
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    metadata JSON,
    FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id),
    INDEX idx_workflows_status (status),
    INDEX idx_workflows_phase (phase),
    INDEX idx_workflows_created_by (created_by_user_id)
);

-- Workflow nodes table
CREATE TABLE IF NOT EXISTS workflow_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id INTEGER NOT NULL,
    node_id VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'start', 'process', 'decision', 'end'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'completed', 'error', 'skipped'
    position_x FLOAT NOT NULL,
    position_y FLOAT NOT NULL,
    metadata JSON,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    UNIQUE(workflow_id, node_id),
    INDEX idx_workflow_nodes_workflow (workflow_id)
);

-- Workflow connections table
CREATE TABLE IF NOT EXISTS workflow_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id INTEGER NOT NULL,
    from_node_id VARCHAR(100) NOT NULL,
    to_node_id VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'default',
    label VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    metadata JSON,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    INDEX idx_workflow_connections_workflow (workflow_id)
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    visibility VARCHAR(20) DEFAULT 'private',
    organization_id INTEGER,
    created_by_user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    INDEX idx_projects_organization (organization_id),
    INDEX idx_projects_created_by (created_by_user_id)
);

-- Project members table
CREATE TABLE IF NOT EXISTS project_members (
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(50) DEFAULT 'member', -- 'owner', 'admin', 'member', 'viewer'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Project workflows (many-to-many)
CREATE TABLE IF NOT EXISTS project_workflows (
    project_id INTEGER NOT NULL,
    workflow_id INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, workflow_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_activity_logs_user (user_id),
    INDEX idx_activity_logs_entity (entity_type, entity_id),
    INDEX idx_activity_logs_created_at (created_at)
);

-- WebSocket connections tracking
CREATE TABLE IF NOT EXISTS websocket_connections (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_ping_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_websocket_connections_user (user_id)
);

-- API rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    ip_address VARCHAR(45),
    endpoint VARCHAR(255) NOT NULL,
    requests_count INTEGER DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rate_limits_user (user_id),
    INDEX idx_rate_limits_ip (ip_address),
    INDEX idx_rate_limits_window (window_start)
);

-- Create update triggers for updated_at columns
CREATE TRIGGER update_users_updated_at AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_organizations_updated_at AFTER UPDATE ON organizations
BEGIN
    UPDATE organizations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_repositories_updated_at AFTER UPDATE ON repositories
BEGIN
    UPDATE repositories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_workflows_updated_at AFTER UPDATE ON workflows
BEGIN
    UPDATE workflows SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_projects_updated_at AFTER UPDATE ON projects
BEGIN
    UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;