// GitHub Integration Module - CLDCDE Pro
// By CodeWhisperer - Production Ready

use anyhow::Result;
use octocrab::{models, Octocrab, Page};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{info, error};

#[derive(Clone)]
pub struct GitHubClient {
    client: Arc<Octocrab>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Repository {
    pub id: i64,
    pub owner: String,
    pub name: String,
    pub full_name: String,
    pub description: Option<String>,
    pub is_private: bool,
    pub default_branch: String,
    pub language: Option<String>,
    pub stars_count: i32,
    pub forks_count: i32,
    pub open_issues_count: i32,
    pub last_pushed_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PullRequest {
    pub id: i64,
    pub number: i32,
    pub title: String,
    pub state: String,
    pub user: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl GitHubClient {
    /// Create a new GitHub client with user token
    pub fn new(token: String) -> Result<Self> {
        let client = Octocrab::builder()
            .personal_token(token)
            .build()?;

        Ok(Self {
            client: Arc::new(client),
        })
    }

    /// List user repositories
    pub async fn list_user_repos(&self, page: u32) -> Result<Page<models::Repository>> {
        info!("Fetching user repositories, page: {}", page);
        
        let repos = self.client
            .current()
            .list_repos_for_authenticated_user()
            .per_page(30)
            .page(page)
            .send()
            .await?;
        
        Ok(repos)
    }

    /// Get repository details
    pub async fn get_repository(&self, owner: &str, repo: &str) -> Result<Repository> {
        info!("Fetching repository: {}/{}", owner, repo);
        
        let repo = self.client
            .repos(owner, repo)
            .get()
            .await?;
        
        Ok(self.convert_repo(repo))
    }

    /// List repository pull requests
    pub async fn list_pull_requests(
        &self,
        owner: &str,
        repo: &str,
        state: &str,
    ) -> Result<Vec<PullRequest>> {
        info!("Fetching pull requests for {}/{}", owner, repo);
        
        let pulls = self.client
            .pulls(owner, repo)
            .list()
            .state(match state {
                "closed" => octocrab::params::State::Closed,
                "all" => octocrab::params::State::All,
                _ => octocrab::params::State::Open,
            })
            .per_page(50)
            .send()
            .await?;
        
        Ok(pulls.items.into_iter().map(|pr| PullRequest {
            id: pr.id.0 as i64,
            number: pr.number as i32,
            title: pr.title.unwrap_or_default(),
            state: pr.state.to_string(),
            user: pr.user.map(|u| u.login).unwrap_or_default(),
            created_at: pr.created_at.unwrap(),
            updated_at: pr.updated_at.unwrap(),
        }).collect())
    }

    /// Create a new issue
    pub async fn create_issue(
        &self,
        owner: &str,
        repo: &str,
        title: &str,
        body: &str,
    ) -> Result<models::issues::Issue> {
        info!("Creating issue in {}/{}", owner, repo);
        
        let issue = self.client
            .issues(owner, repo)
            .create(title)
            .body(body)
            .send()
            .await?;
        
        Ok(issue)
    }

    /// Get repository commits
    pub async fn list_commits(
        &self,
        owner: &str,
        repo: &str,
        branch: Option<&str>,
    ) -> Result<Vec<models::repos::RepoCommit>> {
        info!("Fetching commits for {}/{}", owner, repo);
        
        let mut request = self.client
            .repos(owner, repo)
            .list_commits();
        
        if let Some(branch) = branch {
            request = request.branch(branch);
        }
        
        let commits = request
            .per_page(50)
            .send()
            .await?;
        
        Ok(commits.items)
    }

    /// Get repository branches
    pub async fn list_branches(
        &self,
        owner: &str,
        repo: &str,
    ) -> Result<Vec<models::repos::Branch>> {
        info!("Fetching branches for {}/{}", owner, repo);
        
        let branches = self.client
            .repos(owner, repo)
            .list_branches()
            .per_page(100)
            .send()
            .await?;
        
        Ok(branches.items)
    }

    /// Create a webhook
    pub async fn create_webhook(
        &self,
        owner: &str,
        repo: &str,
        url: &str,
        events: Vec<&str>,
    ) -> Result<models::hooks::Hook> {
        info!("Creating webhook for {}/{}", owner, repo);
        
        let config = serde_json::json!({
            "url": url,
            "content_type": "json",
            "insecure_ssl": "0"
        });
        
        let hook = self.client
            .repos(owner, repo)
            .create_hook("web")
            .config(config)
            .events(events)
            .active(true)
            .send()
            .await?;
        
        Ok(hook)
    }

    /// Helper to convert octocrab repo to our model
    fn convert_repo(&self, repo: models::Repository) -> Repository {
        Repository {
            id: repo.id.0 as i64,
            owner: repo.owner.map(|o| o.login).unwrap_or_default(),
            name: repo.name,
            full_name: repo.full_name.unwrap_or_default(),
            description: repo.description,
            is_private: repo.private.unwrap_or(false),
            default_branch: repo.default_branch.unwrap_or_else(|| "main".to_string()),
            language: repo.language,
            stars_count: repo.stargazers_count.unwrap_or(0) as i32,
            forks_count: repo.forks_count.unwrap_or(0) as i32,
            open_issues_count: repo.open_issues_count.unwrap_or(0) as i32,
            last_pushed_at: repo.pushed_at,
        }
    }
}

/// Webhook payload structures
#[derive(Debug, Deserialize)]
pub struct WebhookPayload {
    pub action: Option<String>,
    pub repository: models::Repository,
    pub sender: models::User,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum GitHubEvent {
    #[serde(rename = "push")]
    Push {
        ref_: String,
        commits: Vec<CommitInfo>,
    },
    #[serde(rename = "pull_request")]
    PullRequest {
        action: String,
        pull_request: models::pulls::PullRequest,
    },
    #[serde(rename = "issues")]
    Issues {
        action: String,
        issue: models::issues::Issue,
    },
}

#[derive(Debug, Deserialize)]
pub struct CommitInfo {
    pub id: String,
    pub message: String,
    pub author: CommitAuthor,
}

#[derive(Debug, Deserialize)]
pub struct CommitAuthor {
    pub name: String,
    pub email: String,
}