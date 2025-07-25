// Authentication Module - CLDCDE Pro
// By SecurityMaster - Production Ready

use anyhow::Result;
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{rand_core::OsRng, SaltString};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::sync::Arc;
use time::{Duration, OffsetDateTime};
use octocrab::Octocrab;

#[derive(Debug, Clone)]
pub struct AuthService {
    db: Arc<SqlitePool>,
    jwt_secret: String,
    github_client_id: String,
    github_client_secret: String,
    github_redirect_uri: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: i64, // user_id
    pub username: String,
    pub exp: i64,
    pub iat: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitHubTokenResponse {
    pub access_token: String,
    pub token_type: String,
    pub scope: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitHubUser {
    pub id: i64,
    pub login: String,
    pub name: Option<String>,
    pub email: Option<String>,
    pub avatar_url: String,
}

impl AuthService {
    pub fn new(
        db: Arc<SqlitePool>,
        jwt_secret: String,
        github_client_id: String,
        github_client_secret: String,
        github_redirect_uri: String,
    ) -> Self {
        Self {
            db,
            jwt_secret,
            github_client_id,
            github_client_secret,
            github_redirect_uri,
        }
    }

    // Generate GitHub OAuth URL
    pub fn get_github_auth_url(&self, state: &str) -> String {
        format!(
            "https://github.com/login/oauth/authorize?client_id={}&redirect_uri={}&scope=repo,user,workflow,read:org&state={}",
            self.github_client_id,
            urlencoding::encode(&self.github_redirect_uri),
            state
        )
    }

    // Exchange code for access token
    pub async fn exchange_code_for_token(&self, code: &str) -> Result<GitHubTokenResponse> {
        let client = reqwest::Client::new();
        let params = [
            ("client_id", &self.github_client_id),
            ("client_secret", &self.github_client_secret),
            ("code", &code.to_string()),
            ("redirect_uri", &self.github_redirect_uri),
        ];

        let response = client
            .post("https://github.com/login/oauth/access_token")
            .header("Accept", "application/json")
            .form(&params)
            .send()
            .await?;

        let token_response = response.json::<GitHubTokenResponse>().await?;
        Ok(token_response)
    }

    // Get GitHub user info
    pub async fn get_github_user(&self, access_token: &str) -> Result<GitHubUser> {
        let octocrab = Octocrab::builder()
            .personal_token(access_token.to_string())
            .build()?;

        let user = octocrab.current().user().await?;
        
        Ok(GitHubUser {
            id: user.id.0 as i64,
            login: user.login,
            name: user.name,
            email: user.email,
            avatar_url: user.avatar_url.to_string(),
        })
    }

    // Create or update user in database
    pub async fn create_or_update_user(
        &self,
        github_user: &GitHubUser,
        access_token: &str,
    ) -> Result<i64> {
        // Encrypt the token before storage
        let encrypted_token = self.encrypt_token(access_token)?;

        let user_id = sqlx::query!(
            r#"
            INSERT INTO users (github_id, username, email, full_name, avatar_url, github_token, last_login_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, CURRENT_TIMESTAMP)
            ON CONFLICT(github_id) DO UPDATE SET
                username = excluded.username,
                email = excluded.email,
                full_name = excluded.full_name,
                avatar_url = excluded.avatar_url,
                github_token = excluded.github_token,
                last_login_at = CURRENT_TIMESTAMP
            RETURNING id
            "#,
            github_user.id,
            github_user.login,
            github_user.email,
            github_user.name,
            github_user.avatar_url,
            encrypted_token
        )
        .fetch_one(self.db.as_ref())
        .await?
        .id;

        Ok(user_id as i64)
    }

    // Generate JWT token
    pub fn generate_jwt(&self, user_id: i64, username: &str) -> Result<String> {
        let now = OffsetDateTime::now_utc();
        let exp = now + Duration::days(7);

        let claims = Claims {
            sub: user_id,
            username: username.to_string(),
            exp: exp.unix_timestamp(),
            iat: now.unix_timestamp(),
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_bytes()),
        )?;

        Ok(token)
    }

    // Validate JWT token
    pub fn validate_jwt(&self, token: &str) -> Result<Claims> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.jwt_secret.as_bytes()),
            &Validation::default(),
        )?;

        Ok(token_data.claims)
    }

    // Create session
    pub async fn create_session(
        &self,
        user_id: i64,
        ip_address: Option<&str>,
        user_agent: Option<&str>,
    ) -> Result<String> {
        let session_id = uuid::Uuid::new_v4().to_string();
        let expires_at = OffsetDateTime::now_utc() + Duration::days(30);

        sqlx::query!(
            r#"
            INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at)
            VALUES (?1, ?2, ?3, ?4, ?5)
            "#,
            session_id,
            user_id,
            ip_address,
            user_agent,
            expires_at
        )
        .execute(self.db.as_ref())
        .await?;

        Ok(session_id)
    }

    // Validate session
    pub async fn validate_session(&self, session_id: &str) -> Result<Option<i64>> {
        let session = sqlx::query!(
            r#"
            SELECT user_id, expires_at
            FROM sessions
            WHERE id = ?1 AND expires_at > CURRENT_TIMESTAMP
            "#,
            session_id
        )
        .fetch_optional(self.db.as_ref())
        .await?;

        Ok(session.map(|s| s.user_id))
    }

    // Encrypt token for storage
    fn encrypt_token(&self, token: &str) -> Result<String> {
        // In production, use proper encryption like AES-256-GCM
        // This is a placeholder for the actual implementation
        use base64::{Engine as _, engine::general_purpose};
        Ok(general_purpose::STANDARD.encode(token))
    }

    // Decrypt token from storage
    pub fn decrypt_token(&self, encrypted: &str) -> Result<String> {
        use base64::{Engine as _, engine::general_purpose};
        let decrypted = general_purpose::STANDARD.decode(encrypted)?;
        Ok(String::from_utf8(decrypted)?)
    }

    // Hash password (for future use if needed)
    pub fn hash_password(&self, password: &str) -> Result<String> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)?
            .to_string();
        Ok(password_hash)
    }

    // Verify password
    pub fn verify_password(&self, password: &str, hash: &str) -> Result<bool> {
        let parsed_hash = PasswordHash::new(hash)?;
        let argon2 = Argon2::default();
        Ok(argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok())
    }
}