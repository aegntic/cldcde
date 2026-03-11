# Example Prompts for Skill Builder

These examples demonstrate how to interact with the Skill Builder skill.

## Example 1: Create a Basic Skill

**User:**
```
Create a skill called "git-helper" that provides common Git workflows
```

**Expected Behavior:**
- Create directory `~/.agents/skills/git-helper/`
- Create `SKILL.md` with proper frontmatter
- Include Quick Start section with common Git commands
- Add troubleshooting for common Git issues

---

## Example 2: Create an Advanced Skill with Scripts

**User:**
```
Create a skill called "api-tester" for testing REST APIs. Include:
- A script to run tests
- Templates for test configurations
- Hooks to validate JSON responses
```

**Expected Behavior:**
- Create full directory structure with `scripts/`, `resources/`, `hooks/`
- Create executable `scripts/run-tests.sh`
- Create `resources/templates/test-config.json`
- Create `hooks/post-task.sh` for response validation
- SKILL.md references all components

---

## Example 3: Validate All Skills

**User:**
```
Run validation on all my skills and fix any issues
```

**Expected Behavior:**
- Run `scripts/validate-skill.sh`
- Identify errors and warnings
- Run `scripts/fix-skill.sh` to auto-fix naming and frontmatter issues
- Report results

---

## Example 4: Lint Skill Quality

**User:**
```
Check the quality of my skills and suggest improvements
```

**Expected Behavior:**
- Run `scripts/lint-skill.sh`
- Analyze content structure, progressive disclosure, Claude optimization
- Provide actionable suggestions for improvement

---

## Example 5: Convert Existing Documentation

**User:**
```
Convert this README into a proper skill:
[paste README content]
```

**Expected Behavior:**
- Extract appropriate name and description
- Restructure content into progressive disclosure format
- Add required frontmatter
- Create SKILL.md with proper sections
- Suggest additional files (scripts, resources) if needed

---

## Example 6: Add Hooks to Existing Skill

**User:**
```
Add hooks to my "deploy" skill that:
- Backs up files before editing
- Runs tests after edits
- Cleans up on session end
```

**Expected Behavior:**
- Create `hooks/` directory in existing skill
- Create `pre-edit.sh` with backup logic
- Create `post-edit.sh` with test execution
- Create `session-end.sh` with cleanup
- Make scripts executable

---

## Example 7: Batch Fix Naming Issues

**User:**
```
I have 50 skills with mismatched names. Fix them all.
```

**Expected Behavior:**
- Run `scripts/fix-skill.sh` on all skills
- Update `name` field in each SKILL.md to match directory
- Report which files were changed

---

## Example 8: Create Skill from Template

**User:**
```
Create a new skill called "lambda-deploy" using the advanced template
```

**Expected Behavior:**
- Use `resources/templates/advanced/SKILL.md.template`
- Replace placeholders with skill-specific content
- Create full directory structure
- Include all advanced sections (CI/CD, API Reference, etc.)
