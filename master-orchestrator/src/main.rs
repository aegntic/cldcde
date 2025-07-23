use anyhow::Result;
use clap::{Arg, Command};
use master_orchestrator::{MasterOrchestrator, OrchestratorCommand, WorkflowPriority};
use std::io::{self, Write};
use tokio::signal;
use tracing::{error, info, Level};
use tracing_subscriber;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_max_level(Level::INFO)
        .init();

    let matches = Command::new("Enhanced Tmux Orchestrator - Master Orchestrator")
        .version("0.1.0")
        .author("Enhanced Tmux Orchestrator Team")
        .about("Master Orchestrator for autonomous AI development workflows")
        .arg(
            Arg::new("interactive")
                .short('i')
                .long("interactive")
                .help("Run in interactive mode")
                .action(clap::ArgAction::SetTrue),
        )
        .arg(
            Arg::new("daemon")
                .short('d')
                .long("daemon")
                .help("Run as daemon")
                .action(clap::ArgAction::SetTrue),
        )
        .get_matches();

    // Create and start the Master Orchestrator
    let orchestrator = MasterOrchestrator::new()?;
    orchestrator.start().await?;

    info!("Master Orchestrator started successfully");

    if matches.get_flag("interactive") {
        run_interactive_mode(&orchestrator).await?;
    } else if matches.get_flag("daemon") {
        run_daemon_mode(&orchestrator).await?;
    } else {
        // Default: run with graceful shutdown
        run_with_shutdown(&orchestrator).await?;
    }

    Ok(())
}

async fn run_interactive_mode(orchestrator: &MasterOrchestrator) -> Result<()> {
    info!("Starting interactive mode. Type 'help' for commands.");
    
    let mut event_rx = orchestrator.subscribe_events();
    
    // Start event listener task
    tokio::spawn(async move {
        while let Ok(event) = event_rx.recv().await {
            match event {
                master_orchestrator::SystemEvent::WorkflowCreated { workflow_id, workflow_type } => {
                    println!("🚀 Created workflow: {} ({})", workflow_id, workflow_type);
                }
                master_orchestrator::SystemEvent::WorkflowStatusChanged { workflow_id, old_status, new_status } => {
                    println!("📊 Workflow {} status: {:?} → {:?}", workflow_id, old_status, new_status);
                }
                master_orchestrator::SystemEvent::SystemHealthChanged { status, message } => {
                    println!("🏥 System health: {:?} - {}", status, message);
                }
                master_orchestrator::SystemEvent::EmergencyAlert { severity, message, affected_workflows } => {
                    println!("🚨 ALERT [{:?}]: {} (affects {} workflows)", severity, message, affected_workflows.len());
                }
                _ => {}
            }
            io::stdout().flush().unwrap();
        }
    });

    loop {
        print!("orchestrator> ");
        io::stdout().flush()?;

        let mut input = String::new();
        io::stdin().read_line(&mut input)?;
        let input = input.trim();

        if input.is_empty() {
            continue;
        }

        match handle_interactive_command(orchestrator, input).await {
            Ok(should_exit) => {
                if should_exit {
                    break;
                }
            }
            Err(e) => {
                eprintln!("Error: {}", e);
            }
        }
    }

    Ok(())
}

