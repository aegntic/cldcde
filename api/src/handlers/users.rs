// Users Handler - CLDCDE Pro API
// By SystemArchitect - Production Ready

use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::{AppState, AppResult, AppError};

#[derive(Debug, Deserialize)]
pub struct ListUsersQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: i64,
    pub username: String,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
    pub created_at: String,
}

// GET /api/v1/users
pub async fn list_users(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ListUsersQuery>,
) -> AppResult<Json<Vec<UserResponse>>> {    let page = params.page.unwrap_or(1);
    let per_page = params.per_page.unwrap_or(20).min(100);
    let offset = ((page - 1) * per_page) as i64;

    let users = sqlx::query_as!(
        UserResponse,
        r#"
        SELECT id, username, email, avatar_url,
               datetime(created_at) as "created_at!"
        FROM users
        ORDER BY created_at DESC
        LIMIT ?1 OFFSET ?2
        "#,
        per_page as i64,
        offset
    )
    .fetch_all(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    Ok(Json(users))
}

// GET /api/v1/users/:id
pub async fn get_user(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
) -> AppResult<Json<UserResponse>> {    let user = sqlx::query_as!(
        UserResponse,
        r#"
        SELECT id, username, email, avatar_url,
               datetime(created_at) as "created_at!"
        FROM users
        WHERE id = ?1
        "#,
        id
    )
    .fetch_optional(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?
    .ok_or(AppError::NotFound)?;

    Ok(Json(user))
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    pub email: Option<String>,
    pub avatar_url: Option<String>,
}

// PUT /api/v1/users/:id
pub async fn update_user(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
    Json(payload): Json<UpdateUserRequest>,
) -> AppResult<Json<UserResponse>> {    // Update user in database
    sqlx::query!(
        r#"
        UPDATE users
        SET email = COALESCE(?1, email),
            avatar_url = COALESCE(?2, avatar_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?3
        "#,
        payload.email,
        payload.avatar_url,
        id
    )
    .execute(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    // Fetch updated user
    get_user(State(state), Path(id)).await
}