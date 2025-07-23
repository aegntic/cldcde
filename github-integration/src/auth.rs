use anyhow::Result;
use chrono::{DateTime, Utc};
use octocrab::Octocrab;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

use crate::{GitHubConfig, GitHubToken, GitHubUser, GitHubIntegration};

/// OAuth callback response from GitHub
#[derive(Debug, Deserialize)]
pub struct GitHubOAuthCallback {
    pub code: String,
    pub state: String,
}

/// GitHub OAuth token response
#[derive(Debug, Deserialize)]
pub struct GitHubTokenResponse {
    pub access_token: String,
    pub token_type: String,
    pub scope: String,
    pub refresh_token: Option<String>,
    pub refresh_token_expires_in: Option<u64>,
}

/// GitHub user information from API
#[derive(Debug, Deserialize)]
pub struct GitHubUserResponse {
    pub id: u64,
    pub login: String,
    pub name: Option<String>,
    pub email: Option<String>,
    pub avatar_url: String,
    pub company: Option<String>,
    pub location: Option<String>,
    pub bio: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl GitHubIntegration {
    /// Handle OAuth callback and exchange code for token
    pub async fn handle_oauth_callback(
        &self,
        callback: GitHubOAuthCallback,
    ) -> Result<(Uuid, GitHubUser)> {
        // Exchange code for access token
        let token = self.exchange_code_for_token(&callback.code).await?;
        
        // Get user information using the token
        let user_info = self.get_user_info(&token.access_token).await?;
        
        // Generate user ID and store authentication data
        let user_id = Uuid::new_v4();
        
        let github_user = GitHubUser {
            id: user_info.id,
            login: user_info.login.clone(),
            name: user_info.name.clone(),
            email: user_info.email.clone(),
            avatar_url: user_info.avatar_url.clone(),
            company: user_info.company.clone(),
            location: user_info.location.clone(),
            bio: user_info.bio.clone(),
        };
        
        // Store user and token
        {
            let mut users = self.authenticated_users.write().await;
            users.insert(user_id, github_user.clone());
        }
        
        {
            let mut tokens = self.user_tokens.write().await;
            tokens.insert(user_id, token.clone());
        }
        
        // Create authenticated Octocrab instance
        let octocrab = Octocrab::builder()
            .personal_token(token.access_token.clone())
            .build()?;
            
        {
            let mut instances = self.octocrab_instances.write().await;
            instances.insert(user_id, octocrab);
        }
        
        Ok((user_id, github_user))
    }
    
    /// Exchange authorization code for access token
    async fn exchange_code_for_token(&self, code: &str) -> Result<GitHubToken> {
        let client = Client::new();
        
        let params = HashMap::from([
            ("client_id", self.config.client_id.as_str()),
            ("client_secret", self.config.client_secret.as_str()),
            ("code", code),
        ]);
        
        let response = client
            .post("https://github.com/login/oauth/access_token")
            .header("Accept", "application/json")
            .form(&params)
            .send()
            .await?;
            
        if response.status().is_success() {
            let token_response: GitHubTokenResponse = response.json().await?;
            
            Ok(GitHubToken {
                access_token: token_response.access_token,
                token_type: token_response.token_type,
                scope: token_response.scope,
                expires_at: None, // GitHub tokens don't expire by default
                refresh_token: token_response.refresh_token,
            })
        } else {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to exchange code for token: {}", error_text)
        }
    }
    
    /// Get user information from GitHub API
    async fn get_user_info(&self, access_token: &str) -> Result<GitHubUserResponse> {
        let client = Client::new();
        
        let response = client
            .get("https://api.github.com/user")
            .header("Authorization", format!("token {}", access_token))
            .header("User-Agent", &self.config.app_name)
            .send()
            .await?;
            
        if response.status().is_success() {
            let user_info: GitHubUserResponse = response.json().await?;
            Ok(user_info)
        } else {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to get user info: {}", error_text)
        }
    }
    
    /// Refresh access token if needed
    pub async fn refresh_token(&self, user_id: Uuid) -> Result<GitHubToken> {
        let refresh_token = {
            let tokens = self.user_tokens.read().await;
            if let Some(token) = tokens.get(&user_id) {
                token.refresh_token.clone()
            } else {
                anyhow::bail!("User not found")
            }
        };
        
        if let Some(refresh_token) = refresh_token {
            let client = Client::new();
            
            let params = HashMap::from([
                ("client_id", self.config.client_id.as_str()),
                ("client_secret", self.config.client_secret.as_str()),
                ("refresh_token", refresh_token.as_str()),
                ("grant_type", "refresh_token"),
            ]);
            
            let response = client
                .post("https://github.com/login/oauth/access_token")
                .header("Accept", "application/json")
                .form(&params)
                .send()
                .await?;
                
            if response.status().is_success() {
                let token_response: GitHubTokenResponse = response.json().await?;
                
                let new_token = GitHubToken {
                    access_token: token_response.access_token,
                    token_type: token_response.token_type,
                    scope: token_response.scope,
                    expires_at: None,
                    refresh_token: token_response.refresh_token,
                };
                
                // Update stored token
                {
                    let mut tokens = self.user_tokens.write().await;
                    tokens.insert(user_id, new_token.clone());
                }
                
                // Update Octocrab instance
                let octocrab = Octocrab::builder()
                    .personal_token(new_token.access_token.clone())
                    .build()?;
                    
                {
                    let mut instances = self.octocrab_instances.write().await;
                    instances.insert(user_id, octocrab);
                }
                
                Ok(new_token)
            } else {
                let error_text = response.text().await?;
                anyhow::bail!("Failed to refresh token: {}", error_text)
            }
        } else {
            anyhow::bail!("No refresh token available")
        }
    }
    
    /// Revoke user authentication
    pub async fn revoke_authentication(&self, user_id: Uuid) -> Result<()> {
        // Remove from all maps
        {
            let mut users = self.authenticated_users.write().await;
            users.remove(&user_id);
        }
        
        {
            let mut tokens = self.user_tokens.write().await;
            tokens.remove(&user_id);
        }
        
        {
            let mut instances = self.octocrab_instances.write().await;
            instances.remove(&user_id);
        }
        
        Ok(())
    }
    
    /// Check if token needs refresh (placeholder - GitHub tokens don't expire)
    pub async fn needs_token_refresh(&self, user_id: Uuid) -> bool {
        let tokens = self.user_tokens.read().await;
        if let Some(token) = tokens.get(&user_id) {
            if let Some(expires_at) = token.expires_at {
                return expires_at <= Utc::now();
            }
        }
        false
    }
}