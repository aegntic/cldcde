// Activity Handler - CLDCDE Pro API
// By SystemArchitect - Production Ready

use axum::{
    extract::{Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::{AppState, AppResult, AppError};

#[derive(Debug, Serialize)]
pub struct ActivityResponse {
    pub id: i64,
    pub user_id: i64,
    pub action: String,
    pub entity_type: String,
    pub entity_id: Option<i64>,
    pub details: Option<String>,
    pub created_at: String,
    pub user: Option<UserInfo>,
}

#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: i64,
    pub username: String,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ActivityStatsResponse {
    pub total_activities: i64,
    pub activities_today: i64,
    pub activities_this_week: i64,
    pub activities_this_month: i64,
    pub most_active_users: Vec<UserActivityStat>,
}#[derive(Debug, Serialize)]
pub struct UserActivityStat {
    pub user_id: i64,
    pub username: String,
    pub avatar_url: Option<String>,
    pub activity_count: i64,
}

#[derive(Debug, Deserialize)]
pub struct ActivityQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub entity_type: Option<String>,
    pub action: Option<String>,
    pub user_id: Option<i64>,
}

// GET /api/v1/activity
pub async fn list_activities(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ActivityQuery>,
    user: crate::auth::CurrentUser,
) -> AppResult<Json<Vec<ActivityResponse>>> {
    let limit = params.limit.unwrap_or(50).min(100);
    let offset = params.offset.unwrap_or(0);

    let mut query_builder = sqlx::QueryBuilder::new(
        r#"
        SELECT a.id, a.user_id, a.action, a.entity_type, a.entity_id, a.details,
               datetime(a.created_at) as created_at_str,
               u.id as user_id_2, u.username, u.avatar_url
        FROM activities a
        JOIN users u ON a.user_id = u.id
        WHERE 1=1
        "#
    );    // Add filters
    if let Some(entity_type) = &params.entity_type {
        query_builder.push(" AND a.entity_type = ");
        query_builder.push_bind(entity_type);
    }

    if let Some(action) = &params.action {
        query_builder.push(" AND a.action = ");
        query_builder.push_bind(action);
    }

    if let Some(user_id) = &params.user_id {
        query_builder.push(" AND a.user_id = ");
        query_builder.push_bind(user_id);
    }

    query_builder.push(" ORDER BY a.created_at DESC LIMIT ");
    query_builder.push_bind(limit);
    query_builder.push(" OFFSET ");
    query_builder.push_bind(offset);

    let activities = query_builder
        .build()
        .fetch_all(&state.db.pool)
        .await
        .map_err(|e| AppError::Internal(e.into()))?;

    let mut responses = Vec::new();
    for row in activities {
        let id: i64 = row.get("id");
        let user_id: i64 = row.get("user_id");
        let action: String = row.get("action");        let entity_type: String = row.get("entity_type");
        let entity_id: Option<i64> = row.get("entity_id");
        let details: Option<String> = row.get("details");
        let created_at_str: String = row.get("created_at_str");
        let user_id_2: i64 = row.get("user_id_2");
        let username: String = row.get("username");
        let avatar_url: Option<String> = row.get("avatar_url");

        responses.push(ActivityResponse {
            id,
            user_id,
            action,
            entity_type,
            entity_id,
            details,
            created_at: created_at_str,
            user: Some(UserInfo {
                id: user_id_2,
                username,
                avatar_url,
            }),
        });
    }

    Ok(Json(responses))
}

// GET /api/v1/activity/stats
pub async fn get_activity_stats(
    State(state): State<Arc<AppState>>,
    user: crate::auth::CurrentUser,
) -> AppResult<Json<ActivityStatsResponse>> {    // Total activities
    let total_activities = sqlx::query!(
        "SELECT COUNT(*) as count FROM activities"
    )
    .fetch_one(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?
    .count;

    // Activities today
    let activities_today = sqlx::query!(
        r#"
        SELECT COUNT(*) as count 
        FROM activities 
        WHERE DATE(created_at) = DATE('now')
        "#
    )
    .fetch_one(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?
    .count;

    // Activities this week
    let activities_this_week = sqlx::query!(
        r#"
        SELECT COUNT(*) as count 
        FROM activities 
        WHERE created_at >= DATE('now', '-7 days')
        "#
    )
    .fetch_one(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?
    .count;    // Activities this month
    let activities_this_month = sqlx::query!(
        r#"
        SELECT COUNT(*) as count 
        FROM activities 
        WHERE created_at >= DATE('now', 'start of month')
        "#
    )
    .fetch_one(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?
    .count;

    // Most active users
    let most_active = sqlx::query!(
        r#"
        SELECT a.user_id, u.username, u.avatar_url, COUNT(*) as activity_count
        FROM activities a
        JOIN users u ON a.user_id = u.id
        WHERE a.created_at >= DATE('now', '-30 days')
        GROUP BY a.user_id, u.username, u.avatar_url
        ORDER BY activity_count DESC
        LIMIT 10
        "#
    )
    .fetch_all(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    let most_active_users: Vec<UserActivityStat> = most_active.into_iter().map(|row| {
        UserActivityStat {
            user_id: row.user_id,
            username: row.username,
            avatar_url: row.avatar_url,
            activity_count: row.activity_count,
        }
    }).collect();    Ok(Json(ActivityStatsResponse {
        total_activities,
        activities_today,
        activities_this_week,
        activities_this_month,
        most_active_users,
    }))
}

// Helper function to log activity
pub async fn log_activity(
    db: &sqlx::Pool<sqlx::Sqlite>,
    user_id: i64,
    action: &str,
    entity_type: &str,
    entity_id: Option<i64>,
    details: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        INSERT INTO activities (user_id, action, entity_type, entity_id, details)
        VALUES (?1, ?2, ?3, ?4, ?5)
        "#,
        user_id,
        action,
        entity_type,
        entity_id,
        details
    )
    .execute(db)
    .await?;

    Ok(())
}