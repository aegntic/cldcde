//! Simple debug server to test basic Axum functionality

use axum::{http::StatusCode, response::Json, routing::get, Router};
use serde_json::json;
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    println!("🔧 Debug: Starting simple Axum server on port 3002...");
    
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health));
    
    let addr = SocketAddr::from(([0, 0, 0, 0], 3002));
    println!("Debug server listening on http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn root() -> &'static str {
    "Hello from simple debug server!"
}

async fn health() -> Json<serde_json::Value> {
    Json(json!({"status": "ok", "debug": true}))
}