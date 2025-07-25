// Error handling for CLDCDE Pro API
// By QualityGuardian

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

pub type AppResult<T> = Result<T, AppError>;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Unauthorized")]
    Unauthorized,

    #[error("Forbidden")]
    Forbidden,

    #[error("Not found")]
    NotFound,

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Internal error: {0}")]
    Internal(#[from] anyhow::Error),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("JWT error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),

    #[error("HTTP client error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("GitHub API error: {0}")]
    GitHub(String),

    #[error("Validation error: {0}")]
    Validation(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized".to_string()),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "Forbidden".to_string()),
            AppError::NotFound => (StatusCode::NOT_FOUND, "Not found".to_string()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Validation(msg) => (StatusCode::BAD_REQUEST, format!("Validation error: {}", msg)),
            AppError::GitHub(msg) => (StatusCode::BAD_GATEWAY, format!("GitHub API error: {}", msg)),
            AppError::Internal(ref e) => {
                tracing::error!("Internal error: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
            }
            AppError::Database(ref e) => {
                tracing::error!("Database error: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Database error".to_string())
            }
            AppError::Jwt(ref e) => {
                tracing::error!("JWT error: {}", e);
                (StatusCode::UNAUTHORIZED, "Invalid token".to_string())
            }
            AppError::Http(ref e) => {
                tracing::error!("HTTP client error: {}", e);
                (StatusCode::BAD_GATEWAY, "External service error".to_string())
            }
        };

        let body = Json(json!({
            "error": message,
            "status": status.as_u16(),
        }));

        (status, body).into_response()
    }
}