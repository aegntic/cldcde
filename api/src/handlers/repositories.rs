// Repositories Handler - CLDCDE Pro API
// By CodeWhisperer - Production Ready

use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::{AppState, AppResult, AppError, auth::get_current_user};

#[derive(Debug, Deserialize)]
pub struct ListReposQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct RepositoryResponse {
    pub id: i64,
    pub github_repo_id: i64,
    pub owner: String,
    pub name: String,
    pub full_name: String,
    pub description: Option<String>,
    pub is_private: bool,
    pub default_branch: String,
    pub language: Option<String>,
    pub stars_count: i32,
    pub forks_count: i32,
    pub open_issues_count: i32,
    pub last_pushed_at: Option<String>,
}// GET /api/v1/repositories
pub async fn list_repositories(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ListReposQuery>,
    user: crate::auth::CurrentUser,
) -> AppResult<Json<Vec<RepositoryResponse>>> {
    let page = params.page.unwrap_or(1);
    let per_page = params.per_page.unwrap_or(30).min(100);
    let offset = ((page - 1) * per_page) as i64;

    let repos = sqlx::query_as!(
        RepositoryResponse,
        r#"
        SELECT id, github_repo_id, owner, name, full_name,
               description, is_private, default_branch,
               language, stars_count, forks_count, 
               open_issues_count,
               datetime(last_pushed_at) as "last_pushed_at"
        FROM repositories
        WHERE user_id = ?1
        ORDER BY stars_count DESC, last_pushed_at DESC
        LIMIT ?2 OFFSET ?3
        "#,
        user.id,
        per_page as i64,
        offset
    )
    .fetch_all(&state.db.pool)
    .await    .map_err(|e| AppError::Internal(e.into()))?;

    Ok(Json(repos))
}

// GET /api/v1/repositories/:id
pub async fn get_repository(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
    user: crate::auth::CurrentUser,
) -> AppResult<Json<RepositoryResponse>> {
    let repo = sqlx::query_as!(
        RepositoryResponse,
        r#"
        SELECT id, github_repo_id, owner, name, full_name,
               description, is_private, default_branch,
               language, stars_count, forks_count, 
               open_issues_count,
               datetime(last_pushed_at) as "last_pushed_at"
        FROM repositories
        WHERE id = ?1 AND user_id = ?2
        "#,
        id,
        user.id
    )
    .fetch_optional(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?
    .ok_or(AppError::NotFound)?;    Ok(Json(repo))
}

// POST /api/v1/repositories/sync
pub async fn sync_repositories(
    State(state): State<Arc<AppState>>,
    user: crate::auth::CurrentUser,
) -> AppResult<Json<serde_json::Value>> {
    // Get user's GitHub token
    let github_token = sqlx::query!(
        "SELECT github_access_token FROM users WHERE id = ?1",
        user.id
    )
    .fetch_one(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?
    .github_access_token
    .ok_or_else(|| AppError::BadRequest("GitHub token not found".to_string()))?;

    // Create GitHub client
    let github_client = crate::github::GitHubClient::new(github_token)?;
    
    // Fetch repositories from GitHub
    let mut all_repos = Vec::new();
    let mut page = 1u32;
    
    loop {
        let repos_page = github_client.list_user_repos(page).await
            .map_err(|e| AppError::Internal(e))?;        if repos_page.items.is_empty() {
            break;
        }
        
        all_repos.extend(repos_page.items);
        
        if repos_page.next.is_none() {
            break;
        }
        page += 1;
    }

    // Update database
    let mut synced_count = 0;
    for repo in all_repos {
        let result = sqlx::query!(
            r#"
            INSERT OR REPLACE INTO repositories (
                github_repo_id, user_id, owner, name, full_name,
                description, is_private, default_branch, language,
                stars_count, forks_count, open_issues_count,
                last_pushed_at, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            "#,
            repo.id.0 as i64,
            user.id,
            repo.owner.map(|o| o.login).unwrap_or_default(),
            repo.name,            repo.full_name.unwrap_or_default(),
            repo.description,
            repo.private.unwrap_or(false),
            repo.default_branch.unwrap_or_else(|| "main".to_string()),
            repo.language,
            repo.stargazers_count.unwrap_or(0) as i32,
            repo.forks_count.unwrap_or(0) as i32,
            repo.open_issues_count.unwrap_or(0) as i32,
            repo.pushed_at
        )
        .execute(&state.db.pool)
        .await;
        
        if result.is_ok() {
            synced_count += 1;
        }
    }

    Ok(Json(serde_json::json!({
        "synced": synced_count,
        "message": format!("Successfully synced {} repositories", synced_count)
    })))
}