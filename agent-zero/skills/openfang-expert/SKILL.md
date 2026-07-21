# OpenFang Expert Agent

## Purpose
Expert agent for safe OpenFang development. Understands the complete architecture, can make edits without breaking functionality, and ensures all changes are properly integrated.

## Capabilities
- Full architecture knowledge of 14 Rust crates
- Safe code editing with conflict prevention
- Automatic test running and validation
- Live GitHub update integration
- Local instance monitoring and debugging

---

## Architecture Overview

### Crate Structure
```
openfang-types/      # Shared types and traits
openfang-memory/     # Persistent memory system
openfang-wire/       # P2P networking (OFP protocol)
openfang-runtime/    # Agent runtime and execution
openfang-kernel/     # Core kernel (orchestration)
openfang-api/        # HTTP API + WebSocket server
openfang-cli/        # Command-line interface
openfang-channels/   # 40+ channel adapters
openfang-skills/     # 60 bundled skills
openfang-hands/      # 7 bundled hands
openfang-extensions/ # Extension system
openfang-desktop/    # Desktop app (Tauri)
openfang-migrate/    # Migration tools
openfang-kernel/     # Kernel supervisor
```

### Key Files
| File | Purpose |
|------|---------|
| `crates/openfang-kernel/src/kernel.rs` | Main kernel orchestration |
| `crates/openfang-api/src/server.rs` | API route registration |
| `crates/openfang-api/src/routes.rs` | Endpoint handlers |
| `crates/openfang-kernel/src/config.rs` | Config deserialization |
| `crates/openfang-runtime/src/agent.rs` | Agent execution |
| `crates/openfang-runtime/src/mcp.rs` | MCP server management |

---

## Safe Editing Workflow

### BEFORE Making Changes
1. **Check current state:**
```bash
cd /a0/usr/projects/openfang_3
cargo build --workspace --lib
cargo test --workspace --no-run  # Compile tests
```

2. **Identify affected crates:**
```bash
# Find where a function/struct is defined
rg -t rust "fn function_name" crates/
rg -t rust "struct StructName" crates/
```

3. **Review dependencies:**
```bash
cargo tree -p openfang-kernel  # See dependency tree
```

### Making Changes

1. **Follow Rust conventions:**
- Use `Result<T, E>` for fallible operations
- Add proper error variants to crate's `Error` enum
- Document public APIs with `///` doc comments
- Use `#[derive(Debug, Clone)]` for new structs

2. **Config changes:**
- Add field to `crates/openfang-kernel/src/config.rs`
- Update `openfang.toml.example`
- Add validation in `impl Config`
- Test deserialization with `cargo test config`

3. **API changes:**
- Add route in `crates/openfang-api/src/server.rs`
- Add handler in `crates/openfang-api/src/routes.rs`
- Add types in `crates/openfang-api/src/types.rs`
- Update OpenAPI docs if applicable

### AFTER Making Changes

1. **Run full validation:**
```bash
cargo build --workspace --lib
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
```

2. **Live integration test:**
```bash
# Stop existing daemon
openfang stop

# Build fresh
cargo build --release -p openfang-cli

# Start with API keys
source ~/.openfang/.env && target/release/openfang start &
sleep 6

# Test new endpoints
curl -s http://127.0.0.1:50051/api/health
curl -s http://127.0.0.1:50051/api/<new-endpoint>
```

3. **Verify no regressions:**
```bash
# Test existing functionality
curl -s http://127.0.0.1:50051/api/agents
curl -s http://127.0.0.1:50051/api/status
```

---

## Common Edit Patterns

### Adding a New Config Field

1. Edit `crates/openfang-kernel/src/config.rs`:
```rust
#[derive(Debug, Clone, Deserialize)]
pub struct NetworkConfig {
    pub listen_addr: String,
    pub shared_secret: Option<String>,
    // Add new field with default
    #[serde(default = "default_max_peers")]
    pub max_peers: usize,
}

fn default_max_peers() -> usize { 50 }
```

2. Update example config
3. Add test for deserialization

### Adding a New API Endpoint

1. Add route in `server.rs`:
```rust
Router::new()
    .route("/api/new-endpoint", get(routes::new_endpoint))
```

2. Add handler in `routes.rs`:
```rust
pub async fn new_endpoint(
    State(kernel): State<Arc<Kernel>>,
) -> Result<Json<NewResponse>, ApiError> {
    let data = kernel.get_new_data().await?;
    Ok(Json(data))
}
```

3. Add types in `types.rs`

### Adding a New MCP Server

1. Add config entry in `config.rs`
2. Connection handled by `mcp.rs`
3. Test with: `curl -s http://127.0.0.1:50051/api/mcp/servers`

---

## Documentation Reference

### Local Docs
- `/a0/usr/projects/openfang_3/docs/architecture.md` - Full architecture
- `/a0/usr/projects/openfang_3/docs/api-reference.md` - API endpoints
- `/a0/usr/projects/openfang_3/docs/configuration.md` - Config options
- `/a0/usr/projects/openfang_3/docs/skill-development.md` - Creating skills
- `/a0/usr/projects/openfang_3/CLAUDE.md` - Build/test workflow

### GitHub
- Repo: https://github.com/RightNow-AI/openfang
- Releases: https://github.com/RightNow-AI/openfang/releases
- Issues: https://github.com/RightNow-AI/openfang/issues

---

## Fetching Latest Updates

```bash
# Check for updates
cd /a0/usr/projects/openfang_3
git fetch origin

git log HEAD..origin/main --oneline  # See new commits

# View specific file changes
git diff origin/main -- crates/openfang-kernel/src/kernel.rs

# Merge updates (careful!)
git merge origin/main
```

---

## Troubleshooting

### Build Errors
- Check Rust version: `rustc --version` (see rust-toolchain.toml)
- Clear cache: `cargo clean && cargo build`
- Update deps: `cargo update`

### Test Failures
- Run specific test: `cargo test test_name`
- Show output: `cargo test -- --nocapture`
- Check for race conditions with `--test-threads=1`

### Runtime Errors
- Check logs in `~/.openfang/data/logs/`
- Run doctor: `openfang doctor`
- Verify config: `openfang config show`

---

## Commands Reference

| Command | Purpose |
|---------|--------|
| `openfang start` | Start daemon |
| `openfang stop` | Stop daemon |
| `openfang status` | Check status |
| `openfang doctor` | Run diagnostics |
| `openfang config show` | View config |
| `openfang agent list` | List agents |
| `openfang chat` | Quick chat |
