#!/usr/bin/env rust-script

//! Simple test for Phase 2 Vibe Kanban Dashboard
//! 
//! This script tests the dashboard functionality by:
//! 1. Starting the dashboard server
//! 2. Making HTTP requests to test API endpoints
//! 3. Verifying WebSocket connectivity
//! 4. Validating the HTML dashboard renders

use std::time::Duration;
use tokio::time::sleep;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🧪 Phase 2 Dashboard Integration Test");
    println!("=====================================");
    
    // Test 1: Start dashboard server
    println!("\n1. Testing dashboard server startup...");
    
    // Use a test port to avoid conflicts
    let test_port = 3001;
    
    // Start dashboard in background
    let dashboard_handle = tokio::spawn(async move {
        match vibe_kanban::start_dashboard(test_port).await {
            Ok(_) => println!("Dashboard server started successfully"),
            Err(e) => eprintln!("Dashboard server failed: {}", e),
        }
    });
    
    // Give server time to start
    sleep(Duration::from_secs(2)).await;
    
    // Test 2: HTTP API endpoints
    println!("\n2. Testing HTTP API endpoints...");
    
    let client = reqwest::Client::new();
    let base_url = format!("http://localhost:{}", test_port);
    
    // Test home page
    match client.get(&base_url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                println!("✅ Home page: OK (status: {})", response.status());
            } else {
                println!("❌ Home page: Failed (status: {})", response.status());
            }
        }
        Err(e) => println!("❌ Home page: Error - {}", e),
    }
    
    // Test API overview
    match client.get(&format!("{}/api/overview", base_url)).send().await {
        Ok(response) => {
            if response.status().is_success() {
                println!("✅ API Overview: OK (status: {})", response.status());
            } else {
                println!("❌ API Overview: Failed (status: {})", response.status());
            }
        }
        Err(e) => println!("❌ API Overview: Error - {}", e),
    }
    
    // Test workflows endpoint
    match client.get(&format!("{}/api/workflows", base_url)).send().await {
        Ok(response) => {
            if response.status().is_success() {
                println!("✅ Workflows API: OK (status: {})", response.status());
                if let Ok(text) = response.text().await {
                    println!("   Response: {}", text.chars().take(100).collect::<String>());
                }
            } else {
                println!("❌ Workflows API: Failed (status: {})", response.status());
            }
        }
        Err(e) => println!("❌ Workflows API: Error - {}", e),
    }
    
    // Test metrics endpoint
    match client.get(&format!("{}/api/metrics", base_url)).send().await {
        Ok(response) => {
            if response.status().is_success() {
                println!("✅ Metrics API: OK (status: {})", response.status());
            } else {
                println!("❌ Metrics API: Failed (status: {})", response.status());
            }
        }
        Err(e) => println!("❌ Metrics API: Error - {}", e),
    }
    
    // Test health check
    match client.get(&format!("{}/health", base_url)).send().await {
        Ok(response) => {
            if response.status().is_success() {
                println!("✅ Health Check: OK (status: {})", response.status());
            } else {
                println!("❌ Health Check: Failed (status: {})", response.status());
            }
        }
        Err(e) => println!("❌ Health Check: Error - {}", e),
    }
    
    // Test dashboard UI
    match client.get(&format!("{}/dashboard", base_url)).send().await {
        Ok(response) => {
            if response.status().is_success() {
                println!("✅ Dashboard UI: OK (status: {})", response.status());
            } else {
                println!("❌ Dashboard UI: Failed (status: {})", response.status());
            }
        }
        Err(e) => println!("❌ Dashboard UI: Error - {}", e),
    }
    
    // Test 3: WebSocket connection
    println!("\n3. Testing WebSocket connectivity...");
    
    use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
    use futures_util::{SinkExt, StreamExt};
    
    let ws_url = format!("ws://localhost:{}/ws", test_port);
    
    match connect_async(&ws_url).await {
        Ok((mut ws_stream, _)) => {
            println!("✅ WebSocket: Connected successfully");
            
            // Listen for a few messages
            let mut message_count = 0;
            for _ in 0..3 {
                match tokio::time::timeout(Duration::from_secs(2), ws_stream.next()).await {
                    Ok(Some(Ok(Message::Text(text)))) => {
                        message_count += 1;
                        println!("   Received message {}: {}", message_count, text.chars().take(50).collect::<String>());
                    }
                    Ok(Some(Ok(msg))) => {
                        println!("   Received other message type: {:?}", msg);
                    }
                    Ok(Some(Err(e))) => {
                        println!("   WebSocket error: {}", e);
                        break;
                    }
                    Ok(None) => {
                        println!("   WebSocket stream ended");
                        break;
                    }
                    Err(_) => {
                        println!("   Timeout waiting for message");
                        break;
                    }
                }
            }
            
            if message_count > 0 {
                println!("✅ WebSocket: Received {} messages", message_count);
            } else {
                println!("⚠️  WebSocket: No messages received (may be normal)");
            }
            
            // Close connection
            let _ = ws_stream.close(None).await;
        }
        Err(e) => println!("❌ WebSocket: Connection failed - {}", e),
    }
    
    println!("\n🎯 Phase 2 Integration Test Complete!");
    println!("=====================================");
    println!("Dashboard URL: http://localhost:{}", test_port);
    println!("Kanban Board: http://localhost:{}/dashboard", test_port);
    
    // Stop the dashboard server
    dashboard_handle.abort();
    
    Ok(())
}