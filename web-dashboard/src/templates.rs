use serde::{Serialize, Deserialize};

/// Dashboard template context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardTemplate {
    pub user: Option<UserContext>,
    pub workflows: Vec<WorkflowSummary>,
    pub projects: Vec<ProjectSummary>,
    pub system_status: SystemStatus,
}

/// User context for templates
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserContext {
    pub id: String,
    pub username: String,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
    pub github_connected: bool,
}

/// Workflow summary for dashboard
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowSummary {
    pub id: String,
    pub name: String,
    pub status: String,
    pub phase: String,
    pub progress: f32,
    pub created_at: String,
    pub updated_at: String,
}

/// Project summary for dashboard
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSummary {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub github_repo: Option<String>,
    pub status: String,
    pub last_sync: Option<String>,
}

/// System status information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemStatus {
    pub status: String,
    pub uptime: String,
    pub active_workflows: usize,
    pub connected_users: usize,
    pub github_rate_limit: Option<GitHubRateLimit>,
}

/// GitHub rate limit information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubRateLimit {
    pub remaining: u32,
    pub total: u32,
    pub reset_at: String,
}

/// Workflows page template
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowsTemplate {
    pub user: Option<UserContext>,
    pub workflows: Vec<WorkflowDetail>,
    pub workflow_types: Vec<String>,
}

/// Detailed workflow information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowDetail {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub current_phase: String,
    pub phases: Vec<WorkflowPhase>,
    pub progress: f32,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: String,
    pub github_integration: Option<GitHubIntegrationInfo>,
}

/// Workflow phase information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowPhase {
    pub name: String,
    pub status: String,
    pub progress: f32,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub tasks: Vec<WorkflowTask>,
}

/// Workflow task information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowTask {
    pub id: String,
    pub name: String,
    pub status: String,
    pub assigned_to: Option<String>,
    pub created_at: String,
    pub due_date: Option<String>,
}

/// GitHub integration information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubIntegrationInfo {
    pub repository: String,
    pub branch: String,
    pub last_sync: String,
    pub sync_status: String,
    pub issues_synced: usize,
    pub prs_synced: usize,
}

/// Projects page template
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectsTemplate {
    pub user: Option<UserContext>,
    pub projects: Vec<ProjectDetail>,
    pub github_repos: Vec<GitHubRepository>,
}

/// Detailed project information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectDetail {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub github_repo: Option<String>,
    pub workflows: Vec<WorkflowSummary>,
    pub team_members: Vec<TeamMember>,
    pub created_at: String,
    pub last_activity: String,
}

/// Team member information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamMember {
    pub id: String,
    pub username: String,
    pub role: String,
    pub avatar_url: Option<String>,
}

/// GitHub repository information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubRepository {
    pub name: String,
    pub full_name: String,
    pub description: Option<String>,
    pub private: bool,
    pub url: String,
    pub default_branch: String,
    pub open_issues: usize,
    pub open_prs: usize,
}

/// Settings page template
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettingsTemplate {
    pub user: Option<UserContext>,
    pub github_settings: GitHubSettings,
    pub workflow_settings: WorkflowSettings,
    pub notification_settings: NotificationSettings,
}

/// GitHub settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubSettings {
    pub connected: bool,
    pub username: Option<String>,
    pub repositories: Vec<String>,
    pub webhook_url: Option<String>,
    pub sync_interval: u32,
}

/// Workflow settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowSettings {
    pub auto_start: bool,
    pub phase_timeout: u32,
    pub retry_count: u32,
    pub notification_level: String,
    pub allowed_workflow_types: Vec<String>,
}

/// Notification settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationSettings {
    pub email_enabled: bool,
    pub slack_enabled: bool,
    pub webhook_enabled: bool,
    pub notification_types: Vec<String>,
}

/// Error page template
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorTemplate {
    pub error_code: u16,
    pub error_message: String,
    pub details: Option<String>,
    pub user: Option<UserContext>,
}

impl ErrorTemplate {
    pub fn new(code: u16, message: String) -> Self {
        Self {
            error_code: code,
            error_message: message,
            details: None,
            user: None,
        }
    }
    
    pub fn with_details(mut self, details: String) -> Self {
        self.details = Some(details);
        self
    }
    
    pub fn with_user(mut self, user: UserContext) -> Self {
        self.user = Some(user);
        self
    }
}

/// Login page template  
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginTemplate {
    pub error_message: Option<String>,
    pub redirect_url: Option<String>,
}

impl Default for LoginTemplate {
    fn default() -> Self {
        Self {
            error_message: None,
            redirect_url: None,
        }
    }
}

impl LoginTemplate {
    pub fn with_error(mut self, message: String) -> Self {
        self.error_message = Some(message);
        self
    }
    
    pub fn with_redirect(mut self, url: String) -> Self {
        self.redirect_url = Some(url);
        self
    }
}