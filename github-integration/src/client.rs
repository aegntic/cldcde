use anyhow::Result;
use octocrab::models::issues::Issue;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

use crate::{GitHubIntegration, GitHubProject, GitHubIssue};

/// GitHub API client wrapper with authentication
impl GitHubIntegration {
    /// Create a new issue in a repository
    pub async fn create_issue(
        &self,
        user_id: Uuid,
        owner: &str,
        repo: &str,
        title: &str,
        body: Option<&str>,
        labels: Option<Vec<String>>,
        assignees: Option<Vec<String>>,
    ) -> Result<GitHubIssue> {
        let octocrab_instances = self.octocrab_instances.read().await;
        
        if let Some(octocrab) = octocrab_instances.get(&user_id) {
            let issues_handler = octocrab.issues(owner, repo);
            let mut issue_builder = issues_handler.create(title);
                
            if let Some(body) = body {
                issue_builder = issue_builder.body(body);
            }
            
            if let Some(labels) = labels {
                issue_builder = issue_builder.labels(labels);
            }
            
            if let Some(assignees) = assignees {
                issue_builder = issue_builder.assignees(assignees);
            }
            
            let issue = issue_builder.send().await?;
            
            Ok(GitHubIssue {
                id: issue.id.0,
                number: issue.number as u32,
                title: issue.title,
                body: issue.body,
                state: match issue.state {
                    octocrab::models::IssueState::Open => "open".to_string(),
                    octocrab::models::IssueState::Closed => "closed".to_string(),
                    _ => "unknown".to_string(),
                },
                labels: issue.labels.into_iter().map(|l| l.name).collect(),
                assignees: issue.assignees.into_iter().map(|a| a.login).collect(),
                milestone: issue.milestone.map(|m| m.title),
                created_at: issue.created_at,
                updated_at: issue.updated_at,
            })
        } else {
            anyhow::bail!("User not authenticated")
        }
    }
    
    /// Update an existing issue
    pub async fn update_issue(
        &self,
        user_id: Uuid,
        owner: &str,
        repo: &str,
        issue_number: u32,
        title: Option<&str>,
        body: Option<&str>,
        state: Option<&str>,
        labels: Option<Vec<String>>,
    ) -> Result<GitHubIssue> {
        let octocrab_instances = self.octocrab_instances.read().await;
        
        if let Some(octocrab) = octocrab_instances.get(&user_id) {
            let issues_handler = octocrab.issues(owner, repo);
            let mut update_builder = issues_handler.update(issue_number.into());
                
            if let Some(title) = title {
                update_builder = update_builder.title(title);
            }
            
            if let Some(body) = body {
                update_builder = update_builder.body(body);
            }
            
            if let Some(state) = state {
                match state.to_lowercase().as_str() {
                    "open" => update_builder = update_builder.state(octocrab::models::IssueState::Open),
                    "closed" => update_builder = update_builder.state(octocrab::models::IssueState::Closed),
                    _ => return Err(anyhow::anyhow!("Invalid issue state: {}", state)),
                }
            }
            
            if let Some(labels) = &labels {
                update_builder = update_builder.labels(labels);
            }
            
            let issue = update_builder.send().await?;
            
            Ok(GitHubIssue {
                id: issue.id.0,
                number: issue.number as u32,
                title: issue.title,
                body: issue.body,
                state: match issue.state {
                    octocrab::models::IssueState::Open => "open".to_string(),
                    octocrab::models::IssueState::Closed => "closed".to_string(),
                    _ => "unknown".to_string(),
                },
                labels: issue.labels.into_iter().map(|l| l.name).collect(),
                assignees: issue.assignees.into_iter().map(|a| a.login).collect(),
                milestone: issue.milestone.map(|m| m.title),
                created_at: issue.created_at,
                updated_at: issue.updated_at,
            })
        } else {
            anyhow::bail!("User not authenticated")
        }
    }
    
    /// Get repository information
    pub async fn get_repository_info(
        &self,
        user_id: Uuid,
        owner: &str,
        repo: &str,
    ) -> Result<GitHubProject> {
        let octocrab_instances = self.octocrab_instances.read().await;
        
        if let Some(octocrab) = octocrab_instances.get(&user_id) {
            let repository = octocrab
                .repos(owner, repo)
                .get()
                .await?;
                
            Ok(GitHubProject {
                id: repository.id.0,
                name: repository.name,
                description: repository.description,
                owner: repository.owner.unwrap().login,
                repository: repository.full_name.unwrap_or_default(),
                url: repository.html_url.unwrap().to_string(),
                created_at: repository.created_at.unwrap(),
                updated_at: repository.updated_at.unwrap(),
            })
        } else {
            anyhow::bail!("User not authenticated")
        }
    }
    
