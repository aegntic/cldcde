// CLDCDE Pro API Server - Production Ready
// By SystemArchitect

use anyhow::Result;
use axum::{
    extract::{Extension, Path, Query, State},
    http::{header, Method, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post, put, delete},
    Json, Router,
};
use axum_extra::extract::cookie::{Cookie, CookieJar};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::{net::SocketAddr, sync::Arc, time::Duration};
use tower::ServiceBuilder;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
    timeout::TimeoutLayer,
};
use tracing::{info, error};

mod auth;
mod database;
mod error;
mod handlers;
mod middleware;
mod websocket;

use crate::{
    auth::AuthService,
    database::Database,
    error::{AppError, AppResult},
    middleware::{auth_middleware, rate_limit_middleware},
};

#[derive(Clone)]
pub struct AppState {
    pub db: Database,
    pub auth: AuthService,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_target(false)
        .with_thread_ids(true)
        .with_level(true)
        .init();

    // Load environment variables
    dotenvy::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://cldcde:cldcde_dev_password_2025@localhost:5432/cldcde_pro".to_string());
    
    let jwt_secret = std::env::var("JWT_SECRET")
        .expect("JWT_SECRET must be set");
    
    let github_client_id = std::env::var("GITHUB_CLIENT_ID")
        .expect("GITHUB_CLIENT_ID must be set");
    
    let github_client_secret = std::env::var("GITHUB_CLIENT_SECRET")
        .expect("GITHUB_CLIENT_SECRET must be set");
    
    let github_redirect_uri = std::env::var("GITHUB_REDIRECT_URI")
        .unwrap_or_else(|_| "http://localhost:3000/auth/github/callback".to_string());

    // Initialize database
    let db = Database::new(&database_url).await?;
    db.migrate().await?;

    // Initialize auth service
    let auth = AuthService::new(
        db.pool.clone(),
        jwt_secret,
        github_client_id,
        github_client_secret,
        github_redirect_uri,
    );

    // Create app state
    let state = Arc::new(AppState { db: db.clone(), auth });

    // Start background cleanup task
    tokio::spawn(database::start_cleanup_task(db));

    // Build the app
    let app = create_app(state);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    info!("Starting server on {}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service_with_connect_info::<SocketAddr>())
        .await?;

    Ok(())
}

fn create_app(state: Arc<AppState>) -> Router {
    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION])
        .allow_credentials(true);

    // API routes
    let api_routes = Router::new()
        // Auth routes
        .route("/auth/github", get(handlers::auth::github_login))
        .route("/auth/github/callback", get(handlers::auth::github_callback))
        .route("/auth/logout", post(handlers::auth::logout))
        .route("/auth/me", get(handlers::auth::me))
        
        // User routes
        .route("/users", get(handlers::users::list_users))
        .route("/users/:id", get(handlers::users::get_user))
        .route("/users/:id", put(handlers::users::update_user))
        
        // Repository routes
        .route("/repositories", get(handlers::repositories::list_repositories))
        .route("/repositories/sync", post(handlers::repositories::sync_repositories))
        .route("/repositories/:id", get(handlers::repositories::get_repository))
        
        // Workflow routes
        .route("/workflows", get(handlers::workflows::list_workflows))
        .route("/workflows", post(handlers::workflows::create_workflow))
        .route("/workflows/:id", get(handlers::workflows::get_workflow))
        .route("/workflows/:id", put(handlers::workflows::update_workflow))
        .route("/workflows/:id/pause", post(handlers::workflows::pause_workflow))
        .route("/workflows/:id/resume", post(handlers::workflows::resume_workflow))
        
        // Project routes
        .route("/projects", get(handlers::projects::list_projects))
        .route("/projects", post(handlers::projects::create_project))
        .route("/projects/:id", get(handlers::projects::get_project))
        .route("/projects/:id", put(handlers::projects::update_project))
        .route("/projects/:id/members", get(handlers::projects::list_project_members))
        .route("/projects/:id/members", post(handlers::projects::add_project_member))
        
        // Activity routes
        .route("/activity", get(handlers::activity::list_activities))
        .route("/activity/stats", get(handlers::activity::get_activity_stats))
        
        // Apply auth middleware to protected routes
        .layer(middleware::from_fn_with_state(
            state.clone(),
            auth_middleware,
        ))
        .layer(middleware::from_fn(rate_limit_middleware));

    // Public routes (no auth required)
    let public_routes = Router::new()
        .route("/health", get(health_check))
        .route("/metrics", get(metrics));

    // WebSocket route
    let ws_route = Router::new()
        .route("/ws", get(websocket::ws_handler));

    // Combine all routes
    Router::new()
        .nest("/api/v1", api_routes)
        .nest("/", public_routes)
        .nest("/", ws_route)
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(TimeoutLayer::new(Duration::from_secs(30)))
                .layer(cors),
        )
        .with_state(state)
        .fallback(not_found)
}

// Health check endpoint
async fn health_check(State(state): State<Arc<AppState>>) -> AppResult<Json<HealthResponse>> {
    // Check database connection
    state.db.health_check().await?;

    Ok(Json(HealthResponse {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        database: "connected".to_string(),
    }))
}

// Metrics endpoint (Prometheus format)
async fn metrics() -> String {
    // In production, integrate with prometheus crate
    format!(
        "# HELP api_requests_total Total number of API requests\n\
         # TYPE api_requests_total counter\n\
         api_requests_total {{}} 0\n\
         # HELP api_request_duration_seconds API request duration\n\
         # TYPE api_request_duration_seconds histogram\n"
    )
}

// 404 handler
async fn not_found() -> impl IntoResponse {
    (StatusCode::NOT_FOUND, "Not Found")
}

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
    database: String,
}

// Error handling
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized"),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "Forbidden"),
            AppError::NotFound => (StatusCode::NOT_FOUND, "Not found"),
            AppError::BadRequest(ref msg) => (StatusCode::BAD_REQUEST, msg.as_str()),
            AppError::Internal(ref e) => {
                error!("Internal error: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error")
            }
        };

        let body = Json(serde_json::json!({
            "error": message,
            "status": status.as_u16(),
        }));

        (status, body).into_response()
    }
}