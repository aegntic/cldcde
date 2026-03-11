---
name: ae-ltd-visual-regression-forge
description: Use when UI changes must be proven safe across breakpoints using baseline and diff workflows. AE.LTD visual quality gate for release confidence.
---

# AE.LTD Visual Regression Forge

## What This Skill Does

Proves UI changes are safe across breakpoints using baseline and diff workflows. Visual quality gate for release confidence. Niche gem source: `visual-regression` plugin from `awesome-claude-code-toolkit`.

1. Define snapshot scope (pages, viewports)
2. Capture clean baselines with network idle
3. Run pixel diffs against threshold
4. Convert failures into actionable fixes

## Quick Start

```
User: "Did my CSS change break anything?"
→ Define scope → Capture baseline → Run diff → Report pass/fail
```

## Workflow

1. Define snapshot scope.
Pick critical pages/components and three base viewports: mobile, tablet, desktop.

2. Capture clean baselines.
Wait for network idle and mask dynamic regions.

3. Capture current state with matching settings.
Use identical viewport/device/browser settings for comparability.

4. Run diff and classify.
Compute pixel deltas and mark pass/warn/fail against threshold.

5. Convert failures into actionable fixes.
Map each diff to CSS/layout/asset causes and patch.

## Guardrails

- Do not auto-update baselines without explicit intent.
- Keep dynamic content excluded to reduce false positives.
- Report diff percentages with file names and viewport labels.
- Store baselines and diffs in deterministic folder names.
