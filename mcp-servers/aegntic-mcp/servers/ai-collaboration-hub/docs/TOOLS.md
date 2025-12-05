# AI Collaboration Hub - Tools Reference

## Overview

AI Collaboration Hub provides 4 core tools for supervised AI-to-AI collaboration between Claude Code and Gemini through OpenRouter's API.

## Tools

### 1. `start_collaboration`

**Description:** Start a new supervised AI collaboration session with configurable limits and approval settings.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "max_exchanges": {
      "type": "integer",
      "description": "Maximum number of message exchanges allowed in this session",
      "default": 50,
      "minimum": 1,
      "maximum": 1000
    },
    "require_approval": {
      "type": "boolean", 
      "description": "Whether to require user approval for each message before sending",
      "default": true
    }
  }
}
```

**Returns:** Session ID string for use in subsequent tool calls

**Example:**
```python
start_collaboration({
  "max_exchanges": 20,
  "require_approval": true
})
# Returns: "🚀 Started collaboration session: session_1735123456"
```

### 2. `collaborate_with_gemini`

**Description:** Send a message to Gemini with optional context, subject to user approval if enabled.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "session_id": {
      "type": "string",
      "description": "Session ID returned from start_collaboration"
    },
    "content": {
      "type": "string",
      "description": "Message content to send to Gemini (can be up to 1M tokens with context)"
    },
    "context": {
      "type": "string",
      "description": "Optional context information (codebase, files, documentation) to include"
    }
  },
  "required": ["session_id", "content"]
}
```

**Returns:** Gemini's response with confirmation message

**Example:**
```python
collaborate_with_gemini({
  "session_id": "session_1735123456",
  "content": "Analyze this React component for performance issues and suggest optimizations",
  "context": "Component code: [large codebase context...]"
})
# Returns: "✅ Gemini responded: I've analyzed your React component..."
```

### 3. `view_conversation`

**Description:** View the complete conversation log for a session with timestamps and message sources.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "session_id": {
      "type": "string",
      "description": "Session ID to view conversation history for"
    }
  },
  "required": ["session_id"]
}
```

**Returns:** Formatted conversation log with timestamps

**Example:**
```python
view_conversation({"session_id": "session_1735123456"})
# Returns: "📝 Conversation log:\n[2025-01-06T15:30:00] claude: Analyze this component...\n[2025-01-06T15:30:15] gemini: I've analyzed your component..."
```

### 4. `end_collaboration`

**Description:** End an active collaboration session and mark it as inactive.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "session_id": {
      "type": "string",
      "description": "Session ID to end"
    }
  },
  "required": ["session_id"]
}
```

**Returns:** Confirmation message

**Example:**
```python
end_collaboration({"session_id": "session_1735123456"})
# Returns: "🔚 Ended session: session_1735123456"
```

## Tool Usage Patterns

### Basic Workflow
1. **Start** a session with `start_collaboration`
2. **Collaborate** using `collaborate_with_gemini` (multiple times)
3. **Review** progress with `view_conversation` 
4. **End** the session with `end_collaboration`

### Advanced Patterns
- **Context-Rich Analysis:** Pass entire codebases as context to leverage Gemini's 1M token window
- **Iterative Development:** Multiple exchanges in one session for back-and-forth collaboration
- **Approval Gates:** Control every AI exchange with user oversight
- **Session Management:** Multiple concurrent sessions for different projects