use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

use crate::{GitHubIntegration, GitHubProject, GitHubIssue};

/// Workflow synchronization configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConfig {
    pub auto_sync_enabled: bool,
    pub sync_interval_minutes: u64,
    pub sync_issues: bool,
    pub sync_pull_requests: bool,
    pub sync_milestones: bool,
    pub label_mapping: HashMap<String, String>, // GitHub label -> Workflow phase
    pub status_mapping: HashMap<String, String>, // GitHub status -> Workflow status
}

impl Default for SyncConfig {
    fn default() -> Self {
        let mut label_mapping = HashMap::new();
        label_mapping.insert("planning".to_string(), "Planning".to_string());
        label_mapping.insert("requirements".to_string(), "Requirements".to_string());
        label_mapping.insert("design".to_string(), "Design".to_string());
        label_mapping.insert("task".to_string(), "Tasks".to_string());
        label_mapping.insert("execute".to_string(), "Execute".to_string());
        
        let mut status_mapping = HashMap::new();
        status_mapping.insert("open".to_string(), "Active".to_string());
        status_mapping.insert("closed".to_string(), "Completed".to_string());
        
        Self {
            auto_sync_enabled: true,
            sync_interval_minutes: 15,
            sync_issues: true,
            sync_pull_requests: true,
            sync_milestones: true,
            label_mapping,
            status_mapping,
        }
    }
}

/// Synchronized workflow item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncedWorkflowItem {
    pub local_id: Uuid,
    pub github_id: u64,
    pub github_type: String, // "issue", "pull_request", "milestone"
    pub repository: String,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub phase: String,
    pub labels: Vec<String>,
    pub assignees: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_synced: DateTime<Utc>,
}

/// Synchronization state for a repository
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepositorySyncState {
    pub repository: String,
    pub user_id: Uuid,
    pub last_sync: DateTime<Utc>,
    pub sync_config: SyncConfig,
    pub synced_items: Vec<SyncedWorkflowItem>,
    pub sync_errors: Vec<String>,
}

impl GitHubIntegration {
    /// Set up project synchronization for a repository
    pub async fn setup_project_sync(
        &self,
        user_id: Uuid,
        owner: &str,
        repo: &str,
        config: SyncConfig,
    ) -> Result<RepositorySyncState> {
        // Verify user has access to the repository
        let _repo_info = self.get_repository_info(user_id, owner, repo).await?;
        
        let repository_key = format!("{}/{}", owner, repo);
        
        let sync_state = RepositorySyncState {
            repository: repository_key.clone(),
            user_id,
            last_sync: Utc::now(),
            sync_config: config,
            synced_items: Vec::new(),
            sync_errors: Vec::new(),
        };
        
        // Store sync state (in a real implementation, this would be persisted)
        // For now, we'll just return the initial state
        
        Ok(sync_state)
    }
    
    /// Perform full synchronization of a repository
    pub async fn sync_repository(
        &self,
        sync_state: &mut RepositorySyncState,
    ) -> Result<Vec<SyncedWorkflowItem>> {
        let parts: Vec<&str> = sync_state.repository.split('/').collect();
        if parts.len() != 2 {
            anyhow::bail!("Invalid repository format: {}", sync_state.repository);
        }
        
        let owner = parts[0];
        let repo = parts[1];
        
        let mut new_items = Vec::new();
        sync_state.sync_errors.clear();
        
        // Sync issues if enabled
        if sync_state.sync_config.sync_issues {
            match self.sync_repository_issues(sync_state.user_id, owner, repo, &sync_state.sync_config).await {
                Ok(mut issues) => new_items.append(&mut issues),
                Err(e) => sync_state.sync_errors.push(format!("Issue sync error: {}", e)),
            }
        }
        
        // Sync pull requests if enabled
        if sync_state.sync_config.sync_pull_requests {
            match self.sync_repository_pull_requests(sync_state.user_id, owner, repo, &sync_state.sync_config).await {
                Ok(mut prs) => new_items.append(&mut prs),
                Err(e) => sync_state.sync_errors.push(format!("PR sync error: {}", e)),
            }
        }
        
        // Sync milestones if enabled
        if sync_state.sync_config.sync_milestones {
            match self.sync_repository_milestones(sync_state.user_id, owner, repo, &sync_state.sync_config).await {
                Ok(mut milestones) => new_items.append(&mut milestones),
                Err(e) => sync_state.sync_errors.push(format!("Milestone sync error: {}", e)),
            }
        }
        
        // Update sync state
        sync_state.synced_items = new_items.clone();
        sync_state.last_sync = Utc::now();
        
        Ok(new_items)
    }
    
    /// Sync repository issues to workflow items
    async fn sync_repository_issues(
        &self,
        user_id: Uuid,
        owner: &str,
        repo: &str,
        config: &SyncConfig,
    ) -> Result<Vec<SyncedWorkflowItem>> {
        let issues = self.get_repository_issues(user_id, owner, repo).await?;
        
        let synced_items = issues
            .into_iter()
            .map(|issue| {
                let phase = self.map_labels_to_phase(&issue.labels, &config.label_mapping);
                let status = config.status_mapping
                    .get(&issue.state)
                    .cloned()
                    .unwrap_or_else(|| issue.state.clone());
                
                SyncedWorkflowItem {
                    local_id: Uuid::new_v4(),
                    github_id: issue.id,
                    github_type: "issue".to_string(),
                    repository: format!("{}/{}", owner, repo),
                    title: issue.title,
                    description: issue.body,
                    status,
                    phase,
                    labels: issue.labels,
                    assignees: issue.assignees,
                    created_at: issue.created_at,
                    updated_at: issue.updated_at,
                    last_synced: Utc::now(),
                }
            })
            .collect();
            
        Ok(synced_items)
    }
    
