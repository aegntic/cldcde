// Authentication handlers for CLDCDE Pro API
// By SecurityMaster

use crate::{
    auth::{AuthService, User},
    error::{AppError, AppResult},
    AppState,
};
use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Redirect},
    Json,
};
use axum_extra::extract::cookie::{Cookie, CookieJar};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Deserialize)]
pub struct GitHubCallback {
    code: String,
    state: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub user: UserInfo,
    pub token: String,
}

#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: i64,
    pub username: String,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
}

// Initiate GitHub OAuth login
pub async fn github_login(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let auth_url = state.auth.get_github_auth_url();
    Redirect::temporary(&auth_url)
}

// Handle GitHub OAuth callback
pub async fn github_callback(
    State(state): State<Arc<AppState>>,
    jar: CookieJar,
    Query(params): Query<GitHubCallback>,
) -> AppResult<(CookieJar, Json<AuthResponse>)> {
    // Exchange code for access token
    let access_token = state.auth.exchange_github_code(&params.code).await?;
    
    // Get user info from GitHub
    let (github_id, username, email, avatar_url) = state.auth.get_github_user(&access_token).await?;
    
    // Upsert user in database
    let user = state.auth.upsert_github_user(
        github_id,
        &username,
        email.as_deref(),
        avatar_url.as_deref(),
        &access_token,
    ).await?;
    
    // Generate JWT
    let jwt = state.auth.generate_jwt(user.id)?;
    
    // Set auth cookie
    let cookie = Cookie::build("auth_token", &jwt)
        .path("/")
        .http_only(true)
        .secure(false) // Set to true in production with HTTPS
        .same_site(axum_extra::extract::cookie::SameSite::Lax)
        .finish();
    
    let response = AuthResponse {
        user: UserInfo {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar_url: user.avatar_url,
        },
        token: jwt,
    };
    
    Ok((jar.add(cookie), Json(response)))
}

// Get current user info
pub async fn me(
    State(state): State<Arc<AppState>>,
    jar: CookieJar,
) -> AppResult<Json<UserInfo>> {
    // Extract user from request extensions (set by auth middleware)
    // For now, return a placeholder since auth middleware will handle this
    Err(AppError::Unauthorized)
}

// Logout
pub async fn logout(jar: CookieJar) -> AppResult<(CookieJar, Json<serde_json::Value>)> {
    // Remove auth cookie
    let jar = jar.remove(Cookie::named("auth_token"));
    
    Ok((jar, Json(serde_json::json!({"message": "Logged out successfully"}))))
}