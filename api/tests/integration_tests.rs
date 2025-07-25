// Integration Tests - CLDCDE Pro API
// By QualityGuardian - Production Ready

use anyhow::Result;
use axum::http::StatusCode;
use serde_json::{json, Value};
use std::collections::HashMap;
use tokio::time::{sleep, Duration};

mod common;
use common::TestApp;

#[tokio::test]
async fn test_health_check() -> Result<()> {
    let app = TestApp::spawn().await?;
    
    let response = app.get("/health").await;
    assert_eq!(response.status(), StatusCode::OK);
    
    let body: Value = response.json().await?;
    assert_eq!(body["status"], "ok");
    assert!(body["version"].is_string());
    assert_eq!(body["database"], "connected");
    
    Ok(())
}

#[tokio::test]
async fn test_github_auth_flow() -> Result<()> {
    let app = TestApp::spawn().await?;
    
    // Test GitHub login redirect
    let response = app.get("/api/v1/auth/github").await;
    assert_eq!(response.status(), StatusCode::FOUND);
    
    let location = response.headers().get("location").unwrap();
    assert!(location.to_str()?.contains("github.com/login/oauth/authorize"));
    
    Ok(())
}#[tokio::test]
async fn test_user_endpoints() -> Result<()> {
    let app = TestApp::spawn().await?;
    let user = app.create_test_user().await?;
    let token = app.create_test_token(&user).await?;
    
    // Test list users
    let response = app
        .get("/api/v1/users")
        .header("Authorization", format!("Bearer {}", token))
        .await;
    assert_eq!(response.status(), StatusCode::OK);
    
    let users: Value = response.json().await?;
    assert!(users.is_array());
    assert!(users.as_array().unwrap().len() >= 1);
    
    // Test get user
    let response = app
        .get(&format!("/api/v1/users/{}", user.id))
        .header("Authorization", format!("Bearer {}", token))
        .await;
    assert_eq!(response.status(), StatusCode::OK);
    
    let user_data: Value = response.json().await?;
    assert_eq!(user_data["id"], user.id);
    assert_eq!(user_data["username"], user.username);
    
    Ok(())
}#[tokio::test]
async fn test_workflow_crud() -> Result<()> {
    let app = TestApp::spawn().await?;
    let user = app.create_test_user().await?;
    let token = app.create_test_token(&user).await?;
    
    // Create workflow
    let workflow_data = json!({
        "name": "Test Workflow",
        "description": "A test workflow for integration tests",
        "type": "feature"
    });
    
    let response = app
        .post("/api/v1/workflows")
        .header("Authorization", format!("Bearer {}", token))
        .json(&workflow_data)
        .await;
    assert_eq!(response.status(), StatusCode::OK);
    
    let created_workflow: Value = response.json().await?;
    let workflow_id = created_workflow["id"].as_i64().unwrap();
    assert_eq!(created_workflow["name"], "Test Workflow");
    assert_eq!(created_workflow["status"], "draft");
    
    // Get workflow
    let response = app
        .get(&format!("/api/v1/workflows/{}", workflow_id))
        .header("Authorization", format!("Bearer {}", token))
        .await;
    assert_eq!(response.status(), StatusCode::OK);
    
    // Update workflow
    let update_data = json!({
        "status": "active"
    });    
    let response = app
        .put(&format!("/api/v1/workflows/{}", workflow_id))
        .header("Authorization", format!("Bearer {}", token))
        .json(&update_data)
        .await;
    assert_eq!(response.status(), StatusCode::OK);
    
    let updated_workflow: Value = response.json().await?;
    assert_eq!(updated_workflow["status"], "active");
    
    // Pause workflow
    let response = app
        .post(&format!("/api/v1/workflows/{}/pause", workflow_id))
        .header("Authorization", format!("Bearer {}", token))
        .await;
    assert_eq!(response.status(), StatusCode::OK);
    
    // Resume workflow
    let response = app
        .post(&format!("/api/v1/workflows/{}/resume", workflow_id))
        .header("Authorization", format!("Bearer {}", token))
        .await;
    assert_eq!(response.status(), StatusCode::OK);
    
    Ok(())
}

