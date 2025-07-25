// Database Layer Module - Enhanced by BackendArchitect 🏗️

use sqlx::{SqlitePool, Row};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;
use super::errors::{ApiError, ApiResult};

/// Database connection pool and operations
#[derive(Clone)]
pub struct Database {
    pool: SqlitePool,
}

impl Database {
    /// Initialize database connection and run migrations
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = SqlitePool::connect(database_url).await?;
        
        // Run migrations
        sqlx::migrate!("./migrations").run(&pool).await?;
        
        Ok(Self { pool })
    }
    
    /// Get the underlying connection pool
    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }
}

/// Workflow database operations
impl Database {
    pub async fn create_workflow(&self, workflow: &WorkflowCreate) -> ApiResult<Workflow> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        
        let config_json = serde_json::to_string(&workflow.config)
            .map_err(|e| ApiError::Internal { message: e.to_string() })?;
        
        sqlx::query!(
            r#"
            INSERT INTO workflows (
                id, name, description, status, phase, priority,
                created_at, updated_at, created_by, config
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            id,
            workflow.name,
            workflow.description,
            workflow.status,
            workflow.phase,
            workflow.priority,
            now,
            now,
            workflow.created_by,
            config_json
        )
        .execute(&self.pool)
        .await
        .map_err(|e| ApiError::Database { message: e.to_string() })?;
        
        self.get_workflow(&id).await
    }
    
    pub async fn get_workflow(&self, id: &str) -> ApiResult<Workflow> {
        let row = sqlx::query!(
            "SELECT * FROM workflows WHERE id = ?",
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| ApiError::Database { message: e.to_string() })?
        .ok_or_else(|| ApiError::NotFound {
            resource_type: "Workflow".to_string(),
            id: id.to_string(),
        })?;
        
        let config: WorkflowConfig = serde_json::from_str(&row.config)
            .map_err(|e| ApiError::Internal { message: e.to_string() })?;
        
        Ok(Workflow {
            id: row.id,
            name: row.name,
            description: row.description,
            status: row.status,
            phase: row.phase,
            priority: row.priority,
            created_at: row.created_at,
            updated_at: row.updated_at,
            created_by: row.created_by,
            assigned_to: row.assigned_to,
            estimated_duration: row.estimated_duration.map(|d| d as u32),
            actual_duration: row.actual_duration.map(|d| d as u32),
            tags: serde_json::from_str(&row.tags).unwrap_or_default(),
            dependencies: serde_json::from_str(&row.dependencies).unwrap_or_default(),
            github_repo: row.github_repo,
            config,
            progress: row.progress.unwrap_or(0.0) as f32,
        })
    }
    
    pub async fn list_workflows(&self, filters: &WorkflowFilters) -> ApiResult<Vec<Workflow>> {
        let mut query = "SELECT * FROM workflows WHERE 1=1".to_string();
        let mut params: Vec<String> = vec![];
        
        if let Some(status) = &filters.status {
            query.push_str(" AND status = ?");
            params.push(status.clone());
        }
        
        if let Some(phase) = &filters.phase {
            query.push_str(" AND phase = ?");
            params.push(phase.clone());
        }
        
        if let Some(assigned_to) = &filters.assigned_to {
            query.push_str(" AND assigned_to = ?");
            params.push(assigned_to.clone());
        }
        
        query.push_str(" ORDER BY updated_at DESC LIMIT ? OFFSET ?");
        params.push(filters.limit.unwrap_or(50).to_string());
        params.push(filters.offset.unwrap_or(0).to_string());
        
        let rows = sqlx::query(&query)
            .bind(&params)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| ApiError::Database { message: e.to_string() })?;
        
        let mut workflows = Vec::new();
        for row in rows {
            let config: WorkflowConfig = serde_json::from_str(row.get("config"))
                .map_err(|e| ApiError::Internal { message: e.to_string() })?;
            
            workflows.push(Workflow {
                id: row.get("id"),
                name: row.get("name"),
                description: row.get("description"),
                status: row.get("status"),
                phase: row.get("phase"),
                priority: row.get("priority"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                created_by: row.get("created_by"),
                assigned_to: row.get("assigned_to"),
                estimated_duration: row.get::<Option<i64>, _>("estimated_duration").map(|d| d as u32),
                actual_duration: row.get::<Option<i64>, _>("actual_duration").map(|d| d as u32),
                tags: serde_json::from_str(row.get("tags")).unwrap_or_default(),
                dependencies: serde_json::from_str(row.get("dependencies")).unwrap_or_default(),
                github_repo: row.get("github_repo"),
                config,
                progress: row.get::<Option<f64>, _>("progress").unwrap_or(0.0) as f32,
            });
        }
        
        Ok(workflows)
    }
    
