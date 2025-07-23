use anyhow::Result;
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{info, warn};
use uuid::Uuid;

/// Agent Manager - Manages team of agents within a workflow
#[derive(Debug)]
pub struct AgentManager {
    coordinator_id: Uuid,
    agents: Arc<DashMap<Uuid, ManagedAgent>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManagedAgent {
    pub id: Uuid,
    pub role: String,
    pub status: AgentStatus,
    pub assigned_tasks: Vec<String>,
    pub performance_metrics: AgentMetrics,
    pub tmux_session: Option<String>,
    pub tmux_window: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AgentStatus {
    Assigned,
    Active,
    Busy,
    Idle,
    Paused,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMetrics {
    pub tasks_completed: u32,
    pub quality_score: f64,
    pub response_time_avg: f64,
    pub collaboration_score: f64,
}

impl AgentManager {
    pub fn new(coordinator_id: Uuid) -> Self {
        Self {
            coordinator_id,
            agents: Arc::new(DashMap::new()),
        }
    }

    pub async fn start(&self) -> Result<()> {
        info!("Starting Agent Manager for coordinator {}", self.coordinator_id);
        Ok(())
    }

    pub async fn assign_agent(&self, agent_id: Uuid, role: String, tasks: Vec<String>) -> Result<()> {
        let agent = ManagedAgent {
            id: agent_id,
            role: role.clone(),
            status: AgentStatus::Assigned,
            assigned_tasks: tasks.clone(),
            performance_metrics: AgentMetrics::default(),
            tmux_session: None,
            tmux_window: None,
        };

        self.agents.insert(agent_id, agent);
        info!("Assigned agent {} to role {} with {} tasks", agent_id, role, tasks.len());
        Ok(())
    }

    pub async fn remove_agent(&self, agent_id: Uuid) -> Result<Option<String>> {
        if let Some((_, agent)) = self.agents.remove(&agent_id) {
            info!("Removed agent {} from role {}", agent_id, agent.role);
            Ok(Some(agent.role))
        } else {
            warn!("Attempted to remove non-existent agent {}", agent_id);
            Ok(None)
        }
    }

    pub async fn pause_all_agents(&self) -> Result<()> {
        for mut agent in self.agents.iter_mut() {
            agent.status = AgentStatus::Paused;
        }
        info!("Paused all agents");
        Ok(())
    }

    pub async fn resume_all_agents(&self) -> Result<()> {
        for mut agent in self.agents.iter_mut() {
            if matches!(agent.status, AgentStatus::Paused) {
                agent.status = AgentStatus::Active;
            }
        }
        info!("Resumed all agents");
        Ok(())
    }

    pub async fn finalize_all_agents(&self) -> Result<()> {
        for mut agent in self.agents.iter_mut() {
            agent.status = AgentStatus::Completed;
        }
        info!("Finalized all agents");
        Ok(())
    }
}

impl Default for AgentMetrics {
    fn default() -> Self {
        Self {
            tasks_completed: 0,
            quality_score: 0.0,
            response_time_avg: 0.0,
            collaboration_score: 0.0,
        }
    }
}