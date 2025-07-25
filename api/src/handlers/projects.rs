// Projects Handler - CLDCDE Pro API
// By ProjectAlchemist - Production Ready

use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::{AppState, AppResult, AppError};

#[derive(Debug, Serialize)]
pub struct ProjectResponse {
    pub id: i64,
    pub uuid: String,
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub visibility: String,
    pub created_by_user_id: i64,
    pub created_at: String,
    pub updated_at: String,
    pub members: Option<Vec<ProjectMember>>,
    pub workflows: Option<Vec<WorkflowSummary>>,
}

#[derive(Debug, Serialize)]
pub struct ProjectMember {
    pub user_id: i64,
    pub role: String,
    pub joined_at: String,
    pub user: Option<UserInfo>,
}#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: i64,
    pub username: String,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct WorkflowSummary {
    pub id: i64,
    pub uuid: String,
    pub name: String,
    pub status: String,
    pub progress: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: Option<String>,
    pub visibility: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProjectRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub visibility: Option<String>,
    pub status: Option<String>,
}#[derive(Debug, Deserialize)]
pub struct AddProjectMemberRequest {
    pub user_id: i64,
    pub role: String,
}

// GET /api/v1/projects
pub async fn list_projects(
    State(state): State<Arc<AppState>>,
    user: crate::auth::CurrentUser,
) -> AppResult<Json<Vec<ProjectResponse>>> {
    let projects = sqlx::query!(
        r#"
        SELECT p.*,
               datetime(p.created_at) as created_at_str,
               datetime(p.updated_at) as updated_at_str
        FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.visibility = 'public' 
           OR p.created_by_user_id = ?1
           OR pm.user_id = ?1
        GROUP BY p.id
        ORDER BY p.updated_at DESC
        "#,
        user.id
    )
    .fetch_all(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;    let mut responses = Vec::new();
    for project in projects {
        // Get members
        let members = sqlx::query!(
            r#"
            SELECT pm.user_id, pm.role,
                   datetime(pm.joined_at) as "joined_at!",
                   u.id as user_id_2, u.username, u.avatar_url
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = ?1
            "#,
            project.id
        )
        .fetch_all(&state.db.pool)
        .await
        .map_err(|e| AppError::Internal(e.into()))?;

        let project_members: Vec<ProjectMember> = members.into_iter().map(|m| {
            ProjectMember {
                user_id: m.user_id,
                role: m.role,
                joined_at: m.joined_at,
                user: Some(UserInfo {
                    id: m.user_id_2,
                    username: m.username,
                    avatar_url: m.avatar_url,
                }),
            }
        }).collect();        responses.push(ProjectResponse {
            id: project.id,
            uuid: project.uuid,
            name: project.name,
            description: project.description,
            status: project.status,
            visibility: project.visibility,
            created_by_user_id: project.created_by_user_id,
            created_at: project.created_at_str.unwrap_or_default(),
            updated_at: project.updated_at_str.unwrap_or_default(),
            members: Some(project_members),
            workflows: None,
        });
    }

    Ok(Json(responses))
}

// POST /api/v1/projects
pub async fn create_project(
    State(state): State<Arc<AppState>>,
    user: crate::auth::CurrentUser,
    Json(payload): Json<CreateProjectRequest>,
) -> AppResult<Json<ProjectResponse>> {
    let uuid = Uuid::new_v4().to_string();
    let visibility = payload.visibility.unwrap_or_else(|| "private".to_string());

    // Start transaction
    let mut tx = state.db.pool.begin().await
        .map_err(|e| AppError::Internal(e.into()))?;    // Create project
    let project_id = sqlx::query!(
        r#"
        INSERT INTO projects (uuid, name, description, status, visibility, created_by_user_id)
        VALUES (?1, ?2, ?3, 'active', ?4, ?5)
        "#,
        uuid,
        payload.name,
        payload.description,
        visibility,
        user.id
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| AppError::Internal(e.into()))?
    .last_insert_rowid();

    // Add creator as owner
    sqlx::query!(
        r#"
        INSERT INTO project_members (project_id, user_id, role)
        VALUES (?1, ?2, 'owner')
        "#,
        project_id,
        user.id
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;    // Commit transaction
    tx.commit().await
        .map_err(|e| AppError::Internal(e.into()))?;

    // Fetch created project
    let project = sqlx::query!(
        r#"
        SELECT *,
               datetime(created_at) as created_at_str,
               datetime(updated_at) as updated_at_str
        FROM projects
        WHERE id = ?1
        "#,
        project_id
    )
    .fetch_one(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    Ok(Json(ProjectResponse {
        id: project.id,
        uuid: project.uuid,
        name: project.name,
        description: project.description,
        status: project.status,
        visibility: project.visibility,
        created_by_user_id: project.created_by_user_id,
        created_at: project.created_at_str.unwrap_or_default(),
        updated_at: project.updated_at_str.unwrap_or_default(),
        members: Some(vec![ProjectMember {            user_id: user.id,
            role: "owner".to_string(),
            joined_at: project.created_at_str.clone().unwrap_or_default(),
            user: Some(UserInfo {
                id: user.id,
                username: user.username.clone(),
                avatar_url: user.avatar_url.clone(),
            }),
        }]),
        workflows: None,
    }))
}

// GET /api/v1/projects/:id
pub async fn get_project(
    State(state): State<Arc<AppState>>,
    Path(project_id): Path<i64>,
    user: crate::auth::CurrentUser,
) -> AppResult<Json<ProjectResponse>> {
    // Check access
    let access = sqlx::query!(
        r#"
        SELECT 1 as has_access
        FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.id = ?1 
          AND (p.visibility = 'public' 
               OR p.created_by_user_id = ?2
               OR pm.user_id = ?2)
        "#,        project_id,
        user.id
    )
    .fetch_optional(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    if access.is_none() {
        return Err(AppError::NotFound);
    }

    // Fetch project
    let project = sqlx::query!(
        r#"
        SELECT *,
               datetime(created_at) as created_at_str,
               datetime(updated_at) as updated_at_str
        FROM projects
        WHERE id = ?1
        "#,
        project_id
    )
    .fetch_one(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    // Get members
    let members = sqlx::query!(
        r#"
        SELECT pm.user_id, pm.role,               datetime(pm.joined_at) as "joined_at!",
               u.id as user_id_2, u.username, u.avatar_url
        FROM project_members pm
        JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = ?1
        "#,
        project_id
    )
    .fetch_all(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    let project_members: Vec<ProjectMember> = members.into_iter().map(|m| {
        ProjectMember {
            user_id: m.user_id,
            role: m.role,
            joined_at: m.joined_at,
            user: Some(UserInfo {
                id: m.user_id_2,
                username: m.username,
                avatar_url: m.avatar_url,
            }),
        }
    }).collect();

    // Get workflows
    let workflows = sqlx::query!(
        r#"
        SELECT id, uuid, name, status, progress
        FROM workflows        WHERE project_id = ?1
        ORDER BY created_at DESC
        "#,
        project_id
    )
    .fetch_all(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    let workflow_summaries: Vec<WorkflowSummary> = workflows.into_iter().map(|w| {
        WorkflowSummary {
            id: w.id,
            uuid: w.uuid,
            name: w.name,
            status: w.status,
            progress: w.progress,
        }
    }).collect();

    Ok(Json(ProjectResponse {
        id: project.id,
        uuid: project.uuid,
        name: project.name,
        description: project.description,
        status: project.status,
        visibility: project.visibility,
        created_by_user_id: project.created_by_user_id,
        created_at: project.created_at_str.unwrap_or_default(),
        updated_at: project.updated_at_str.unwrap_or_default(),
        members: Some(project_members),
        workflows: Some(workflow_summaries),    }))
}

// PUT /api/v1/projects/:id
pub async fn update_project(
    State(state): State<Arc<AppState>>,
    Path(project_id): Path<i64>,
    user: crate::auth::CurrentUser,
    Json(payload): Json<UpdateProjectRequest>,
) -> AppResult<Json<ProjectResponse>> {
    // Check if user is owner or admin
    let member = sqlx::query!(
        r#"
        SELECT role
        FROM project_members
        WHERE project_id = ?1 AND user_id = ?2
        "#,
        project_id,
        user.id
    )
    .fetch_optional(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    if member.is_none() || (member.as_ref().unwrap().role != "owner" && member.as_ref().unwrap().role != "admin") {
        return Err(AppError::Forbidden);
    }

    // Update project
    sqlx::query!(        r#"
        UPDATE projects
        SET name = COALESCE(?1, name),
            description = COALESCE(?2, description),
            visibility = COALESCE(?3, visibility),
            status = COALESCE(?4, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?5
        "#,
        payload.name,
        payload.description,
        payload.visibility,
        payload.status,
        project_id
    )
    .execute(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    // Return updated project
    get_project(State(state), Path(project_id), user).await
}

// GET /api/v1/projects/:id/members
pub async fn list_project_members(
    State(state): State<Arc<AppState>>,
    Path(project_id): Path<i64>,
    user: crate::auth::CurrentUser,
) -> AppResult<Json<Vec<ProjectMember>>> {    // Check access
    let access = sqlx::query!(
        r#"
        SELECT 1 as has_access
        FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.id = ?1 
          AND (p.visibility = 'public' 
               OR p.created_by_user_id = ?2
               OR pm.user_id = ?2)
        "#,
        project_id,
        user.id
    )
    .fetch_optional(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    if access.is_none() {
        return Err(AppError::NotFound);
    }

    // Get members
    let members = sqlx::query!(
        r#"
        SELECT pm.user_id, pm.role,
               datetime(pm.joined_at) as "joined_at!",
               u.id as user_id_2, u.username, u.avatar_url
        FROM project_members pm
        JOIN users u ON pm.user_id = u.id        WHERE pm.project_id = ?1
        ORDER BY pm.joined_at ASC
        "#,
        project_id
    )
    .fetch_all(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    let project_members: Vec<ProjectMember> = members.into_iter().map(|m| {
        ProjectMember {
            user_id: m.user_id,
            role: m.role,
            joined_at: m.joined_at,
            user: Some(UserInfo {
                id: m.user_id_2,
                username: m.username,
                avatar_url: m.avatar_url,
            }),
        }
    }).collect();

    Ok(Json(project_members))
}

// POST /api/v1/projects/:id/members
pub async fn add_project_member(
    State(state): State<Arc<AppState>>,
    Path(project_id): Path<i64>,
    user: crate::auth::CurrentUser,    Json(payload): Json<AddProjectMemberRequest>,
) -> AppResult<Json<serde_json::Value>> {
    // Check if user is owner or admin
    let member = sqlx::query!(
        r#"
        SELECT role
        FROM project_members
        WHERE project_id = ?1 AND user_id = ?2
        "#,
        project_id,
        user.id
    )
    .fetch_optional(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    if member.is_none() || (member.as_ref().unwrap().role != "owner" && member.as_ref().unwrap().role != "admin") {
        return Err(AppError::Forbidden);
    }

    // Check if target user exists
    let target_user = sqlx::query!(
        "SELECT id FROM users WHERE id = ?1",
        payload.user_id
    )
    .fetch_optional(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    if target_user.is_none() {
        return Err(AppError::BadRequest("User not found".to_string()));
    }    // Check if user is already a member
    let existing = sqlx::query!(
        "SELECT 1 FROM project_members WHERE project_id = ?1 AND user_id = ?2",
        project_id,
        payload.user_id
    )
    .fetch_optional(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    if existing.is_some() {
        return Err(AppError::BadRequest("User is already a member".to_string()));
    }

    // Add member
    sqlx::query!(
        r#"
        INSERT INTO project_members (project_id, user_id, role)
        VALUES (?1, ?2, ?3)
        "#,
        project_id,
        payload.user_id,
        payload.role
    )
    .execute(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Member added successfully"
    })))
}