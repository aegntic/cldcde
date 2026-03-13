# Competitive Diligence Snapshot

Date: March 13, 2026
Purpose: provide a source-grounded working brief for agents comparing `ae.ltd` against Omnara and Cursor.

## Method

Use the following labels in any derivative work:
- `Verified`: directly supported by a cited source
- `Inference`: reasoned conclusion from verified facts
- `Unknown`: not established from public evidence

## Cursor

### Verified

- Cursor announced `Cloud Agents with Computer Use` on February 24, 2026.
- Cursor describes these agents as running in an isolated VM with a dev environment.
- Cursor says the agents can use the software they build and generate videos, screenshots, and logs.
- Cursor says users can take over the remote desktop.
- Cursor extended the same area with `Automations` on March 5, 2026.

Primary sources:
- https://cursor.com/blog/agent-computer-use
- https://cursor.com/changelog/02-24-26/
- https://cursor.com/blog/automations
- https://cursor.com/changelog/03-05-26/
- https://docs.cursor.com/en/background-agents

### Verified Friction Signals

- Public forum reports mention missing demo recordings and missing screenshot or video artifacts on PRs.
- Public reports also mention invalid environment snapshots and gaps in cloud-agent feature parity for some workflows.

Public discussion sources:
- https://forum.cursor.com/t/cloud-agents-demo-recordings-arent-working/153810
- https://forum.cursor.com/t/cursor-cloud-agents-do-not-post-their-screenshots-or-videos-to-pr/152974
- https://forum.cursor.com/t/cloud-agent-fails-on-start-team-environment-snapshot-is-invalid-despite-successful-setup/154243
- https://forum.cursor.com/t/automations-not-able-to-use-all-cloud-agent-features-like-running-in-browser/154298

### Inference

Cursor's likely strongest public idea is not just remote execution. It is the combination of cloud runtime, browser/computer use, and artifacts attached back to code review.

### Inference

Cursor's likely weak point is evidence reliability. If artifact creation is inconsistent, the core value proposition degrades quickly.

## Omnara

### Verified

- Omnara's archived public repo states the earlier product was a wrapper around the Claude Code CLI.
- The archived repo states that maintaining the wrapper became unfeasible because Claude Code changed rapidly.
- The same repo says the new platform moved to the Claude Agent SDK rather than the CLI wrapper.
- Omnara's public docs expose concepts including user sessions, workspaces, worktrees, machines, checkpoints, and sandbox startup.
- Omnara publicly positions the product around continuing local agent work from phone or web, receiving notifications, and using voice.

Primary sources:
- https://github.com/omnara-ai/omnara
- https://raw.githubusercontent.com/omnara-ai/omnara/main/README.md
- https://docs.omnara.com/quickstart
- https://docs.omnara.com/api-reference/user_sessions/create-user-session-endpoint
- https://docs.omnara.com/api-reference/workspaces/update-workspace-config
- https://docs.omnara.com/api-reference/worktrees/set-user-session-worktree
- https://www.ycombinator.com/companies/omnara

### Verified Red Flags

- The public repo is archived and no longer represents the current hosted platform.
- The old public architecture was structurally brittle enough that the company replaced it.
- Public code quality signals in the archived repo do not justify any claim that the codebase is flawless.

### Inference

Omnara's likely current value is in the control-plane and runtime layer, not in a unique model capability.

### Inference

A simplified product in this category can be recreated, but production-grade continuity, checkpointing, remote sandboxes, and reliable handoff are materially harder.

## Build-vs-Buy Implications

### Verified

- There is real market demand for agent runtime continuity, remote intervention, and review artifacts.
- Both Cursor and Omnara now show public movement away from pure local-agent workflows toward managed execution layers.

### Inference

If `ae.ltd` builds in this area, the product should not aim to be a prettier wrapper. The strongest wedge is evidence-grade proof and reviewer trust.

## Candidate ae.ltd Edge

### Inference

The likely best differentiation is:
- deterministic proof contracts
- environment and auth reliability
- evidence graph linked to diffs and assertions
- stronger failure semantics
- policy and governance from day one

## Unknowns Requiring Diligence Access

- Omnara's exact current backend topology
- Omnara's queueing, storage, auth, and sandbox vendor choices
- Cursor's internal reliability metrics and artifact success rates
- Actual cost structure for production-grade proof runs
- Real customer demand for video versus shorter evidence packets
