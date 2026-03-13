# PRD: ae.ltd Proof Agent

## Document Status

Draft 1
Date: March 13, 2026
Owner: ae.ltd product and diligence team

## Product Summary

`ae.ltd` Proof Agent is a cloud and local execution system for coding agents that does more than generate code. It proves that the change works by launching an isolated runtime, exercising the product with browser or API automation, capturing durable evidence, and attaching that evidence to a pull request or review surface.

The product is intentionally positioned as a stronger alternative to the current wave of remote-agent and demo-agent products. The core claim is:

> The agent does not just show a demo. The agent proves the change.

## Problem Statement

Coding agents can produce diffs, but they often fail at the step that matters most to reviewers:
- showing that the product actually works
- proving that the right flow was tested
- preserving evidence reviewers can trust later
- handling auth, setup, and environment drift reliably

Current market offerings show promise, but the likely weaknesses are:
- demos without deterministic verification
- fragile environment setup
- missing or inconsistent artifacts
- weak linkage between evidence and the exact code under review

## Goals

### Primary Goals

- Allow an agent to execute a code change in a reproducible environment.
- Verify critical user flows using browser or API automation.
- Produce a reviewer packet with video, screenshots, logs, assertions, and code links.
- Support both manual launch and automation-triggered runs.
- Enforce a strict distinction between required evidence and optional media.

### Secondary Goals

- Support local-to-cloud handoff for longer runs.
- Support mobile and chat-based approval workflows.
- Build toward multi-agent orchestration over time.

## Non-Goals

- Building a general-purpose remote desktop product.
- Replacing source control, CI, or issue tracking.
- Claiming complete autonomy without human review.
- Supporting every framework in the first release.

## Target Users

### Primary Users

- Staff and senior engineers reviewing AI-generated changes
- Engineering managers responsible for throughput and review quality
- Founders and operators who want fast, reliable validation of agent work

### Secondary Users

- QA leads who want reproducible proof artifacts
- SRE or incident responders who need guided, auditable validation runs
- Product teams who need short demo packets tied to exact code changes

## Jobs To Be Done

- When an agent finishes a change, I want it to prove the main user flow still works so I do not have to manually reproduce it.
- When I review a PR, I want a compact evidence packet that shows what was tested, what passed, and what remains unknown.
- When a run fails, I want enough artifacts to understand whether the issue is setup, auth, flaky automation, or the code itself.
- When I automate a recurring check, I want deterministic run definitions with policy and budget controls.

## Product Principles

- Evidence beats persuasion.
- Missing proof is a failure, not a warning.
- Deterministic flows should be preferred over free-form exploration.
- Human interruptions should be typed and actionable.
- Every run should be replayable, attributable, and reviewable.

## Core Workflows

### Workflow 1: Manual Proof Run from a Branch

1. User selects a repo and branch.
2. User enters a task or chooses a saved proof profile.
3. System provisions a sandbox and starts the app.
4. Agent changes code or validates an existing branch.
5. Proof flows run from `ae.demo.yaml` or a generated plan.
6. Reviewer packet is generated.
7. User reviews or opens a PR.

### Workflow 2: Proof on Pull Request

1. GitHub trigger fires on PR open, label, or comment.
2. System creates a run with the PR branch.
3. Required proof flows run automatically.
4. Artifacts are attached back to the PR.
5. Policy determines whether the PR can advance automatically or needs review.

### Workflow 3: Failure Triage

1. Run fails during setup, auth, boot, or proof execution.
2. System classifies failure mode.
3. Reviewer sees the first failed step, relevant logs, and environment diagnosis.
4. User can retry from a checkpoint or take over the machine.

## Functional Requirements

### P0 Requirements

- Repo connection and branch selection
- Ephemeral sandbox provisioning
- App install and boot commands
- Browser and API proof execution
- Required artifact capture: video, screenshots, logs, assertions
- PR reviewer packet
- Typed run status: pending, booting, running, blocked, failed, passed
- Policy controls for runtime, budget, and allowed domains
- Secrets injection for test environments
- Failure classification and rerun support

### P1 Requirements

- Remote takeover of the active machine
- Mobile review and approval surface
- Slack-based approval and rerun commands
- Saved proof profiles by repo
- Multi-run comparison and artifact diffing
- Historical analytics by repo and flow

### P2 Requirements

- Multi-agent delegation
- Memory of known-good flows and known-bad flakes
- Suggested proof plans for repos without `ae.demo.yaml`
- Cross-repo governance and fleet analytics

## User Experience Requirements

- The reviewer packet must be understandable in under two minutes.
- The failure state must identify whether the likely cause is environment, auth, test flake, or product behavior.
- Each evidence artifact must be linkable to the exact run and commit SHA.
- The system must not present an unverified demo as a successful proof.

## Success Metrics

### Product Metrics

- Percentage of runs with complete required evidence
- Percentage of successful proof runs that lead to merged PRs
- Median time from branch selection to reviewer packet
- Reduction in manual reviewer reproduction time
- Reduction in agent-generated changes rejected for lack of proof

### Reliability Metrics

- Sandbox boot success rate
- Environment doctor pass rate
- Artifact upload success rate
- False pass rate on required assertions
- Flake rate by proof flow

## Dependencies

- Git provider integration
- Browser automation runtime
- Object storage for artifacts
- Secrets and auth broker
- Sandbox provisioning layer
- Model providers and/or coding-agent integrations

## Risks

- Setup and auth complexity can dominate the user experience.
- Browser-based proof can become flaky without deterministic contracts.
- Video capture without durable step metadata is low-value evidence.
- Multi-provider agent support can increase maintenance burden.
- Security posture may become the deciding factor for enterprise adoption.

## Launch Phases

### Phase 1: Proof Agent MVP

- Manual launch
- Single repo run
- Branch-based proof runs
- `ae.demo.yaml` support
- Reviewer packet with required artifacts

### Phase 2: Proof Automations

- GitHub and Slack triggers
- Saved proof profiles
- Policy engine expansion
- Historical run analytics

### Phase 3: Agent Control Plane

- Multi-agent workflows
- Mobile approvals
- Cross-repo governance
- Replay, memory, and cost routing
