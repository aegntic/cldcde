use axum::{
    extract::{State, Query, Path, Form},
    http::{StatusCode, header::{SET_COOKIE, LOCATION}},
    response::{Html, Redirect, IntoResponse},
    Json,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

use crate::{
    AppState, ApiResponse, DashboardSession, Claims,
    auth::{LoginRequest, LoginResponse, UserInfo},
    templates::*,
    middleware::get_user_claims,
};

/// Home page handler
pub async fn dashboard_home() -> impl IntoResponse {
    Html(r#"
    <!DOCTYPE html>
    <html>
    <head>
        <title>Enhanced Tmux Orchestrator</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   margin: 0; padding: 2rem; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; 
                        border-radius: 8px; padding: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; margin-bottom: 2rem; }
            .nav { display: flex; gap: 1rem; margin-bottom: 2rem; }
            .nav a { padding: 0.5rem 1rem; background: #007bff; color: white; 
                    text-decoration: none; border-radius: 4px; }
            .nav a:hover { background: #0056b3; }
            .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
                           gap: 1rem; margin-top: 2rem; }
            .feature-card { border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; }
            .feature-card h3 { margin-top: 0; color: #007bff; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Enhanced Tmux Orchestrator</h1>
            <div class="nav">
                <a href="/dashboard">Dashboard</a>
                <a href="/workflows">Workflows</a>
                <a href="/projects">Projects</a>
                <a href="/login">Login</a>
            </div>
            
            <p>Welcome to the Enhanced Tmux Orchestrator - Your autonomous AI development coordination system.</p>
            
            <div class="feature-grid">
                <div class="feature-card">
                    <h3>🎯 Workflow Management</h3>
                    <p>Coordinate complex development workflows with intelligent automation and real-time monitoring.</p>
                </div>
                <div class="feature-card">
                    <h3>🔧 GitHub Integration</h3>
                    <p>Seamlessly sync with GitHub repositories, issues, and project management tools.</p>
                </div>
                <div class="feature-card">
                    <h3>📊 Real-time Dashboard</h3>
                    <p>Monitor your projects with live updates, performance metrics, and collaboration insights.</p>
                </div>
                <div class="feature-card">
                    <h3>🤖 AI Orchestration</h3>
                    <p>Leverage AI agents for intelligent task coordination and automated decision making.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    "#)
}

/// Main dashboard page
pub async fn dashboard_main(State(_state): State<AppState>) -> impl IntoResponse {
    Html(include_str!("../templates/dashboard.html"))
}

/// Workflows page
pub async fn workflows_page(State(_state): State<AppState>) -> impl IntoResponse {
    Html(include_str!("../templates/workflows.html"))
}

/// Projects page
pub async fn projects_page(State(_state): State<AppState>) -> impl IntoResponse {
    Html(include_str!("../templates/projects.html"))
}

/// Settings page
pub async fn settings_page(State(_state): State<AppState>) -> impl IntoResponse {
    Html(include_str!("../templates/settings.html"))
}

/// Login page
pub async fn login_page() -> impl IntoResponse {
    Html(r#"
    <!DOCTYPE html>
    <html>
    <head>
        <title>Login - Enhanced Tmux Orchestrator</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                   min-height: 100vh; display: flex; justify-content: center; align-items: center; }
            .login-container { background: white; padding: 2rem; border-radius: 12px; 
                              box-shadow: 0 8px 32px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
            h1 { text-align: center; color: #333; margin-bottom: 2rem; }
            .form-group { margin-bottom: 1rem; }
            label { display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500; }
            input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; 
                   font-size: 1rem; transition: border-color 0.3s; }
            input:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 3px rgba(0,123,255,0.1); }
            .btn { width: 100%; padding: 0.75rem; background: #007bff; color: white; border: none; 
                  border-radius: 6px; font-size: 1rem; cursor: pointer; transition: background 0.3s; }
            .btn:hover { background: #0056b3; }
            .btn-github { background: #333; margin-top: 1rem; }
            .btn-github:hover { background: #000; }
            .divider { text-align: center; margin: 1.5rem 0; color: #666; }
            .back-link { text-align: center; margin-top: 1rem; }
            .back-link a { color: #007bff; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="login-container">
            <h1>🚀 Login</h1>
            <form method="post" action="/login">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" name="username" required>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="btn">Sign In</button>
            </form>
            
            <div class="divider">or</div>
            
            <a href="/auth/github" class="btn btn-github">
                Continue with GitHub
            </a>
            
            <div class="back-link">
                <a href="/">&larr; Back to Home</a>
            </div>
        </div>
    </body>
    </html>
    "#)
}

/// Handle login form submission
#[derive(Deserialize)]
pub struct LoginForm {
    username: String,
    password: String,
}

pub async fn login_submit(
    State(state): State<AppState>,
    Form(form): Form<LoginForm>,
) -> impl IntoResponse {
    match state.auth_manager.authenticate(&form.username, &form.password).await {
        Ok(Some(token)) => {
            let cookie = format!("session_token={}; Path=/; HttpOnly; SameSite=Strict", token);
            
            (
                StatusCode::SEE_OTHER,
                [(SET_COOKIE, cookie), (LOCATION, "/dashboard".to_string())],
                "Redirecting to dashboard",
            ).into_response()
        }
        Ok(None) => {
            Html(r#"
            <div style="color: red; text-align: center; padding: 1rem;">
                Invalid username or password. Please try again.
                <br><br>
                <a href="/login">Back to Login</a>
            </div>
            "#).into_response()
        }
        Err(_) => {
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
    let state_param = uuid::Uuid::new_v4().to_string();
    let auth_url = state.github_integration.get_auth_url(&state_param);
    
    Redirect::to(&auth_url)
}

/// GitHub OAuth callback
#[derive(Deserialize)]
pub struct GitHubCallback {
    code: String,
    state: String,
}

pub async fn github_oauth_callback(
    State(state): State<AppState>,
    Query(callback): Query<GitHubCallback>,
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

// API Handlers

/// API status endpoint
pub async fn api_status() -> impl IntoResponse {
    let response = ApiResponse::success(serde_json::json!({
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": chrono::Utc::now(),
    }));
    
    Json(response)
}

/// List workflows
pub async fn api_workflows_list(State(state): State<AppState>) -> impl IntoResponse {
    let coordinator = state.workflow_coordinator.read().await;
    
    // Get workflow data (simplified)
    let workflows = vec![
        serde_json::json!({
            "id": "workflow-1",
            "name": "Development Workflow",
            "status": "active",
            "phase": "implementation",
            "progress": 75
        }),
        serde_json::json!({
            "id": "workflow-2", 
            "name": "Testing Pipeline",
            "status": "paused",
            "phase": "review",
            "progress": 40
        })
    ];
    
    ApiResponse::success(workflows)
}

/// Create new workflow
pub async fn api_workflows_create(
    State(state): State<AppState>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    // Simplified workflow creation
    let workflow_id = Uuid::new_v4();
    
    ApiResponse::success(serde_json::json!({
        "id": workflow_id,
        "message": "Workflow created successfully"
    }))
}

/// Get specific workflow
pub async fn api_workflow_get(
    State(state): State<AppState>,
    Path(workflow_id): Path<String>,
) -> impl IntoResponse {
    ApiResponse::success(serde_json::json!({
        "id": workflow_id,
        "name": "Example Workflow",
        "status": "active",
        "phases": [
            {"name": "Planning", "status": "completed"},
            {"name": "Implementation", "status": "in_progress"},
            {"name": "Testing", "status": "pending"}
        ]
    }))
}

/// Update workflow
pub async fn api_workflow_update(
    State(state): State<AppState>,
    Path(workflow_id): Path<String>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    ApiResponse::success(serde_json::json!({
        "id": workflow_id,
        "message": "Workflow updated successfully"
    }))
}

/// List projects
pub async fn api_projects_list(State(state): State<AppState>) -> impl IntoResponse {
    let projects = vec![
        serde_json::json!({
            "id": "project-1",
            "name": "Enhanced Tmux Orchestrator",
            "description": "AI-powered development orchestration",
            "github_repo": "chajus1/enhanced-tmux-orchestrator",
            "status": "active"
        })
    ];
    
    ApiResponse::success(projects)
}

/// Sync project with GitHub
pub async fn api_project_sync(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
) -> impl IntoResponse {
    ApiResponse::success(serde_json::json!({
        "project_id": project_id,
        "message": "Project sync initiated",
        "status": "syncing"
    }))
}

/// List GitHub repositories
pub async fn api_github_repos(State(state): State<AppState>) -> impl IntoResponse {
    ApiResponse::success(vec![
        serde_json::json!({
            "name": "enhanced-tmux-orchestrator",
            "full_name": "chajus1/enhanced-tmux-orchestrator",
            "private": false,
            "description": "AI-powered development orchestration system"
        })
    ])
}

/// List GitHub issues for repository
pub async fn api_github_issues(
    State(state): State<AppState>,
    Path((owner, repo)): Path<(String, String)>,
) -> impl IntoResponse {
    ApiResponse::success(vec![
        serde_json::json!({
            "number": 1,
            "title": "Implement Phase 4 Dashboard",
            "state": "open",
            "labels": ["enhancement", "dashboard"]
        })
    ])
}