# Prompts System

Prompts are markdown files that extend Claude's system context when a skill is active. They provide additional instructions, context, and examples to improve skill execution.

## Prompt Types

| Type | File | Purpose |
|------|------|---------|
| System | `prompts/system.md` | Core context and behaviors |
| Examples | `prompts/examples.md` | Example interactions |
| Templates | `prompts/templates.md` | Response templates |

## Directory Structure

```
skill-name/
└── prompts/
    ├── system.md       # System prompt extensions
    ├── examples.md     # Example user/assistant interactions
    └── templates.md    # Response format templates
```

## system.md - System Context

Extends Claude's system prompt when the skill is active.

```markdown
# System Prompt Extensions

## Core Context
[Additional context about the domain]

## Key Behaviors
1. Behavior one
2. Behavior two

## Constraints
- Constraint one
- Constraint two

## Output Format
[Expected output format]
```

### Example: API Tester Skill

```markdown
# System Prompt Extensions for API Tester

## Core Context

You are operating with the API Tester skill, which provides comprehensive
tools for testing REST and GraphQL APIs.

## Key Behaviors

1. **Always validate responses**: Check status codes, headers, and body
2. **Use proper HTTP methods**: GET for read, POST for create, etc.
3. **Handle authentication**: Include auth headers when required
4. **Report errors clearly**: Include request details in error messages

## Validation Rules

- 2xx status codes = success
- 4xx = client error (check request)
- 5xx = server error (check server logs)

## Output Format

When reporting test results, use:
```
✓ Test Name
  Request: METHOD /endpoint
  Status: 200
  Time: 123ms
```
```

## examples.md - Interaction Examples

Provides example user prompts and expected assistant behavior.

```markdown
# Example Prompts

## Example 1: Basic Usage

**User:**
```
Test the /users endpoint
```

**Expected Behavior:**
1. Send GET request to /users
2. Validate response structure
3. Report results

---

## Example 2: With Parameters

**User:**
```
Test POST /users with name "John" and email "john@example.com"
```

**Expected Behavior:**
1. Send POST request with JSON body
2. Validate creation (201 status)
3. Return created resource
```

## templates.md - Response Templates

Defines standard response formats.

```markdown
# Response Templates

## Test Result Template

```
## Test Results

| Endpoint | Method | Status | Time | Notes |
|----------|--------|--------|------|-------|
| /users | GET | 200 | 45ms | ✓ |
| /users | POST | 201 | 120ms | ✓ Created user #123 |
```

## Error Report Template

```
## Error Report

**Endpoint:** METHOD /path
**Status:** XXX
**Error:** Error message

**Request:**
```json
{ ... }
```

**Response:**
```json
{ ... }
```

**Suggestion:** How to fix
```
```

## When Prompts Are Loaded

Prompts are loaded in this order when a skill activates:

1. **System discovery** - Claude sees skill name/description
2. **Skill activation** - SKILL.md body is loaded
3. **Prompt loading** - `prompts/system.md` extends context
4. **On-demand** - `prompts/examples.md` loaded when examples needed

## Best Practices

### 1. Keep system.md concise
Focus on essential context, not comprehensive documentation.

```markdown
❌ # 500 lines of detailed documentation
✅ # Key behaviors and constraints (20-50 lines)
```

### 2. Use concrete examples
Show actual user prompts and expected responses.

```markdown
❌ "Test an endpoint"
✅ "Test GET /api/users?page=1&limit=10"
```

### 3. Include edge cases
Show how to handle unusual situations.

```markdown
## Example 3: Error Handling

**User:**
```
Test /users/999999 (non-existent user)
```

**Expected Behavior:**
1. Send GET request
2. Expect 404 status
3. Report as expected behavior, not failure
```

### 4. Show progressive complexity

```markdown
## Example 1: Simple
Basic usage with minimal parameters

## Example 2: Intermediate
With authentication and query parameters

## Example 3: Advanced
Batch operations with error handling
```

### 5. Include anti-patterns

```markdown
## Anti-Pattern: Unauthenticated Request

❌ **User:**
```
Test DELETE /users/123
```

**Problem:** No authentication header

✅ **User:**
```
Test DELETE /users/123 with auth token $API_TOKEN
```
```

## Integration with SKILL.md

Reference prompts from SKILL.md:

```markdown
## How to Use This Skill

See [Example Prompts](prompts/examples.md) for usage examples.

## Response Format

Responses follow the [standard template](prompts/templates.md).
```
