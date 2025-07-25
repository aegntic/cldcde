// API Error Handling Module - Enhanced by BackendArchitect 🏗️

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;

/// Comprehensive API error types following RESTful patterns
#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Validation failed: {message}")]
    ValidationError { 
        message: String,
        field_errors: HashMap<String, Vec<String>>,
    },
    
    #[error("Resource not found: {resource_type} with id '{id}'")]
    NotFound { 
        resource_type: String,
        id: String,
    },
    
    #[error("Authentication required")]
    Unauthorized,
    
    #[error("Insufficient permissions: {message}")]
    Forbidden { message: String },
    
    #[error("Conflict: {message}")]
    Conflict { message: String },
    
    #[error("Rate limit exceeded: {message}")]
    RateLimited { 
        message: String,
        retry_after: Option<u64>,
    },
    
    #[error("External service error: {service} - {message}")]
    ExternalService {
        service: String,
        message: String,
        status_code: Option<u16>,
    },
    
    #[error("Database error: {message}")]
    Database { message: String },
    
    #[error("Internal server error: {message}")]
    Internal { message: String },
    
    #[error("Bad request: {message}")]
    BadRequest { message: String },
    
    #[error("Service unavailable: {message}")]
    ServiceUnavailable { message: String },
}

/// Standardized API error response format
#[derive(Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: ErrorDetails,
    pub request_id: String,
    pub timestamp: String,
}

#[derive(Serialize, Deserialize)]
pub struct ErrorDetails {
    pub code: String,
    pub message: String,
    pub details: Option<serde_json::Value>,
    pub field_errors: Option<HashMap<String, Vec<String>>>,
    pub suggestion: Option<String>,
    pub documentation_url: Option<String>,
}

impl ApiError {
    /// Get the HTTP status code for this error
    pub fn status_code(&self) -> StatusCode {
        match self {
            ApiError::ValidationError { .. } => StatusCode::BAD_REQUEST,
            ApiError::NotFound { .. } => StatusCode::NOT_FOUND,
            ApiError::Unauthorized => StatusCode::UNAUTHORIZED,
            ApiError::Forbidden { .. } => StatusCode::FORBIDDEN,
            ApiError::Conflict { .. } => StatusCode::CONFLICT,
            ApiError::RateLimited { .. } => StatusCode::TOO_MANY_REQUESTS,
            ApiError::ExternalService { .. } => StatusCode::BAD_GATEWAY,
            ApiError::Database { .. } => StatusCode::INTERNAL_SERVER_ERROR,
            ApiError::Internal { .. } => StatusCode::INTERNAL_SERVER_ERROR,
            ApiError::BadRequest { .. } => StatusCode::BAD_REQUEST,
            ApiError::ServiceUnavailable { .. } => StatusCode::SERVICE_UNAVAILABLE,
        }
    }
    
    /// Get the error code for this error
    pub fn error_code(&self) -> &'static str {
        match self {
            ApiError::ValidationError { .. } => "VALIDATION_ERROR",
            ApiError::NotFound { .. } => "NOT_FOUND",
            ApiError::Unauthorized => "UNAUTHORIZED",
            ApiError::Forbidden { .. } => "FORBIDDEN",
            ApiError::Conflict { .. } => "CONFLICT",
            ApiError::RateLimited { .. } => "RATE_LIMITED",
            ApiError::ExternalService { .. } => "EXTERNAL_SERVICE_ERROR",
            ApiError::Database { .. } => "DATABASE_ERROR",
            ApiError::Internal { .. } => "INTERNAL_ERROR",
            ApiError::BadRequest { .. } => "BAD_REQUEST",
            ApiError::ServiceUnavailable { .. } => "SERVICE_UNAVAILABLE",
        }
    }
    
    /// Get helpful suggestion for resolving this error
    pub fn suggestion(&self) -> Option<&'static str> {
        match self {
            ApiError::ValidationError { .. } => Some("Check the request payload and ensure all required fields are provided with valid values"),
            ApiError::NotFound { .. } => Some("Verify the resource ID and ensure the resource exists"),
            ApiError::Unauthorized => Some("Include a valid authentication token in the Authorization header"),
            ApiError::Forbidden { .. } => Some("Contact your administrator to request the necessary permissions"),
            ApiError::Conflict { .. } => Some("Refresh the resource and retry with updated data"),
            ApiError::RateLimited { .. } => Some("Wait before making another request or contact support to increase your rate limit"),
            ApiError::ExternalService { .. } => Some("Try again in a few moments, or check the status of the external service"),
            _ => None,
        }
    }
    
    /// Get documentation URL for this error type
    pub fn documentation_url(&self) -> Option<String> {
        let base_url = "https://docs.cldcde.pro/api/errors";
        match self {
            ApiError::ValidationError { .. } => Some(format!("{}/validation", base_url)),
            ApiError::NotFound { .. } => Some(format!("{}/not-found", base_url)),
            ApiError::Unauthorized => Some(format!("{}/authentication", base_url)),
            ApiError::Forbidden { .. } => Some(format!("{}/authorization", base_url)),
            ApiError::RateLimited { .. } => Some(format!("{}/rate-limits", base_url)),
            _ => None,
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let request_id = uuid::Uuid::new_v4().to_string();
        let timestamp = chrono::Utc::now().to_rfc3339();
        
        let field_errors = match &self {
            ApiError::ValidationError { field_errors, .. } => Some(field_errors.clone()),
            _ => None,
        };
        
        let details = match &self {
            ApiError::ExternalService { service, status_code, .. } => {
                Some(serde_json::json!({
                    "service": service,
                    "external_status_code": status_code
                }))
            },
            ApiError::RateLimited { retry_after, .. } => {
                Some(serde_json::json!({
                    "retry_after_seconds": retry_after
                }))
            },
            _ => None,
        };
        
        let error_response = ErrorResponse {
            error: ErrorDetails {
                code: self.error_code().to_string(),
                message: self.to_string(),
                details,
                field_errors,
                suggestion: self.suggestion().map(|s| s.to_string()),
                documentation_url: self.documentation_url(),
            },
            request_id,
            timestamp,
        };
        
        // Log the error for internal monitoring
        tracing::error!(
            error = %self,
            request_id = %error_response.request_id,
            error_code = %error_response.error.code,
            "API error occurred"
        );
        
        let mut response = (self.status_code(), Json(error_response)).into_response();
        
        // Add rate limit headers if applicable
        if let ApiError::RateLimited { retry_after: Some(seconds), .. } = self {
            response.headers_mut().insert(
                "Retry-After",
                seconds.to_string().parse().unwrap(),
            );
        }
        
        response
    }
}

