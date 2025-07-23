use anyhow::Result;
use tracing::{info, error};
use tracing_subscriber;
use web_dashboard::{WebDashboard, DashboardConfig};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter("web_dashboard=debug,axum=debug")
        .init();

    info!("Starting Enhanced Tmux Orchestrator Web Dashboard");

    // Load configuration
    let config = load_config().await?;
    
    // Create and start the web dashboard
    let dashboard = WebDashboard::new(config).await?;
    
    info!("Web dashboard initialized successfully");
    
    // Start the server
    if let Err(e) = dashboard.serve().await {
        error!("Failed to start web dashboard: {}", e);
        return Err(e);
    }

    Ok(())
}

/// Load dashboard configuration from environment and files
async fn load_config() -> Result<DashboardConfig> {
    let mut config = DashboardConfig::default();
    
    // Override with environment variables if present
    if let Ok(host) = std::env::var("DASHBOARD_HOST") {
        config.host = host;
    }
    
    if let Ok(port) = std::env::var("DASHBOARD_PORT") {
        config.port = port.parse()?;
    }
    
    if let Ok(jwt_secret) = std::env::var("JWT_SECRET") {
        config.jwt_secret = jwt_secret;
    }
    
    if let Ok(session_timeout) = std::env::var("SESSION_TIMEOUT") {
        config.session_timeout = session_timeout.parse()?;
    }
    
    // GitHub configuration
    if let Ok(github_client_id) = std::env::var("GITHUB_CLIENT_ID") {
        config.github_config.client_id = github_client_id;
    }
    
    if let Ok(github_client_secret) = std::env::var("GITHUB_CLIENT_SECRET") {
        config.github_config.client_secret = github_client_secret;
    }
    
    if let Ok(github_redirect_uri) = std::env::var("GITHUB_REDIRECT_URI") {
        config.github_config.redirect_uri = github_redirect_uri;
    }
    
    // CORS origins
    if let Ok(cors_origins) = std::env::var("CORS_ORIGINS") {
        config.cors_origins = cors_origins.split(',').map(|s| s.trim().to_string()).collect();
    }
    
    info!("Configuration loaded: {}:{}", config.host, config.port);
    
    Ok(config)
}