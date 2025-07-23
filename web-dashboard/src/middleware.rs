use axum::{
    extract::{Request, State},
    http::{header::AUTHORIZATION, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response, Redirect},
};
use crate::{AppState, Claims};

/// Authentication middleware for protected routes
pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, Response> {
    let path = request.uri().path();
    
    // Skip authentication for public routes
    if is_public_route(path) {
        return Ok(next.run(request).await);
    }

    // Check for authorization header
    let auth_header = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
        .and_then(|header| {
            if header.starts_with("Bearer ") {
                Some(&header[7..])
            } else {
                None
            }
        });

    // Check for session cookie as fallback
    let token = auth_header.or_else(|| {
        request
            .headers()
            .get("cookie")
            .and_then(|header| header.to_str().ok())
            .and_then(|cookies| {
                cookies
                    .split(';')
                    .find_map(|cookie| {
                        let cookie = cookie.trim();
                        if cookie.starts_with("session_token=") {
                            Some(&cookie[14..])
                        } else {
                            None
                        }
                    })
            })
    });

    if let Some(token) = token {
        match state.auth_manager.validate_token(token) {
            Ok(claims) => {
                // Add user info to request extensions
                request.extensions_mut().insert(claims);
                Ok(next.run(request).await)
            }
            Err(_) => {
                // Invalid token, redirect to login for web requests
                if is_web_route(path) {
                    Err(Redirect::to("/login").into_response())
                } else {
                    Err((StatusCode::UNAUTHORIZED, "Invalid token").into_response())
                }
            }
        }
    } else {
        // No token provided
        if is_web_route(path) {
            Err(Redirect::to("/login").into_response())
        } else {
            Err((StatusCode::UNAUTHORIZED, "Authentication required").into_response())
        }
    }
}

/// Check if the route is public (doesn't require authentication)
fn is_public_route(path: &str) -> bool {
    const PUBLIC_ROUTES: &[&str] = &[
        "/",
        "/login",
        "/auth/github",
        "/auth/github/callback",
        "/static",
        "/api/status",
    ];

    PUBLIC_ROUTES.iter().any(|&route| {
        path == route || path.starts_with(&format!("{}/", route))
    })
}

/// Check if the route is a web route (returns HTML)
fn is_web_route(path: &str) -> bool {
    !path.starts_with("/api/") && !path.starts_with("/ws")
}

/// Permission checking middleware
pub async fn require_permission(
    permission: &'static str,
) -> impl Fn(State<AppState>, Request, Next) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, Response>> + Send>> + Clone {
    move |State(state): State<AppState>, request: Request, next: Next| {
        Box::pin(async move {
            if let Some(claims) = request.extensions().get::<Claims>() {
                let user_id = claims.sub.parse::<uuid::Uuid>()
                    .map_err(|_| (StatusCode::UNAUTHORIZED, "Invalid user ID").into_response())?;

                if state.auth_manager.has_permission(user_id, permission).await {
                    Ok(next.run(request).await)
                } else {
                    Err((StatusCode::FORBIDDEN, "Insufficient permissions").into_response())
                }
            } else {
                Err((StatusCode::UNAUTHORIZED, "Authentication required").into_response())
            }
        })
    }
}

/// Extract user claims from request
pub fn get_user_claims(request: &Request) -> Option<&Claims> {
    request.extensions().get::<Claims>()
}

/// CORS middleware for API routes
pub async fn cors_middleware(
    request: Request,
    next: Next,
) -> Result<Response, Response> {
    let mut response = next.run(request).await;
    
    let headers = response.headers_mut();
    headers.insert("Access-Control-Allow-Origin", "*".parse().unwrap());
    headers.insert("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS".parse().unwrap());
    headers.insert("Access-Control-Allow-Headers", "Content-Type, Authorization".parse().unwrap());
    
    Ok(response)
}

/// Rate limiting middleware (basic implementation)
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::time::{Duration, Instant};

#[derive(Clone)]
pub struct RateLimiter {
    requests: Arc<RwLock<HashMap<String, Vec<Instant>>>>,
    max_requests: usize,
    window: Duration,
}

impl RateLimiter {
    pub fn new(max_requests: usize, window: Duration) -> Self {
        Self {
            requests: Arc::new(RwLock::new(HashMap::new())),
            max_requests,
            window,
        }
    }

    pub async fn check_rate_limit(&self, key: &str) -> bool {
        let mut requests = self.requests.write().await;
        let now = Instant::now();
        
        let user_requests = requests.entry(key.to_string()).or_insert_with(Vec::new);
        
        // Remove old requests outside the window
        user_requests.retain(|&request_time| now.duration_since(request_time) < self.window);
        
        if user_requests.len() >= self.max_requests {
            false
        } else {
            user_requests.push(now);
            true
        }
    }
}

pub async fn rate_limit_middleware(
    State(rate_limiter): State<RateLimiter>,
    request: Request,
    next: Next,
) -> Result<Response, Response> {
    let client_ip = request
        .headers()
        .get("x-forwarded-for")
        .or_else(|| request.headers().get("x-real-ip"))
        .and_then(|header| header.to_str().ok())
        .unwrap_or("unknown");

    if rate_limiter.check_rate_limit(client_ip).await {
        Ok(next.run(request).await)
    } else {
        Err((
            StatusCode::TOO_MANY_REQUESTS,
            "Rate limit exceeded. Please try again later."
        ).into_response())
    }
}