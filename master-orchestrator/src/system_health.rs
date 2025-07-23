use anyhow::Result;
use chrono::{DateTime, Utc};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::sync::Arc;
use tokio::time::{interval, Duration};
use tracing::{error, info, warn};
use uuid::Uuid;

/// System Health Monitor - Tracks overall system health and performance
/// 
/// Responsibilities:
/// - Monitor system performance metrics
/// - Detect anomalies and degradation
/// - Generate alerts and recommendations
/// - Track historical health trends
#[derive(Debug)]
pub struct SystemHealthMonitor {
    state: Arc<RwLock<HealthState>>,
    metrics_history: Arc<RwLock<VecDeque<HealthMetrics>>>,
    alert_thresholds: HealthThresholds,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthState {
    pub overall_status: SystemHealthStatus,
    pub last_check: DateTime<Utc>,
    pub uptime_seconds: u64,
    pub active_alerts: Vec<HealthAlert>,
    pub system_load: f64,
    pub memory_pressure: f64,
    pub disk_usage: f64,
    pub network_latency: f64,
    pub error_rate: f64,
    pub performance_score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SystemHealthStatus {
    Healthy,
    Warning,
    Degraded,
    Critical,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthMetrics {
    pub timestamp: DateTime<Utc>,
    pub cpu_usage: f64,
    pub memory_usage: f64,
    pub disk_usage: f64,
    pub network_latency: f64,
    pub active_workflows: u32,
    pub active_agents: u32,
    pub error_count: u32,
    pub warning_count: u32,
    pub response_time_ms: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthAlert {
    pub id: Uuid,
    pub severity: SystemAlertSeverity,
    pub title: String,
    pub description: String,
    pub created_at: DateTime<Utc>,
    pub acknowledged: bool,
    pub resolved: bool,
    pub source_component: String,
    pub affected_workflows: Vec<Uuid>,
    pub recommended_actions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SystemAlertSeverity {
    Info,
    Warning,
    Critical,
    Emergency,
}

#[derive(Debug, Clone)]
pub struct HealthThresholds {
    pub cpu_warning: f64,
    pub cpu_critical: f64,
    pub memory_warning: f64,
    pub memory_critical: f64,
    pub disk_warning: f64,
    pub disk_critical: f64,
    pub error_rate_warning: f64,
    pub error_rate_critical: f64,
    pub response_time_warning: f64,
    pub response_time_critical: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthReport {
    pub timestamp: DateTime<Utc>,
    pub overall_status: SystemHealthStatus,
    pub performance_score: f64,
    pub key_metrics: HealthMetrics,
    pub active_alerts: Vec<HealthAlert>,
    pub trends: Vec<HealthTrend>,
    pub recommendations: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthTrend {
    pub metric_name: String,
    pub direction: TrendDirection,
    pub rate_of_change: f64,
    pub confidence: f64,
    pub prediction: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TrendDirection {
    Improving,
    Stable,
    Degrading,
    Volatile,
}

impl SystemHealthMonitor {
    pub fn new() -> Self {
        Self {
            state: Arc::new(RwLock::new(HealthState {
                overall_status: SystemHealthStatus::Unknown,
                last_check: Utc::now(),
                uptime_seconds: 0,
                active_alerts: Vec::new(),
                system_load: 0.0,
                memory_pressure: 0.0,
                disk_usage: 0.0,
                network_latency: 0.0,
                error_rate: 0.0,
                performance_score: 100.0,
            })),
            metrics_history: Arc::new(RwLock::new(VecDeque::with_capacity(1000))),
            alert_thresholds: HealthThresholds::default(),
        }
    }

    pub async fn start(&self) -> Result<()> {
        info!("Starting System Health Monitor");
        
        let start_time = Utc::now();
        let state_clone = self.state.clone();
        let metrics_history_clone = self.metrics_history.clone();
        let thresholds_clone = self.alert_thresholds.clone();
        
        // Start health monitoring loop
        tokio::spawn(async move {
            let mut interval = interval(Duration::from_secs(10));
            
            loop {
                interval.tick().await;
                
                let uptime = (Utc::now() - start_time).num_seconds() as u64;
                
                if let Err(e) = Self::perform_health_check(
                    &state_clone,
                    &metrics_history_clone,
                    &thresholds_clone,
                    uptime,
                ).await {
                    error!("Health check failed: {}", e);
                }
            }
        });

        info!("System Health Monitor started successfully");
        Ok(())
    }

    async fn perform_health_check(
        state: &Arc<RwLock<HealthState>>,
        metrics_history: &Arc<RwLock<VecDeque<HealthMetrics>>>,
        thresholds: &HealthThresholds,
        uptime: u64,
    ) -> Result<()> {
        // Collect current metrics
        let metrics = Self::collect_metrics().await;
        
        // Update metrics history
        {
            let mut history = metrics_history.write();
            history.push_back(metrics.clone());
            if history.len() > 1000 {
                history.pop_front();
            }
        }
        
        // Analyze metrics and determine health status
        let health_status = Self::analyze_health(&metrics, thresholds);
        let performance_score = Self::calculate_performance_score(&metrics);
        let alerts = Self::generate_alerts(&metrics, thresholds);
        
        // Update health state
        {
            let mut state_guard = state.write();
            state_guard.overall_status = health_status;
            state_guard.last_check = Utc::now();
            state_guard.uptime_seconds = uptime;
            state_guard.system_load = metrics.cpu_usage;
            state_guard.memory_pressure = metrics.memory_usage;
            state_guard.disk_usage = metrics.disk_usage;
            state_guard.network_latency = metrics.network_latency;
            state_guard.error_rate = metrics.error_count as f64 / 100.0; // Normalized
            state_guard.performance_score = performance_score;
            
            // Update alerts (add new ones, resolve old ones)
            state_guard.active_alerts.extend(alerts);
            state_guard.active_alerts.retain(|alert| !alert.resolved);
        }
        
        Ok(())
    }

    async fn collect_metrics() -> HealthMetrics {
        HealthMetrics {
            timestamp: Utc::now(),
            cpu_usage: Self::get_cpu_usage(),
            memory_usage: Self::get_memory_usage(),
            disk_usage: Self::get_disk_usage(),
            network_latency: Self::get_network_latency().await,
            active_workflows: Self::get_active_workflow_count(),
            active_agents: Self::get_active_agent_count(),
            error_count: Self::get_error_count(),
            warning_count: Self::get_warning_count(),
            response_time_ms: Self::get_average_response_time(),
        }
    }

    fn analyze_health(metrics: &HealthMetrics, thresholds: &HealthThresholds) -> SystemHealthStatus {
        let mut status = SystemHealthStatus::Healthy;
        
        // Check CPU
        if metrics.cpu_usage >= thresholds.cpu_critical {
            status = SystemHealthStatus::Critical;
        } else if metrics.cpu_usage >= thresholds.cpu_warning && 
                  matches!(status, SystemHealthStatus::Healthy) {
            status = SystemHealthStatus::Warning;
        }
        
        // Check Memory
        if metrics.memory_usage >= thresholds.memory_critical {
            status = SystemHealthStatus::Critical;
        } else if metrics.memory_usage >= thresholds.memory_warning && 
                  !matches!(status, SystemHealthStatus::Critical) {
            status = SystemHealthStatus::Warning;
        }
        
        // Check Disk
        if metrics.disk_usage >= thresholds.disk_critical {
            status = SystemHealthStatus::Critical;
        } else if metrics.disk_usage >= thresholds.disk_warning && 
                  !matches!(status, SystemHealthStatus::Critical) {
            status = SystemHealthStatus::Warning;
        }
        
        // Check Error Rate
        let error_rate = metrics.error_count as f64 / 100.0;
        if error_rate >= thresholds.error_rate_critical {
            status = SystemHealthStatus::Critical;
        } else if error_rate >= thresholds.error_rate_warning && 
                  !matches!(status, SystemHealthStatus::Critical) {
            status = SystemHealthStatus::Warning;
        }
        
        status
    }

    fn calculate_performance_score(metrics: &HealthMetrics) -> f64 {
        // Simple performance scoring algorithm
        let cpu_score = (1.0 - metrics.cpu_usage) * 25.0;
        let memory_score = (1.0 - metrics.memory_usage) * 25.0;
        let disk_score = (1.0 - metrics.disk_usage) * 20.0;
        let response_score = ((1000.0 - metrics.response_time_ms) / 1000.0).max(0.0) * 20.0;
        let error_score = ((100.0 - metrics.error_count as f64) / 100.0).max(0.0) * 10.0;
        
        (cpu_score + memory_score + disk_score + response_score + error_score).max(0.0).min(100.0)
    }

    fn generate_alerts(metrics: &HealthMetrics, thresholds: &HealthThresholds) -> Vec<HealthAlert> {
        let mut alerts = Vec::new();
        
        // CPU Alert
        if metrics.cpu_usage >= thresholds.cpu_critical {
            alerts.push(HealthAlert {
                id: Uuid::new_v4(),
                severity: SystemAlertSeverity::Critical,
                title: "High CPU Usage".to_string(),
                description: format!("CPU usage is at {:.1}%", metrics.cpu_usage * 100.0),
                created_at: Utc::now(),
                acknowledged: false,
                resolved: false,
                source_component: "SystemHealthMonitor".to_string(),
                affected_workflows: Vec::new(),
                recommended_actions: vec![
                    "Consider scaling down workflows".to_string(),
                    "Check for resource-intensive agents".to_string(),
                ],
            });
        }
        
        // Memory Alert
        if metrics.memory_usage >= thresholds.memory_critical {
            alerts.push(HealthAlert {
                id: Uuid::new_v4(),
                severity: SystemAlertSeverity::Critical,
                title: "High Memory Usage".to_string(),
                description: format!("Memory usage is at {:.1}%", metrics.memory_usage * 100.0),
                created_at: Utc::now(),
                acknowledged: false,
                resolved: false,
                source_component: "SystemHealthMonitor".to_string(),
                affected_workflows: Vec::new(),
                recommended_actions: vec![
                    "Restart agents with memory leaks".to_string(),
                    "Reduce concurrent workflows".to_string(),
                ],
            });
        }
        
        alerts
    }

    pub fn get_health_state(&self) -> HealthState {
        self.state.read().clone()
    }

    pub async fn generate_health_report(&self) -> HealthReport {
        let state = self.state.read().clone();
        let metrics_history = self.metrics_history.read();
        
        let current_metrics = if let Some(latest) = metrics_history.back() {
            latest.clone()
        } else {
            Self::collect_metrics().await
        };
        
        let trends = Self::analyze_trends(&metrics_history);
        let recommendations = Self::generate_recommendations(&state, &trends);
        
        HealthReport {
            timestamp: Utc::now(),
            overall_status: state.overall_status,
            performance_score: state.performance_score,
            key_metrics: current_metrics,
            active_alerts: state.active_alerts,
            trends,
            recommendations,
        }
    }

    fn analyze_trends(history: &VecDeque<HealthMetrics>) -> Vec<HealthTrend> {
        let mut trends = Vec::new();
        
        if history.len() < 10 {
            return trends; // Not enough data for trend analysis
        }
        
        // Analyze CPU trend
        let cpu_values: Vec<f64> = history.iter().map(|m| m.cpu_usage).collect();
        if let Some(cpu_trend) = Self::calculate_trend("CPU Usage", &cpu_values) {
            trends.push(cpu_trend);
        }
        
        // Analyze Memory trend
        let memory_values: Vec<f64> = history.iter().map(|m| m.memory_usage).collect();
        if let Some(memory_trend) = Self::calculate_trend("Memory Usage", &memory_values) {
            trends.push(memory_trend);
        }
        
        trends
    }

    fn calculate_trend(metric_name: &str, values: &[f64]) -> Option<HealthTrend> {
        if values.len() < 5 {
            return None;
        }
        
        // Simple linear regression to detect trend
        let n = values.len() as f64;
        let x_sum: f64 = (0..values.len()).map(|i| i as f64).sum();
        let y_sum: f64 = values.iter().sum();
        let xy_sum: f64 = values.iter().enumerate().map(|(i, &y)| i as f64 * y).sum();
        let x2_sum: f64 = (0..values.len()).map(|i| (i as f64).powi(2)).sum();
        
        let slope = (n * xy_sum - x_sum * y_sum) / (n * x2_sum - x_sum.powi(2));
        
        let direction = if slope.abs() < 0.001 {
            TrendDirection::Stable
        } else if slope > 0.0 {
            TrendDirection::Degrading
        } else {
            TrendDirection::Improving
        };
        
        Some(HealthTrend {
            metric_name: metric_name.to_string(),
            direction,
            rate_of_change: slope,
            confidence: 0.8, // Simple confidence estimate
            prediction: Some(values.last().unwrap() + slope * 10.0), // Predict 10 steps ahead
        })
    }

    fn generate_recommendations(state: &HealthState, trends: &[HealthTrend]) -> Vec<String> {
        let mut recommendations = Vec::new();
        
        match state.overall_status {
            SystemHealthStatus::Critical => {
                recommendations.push("Immediate action required: System is in critical state".to_string());
                recommendations.push("Consider emergency scaling down of workflows".to_string());
            }
            SystemHealthStatus::Warning => {
                recommendations.push("Monitor system closely: Performance degradation detected".to_string());
            }
            SystemHealthStatus::Degraded => {
                recommendations.push("System performance is below optimal".to_string());
                recommendations.push("Consider optimizing resource allocation".to_string());
            }
            _ => {}
        }
        
        for trend in trends {
            if matches!(trend.direction, TrendDirection::Degrading) {
                recommendations.push(format!("{} is trending upward - investigate cause", trend.metric_name));
            }
        }
        
        if state.performance_score < 60.0 {
            recommendations.push("Overall performance score is low - review system configuration".to_string());
        }
        
        recommendations
    }

    // Platform-specific system metric collection methods
    fn get_cpu_usage() -> f64 {
        // Placeholder - in production, use proper system monitoring
        0.3
    }

    fn get_memory_usage() -> f64 {
        // Placeholder - in production, use proper system monitoring
        0.4
    }

    fn get_disk_usage() -> f64 {
        // Placeholder - in production, use proper system monitoring
        0.5
    }

    async fn get_network_latency() -> f64 {
        // Placeholder - in production, ping a reliable endpoint
        10.0
    }

    fn get_active_workflow_count() -> u32 {
        // Placeholder - get from actual workflow manager
        5
    }

    fn get_active_agent_count() -> u32 {
        // Placeholder - get from actual agent manager
        15
    }

    fn get_error_count() -> u32 {
        // Placeholder - get from error tracking system
        2
    }

    fn get_warning_count() -> u32 {
        // Placeholder - get from logging system
        5
    }

    fn get_average_response_time() -> f64 {
        // Placeholder - get from metrics system
        150.0
    }
}

impl Default for HealthThresholds {
    fn default() -> Self {
        Self {
            cpu_warning: 0.75,
            cpu_critical: 0.90,
            memory_warning: 0.80,
            memory_critical: 0.95,
            disk_warning: 0.85,
            disk_critical: 0.95,
            error_rate_warning: 0.05,
            error_rate_critical: 0.10,
            response_time_warning: 500.0,
            response_time_critical: 1000.0,
        }
    }
}

impl Clone for SystemHealthMonitor {
    fn clone(&self) -> Self {
        Self {
            state: self.state.clone(),
            metrics_history: self.metrics_history.clone(),
            alert_thresholds: self.alert_thresholds.clone(),
        }
    }
}