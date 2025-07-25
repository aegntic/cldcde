// Test Utilities - CLDCDE Pro API
// By QualityGuardian - Production Ready

use anyhow::Result;
use axum::http::{HeaderMap, HeaderValue, Method, StatusCode};
use serde_json::Value;
use std::sync::Arc;
use tokio::net::TcpListener;
use uuid::Uuid;

pub struct TestApp {
    pub base_url: String,
    pub client: reqwest::Client,
    pub state: Arc<crate::AppState>,
}

pub struct TestUser {
    pub id: i64,
    pub username: String,
    pub email: String,
    pub github_id: i64,
}

impl TestApp {
    pub async fn spawn() -> Result<Self> {
        // Use in-memory SQLite for tests
        let database_url = ":memory:";
        let jwt_secret = "test-secret-key";
        let github_client_id = "test-client-id";
        let github_client_secret = "test-client-secret";
        let github_redirect_uri = "http://localhost:3000/auth/github/callback";

        // Initialize test database
        let db = crate::database::Database::new(database_url).await?;
        db.migrate().await?;

        // Initialize auth service
        let auth = crate::auth::AuthService::new(
            db.pool.clone(),
            jwt_secret.to_string(),
            github_client_id.to_string(),
            github_client_secret.to_string(),
            github_redirect_uri.to_string(),
        );        
        // Create app state
        let state = Arc::new(crate::AppState { db, auth });
        
        // Create app with test configuration
        let app = crate::create_app(state.clone());
        
        // Find available port
        let listener = TcpListener::bind("127.0.0.1:0").await?;
        let addr = listener.local_addr()?;
        let port = addr.port();
        
        // Start server
        tokio::spawn(async move {
            axum::serve(listener, app).await.unwrap();
        });
        
        // Wait for server to start
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        
        let base_url = format!("http://127.0.0.1:{}", port);
        let client = reqwest::Client::new();
        
        Ok(Self {
            base_url,
            client,
            state,
        })
    }
    
    pub async fn create_test_user(&self) -> Result<TestUser> {
        let github_id = rand::random::<i64>().abs();
        let username = format!("testuser{}", github_id);
        let email = format!("{}@example.com", username);
        
        let user_id = sqlx::query!(            r#"
            INSERT INTO users (github_id, username, email, avatar_url)
            VALUES (?1, ?2, ?3, ?4)
            "#,
            github_id,
            username,
            email,
            "https://avatars.githubusercontent.com/u/123456?v=4"
        )
        .execute(&self.state.db.pool)
        .await?
        .last_insert_rowid();
        
        Ok(TestUser {
            id: user_id,
            username,
            email,
            github_id,
        })
    }
    
    pub async fn create_test_token(&self, user: &TestUser) -> Result<String> {
        self.state.auth.create_token(user.id).await
    }
    
    pub fn get(&self, path: &str) -> RequestBuilder {
        RequestBuilder::new(&self.client, Method::GET, &format!("{}{}", self.base_url, path))
    }
    
    pub fn post(&self, path: &str) -> RequestBuilder {
        RequestBuilder::new(&self.client, Method::POST, &format!("{}{}", self.base_url, path))
    }    
    pub fn put(&self, path: &str) -> RequestBuilder {
        RequestBuilder::new(&self.client, Method::PUT, &format!("{}{}", self.base_url, path))
    }
    
    pub fn delete(&self, path: &str) -> RequestBuilder {
        RequestBuilder::new(&self.client, Method::DELETE, &format!("{}{}", self.base_url, path))
    }
}

impl Clone for TestApp {
    fn clone(&self) -> Self {
        Self {
            base_url: self.base_url.clone(),
            client: self.client.clone(),
            state: self.state.clone(),
        }
    }
}

pub struct RequestBuilder {
    request: reqwest::RequestBuilder,
}

impl RequestBuilder {
    fn new(client: &reqwest::Client, method: Method, url: &str) -> Self {
        let request = match method {
            Method::GET => client.get(url),
            Method::POST => client.post(url),
            Method::PUT => client.put(url),
            Method::DELETE => client.delete(url),
            _ => panic!("Unsupported method"),
        };        
        Self { request }
    }
    
    pub fn header(self, name: &str, value: &str) -> Self {
        Self {
            request: self.request.header(name, value),
        }
    }
    
    pub fn json(self, json: &serde_json::Value) -> Self {
        Self {
            request: self.request.json(json),
        }
    }
    
    pub fn body(self, body: &str) -> Self {
        Self {
            request: self.request.body(body.to_string()),
        }
    }
    
    pub async fn await(self) -> reqwest::Response {
        self.request.send().await.expect("Failed to send request")
    }
}

pub trait ResponseExt {
    async fn json<T: serde::de::DeserializeOwned>(self) -> Result<T>;
}

impl ResponseExt for reqwest::Response {
    async fn json<T: serde::de::DeserializeOwned>(self) -> Result<T> {
        let text = self.text().await?;
        Ok(serde_json::from_str(&text)?)
    }
}