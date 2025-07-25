// Authentication service for CLDCDE Pro API
// By SecurityMaster

use anyhow::Result;
use axum::async_trait;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct AuthService {
    pub pool: PgPool,
    pub jwt_secret: String,
    pub github_client_id: String,
    pub github_client_secret: String,
    pub github_redirect_uri: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,  // Subject (user ID)
    pub exp: usize,   // Expiration time
    pub iat: usize,   // Issued at
    pub jti: String,  // JWT ID
}

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: i64,
    pub github_id: i64,
    pub username: String,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
    pub access_token: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone)]
pub struct CurrentUser {
    pub id: i64,
    pub username: String,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
}

#[async_trait]
impl<S> axum::extract::FromRequestParts<S> for CurrentUser
where
    S: Send + Sync,
{
    type Rejection = crate::error::AppError;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _state: &S,
    ) -> Result<Self, Self::Rejection> {
        // Extract user from request extensions (set by auth middleware)
        parts
            .extensions
            .get::<CurrentUser>()
            .cloned()
            .ok_or(crate::error::AppError::Unauthorized)
    }
}

impl AuthService {
    pub fn new(
        pool: PgPool,
        jwt_secret: String,
        github_client_id: String,
        github_client_secret: String,
        github_redirect_uri: String,
    ) -> Self {
        Self {
            pool,
            jwt_secret,
            github_client_id,
            github_client_secret,
            github_redirect_uri,
        }
    }

    pub fn generate_jwt(&self, user_id: i64) -> Result<String> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs() as usize;

        let claims = Claims {
            sub: user_id.to_string(),
            exp: now + 24 * 60 * 60, // 24 hours
            iat: now,
            jti: Uuid::new_v4().to_string(),
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_ref()),
        )?;

        Ok(token)
    }

    pub fn verify_jwt(&self, token: &str) -> Result<Claims> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.jwt_secret.as_ref()),
            &Validation::default(),
        )?;

        Ok(token_data.claims)
    }

    pub async fn get_user_by_id(&self, user_id: i64) -> Result<Option<User>> {
        let user = sqlx::query_as!(
            User,
            "SELECT * FROM users WHERE id = ?",
            user_id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    pub async fn upsert_github_user(
        &self,
        github_id: i64,
        username: &str,
        email: Option<&str>,
        avatar_url: Option<&str>,
        access_token: &str,
    ) -> Result<User> {
        let now = chrono::Utc::now();

        let user = sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (github_id, username, email, avatar_url, access_token, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(github_id) DO UPDATE SET
                username = excluded.username,
                email = excluded.email,
                avatar_url = excluded.avatar_url,
                access_token = excluded.access_token,
                updated_at = excluded.updated_at
            RETURNING *
            "#,
            github_id,
            username,
            email,
            avatar_url,
            access_token,
            now,
            now
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(user)
    }

    pub fn get_github_auth_url(&self) -> String {
        format!(
            "https://github.com/login/oauth/authorize?client_id={}&redirect_uri={}&scope=repo%20user",
            self.github_client_id,
            urlencoding::encode(&self.github_redirect_uri)
        )
    }

    pub async fn exchange_github_code(&self, code: &str) -> Result<String> {
        let client = reqwest::Client::new();
        
        let params = [
            ("client_id", self.github_client_id.as_str()),
            ("client_secret", self.github_client_secret.as_str()),
            ("code", code),
        ];

        let response = client
            .post("https://github.com/login/oauth/access_token")
            .header("Accept", "application/json")
            .form(&params)
            .send()
            .await?;

        let auth_response: serde_json::Value = response.json().await?;
        
        let access_token = auth_response
            .get("access_token")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("No access token in response"))?;

        Ok(access_token.to_string())
    }

    pub async fn get_github_user(&self, access_token: &str) -> Result<(i64, String, Option<String>, Option<String>)> {
        let client = reqwest::Client::new();
        
        let response = client
            .get("https://api.github.com/user")
            .header("Authorization", format!("token {}", access_token))
            .header("User-Agent", "CLDCDE-Pro")
            .send()
            .await?;

        let user_data: serde_json::Value = response.json().await?;
        
        let id = user_data
            .get("id")
            .and_then(|v| v.as_i64())
            .ok_or_else(|| anyhow::anyhow!("No id in user response"))?;

        let login = user_data
            .get("login")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("No login in user response"))?;

        let email = user_data
            .get("email")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        let avatar_url = user_data
            .get("avatar_url")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        Ok((id, login.to_string(), email, avatar_url))
    }
}