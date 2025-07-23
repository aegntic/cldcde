use anyhow::Result;
use chrono::{DateTime, Utc};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{info, warn};

use crate::WorkflowPhase;

/// Phase Manager - Manages the 5-phase workflow execution
/// 
/// PHASE 1: PLAN → Establish project scope and objectives
/// PHASE 2: REQUIREMENTS → EARS format specification ("WHEN... THEN...")  
/// PHASE 3: DESIGN → System architecture and component design
/// PHASE 4: TASKS → Granular task breakdown with acceptance criteria
/// PHASE 5: EXECUTE → TDD cycle implementation (Red → Green → Refactor)
#[derive(Debug)]
pub struct PhaseManager {
    workflow_type: String,
    state: Arc<RwLock<PhaseState>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhaseState {
    pub current_phase: WorkflowPhase,
    pub phase_history: Vec<PhaseTransition>,
    pub phase_requirements: PhaseRequirements,
    pub completion_criteria: Vec<String>,
    pub outputs_generated: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhaseTransition {
    pub from_phase: Option<WorkflowPhase>,
    pub to_phase: WorkflowPhase,
    pub timestamp: DateTime<Utc>,
    pub requirements_met: bool,
    pub outputs: Vec<String>,
    pub quality_score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhaseRequirements {
    pub planning: PlanningRequirements,
    pub requirements: RequirementsPhaseRequirements,
    pub design: DesignRequirements,
    pub tasks: TasksRequirements,
    pub execute: ExecuteRequirements,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanningRequirements {
    pub objectives_defined: bool,
    pub scope_documented: bool,
    pub stakeholders_identified: bool,
    pub timeline_estimated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequirementsPhaseRequirements {
    pub ears_format_used: bool,
    pub functional_requirements: u32,
    pub non_functional_requirements: u32,
    pub acceptance_criteria_defined: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesignRequirements {
    pub architecture_documented: bool,
    pub components_identified: bool,
    pub interfaces_defined: bool,
    pub data_flow_mapped: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TasksRequirements {
    pub tasks_broken_down: bool,
    pub acceptance_criteria_per_task: bool,
    pub dependencies_mapped: bool,
    pub effort_estimated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecuteRequirements {
    pub tdd_cycle_followed: bool,
    pub tests_written_first: bool,
    pub code_reviewed: bool,
    pub refactoring_completed: bool,
}

impl PhaseManager {
    pub fn new(workflow_type: String) -> Self {
        Self {
            workflow_type: workflow_type.clone(),
            state: Arc::new(RwLock::new(PhaseState {
                current_phase: WorkflowPhase::Planning,
                phase_history: Vec::new(),
                phase_requirements: PhaseRequirements::default(),
                completion_criteria: Self::get_default_criteria(&workflow_type),
                outputs_generated: Vec::new(),
            })),
        }
    }

    pub async fn start(&self) -> Result<()> {
        info!("Starting Phase Manager for workflow type {}", self.workflow_type);
        Ok(())
    }

    pub async fn initialize_phase(&self, phase: WorkflowPhase) -> Result<()> {
        let mut state = self.state.write();
        
        state.current_phase = phase.clone();
        state.phase_history.push(PhaseTransition {
            from_phase: None,
            to_phase: phase.clone(),
            timestamp: Utc::now(),
            requirements_met: false,
            outputs: Vec::new(),
            quality_score: 0.0,
        });

        info!("Initialized phase: {:?}", phase);
        Ok(())
    }

    pub async fn can_transition_to(&self, target_phase: &WorkflowPhase) -> Result<bool> {
        let state = self.state.read();
        
        // Check if current phase requirements are met
        let requirements_met = match state.current_phase {
            WorkflowPhase::Planning => state.phase_requirements.planning.all_met(),
            WorkflowPhase::Requirements => state.phase_requirements.requirements.all_met(),
            WorkflowPhase::Design => state.phase_requirements.design.all_met(),
            WorkflowPhase::Tasks => state.phase_requirements.tasks.all_met(),
            WorkflowPhase::Execute => state.phase_requirements.execute.all_met(),
        };

        // Check if transition is valid (sequential progression)
        let valid_transition = match (&state.current_phase, target_phase) {
            (WorkflowPhase::Planning, WorkflowPhase::Requirements) => true,
            (WorkflowPhase::Requirements, WorkflowPhase::Design) => true,
            (WorkflowPhase::Design, WorkflowPhase::Tasks) => true,
            (WorkflowPhase::Tasks, WorkflowPhase::Execute) => true,
            // Allow same phase (for re-entry)
            (current, target) if current == target => true,
            _ => false,
        };

        Ok(requirements_met && valid_transition)
    }

    pub async fn transition_to_phase(&self, target_phase: WorkflowPhase) -> Result<()> {
        let mut state = self.state.write();
        
        let old_phase = state.current_phase.clone();
        
        // Create transition record
        let transition = PhaseTransition {
            from_phase: Some(old_phase.clone()),
            to_phase: target_phase.clone(),
            timestamp: Utc::now(),
            requirements_met: true,
            outputs: Self::get_phase_outputs(&target_phase),
            quality_score: 85.0, // Placeholder quality score
        };

        state.phase_history.push(transition);
        state.current_phase = target_phase.clone();
        state.outputs_generated.extend(Self::get_phase_outputs(&target_phase));

        info!("Transitioned from {:?} to {:?}", old_phase, target_phase);
        Ok(())
    }

    pub async fn finalize_current_phase(&self) -> Result<()> {
        let state = self.state.read();
        info!("Finalized phase: {:?}", state.current_phase);
        Ok(())
    }

    fn get_default_criteria(workflow_type: &str) -> Vec<String> {
        match workflow_type {
            "hivemind" => vec![
                "Queen agent established with clear authority".to_string(),
                "Worker agents coordinated effectively".to_string(),
                "Task distribution optimized".to_string(),
            ],
            "swarm" => vec![
                "Load balancing implemented".to_string(),
                "Parallel execution achieved".to_string(),
                "Resource utilization optimized".to_string(),
            ],
            "code-review" => vec![
                "Security analysis completed".to_string(),
                "Quality standards enforced".to_string(),
                "All issues addressed".to_string(),
            ],
            _ => vec![
                "All phase objectives met".to_string(),
                "Quality gates passed".to_string(),
                "Deliverables validated".to_string(),
            ],
        }
    }

    fn get_phase_outputs(phase: &WorkflowPhase) -> Vec<String> {
        match phase {
            WorkflowPhase::Planning => vec![
                "project_scope.md".to_string(),
                "objectives.md".to_string(),
                "timeline.md".to_string(),
            ],
            WorkflowPhase::Requirements => vec![
                "requirements.md".to_string(),
                "ears_specifications.md".to_string(),
                "acceptance_criteria.md".to_string(),
            ],
            WorkflowPhase::Design => vec![
                "architecture.md".to_string(),
                "system_design.md".to_string(),
                "component_diagram.png".to_string(),
            ],
            WorkflowPhase::Tasks => vec![
                "task_breakdown.md".to_string(),
                "task_dependencies.md".to_string(),
                "effort_estimates.md".to_string(),
            ],
            WorkflowPhase::Execute => vec![
                "implementation/".to_string(),
                "tests/".to_string(),
                "documentation/".to_string(),
            ],
        }
    }
}

impl PlanningRequirements {
    fn all_met(&self) -> bool {
        self.objectives_defined && self.scope_documented && 
        self.stakeholders_identified && self.timeline_estimated
    }
}

impl RequirementsPhaseRequirements {
    fn all_met(&self) -> bool {
        self.ears_format_used && self.functional_requirements > 0 && 
        self.non_functional_requirements > 0 && self.acceptance_criteria_defined
    }
}

impl DesignRequirements {
    fn all_met(&self) -> bool {
        self.architecture_documented && self.components_identified && 
        self.interfaces_defined && self.data_flow_mapped
    }
}

impl TasksRequirements {
    fn all_met(&self) -> bool {
        self.tasks_broken_down && self.acceptance_criteria_per_task && 
        self.dependencies_mapped && self.effort_estimated
    }
}

impl ExecuteRequirements {
    fn all_met(&self) -> bool {
        self.tdd_cycle_followed && self.tests_written_first && 
        self.code_reviewed && self.refactoring_completed
    }
}

impl Default for PhaseRequirements {
    fn default() -> Self {
        Self {
            planning: PlanningRequirements {
                objectives_defined: false,
                scope_documented: false,
                stakeholders_identified: false,
                timeline_estimated: false,
            },
            requirements: RequirementsPhaseRequirements {
                ears_format_used: false,
                functional_requirements: 0,
                non_functional_requirements: 0,
                acceptance_criteria_defined: false,
            },
            design: DesignRequirements {
                architecture_documented: false,
                components_identified: false,
                interfaces_defined: false,
                data_flow_mapped: false,
            },
            tasks: TasksRequirements {
                tasks_broken_down: false,
                acceptance_criteria_per_task: false,
                dependencies_mapped: false,
                effort_estimated: false,
            },
            execute: ExecuteRequirements {
                tdd_cycle_followed: false,
                tests_written_first: false,
                code_reviewed: false,
                refactoring_completed: false,
            },
        }
    }
}