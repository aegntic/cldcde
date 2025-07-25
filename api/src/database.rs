// Database module for CLDCDE Pro API
// By DataSorcerer

use anyhow::Result;
use sqlx::{migrate::MigrateDatabase, postgres::PgPool, Postgres};
use std::time::Duration;
use tracing::{info, error};

#[derive(Debug, Clone)]
pub struct Database {
    pub pool: PgPool,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self> {
        // Create database if it doesn't exist
        if !Postgres::database_exists(database_url).await.unwrap_or(false) {
            info!("Creating database {}", database_url);
            Postgres::create_database(database_url).await?;
        }

        // Create connection pool
        let pool = PgPool::connect(database_url).await?;

        Ok(Self { pool })
    }

    pub async fn migrate(&self) -> Result<()> {
        info!("Running database migrations");
        
        // Create tables if they don't exist
        sqlx::query(include_str!("../../../database/schema-postgres.sql"))
            .execute(&self.pool)
            .await?;

        info!("Database migrations completed successfully");
        Ok(())
    }

    pub async fn health_check(&self) -> Result<()> {
        sqlx::query("SELECT 1")
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn cleanup_expired_sessions(&self) -> Result<()> {
        let result = sqlx::query(
            "DELETE FROM sessions WHERE expires_at < NOW()"
        )
        .execute(&self.pool)
        .await?;

        if result.rows_affected() > 0 {
            info!("Cleaned up {} expired sessions", result.rows_affected());
        }

        Ok(())
    }
}

// Background cleanup task
pub async fn start_cleanup_task(db: Database) {
    let mut interval = tokio::time::interval(Duration::from_secs(3600)); // Run every hour
    
    loop {
        interval.tick().await;
        
        if let Err(e) = db.cleanup_expired_sessions().await {
            error!("Failed to cleanup expired sessions: {}", e);
        }
    }
}