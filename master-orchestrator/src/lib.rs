use anyhow::Result;
use chrono::{DateTime, Utc};
use dashmap::DashMap;
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, mpsc};
use tracing::{error, info, warn};
use uuid::Uuid;

pub mod leadership;
pub mod resource_manager;
pub mod system_health;
pub mod workflow_manager;

pub use leadership::*;
pub use resource_manager::*;
pub use system_health::*;
pub use workflow_manager::*;

/// Master Orchestrator - Top-level leadership and coordination
/// 
/// Responsibilities:
/// - Meta-coordination across all workflows
/// - Resource allocation and capacity management  
/// - Strategic decision-making and priority setting
/// - System health monitoring and optimization
#[derive(Debug)]
pub struct MasterOrchestrator {
    pub id: Uuid,
    pub state: Arc<RwLock<OrchestratorState>>,
    pub workflows: Arc<DashMap<Uuid, WorkflowInfo>>,
    pub resources: Arc<ResourceManager>,
    pub health_monitor: Arc<SystemHealthMonitor>,
    pub leadership: Arc<LeadershipHierarchy>,
    
    // Communication channels
    pub command_tx: mpsc::UnboundedSender<OrchestratorCommand>,
    pub command_rx: Arc<RwLock<Option<mpsc::UnboundedReceiver<OrchestratorCommand>>>>,
    pub event_tx: broadcast::Sender<SystemEvent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrchestratorState {
    pub status: OrchestratorStatus,
    pub started_at: DateTime<Utc>,
    pub last_activity_at: DateTime<Utc>,
    pub total_workflows: u64,
    pub active_workflows: u64,
    pub completed_workflows: u64,
    pub failed_workflows: u64,
    pub system_load: f64,
    pub memory_usage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OrchestratorStatus {
    Starting,
    Active,
    Scaling,
    Degraded,
    Shutdown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowInfo {
    pub id: Uuid,
    pub workflow_type: String,
    pub coordinator_id: Option<Uuid>,
    pub status: WorkflowStatus,
    pub priority: WorkflowPriority,
    pub created_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub estimated_completion: Option<DateTime<Utc>>,
    pub resource_allocation: ResourceAllocation,
    pub metrics: WorkflowMetrics,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum WorkflowStatus {
    Queued,
    Planning,
    Requirements,
    Design,
    Tasks,
    Execute,
    Completed,
    Failed,
    Paused,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum WorkflowPriority {
    Critical = 4,
    High = 3,
    Medium = 2,
    Low = 1,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceAllocation {
    pub cpu_cores: f64,
    pub memory_mb: u64,
    pub agent_count: u32,
    pub estimated_duration_hours: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowMetrics {
    pub progress_percentage: f64,
    pub tasks_completed: u32,
    pub tasks_total: u32,
    pub issues_count: u32,
    pub quality_score: f64,
    pub velocity: f64, // tasks per hour
}

#[derive(Debug, Clone)]
pub enum OrchestratorCommand {
    CreateWorkflow {
        workflow_type: String,
        priority: WorkflowPriority,
        config: serde_json::Value,
    },
    UpdateWorkflowPriority {
        workflow_id: Uuid,
        priority: WorkflowPriority,
    },
    PauseWorkflow {
        workflow_id: Uuid,
    },
    ResumeWorkflow {
        workflow_id: Uuid,
    },
    CancelWorkflow {
        workflow_id: Uuid,
    },
    ScaleResources {
        target_workflows: u32,
        max_agents_per_workflow: u32,
    },
    EmergencyShutdown,
    GetStatus,
}

#[derive(Debug, Clone, Serialize)]
pub enum SystemEvent {
    WorkflowCreated {
        workflow_id: Uuid,
        workflow_type: String,
    },
    WorkflowStatusChanged {
        workflow_id: Uuid,
        old_status: WorkflowStatus,
        new_status: WorkflowStatus,
    },
    ResourceAllocationChanged {
        total_cpu: f64,
        total_memory: u64,
        active_agents: u32,
    },
    SystemHealthChanged {
        status: SystemHealthStatus,
        message: String,
    },
    EmergencyAlert {
        severity: AlertSeverity,
        message: String,
        affected_workflows: Vec<Uuid>,
    },
}

impl MasterOrchestrator {
    pub fn new() -> Result<Self> {
        let (command_tx, command_rx) = mpsc::unbounded_channel();
        let (event_tx, _) = broadcast::channel(1000);
        
        let orchestrator = Self {
            id: Uuid::new_v4(),
            state: Arc::new(RwLock::new(OrchestratorState {
                status: OrchestratorStatus::Starting,
                started_at: Utc::now(),
                last_activity_at: Utc::now(),
                total_workflows: 0,
                active_workflows: 0,
                completed_workflows: 0,
                failed_workflows: 0,
                system_load: 0.0,
                memory_usage: 0.0,
            })),
            workflows: Arc::new(DashMap::new()),
            resources: Arc::new(ResourceManager::new()),
            health_monitor: Arc::new(SystemHealthMonitor::new()),
            leadership: Arc::new(LeadershipHierarchy::new()),
            command_tx,
            command_rx: Arc::new(RwLock::new(Some(command_rx))),
            event_tx,
        };

        info!("Master Orchestrator {} initialized", orchestrator.id);
        Ok(orchestrator)
    }

    pub async fn start(&self) -> Result<()> {
        info!("Starting Master Orchestrator {}", self.id);
        
        // Update state to active
        {
            let mut state = self.state.write();
            state.status = OrchestratorStatus::Active;
            state.last_activity_at = Utc::now();
        }

        // Start health monitoring
        self.health_monitor.start().await?;

        // Start resource manager
        self.resources.start().await?;

        // Start leadership hierarchy
        self.leadership.initialize().await?;

        // Start command processing loop
        self.start_command_loop().await?;

        info!("Master Orchestrator {} started successfully", self.id);
        Ok(())
    }

    async fn start_command_loop(&self) -> Result<()> {
        let mut command_rx = {
            let mut rx_guard = self.command_rx.write();
            rx_guard.take().ok_or_else(|| anyhow::anyhow!("Command receiver already taken"))?
        };

        let orchestrator_clone = self.clone();
        
        tokio::spawn(async move {
            while let Some(command) = command_rx.recv().await {
                if let Err(e) = orchestrator_clone.handle_command(command).await {
                    error!("Error handling command: {}", e);
                }
            }
        });

        Ok(())
    }

    async fn handle_command(&self, command: OrchestratorCommand) -> Result<()> {
        use OrchestratorCommand::*;

        match command {
            CreateWorkflow { workflow_type, priority, config } => {
                self.create_workflow(workflow_type, priority, config).await?;
            }
            UpdateWorkflowPriority { workflow_id, priority } => {
                self.update_workflow_priority(workflow_id, priority).await?;
            }
            PauseWorkflow { workflow_id } => {
                self.pause_workflow(workflow_id).await?;
            }
            ResumeWorkflow { workflow_id } => {
                self.resume_workflow(workflow_id).await?;
            }
            CancelWorkflow { workflow_id } => {
                self.cancel_workflow(workflow_id).await?;
            }
            ScaleResources { target_workflows, max_agents_per_workflow } => {
                self.scale_resources(target_workflows, max_agents_per_workflow).await?;
            }
            EmergencyShutdown => {
                self.emergency_shutdown().await?;
            }
            GetStatus => {
                // Return status - would be handled by caller
            }
        }

        // Update last activity
        {
            let mut state = self.state.write();
            state.last_activity_at = Utc::now();
        }

        Ok(())
    }

    async fn create_workflow(
        &self,
        workflow_type: String,
        priority: WorkflowPriority,
        config: serde_json::Value,
    ) -> Result<Uuid> {
        let workflow_id = Uuid::new_v4();
        
        // Check resource availability
        if !self.resources.can_allocate_workflow().await? {
            warn!("Cannot create workflow - insufficient resources");
            return Err(anyhow::anyhow!("Insufficient resources"));
        }

        let workflow_info = WorkflowInfo {
            id: workflow_id,
            workflow_type: workflow_type.clone(),
            coordinator_id: None,
            status: WorkflowStatus::Queued,
            priority,
            created_at: Utc::now(),
            started_at: None,
            completed_at: None,
            estimated_completion: None,
            resource_allocation: ResourceAllocation {
                cpu_cores: 2.0,
                memory_mb: 1024,
                agent_count: 3,
                estimated_duration_hours: 2.0,
            },
            metrics: WorkflowMetrics {
                progress_percentage: 0.0,
                tasks_completed: 0,
                tasks_total: 0,
                issues_count: 0,
                quality_score: 0.0,
                velocity: 0.0,
            },
        };

        self.workflows.insert(workflow_id, workflow_info);

        // Update state
        {
            let mut state = self.state.write();
            state.total_workflows += 1;
            state.active_workflows += 1;
        }

        // Emit event
        let _ = self.event_tx.send(SystemEvent::WorkflowCreated {
            workflow_id,
            workflow_type,
        });

        info!("Created workflow {} with priority {:?}", workflow_id, priority);
        Ok(workflow_id)
    }

    async fn update_workflow_priority(&self, workflow_id: Uuid, priority: WorkflowPriority) -> Result<()> {
        if let Some(mut workflow) = self.workflows.get_mut(&workflow_id) {
            let old_priority = workflow.priority.clone();
            workflow.priority = priority.clone();
            info!("Updated workflow {} priority from {:?} to {:?}", workflow_id, old_priority, priority);
        }
        Ok(())
    }

    async fn pause_workflow(&self, workflow_id: Uuid) -> Result<()> {
        if let Some(mut workflow) = self.workflows.get_mut(&workflow_id) {
            let old_status = workflow.status.clone();
            workflow.status = WorkflowStatus::Paused;
            
            let _ = self.event_tx.send(SystemEvent::WorkflowStatusChanged {
                workflow_id,
                old_status,
                new_status: WorkflowStatus::Paused,
            });
            
            info!("Paused workflow {}", workflow_id);
        }
        Ok(())
    }

    async fn resume_workflow(&self, workflow_id: Uuid) -> Result<()> {
        if let Some(mut workflow) = self.workflows.get_mut(&workflow_id) {
            let old_status = workflow.status.clone();
            // Resume to appropriate status based on progress
            workflow.status = if workflow.started_at.is_some() {
                WorkflowStatus::Execute
            } else {
                WorkflowStatus::Planning
            };
            
            let new_status = workflow.status.clone();
            let _ = self.event_tx.send(SystemEvent::WorkflowStatusChanged {
                workflow_id,
                old_status,
                new_status,
            });
            
            info!("Resumed workflow {}", workflow_id);
        }
        Ok(())
    }

    async fn cancel_workflow(&self, workflow_id: Uuid) -> Result<()> {
        if let Some((_, mut workflow)) = self.workflows.remove(&workflow_id) {
            workflow.status = WorkflowStatus::Failed;
            workflow.completed_at = Some(Utc::now());
            
            // Update state
            {
                let mut state = self.state.write();
                state.active_workflows = state.active_workflows.saturating_sub(1);
                state.failed_workflows += 1;
            }

            info!("Cancelled workflow {}", workflow_id);
        }
        Ok(())
    }

    async fn scale_resources(&self, target_workflows: u32, max_agents_per_workflow: u32) -> Result<()> {
        info!("Scaling resources: target_workflows={}, max_agents_per_workflow={}", 
               target_workflows, max_agents_per_workflow);
        
        self.resources.scale(target_workflows, max_agents_per_workflow).await?;
        
        {
            let mut state = self.state.write();
            state.status = OrchestratorStatus::Scaling;
        }

        Ok(())
    }

    async fn emergency_shutdown(&self) -> Result<()> {
        warn!("Emergency shutdown initiated");
        
        {
            let mut state = self.state.write();
            state.status = OrchestratorStatus::Shutdown;
        }

        // Cancel all active workflows
        let workflow_ids: Vec<Uuid> = self.workflows.iter().map(|entry| *entry.key()).collect();
        for workflow_id in workflow_ids {
            let _ = self.cancel_workflow(workflow_id).await;
        }

        let _ = self.event_tx.send(SystemEvent::EmergencyAlert {
            severity: AlertSeverity::Critical,
            message: "Master Orchestrator emergency shutdown".to_string(),
            affected_workflows: self.workflows.iter().map(|entry| *entry.key()).collect(),
        });

        Ok(())
    }

    pub fn get_status(&self) -> OrchestratorState {
        self.state.read().clone()
    }

    pub fn get_workflow(&self, workflow_id: &Uuid) -> Option<WorkflowInfo> {
        self.workflows.get(workflow_id).map(|entry| entry.clone())
    }

    pub fn list_workflows(&self) -> Vec<WorkflowInfo> {
        self.workflows.iter().map(|entry| entry.clone()).collect()
    }

    pub fn subscribe_events(&self) -> broadcast::Receiver<SystemEvent> {
        self.event_tx.subscribe()
    }
}

impl Clone for MasterOrchestrator {
    fn clone(&self) -> Self {
        Self {
            id: self.id,
            state: self.state.clone(),
            workflows: self.workflows.clone(),
            resources: self.resources.clone(),
            health_monitor: self.health_monitor.clone(),
            leadership: self.leadership.clone(),
            command_tx: self.command_tx.clone(),
            command_rx: self.command_rx.clone(),
            event_tx: self.event_tx.clone(),
        }
    }
}

impl Default for MasterOrchestrator {
    fn default() -> Self {
        Self::new().expect("Failed to create default MasterOrchestrator")
    }
}