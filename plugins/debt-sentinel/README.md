# Debt-Sentinel Plugin
# Architectural Enforcement & Technical Debt Prevention

## Overview

The Tech-Debt Sentinel is a hook-based architectural enforcer that prevents "vibe coding" slop by blocking anti-patterns before they enter the codebase.

## Components

1. **ANTI_PATTERNS.md** - Define forbidden patterns
2. **ARCHITECTURE.md** - Project architectural standards
3. **debt-sentinel.py** - Main blocking script
4. **DEBT.md** - Automatic debt ledger
5. **hooks.json** - PreToolUse hook configuration

## Installation

1. Copy this directory to your Agent Zero plugins folder
2. Update your settings.json to include the hooks
3. Customize ANTI_PATTERNS.md for your project
4. Run: `python3 debt-sentinel.py --init`

## Usage

The sentinel automatically:
- Blocks edits that violate architectural rules
- Logs overridden violations to DEBT.md
- Calculates Session Debt Score on exit
- Suggests cleanup agents when debt accumulates

## Configuration

Edit ANTI_PATTERNS.md to define your project's forbidden patterns:
- Regex patterns for code violations
- Natural language descriptions for AI understanding
- Severity levels (critical, warning, info)
- Interest rates for debt calculation

## Integration

Works seamlessly with:
- UltraPlan Pro for debt-aware planning
- Red Team Tribunal for architecture validation
- Spec-Lock for documentation alignment