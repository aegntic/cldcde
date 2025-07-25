# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CLDCDE Pro is an autonomous AI development orchestration system that combines Tmux-Orchestrator, Claude Flow, Spec-Driven Development, Vibe Kanban, and Cortex Memory for 24/7 autonomous development with enterprise-grade monitoring and leadership hierarchy.

## Tech Stack

- **Language**: Rust
- **Build System**: Cargo (workspace configuration)
- **Web Framework**: Axum
- **Database**: SQLite (via sqlx)
- **External Integrations**: GitHub API (via octocrab), Tmux (via tmux_interface)
- **WebSocket**: tokio-tungstenite
- **Authentication**: JWT (jsonwebtoken), Argon2 for password hashing

## Build Commands

```bash
# Build all workspace members
cargo build

# Build release version
cargo build --release

# Run tests for all workspace members
cargo test --all

# Run a specific workspace member
cargo run -p web-dashboard
cargo run -p master-orchestrator
cargo run -p vibe-kanban

# Run with specific binary (for testing)
cargo run --bin test_dashboard

# Check code without building
cargo check --all

# Format code
cargo fmt --all

# Run linter
cargo clippy --all -- -D warnings

# Run a single test
cargo test --package <package-name> <test-name>

# Clean build artifacts
cargo clean
```

## Architecture

### Workspace Structure

The project uses a Cargo workspace with the following members:
- **orchestrator**: Core orchestration engine
- **workflow-coordinator**: Manages workflow execution and phase transitions
- **master-orchestrator**: Top-level orchestrator managing all workflows
- **vibe-kanban**: Kanban dashboard for progress monitoring
- **github-integration**: GitHub API integration for issues/PRs
- **config-manager**: Configuration management
- **web-dashboard**: Web-based UI for system monitoring

### Leadership Hierarchy

The system implements a three-tier leadership structure:
1. **Master Orchestrator**: Always running, manages cross-workflow coordination
2. **Workflow Coordinators**: Per-workflow leadership and phase management
3. **Specialized Managers**: Domain-specific leadership (Technical Lead, PM, etc.)

### Key Architectural Patterns

- **Async-First**: All components use Tokio for async runtime
- **Message Passing**: Components communicate via channels and WebSocket
- **Phase-Driven**: Workflows follow a 5-phase process (Plan → Requirements → Design → Tasks → Execute)
- **EARS Requirements**: Uses "WHEN... THEN..." format for specifications
- **Persistent Sessions**: Tmux sessions maintain state across restarts

## Development Workflow

### Starting the Full System

```bash
# 1. Build all components
cargo build --all

# 2. Start the web dashboard (includes all services)
cargo run -p web-dashboard

# 3. Access the dashboard
# Default: http://localhost:3000
```

### Testing Individual Components

```bash
# Test Vibe Kanban dashboard
cargo run --bin test_dashboard

# Test GitHub integration
cargo test -p github-integration

# Test workflow coordinator
cargo test -p workflow-coordinator
```

### Running Database Migrations

The system uses SQLite with automatic migrations. Database files are created in the project root as `*.db` files.

## Key Configuration

### Environment Variables

The system expects these environment variables (create a `.env` file):
- `GITHUB_TOKEN`: GitHub personal access token for API access
- `DATABASE_URL`: SQLite database path (default: `sqlite:orchestrator.db`)
- `RUST_LOG`: Logging level (default: `info`)

### Port Configuration

- Web Dashboard: Port 3000
- WebSocket: Port 3001 (embedded in dashboard)
- Vibe Kanban: Port 8080 (when run standalone)

## Code Patterns

### Error Handling

The codebase uses `anyhow` for application errors and `thiserror` for library errors:
```rust
use anyhow::Result;
use thiserror::Error;
```

### Async Patterns

All async functions use Tokio:
```rust
#[tokio::main]
async fn main() -> Result<()> {
    // ...
}
```

### Logging

Uses `tracing` for structured logging:
```rust
use tracing::{info, error, debug};
```

## Testing Strategy

- Unit tests are colocated with source files
- Integration tests are in `tests/` directories within each crate
- Use `cargo test --all` to run all tests
- Mock external services (GitHub API, Tmux) in tests

## Dependencies

Key dependencies to be aware of:
- **tmux_interface**: Requires tmux to be installed on the system
- **octocrab**: Requires valid GitHub token for API access
- **sqlx**: Uses compile-time query verification

## Deployment Notes

The system is designed to run as a long-lived service with tmux session persistence. Production deployment should use:
- systemd service files for process management
- Reverse proxy (nginx/caddy) for web dashboard
- Persistent volume for SQLite databases
- GitHub OAuth app for production authentication