    /// Get repository labels
    pub async fn get_repository_labels(
        &self,
        user_id: Uuid,
        owner: &str,
        repo: &str,
    ) -> Result<Vec<String>> {
        let octocrab_instances = self.octocrab_instances.read().await;
        
        if let Some(octocrab) = octocrab_instances.get(&user_id) {
            let labels = octocrab
                .issues(owner, repo)
                .list_labels_for_repo()
                .send()
                .await?;
                
            Ok(labels.items.into_iter().map(|label| label.name).collect())
        } else {
            anyhow::bail!("User not authenticated")
        }
    }
    
    /// Get repository milestones (placeholder - API method not available)
    pub async fn get_repository_milestones(
        &self,
        user_id: Uuid,
        _owner: &str,
        _repo: &str,
    ) -> Result<Vec<String>> {
        if !self.is_authenticated(user_id).await {
            anyhow::bail!("User not authenticated");
        }
        
        // Placeholder implementation - Octocrab doesn't have list_milestones on IssueHandler
        Ok(vec![
            "Phase 1: Planning".to_string(),
            "Phase 2: Implementation".to_string(),
            "Phase 3: Testing".to_string(),
        ])
    }
    
    /// Create a repository webhook (placeholder - API method not available)
    pub async fn create_webhook(
        &self,
        user_id: Uuid,
        _owner: &str,
        _repo: &str,
        webhook_url: &str,
        _events: Vec<String>,
    ) -> Result<u64> {
        if !self.is_authenticated(user_id).await {
            anyhow::bail!("User not authenticated");
        }
        
        // Placeholder implementation - Octocrab doesn't have create_hook method
        println!("Would create webhook at: {}", webhook_url);
        Ok(12345) // Placeholder webhook ID
    }
    
    /// Search repositories
    pub async fn search_repositories(
        &self,
        user_id: Uuid,
        query: &str,
        per_page: Option<u32>,
    ) -> Result<Vec<GitHubProject>> {
        let octocrab_instances = self.octocrab_instances.read().await;
        
        if let Some(octocrab) = octocrab_instances.get(&user_id) {
            let mut search = octocrab
                .search()
                .repositories(query);
                
            if let Some(per_page) = per_page {
                search = search.per_page(per_page as u8);
            }
            
            let results = search.send().await?;
            
            let projects = results
                .items
                .into_iter()
                .map(|repo| GitHubProject {
                    id: repo.id.0,
                    name: repo.name,
                    description: repo.description,
                    owner: repo.owner.unwrap().login,
                    repository: repo.full_name.unwrap_or_default(),
                    url: repo.html_url.unwrap().to_string(),
                    created_at: repo.created_at.unwrap(),
                    updated_at: repo.updated_at.unwrap(),
                })
                .collect();
                
            Ok(projects)
        } else {
            anyhow::bail!("User not authenticated")
        }
    }
    
    /// Get user organizations
    pub async fn get_user_organizations(&self, user_id: Uuid) -> Result<Vec<String>> {
        let octocrab_instances = self.octocrab_instances.read().await;
        
        if let Some(octocrab) = octocrab_instances.get(&user_id) {
            let orgs = octocrab
                .current()
                .list_org_memberships_for_authenticated_user()
                .send()
                .await?;
                
            Ok(orgs.items.into_iter().map(|org| org.organization.login).collect())
        } else {
            anyhow::bail!("User not authenticated")
        }
    }
    
    /// Get organization repositories
    pub async fn get_organization_repositories(
        &self,
        user_id: Uuid,
        org: &str,
    ) -> Result<Vec<GitHubProject>> {
        let octocrab_instances = self.octocrab_instances.read().await;
        
        if let Some(octocrab) = octocrab_instances.get(&user_id) {
            let repos = octocrab
                .orgs(org)
                .list_repos()
                .send()
                .await?;
                
            let projects = repos
                .items
                .into_iter()
                .map(|repo| GitHubProject {
                    id: repo.id.0,
                    name: repo.name,
                    description: repo.description,
                    owner: repo.owner.unwrap().login,
                    repository: repo.full_name.unwrap_or_default(),
                    url: repo.html_url.unwrap().to_string(),
                    created_at: repo.created_at.unwrap(),
                    updated_at: repo.updated_at.unwrap(),
                })
                .collect();
                
            Ok(projects)
        } else {
            anyhow::bail!("User not authenticated")
        }
    }
}