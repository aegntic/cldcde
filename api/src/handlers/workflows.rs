// Workflows Handler - CLDCDE Pro API
// By SystemArchitect - Production Ready

use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::{AppState, AppResult, AppError};

#[derive(Debug, Serialize)]
pub struct WorkflowResponse {
    pub id: i64,
    pub uuid: String,
    pub name: String,
    pub description: Option<String>,
    pub r#type: String,
    pub status: String,
    pub phase: String,
    pub progress: i32,
    pub repository_id: Option<i64>,
    pub created_by_user_id: i64,
    pub assigned_to_user_id: Option<i64>,
    pub priority: String,
    pub due_date: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub nodes: Vec<WorkflowNode>,
    pub connections: Vec<WorkflowConnection>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowNode {
    pub id: String,
    pub label: String,
    pub r#type: String,
    pub status: String,
    pub x: Option<f32>,
    pub y: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowConnection {
    pub from: String,
    pub to: String,
    pub r#type: Option<String>,
    pub label: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateWorkflowRequest {
    pub name: String,
    pub description: Option<String>,
    pub r#type: String,
    pub repository_id: Option<i64>,
}

// GET /api/v1/workflows
pub async fn list_workflows(
    State(state): State<Arc<AppState>>,
    user: crate::auth::CurrentUser,
) -> AppResult<Json<Vec<WorkflowResponse>>> {
    let workflows = sqlx::query!(
        r#"
        SELECT w.*, 
               datetime(w.created_at) as created_at_str,
               datetime(w.updated_at) as updated_at_str,
               datetime(w.started_at) as started_at_str,
               datetime(w.completed_at) as completed_at_str
        FROM workflows w
        WHERE w.created_by_user_id = ?1 
           OR w.assigned_to_user_id = ?1
           OR EXISTS (
               SELECT 1 FROM project_members pm
               JOIN project_workflows pw ON pm.project_id = pw.project_id
               WHERE pw.workflow_id = w.id AND pm.user_id = ?1
           )
        ORDER BY w.updated_at DESC
        "#,
        user.id
    )
    .fetch_all(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    let mut responses = Vec::new();
    
    for workflow in workflows {
        // Get nodes and connections
        let nodes: Vec<WorkflowNode> = sqlx::query!(
            "SELECT data FROM workflow_nodes WHERE workflow_id = ?1",
            workflow.id
        )
        .fetch_all(&state.db.pool)
        .await
        .map_err(|e| AppError::Internal(e.into()))?
        .into_iter()
        .filter_map(|r| serde_json::from_str(&r.data).ok())
        .collect();

        let connections: Vec<WorkflowConnection> = sqlx::query!(
            "SELECT data FROM workflow_connections WHERE workflow_id = ?1",
            workflow.id
        )
        .fetch_all(&state.db.pool)
        .await
        .map_err(|e| AppError::Internal(e.into()))?
        .into_iter()
        .filter_map(|r| serde_json::from_str(&r.data).ok())
        .collect();

        responses.push(WorkflowResponse {
            id: workflow.id,
            uuid: workflow.uuid,
            name: workflow.name,
            description: workflow.description,
            r#type: workflow.r#type,
            status: workflow.status,
            phase: workflow.phase,
            progress: workflow.progress,
            repository_id: workflow.repository_id,
            created_by_user_id: workflow.created_by_user_id,
            assigned_to_user_id: workflow.assigned_to_user_id,
            priority: workflow.priority,
            due_date: workflow.due_date.map(|d| d.to_string()),
            created_at: workflow.created_at_str.unwrap_or_default(),
            updated_at: workflow.updated_at_str.unwrap_or_default(),
            started_at: workflow.started_at_str,
            completed_at: workflow.completed_at_str,
            nodes,
            connections,
        });
    }

    Ok(Json(responses))
}

// POST /api/v1/workflows
pub async fn create_workflow(
    State(state): State<Arc<AppState>>,
    user: crate::auth::CurrentUser,
    Json(payload): Json<CreateWorkflowRequest>,
) -> AppResult<Json<WorkflowResponse>> {
    let uuid = Uuid::new_v4().to_string();
    
    // Create default nodes for new workflow
    let default_nodes = vec![
        WorkflowNode {
            id: "start".to_string(),
            label: "Start".to_string(),
            r#type: "start".to_string(),
            status: "pending".to_string(),
            x: Some(100.0),
            y: Some(100.0),
        },
        WorkflowNode {
            id: "end".to_string(),
            label: "End".to_string(),
            r#type: "end".to_string(),
            status: "pending".to_string(),
            x: Some(400.0),
            y: Some(100.0),
        },
    ];

    let default_connections = vec![
        WorkflowConnection {
            from: "start".to_string(),
            to: "end".to_string(),
            r#type: Some("default".to_string()),
            label: None,
        },
    ];
    
    // Insert workflow
    let workflow_id = sqlx::query!(
        r#"
        INSERT INTO workflows (
            uuid, name, description, type, status, phase,
            progress, repository_id, created_by_user_id,
            priority, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, 'draft', 'planning', 0, ?5, ?6, 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        "#,
        uuid,
        payload.name,
        payload.description,
        payload.r#type,
        payload.repository_id,
        user.id
    )
    .execute(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?
    .last_insert_rowid();

    // Insert default nodes
    for node in &default_nodes {
        sqlx::query!(
            "INSERT INTO workflow_nodes (workflow_id, node_id, data) VALUES (?1, ?2, ?3)",
            workflow_id,
            node.id,
            serde_json::to_string(node).unwrap()
        )
        .execute(&state.db.pool)
        .await
        .map_err(|e| AppError::Internal(e.into()))?;
    }

    // Insert default connections
    for conn in &default_connections {
        sqlx::query!(
            "INSERT INTO workflow_connections (workflow_id, from_node_id, to_node_id, data) VALUES (?1, ?2, ?3, ?4)",
            workflow_id,
            conn.from,
            conn.to,
            serde_json::to_string(conn).unwrap()
        )
        .execute(&state.db.pool)
        .await
        .map_err(|e| AppError::Internal(e.into()))?;
    }

    // Return created workflow
    get_workflow(State(state), Path(workflow_id.to_string())).await
}

// GET /api/v1/workflows/:id
pub async fn get_workflow(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<Json<WorkflowResponse>> {
    let workflow_id: i64 = id.parse()
        .or_else(|_| {
            // Try to find by UUID
            sqlx::query!("SELECT id FROM workflows WHERE uuid = ?1", id)
                .fetch_optional(&state.db.pool)
                .map(|r| r.map(|row| row.id).unwrap_or(-1))
        })
        .map_err(|_| AppError::BadRequest("Invalid workflow ID".to_string()))?;

    let workflow = sqlx::query!(
        r#"
        SELECT *, 
               datetime(created_at) as created_at_str,
               datetime(updated_at) as updated_at_str,
               datetime(started_at) as started_at_str,
               datetime(completed_at) as completed_at_str
        FROM workflows
        WHERE id = ?1
        "#,
        workflow_id
    )
    .fetch_optional(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?
    .ok_or(AppError::NotFound)?;
    
    // Get nodes and connections
    let nodes: Vec<WorkflowNode> = sqlx::query!(
        "SELECT data FROM workflow_nodes WHERE workflow_id = ?1",
        workflow_id
    )
    .fetch_all(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?
    .into_iter()
    .filter_map(|r| serde_json::from_str(&r.data).ok())
    .collect();

    let connections: Vec<WorkflowConnection> = sqlx::query!(
        "SELECT data FROM workflow_connections WHERE workflow_id = ?1",
        workflow_id
    )
    .fetch_all(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?
    .into_iter()
    .filter_map(|r| serde_json::from_str(&r.data).ok())
    .collect();

    Ok(Json(WorkflowResponse {
        id: workflow.id,
        uuid: workflow.uuid,
        name: workflow.name,
        description: workflow.description,
        r#type: workflow.r#type,
        status: workflow.status,
        phase: workflow.phase,
        progress: workflow.progress,
        repository_id: workflow.repository_id,
        created_by_user_id: workflow.created_by_user_id,
        assigned_to_user_id: workflow.assigned_to_user_id,
        priority: workflow.priority,
        due_date: workflow.due_date.map(|d| d.to_string()),
        created_at: workflow.created_at_str.unwrap_or_default(),
        updated_at: workflow.updated_at_str.unwrap_or_default(),
        started_at: workflow.started_at_str,
        completed_at: workflow.completed_at_str,
        nodes,
        connections,
    }))
}

#[derive(Debug, Deserialize)]
pub struct UpdateWorkflowRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub phase: Option<String>,
    pub progress: Option<i32>,
    pub assigned_to_user_id: Option<i64>,
}

// PUT /api/v1/workflows/:id
pub async fn update_workflow(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateWorkflowRequest>,
) -> AppResult<Json<WorkflowResponse>> {
    sqlx::query!(
        r#"
        UPDATE workflows
        SET name = COALESCE(?1, name),
            description = COALESCE(?2, description),
            status = COALESCE(?3, status),
            phase = COALESCE(?4, phase),
            progress = COALESCE(?5, progress),
            assigned_to_user_id = COALESCE(?6, assigned_to_user_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE uuid = ?7 OR id = ?7
        "#,
        payload.name,
        payload.description,
        payload.status,
        payload.phase,
        payload.progress,
        payload.assigned_to_user_id,
        id
    )
    .execute(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    get_workflow(State(state), Path(id)).await
}

// POST /api/v1/workflows/:id/pause
pub async fn pause_workflow(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<Json<WorkflowResponse>> {
    sqlx::query!(
        r#"
        UPDATE workflows
        SET status = 'paused',
            updated_at = CURRENT_TIMESTAMP
        WHERE (uuid = ?1 OR id = ?1) AND status = 'active'
        "#,
        id
    )
    .execute(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    get_workflow(State(state), Path(id)).await
}

// POST /api/v1/workflows/:id/resume
pub async fn resume_workflow(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<Json<WorkflowResponse>> {
    sqlx::query!(
        r#"
        UPDATE workflows
        SET status = 'active',
            started_at = CASE WHEN started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
            updated_at = CURRENT_TIMESTAMP
        WHERE (uuid = ?1 OR id = ?1) AND status = 'paused'
        "#,
        id
    )
    .execute(&state.db.pool)
    .await
    .map_err(|e| AppError::Internal(e.into()))?;

    get_workflow(State(state), Path(id)).await
}