/// Helper type alias for API results
pub type ApiResult<T> = Result<T, ApiError>;

/// Validation helper functions
pub mod validation {
    use super::*;
    use std::collections::HashMap;
    
    pub struct FieldValidator {
        field_name: String,
        errors: Vec<String>,
    }
    
    impl FieldValidator {
        pub fn new(field_name: impl Into<String>) -> Self {
            Self {
                field_name: field_name.into(),
                errors: Vec::new(),
            }
        }
        
        pub fn required<T>(mut self, value: &Option<T>) -> Self {
            if value.is_none() {
                self.errors.push("This field is required".to_string());
            }
            self
        }
        
        pub fn min_length(mut self, value: &str, min: usize) -> Self {
            if value.len() < min {
                self.errors.push(format!("Must be at least {} characters long", min));
            }
            self
        }
        
        pub fn max_length(mut self, value: &str, max: usize) -> Self {
            if value.len() > max {
                self.errors.push(format!("Must be no more than {} characters long", max));
            }
            self
        }
        
        pub fn email(mut self, value: &str) -> Self {
            if !value.contains('@') || !value.contains('.') {
                self.errors.push("Must be a valid email address".to_string());
            }
            self
        }
        
        pub fn range<T: PartialOrd>(mut self, value: &T, min: T, max: T) -> Self {
            if value < &min || value > &max {
                self.errors.push(format!("Must be between {} and {}", 
                    std::any::type_name::<T>(), std::any::type_name::<T>()));
            }
            self
        }
        
        pub fn finish(self) -> (String, Vec<String>) {
            (self.field_name, self.errors)
        }
    }
    
    pub struct ValidationBuilder {
        field_errors: HashMap<String, Vec<String>>,
    }
    
    impl ValidationBuilder {
        pub fn new() -> Self {
            Self {
                field_errors: HashMap::new(),
            }
        }
        
        pub fn field(&mut self, field_name: impl Into<String>) -> FieldValidator {
            FieldValidator::new(field_name)
        }
        
        pub fn add_field_validation(&mut self, field: FieldValidator) {
            let (field_name, errors) = field.finish();
            if !errors.is_empty() {
                self.field_errors.insert(field_name, errors);
            }
        }
        
        pub fn finish(self) -> Result<(), ApiError> {
            if self.field_errors.is_empty() {
                Ok(())
            } else {
                Err(ApiError::ValidationError {
                    message: "Validation failed".to_string(),
                    field_errors: self.field_errors,
                })
            }
        }
    }
}

/// Common validation patterns
pub mod validators {
    use super::*;
    
    pub fn validate_id(id: &str, resource_type: &str) -> ApiResult<()> {
        if id.is_empty() {
            return Err(ApiError::ValidationError {
                message: format!("{} ID cannot be empty", resource_type),
                field_errors: HashMap::from([
                    ("id".to_string(), vec!["ID is required".to_string()])
                ]),
            });
        }
        
        if uuid::Uuid::parse_str(id).is_err() {
            return Err(ApiError::ValidationError {
                message: format!("Invalid {} ID format", resource_type),
                field_errors: HashMap::from([
                    ("id".to_string(), vec!["Must be a valid UUID".to_string()])
                ]),
            });
        }
        
        Ok(())
    }
    
    pub fn validate_pagination(limit: Option<u32>, offset: Option<u32>) -> ApiResult<(u32, u32)> {
        let limit = limit.unwrap_or(50);
        let offset = offset.unwrap_or(0);
        
        if limit > 1000 {
            return Err(ApiError::ValidationError {
                message: "Limit too large".to_string(),
                field_errors: HashMap::from([
                    ("limit".to_string(), vec!["Maximum limit is 1000".to_string()])
                ]),
            });
        }
        
        Ok((limit, offset))
    }
}

/// Error conversion implementations
impl From<sqlx::Error> for ApiError {
    fn from(err: sqlx::Error) -> Self {
        match err {
            sqlx::Error::RowNotFound => ApiError::NotFound {
                resource_type: "Resource".to_string(),
                id: "unknown".to_string(),
            },
            _ => ApiError::Database {
                message: err.to_string(),
            },
        }
    }
}

impl From<serde_json::Error> for ApiError {
    fn from(err: serde_json::Error) -> Self {
        ApiError::BadRequest {
            message: format!("Invalid JSON: {}", err),
        }
    }
}

impl From<uuid::Error> for ApiError {
    fn from(err: uuid::Error) -> Self {
        ApiError::ValidationError {
            message: "Invalid UUID format".to_string(),
            field_errors: HashMap::from([
                ("id".to_string(), vec![err.to_string()])
            ]),
        }
    }
}