---
name: ae-ltd-mutation-gate
description: Use when unit tests look green but confidence is low and mutation testing is needed to expose weak assertions. AE.LTD workflow for targeted mutation runs and actionable test hardening.
---

# AE.LTD Mutation Gate

## What This Skill Does

Measures test quality beyond line coverage using mutation testing. Exposes weak assertions and generates actionable test hardening recommendations. Niche gem source: `mutation-tester` plugin from `awesome-claude-code-toolkit`.

1. Detect appropriate mutation tool (Stryker/mutmut/PIT)
2. Run targeted mutation tests on critical modules
3. Convert survived mutants into hardened tests
4. Track mutation score to threshold (target: 80%+)

## Quick Start

```
User: "My tests pass but I'm not confident"
→ Detect stack → Run mutations → Report survivors → Harden tests
```

## Workflow

1. Detect stack and tool.
- JS/TS: Stryker
- Python: mutmut
- Java: PIT

2. Start narrow.
Run mutation testing on one critical module first to keep runtime bounded.

3. Measure score and survivors.
Capture killed/survived/timed-out mutants and mutation score.

4. Convert survivors into tests.
For each top survived mutant, specify the exact missing assertion and test case.

5. Re-run until stable threshold.
Target at least 80% mutation score unless user/project standard says otherwise.

## Guardrails

- Exclude generated files and non-business logic.
- Use per-mutant timeouts to control runaway test runs.
- Report equivalent-mutant risk explicitly.
- Prioritize critical-path business logic over utility files.
