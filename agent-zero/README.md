# Agent Zero Skills

This directory contains skills formatted specifically for [Agent Zero](https://github.com/aegntic/agent-zero) - an autonomous AI agent framework.

## 📁 Structure

Each skill follows the Agent Zero skill standard:

```
skill-name/
├── SKILL.md          # Main skill definition with YAML frontmatter
└── scripts/          # Optional executable scripts
    └── *.py, *.sh
```

## 📋 SKILL.md Format

```yaml
---
name: skill-slug           # Must be lowercase, no spaces (matches directory name)
description: Description   # Brief description of what the skill does
version: 1.0.0            # Semantic versioning
author: Author Name       # Skill author
tags: [tag1, tag2]        # Array of relevant tags
---

# Skill Title

Detailed markdown content with instructions...
```

## 🚀 Installation

### Method 1: Clone to Agent Zero Skills Directory

```bash
# Clone the repository
git clone https://github.com/aegntic/cldcde.git

# Copy desired skills to Agent Zero
cp -r cldcde/agent-zero/skills/* /path/to/agent-zero/usr/skills/
```

### Method 2: Download Individual Skills

Download directly from [cldcde.cc](https://cldcde.cc) or this repository.

## 📦 Available Skills (46 Total)

### AE.LTD Workflow Skills (7)
| Skill | Description |
|-------|-------------|
| ae-ltd-claude-template-switchboard | CLAUDE.md template selection workflow |
| ae-ltd-context7-radar | Version-accurate docs grounding |
| ae-ltd-mcp-foundry | MCP server scaffolding |
| ae-ltd-mutation-gate | Mutation testing workflows |
| ae-ltd-n8n-orbit | n8n automation blueprints |
| ae-ltd-visual-regression-forge | Visual regression testing |
| ae-ltd-worktree-mesh | Git worktree management |

### AgentDB Skills (5)
| Skill | Description |
|-------|-------------|
| agentdb-advanced | QUIC sync, multi-db, hybrid search |
| agentdb-learning | RL algorithms and training plugins |
| agentdb-memory-patterns | Persistent memory for AI agents |
| agentdb-optimization | Performance tuning (HNSW, quantization) |
| agentdb-vector-search | Semantic search and RAG |

### GitHub Automation Skills (5)
| Skill | Description |
|-------|-------------|
| github-code-review | AI-powered code review |
| github-multi-repo | Multi-repo coordination |
| github-project-management | Project board automation |
| github-release-management | Release orchestration |
| github-workflow-automation | CI/CD pipeline automation |

### Flow Nexus Skills (3)
| Skill | Description |
|-------|-------------|
| flow-nexus-neural | Distributed neural network training |
| flow-nexus-platform | Platform management (auth, deployment) |
| flow-nexus-swarm | Cloud-based swarm deployment |

### Quality & Engineering Skills (4)
| Skill | Description |
|-------|-------------|
| compound-engineering | Unified QA orchestration |
| debt-sentinel | Technical debt prevention |
| red-team-tribunal | Multi-agent adversarial verification |
| verification-quality | Truth scoring and rollback |

### Swarm & Orchestration Skills (4)
| Skill | Description |
|-------|-------------|
| swarm-advanced | Advanced swarm patterns |
| swarm-orchestration | Multi-agent coordination |
| hive-mind-advanced | Collective intelligence system |
| stream-chain | Multi-agent pipelines |

### Development Skills (7)
| Skill | Description |
|-------|-------------|
| sparc-methodology | SPARC development framework |
| pair-programming | AI-assisted pair programming |
| spec-lock | Code-doc synchronization |
| skill-builder | Create Claude Code skills |
| create-skill | Agent Zero skill wizard |
| agentic-jujutsu | Quantum-resistant VCS for AI |
| hooks-automation | Claude Code hooks automation |

### Specialized Skills (6)
| Skill | Description |
|-------|-------------|
| blender-3d-studio | Blender automation |
| avant-garde-frontend-architect | UI/UX implementation |
| remotion-best-practices | Video creation in React |
| fpef-analyzer | Find-Prove-Evidence-Fix framework |
| performance-analysis | Bottleneck detection |
| mcp-universal-manager | MCP server management |

### Other Skills (5)
| Skill | Description |
|-------|-------------|
| demo-video | Demo video creation |
| bd-management | Beads workflow optimization |
| ultra-planner | Autonomous planning system |
| reasoningbank-agentdb | Adaptive learning with AgentDB |
| reasoningbank-intelligence | Pattern recognition and optimization |

## 🔄 Conversion from Claude Code Format

These skills were converted from the Claude Code format with the following changes:

1. **Name Field**: Converted to slug format (lowercase, hyphens, no spaces)
2. **Tags**: Normalized to inline array format
3. **Required Fields**: Ensured all have name, description, version, author, tags
4. **Directory Structure**: Maintained with SKILL.md as entry point

## 📝 License

Same as the main cldcde repository.

## 🤝 Contributing

See main repository [CONTRIBUTING.md](../CONTRIBUTING.md)
