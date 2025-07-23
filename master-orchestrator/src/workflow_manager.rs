use anyhow::Result;
use chrono::{DateTime, Utc};
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, mpsc};
use tracing::{info, warn};
use uuid::Uuid;

use crate::{WorkflowInfo, WorkflowStatus, WorkflowPriority, SystemEvent};

/// Workflow Manager - Manages the lifecycle of all workflows
/// 
/// Responsibilities:
/// - Track workflow states and transitions
/// - Coordinate with workflow coordinators
/// - Manage workflow queues and priorities
/// - Handle workflow lifecycle events
#[derive(Debug)]
pub struct WorkflowManager {
    workflows: Arc<DashMap<Uuid, ManagedWorkflow>>,
    workflow_queue: Arc<DashMap<WorkflowPriority, Vec<Uuid>>>,
    workflow_types: Arc<DashMap<String, WorkflowTypeConfig>>,
    event_tx: broadcast::Sender<SystemEvent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManagedWorkflow {
    pub info: WorkflowInfo,
    pub coordinator_id: Option<Uuid>,
    pub phase_history: Vec<PhaseTransition>,
    pub dependencies: Vec<Uuid>,
    pub dependents: Vec<Uuid>,
    pub config: serde_json::Value,
    pub state_data: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhaseTransition {
    pub from_phase: Option<WorkflowStatus>,
    pub to_phase: WorkflowStatus,
    pub timestamp: DateTime<Utc>,
    pub reason: String,
    pub triggered_by: Option<Uuid>,
    pub duration_seconds: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowTypeConfig {
    pub workflow_type: String,
    pub display_name: String,
    pub description: String,
    pub default_priority: WorkflowPriority,
    pub estimated_duration_hours: f64,
    pub required_agents: Vec<AgentRole>,
    pub phases: Vec<WorkflowPhase>,
    pub resource_requirements: ResourceRequirements,
    pub success_criteria: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowPhase {
    pub name: String,
    pub description: String,
    pub required: bool,
    pub estimated_duration_minutes: u32,
    pub success_criteria: Vec<String>,
    pub outputs: Vec<String>,
    pub dependencies: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentRole {
    pub role: String,
    pub specialization: Option<String>,
    pub required_count: u32,
    pub optional_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceRequirements {
    pub min_cpu_cores: f64,
    pub recommended_cpu_cores: f64,
    pub min_memory_mb: u64,
    pub recommended_memory_mb: u64,
    pub disk_space_mb: u64,
    pub network_intensive: bool,
}

#[derive(Debug, Clone)]
pub enum WorkflowCommand {
    CreateWorkflow {
        workflow_type: String,
        priority: WorkflowPriority,
        config: serde_json::Value,
    },
    StartWorkflow {
        workflow_id: Uuid,
    },
    PauseWorkflow {
        workflow_id: Uuid,
    },
    ResumeWorkflow {
        workflow_id: Uuid,
    },
    CompleteWorkflow {
        workflow_id: Uuid,
        success: bool,
        results: serde_json::Value,
    },
    UpdateWorkflowPhase {
        workflow_id: Uuid,
        new_phase: WorkflowStatus,
        reason: String,
    },
    AddDependency {
        workflow_id: Uuid,
        depends_on: Uuid,
    },
    RemoveDependency {
        workflow_id: Uuid,
        depends_on: Uuid,
    },
}

impl WorkflowManager {
    pub fn new(event_tx: broadcast::Sender<SystemEvent>) -> Self {
        let manager = Self {
            workflows: Arc::new(DashMap::new()),
            workflow_queue: Arc::new(DashMap::new()),
            workflow_types: Arc::new(DashMap::new()),
            event_tx,
        };

        // Initialize with default workflow types
        manager.initialize_workflow_types();
        manager
    }

    fn initialize_workflow_types(&self) {
        let workflow_types = vec![
            // Core Development Workflows
            ("hivemind", "Multi-agent Coordination", "Multi-agent coordination with queen leadership", 2.0, vec![
                AgentRole { role: "coordinator".to_string(), specialization: Some("queen".to_string()), required_count: 1, optional_count: 0 },
                AgentRole { role: "developer".to_string(), specialization: None, required_count: 2, optional_count: 3 },
            ]),
            ("swarm", "Parallel Task Execution", "Parallel task execution with load balancing", 1.5, vec![
                AgentRole { role: "coordinator".to_string(), specialization: Some("load_balancer".to_string()), required_count: 1, optional_count: 0 },
                AgentRole { role: "worker".to_string(), specialization: None, required_count: 3, optional_count: 5 },
            ]),
            ("deep-research", "Deep Research", "Context7 + sequential thinking integration", 3.0, vec![
                AgentRole { role: "researcher".to_string(), specialization: Some("context7".to_string()), required_count: 1, optional_count: 1 },
                AgentRole { role: "analyst".to_string(), specialization: Some("sequential_thinking".to_string()), required_count: 1, optional_count: 0 },
            ]),
            ("code-review", "Code Review", "Security + quality analysis pipeline", 1.0, vec![
                AgentRole { role: "reviewer".to_string(), specialization: Some("security".to_string()), required_count: 1, optional_count: 0 },
                AgentRole { role: "reviewer".to_string(), specialization: Some("quality".to_string()), required_count: 1, optional_count: 0 },
            ]),
            ("refactor", "Code Refactoring", "Architecture improvement with safety checks", 4.0, vec![
                AgentRole { role: "architect".to_string(), specialization: None, required_count: 1, optional_count: 0 },
                AgentRole { role: "developer".to_string(), specialization: Some("refactoring".to_string()), required_count: 2, optional_count: 1 },
                AgentRole { role: "tester".to_string(), specialization: None, required_count: 1, optional_count: 0 },
            ]),

            // Specialized Development Workflows
            ("documentation-generation", "Documentation Generation", "Comprehensive docs with EARS requirements", 2.5, vec![
                AgentRole { role: "writer".to_string(), specialization: Some("technical".to_string()), required_count: 1, optional_count: 1 },
                AgentRole { role: "reviewer".to_string(), specialization: Some("documentation".to_string()), required_count: 1, optional_count: 0 },
            ]),
            ("security-audit", "Security Audit", "Full security analysis following EARS specifications", 3.5, vec![
                AgentRole { role: "auditor".to_string(), specialization: Some("security".to_string()), required_count: 2, optional_count: 1 },
                AgentRole { role: "analyst".to_string(), specialization: Some("vulnerability".to_string()), required_count: 1, optional_count: 0 },
            ]),
            ("performance-optimization", "Performance Optimization", "Benchmarking and optimization with measurable criteria", 4.0, vec![
                AgentRole { role: "profiler".to_string(), specialization: None, required_count: 1, optional_count: 0 },
                AgentRole { role: "optimizer".to_string(), specialization: None, required_count: 1, optional_count: 1 },
                AgentRole { role: "tester".to_string(), specialization: Some("performance".to_string()), required_count: 1, optional_count: 0 },
            ]),
            ("deployment-pipeline", "Deployment Pipeline", "CI/CD with spec-driven gate approvals", 3.0, vec![
                AgentRole { role: "devops".to_string(), specialization: Some("cicd".to_string()), required_count: 1, optional_count: 0 },
                AgentRole { role: "tester".to_string(), specialization: Some("integration".to_string()), required_count: 1, optional_count: 0 },
            ]),
            ("testing-automation", "Testing Automation", "Test suite creation with TDD validation", 2.5, vec![
                AgentRole { role: "tester".to_string(), specialization: Some("automation".to_string()), required_count: 1, optional_count: 1 },
                AgentRole { role: "developer".to_string(), specialization: Some("tdd".to_string()), required_count: 1, optional_count: 0 },
            ]),

            // Advanced Workflows
            ("api-development", "API Development", "REST/GraphQL with EARS API contracts", 3.5, vec![
                AgentRole { role: "architect".to_string(), specialization: Some("api".to_string()), required_count: 1, optional_count: 0 },
                AgentRole { role: "developer".to_string(), specialization: Some("backend".to_string()), required_count: 2, optional_count: 1 },
                AgentRole { role: "tester".to_string(), specialization: Some("api".to_string()), required_count: 1, optional_count: 0 },
            ]),
            ("database-design", "Database Design", "Schema design with specification-driven constraints", 2.0, vec![
                AgentRole { role: "architect".to_string(), specialization: Some("database".to_string()), required_count: 1, optional_count: 0 },
                AgentRole { role: "developer".to_string(), specialization: Some("database".to_string()), required_count: 1, optional_count: 0 },
            ]),
            ("monitoring-setup", "Monitoring Setup", "Observability with measurable SLA requirements", 2.5, vec![
                AgentRole { role: "devops".to_string(), specialization: Some("monitoring".to_string()), required_count: 1, optional_count: 0 },
                AgentRole { role: "developer".to_string(), specialization: Some("instrumentation".to_string()), required_count: 1, optional_count: 0 },
            ]),
            ("containerization", "Containerization", "Docker/K8s with spec-driven deployment criteria", 2.0, vec![
                AgentRole { role: "devops".to_string(), specialization: Some("containers".to_string()), required_count: 1, optional_count: 0 },
                AgentRole { role: "developer".to_string(), specialization: None, required_count: 1, optional_count: 0 },
            ]),
            ("integration-testing", "Integration Testing", "Cross-system testing with EARS interface specs", 3.0, vec![
                AgentRole { role: "tester".to_string(), specialization: Some("integration".to_string()), required_count: 2, optional_count: 1 },
                AgentRole { role: "developer".to_string(), specialization: Some("integration".to_string()), required_count: 1, optional_count: 0 },
            ]),

            // Specialized Workflows
            ("bug-hunting", "Bug Detection", "Issue detection with reproducible specifications", 2.0, vec![
                AgentRole { role: "tester".to_string(), specialization: Some("bug_hunter".to_string()), required_count: 1, optional_count: 1 },
                AgentRole { role: "developer".to_string(), specialization: Some("debugging".to_string()), required_count: 1, optional_count: 0 },
            ]),
            ("feature-development", "Feature Development", "End-to-end feature with EARS requirements", 5.0, vec![
                AgentRole { role: "product_owner".to_string(), specialization: None, required_count: 1, optional_count: 0 },
                AgentRole { role: "developer".to_string(), specialization: None, required_count: 2, optional_count: 2 },
                AgentRole { role: "tester".to_string(), specialization: None, required_count: 1, optional_count: 1 },
                AgentRole { role: "designer".to_string(), specialization: Some("ux".to_string()), required_count: 0, optional_count: 1 },
            ]),
            ("infrastructure-as-code", "Infrastructure as Code", "IaC with specification-driven compliance", 3.0, vec![
                AgentRole { role: "devops".to_string(), specialization: Some("iac".to_string()), required_count: 1, optional_count: 0 },
                AgentRole { role: "security".to_string(), specialization: Some("compliance".to_string()), required_count: 1, optional_count: 0 },
            ]),
            ("data-pipeline", "Data Pipeline", "ETL with spec-driven data quality requirements", 4.0, vec![
                AgentRole { role: "data_engineer".to_string(), specialization: None, required_count: 1, optional_count: 1 },
                AgentRole { role: "data_scientist".to_string(), specialization: Some("quality".to_string()), required_count: 1, optional_count: 0 },
            ]),
            ("custom-prompt", "Custom Workflow", "User-defined workflow with EARS format requirements", 3.0, vec![
                AgentRole { role: "coordinator".to_string(), specialization: None, required_count: 1, optional_count: 0 },
                AgentRole { role: "specialist".to_string(), specialization: None, required_count: 1, optional_count: 2 },
            ]),
        ];

        for (type_name, display_name, description, duration, agents) in workflow_types {
            let config = WorkflowTypeConfig {
                workflow_type: type_name.to_string(),
                display_name: display_name.to_string(),
                description: description.to_string(),
                default_priority: WorkflowPriority::Medium,
                estimated_duration_hours: duration,
                required_agents: agents,
                phases: Self::create_default_phases(),
                resource_requirements: ResourceRequirements {
                    min_cpu_cores: 1.0,
                    recommended_cpu_cores: 2.0,
                    min_memory_mb: 512,
                    recommended_memory_mb: 1024,
                    disk_space_mb: 1024,
                    network_intensive: false,
                },
                success_criteria: vec![
                    "All phases completed successfully".to_string(),
                    "Quality gates passed".to_string(),
                    "No critical issues remaining".to_string(),
                ],
            };

            self.workflow_types.insert(type_name.to_string(), config);
        }

        info!("Initialized {} workflow types", self.workflow_types.len());
    }

    fn create_default_phases() -> Vec<WorkflowPhase> {
        vec![
            WorkflowPhase {
                name: "Planning".to_string(),
                description: "Establish project scope and objectives".to_string(),
                required: true,
                estimated_duration_minutes: 30,
                success_criteria: vec!["Clear objectives defined".to_string()],
                outputs: vec!["project_plan.md".to_string()],
                dependencies: vec![],
            },
            WorkflowPhase {
                name: "Requirements".to_string(),
                description: "EARS format specification (WHEN... THEN...)".to_string(),
                required: true,
                estimated_duration_minutes: 60,
                success_criteria: vec!["All requirements in EARS format".to_string()],
                outputs: vec!["requirements.md".to_string()],
                dependencies: vec!["Planning".to_string()],
            },
            WorkflowPhase {
                name: "Design".to_string(),
                description: "System architecture and component design".to_string(),
                required: true,
                estimated_duration_minutes: 90,
                success_criteria: vec!["Architecture diagram complete".to_string()],
                outputs: vec!["design.md".to_string(), "architecture.md".to_string()],
                dependencies: vec!["Requirements".to_string()],
            },
            WorkflowPhase {
                name: "Tasks".to_string(),
                description: "Granular task breakdown with acceptance criteria".to_string(),
                required: true,
                estimated_duration_minutes: 45,
                success_criteria: vec!["All tasks have clear acceptance criteria".to_string()],
                outputs: vec!["tasks.md".to_string()],
                dependencies: vec!["Design".to_string()],
            },
            WorkflowPhase {
                name: "Execute".to_string(),
                description: "TDD cycle implementation (Red → Green → Refactor)".to_string(),
                required: true,
                estimated_duration_minutes: 240,
                success_criteria: vec!["All tests passing".to_string(), "Code review completed".to_string()],
                outputs: vec!["implementation/".to_string(), "tests/".to_string()],
                dependencies: vec!["Tasks".to_string()],
            },
        ]
    }

    pub async fn create_workflow(
        &self,
        workflow_type: String,
        priority: WorkflowPriority,
        config: serde_json::Value,
    ) -> Result<Uuid> {
        let workflow_id = Uuid::new_v4();

        // Get workflow type configuration
        let type_config = self.workflow_types.get(&workflow_type)
            .ok_or_else(|| anyhow::anyhow!("Unknown workflow type: {}", workflow_type))?;

        let workflow_info = WorkflowInfo {
            id: workflow_id,
            workflow_type: workflow_type.clone(),
            coordinator_id: None,
            status: WorkflowStatus::Queued,
            priority: priority.clone(),
            created_at: Utc::now(),
            started_at: None,
            completed_at: None,
            estimated_completion: Some(Utc::now() + 
                chrono::Duration::hours(type_config.estimated_duration_hours as i64)),
            resource_allocation: crate::ResourceAllocation {
                cpu_cores: type_config.resource_requirements.recommended_cpu_cores,
                memory_mb: type_config.resource_requirements.recommended_memory_mb,
                agent_count: type_config.required_agents.iter()
                    .map(|a| a.required_count + a.optional_count)
                    .sum(),
                estimated_duration_hours: type_config.estimated_duration_hours,
            },
            metrics: crate::WorkflowMetrics {
                progress_percentage: 0.0,
                tasks_completed: 0,
                tasks_total: type_config.phases.len() as u32,
                issues_count: 0,
                quality_score: 0.0,
                velocity: 0.0,
            },
        };

        let managed_workflow = ManagedWorkflow {
            info: workflow_info,
            coordinator_id: None,
            phase_history: vec![PhaseTransition {
                from_phase: None,
                to_phase: WorkflowStatus::Queued,
                timestamp: Utc::now(),
                reason: "Workflow created".to_string(),
                triggered_by: None,
                duration_seconds: None,
            }],
            dependencies: Vec::new(),
            dependents: Vec::new(),
            config,
            state_data: HashMap::new(),
        };

        self.workflows.insert(workflow_id, managed_workflow);

        // Add to priority queue
        self.workflow_queue
            .entry(priority.clone())
            .or_insert_with(Vec::new)
            .push(workflow_id);

        // Emit event
        let _ = self.event_tx.send(SystemEvent::WorkflowCreated {
            workflow_id,
            workflow_type,
        });

        info!("Created workflow {} with priority {:?}", workflow_id, priority);
        Ok(workflow_id)
    }

    pub async fn transition_workflow_phase(
        &self,
        workflow_id: Uuid,
        new_phase: WorkflowStatus,
        reason: String,
        triggered_by: Option<Uuid>,
    ) -> Result<()> {
        if let Some(mut workflow) = self.workflows.get_mut(&workflow_id) {
            let old_phase = workflow.info.status.clone();
            let transition_time = Utc::now();

            // Calculate duration if transitioning from a previous phase
            let duration_seconds = if let Some(last_transition) = workflow.phase_history.last() {
                Some((transition_time - last_transition.timestamp).num_seconds() as u64)
            } else {
                None
            };

            // Create phase transition record
            let transition = PhaseTransition {
                from_phase: Some(old_phase.clone()),
                to_phase: new_phase.clone(),
                timestamp: transition_time,
                reason,
                triggered_by,
                duration_seconds,
            };

            workflow.phase_history.push(transition);
            workflow.info.status = new_phase.clone();

            // Update timestamps based on phase
            match new_phase {
                WorkflowStatus::Planning => {
                    workflow.info.started_at = Some(transition_time);
                }
                WorkflowStatus::Completed | WorkflowStatus::Failed => {
                    workflow.info.completed_at = Some(transition_time);
                }
                _ => {}
            }

            // Update progress
            let progress = match new_phase {
                WorkflowStatus::Queued => 0.0,
                WorkflowStatus::Planning => 10.0,
                WorkflowStatus::Requirements => 25.0,
                WorkflowStatus::Design => 50.0,
                WorkflowStatus::Tasks => 70.0,
                WorkflowStatus::Execute => 90.0,
                WorkflowStatus::Completed => 100.0,
                WorkflowStatus::Failed => workflow.info.metrics.progress_percentage, // Keep current
                WorkflowStatus::Paused => workflow.info.metrics.progress_percentage,  // Keep current
            };
            workflow.info.metrics.progress_percentage = progress;

            // Emit event
            let _ = self.event_tx.send(SystemEvent::WorkflowStatusChanged {
                workflow_id,
                old_status: old_phase,
                new_status: new_phase,
            });

            info!("Transitioned workflow {} to phase {:?}", workflow_id, new_phase);
        }

        Ok(())
    }

    pub fn get_workflow(&self, workflow_id: &Uuid) -> Option<ManagedWorkflow> {
        self.workflows.get(workflow_id).map(|entry| entry.clone())
    }

    pub fn list_workflows(&self) -> Vec<ManagedWorkflow> {
        self.workflows.iter().map(|entry| entry.clone()).collect()
    }

    pub fn list_workflows_by_status(&self, status: &WorkflowStatus) -> Vec<ManagedWorkflow> {
        self.workflows
            .iter()
            .filter(|entry| entry.info.status == *status)
            .map(|entry| entry.clone())
            .collect()
    }

    pub fn get_workflow_type_config(&self, workflow_type: &str) -> Option<WorkflowTypeConfig> {
        self.workflow_types.get(workflow_type).map(|entry| entry.clone())
    }

    pub fn list_workflow_types(&self) -> Vec<WorkflowTypeConfig> {
        self.workflow_types.iter().map(|entry| entry.clone()).collect()
    }

    pub async fn add_dependency(&self, workflow_id: Uuid, depends_on: Uuid) -> Result<()> {
        // Add dependency to workflow
        if let Some(mut workflow) = self.workflows.get_mut(&workflow_id) {
            if !workflow.dependencies.contains(&depends_on) {
                workflow.dependencies.push(depends_on);
            }
        }

        // Add as dependent to the dependency
        if let Some(mut dependency) = self.workflows.get_mut(&depends_on) {
            if !dependency.dependents.contains(&workflow_id) {
                dependency.dependents.push(workflow_id);
            }
        }

        info!("Added dependency: workflow {} depends on {}", workflow_id, depends_on);
        Ok(())
    }

    pub async fn remove_dependency(&self, workflow_id: Uuid, depends_on: Uuid) -> Result<()> {
        // Remove dependency from workflow
        if let Some(mut workflow) = self.workflows.get_mut(&workflow_id) {
            workflow.dependencies.retain(|&id| id != depends_on);
        }

        // Remove as dependent from the dependency
        if let Some(mut dependency) = self.workflows.get_mut(&depends_on) {
            dependency.dependents.retain(|&id| id != workflow_id);
        }

        info!("Removed dependency: workflow {} no longer depends on {}", workflow_id, depends_on);
        Ok(())
    }

    pub fn get_ready_workflows(&self) -> Vec<Uuid> {
        self.workflows
            .iter()
            .filter(|entry| {
                entry.info.status == WorkflowStatus::Queued &&
                entry.dependencies.iter().all(|&dep_id| {
                    if let Some(dep) = self.workflows.get(&dep_id) {
                        dep.info.status == WorkflowStatus::Completed
                    } else {
                        true // Dependency doesn't exist, consider it completed
                    }
                })
            })
            .map(|entry| entry.info.id)
            .collect()
    }

    pub fn get_next_workflow_by_priority(&self) -> Option<Uuid> {
        let priorities = [
            WorkflowPriority::Critical,
            WorkflowPriority::High,
            WorkflowPriority::Medium,
            WorkflowPriority::Low,
        ];

        for priority in priorities {
            if let Some(queue) = self.workflow_queue.get(&priority) {
                for &workflow_id in queue.iter() {
                    if let Some(workflow) = self.workflows.get(&workflow_id) {
                        if workflow.info.status == WorkflowStatus::Queued {
                            // Check if dependencies are satisfied
                            let dependencies_satisfied = workflow.dependencies.iter().all(|&dep_id| {
                                if let Some(dep) = self.workflows.get(&dep_id) {
                                    dep.info.status == WorkflowStatus::Completed
                                } else {
                                    true
                                }
                            });

                            if dependencies_satisfied {
                                return Some(workflow_id);
                            }
                        }
                    }
                }
            }
        }

        None
    }
}

impl Clone for WorkflowManager {
    fn clone(&self) -> Self {
        Self {
            workflows: self.workflows.clone(),
            workflow_queue: self.workflow_queue.clone(),
            workflow_types: self.workflow_types.clone(),
            event_tx: self.event_tx.clone(),
        }
    }
}