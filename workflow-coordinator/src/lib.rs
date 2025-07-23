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

pub mod agent_manager;
pub mod phase_manager;
pub mod quality_assurance;
pub mod communication;

pub use agent_manager::*;
pub use phase_manager::*;
pub use quality_assurance::*;
pub use communication::*;

/// Workflow Coordinator - Manages individual workflow execution
/// 
/// Responsibilities per README:
/// - Phase Management: Oversees all 5 phases with approval authority
/// - Team Coordination: Manages agent assignments and performance
/// - Quality Assurance: Ensures deliverable standards and validation
/// - Stakeholder Communication: Reports progress and manages expectations
/// - Escalation Management: Handles issues beyond team authority
#[derive(Debug)]
pub struct WorkflowCoordinator {
    pub id: Uuid,
    pub workflow_id: Uuid,
    pub workflow_type: String,
    pub state: Arc<RwLock<CoordinatorState>>,
    pub agents: Arc<AgentManager>,
    pub phases: Arc<PhaseManager>,
    pub quality: Arc<QualityAssurance>,
    pub communication: Arc<CommunicationManager>,
    
    // Communication channels
    pub command_tx: mpsc::UnboundedSender<CoordinatorCommand>, 
    pub command_rx: Arc<RwLock<Option<mpsc::UnboundedReceiver<CoordinatorCommand>>>>,
    pub event_tx: broadcast::Sender<CoordinatorEvent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoordinatorState {
    pub status: CoordinatorStatus,
    pub current_phase: WorkflowPhase,
    pub started_at: DateTime<Utc>,
    pub last_activity: DateTime<Utc>,
    pub performance_metrics: CoordinatorMetrics,
    pub active_escalations: Vec<Escalation>,
    pub team_composition: TeamComposition,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CoordinatorStatus {
    Initializing,
    Planning,
    Coordinating,
    Monitoring,
    Escalating,
    Completing,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum WorkflowPhase {
    Planning,      // PHASE 1: Establish project scope and objectives  
    Requirements,  // PHASE 2: EARS format specification ("WHEN... THEN...")
    Design,        // PHASE 3: System architecture and component design
    Tasks,         // PHASE 4: Granular task breakdown with acceptance criteria
    Execute,       // PHASE 5: TDD cycle implementation (Red → Green → Refactor)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoordinatorMetrics {
    pub workflows_managed: u32,
    pub average_completion_time_hours: f64,
    pub team_satisfaction_score: f64,
    pub quality_score: f64,
    pub escalation_rate: f64,
    pub decisions_made: u32,
    pub successful_decisions: u32,
    pub phase_transition_efficiency: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamComposition {
    pub total_agents: u32,
    pub active_agents: u32,
    pub agent_roles: HashMap<String, u32>,
    pub performance_distribution: Vec<AgentPerformance>,
    pub team_health_score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]  
pub struct AgentPerformance {
    pub agent_id: Uuid,
    pub role: String,
    pub performance_score: f64,
    pub tasks_completed: u32,
    pub quality_score: f64,
    pub collaboration_score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Escalation {
    pub id: Uuid,
    pub issue_type: EscalationType,
    pub severity: EscalationSeverity,
    pub description: String,
    pub created_at: DateTime<Utc>,
    pub escalated_to: Option<Uuid>,
    pub resolved: bool,
    pub resolution: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum EscalationType {
    QualityIssue,
    ResourceConstraint,
    TeamConflict,
    TechnicalBlocker,
    DeadlineMissed,
    ScopeChange,
    ExternalDependency,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum EscalationSeverity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone)]
pub enum CoordinatorCommand {
    StartWorkflow,
    TransitionPhase {
        target_phase: WorkflowPhase,
        approval_required: bool,
    },
    AssignAgent {
        agent_id: Uuid,
        role: String,
        tasks: Vec<String>,
    },
    RemoveAgent {
        agent_id: Uuid,
        reason: String,
    },
    EscalateIssue {
        issue_type: EscalationType,
        severity: EscalationSeverity,
        description: String,
    },
    ApprovePhaseTransition {
        phase: WorkflowPhase,
        approved: bool,
        feedback: Option<String>,
    },
    UpdateQualityStandards {
        standards: QualityStandards,
    },
    GenerateStatusReport,
    PauseWorkflow,
    ResumeWorkflow,
    CompleteWorkflow {
        success: bool,
        final_report: String,
    },
}

#[derive(Debug, Clone, Serialize)]
pub enum CoordinatorEvent {
    WorkflowStarted {
        workflow_id: Uuid,
        coordinator_id: Uuid,
    },
    PhaseTransitioned {
        workflow_id: Uuid,
        from_phase: WorkflowPhase,
        to_phase: WorkflowPhase,
        approval_granted: bool,
    },
    AgentAssigned {
        workflow_id: Uuid,
        agent_id: Uuid,
        role: String,
    },
    QualityGatePassed {
        workflow_id: Uuid,
        phase: WorkflowPhase,
        quality_score: f64,
    },
    QualityGateFailed {
        workflow_id: Uuid,
        phase: WorkflowPhase,
        issues: Vec<String>,
    },
    EscalationCreated {
        workflow_id: Uuid,
        escalation_id: Uuid,
        severity: EscalationSeverity,
    },
    WorkflowCompleted {
        workflow_id: Uuid,
        success: bool,
        final_metrics: CoordinatorMetrics,
    },
}

impl WorkflowCoordinator {
    pub fn new(workflow_id: Uuid, workflow_type: String) -> Result<Self> {
        let coordinator_id = Uuid::new_v4();
        let (command_tx, command_rx) = mpsc::unbounded_channel();
        let (event_tx, _) = broadcast::channel(1000);

        let coordinator = Self {
            id: coordinator_id,
            workflow_id,
            workflow_type: workflow_type.clone(),
            state: Arc::new(RwLock::new(CoordinatorState {
                status: CoordinatorStatus::Initializing,
                current_phase: WorkflowPhase::Planning,
                started_at: Utc::now(),
                last_activity: Utc::now(),
                performance_metrics: CoordinatorMetrics::default(),
                active_escalations: Vec::new(),
                team_composition: TeamComposition::default(),
            })),
            agents: Arc::new(AgentManager::new(coordinator_id)),
            phases: Arc::new(PhaseManager::new(workflow_type.clone())),
            quality: Arc::new(QualityAssurance::new()),
            communication: Arc::new(CommunicationManager::new(coordinator_id)),
            command_tx,
            command_rx: Arc::new(RwLock::new(Some(command_rx))),
            event_tx,
        };

        info!("Created Workflow Coordinator {} for workflow {}", coordinator_id, workflow_id);
        Ok(coordinator)
    }

    pub async fn start(&self) -> Result<()> {
        info!("Starting Workflow Coordinator {} for workflow {}", self.id, self.workflow_id);
        
        // Update state to active
        {
            let mut state = self.state.write();
            state.status = CoordinatorStatus::Coordinating;
            state.last_activity = Utc::now();
        }

        // Start component managers
        self.agents.start().await?;
        self.phases.start().await?;
        self.quality.start().await?;
        self.communication.start().await?;

        // Start command processing loop
        self.start_command_loop().await?;

        // Emit started event
        let _ = self.event_tx.send(CoordinatorEvent::WorkflowStarted {
            workflow_id: self.workflow_id,
            coordinator_id: self.id,
        });

        info!("Workflow Coordinator {} started successfully", self.id);
        Ok(())
    }

    async fn start_command_loop(&self) -> Result<()> {
        let mut command_rx = {
            let mut rx_guard = self.command_rx.write();
            rx_guard.take().ok_or_else(|| anyhow::anyhow!("Command receiver already taken"))?
        };

        let coordinator_clone = self.clone();
        
        tokio::spawn(async move {
            while let Some(command) = command_rx.recv().await {
                if let Err(e) = coordinator_clone.handle_command(command).await {
                    error!("Error handling coordinator command: {}", e);
                }
            }
        });

        Ok(())
    }

    async fn handle_command(&self, command: CoordinatorCommand) -> Result<()> {
        use CoordinatorCommand::*;

        match command {
            StartWorkflow => {
                self.start_workflow_execution().await?;
            }
            TransitionPhase { target_phase, approval_required } => {
                self.transition_phase(target_phase, approval_required).await?;
            }
            AssignAgent { agent_id, role, tasks } => {
                self.assign_agent(agent_id, role, tasks).await?;
            }
            RemoveAgent { agent_id, reason } => {
                self.remove_agent(agent_id, reason).await?;
            }
            EscalateIssue { issue_type, severity, description } => {
                self.escalate_issue(issue_type, severity, description).await?;
            }
            ApprovePhaseTransition { phase, approved, feedback } => {
                self.approve_phase_transition(phase, approved, feedback).await?;
            }
            UpdateQualityStandards { standards } => {
                self.quality.update_standards(standards).await?;
            }
            GenerateStatusReport => {
                self.generate_status_report().await?;
            }
            PauseWorkflow => {
                self.pause_workflow().await?;
            }
            ResumeWorkflow => {
                self.resume_workflow().await?;
            }
            CompleteWorkflow { success, final_report } => {
                self.complete_workflow(success, final_report).await?;
            }
        }

        // Update last activity
        {
            let mut state = self.state.write();
            state.last_activity = Utc::now();
        }

        Ok(())
    }

    async fn start_workflow_execution(&self) -> Result<()> {
        info!("Starting workflow execution for {}", self.workflow_id);
        
        // Initialize first phase
        self.phases.initialize_phase(WorkflowPhase::Planning).await?;
        
        // Update coordinator status
        {
            let mut state = self.state.write();
            state.status = CoordinatorStatus::Planning;
            state.current_phase = WorkflowPhase::Planning;
        }

        info!("Workflow execution started in Planning phase");
        Ok(())
    }

    async fn transition_phase(&self, target_phase: WorkflowPhase, approval_required: bool) -> Result<()> {
        let current_phase = {
            let state = self.state.read();
            state.current_phase.clone()
        };

        info!("Transitioning from {:?} to {:?} (approval_required: {})", 
               current_phase, target_phase, approval_required);

        // Validate phase transition
        if !self.phases.can_transition_to(&target_phase).await? {
            warn!("Cannot transition to {:?} - requirements not met", target_phase);
            return Err(anyhow::anyhow!("Phase transition requirements not met"));
        }

        // Check quality gates
        let quality_passed = self.quality.validate_phase_completion(&current_phase).await?;
        if !quality_passed {
            let _ = self.event_tx.send(CoordinatorEvent::QualityGateFailed {
                workflow_id: self.workflow_id,
                phase: current_phase.clone(),
                issues: self.quality.get_current_issues().await,
            });
            return Err(anyhow::anyhow!("Quality gate failed for phase {:?}", current_phase));
        }

        // Handle approval if required
        if approval_required {
            // In a real implementation, this would wait for external approval
            info!("Phase transition requires approval - proceeding for demo");
        }

        // Perform the transition
        self.phases.transition_to_phase(target_phase.clone()).await?;
        
        // Update coordinator state
        {
            let mut state = self.state.write();
            state.current_phase = target_phase.clone();
            state.performance_metrics.phase_transition_efficiency += 1.0;
        }

        // Emit events
        let _ = self.event_tx.send(CoordinatorEvent::PhaseTransitioned {
            workflow_id: self.workflow_id,
            from_phase: current_phase,
            to_phase: target_phase.clone(),
            approval_granted: true,
        });

        let quality_score = self.quality.get_current_score().await;
        let _ = self.event_tx.send(CoordinatorEvent::QualityGatePassed {
            workflow_id: self.workflow_id,
            phase: target_phase,
            quality_score,
        });

        Ok(())
    }

    async fn assign_agent(&self, agent_id: Uuid, role: String, tasks: Vec<String>) -> Result<()> {
        info!("Assigning agent {} to role {} with {} tasks", agent_id, role, tasks.len());
        
        self.agents.assign_agent(agent_id, role.clone(), tasks).await?;
        
        // Update team composition
        {
            let mut state = self.state.write();
            state.team_composition.total_agents += 1;
            state.team_composition.active_agents += 1;
            *state.team_composition.agent_roles.entry(role.clone()).or_insert(0) += 1;
        }

        // Emit event
        let _ = self.event_tx.send(CoordinatorEvent::AgentAssigned {
            workflow_id: self.workflow_id,
            agent_id,
            role,
        });

        Ok(())
    }

    async fn remove_agent(&self, agent_id: Uuid, reason: String) -> Result<()> {
        info!("Removing agent {} (reason: {})", agent_id, reason);
        
        let agent_role = self.agents.remove_agent(agent_id).await?;
        
        // Update team composition
        {
            let mut state = self.state.write();
            state.team_composition.active_agents = state.team_composition.active_agents.saturating_sub(1);
            if let Some(role) = agent_role {
                if let Some(count) = state.team_composition.agent_roles.get_mut(&role) {
                    *count = count.saturating_sub(1);
                }
            }
        }

        Ok(())
    }

    async fn escalate_issue(
        &self,
        issue_type: EscalationType,
        severity: EscalationSeverity,
        description: String,
    ) -> Result<()> {
        let escalation_id = Uuid::new_v4();
        
        let escalation = Escalation {
            id: escalation_id,
            issue_type: issue_type.clone(),
            severity: severity.clone(),
            description: description.clone(),
            created_at: Utc::now(),
            escalated_to: None,
            resolved: false,
            resolution: None,
        };

        // Add to active escalations
        {
            let mut state = self.state.write();
            state.active_escalations.push(escalation);
            state.performance_metrics.escalation_rate += 1.0;
        }

        warn!("Escalated issue: {:?} - {}", issue_type, description);

        // Emit event
        let _ = self.event_tx.send(CoordinatorEvent::EscalationCreated {
            workflow_id: self.workflow_id,
            escalation_id,
            severity,
        });

        Ok(())
    }

    async fn approve_phase_transition(
        &self,
        _phase: WorkflowPhase,
        approved: bool,
        feedback: Option<String>,
    ) -> Result<()> {
        if approved {
            info!("Phase transition approved");
            if let Some(feedback) = feedback {
                info!("Approval feedback: {}", feedback);
            }
        } else {
            warn!("Phase transition denied");
            if let Some(feedback) = feedback {
                warn!("Denial feedback: {}", feedback);
            }
        }
        Ok(())
    }

    async fn generate_status_report(&self) -> Result<()> {
        let state = self.state.read();
        
        info!("=== Workflow Coordinator Status Report ===");
        info!("Coordinator ID: {}", self.id);
        info!("Workflow ID: {}", self.workflow_id);
        info!("Status: {:?}", state.status);
        info!("Current Phase: {:?}", state.current_phase);
        info!("Team Size: {} active agents", state.team_composition.active_agents);
        info!("Active Escalations: {}", state.active_escalations.len());
        info!("Performance Score: {:.2}", state.performance_metrics.quality_score);
        
        Ok(())
    }

    async fn pause_workflow(&self) -> Result<()> {
        info!("Pausing workflow {}", self.workflow_id);
        
        // Pause all agents
        self.agents.pause_all_agents().await?;
        
        // Update status
        {
            let mut state = self.state.write();
            state.status = CoordinatorStatus::Monitoring;
        }

        Ok(())
    }

    async fn resume_workflow(&self) -> Result<()> {
        info!("Resuming workflow {}", self.workflow_id);
        
        // Resume all agents
        self.agents.resume_all_agents().await?;
        
        // Update status
        {
            let mut state = self.state.write();
            state.status = CoordinatorStatus::Coordinating;
        }

        Ok(())
    }

    async fn complete_workflow(&self, success: bool, final_report: String) -> Result<()> {
        info!("Completing workflow {} (success: {})", self.workflow_id, success);
        
        // Finalize all components
        self.agents.finalize_all_agents().await?;
        self.phases.finalize_current_phase().await?;
        
        // Update final state
        let final_metrics = {
            let mut state = self.state.write();
            state.status = if success { CoordinatorStatus::Completed } else { CoordinatorStatus::Failed };
            state.performance_metrics.workflows_managed += 1;
            if success {
                state.performance_metrics.successful_decisions += 1;
            }
            state.performance_metrics.clone()
        };

        info!("Workflow completion report: {}", final_report);

        // Emit completion event
        let _ = self.event_tx.send(CoordinatorEvent::WorkflowCompleted {
            workflow_id: self.workflow_id,
            success,
            final_metrics,
        });

        Ok(())
    }

    pub fn get_state(&self) -> CoordinatorState {
        self.state.read().clone()
    }

    pub fn subscribe_events(&self) -> broadcast::Receiver<CoordinatorEvent> {
        self.event_tx.subscribe()
    }
}

impl Clone for WorkflowCoordinator {
    fn clone(&self) -> Self {
        Self {
            id: self.id,
            workflow_id: self.workflow_id,
            workflow_type: self.workflow_type.clone(),
            state: self.state.clone(),
            agents: self.agents.clone(),
            phases: self.phases.clone(),
            quality: self.quality.clone(),
            communication: self.communication.clone(),
            command_tx: self.command_tx.clone(),
            command_rx: self.command_rx.clone(),
            event_tx: self.event_tx.clone(),
        }
    }
}

impl Default for CoordinatorMetrics {
    fn default() -> Self {
        Self {
            workflows_managed: 0,
            average_completion_time_hours: 0.0,
            team_satisfaction_score: 0.0,
            quality_score: 0.0,
            escalation_rate: 0.0,
            decisions_made: 0,
            successful_decisions: 0,
            phase_transition_efficiency: 0.0,
        }
    }
}

impl Default for TeamComposition {
    fn default() -> Self {
        Self {
            total_agents: 0,
            active_agents: 0,
            agent_roles: HashMap::new(),
            performance_distribution: Vec::new(),
            team_health_score: 100.0,
        }
    }
}