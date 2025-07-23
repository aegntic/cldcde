use anyhow::Result;
use chrono::{DateTime, Utc};
use octocrab::Octocrab;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

pub mod auth;
pub mod client;
pub mod project_sync;
pub mod simple;

pub use auth::*;
pub use client::*;
pub use project_sync::*;
pub use simple::*;

/// GitHub OAuth Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubConfig {
    pub client_id: String,
    pub client_secret: String,
    pub redirect_uri: String,
    pub app_name: String,
    pub scopes: Vec<String>,
}

impl Default for GitHubConfig {
    fn default() -> Self {
        Self {
            client_id: std::env::var("GITHUB_CLIENT_ID").unwrap_or_default(),
            client_secret: std::env::var("GITHUB_CLIENT_SECRET").unwrap_or_default(),
            redirect_uri: "http://localhost:3001/auth/github/callback".to_string(),
            app_name: "Enhanced Tmux Orchestrator".to_string(),
            scopes: vec![
                "read:user".to_string(),
                "user:email".to_string(),
                "repo".to_string(),
                "project".to_string(),
                "admin:org".to_string(),
            ],
        }
    }
}

/// GitHub User Information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubUser {
    pub id: u64,
    pub login: String,
    pub name: Option<String>,
    pub email: Option<String>,
    pub avatar_url: String,
    pub company: Option<String>,
    pub location: Option<String>,
    pub bio: Option<String>,
}

/// GitHub Authentication Token
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubToken {
    pub access_token: String,
    pub token_type: String,
    pub scope: String,
    pub expires_at: Option<DateTime<Utc>>,
    pub refresh_token: Option<String>,
}

/// GitHub Project Information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubProject {
    pub id: u64,
    pub name: String,
    pub description: Option<String>,
    pub owner: String,
    pub repository: String,
    pub url: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// GitHub Issue Information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubIssue {
    pub id: u64,
    pub number: u32,
    pub title: String,
    pub body: Option<String>,
    pub state: String,
    pub labels: Vec<String>,
    pub assignees: Vec<String>,
    pub milestone: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Main GitHub Integration Manager
#[derive(Debug)]
pub struct GitHubIntegration {
    pub config: GitHubConfig,
    pub authenticated_users: Arc<RwLock<HashMap<Uuid, GitHubUser>>>,
    pub user_tokens: Arc<RwLock<HashMap<Uuid, GitHubToken>>>,
    pub project_cache: Arc<RwLock<HashMap<String, GitHubProject>>>,
    pub octocrab_instances: Arc<RwLock<HashMap<Uuid, Octocrab>>>,
}

impl GitHubIntegration {
    pub fn new(config: GitHubConfig) -> Self {
        Self {
            config,
            authenticated_users: Arc::new(RwLock::new(HashMap::new())),
            user_tokens: Arc::new(RwLock::new(HashMap::new())),
            project_cache: Arc::new(RwLock::new(HashMap::new())),
            octocrab_instances: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Generate OAuth authorization URL
    pub fn get_auth_url(&self, state: &str) -> String {
        let scopes = self.config.scopes.join(",");
        format!(
            "https://github.com/login/oauth/authorize?client_id={}&redirect_uri={}&scope={}&state={}",
            self.config.client_id,
            urlencoding::encode(&self.config.redirect_uri),
            urlencoding::encode(&scopes),
            state
        )
    }

    /// Check if user is authenticated
    pub async fn is_authenticated(&self, user_id: Uuid) -> bool {
        let users = self.authenticated_users.read().await;
        users.contains_key(&user_id)
    }

    /// Get authenticated user information
    pub async fn get_user(&self, user_id: Uuid) -> Option<GitHubUser> {
        let users = self.authenticated_users.read().await;
        users.get(&user_id).cloned()
    }

    /// Get user's repositories
    pub async fn get_user_repositories(&self, user_id: Uuid) -> Result<Vec<GitHubProject>> {
        let octocrab_instances = self.octocrab_instances.read().await;
        
        if let Some(octocrab) = octocrab_instances.get(&user_id) {
            let repos = octocrab
                .current()
                .list_repos_for_authenticated_user()
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

    /// Get issues for a repository
    pub async fn get_repository_issues(
        &self,
        user_id: Uuid,
        owner: &str,
        repo: &str,
    ) -> Result<Vec<GitHubIssue>> {
        let octocrab_instances = self.octocrab_instances.read().await;
        
        if let Some(octocrab) = octocrab_instances.get(&user_id) {
            let issues = octocrab
                .issues(owner, repo)
                .list()
                .send()
                .await?;

            let github_issues = issues
                .items
                .into_iter()
                .map(|issue| GitHubIssue {
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
                .collect();

            Ok(github_issues)
        } else {
            anyhow::bail!("User not authenticated")
        }
    }
}

// Placeholder setup function
pub fn setup_oauth() -> Result<()> {
    println!("GitHub OAuth integration setup...");
    Ok(())
}