async fn handle_interactive_command(orchestrator: &MasterOrchestrator, input: &str) -> Result<bool> {
    let parts: Vec<&str> = input.split_whitespace().collect();
    if parts.is_empty() {
        return Ok(false);
    }

    match parts[0] {
        "help" | "h" => {
            println!("Available commands:");
            println!("  status                    - Show orchestrator status");
            println!("  workflows                 - List all workflows");
            println!("  create <type> [priority]  - Create new workflow");
            println!("  pause <workflow_id>       - Pause workflow");
            println!("  resume <workflow_id>      - Resume workflow");
            println!("  cancel <workflow_id>      - Cancel workflow");
            println!("  health                    - Show system health");
            println!("  scale <workflows> <agents> - Scale resources");
            println!("  types                     - List workflow types");
            println!("  quit, exit                - Exit orchestrator");
            println!("  help                      - Show this help");
        }
        
        "status" | "s" => {
            let status = orchestrator.get_status();
            println!("Master Orchestrator Status:");
            println!("  ID: {}", orchestrator.id);
            println!("  Status: {:?}", status.status);
            println!("  Uptime: {} seconds", (chrono::Utc::now() - status.started_at).num_seconds());
            println!("  Active Workflows: {}", status.active_workflows);
            println!("  Completed Workflows: {}", status.completed_workflows);
            println!("  Failed Workflows: {}", status.failed_workflows);
            println!("  System Load: {:.1}%", status.system_load * 100.0);
            println!("  Memory Usage: {:.1}%", status.memory_usage * 100.0);
        }
        
        "workflows" | "w" => {
            let workflows = orchestrator.list_workflows();
            if workflows.is_empty() {
                println!("No workflows found.");
            } else {
                println!("Active Workflows:");
                for workflow in workflows {
                    println!("  {} - {} ({:?}) - {:.1}% complete", 
                            workflow.id, 
                            workflow.workflow_type,
                            workflow.status,
                            workflow.metrics.progress_percentage);
                }
            }
        }
        
        "create" | "c" => {
            if parts.len() < 2 {
                println!("Usage: create <workflow_type> [priority]");
                return Ok(false);
            }
            
            let workflow_type = parts[1].to_string();
            let priority = if parts.len() > 2 {
                match parts[2].to_lowercase().as_str() {
                    "critical" => WorkflowPriority::Critical,
                    "high" => WorkflowPriority::High,
                    "medium" => WorkflowPriority::Medium,
                    "low" => WorkflowPriority::Low,
                    _ => {
                        println!("Invalid priority. Use: critical, high, medium, low");
                        return Ok(false);
                    }
                }
            } else {
                WorkflowPriority::Medium
            };
            
            let command = OrchestratorCommand::CreateWorkflow {
                workflow_type: workflow_type.clone(),
                priority: priority.clone(),
                config: serde_json::json!({}),
            };
            
            orchestrator.command_tx.send(command)?;
            println!("Created workflow request: {} with priority {:?}", workflow_type, priority);
        }
        
        "pause" | "p" => {
            if parts.len() < 2 {
                println!("Usage: pause <workflow_id>");
                return Ok(false);
            }
            
            if let Ok(workflow_id) = parts[1].parse() {
                let command = OrchestratorCommand::PauseWorkflow { workflow_id };
                orchestrator.command_tx.send(command)?;
                println!("Paused workflow: {}", workflow_id);
            } else {
                println!("Invalid workflow ID format");
            }
        }
        
        "resume" | "r" => {
            if parts.len() < 2 {
                println!("Usage: resume <workflow_id>");
                return Ok(false);
            }
            
            if let Ok(workflow_id) = parts[1].parse() {
                let command = OrchestratorCommand::ResumeWorkflow { workflow_id };
                orchestrator.command_tx.send(command)?;
                println!("Resumed workflow: {}", workflow_id);
            } else {
                println!("Invalid workflow ID format");
            }
        }
        
        "cancel" => {
            if parts.len() < 2 {
                println!("Usage: cancel <workflow_id>");
                return Ok(false);
            }
            
            if let Ok(workflow_id) = parts[1].parse() {
                let command = OrchestratorCommand::CancelWorkflow { workflow_id };
                orchestrator.command_tx.send(command)?;
                println!("Cancelled workflow: {}", workflow_id);
            } else {
                println!("Invalid workflow ID format");
            }
        }
        
        "health" => {
            let health = orchestrator.health_monitor.get_health_state();
            println!("System Health:");
            println!("  Overall Status: {:?}", health.overall_status);
            println!("  System Load: {:.1}%", health.system_load * 100.0);
            println!("  Memory Pressure: {:.1}%", health.memory_pressure * 100.0);
            println!("  Performance Score: {:.1}", health.performance_score);
            println!("  Active Alerts: {}", health.active_alerts.len());
            
            for alert in &health.active_alerts {
                println!("    🚨 [{:?}] {}: {}", alert.severity, alert.title, alert.description);
            }
        }
        
        "scale" => {
            if parts.len() < 3 {
                println!("Usage: scale <target_workflows> <max_agents_per_workflow>");
                return Ok(false);
            }
            
            if let (Ok(target), Ok(max_agents)) = (parts[1].parse::<u32>(), parts[2].parse::<u32>()) {
                let command = OrchestratorCommand::ScaleResources {
                    target_workflows: target,
                    max_agents_per_workflow: max_agents,
                };
                orchestrator.command_tx.send(command)?;
                println!("Scaling to {} workflows with {} max agents each", target, max_agents);
            } else {
                println!("Invalid numbers provided");
            }
        }
        
        "types" | "t" => {
            println!("Available Workflow Types:");
            println!("  hivemind                 - Multi-agent coordination with queen leadership");
            println!("  swarm                    - Parallel task execution with load balancing");
            println!("  deep-research            - Context7 + sequential thinking integration");
            println!("  code-review             - Security + quality analysis pipeline");
            println!("  refactor                - Architecture improvement with safety checks");
            println!("  documentation-generation - Comprehensive docs with EARS requirements");
            println!("  security-audit          - Full security analysis");
            println!("  performance-optimization - Benchmarking and optimization");
            println!("  deployment-pipeline     - CI/CD with spec-driven gates");
            println!("  testing-automation      - Test suite creation with TDD");
            println!("  api-development         - REST/GraphQL with EARS contracts");
            println!("  database-design         - Schema design");
            println!("  monitoring-setup        - Observability setup");
            println!("  containerization        - Docker/K8s deployment");
            println!("  integration-testing     - Cross-system testing");
            println!("  bug-hunting             - Issue detection");
            println!("  feature-development     - End-to-end feature development");
            println!("  infrastructure-as-code  - IaC with compliance");
            println!("  data-pipeline           - ETL with quality requirements");
            println!("  custom-prompt           - User-defined workflow");
        }
        
        "quit" | "exit" | "q" => {
            println!("Shutting down Master Orchestrator...");
            return Ok(true);
        }
        
        _ => {
            println!("Unknown command: {}. Type 'help' for available commands.", parts[0]);
        }
    }
    
    Ok(false)
}

async fn run_daemon_mode(orchestrator: &MasterOrchestrator) -> Result<()> {
    info!("Running in daemon mode");
    
    // In daemon mode, just wait for shutdown signal
    signal::ctrl_c().await?;
    info!("Received shutdown signal");
    
    Ok(())
}

async fn run_with_shutdown(orchestrator: &MasterOrchestrator) -> Result<()> {
    info!("Master Orchestrator running. Press Ctrl+C to shutdown.");
    
    // Wait for shutdown signal
    match signal::ctrl_c().await {
        Ok(()) => {
            info!("Received shutdown signal, shutting down gracefully...");
            
            // Send emergency shutdown command
            let _ = orchestrator.command_tx.send(OrchestratorCommand::EmergencyShutdown);
            
            // Give some time for graceful shutdown
            tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
        }
        Err(err) => {
            error!("Unable to listen for shutdown signal: {}", err);
        }
    }
    
    Ok(())
}