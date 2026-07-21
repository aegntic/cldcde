# OpenFang Quick Reference Index

## When You Need To...

### Add a new API endpoint
→ See: `docs/api-reference.md`
→ Edit: `crates/openfang-api/src/{server.rs, routes.rs, types.rs}`

### Modify configuration options
→ See: `docs/configuration.md`
→ Edit: `crates/openfang-kernel/src/config.rs`

### Add a new skill
→ See: `docs/skill-development.md`
→ Add to: `crates/openfang-skills/skills/`

### Add a new channel adapter
→ See: `docs/channel-adapters.md`
→ Add to: `crates/openfang-channels/src/`

### Understand architecture
→ See: `docs/architecture.md`
→ Core: `crates/openfang-kernel/src/kernel.rs`

### Fix security issues
→ See: `docs/security.md`

### Deploy to production
→ See: `docs/production-checklist.md`

### Troubleshoot issues
→ See: `docs/troubleshooting.md`

### Add MCP server support
→ See: `docs/mcp-a2a.md`
→ Edit: `crates/openfang-runtime/src/mcp.rs`

---

## File Locations Quick Map

| What | Where |
|------|-------|
| Kernel entry | `crates/openfang-kernel/src/kernel.rs` |
| API routes | `crates/openfang-api/src/server.rs` |
| API handlers | `crates/openfang-api/src/routes.rs` |
| Config struct | `crates/openfang-kernel/src/config.rs` |
| Agent runtime | `crates/openfang-runtime/src/agent.rs` |
| MCP handling | `crates/openfang-runtime/src/mcp.rs` |
| Memory system | `crates/openfang-memory/src/` |
| Skills | `crates/openfang-skills/skills/` |
| Hands | `crates/openfang-hands/hands/` |
| CLI commands | `crates/openfang-cli/src/` |
| Channels | `crates/openfang-channels/src/` |
| WebChat UI | `crates/openfang-api/src/webchat.rs` |

---

## Current Instance Info

| Setting | Value |
|---------|-------|
| Binary | `/root/.openfang/bin/openfang` |
| Version | 0.2.1 |
| Config | `/root/.openfang/config.toml` |
| API | http://127.0.0.1:50051 |
| Dashboard | http://127.0.0.1:50051/ |
| Network Port | 4200 (P2P) |
| Provider | OpenRouter |
| Model | anthropic/claude-sonnet-4 |
| MCP Servers | 6 connected, 65 tools |
| Skills | 60 bundled |
| Hands | 7 bundled |

---

## Test Commands

```bash
# Build
cargo build --workspace --lib

# Test all
cargo test --workspace

# Lint
cargo clippy --workspace --all-targets -- -D warnings

# Integration test
openfang stop && cargo build -p openfang-cli --release && \
source ~/.openfang/.env && target/release/openfang start &
sleep 6 && curl -s http://127.0.0.1:50051/api/health
```