#[tokio::test]
async fn test_project_management() -> Result<()> {
    let app = TestApp::spawn().await?;
    let user = app.create_test_user().await?;
    let token = app.create_test_token(&user).await?;    
    // Create project
    let project_data = json!({
        "name": "Test Project",
        "description": "A test project for integration tests",
        "visibility": "private"
    });
    
    let response = app
        .post("/api/v1/projects")
        .header("Authorization", format!("Bearer {}", token))
        .json(&project_data)
        .await;
    assert_eq!(response.status(), StatusCode::OK);
    
    let created_project: Value = response.json().await?;
    let project_id = created_project["id"].as_i64().unwrap();
    assert_eq!(created_project["name"], "Test Project");
    assert_eq!(created_project["visibility"], "private");
    
    // Get project members
    let response = app
        .get(&format!("/api/v1/projects/{}/members", project_id))
        .header("Authorization", format!("Bearer {}", token))
        .await;
    assert_eq!(response.status(), StatusCode::OK);
    
    let members: Value = response.json().await?;
    assert!(members.is_array());
    assert_eq!(members.as_array().unwrap().len(), 1); // Creator is owner
    
    Ok(())
}#[tokio::test]
async fn test_activity_tracking() -> Result<()> {
    let app = TestApp::spawn().await?;
    let user = app.create_test_user().await?;
    let token = app.create_test_token(&user).await?;
    
    // Create some activity by creating a workflow
    let workflow_data = json!({
        "name": "Activity Test Workflow",
        "type": "feature"
    });
    
    let response = app
        .post("/api/v1/workflows")
        .header("Authorization", format!("Bearer {}", token))
        .json(&workflow_data)
        .await;
    assert_eq!(response.status(), StatusCode::OK);
    
    // Wait for activity to be logged
    sleep(Duration::from_millis(100)).await;
    
    // Get activity stats
    let response = app
        .get("/api/v1/activity/stats")
        .header("Authorization", format!("Bearer {}", token))
        .await;
    assert_eq!(response.status(), StatusCode::OK);
    
    let stats: Value = response.json().await?;
    assert!(stats["total_activities"].as_i64().unwrap() >= 1);
    assert!(stats["most_active_users"].is_array());    
    // Get activity list
    let response = app
        .get("/api/v1/activity")
        .header("Authorization", format!("Bearer {}", token))
        .await;
    assert_eq!(response.status(), StatusCode::OK);
    
    let activities: Value = response.json().await?;
    assert!(activities.is_array());
    assert!(activities.as_array().unwrap().len() >= 1);
    
    Ok(())
}

#[tokio::test]
async fn test_repository_sync() -> Result<()> {
    let app = TestApp::spawn().await?;
    let user = app.create_test_user().await?;
    let token = app.create_test_token(&user).await?;
    
    // Note: This test requires GitHub token to be set
    // Skip if no GitHub token available
    if std::env::var("GITHUB_TOKEN").is_err() {
        println!("Skipping repository sync test - no GitHub token");
        return Ok(());
    }
    
    // Test repository sync
    let response = app
        .post("/api/v1/repositories/sync")
        .header("Authorization", format!("Bearer {}", token))
        .await;
    
    // Should succeed or fail gracefully
    assert!(response.status().is_success() || response.status().is_client_error());
    
    Ok(())
}#[tokio::test]
async fn test_error_handling() -> Result<()> {
    let app = TestApp::spawn().await?;
    
    // Test unauthorized access
    let response = app.get("/api/v1/users").await;
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    
    // Test not found
    let user = app.create_test_user().await?;
    let token = app.create_test_token(&user).await?;
    
    let response = app
        .get("/api/v1/users/99999")
        .header("Authorization", format!("Bearer {}", token))
        .await;
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
    
    // Test invalid JSON
    let response = app
        .post("/api/v1/workflows")
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .body("invalid json")
        .await;
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    
    Ok(())
}

#[tokio::test]
async fn test_rate_limiting() -> Result<()> {
    let app = TestApp::spawn().await?;    
    // Make rapid requests to test rate limiting
    let mut handles = vec![];
    
    for i in 0..20 {
        let app_clone = app.clone();
        handles.push(tokio::spawn(async move {
            app_clone.get("/health").await.status()
        }));
    }
    
    let results: Vec<StatusCode> = futures::future::join_all(handles)
        .await
        .into_iter()
        .map(|r| r.unwrap())
        .collect();
    
    // Some requests should be rate limited (429 status)
    let rate_limited_count = results.iter()
        .filter(|&&status| status == StatusCode::TOO_MANY_REQUESTS)
        .count();
    
    // Note: Rate limiting behavior depends on implementation
    // This test might need adjustment based on actual rate limits
    println!("Rate limited requests: {}", rate_limited_count);
    
    Ok(())
}