    pub async fn update_workflow(&self, id: &str, updates: &WorkflowUpdate) -> ApiResult<Workflow> {
        let now = chrono::Utc::now().to_rfc3339();
        
        // Build dynamic update query
        let mut query = "UPDATE workflows SET updated_at = ?".to_string();
        let mut params: Vec<String> = vec![now.clone()];
        
        if let Some(name) = &updates.name {
            query.push_str(", name = ?");
            params.push(name.clone());
        }
        
        if let Some(description) = &updates.description {
            query.push_str(", description = ?");
            params.push(description.clone());
        }
        
        if let Some(status) = &updates.status {
            query.push_str(", status = ?");
            params.push(status.clone());
        }
        
        if let Some(phase) = &updates.phase {
            query.push_str(", phase = ?");
            params.push(phase.clone());
        }
        
        if let Some(progress) = updates.progress {
            query.push_str(", progress = ?");
            params.push(progress.to_string());
        }
        
        query.push_str(" WHERE id = ?");
        params.push(id.to_string());
        
        let result = sqlx::query(&query)
            .bind(&params)
            .execute(&self.pool)
            .await
            .map_err(|e| ApiError::Database { message: e.to_string() })?;
        
        if result.rows_affected() == 0 {
            return Err(ApiError::NotFound {
                resource_type: "Workflow".to_string(),
                id: id.to_string(),
            });
        }
        
        self.get_workflow(id).await
    }
    
    pub async fn delete_workflow(&self, id: &str) -> ApiResult<()> {
        let result = sqlx::query!(
            "UPDATE workflows SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL",
            chrono::Utc::now().to_rfc3339(),
            id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| ApiError::Database { message: e.to_string() })?;
        
        if result.rows_affected() == 0 {
            return Err(ApiError::NotFound {
                resource_type: "Workflow".to_string(),
                id: id.to_string(),
            });
        }
        
        Ok(())
    }
}

/// Project database operations
impl Database {
    pub async fn create_project(&self, project: &ProjectCreate) -> ApiResult<Project> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        
        let settings_json = serde_json::to_string(&project.settings)
            .map_err(|e| ApiError::Internal { message: e.to_string() })?;
        let tags_json = serde_json::to_string(&project.tags)
            .map_err(|e| ApiError::Internal { message: e.to_string() })?;
        let tech_stack_json = serde_json::to_string(&project.tech_stack)
            .map_err(|e| ApiError::Internal { message: e.to_string() })?;
        
        sqlx::query!(
            r#"
            INSERT INTO projects (
                id, name, description, status, visibility, owner_id,
                github_repo, local_path, created_at, updated_at,
                settings, tags, tech_stack
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            id,
            project.name,
            project.description,
            project.status,
            project.visibility,
            project.owner_id,
            project.github_repo,
            project.local_path,
            now,
            now,
            settings_json,
            tags_json,
            tech_stack_json
        )
        .execute(&self.pool)
        .await
        .map_err(|e| ApiError::Database { message: e.to_string() })?;
        
        self.get_project(&id).await
    }
    
    pub async fn get_project(&self, id: &str) -> ApiResult<Project> {
        let row = sqlx::query!(
            "SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL",
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| ApiError::Database { message: e.to_string() })?
        .ok_or_else(|| ApiError::NotFound {
            resource_type: "Project".to_string(),
            id: id.to_string(),
        })?;
        
        let settings: ProjectSettings = serde_json::from_str(&row.settings)
            .map_err(|e| ApiError::Internal { message: e.to_string() })?;
        
        Ok(Project {
            id: row.id,
            name: row.name,
            description: row.description,
            status: row.status,
            visibility: row.visibility,
            owner_id: row.owner_id,
            github_repo: row.github_repo,
            local_path: row.local_path,
            created_at: row.created_at,
            updated_at: row.updated_at,
            last_sync: row.last_sync,
            settings,
            tags: serde_json::from_str(&row.tags).unwrap_or_default(),
            tech_stack: serde_json::from_str(&row.tech_stack).unwrap_or_default(),
            workflows: vec![], // TODO: Load associated workflows
            collaborators: vec![], // TODO: Load collaborators
            metrics: ProjectMetrics::default(), // TODO: Calculate metrics
        })
    }
}

/// Database model structs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowCreate {
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub phase: String,
    pub priority: String,
    pub created_by: String,
    pub config: WorkflowConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowUpdate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub phase: Option<String>,
    pub progress: Option<f32>,
    pub assigned_to: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowFilters {
    pub status: Option<String>,
    pub phase: Option<String>,
    pub assigned_to: Option<String>,
    pub tags: Option<String>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectCreate {
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub visibility: String,
    pub owner_id: String,
    pub github_repo: Option<String>,
    pub local_path: Option<String>,
    pub settings: ProjectSettings,
    pub tags: Vec<String>,
    pub tech_stack: Vec<String>,
}

// Re-export types from API modules
pub use super::workflows::{
    Workflow, WorkflowConfig, WorkflowStatus, WorkflowPhase, WorkflowPriority
};
pub use super::projects::{
    Project, ProjectSettings, ProjectMetrics, ProjectCollaborator
};