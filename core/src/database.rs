// Database Connection Module - CLDCDE Pro
// By DataSorcerer - Production Ready

use anyhow::Result;
use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    Pool, Sqlite,
};
use std::str::FromStr;
use std::sync::Arc;
use tracing::{info, error};

pub type DbPool = Arc<Pool<Sqlite>>;

#[derive(Clone)]
pub struct Database {
    pub pool: DbPool,
}

impl Database {
    /// Create a new database connection pool
    pub async fn new(database_url: &str) -> Result<Self> {
        info!("Connecting to database...");

        let options = SqliteConnectOptions::from_str(database_url)?
            .create_if_missing(true)
            .foreign_keys(true)
            .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
            .synchronous(sqlx::sqlite::SqliteSynchronous::Normal)
            .busy_timeout(std::time::Duration::from_secs(30));

        let pool = SqlitePoolOptions::new()
            .max_connections(25)
            .min_connections(5)
            .connect_timeout(std::time::Duration::from_secs(10))
            .idle_timeout(std::time::Duration::from_secs(600))
            .connect_with(options)
            .await?;

        info!("Database connected successfully");

        Ok(Self {
            pool: Arc::new(pool),
        })
    }

    /// Run database migrations
    pub async fn migrate(&self) -> Result<()> {
        info!("Running database migrations...");
        
        sqlx::migrate!("./database/migrations")
            .run(self.pool.as_ref())
            .await?;
        
        info!("Database migrations completed");
        Ok(())
    }

    /// Health check for the database
    pub async fn health_check(&self) -> Result<()> {
        sqlx::query("SELECT 1")
            .fetch_one(self.pool.as_ref())
            .await?;
        Ok(())
    }

    /// Get connection pool
    pub fn get_pool(&self) -> &Pool<Sqlite> {
        &self.pool
    }

    /// Begin a transaction
    pub async fn begin_transaction(&self) -> Result<sqlx::Transaction<'_, Sqlite>> {
        Ok(self.pool.begin().await?)
    }

    /// Clean up expired sessions
    pub async fn cleanup_expired_sessions(&self) -> Result<u64> {
        let result = sqlx::query!(
            "DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP"
        )
        .execute(self.pool.as_ref())
        .await?;

        Ok(result.rows_affected())
    }

    /// Clean up old rate limit entries
    pub async fn cleanup_rate_limits(&self) -> Result<u64> {
        let result = sqlx::query!(
            "DELETE FROM rate_limits WHERE window_start < datetime('now', '-1 hour')"
        )
        .execute(self.pool.as_ref())
        .await?;

        Ok(result.rows_affected())
    }
}

/// Database repository pattern base trait
#[async_trait::async_trait]
pub trait Repository {
    type Entity;
    type CreateInput;
    type UpdateInput;

    async fn create(&self, input: Self::CreateInput) -> Result<Self::Entity>;
    async fn find_by_id(&self, id: i64) -> Result<Option<Self::Entity>>;
    async fn update(&self, id: i64, input: Self::UpdateInput) -> Result<Self::Entity>;
    async fn delete(&self, id: i64) -> Result<bool>;
    async fn list(&self, limit: i64, offset: i64) -> Result<Vec<Self::Entity>>;
}

/// User repository
pub struct UserRepository {
    db: Database,
}

impl UserRepository {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    pub async fn find_by_github_id(&self, github_id: i64) -> Result<Option<User>> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT id, github_id, username, email, full_name, avatar_url,
                   created_at, updated_at, last_login_at, is_active
            FROM users
            WHERE github_id = ?1
            "#,
            github_id
        )
        .fetch_optional(self.db.get_pool())
        .await?;

        Ok(user)
    }

    pub async fn find_by_username(&self, username: &str) -> Result<Option<User>> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT id, github_id, username, email, full_name, avatar_url,
                   created_at, updated_at, last_login_at, is_active
            FROM users
            WHERE username = ?1
            "#,
            username
        )
        .fetch_optional(self.db.get_pool())
        .await?;

        Ok(user)
    }

    pub async fn update_last_login(&self, user_id: i64) -> Result<()> {
        sqlx::query!(
            "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?1",
            user_id
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(())
    }
}

/// Models
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct User {
    pub id: i64,
    pub github_id: i64,
    pub username: String,
    pub email: Option<String>,
    pub full_name: Option<String>,
    pub avatar_url: Option<String>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
    pub last_login_at: Option<chrono::NaiveDateTime>,
    pub is_active: bool,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct Session {
    pub id: String,
    pub user_id: i64,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub expires_at: chrono::NaiveDateTime,
    pub created_at: chrono::NaiveDateTime,
}

/// Background task to clean up expired data
pub async fn start_cleanup_task(db: Database) {
    use tokio::time::{interval, Duration};

    let mut interval = interval(Duration::from_secs(3600)); // Run every hour

    loop {
        interval.tick().await;
        
        // Clean up expired sessions
        match db.cleanup_expired_sessions().await {
            Ok(count) => {
                if count > 0 {
                    info!("Cleaned up {} expired sessions", count);
                }
            }
            Err(e) => error!("Failed to clean up sessions: {}", e),
        }

        // Clean up old rate limits
        match db.cleanup_rate_limits().await {
            Ok(count) => {
                if count > 0 {
                    info!("Cleaned up {} old rate limit entries", count);
                }
            }
            Err(e) => error!("Failed to clean up rate limits: {}", e),
        }
    }
}