# Technical Specification: ae.ltd Proof Agent

## Document Status

Draft 1
Date: March 13, 2026

## 1. Technical Goal

Build a system that can provision an execution environment, run an agent against a codebase, validate key application flows, and produce durable evidence for review. The system must be able to distinguish setup failures from product failures and must treat missing required evidence as a failed run.

## 2. Architecture Overview

### Main Components

- Control Plane API
- Run Orchestrator
- Sandbox Manager
- Repo Worker
- Browser Executor
- Artifact Pipeline
- Evidence Graph
- Secrets and Auth Broker
- Policy Engine
- Review Surfaces

### High-Level Flow

1. User or trigger creates a run.
2. Control Plane stores run metadata and policy.
3. Orchestrator selects an execution target and provisions a sandbox.
4. Repo Worker clones the repo, checks out the branch, installs dependencies, and starts services.
5. Browser Executor and/or API verifier runs proof flows.
6. Artifact Pipeline persists evidence and attaches metadata.
7. Review packet is assembled and returned to UI, chat, or GitHub.

## 3. Component Responsibilities

### Control Plane API

Responsibilities:
- user, repo, branch, run, and policy management
- webhook intake
- artifact and run metadata retrieval
- integration endpoints for GitHub, Slack, mobile, and web

Suggested interface style:
- REST for CRUD and run control
- event stream for live progress

### Run Orchestrator

Responsibilities:
- queueing
- retries
- timeout handling
- checkpoint creation and restore
- budget enforcement
- state transitions

Notes:
- This is the core reliability layer.
- It should own typed interruption reasons and failure classification.

### Sandbox Manager

Responsibilities:
- ephemeral VM or container lifecycle
- base image selection
- network policy application
- mounted secrets and environment setup
- optional snapshot reuse

Recommendation:
- Start with Linux VMs for maximum browser compatibility and debugging clarity.
- Add container-backed fast paths later for lightweight runs.

### Repo Worker

Responsibilities:
- clone or fetch repo
- checkout branch
- apply patches from the agent
- run install and start commands
- expose localhost preview endpoints when needed

### Browser Executor

Responsibilities:
- execute deterministic flows from `ae.demo.yaml`
- capture step-level screenshots and video markers
- collect console and network errors
- export trace bundles on failure

Recommendation:
- Use Playwright as the default executor.
- Preserve the option to add lower-level CDP or remote-desktop fallback later.

### Artifact Pipeline

Responsibilities:
- persist raw artifacts to object storage
- generate thumbnails and previews
- store checksums and evidence metadata
- mark incomplete artifact sets as failed evidence contracts

### Evidence Graph

Responsibilities:
- map run -> flow -> step -> assertion -> artifact -> diff hunk
- enable reviewer packet generation
- support time-based playback and code-linked evidence

### Secrets and Auth Broker

Responsibilities:
- inject ephemeral test credentials
- manage seeded users and test tenants
- support OTP and inbox capture
- keep auth setup out of ad hoc prompt text

### Policy Engine

Responsibilities:
- max runtime
- max cost
- allowed domains
- allowed tools and egress rules
- approval thresholds
- branch and repo guardrails

## 4. Core Data Model

Suggested primary entities:
- `workspace`
- `repository`
- `run`
- `run_step`
- `checkpoint`
- `artifact`
- `proof_flow`
- `assertion`
- `policy`
- `secret_binding`
- `agent_session`
- `review_packet`

### Example Run Status Enum

- `pending`
- `provisioning`
- `booting`
- `running`
- `blocked`
- `failing_setup`
- `failing_auth`
- `failing_product`
- `failing_flake`
- `passed`
- `failed`
- `canceled`

## 5. Run Lifecycle

### Happy Path

1. Create run.
2. Resolve repo and branch.
3. Load proof contract and policy.
4. Provision sandbox.
5. Clone repo and install dependencies.
6. Start app and validate healthchecks.
7. Execute proof flows.
8. Persist artifacts.
9. Generate review packet.
10. Post result to selected surfaces.

### Failure Path

1. Capture first failed step.
2. Attach environment state, logs, and traces.
3. Classify failure.
4. Surface recommended next action.
5. Allow retry from checkpoint or takeover.

## 6. Proof Contract

Preferred repo-level configuration file: `ae.demo.yaml`

### Minimum Supported Fields

- `app.base_url`
- `setup.install`
- `setup.start`
- `setup.wait_for`
- `auth.strategy`
- `flows[]`
- `assertions[]`
- `artifacts`
- `policy`

### Example

```yaml
version: 1
app:
  base_url: http://127.0.0.1:3000
setup:
  install: npm ci
  start:
    - npm run dev
  wait_for:
    - url: http://127.0.0.1:3000
      timeout_sec: 120
auth:
  strategy: seeded_user
  user_ref: admin_demo
flows:
  - id: login_and_create_project
    steps:
      - goto: /
      - click: text=Sign in
      - fill:
          selector: input[name=email]
          value_from: auth.email
      - fill:
          selector: input[name=password]
          value_from: auth.password
      - click: text=Continue
    assertions:
      - visible: text=Dashboard
artifacts:
  video: required
  screenshots: [start, end, failure]
  console_log: required
policy:
  max_runtime_min: 25
  max_cost_usd: 6
```

## 7. Security and Compliance Requirements

- secrets must be scoped to the run and revoked after completion
- browser sessions must be isolated per run
- network egress should be allowlisted where feasible
- every artifact must be attributable to a run, branch, and commit
- audit logs must capture approval events, secret access, and policy overrides

## 8. Reliability Requirements

- environment doctor before proof execution
- artifact contract validation before marking a run successful
- idempotent run retries where possible
- checkpoint support for long-running flows
- explicit flake classification instead of ambiguous failure states

## 9. Integrations

### Initial Integrations

- GitHub
- Slack
- primary model providers or coding-agent runtimes
- object storage
- secrets manager

### Later Integrations

- mobile apps
- Linear and Jira
- incident systems
- enterprise identity providers

## 10. Complexity Assessment

### Simplified MVP

Feasibility: reasonable

A small team can likely build a constrained MVP if the scope is kept to:
- one git provider
- one browser executor
- one sandbox strategy
- one primary review surface
- deterministic proof contracts only

### Production-Grade Platform

Feasibility: materially harder

The complexity increases sharply when adding:
- local/cloud handoff
- reliable checkpoints
- multiple model providers
- takeover sessions
- mobile approvals
- enterprise security and governance

## 11. Suggested Delivery Sequence

### Milestone 1

- control plane
- sandbox provisioning
- repo worker
- Playwright executor
- artifact storage
- basic review packet

### Milestone 2

- `ae.demo.yaml`
- environment doctor
- failure classification
- GitHub PR annotations
- Slack status integration

### Milestone 3

- checkpoints
- takeover
- saved proof profiles
- analytics
- policy engine expansion

## 12. Open Questions

- Should the first version support code generation and proof in the same run, or proof only?
- Should proof contracts be mandatory for GA or optional with a generated fallback?
- What level of video fidelity is actually required versus step screenshots and traces?
- Is a VM always needed, or can some proof runs execute in containers without reducing trust?