    /// Sync repository pull requests to workflow items  
    async fn sync_repository_pull_requests(
        &self,
        user_id: Uuid,
        owner: &str,
        repo: &str,
        config: &SyncConfig,
    ) -> Result<Vec<SyncedWorkflowItem>> {
        let octocrab_instances = self.octocrab_instances.read().await;
        
        if let Some(octocrab) = octocrab_instances.get(&user_id) {
            let pull_requests = octocrab
                .pulls(owner, repo)
                .list()
                .send()
                .await?;
                
            let synced_items = pull_requests
                .items
                .into_iter()
                .map(|pr| {
                    let labels: Vec<String> = pr.labels.unwrap_or_default().into_iter().map(|l| l.name).collect();
                    let assignees: Vec<String> = pr.assignee.into_iter().map(|a| a.login).collect();
                    
                    let phase = self.map_labels_to_phase(&labels, &config.label_mapping);
                    let state_str = match pr.state {
                        Some(octocrab::models::IssueState::Open) => "open",
                        Some(octocrab::models::IssueState::Closed) => "closed", 
                        None => "unknown",
                        Some(_) => "unknown",
                    };
                    let status = config.status_mapping
                        .get(state_str)
                        .cloned()
                        .unwrap_or_else(|| state_str.to_string());
                    
                    SyncedWorkflowItem {
                        local_id: Uuid::new_v4(),
                        github_id: pr.id.0,
                        github_type: "pull_request".to_string(),
                        repository: format!("{}/{}", owner, repo),
                        title: pr.title.unwrap_or_else(|| "Untitled PR".to_string()),
                        description: pr.body,
                        status,
                        phase,
                        labels,
                        assignees,
                        created_at: pr.created_at.unwrap_or_else(|| Utc::now()),
                        updated_at: pr.updated_at.unwrap_or_else(|| Utc::now()),
                        last_synced: Utc::now(),
                    }
                })
                .collect();
                
            Ok(synced_items)
        } else {
            anyhow::bail!("User not authenticated")
        }
    }
    
    /// Sync repository milestones to workflow items (placeholder implementation)
    async fn sync_repository_milestones(
        &self,
        user_id: Uuid,
        owner: &str,
        repo: &str,
        config: &SyncConfig,
    ) -> Result<Vec<SyncedWorkflowItem>> {
        if !self.is_authenticated(user_id).await {
            anyhow::bail!("User not authenticated");
        }
        
        // Placeholder implementation - milestone API not readily available
        let now = Utc::now();
        let placeholder_milestones = vec![
            SyncedWorkflowItem {
                local_id: Uuid::new_v4(),
                github_id: 1,
                github_type: "milestone".to_string(),
                repository: format!("{}/{}", owner, repo),
                title: "Phase 1: Planning".to_string(),
                description: Some("Initial planning and requirements gathering".to_string()),
                status: config.status_mapping.get("open").cloned().unwrap_or_else(|| "Active".to_string()),
                phase: "Planning".to_string(),
                labels: Vec::new(),
                assignees: Vec::new(),
                created_at: now,
                updated_at: now,
                last_synced: now,
            },
        ];
        
        Ok(placeholder_milestones)
    }
    
    /// Map GitHub labels to workflow phase
    fn map_labels_to_phase(&self, labels: &[String], label_mapping: &HashMap<String, String>) -> String {
        // Look for phase labels in priority order
        let phase_priority = vec!["execute", "task", "design", "requirements", "planning"];
        
        for phase_label in phase_priority {
            if labels.iter().any(|label| label.to_lowercase().contains(phase_label)) {
                if let Some(phase) = label_mapping.get(phase_label) {
                    return phase.clone();
                }
            }
        }
        
        // Check for exact matches
        for label in labels {
            if let Some(phase) = label_mapping.get(&label.to_lowercase()) {
                return phase.clone();
            }
        }
        
        // Default phase
        "Planning".to_string()
    }
    
    /// Create GitHub issue from workflow item
    pub async fn create_github_issue_from_workflow(
        &self,
        user_id: Uuid,
        owner: &str,
        repo: &str,
        title: &str,
        description: Option<&str>,
        phase: &str,
        config: &SyncConfig,
    ) -> Result<GitHubIssue> {
        // Map phase to GitHub labels
        let labels = self.map_phase_to_labels(phase, &config.label_mapping);
        
        self.create_issue(
            user_id,
            owner,
            repo,
            title,
            description,
            Some(labels),
            None,
        ).await
    }
    
    /// Map workflow phase to GitHub labels
    fn map_phase_to_labels(&self, phase: &str, label_mapping: &HashMap<String, String>) -> Vec<String> {
        // Reverse lookup in label mapping
        for (github_label, workflow_phase) in label_mapping {
            if workflow_phase.eq_ignore_ascii_case(phase) {
                return vec![github_label.clone()];
            }
        }
        
        // Default label based on phase
        vec![phase.to_lowercase()]
    }
    
    /// Get synchronization status for all repositories
    pub async fn get_sync_status(&self, user_id: Uuid) -> Result<Vec<RepositorySyncState>> {
        // In a real implementation, this would fetch from persistent storage
        // For now, return empty list
        Ok(Vec::new())
    }
    
    /// Enable/disable auto-sync for a repository
    pub async fn set_auto_sync(
        &self,
        sync_state: &mut RepositorySyncState,
        enabled: bool,
    ) -> Result<()> {
        sync_state.sync_config.auto_sync_enabled = enabled;
        // In a real implementation, this would persist the change
        Ok(())
    }
}