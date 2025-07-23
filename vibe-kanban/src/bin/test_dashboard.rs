#!/usr/bin/env rust

//! Simple test binary for Phase 2 Vibe Kanban Dashboard
//! 
//! Usage: cargo run --bin test_dashboard

use vibe_kanban::start_dashboard;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();
    
    println!("🚀 Starting Phase 2 Vibe Kanban Dashboard Test");
    println!("===============================================");
    
    let port = 3001;
    
    println!("Dashboard will be available at:");
    println!("  • Home: http://localhost:{}", port);
    println!("  • Kanban Board: http://localhost:{}/dashboard", port);
    println!("  • API Overview: http://localhost:{}/api/overview", port);
    println!("  • Health Check: http://localhost:{}/health", port);
    println!("\nPress Ctrl+C to stop the server...\n");
    
    // Start the dashboard
    if let Err(e) = start_dashboard(port).await {
        eprintln!("Failed to start dashboard: {}", e);
        std::process::exit(1);
    }
    
    Ok(())
}