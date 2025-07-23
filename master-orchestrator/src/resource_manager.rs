use anyhow::Result;
use chrono::{DateTime, Utc};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::time::{interval, Duration};
use tracing::{info, warn};

/// Resource Manager - Handles capacity and resource allocation
/// 
/// Responsibilities:
/// - Monitor system resource usage
/// - Allocate resources to workflows
/// - Manage capacity scaling
/// - Prevent resource exhaustion
#[derive(Debug)]
pub struct ResourceManager {
    state: Arc<RwLock<ResourceState>>,
    limits: ResourceLimits,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceState {
    pub total_cpu_cores: f64,
    pub available_cpu_cores: f64,
    pub total_memory_mb: u64,
    pub available_memory_mb: u64,
    pub active_agents: u32,
    pub max_agents: u32,
    pub active_workflows: u32,
    pub max_workflows: u32,
    pub last_updated: DateTime<Utc>,
    pub utilization_history: Vec<ResourceSnapshot>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceSnapshot {
    pub timestamp: DateTime<Utc>,
    pub cpu_utilization: f64,
    pub memory_utilization: f64,
    pub agent_count: u32,
    pub workflow_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceLimits {
    pub max_cpu_cores: f64,
    pub max_memory_mb: u64,
    pub max_agents_per_workflow: u32,
    pub max_concurrent_workflows: u32,
    pub cpu_threshold_warning: f64,
    pub cpu_threshold_critical: f64,
    pub memory_threshold_warning: f64,
    pub memory_threshold_critical: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceRequest {
    pub workflow_id: uuid::Uuid,
    pub cpu_cores: f64,
    pub memory_mb: u64,
    pub agent_count: u32,
    pub estimated_duration_hours: f64,
    pub priority: crate::WorkflowPriority,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceAllocation {
    pub workflow_id: uuid::Uuid,
    pub allocated_cpu: f64,
    pub allocated_memory: u64,
    pub allocated_agents: u32,
    pub allocated_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
}

impl ResourceManager {
    pub fn new() -> Self {
        Self {
            state: Arc::new(RwLock::new(ResourceState {
                total_cpu_cores: num_cpus::get() as f64,
                available_cpu_cores: num_cpus::get() as f64,
                total_memory_mb: Self::get_total_memory_mb(),
                available_memory_mb: Self::get_total_memory_mb(),
                active_agents: 0,
                max_agents: 100,
                active_workflows: 0,
                max_workflows: 20,
                last_updated: Utc::now(),
                utilization_history: Vec::new(),
            })),
            limits: ResourceLimits {
                max_cpu_cores: num_cpus::get() as f64,
                max_memory_mb: Self::get_total_memory_mb(),
                max_agents_per_workflow: 10,
                max_concurrent_workflows: 20,
                cpu_threshold_warning: 0.75,
                cpu_threshold_critical: 0.90,
                memory_threshold_warning: 0.80,
                memory_threshold_critical: 0.95,
            },
        }
    }

    pub async fn start(&self) -> Result<()> {
        info!("Starting Resource Manager");
        
        // Start resource monitoring loop
        let state_clone = self.state.clone();
        let limits_clone = self.limits.clone();
        
        tokio::spawn(async move {
            let mut interval = interval(Duration::from_secs(30));
            
            loop {
                interval.tick().await;
                
                if let Err(e) = Self::update_resource_metrics(&state_clone, &limits_clone).await {
                    warn!("Error updating resource metrics: {}", e);
                }
            }
        });

        info!("Resource Manager started successfully");
        Ok(())
    }

    async fn update_resource_metrics(
        state: &Arc<RwLock<ResourceState>>,
        _limits: &ResourceLimits,
    ) -> Result<()> {
        let current_cpu = Self::get_cpu_usage();
        let current_memory = Self::get_memory_usage();
        
        let mut state_guard = state.write();
        
        // Update current metrics
        state_guard.available_cpu_cores = state_guard.total_cpu_cores * (1.0 - current_cpu);
        state_guard.available_memory_mb = (state_guard.total_memory_mb as f64 * (1.0 - current_memory)) as u64;
        state_guard.last_updated = Utc::now();
        
        // Add to history (keep last 100 snapshots)
        let snapshot = ResourceSnapshot {
            timestamp: Utc::now(),
            cpu_utilization: current_cpu,
            memory_utilization: current_memory,
            agent_count: state_guard.active_agents,
            workflow_count: state_guard.active_workflows,
        };
        
        state_guard.utilization_history.push(snapshot);
        if state_guard.utilization_history.len() > 100 {
            state_guard.utilization_history.remove(0);
        }
        
        Ok(())
    }

    pub async fn can_allocate_workflow(&self) -> Result<bool> {
        let state = self.state.read();
        
        Ok(state.active_workflows < state.max_workflows && 
           state.available_cpu_cores >= 1.0 &&
           state.available_memory_mb >= 512)
    }

    pub async fn allocate_resources(&self, request: ResourceRequest) -> Result<Option<ResourceAllocation>> {
        let mut state = self.state.write();
        
        // Check if we can fulfill the request
        if state.available_cpu_cores < request.cpu_cores ||
           state.available_memory_mb < request.memory_mb ||
           state.active_agents + request.agent_count > state.max_agents ||
           state.active_workflows >= state.max_workflows {
            return Ok(None);
        }

        // Allocate resources
        state.available_cpu_cores -= request.cpu_cores;
        state.available_memory_mb -= request.memory_mb;
        state.active_agents += request.agent_count;
        state.active_workflows += 1;
        state.last_updated = Utc::now();

        let allocation = ResourceAllocation {
            workflow_id: request.workflow_id,
            allocated_cpu: request.cpu_cores,
            allocated_memory: request.memory_mb,
            allocated_agents: request.agent_count,
            allocated_at: Utc::now(),
            expires_at: if request.estimated_duration_hours > 0.0 {
                Some(Utc::now() + chrono::Duration::hours(request.estimated_duration_hours as i64))
            } else {
                None
            },
        };

        info!("Allocated resources for workflow {}: CPU={}, Memory={}, Agents={}", 
               request.workflow_id, request.cpu_cores, request.memory_mb, request.agent_count);
        
        Ok(Some(allocation))
    }

    pub async fn deallocate_resources(&self, allocation: &ResourceAllocation) -> Result<()> {
        let mut state = self.state.write();
        
        state.available_cpu_cores += allocation.allocated_cpu;
        state.available_memory_mb += allocation.allocated_memory;
        state.active_agents = state.active_agents.saturating_sub(allocation.allocated_agents);
        state.active_workflows = state.active_workflows.saturating_sub(1);
        state.last_updated = Utc::now();

        info!("Deallocated resources for workflow {}: CPU={}, Memory={}, Agents={}", 
               allocation.workflow_id, allocation.allocated_cpu, 
               allocation.allocated_memory, allocation.allocated_agents);
        
        Ok(())
    }

    pub async fn scale(&self, target_workflows: u32, max_agents_per_workflow: u32) -> Result<()> {
        let mut state = self.state.write();
        
        // Update limits based on scaling request
        state.max_workflows = target_workflows;
        state.max_agents = target_workflows * max_agents_per_workflow;
        
        info!("Scaled resources: max_workflows={}, max_agents={}", 
               state.max_workflows, state.max_agents);
        
        Ok(())
    }

    pub fn get_state(&self) -> ResourceState {
        self.state.read().clone()
    }

    pub fn get_utilization(&self) -> (f64, f64) {
        let state = self.state.read();
        let cpu_utilization = 1.0 - (state.available_cpu_cores / state.total_cpu_cores);
        let memory_utilization = 1.0 - (state.available_memory_mb as f64 / state.total_memory_mb as f64);
        (cpu_utilization, memory_utilization)
    }

    pub fn is_under_pressure(&self) -> bool {
        let (cpu_util, memory_util) = self.get_utilization();
        cpu_util > self.limits.cpu_threshold_warning || memory_util > self.limits.memory_threshold_warning
    }

    pub fn is_critical(&self) -> bool {
        let (cpu_util, memory_util) = self.get_utilization();
        cpu_util > self.limits.cpu_threshold_critical || memory_util > self.limits.memory_threshold_critical
    }

    // Platform-specific resource monitoring methods
    #[cfg(target_os = "linux")]
    fn get_cpu_usage() -> f64 {
        // Simple approximation - in production, use proper system monitoring
        use std::fs;
        
        if let Ok(loadavg) = fs::read_to_string("/proc/loadavg") {
            if let Some(load) = loadavg.split_whitespace().next() {
                if let Ok(load_val) = load.parse::<f64>() {
                    return (load_val / num_cpus::get() as f64).min(1.0);
                }
            }
        }
        0.1 // Default conservative estimate
    }

    #[cfg(not(target_os = "linux"))]
    fn get_cpu_usage() -> f64 {
        0.1 // Default conservative estimate for non-Linux systems
    }

    #[cfg(target_os = "linux")]
    fn get_memory_usage() -> f64 {
        use std::fs;
        
        if let Ok(meminfo) = fs::read_to_string("/proc/meminfo") {
            let mut total = 0u64;
            let mut available = 0u64;
            
            for line in meminfo.lines() {
                if line.starts_with("MemTotal:") {
                    if let Some(val) = line.split_whitespace().nth(1) {
                        total = val.parse().unwrap_or(0);
                    }
                } else if line.starts_with("MemAvailable:") {
                    if let Some(val) = line.split_whitespace().nth(1) {
                        available = val.parse().unwrap_or(0);
                    }
                }
            }
            
            if total > 0 && available > 0 {
                return 1.0 - (available as f64 / total as f64);
            }
        }
        0.5 // Default estimate
    }

    #[cfg(not(target_os = "linux"))]
    fn get_memory_usage() -> f64 {
        0.5 // Default estimate for non-Linux systems
    }

    #[cfg(target_os = "linux")]
    fn get_total_memory_mb() -> u64 {
        use std::fs;
        
        if let Ok(meminfo) = fs::read_to_string("/proc/meminfo") {
            for line in meminfo.lines() {
                if line.starts_with("MemTotal:") {
                    if let Some(val) = line.split_whitespace().nth(1) {
                        if let Ok(kb) = val.parse::<u64>() {
                            return kb / 1024; // Convert KB to MB
                        }
                    }
                }
            }
        }
        4096 // Default to 4GB
    }

    #[cfg(not(target_os = "linux"))]
    fn get_total_memory_mb() -> u64 {
        8192 // Default to 8GB for non-Linux systems
    }
}

impl Clone for ResourceManager {
    fn clone(&self) -> Self {
        Self {
            state: self.state.clone(),
            limits: self.limits.clone(),
        }
    }
}