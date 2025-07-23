use anyhow::Result;
use axum::{
    extract::{Path, Query, State, WebSocketUpgrade, ws::{WebSocket, Message}},
    http::StatusCode,
    response::{Html, IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use dashmap::DashMap;
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    net::SocketAddr,
    sync::Arc,
    time::Duration,
};
use tokio::sync::{broadcast, RwLock};
// use tower::ServiceBuilder;
// use tower::timeout::TimeoutLayer;
use tracing::{error, info, warn};
use uuid::Uuid;

// Re-export types from orchestrator components
pub use master_orchestrator::{WorkflowInfo, WorkflowStatus, WorkflowPriority};
pub use workflow_coordinator::{WorkflowPhase, CoordinatorEvent};
pub use github_integration::{GitHubIntegration, GitHubConfig, GitHubUser};

// Local WorkflowMetrics for dashboard
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowMetrics {
    pub progress_percentage: f64,
    pub tasks_completed: u32,
    pub tasks_total: u32,
    pub issues_count: u32,
    pub quality_score: f64,
    pub velocity: f64,
}

/// Vibe Kanban Dashboard - Real-time workflow visualization and monitoring
/// 
/// Features:
/// - Real-time workflow status visualization
/// - Interactive Kanban board interface
/// - Performance metrics and analytics
/// - WebSocket-based live updates
/// - RESTful API for workflow management
#[derive(Debug, Clone)]
pub struct VibeKanbanDashboard {
    pub port: u16,
    pub state: Arc<DashboardState>,
    pub event_broadcaster: broadcast::Sender<DashboardEvent>,
    pub workflows: Arc<DashMap<Uuid, WorkflowDisplay>>,
    pub metrics: Arc<RwLock<GlobalMetrics>>,
}

#[derive(Debug)]
pub struct DashboardState {
    pub active_workflows: DashMap<Uuid, WorkflowDisplay>,
    pub workflow_history: RwLock<Vec<WorkflowHistoryEntry>>,
    pub system_metrics: RwLock<SystemMetrics>,
    pub connected_clients: DashMap<Uuid, ClientConnection>,
    pub dashboard_config: RwLock<DashboardConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowDisplay {
    pub id: Uuid,
    pub name: String,
    pub workflow_type: String,
    pub status: WorkflowStatus,
    pub phase: WorkflowPhase,
    pub priority: WorkflowPriority,
    pub progress_percentage: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub estimated_completion: Option<DateTime<Utc>>,
    pub team_size: u32,
    pub metrics: WorkflowMetrics,
    pub issues: Vec<WorkflowIssue>,
    pub milestones: Vec<Milestone>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowIssue {
    pub id: Uuid,
    pub title: String,
    pub description: String,
    pub severity: IssueSeverity,
    pub created_at: DateTime<Utc>,
    pub resolved: bool,
    pub assignee: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IssueSeverity {
    Critical,
    High,
    Medium,
    Low,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Milestone {
    pub id: Uuid,
    pub title: String,
    pub description: String,
    pub due_date: DateTime<Utc>,
    pub completed: bool,
    pub progress: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowHistoryEntry {
    pub workflow_id: Uuid,
    pub event_type: String,
    pub description: String,
    pub timestamp: DateTime<Utc>,
    pub metadata: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetrics {
    pub total_workflows: u32,
    pub active_workflows: u32,
    pub completed_workflows: u32,
    pub failed_workflows: u32,
    pub average_completion_time_hours: f64,
    pub success_rate: f64,
    pub system_health_score: f64,
    pub resource_utilization: ResourceUtilization,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceUtilization {
    pub cpu_percent: f64,
    pub memory_percent: f64,
    pub active_agents: u32,
    pub total_agents: u32,
    pub queue_depth: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalMetrics {
    pub workflows_per_hour: f64,
    pub average_quality_score: f64,
    pub team_productivity: f64,
    pub issue_resolution_time_hours: f64,
    pub client_satisfaction: f64,
}

#[derive(Debug)]
pub struct ClientConnection {
    pub id: Uuid,
    pub connected_at: DateTime<Utc>,
    pub last_ping: DateTime<Utc>,
    pub subscriptions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardConfig {
    pub refresh_interval_seconds: u64,
    pub max_workflow_history: usize,
    pub enable_real_time_updates: bool,
    pub theme: DashboardTheme,
    pub notification_settings: NotificationSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DashboardTheme {
    Light,
    Dark,
    Auto,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationSettings {
    pub workflow_completed: bool,
    pub workflow_failed: bool,
    pub quality_gate_failed: bool,
    pub system_alerts: bool,
}

#[derive(Debug, Clone, Serialize)]
pub enum DashboardEvent {
    WorkflowCreated {
        workflow: WorkflowDisplay,
    },
    WorkflowUpdated {
        workflow_id: Uuid,
        changes: HashMap<String, serde_json::Value>,
    },
    WorkflowCompleted {
        workflow_id: Uuid,
        success: bool,
        duration_hours: f64,
    },
    PhaseTransition {
        workflow_id: Uuid,
        from_phase: WorkflowPhase,
        to_phase: WorkflowPhase,
    },
    IssueCreated {
        workflow_id: Uuid,
        issue: WorkflowIssue,
    },
    IssueResolved {
        workflow_id: Uuid,
        issue_id: Uuid,
    },
    SystemMetricsUpdated {
        metrics: SystemMetrics,
    },
    ClientConnected {
        client_id: Uuid,
    },
    ClientDisconnected {
        client_id: Uuid,
    },
}

#[derive(Debug, Deserialize)]
pub struct WorkflowQuery {
    pub status: Option<String>,
    pub phase: Option<String>,
    pub priority: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Debug, Serialize)]
pub struct DashboardOverview {
    pub system_metrics: SystemMetrics,
    pub active_workflows: Vec<WorkflowDisplay>,
    pub recent_activity: Vec<WorkflowHistoryEntry>,
    pub alerts: Vec<SystemAlert>,
    pub performance_trends: PerformanceTrends,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemAlert {
    pub id: Uuid,
    pub severity: AlertSeverity,
    pub title: String,
    pub message: String,
    pub created_at: DateTime<Utc>,
    pub acknowledged: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertSeverity {
    Critical,
    Warning,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceTrends {
    pub workflow_completion_trend: Vec<TrendPoint>,
    pub quality_score_trend: Vec<TrendPoint>,
    pub resource_usage_trend: Vec<TrendPoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrendPoint {
    pub timestamp: DateTime<Utc>,
    pub value: f64,
}

impl VibeKanbanDashboard {
    pub fn new(port: u16) -> Self {
        let (event_broadcaster, _) = broadcast::channel(1000);
        
        Self {
            port,
            state: Arc::new(DashboardState {
                active_workflows: DashMap::new(),
                workflow_history: RwLock::new(Vec::new()),
                system_metrics: RwLock::new(SystemMetrics::default()),
                connected_clients: DashMap::new(),
                dashboard_config: RwLock::new(DashboardConfig::default()),
            }),
            event_broadcaster,
            workflows: Arc::new(DashMap::new()),
            metrics: Arc::new(RwLock::new(GlobalMetrics::default())),
        }
    }

    pub async fn start(&self) -> Result<()> {
        info!("Starting Vibe Kanban Dashboard on port {}", self.port);

        // Create the web application
        let app = self.create_router().await;

        // Bind to address
        let addr = SocketAddr::from(([0, 0, 0, 0], self.port));
        info!("Dashboard server listening on http://{}", addr);

        // Start background tasks
        self.start_background_tasks().await?;

        // Start the server
        let listener = tokio::net::TcpListener::bind(addr).await?;
        axum::serve(listener, app).await?;

        Ok(())
    }

    async fn create_router(&self) -> Router {
        Router::new()
            // Dashboard routes
            .route("/", get(dashboard_home))
            .route("/api/overview", get(get_dashboard_overview))
            .route("/api/workflows", get(get_workflows))
            .route("/api/workflows/:id", get(get_workflow))
            .route("/api/workflows/:id/update", post(update_workflow))
            .route("/api/metrics", get(get_system_metrics))
            .route("/api/history", get(get_workflow_history))
            
            // WebSocket for real-time updates
            .route("/ws", get(websocket_handler))
            
            // Static files (dashboard UI)
            .route("/dashboard", get(dashboard_ui))
            .route("/static/*file", get(serve_static_files))
            
            // Health check
            .route("/health", get(health_check))
            
            // TODO: Add middleware as needed
            .with_state(self.state.clone())
    }

    async fn start_background_tasks(&self) -> Result<()> {
        let state = self.state.clone();
        let event_tx = self.event_broadcaster.clone();

        // Metrics collection task
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(5));
            loop {
                interval.tick().await;
                if let Err(e) = collect_system_metrics(&state, &event_tx).await {
                    error!("Failed to collect system metrics: {}", e);
                }
            }
        });

        // Client cleanup task
        let state_cleanup = self.state.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(60));
            loop {
                interval.tick().await;
                cleanup_disconnected_clients(&state_cleanup).await;
            }
        });

        info!("Background tasks started successfully");
        Ok(())
    }

    pub async fn add_workflow(&self, workflow_info: WorkflowInfo) -> Result<()> {
        let workflow_display = WorkflowDisplay {
            id: workflow_info.id,
            name: format!("Workflow {}", workflow_info.id),
            workflow_type: workflow_info.workflow_type.clone(),
            status: workflow_info.status,
            phase: WorkflowPhase::Planning, // Default phase
            priority: workflow_info.priority,
            progress_percentage: 0.0,
            created_at: workflow_info.created_at,
            updated_at: Utc::now(),
            estimated_completion: workflow_info.estimated_completion,
            team_size: 1,
            metrics: WorkflowMetrics::default(),
            issues: Vec::new(),
            milestones: Vec::new(),
        };

        // Add to active workflows
        self.state.active_workflows.insert(workflow_info.id, workflow_display.clone());
        self.workflows.insert(workflow_info.id, workflow_display.clone());

        // Add to history
        let history_entry = WorkflowHistoryEntry {
            workflow_id: workflow_info.id,
            event_type: "workflow_created".to_string(),
            description: format!("Workflow '{}' created", workflow_info.id),
            timestamp: Utc::now(),
            metadata: HashMap::new(),
        };

        {
            let mut history = self.state.workflow_history.write().await;
            history.push(history_entry);
            
            // Keep only last 1000 entries
            if history.len() > 1000 {
                history.remove(0);
            }
        }

        // Broadcast event
        let _ = self.event_broadcaster.send(DashboardEvent::WorkflowCreated {
            workflow: workflow_display,
        });

        info!("Added workflow {} to dashboard", workflow_info.id);
        Ok(())
    }

    pub async fn update_workflow_phase(&self, workflow_id: Uuid, new_phase: WorkflowPhase) -> Result<()> {
        if let Some(mut workflow) = self.workflows.get_mut(&workflow_id) {
            let old_phase = workflow.phase.clone();
            workflow.phase = new_phase.clone();
            workflow.updated_at = Utc::now();

            // Update progress based on phase
            workflow.progress_percentage = match new_phase {
                WorkflowPhase::Planning => 10.0,
                WorkflowPhase::Requirements => 25.0,
                WorkflowPhase::Design => 50.0,
                WorkflowPhase::Tasks => 75.0,
                WorkflowPhase::Execute => 90.0,
            };

            // Broadcast phase transition event
            let _ = self.event_broadcaster.send(DashboardEvent::PhaseTransition {
                workflow_id,
                from_phase: old_phase,
                to_phase: new_phase,
            });

            info!("Updated workflow {} to phase {:?}", workflow_id, workflow.phase);
        }

        Ok(())
    }

    pub async fn complete_workflow(&self, workflow_id: Uuid, success: bool) -> Result<()> {
        if let Some(mut workflow) = self.workflows.get_mut(&workflow_id) {
            workflow.status = if success { 
                WorkflowStatus::Completed 
            } else { 
                WorkflowStatus::Failed 
            };
            workflow.progress_percentage = 100.0;
            workflow.updated_at = Utc::now();

            let duration_hours = (Utc::now() - workflow.created_at).num_hours() as f64;

            // Broadcast completion event
            let _ = self.event_broadcaster.send(DashboardEvent::WorkflowCompleted {
                workflow_id,
                success,
                duration_hours,
            });

            info!("Completed workflow {} (success: {})", workflow_id, success);
        }

        Ok(())
    }
}

// HTTP Handler Functions

async fn dashboard_home() -> impl IntoResponse {
    Html(include_str!("../static/index.html"))
}

async fn dashboard_ui() -> impl IntoResponse {
    Html(include_str!("../static/dashboard.html"))
}

async fn get_dashboard_overview(State(state): State<Arc<DashboardState>>) -> impl IntoResponse {
    let system_metrics = state.system_metrics.read().await.clone();
    let active_workflows: Vec<WorkflowDisplay> = state
        .active_workflows
        .iter()
        .map(|entry| entry.value().clone())
        .collect();
    
    let recent_activity = {
        let history = state.workflow_history.read().await;
        history.iter().rev().take(10).cloned().collect()
    };

    let overview = DashboardOverview {
        system_metrics,
        active_workflows,
        recent_activity,
        alerts: vec![], // TODO: Implement alerts
        performance_trends: PerformanceTrends::default(),
    };

    Json(overview)
}

async fn get_workflows(
    Query(query): Query<WorkflowQuery>,
    State(state): State<Arc<DashboardState>>,
) -> impl IntoResponse {
    let mut workflows: Vec<WorkflowDisplay> = state
        .active_workflows
        .iter()
        .map(|entry| entry.value().clone())
        .collect();

    // Apply filters
    if let Some(status_filter) = query.status {
        workflows.retain(|w| format!("{:?}", w.status).to_lowercase() == status_filter.to_lowercase());
    }

    if let Some(phase_filter) = query.phase {
        workflows.retain(|w| format!("{:?}", w.phase).to_lowercase() == phase_filter.to_lowercase());
    }

    if let Some(priority_filter) = query.priority {
        workflows.retain(|w| format!("{:?}", w.priority).to_lowercase() == priority_filter.to_lowercase());
    }

    // Apply pagination
    let offset = query.offset.unwrap_or(0);
    let limit = query.limit.unwrap_or(50).min(100);

    workflows.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    let paginated: Vec<WorkflowDisplay> = workflows
        .into_iter()
        .skip(offset)
        .take(limit)
        .collect();

    Json(paginated)
}

async fn get_workflow(
    Path(workflow_id): Path<Uuid>,
    State(state): State<Arc<DashboardState>>,
) -> Result<impl IntoResponse, StatusCode> {
    if let Some(workflow) = state.active_workflows.get(&workflow_id) {
        Ok(Json(workflow.clone()))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

async fn update_workflow(
    Path(workflow_id): Path<Uuid>,
    State(_state): State<Arc<DashboardState>>,
    Json(_update): Json<serde_json::Value>,
) -> impl IntoResponse {
    // TODO: Implement workflow updates
    info!("Received update request for workflow {}", workflow_id);
    StatusCode::OK
}

async fn get_system_metrics(State(state): State<Arc<DashboardState>>) -> impl IntoResponse {
    let metrics = state.system_metrics.read().await;
    Json(metrics.clone())
}

async fn get_workflow_history(
    State(state): State<Arc<DashboardState>>,
) -> impl IntoResponse {
    let history = state.workflow_history.read().await;
    let recent_history: Vec<WorkflowHistoryEntry> = history
        .iter()
        .rev()
        .take(100)
        .cloned()
        .collect();
    Json(recent_history)
}

async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<DashboardState>>,
) -> Response {
    ws.on_upgrade(|socket| handle_websocket(socket, state))
}

async fn handle_websocket(
    socket: WebSocket,
    state: Arc<DashboardState>,
) {
    let client_id = Uuid::new_v4();
    
    // Register client
    let client = ClientConnection {
        id: client_id,
        connected_at: Utc::now(),
        last_ping: Utc::now(),
        subscriptions: vec!["all".to_string()],
    };
    
    state.connected_clients.insert(client_id, client);
    info!("WebSocket client {} connected", client_id);

    let (mut sender, mut receiver) = socket.split();

    // Handle incoming messages
    tokio::spawn(async move {
        while let Some(msg) = receiver.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    info!("Received WebSocket message: {}", text);
                    // Handle client messages (subscriptions, etc.)
                }
                Ok(Message::Close(_)) => {
                    info!("WebSocket client {} disconnected", client_id);
                    break;
                }
                _ => {}
            }
        }
        
        // Cleanup on disconnect
        state.connected_clients.remove(&client_id);
    });

    // Send periodic updates
    let mut interval = tokio::time::interval(Duration::from_secs(1));
    loop {
        interval.tick().await;
        
        // Send heartbeat or updates
        let update = serde_json::json!({
            "type": "heartbeat",
            "timestamp": Utc::now(),
            "client_id": client_id
        });
        
        if sender.send(Message::Text(update.to_string())).await.is_err() {
            break;
        }
    }
}

async fn serve_static_files(Path(_file): Path<String>) -> impl IntoResponse {
    // TODO: Serve actual static files
    StatusCode::NOT_FOUND
}

async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "healthy",
        "timestamp": Utc::now(),
        "service": "vibe-kanban-dashboard"
    }))
}

// Background Tasks

async fn collect_system_metrics(
    state: &Arc<DashboardState>,
    event_tx: &broadcast::Sender<DashboardEvent>,
) -> Result<()> {
    let active_count = state.active_workflows.len() as u32;
    let completed_count = 0; // TODO: Track completed workflows
    let failed_count = 0; // TODO: Track failed workflows
    
    let metrics = SystemMetrics {
        total_workflows: active_count + completed_count + failed_count,
        active_workflows: active_count,
        completed_workflows: completed_count,
        failed_workflows: failed_count,
        average_completion_time_hours: 24.0, // TODO: Calculate actual average
        success_rate: 0.95, // TODO: Calculate actual success rate
        system_health_score: 98.5, // TODO: Calculate from actual system health
        resource_utilization: ResourceUtilization {
            cpu_percent: 25.0, // TODO: Get actual CPU usage
            memory_percent: 40.0, // TODO: Get actual memory usage
            active_agents: 15, // TODO: Get actual agent count
            total_agents: 20, // TODO: Get total agent capacity
            queue_depth: 3, // TODO: Get actual queue depth
        },
        last_updated: Utc::now(),
    };

    {
        let mut current_metrics = state.system_metrics.write().await;
        *current_metrics = metrics.clone();
    }

    // Broadcast metrics update
    let _ = event_tx.send(DashboardEvent::SystemMetricsUpdated { metrics });

    Ok(())
}

async fn cleanup_disconnected_clients(state: &Arc<DashboardState>) {
    let now = Utc::now();
    let timeout_duration = chrono::Duration::minutes(5);

    state.connected_clients.retain(|_id, client| {
        now.signed_duration_since(client.last_ping) < timeout_duration
    });
}

// Default implementations

impl Default for SystemMetrics {
    fn default() -> Self {
        Self {
            total_workflows: 0,
            active_workflows: 0,
            completed_workflows: 0,
            failed_workflows: 0,
            average_completion_time_hours: 0.0,
            success_rate: 0.0,
            system_health_score: 100.0,
            resource_utilization: ResourceUtilization::default(),
            last_updated: Utc::now(),
        }
    }
}

impl Default for ResourceUtilization {
    fn default() -> Self {
        Self {
            cpu_percent: 0.0,
            memory_percent: 0.0,
            active_agents: 0,
            total_agents: 0,
            queue_depth: 0,
        }
    }
}

impl Default for GlobalMetrics {
    fn default() -> Self {
        Self {
            workflows_per_hour: 0.0,
            average_quality_score: 0.0,
            team_productivity: 0.0,
            issue_resolution_time_hours: 0.0,
            client_satisfaction: 0.0,
        }
    }
}

impl Default for DashboardConfig {
    fn default() -> Self {
        Self {
            refresh_interval_seconds: 5,
            max_workflow_history: 1000,
            enable_real_time_updates: true,
            theme: DashboardTheme::Dark,
            notification_settings: NotificationSettings {
                workflow_completed: true,
                workflow_failed: true,
                quality_gate_failed: true,
                system_alerts: true,
            },
        }
    }
}

impl Default for PerformanceTrends {
    fn default() -> Self {
        Self {
            workflow_completion_trend: Vec::new(),
            quality_score_trend: Vec::new(),
            resource_usage_trend: Vec::new(),
        }
    }
}

impl Default for WorkflowMetrics {
    fn default() -> Self {
        Self {
            progress_percentage: 0.0,
            tasks_completed: 0,
            tasks_total: 0,
            issues_count: 0,
            quality_score: 100.0,
            velocity: 0.0,
        }
    }
}

// Public API function for easy startup
pub async fn start_dashboard(port: u16) -> Result<()> {
    let dashboard = VibeKanbanDashboard::new(port);
    dashboard.start().await
}