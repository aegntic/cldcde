use anyhow::Result;
use chrono::{DateTime, Utc};
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn};
use uuid::Uuid;

/// Leadership Hierarchy Management
/// 
/// Manages the three-tier leadership structure:
/// - Master Orchestrator (top level)
/// - Workflow Coordinators (per workflow)
/// - Specialized Managers (per domain)
#[derive(Debug)]
pub struct LeadershipHierarchy {
    pub master_id: Uuid,
    pub coordinators: Arc<DashMap<Uuid, WorkflowCoordinator>>,
    pub specialists: Arc<DashMap<Uuid, SpecializedManager>>,
    pub decision_matrix: Arc<RwLock<DecisionMatrix>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowCoordinator {
    pub id: Uuid,
    pub workflow_id: Uuid,
    pub name: String,
    pub status: CoordinatorStatus,
    pub authority_level: AuthorityLevel,
    pub created_at: DateTime<Utc>,
    pub last_activity: DateTime<Utc>,
    pub managed_agents: Vec<Uuid>,
    pub performance_metrics: CoordinatorMetrics,
    pub responsibilities: Vec<Responsibility>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpecializedManager {
    pub id: Uuid,
    pub specialty: ManagerSpecialty,
    pub name: String,
    pub status: ManagerStatus,
    pub authority_scope: AuthorityScope,
    pub created_at: DateTime<Utc>,
    pub last_activity: DateTime<Utc>,
    pub assigned_workflows: Vec<Uuid>,
    pub expertise_areas: Vec<String>,
    pub performance_metrics: ManagerMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CoordinatorStatus {
    Initializing,
    Active,
    Busy,
    Escalating,
    Offline,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ManagerStatus {
    Available,
    Consulting,
    Leading,
    Reviewing,
    Offline,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ManagerSpecialty {
    TechnicalLead,
    ProjectManager,
    ScrumMaster,
    ProductOwner,
    DevOpsManager,
    SecurityLead,
    QualityAssurance,
    ArchitecturalReview,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum AuthorityLevel {
    Full = 4,      // Can make all decisions within workflow scope
    High = 3,      // Can make most decisions, escalate major ones
    Medium = 2,    // Can make tactical decisions, escalate strategic ones
    Limited = 1,   // Can make minor decisions only
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AuthorityScope {
    CrossWorkflow,      // Can affect multiple workflows
    SingleWorkflow,     // Limited to one workflow  
    DomainSpecific,    // Limited to their expertise domain
    TaskSpecific,      // Limited to specific tasks
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Responsibility {
    PhaseManagement,
    TeamCoordination,
    QualityAssurance,
    StakeholderCommunication,
    EscalationManagement,
    ResourceAllocation,
    ProgressTracking,
    RiskAssessment,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoordinatorMetrics {
    pub workflows_completed: u32,
    pub average_completion_time: f64,
    pub quality_score: f64,
    pub team_satisfaction: f64,
    pub escalation_rate: f64,
    pub decisions_made: u32,
    pub successful_decisions: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManagerMetrics {
    pub consultations_completed: u32,
    pub recommendations_accepted: u32,
    pub average_response_time: f64,
    pub expertise_rating: f64,
    pub cross_team_impact: f64,
    pub decisions_overturned: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecisionMatrix {
    pub master_authority: Vec<DecisionType>,
    pub coordinator_authority: HashMap<Uuid, Vec<DecisionType>>,
    pub specialist_authority: HashMap<Uuid, Vec<DecisionType>>,
    pub escalation_paths: HashMap<DecisionType, Vec<Uuid>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Hash, PartialEq, Eq)]
pub enum DecisionType {
    // Master Orchestrator Decisions
    CrossWorkflowPriorities,
    SystemArchitecture,
    ResourceAllocation,
    BudgetPlanning,
    StrategicDirection,
    
    // Workflow Coordinator Decisions
    WorkflowExecution,
    TeamComposition,
    QualityStandards,
    TimelineManagement,
    AgentAssignment,
    
    // Specialist Manager Decisions
    TechnicalArchitecture,
    ProcessImplementation,
    QualityAssuranceStandards,
    SecurityCompliance,
    DeploymentStrategy,
    
    // Emergency Decisions
    EmergencyEscalation,
    WorkflowShutdown,
    ResourceReallocation,
}

#[derive(Debug, Clone, Serialize)]
pub enum AlertSeverity {
    Low,
    Medium,
    High,
    Critical,
}

impl LeadershipHierarchy {
    pub fn new() -> Self {
        Self {
            master_id: Uuid::new_v4(),
            coordinators: Arc::new(DashMap::new()),
            specialists: Arc::new(DashMap::new()),
            decision_matrix: Arc::new(RwLock::new(DecisionMatrix::default())),
        }
    }

    pub async fn initialize(&self) -> Result<()> {
        info!("Initializing Leadership Hierarchy");
        
        // Initialize decision matrix
        let mut matrix = self.decision_matrix.write().await;
        *matrix = DecisionMatrix::new_with_defaults();
        
        // Create core specialized managers
        self.create_core_specialists().await?;
        
        info!("Leadership Hierarchy initialized successfully");
        Ok(())
    }

    async fn create_core_specialists(&self) -> Result<()> {
        let specialists = vec![
            (ManagerSpecialty::TechnicalLead, "Architecture decisions and technical guidance"),
            (ManagerSpecialty::ProjectManager, "Timeline and resource management"),
            (ManagerSpecialty::ScrumMaster, "Process and agile ceremonies"),
            (ManagerSpecialty::ProductOwner, "Requirements and priorities"),
            (ManagerSpecialty::DevOpsManager, "Infrastructure and deployment"),
            (ManagerSpecialty::SecurityLead, "Security compliance and reviews"),
            (ManagerSpecialty::QualityAssurance, "Quality standards and testing"),
        ];

        for (specialty, description) in specialists {
            let manager = SpecializedManager {
                id: Uuid::new_v4(),
                specialty: specialty.clone(),
                name: format!("{:?}", specialty),
                status: ManagerStatus::Available,
                authority_scope: AuthorityScope::DomainSpecific,
                created_at: Utc::now(),
                last_activity: Utc::now(),
                assigned_workflows: Vec::new(),
                expertise_areas: vec![description.to_string()],
                performance_metrics: ManagerMetrics::default(),
            };

            self.specialists.insert(manager.id, manager);
            info!("Created specialized manager: {:?}", specialty);
        }

        Ok(())
    }

    pub async fn create_workflow_coordinator(
        &self,
        workflow_id: Uuid,
        workflow_type: &str,
    ) -> Result<Uuid> {
        let coordinator_id = Uuid::new_v4();
        
        let coordinator = WorkflowCoordinator {
            id: coordinator_id,
            workflow_id,
            name: format!("{} Coordinator", workflow_type),
            status: CoordinatorStatus::Initializing,
            authority_level: AuthorityLevel::High,
            created_at: Utc::now(),
            last_activity: Utc::now(),
            managed_agents: Vec::new(),
            performance_metrics: CoordinatorMetrics::default(),
            responsibilities: vec![
                Responsibility::PhaseManagement,
                Responsibility::TeamCoordination,
                Responsibility::QualityAssurance,
                Responsibility::ProgressTracking,
            ],
        };

        self.coordinators.insert(coordinator_id, coordinator);

        // Update decision matrix to grant coordinator appropriate authority
        let mut matrix = self.decision_matrix.write().await;
        matrix.coordinator_authority.insert(
            coordinator_id,
            vec![
                DecisionType::WorkflowExecution,
                DecisionType::TeamComposition,
                DecisionType::QualityStandards,
                DecisionType::TimelineManagement,
                DecisionType::AgentAssignment,
            ],
        );

        info!("Created workflow coordinator {} for workflow {}", coordinator_id, workflow_id);
        Ok(coordinator_id)
    }

    pub async fn assign_specialist_to_workflow(
        &self,
        specialist_id: Uuid,
        workflow_id: Uuid,
    ) -> Result<()> {
        if let Some(mut specialist) = self.specialists.get_mut(&specialist_id) {
            if !specialist.assigned_workflows.contains(&workflow_id) {
                specialist.assigned_workflows.push(workflow_id);
                specialist.last_activity = Utc::now();
                specialist.status = ManagerStatus::Consulting;
                
                info!("Assigned specialist {} to workflow {}", specialist_id, workflow_id);
            }
        }
        Ok(())
    }

    pub async fn can_make_decision(
        &self,
        actor_id: Uuid,
        decision_type: &DecisionType,
    ) -> Result<bool> {
        let matrix = self.decision_matrix.read().await;

        // Check if it's the master orchestrator
        if actor_id == self.master_id {
            return Ok(matrix.master_authority.contains(decision_type));
        }

        // Check coordinator authority
        if let Some(authorities) = matrix.coordinator_authority.get(&actor_id) {
            return Ok(authorities.contains(decision_type));
        }

        // Check specialist authority
        if let Some(authorities) = matrix.specialist_authority.get(&actor_id) {
            return Ok(authorities.contains(decision_type));
        }

        Ok(false)
    }

    pub async fn escalate_decision(
        &self,
        decision_type: &DecisionType,
        requesting_actor: Uuid,
    ) -> Result<Vec<Uuid>> {
        let matrix = self.decision_matrix.read().await;
        
        if let Some(escalation_path) = matrix.escalation_paths.get(decision_type) {
            Ok(escalation_path.clone())
        } else {
            // Default escalation to master orchestrator
            Ok(vec![self.master_id])
        }
    }

    pub fn get_coordinator(&self, coordinator_id: &Uuid) -> Option<WorkflowCoordinator> {
        self.coordinators.get(coordinator_id).map(|entry| entry.clone())
    }

    pub fn get_specialist(&self, specialist_id: &Uuid) -> Option<SpecializedManager> {
        self.specialists.get(specialist_id).map(|entry| entry.clone())
    }

    pub fn list_coordinators(&self) -> Vec<WorkflowCoordinator> {
        self.coordinators.iter().map(|entry| entry.clone()).collect()
    }

    pub fn list_specialists(&self) -> Vec<SpecializedManager> {
        self.specialists.iter().map(|entry| entry.clone()).collect()
    }

    pub async fn update_coordinator_status(
        &self,
        coordinator_id: Uuid,
        status: CoordinatorStatus,
    ) -> Result<()> {
        if let Some(mut coordinator) = self.coordinators.get_mut(&coordinator_id) {
            coordinator.status = status;
            coordinator.last_activity = Utc::now();
        }
        Ok(())
    }

    pub async fn update_specialist_status(
        &self,
        specialist_id: Uuid,
        status: ManagerStatus,
    ) -> Result<()> {
        if let Some(mut specialist) = self.specialists.get_mut(&specialist_id) {
            specialist.status = status;
            specialist.last_activity = Utc::now();
        }
        Ok(())
    }
}

impl DecisionMatrix {
    pub fn new_with_defaults() -> Self {
        let mut matrix = Self {
            master_authority: vec![
                DecisionType::CrossWorkflowPriorities,
                DecisionType::SystemArchitecture,
                DecisionType::ResourceAllocation,
                DecisionType::BudgetPlanning,
                DecisionType::StrategicDirection,
                DecisionType::EmergencyEscalation,
            ],
            coordinator_authority: HashMap::new(),
            specialist_authority: HashMap::new(),
            escalation_paths: HashMap::new(),
        };

        // Set up escalation paths
        matrix.escalation_paths.insert(
            DecisionType::WorkflowExecution,
            vec![/* coordinator handles this directly */],
        );
        matrix.escalation_paths.insert(
            DecisionType::CrossWorkflowPriorities,
            vec![/* escalates to master */],
        );

        matrix
    }
}

impl Default for DecisionMatrix {
    fn default() -> Self {
        Self::new_with_defaults()
    }
}

impl Default for CoordinatorMetrics {
    fn default() -> Self {
        Self {
            workflows_completed: 0,
            average_completion_time: 0.0,
            quality_score: 0.0,
            team_satisfaction: 0.0,
            escalation_rate: 0.0,
            decisions_made: 0,
            successful_decisions: 0,
        }
    }
}

impl Default for ManagerMetrics {
    fn default() -> Self {
        Self {
            consultations_completed: 0,
            recommendations_accepted: 0,
            average_response_time: 0.0,
            expertise_rating: 0.0,
            cross_team_impact: 0.0,
            decisions_overturned: 0,
        }
    }
}