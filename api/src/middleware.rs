// Middleware for CLDCDE Pro API
// By SecurityMaster

use crate::{auth::AuthService, error::AppError, AppState};
use axum::{
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};
use axum_extra::extract::cookie::CookieJar;
use dashmap::DashMap;
use std::{
    net::SocketAddr,
    sync::{Arc, LazyLock},
    time::{Duration, Instant},
};

// Rate limiting storage
static RATE_LIMITER: LazyLock<DashMap<String, (Instant, u32)>> = LazyLock::new(DashMap::new);

pub async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    jar: CookieJar,
    headers: HeaderMap,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    // Try to get token from Authorization header
    let token = headers
        .get("authorization")
        .and_then(|header| header.to_str().ok())
        .and_then(|header| header.strip_prefix("Bearer "))
        .or_else(|| {
            // Try to get token from cookie
            jar.get("auth_token").map(|cookie| cookie.value())
        });

    let token = token.ok_or(AppError::Unauthorized)?;

    // Verify JWT token
    let claims = state.auth.verify_jwt(token)?;
    let user_id: i64 = claims.sub.parse().map_err(|_| AppError::Unauthorized)?;

    // Get user from database to ensure they still exist
    let user = state
        .auth
        .get_user_by_id(user_id)
        .await?
        .ok_or(AppError::Unauthorized)?;

    // Create CurrentUser and insert into request extensions
    let current_user = crate::auth::CurrentUser {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
    };
    request.extensions_mut().insert(current_user);

    // Add user to request extensions
    request.extensions_mut().insert(user);

    Ok(next.run(request).await)
}

pub async fn rate_limit_middleware(
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Get client IP
    let client_ip = request
        .extensions()
        .get::<axum::extract::ConnectInfo<SocketAddr>>()
        .map(|ci| ci.0.ip().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    // Rate limiting: 100 requests per minute per IP
    let now = Instant::now();
    let window = Duration::from_secs(60);
    let limit = 100;

    let mut should_rate_limit = false;

    RATE_LIMITER.entry(client_ip.clone()).and_modify(|(last_reset, count)| {
        if now.duration_since(*last_reset) > window {
            // Reset window
            *last_reset = now;
            *count = 1;
        } else {
            *count += 1;
            if *count > limit {
                should_rate_limit = true;
            }
        }
    }).or_insert((now, 1));

    if should_rate_limit {
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }

    // Clean up old entries periodically
    if RATE_LIMITER.len() > 10000 {
        RATE_LIMITER.retain(|_, (last_reset, _)| {
            now.duration_since(*last_reset) <= window * 2
        });
    }

    Ok(next.run(request).await)
}