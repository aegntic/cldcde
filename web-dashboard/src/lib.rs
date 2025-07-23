use anyhow::Result;
use axum::{
    extract::{State, Query, Path},
    http::StatusCode,
    response::{Html, Redirect, Response, IntoResponse},
    routing::{get, post},
    Json, Router,
};
use github_integration::{GitHubIntegration, GitHubConfig};
use master_orchestrator::MasterOrchestrator;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower::ServiceBuilder;
use tower_http::services::ServeDir;
use tower_http::cors::CorsLayer;
use uuid::Uuid;
use workflow_coordinator::WorkflowCoordinator;

pub mod auth;
pub mod handlers;
pub mod middleware;
pub mod templates;
pub mod websocket;

pub use auth::*;
pub use handlers::*;
pub use middleware::*;
pub use templates::*;
pub use websocket::*;

/// Web Dashboard Application State
#[derive(Clone)]
pub struct AppState {
    pub github_integration: Arc<GitHubIntegration>,
    pub master_orchestrator: Arc<RwLock<MasterOrchestrator>>,
    pub workflow_coordinator: Arc<RwLock<WorkflowCoordinator>>,
    pub auth_manager: Arc<AuthManager>,
    pub sessions: Arc<RwLock<HashMap<String, DashboardSession>>>,
    pub websocket_connections: Arc<RwLock<HashMap<Uuid, WebSocketConnection>>>,
}

/// Dashboard configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardConfig {
    pub host: String,
    pub port: u16,
    pub jwt_secret: String,
    pub session_timeout: u64,
    pub github_config: GitHubConfig,
    pub cors_origins: Vec<String>,
}

impl Default for DashboardConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 8080,
            jwt_secret: "your-secret-key-change-in-production".to_string(),
            session_timeout: 3600, // 1 hour
            github_config: GitHubConfig::default(),
            cors_origins: vec!["http://localhost:3000".to_string(), "http://127.0.0.1:8080".to_string()],
        }
    }
}

/// Web Dashboard Server
pub struct WebDashboard {
    config: DashboardConfig,
    app_state: AppState,
}

impl WebDashboard {
    /// Create a new web dashboard instance
    pub async fn new(config: DashboardConfig) -> Result<Self> {
        let github_integration = Arc::new(GitHubIntegration::new(config.github_config.clone()));
        let master_orchestrator = Arc::new(RwLock::new(MasterOrchestrator::new()?));
        let workflow_coordinator = Arc::new(RwLock::new(WorkflowCoordinator::new(
            uuid::Uuid::new_v4(),
            "dashboard".to_string()
        )?));

        let auth_manager = Arc::new(AuthManager::new(
            config.jwt_secret.clone(),
            config.session_timeout,
        )?);

        let app_state = AppState {
            github_integration,
            master_orchestrator,
            workflow_coordinator,
            auth_manager,
            sessions: Arc::new(RwLock::new(HashMap::new())),
            websocket_connections: Arc::new(RwLock::new(HashMap::new())),
        };

        Ok(Self { config, app_state })
    }

    /// Build the Axum router with all routes
    pub fn build_router(&self) -> Router {
        Router::new()
            // Static files
            .nest_service("/static", ServeDir::new("static"))
            
            // Main dashboard routes
            .route("/", get(dashboard_home))
            .route("/dashboard", get(dashboard_main))
            .route("/workflows", get(workflows_page))
            .route("/projects", get(projects_page))
            .route("/settings", get(settings_page))
            
            // Authentication routes
            .route("/login", get(login_page).post(login_submit))
            .route("/logout", post(logout))
            .route("/auth/github", get(github_oauth_start))
            .route("/auth/github/callback", get(github_oauth_callback))
            
            // API routes
            .route("/api/status", get(api_status))
            .route("/api/workflows", get(api_workflows_list).post(api_workflows_create))
            .route("/api/workflows/:id", get(api_workflow_get).put(api_workflow_update))
            .route("/api/projects", get(api_projects_list))
            .route("/api/projects/:id/sync", post(api_project_sync))
            .route("/api/github/repos", get(api_github_repos))
            .route("/api/github/issues/:owner/:repo", get(api_github_issues))
            
            // WebSocket route
            .route("/ws", get(websocket_handler))
            
            // Add CORS
            .layer(
                CorsLayer::permissive()
            )
            
            // Add authentication middleware
            .layer(axum::middleware::from_fn_with_state(
                self.app_state.clone(),
                auth_middleware
            ))
            
            .with_state(self.app_state.clone())
    }

    /// Start the web dashboard server
    pub async fn serve(&self) -> Result<()> {
        let app = self.build_router();
        
        let listener = tokio::net::TcpListener::bind(format!("{}:{}", self.config.host, self.config.port))
            .await?;
            
        tracing::info!("Web dashboard starting on {}:{}", self.config.host, self.config.port);
        
        axum::serve(listener, app).await?;
        
        Ok(())
    }
}

/// Dashboard user session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardSession {
    pub session_id: String,
    pub user_id: Uuid,
    pub github_user_id: Option<Uuid>,
    pub username: String,
    pub email: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub last_activity: chrono::DateTime<chrono::Utc>,
    pub permissions: Vec<String>,
}

impl DashboardSession {
    pub fn new(user_id: Uuid, username: String) -> Self {
        let now = chrono::Utc::now();
        Self {
            session_id: Uuid::new_v4().to_string(),
            user_id,
            github_user_id: None,
            username,
            email: None,
            created_at: now,
            last_activity: now,
            permissions: vec!["read".to_string()],
        }
    }

    pub fn is_expired(&self, timeout_seconds: u64) -> bool {
        let timeout = chrono::Duration::seconds(timeout_seconds as i64);
        chrono::Utc::now() - self.last_activity > timeout
    }

    pub fn refresh(&mut self) {
        self.last_activity = chrono::Utc::now();
    }
}

/// Basic API response structure
#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}

impl<T: Serialize> IntoResponse for ApiResponse<T> {
    fn into_response(self) -> Response {
        let status = if self.success {
            StatusCode::OK
        } else {
            StatusCode::BAD_REQUEST
        };
        
        (status, Json(self)).into_response()
    }
}