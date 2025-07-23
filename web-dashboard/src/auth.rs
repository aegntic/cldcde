use anyhow::Result;
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{rand_core::OsRng, SaltString};
use base64::{Engine as _, engine::general_purpose};
use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

/// JWT Claims structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,      // Subject (user ID)
    pub exp: usize,       // Expiration time
    pub iat: usize,       // Issued at
    pub username: String,
    pub permissions: Vec<String>,
}

/// User authentication information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: Option<String>,
    pub password_hash: String,
    pub github_user_id: Option<u64>,
    pub permissions: Vec<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub last_login: Option<chrono::DateTime<chrono::Utc>>,
    pub is_active: bool,
}

impl User {
    pub fn new(username: String, password: &str) -> Result<Self> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2.hash_password(password.as_bytes(), &salt)
            .map_err(|e| anyhow::anyhow!("Password hashing failed: {}", e))?
            .to_string();

        Ok(Self {
            id: Uuid::new_v4(),
            username,
            email: None,
            password_hash,
            github_user_id: None,
            permissions: vec!["read".to_string(), "write".to_string()],
            created_at: chrono::Utc::now(),
            last_login: None,
            is_active: true,
        })
    }

    pub fn verify_password(&self, password: &str) -> Result<bool> {
        let parsed_hash = PasswordHash::new(&self.password_hash)
            .map_err(|e| anyhow::anyhow!("Password hash parsing failed: {}", e))?;
        let argon2 = Argon2::default();
        
        Ok(argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok())
    }

    pub fn update_last_login(&mut self) {
        self.last_login = Some(chrono::Utc::now());
    }
}

/// Authentication manager
pub struct AuthManager {
    jwt_secret: String,
    session_timeout: u64,
    users: Arc<RwLock<HashMap<String, User>>>,
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
}

impl AuthManager {
    /// Create a new authentication manager
    pub fn new(jwt_secret: String, session_timeout: u64) -> Result<Self> {
        let encoding_key = EncodingKey::from_secret(jwt_secret.as_ref());
        let decoding_key = DecodingKey::from_secret(jwt_secret.as_ref());

        let auth_manager = Self {
            jwt_secret: jwt_secret.clone(),
            session_timeout,
            users: Arc::new(RwLock::new(HashMap::new())),
            encoding_key,
            decoding_key,
        };

        // Create default admin user for development
        let admin_user = User::new("admin".to_string(), "admin123")?;
        tokio::spawn({
            let users = auth_manager.users.clone();
            async move {
                let mut users_write = users.write().await;
                users_write.insert("admin".to_string(), admin_user);
            }
        });

        Ok(auth_manager)
    }

    /// Authenticate user with username and password
    pub async fn authenticate(&self, username: &str, password: &str) -> Result<Option<String>> {
        let mut users = self.users.write().await;
        
        if let Some(user) = users.get_mut(username) {
            if user.is_active && user.verify_password(password)? {
                user.update_last_login();
                
                let claims = Claims {
                    sub: user.id.to_string(),
                    exp: (chrono::Utc::now() + chrono::Duration::seconds(self.session_timeout as i64)).timestamp() as usize,
                    iat: chrono::Utc::now().timestamp() as usize,
                    username: user.username.clone(),
                    permissions: user.permissions.clone(),
                };

                let token = encode(&Header::default(), &claims, &self.encoding_key)?;
                return Ok(Some(token));
            }
        }

        Ok(None)
    }

    /// Validate JWT token and return claims
    pub fn validate_token(&self, token: &str) -> Result<Claims> {
        let token_data = decode::<Claims>(
            token,
            &self.decoding_key,
            &Validation::new(Algorithm::HS256),
        )?;

        Ok(token_data.claims)
    }

    /// Create a new user
    pub async fn create_user(&self, username: String, password: &str, email: Option<String>) -> Result<Uuid> {
        let mut users = self.users.write().await;
        
        if users.contains_key(&username) {
            anyhow::bail!("User already exists");
        }

        let mut user = User::new(username.clone(), password)?;
        user.email = email;
        let user_id = user.id;
        
        users.insert(username, user);
        Ok(user_id)
    }

    /// Get user by username
    pub async fn get_user(&self, username: &str) -> Option<User> {
        let users = self.users.read().await;
        users.get(username).cloned()
    }

    /// Get user by ID
    pub async fn get_user_by_id(&self, user_id: Uuid) -> Option<User> {
        let users = self.users.read().await;
        users.values().find(|user| user.id == user_id).cloned()
    }

    /// Update user GitHub association
    pub async fn associate_github_user(&self, username: &str, github_user_id: u64) -> Result<()> {
        let mut users = self.users.write().await;
        
        if let Some(user) = users.get_mut(username) {
            user.github_user_id = Some(github_user_id);
            Ok(())
        } else {
            anyhow::bail!("User not found")
        }
    }

    /// Check if user has permission
    pub async fn has_permission(&self, user_id: Uuid, permission: &str) -> bool {
        if let Some(user) = self.get_user_by_id(user_id).await {
            user.permissions.contains(&permission.to_string()) ||
            user.permissions.contains(&"admin".to_string())
        } else {
            false
        }
    }

    /// Generate secure random string for sessions
    pub fn generate_secure_token() -> String {
        let mut bytes = vec![0u8; 32];
        use rand::RngCore;
        rand::thread_rng().fill_bytes(&mut bytes);
        general_purpose::URL_SAFE_NO_PAD.encode(&bytes)
    }
}

/// Login request structure
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
    pub remember_me: Option<bool>,
}

/// Login response structure
#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserInfo,
    pub expires_in: u64,
}

/// Public user information
#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: Uuid,
    pub username: String,
    pub email: Option<String>,
    pub permissions: Vec<String>,
    pub github_connected: bool,
}

impl From<&User> for UserInfo {
    fn from(user: &User) -> Self {
        Self {
            id: user.id,
            username: user.username.clone(),
            email: user.email.clone(),
            permissions: user.permissions.clone(),
            github_connected: user.github_user_id.is_some(),
        }
    }
}