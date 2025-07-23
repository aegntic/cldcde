use anyhow::Result;
use chrono::{DateTime, Utc};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tracing::{info, warn};
use uuid::Uuid;

/// Communication Manager - Handles stakeholder communication and reporting
#[derive(Debug)]
pub struct CommunicationManager {
    coordinator_id: Uuid,
    state: Arc<RwLock<CommunicationState>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommunicationState {
    pub stakeholders: HashMap<Uuid, Stakeholder>,
    pub communication_log: Vec<CommunicationRecord>,
    pub scheduled_reports: Vec<ScheduledReport>,
    pub metrics: CommunicationMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Stakeholder {
    pub id: Uuid,
    pub name: String,
    pub role: StakeholderRole,
    pub communication_preference: CommunicationChannel,
    pub notification_settings: NotificationSettings,
    pub last_contact: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StakeholderRole {
    MasterOrchestrator,
    SpecializedManager,
    AgentMember,
    ExternalClient,
    ProjectSponsor,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CommunicationChannel {
    TmuxMessage,
    LogEntry,
    EventBroadcast,
    StatusReport,
    Email, // For future external integration
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationSettings {
    pub phase_transitions: bool,
    pub quality_issues: bool,
    pub escalations: bool,
    pub completion_updates: bool,
    pub performance_reports: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommunicationRecord {
    pub id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub from_id: Uuid,
    pub to_id: Option<Uuid>, // None for broadcast
    pub channel: CommunicationChannel,
    pub message_type: MessageType,
    pub content: String,
    pub acknowledged: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageType {
    StatusUpdate,
    ProgressReport,
    QualityAlert,
    Escalation,
    PhaseTransition,
    CompletionNotice,
    PerformanceMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduledReport {
    pub id: Uuid,
    pub report_type: ReportType,
    pub frequency: ReportFrequency,
    pub next_scheduled: DateTime<Utc>,
    pub recipients: Vec<Uuid>,
    pub template: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReportType {
    DailyStatusUpdate,
    WeeklyProgressReport,
    PhaseCompletionReport,
    QualityAssessmentReport,
    PerformanceMetricsReport,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReportFrequency {
    Hourly,
    Daily,
    Weekly,
    OnEvent,
    OnDemand,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommunicationMetrics {
    pub messages_sent: u32,
    pub messages_acknowledged: u32,
    pub reports_generated: u32,
    pub escalations_communicated: u32,
    pub average_response_time_minutes: f64,
}

impl CommunicationManager {
    pub fn new(coordinator_id: Uuid) -> Self {
        Self {
            coordinator_id,
            state: Arc::new(RwLock::new(CommunicationState {
                stakeholders: HashMap::new(),
                communication_log: Vec::new(),
                scheduled_reports: Vec::new(),
                metrics: CommunicationMetrics::default(),
            })),
        }
    }

    pub async fn start(&self) -> Result<()> {
        info!("Starting Communication Manager for coordinator {}", self.coordinator_id);
        self.initialize_default_stakeholders().await?;
        Ok(())
    }

    async fn initialize_default_stakeholders(&self) -> Result<()> {
        let mut state = self.state.write();
        
        // Add Master Orchestrator as default stakeholder
        let master_stakeholder = Stakeholder {
            id: Uuid::new_v4(), // Would be actual master orchestrator ID
            name: "Master Orchestrator".to_string(),
            role: StakeholderRole::MasterOrchestrator,
            communication_preference: CommunicationChannel::EventBroadcast,
            notification_settings: NotificationSettings {
                phase_transitions: true,
                quality_issues: true,
                escalations: true,
                completion_updates: true,
                performance_reports: true,
            },
            last_contact: None,
        };

        state.stakeholders.insert(master_stakeholder.id, master_stakeholder);
        info!("Initialized default stakeholders");
        Ok(())
    }

    pub async fn send_message(
        &self,
        to_id: Option<Uuid>,
        message_type: MessageType,
        content: String,
    ) -> Result<Uuid> {
        let message_id = Uuid::new_v4();
        let mut state = self.state.write();

        let record = CommunicationRecord {
            id: message_id,
            timestamp: Utc::now(),
            from_id: self.coordinator_id,
            to_id,
            channel: CommunicationChannel::TmuxMessage, // Default channel
            message_type,
            content: content.clone(),
            acknowledged: false,
        };

        state.communication_log.push(record);
        state.metrics.messages_sent += 1;

        // Log the message
        match to_id {
            Some(recipient_id) => {
                info!("Sent message to {}: {}", recipient_id, content);
            }
            None => {
                info!("Broadcast message: {}", content);
            }
        }

        Ok(message_id)
    }

    pub async fn send_status_update(&self, status: String) -> Result<()> {
        self.send_message(
            None, // Broadcast
            MessageType::StatusUpdate,
            format!("Workflow Status Update: {}", status),
        ).await?;
        Ok(())
    }

    pub async fn send_progress_report(&self, progress: f64, details: String) -> Result<()> {
        self.send_message(
            None, // Broadcast
            MessageType::ProgressReport,
            format!("Progress: {:.1}% - {}", progress, details),
        ).await?;
        Ok(())
    }

    pub async fn send_quality_alert(&self, issue: String) -> Result<()> {
        // Send to stakeholders who want quality notifications
        let stakeholders: Vec<Uuid> = {
            let state = self.state.read();
            state.stakeholders.values()
                .filter(|s| s.notification_settings.quality_issues)
                .map(|s| s.id)
                .collect()
        };

        for stakeholder_id in stakeholders {
            self.send_message(
                Some(stakeholder_id),
                MessageType::QualityAlert,
                format!("Quality Issue: {}", issue),
            ).await?;
        }

        Ok(())
    }

    pub async fn send_escalation_notice(&self, escalation_details: String) -> Result<()> {
        // Send to Master Orchestrator and other relevant stakeholders
        let stakeholders: Vec<Uuid> = {
            let state = self.state.read();
            state.stakeholders.values()
                .filter(|s| matches!(s.role, StakeholderRole::MasterOrchestrator) || 
                           s.notification_settings.escalations)
                .map(|s| s.id)
                .collect()
        };

        for stakeholder_id in stakeholders {
            self.send_message(
                Some(stakeholder_id),
                MessageType::Escalation,
                format!("ESCALATION: {}", escalation_details),
            ).await?;
        }

        warn!("Escalation notice sent: {}", escalation_details);
        Ok(())
    }

    pub async fn send_phase_transition_notice(
        &self,
        from_phase: String,
        to_phase: String,
    ) -> Result<()> {
        self.send_message(
            None, // Broadcast
            MessageType::PhaseTransition,
            format!("Phase Transition: {} → {}", from_phase, to_phase),
        ).await?;
        Ok(())
    }

    pub async fn send_completion_notice(&self, success: bool, summary: String) -> Result<()> {
        let status = if success { "SUCCESS" } else { "FAILED" };
        self.send_message(
            None, // Broadcast
            MessageType::CompletionNotice,
            format!("Workflow Completed: {} - {}", status, summary),
        ).await?;
        Ok(())
    }

    pub async fn generate_performance_report(&self) -> Result<String> {
        let state = self.state.read();
        let metrics = &state.metrics;

        let report = format!(
            r#"=== WORKFLOW COORDINATOR PERFORMANCE REPORT ===
Coordinator ID: {}
Report Generated: {}

Communication Metrics:
- Messages Sent: {}
- Messages Acknowledged: {}
- Acknowledgment Rate: {:.1}%
- Reports Generated: {}
- Escalations Communicated: {}
- Average Response Time: {:.1} minutes

Active Stakeholders: {}
Communication Log Entries: {}
Scheduled Reports: {}
"#,
            self.coordinator_id,
            Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
            metrics.messages_sent,
            metrics.messages_acknowledged,
            if metrics.messages_sent > 0 {
                (metrics.messages_acknowledged as f64 / metrics.messages_sent as f64) * 100.0
            } else {
                0.0
            },
            metrics.reports_generated,
            metrics.escalations_communicated,
            metrics.average_response_time_minutes,
            state.stakeholders.len(),
            state.communication_log.len(),
            state.scheduled_reports.len(),
        );

        Ok(report)
    }

    pub async fn add_stakeholder(&self, stakeholder: Stakeholder) -> Result<()> {
        let mut state = self.state.write();
        state.stakeholders.insert(stakeholder.id, stakeholder.clone());
        info!("Added stakeholder: {} ({})", stakeholder.name, stakeholder.id);
        Ok(())
    }

    pub async fn acknowledge_message(&self, message_id: Uuid) -> Result<()> {
        let mut state = self.state.write();
        
        if let Some(record) = state.communication_log.iter_mut().find(|r| r.id == message_id) {
            record.acknowledged = true;
            state.metrics.messages_acknowledged += 1;
            info!("Message {} acknowledged", message_id);
        }

        Ok(())
    }

    pub async fn schedule_report(
        &self,
        report_type: ReportType,
        frequency: ReportFrequency,
        recipients: Vec<Uuid>,
    ) -> Result<Uuid> {
        let report_id = Uuid::new_v4();
        let mut state = self.state.write();

        let next_scheduled = match frequency {
            ReportFrequency::Hourly => Utc::now() + chrono::Duration::hours(1),
            ReportFrequency::Daily => Utc::now() + chrono::Duration::days(1),
            ReportFrequency::Weekly => Utc::now() + chrono::Duration::weeks(1),
            ReportFrequency::OnEvent => Utc::now(), // Immediate
            ReportFrequency::OnDemand => Utc::now() + chrono::Duration::days(365), // Far future
        };

        let scheduled_report = ScheduledReport {
            id: report_id,
            report_type,
            frequency,
            next_scheduled,
            recipients,
            template: "Standard report template".to_string(),
        };

        state.scheduled_reports.push(scheduled_report);
        info!("Scheduled report {} for {:?}", report_id, next_scheduled);
        Ok(report_id)
    }

    pub async fn get_communication_metrics(&self) -> CommunicationMetrics {
        let state = self.state.read();
        state.metrics.clone()
    }
}

impl Default for CommunicationMetrics {
    fn default() -> Self {
        Self {
            messages_sent: 0,
            messages_acknowledged: 0,
            reports_generated: 0,
            escalations_communicated: 0,
            average_response_time_minutes: 0.0,
        }
    }
}