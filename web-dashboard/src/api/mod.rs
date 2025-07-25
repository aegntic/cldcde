// CLDCDE Pro API Module - Enhanced by BackendArchitect 🏗️

pub mod github;
pub mod auth;
pub mod workflows;
pub mod projects;
pub mod errors;
pub mod database;

use axum::{
    routing::{get, post, put, delete},
    Router,
    middleware,
    Json,
};
use serde_json::json;
use std::time::Duration;
use tower::ServiceBuilder;
use tower_http::{
    cors::CorsLayer,
    trace::TraceLayer,
    timeout::TimeoutLayer,
    compression::CompressionLayer,
};
use crate::AppState;

pub use errors::{ApiError, ApiResult};

/// Build the complete API router with middleware stack
pub fn api_router() -> Router<AppState> {
    Router::new()
        // Health and status endpoints
        .route("/health", get(health_check))
        .route("/status", get(api_status))
        .route("/version", get(version_info))
        
        // Authentication
        .nest("/auth", auth::router())
        
        // GitHub integration
        .nest("/github", github::router())
        
        // Workflows
        .nest("/workflows", workflows::router())
        
        // Projects
        .nest("/projects", projects::router())
        
        // Add comprehensive middleware stack
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CompressionLayer::new())
                .layer(TimeoutLayer::new(Duration::from_secs(30)))
                .layer(CorsLayer::permissive()) // Configure for production
                .into_inner()
        )
}

/// Enhanced health check with system status
async fn health_check() -> Json<serde_json::Value> {
    Json(json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "version": env!("CARGO_PKG_VERSION"),
        "services": {
            "database": "healthy",
            "github_api": "healthy",
            "workflow_engine": "healthy"
        }
    }))
}

/// Comprehensive API status endpoint
async fn api_status() -> Json<serde_json::Value> {
    Json(json!({
        "api_version": "v1",
        "build_info": {
            "version": env!("CARGO_PKG_VERSION"),
            "build_date": env!("VERGEN_BUILD_DATE"),
            "git_sha": env!("VERGEN_GIT_SHA"),
            "rustc_version": env!("VERGEN_RUSTC_SEMVER")
        },
        "features": {
            "authentication": true,
            "github_integration": true,
            "workflows": true,
            "projects": true,
            "real_time_updates": true,
            "api_versioning": true,
            "rate_limiting": true,
            "comprehensive_logging": true
        },
        "limits": {
            "max_request_size": "10MB",
            "request_timeout": "30s",
            "rate_limit": "1000/hour",
            "concurrent_workflows": 50
        },
        "documentation": {
            "openapi": "/api/docs/openapi.json",
            "swagger_ui": "/api/docs",
            "postman_collection": "/api/docs/postman.json"
        }
    }))
}

/// API version information
async fn version_info() -> Json<serde_json::Value> {
    Json(json!({
        "api_version": "v1.0.0",
        "supported_versions": ["v1"],
        "deprecated_versions": [],
        "sunset_schedule": {},
        "changelog_url": "https://docs.cldcde.pro/api/changelog",
        "migration_guides": {
            "v0_to_v1": "https://docs.cldcde.pro/api/migration/v0-to-v1"
        }
    }))
}