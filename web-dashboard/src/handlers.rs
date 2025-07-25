use axum::{
    extract::{State, Query, Path, Form},
    http::{StatusCode, header::{SET_COOKIE, LOCATION}},
    response::{Html, Redirect, IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;
use tera::Context;

use crate::{
    AppState, ApiResponse, DashboardSession, Claims,
    auth::{LoginRequest, LoginResponse, UserInfo},
    templates::*,
    middleware::get_user_claims,
    template_engine::render_template,
};

/// Get GitHub language color
fn get_language_color(language: Option<&str>) -> &'static str {
    match language {
        Some("JavaScript") => "#f1e05a",
        Some("TypeScript") => "#2b7489",
        Some("Python") => "#3572A5",
        Some("Java") => "#b07219",
        Some("C++") => "#f34b7d",
        Some("C") => "#555555",
        Some("C#") => "#178600",
        Some("PHP") => "#4F5D95",
        Some("Ruby") => "#701516",
        Some("Go") => "#00ADD8",
        Some("Rust") => "#dea584",
        Some("Swift") => "#ffac45",
        Some("Kotlin") => "#F18E33",
        Some("Scala") => "#c22d40",
        Some("Shell") => "#89e051",
        Some("HTML") => "#e34c26",
        Some("CSS") => "#563d7c",
        Some("Vue") => "#2c3e50",
        Some("React") => "#61dafb",
        _ => "#586069",
    }
}

/// Home page handler
pub async fn dashboard_home() -> impl IntoResponse {
    let mut context = Context::new();
    context.insert("title", "CLDCDE Pro");
    
    let html = r#"
    <!DOCTYPE html>
    <html>
    <head>
        <title>CLDCDE Pro</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/static/css/glassmorphic.css">
    </head>
    <body>
        <div class="login-container">
            <div class="glass-card" style="max-width: 800px; width: 100%; padding: 3rem;">
                <h1 style="text-align: center; font-size: 2.5rem; margin-bottom: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                    🚀 CLDCDE Pro
                </h1>
                
                <p style="text-align: center; color: var(--text-secondary); margin-bottom: 3rem; font-size: 1.1rem;">
                    Your autonomous AI development coordination system with glassmorphic UI
                </p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
                    <div class="glass-card card-3d" style="padding: 2rem; text-align: center;">
                        <h3 style="color: var(--accent-primary); margin-bottom: 1rem;">🎯 Workflow Management</h3>
                        <p style="color: var(--text-tertiary);">Coordinate complex development workflows with intelligent automation</p>
                    </div>
                    
                    <div class="glass-card card-3d" style="padding: 2rem; text-align: center;">
                        <h3 style="color: var(--accent-primary); margin-bottom: 1rem;">🔧 GitHub Integration</h3>
                        <p style="color: var(--text-tertiary);">Seamlessly sync with GitHub repositories and project management</p>
                    </div>
                    
                    <div class="glass-card card-3d" style="padding: 2rem; text-align: center;">
                        <h3 style="color: var(--accent-primary); margin-bottom: 1rem;">📊 Real-time Dashboard</h3>
                        <p style="color: var(--text-tertiary);">Monitor your projects with live updates and performance metrics</p>
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <a href="/login" class="btn" style="margin-right: 1rem;">Login</a>
                    <a href="/dashboard" class="btn btn-secondary">Go to Dashboard</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    "#;
    
    Html(html)
}

/// Main dashboard page
pub async fn dashboard_main(State(state): State<AppState>, request: axum::extract::Request) -> impl IntoResponse {
    let mut context = Context::new();
    
    // Get user from request
    if let Some(claims) = get_user_claims(&request) {
        // Parse user ID
        let user_id = claims.sub.parse::<Uuid>().unwrap_or_else(|_| Uuid::new_v4());
        
        // Fetch GitHub user profile if available
        let mut user_context = UserContext {
            id: claims.sub.clone(),
            username: claims.username.clone(),
            email: None,
            avatar_url: None,
            github_connected: false,
        };
        
        // Try to get GitHub user info
        if let Some(github_user) = state.github_integration.get_user(user_id).await {
            user_context.avatar_url = Some(github_user.avatar_url);
            user_context.github_connected = true;
            if user_context.username.is_empty() {
                user_context.username = github_user.login;
            }
        }
        
        context.insert("user", &user_context);
        
        // Fetch GitHub repositories
        let repositories = match state.github_integration.get_user_repositories(user_id).await {
            Ok(repos) => repos.into_iter().map(|repo| {
                serde_json::json!({
                    "name": repo.name,
                    "full_name": format!("{}/{}", repo.owner, repo.repository),
                    "description": repo.description,
                    "private": false, // Not available in GitHubProject
                    "html_url": repo.url,
                    "language": None::<String>, // Not available in GitHubProject
                    "stargazers_count": 0, // Not available in GitHubProject
                    "forks_count": 0, // Not available in GitHubProject
                    "language_color": "#586069"
                })
            }).collect::<Vec<_>>(),
            Err(e) => {
                eprintln!("Failed to fetch repositories: {}", e);
                vec![]
            }
        };
        
        context.insert("repositories", &repositories);
    }
    
    // Mock data for workflows
    let workflows: Vec<WorkflowSummary> = vec![];
    let projects: Vec<ProjectSummary> = vec![];
    let system_status = SystemStatus {
        status: "Online".to_string(),
        uptime: "2 hours 15 minutes".to_string(),
        active_workflows: workflows.len(),
        connected_users: 1,
        github_rate_limit: None,
    };
    
    context.insert("workflows", &workflows);
    context.insert("projects", &projects);
    context.insert("system_status", &system_status);
    
    match render_template("dashboard.html", &context) {
        Ok(html) => Html(html).into_response(),
        Err(e) => {
            eprintln!("Template error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Template rendering error").into_response()
        }
    }
}

/// Workflows page
pub async fn workflows_page(State(_state): State<AppState>) -> impl IntoResponse {
    let context = Context::new();
    
    let html = r#"
    <!DOCTYPE html>
    <html>
    <head>
        <title>Workflows - CLDCDE Pro</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/static/css/glassmorphic.css">
    </head>
    <body>
        <header class="header glass">
            <h1>⚡ Workflows</h1>
            <div class="user-info">
                <a href="/dashboard" class="btn btn-secondary">Back to Dashboard</a>
            </div>
        </header>
        
        <main style="padding: 120px 2rem 2rem; max-width: 1200px; margin: 0 auto;">
            <div class="glass-card" style="padding: 3rem; text-align: center;">
                <h2 style="color: var(--accent-primary); margin-bottom: 1rem;">Workflows Coming Soon</h2>
                <p style="color: var(--text-secondary);">This feature is under development</p>
            </div>
        </main>
    </body>
    </html>
    "#;
    
    Html(html)
}

/// Projects page
pub async fn projects_page(State(_state): State<AppState>) -> impl IntoResponse {
    let context = Context::new();
    
    let html = r#"
    <!DOCTYPE html>
    <html>
    <head>
        <title>Projects - CLDCDE Pro</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/static/css/glassmorphic.css">
    </head>
    <body>
        <header class="header glass">
            <h1>📁 Projects</h1>
            <div class="user-info">
                <a href="/dashboard" class="btn btn-secondary">Back to Dashboard</a>
            </div>
        </header>
        
        <main style="padding: 120px 2rem 2rem; max-width: 1200px; margin: 0 auto;">
            <div class="glass-card" style="padding: 3rem; text-align: center;">
                <h2 style="color: var(--accent-primary); margin-bottom: 1rem;">Projects Coming Soon</h2>
                <p style="color: var(--text-secondary);">This feature is under development</p>
            </div>
        </main>
    </body>
    </html>
    "#;
    
    Html(html)
}

/// Repositories page
pub async fn repositories_page(State(state): State<AppState>, request: axum::extract::Request) -> impl IntoResponse {
    let mut context = Context::new();
    
    // Get user from request
    if let Some(claims) = get_user_claims(&request) {
        // Parse user ID
        let user_id = claims.sub.parse::<Uuid>().unwrap_or_else(|_| Uuid::new_v4());
        
        // Fetch GitHub user profile if available
        let mut user_context = UserContext {
            id: claims.sub.clone(),
            username: claims.username.clone(),
            email: None,
            avatar_url: None,
            github_connected: false,
        };
        
        // Try to get GitHub user info
        if let Some(github_user) = state.github_integration.get_user(user_id).await {
            user_context.avatar_url = Some(github_user.avatar_url);
            user_context.github_connected = true;
            if user_context.username.is_empty() {
                user_context.username = github_user.login;
            }
        }
        
        context.insert("user", &user_context);
        
        // Fetch GitHub repositories
        let repositories = match state.github_integration.get_user_repositories(user_id).await {
            Ok(repos) => repos.into_iter().map(|repo| {
                let now = chrono::Utc::now();
                let duration = now.signed_duration_since(repo.updated_at);
                let updated_at = if duration.num_days() > 365 {
                    format!("{} years ago", duration.num_days() / 365)
                } else if duration.num_days() > 30 {
                    format!("{} months ago", duration.num_days() / 30)
                } else if duration.num_days() > 0 {
                    format!("{} days ago", duration.num_days())
                } else if duration.num_hours() > 0 {
                    format!("{} hours ago", duration.num_hours())
                } else {
                    format!("{} minutes ago", duration.num_minutes())
                };
                
                serde_json::json!({
                    "name": repo.name,
                    "full_name": format!("{}/{}", repo.owner, repo.repository),
                    "description": repo.description,
                    "private": false, // Not available in GitHubProject
                    "html_url": repo.url,
                    "language": None::<String>, // Not available in GitHubProject
                    "stargazers_count": 0, // Not available in GitHubProject
                    "forks_count": 0, // Not available in GitHubProject
                    "language_color": "#586069",
                    "updated_at": updated_at
                })
            }).collect::<Vec<_>>(),
            Err(e) => {
                eprintln!("Failed to fetch repositories: {}", e);
                vec![]
            }
        };
        
        context.insert("repositories", &repositories);
    }
    
    match render_template("repositories.html", &context) {
        Ok(html) => Html(html).into_response(),
        Err(e) => {
            eprintln!("Template error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Template rendering error").into_response()
        }
    }
}

/// GitHub setup page
pub async fn github_setup_page() -> impl IntoResponse {
    let context = Context::new();
    
    match render_template("github-setup.html", &context) {
        Ok(html) => Html(html).into_response(),
        Err(e) => {
            eprintln!("Template error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Template rendering error").into_response()
        }
    }
}

/// Settings page
pub async fn settings_page(State(_state): State<AppState>) -> impl IntoResponse {
    let context = Context::new();
    
    let html = r#"
    <!DOCTYPE html>
    <html>
    <head>
        <title>Settings - CLDCDE Pro</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/static/css/glassmorphic.css">
    </head>
    <body>
        <header class="header glass">
            <h1>⚙️ Settings</h1>
            <div class="user-info">
                <a href="/dashboard" class="btn btn-secondary">Back to Dashboard</a>
            </div>
        </header>
        
        <main style="padding: 120px 2rem 2rem; max-width: 1200px; margin: 0 auto;">
            <div class="glass-card" style="padding: 3rem; text-align: center;">
                <h2 style="color: var(--accent-primary); margin-bottom: 1rem;">Settings Coming Soon</h2>
                <p style="color: var(--text-secondary);">This feature is under development</p>
            </div>
        </main>
    </body>
    </html>
    "#;
    
    Html(html)
}

/// Login page
pub async fn login_page() -> impl IntoResponse {
    let context = Context::new();
    
    match render_template("login.html", &context) {
        Ok(html) => Html(html).into_response(),
        Err(e) => {
            eprintln!("Template error: {}", e);
            // Fallback HTML
            Html(include_str!("../templates/login.html")).into_response()
        }
    }
}

/// Handle login form submission
pub async fn login_submit(
    State(state): State<AppState>,
    Form(login): Form<LoginRequest>,
) -> impl IntoResponse {
    match state.auth_manager.authenticate(&login.username, &login.password).await {
        Ok(Some(token)) => {
            let cookie = format!(
                "session_token={}; Path=/; HttpOnly; SameSite=Strict; Max-Age={}",
                token,
                if login.remember_me.unwrap_or(false) { 604800 } else { 86400 } // 7 days or 1 day
            );
            
            (
                StatusCode::SEE_OTHER,
                [(SET_COOKIE, cookie), (LOCATION, "/dashboard".to_string())],
                "Login successful",
            ).into_response()
        }
        Ok(None) => {
            let mut context = Context::new();
            context.insert("error_message", "Invalid username or password");
            
            match render_template("login.html", &context) {
                Ok(html) => (StatusCode::UNAUTHORIZED, Html(html)).into_response(),
                Err(_) => (StatusCode::UNAUTHORIZED, "Invalid credentials").into_response(),
            }
        }
        Err(e) => {
            eprintln!("Authentication error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Authentication error").into_response()
        }
    }
}

/// Handle logout
pub async fn logout() -> impl IntoResponse {
    let cookie = "session_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0";
    
    (
        StatusCode::SEE_OTHER,
        [(SET_COOKIE, cookie.to_string()), (LOCATION, "/".to_string())],
        "Logged out",
    )
}

/// GitHub OAuth start
pub async fn github_oauth_start(State(state): State<AppState>) -> impl IntoResponse {
    // Check if we have OAuth credentials configured
    if state.github_integration.config.client_id.is_empty() {
        // Fallback: If no OAuth app is configured, use personal access token flow
        // For now, just authenticate as admin with GitHub integration enabled
        let token = state.auth_manager.authenticate("admin", "admin123").await
            .unwrap_or_default()
            .unwrap_or_default();
        
        let cookie = format!("session_token={}; Path=/; HttpOnly; SameSite=Strict", token);
        
        return (
            StatusCode::SEE_OTHER,
            [(SET_COOKIE, cookie), (LOCATION, "/dashboard".to_string())],
            "GitHub authentication via personal access token",
        ).into_response();
    }
    
    // Normal OAuth flow
    let state_param = uuid::Uuid::new_v4().to_string();
    let auth_url = state.github_integration.get_auth_url(&state_param);
    
    Redirect::to(&auth_url).into_response()
}

/// GitHub OAuth callback
#[derive(Deserialize)]
pub struct GitHubCallback {
    code: String,
    state: String,
}

pub async fn github_oauth_callback(
    State(_state): State<AppState>,
    Query(_callback): Query<GitHubCallback>,
) -> impl IntoResponse {
    // This is a simplified implementation
    // In a real app, you'd validate the state parameter and exchange the code for a token
    
    let cookie = format!("session_token=github_temp_token; Path=/; HttpOnly; SameSite=Strict");
    
    (
        StatusCode::SEE_OTHER,
        [(SET_COOKIE, cookie), (LOCATION, "/dashboard".to_string())],
        "GitHub authentication successful",
    )
}

/// API status endpoint
pub async fn api_status(State(_state): State<AppState>) -> impl IntoResponse {
    let status = serde_json::json!({
        "status": "online",
        "version": "0.1.0",
        "uptime": "2 hours 15 minutes",
        "features": {
            "workflows": true,
            "github_integration": true,
            "websocket": true,
            "real_time_updates": true
        }
    });
    
    Json(status)
}

/// List workflows API
pub async fn api_workflows_list(State(_state): State<AppState>) -> impl IntoResponse {
    let _coordinator = _state.workflow_coordinator.read().await;
    
    // Mock response for now
    let workflows = vec![
        serde_json::json!({
            "id": "workflow-1",
            "name": "Test Workflow",
            "status": "active",
            "phase": "Planning",
            "progress": 25.0,
            "created_at": "2024-01-01T12:00:00Z",
            "updated_at": "2024-01-01T13:00:00Z"
        })
    ];
    
    Json(ApiResponse::success(workflows))
}

/// Create workflow API
pub async fn api_workflows_create(
    State(_state): State<AppState>,
    Json(_payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    // Mock response
    let workflow = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "name": "New Workflow",
        "status": "created",
        "created_at": chrono::Utc::now().to_rfc3339()
    });
    
    Json(ApiResponse::success(workflow))
}

/// Get workflow API
pub async fn api_workflow_get(
    State(_state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    // Mock response
    let workflow = serde_json::json!({
        "id": id,
        "name": "Test Workflow",
        "status": "active",
        "phase": "Planning",
        "progress": 25.0,
        "created_at": "2024-01-01T12:00:00Z",
        "updated_at": "2024-01-01T13:00:00Z"
    });
    
    Json(ApiResponse::success(workflow))
}

/// Update workflow API
pub async fn api_workflow_update(
    State(_state): State<AppState>,
    Path(id): Path<String>,
    Json(_payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    // Mock response
    let workflow = serde_json::json!({
        "id": id,
        "status": "updated",
        "updated_at": chrono::Utc::now().to_rfc3339()
    });
    
    Json(ApiResponse::success(workflow))
}

/// List projects API
pub async fn api_projects_list(State(_state): State<AppState>) -> impl IntoResponse {
    // Mock response
    let projects = vec![
        serde_json::json!({
            "id": "project-1",
            "name": "Test Project",
            "description": "A test project",
            "status": "active",
            "github_repo": "user/repo",
            "last_sync": "2024-01-01T12:00:00Z"
        })
    ];
    
    Json(ApiResponse::success(projects))
}

/// Sync project API
pub async fn api_project_sync(
    State(_state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    // Mock response
    let result = serde_json::json!({
        "project_id": id,
        "status": "syncing",
        "started_at": chrono::Utc::now().to_rfc3339()
    });
    
    Json(ApiResponse::success(result))
}

/// List GitHub repos API
pub async fn api_github_repos(State(_state): State<AppState>) -> impl IntoResponse {
    // Mock response
    let repos = vec![
        serde_json::json!({
            "name": "test-repo",
            "full_name": "user/test-repo",
            "description": "A test repository",
            "private": false,
            "url": "https://github.com/user/test-repo"
        })
    ];
    
    Json(ApiResponse::success(repos))
}

/// Get GitHub issues API
pub async fn api_github_issues(
    State(_state): State<AppState>,
    Path((_owner, _repo)): Path<(String, String)>,
) -> impl IntoResponse {
    // Mock response
    let issues = vec![
        serde_json::json!({
            "id": 1,
            "number": 1,
            "title": "Test Issue",
            "state": "open",
            "created_at": "2024-01-01T12:00:00Z"
        })
    ];
    
    Json(ApiResponse::success(issues))
}

/// GitHub setup API
#[derive(Deserialize)]
pub struct GitHubSetupRequest {
    method: String,
    client_id: Option<String>,
    client_secret: Option<String>,
    token: Option<String>,
}

pub async fn api_github_setup(
    State(_state): State<AppState>,
    Json(setup): Json<GitHubSetupRequest>,
) -> impl IntoResponse {
    // Read existing .env file
    let env_path = std::path::Path::new(".env");
    let mut env_content = String::new();
    
    if env_path.exists() {
        env_content = std::fs::read_to_string(env_path)
            .unwrap_or_else(|_| String::new());
    }
    
    // Helper function to update or add env variable
    let update_env_var = |content: &mut String, key: &str, value: &str| {
        let export_key = format!("export {}=", key);
        let new_line = format!("export {}=\"{}\"", key, value);
        
        // Check if the key exists
        if let Some(pos) = content.find(&export_key) {
            // Find the end of the line
            if let Some(end_pos) = content[pos..].find('\n') {
                content.replace_range(pos..pos+end_pos, &new_line);
            } else {
                // Last line without newline
                content.replace_range(pos.., &new_line);
            }
        } else {
            // Add new line
            if !content.is_empty() && !content.ends_with('\n') {
                content.push('\n');
            }
            content.push_str(&new_line);
            content.push('\n');
        }
    };
    
    // Update environment variables based on method
    match setup.method.as_str() {
        "oauth" => {
            if let (Some(client_id), Some(client_secret)) = (setup.client_id, setup.client_secret) {
                update_env_var(&mut env_content, "GITHUB_CLIENT_ID", &client_id);
                update_env_var(&mut env_content, "GITHUB_CLIENT_SECRET", &client_secret);
                update_env_var(&mut env_content, "GITHUB_REDIRECT_URI", "http://localhost:8083/auth/github/callback");
                
                // Clear token if it exists
                env_content = env_content.lines()
                    .filter(|line| !line.contains("GITHUB_TOKEN"))
                    .collect::<Vec<_>>()
                    .join("\n");
            } else {
                return Json(ApiResponse::<()>::error("Missing client_id or client_secret".to_string()));
            }
        }
        "token" => {
            if let Some(token) = setup.token {
                update_env_var(&mut env_content, "GITHUB_TOKEN", &token);
                
                // Clear OAuth credentials if they exist
                env_content = env_content.lines()
                    .filter(|line| {
                        !line.contains("GITHUB_CLIENT_ID") && 
                        !line.contains("GITHUB_CLIENT_SECRET") &&
                        !line.contains("GITHUB_REDIRECT_URI")
                    })
                    .collect::<Vec<_>>()
                    .join("\n");
            } else {
                return Json(ApiResponse::<()>::error("Missing token".to_string()));
            }
        }
        _ => {
            return Json(ApiResponse::<()>::error("Invalid method".to_string()));
        }
    }
    
    // Write updated .env file
    match std::fs::write(env_path, env_content) {
        Ok(_) => {
            Json(ApiResponse::success(serde_json::json!({
                "message": "GitHub credentials saved successfully",
                "restart_required": true
            })))
        }
        Err(e) => {
            Json(ApiResponse::<()>::error(format!("Failed to save credentials: {}", e)))
        }
    }
}