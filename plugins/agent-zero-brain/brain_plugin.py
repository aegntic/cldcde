#!/usr/bin/env python3
"""
Agent Zero Brain Plugin
=======================
Persistent memory and knowledge graph integration for Agent Zero.
- Auto-activates on every session
- Syncs to Obsidian vault
- Uses minimal resources
- Zero-cost operation
"""

import os
import json
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
import hashlib


class BrainPlugin:
    """
    Agent Zero Brain Plugin - always active memory system.
    """

    VERSION = "1.0.0"

    def __init__(self, agent_dir: str = "/a0"):
        self.agent_dir = Path(agent_dir)
        self.data_dir = self.agent_dir / "usr" / "brain"
        self.obsidian_dir = self.agent_dir / "usr" / "obsidian"

        # Ensure directories exist
        self.data_dir.mkdir(parents=True, exist_ok=True)

        # Initialize Obsidian structure
        self._init_obsidian_vault()

        # Session tracking
        self.current_session_id: Optional[str] = None
        self.session_messages: List[Dict] = []
        self.entity_index: Dict[str, Dict] = {}

        # Config path
        self.config_file = self.data_dir / "config.json"
        self.state_file = self.data_dir / "state.json"

        self._load_state()

    def _init_obsidian_vault(self):
        """Initialize Obsidian vault structure"""
        folders = [
            "01_Sessions",
            "02_Entities",
            "03_Actions",
            "04_Projects",
            "05_References",
            "06_Templates",
        ]

        for folder in folders:
            (self.obsidian_dir / folder).mkdir(parents=True, exist_ok=True)

        # Create templates
        self._create_templates()

    def _create_templates(self):
        """Create Obsidian templates"""
        templates = {
            "session_template.md": """---
session_id: {{session_id}}
date: {{date}}
topics: []
entities: []
---

# Session: {{session_id}}

## Summary
{{summary}}

## Key Entities
{{entities}}

## Actions Taken
- 

## References
- 
""",
            "entity_template.md": """---
entity_type: {{type}}
created: {{created}}
frequency: 1
---

# {{name}}

## Type: {{type}}
## First Seen: {{created}}

## Description
{{description}}

## Connected To
- 

## Sessions
- 
""",
            "action_template.md": """---
action_type: {{type}}
timestamp: {{timestamp}}
status: pending
---

# {{title}}

## Description
{{description}}

## Result
{{result}}
""",
        }

        template_dir = self.obsidian_dir / "06_Templates"
        for name, content in templates.items():
            path = template_dir / name
            if not path.exists():
                path.write_text(content)

    def _load_state(self):
        """Load saved state"""
        if self.state_file.exists():
            self.state = json.loads(self.state_file.read_text())
        else:
            self.state = {
                "sessions": [],
                "entities": {},
                "last_session_id": None,
                "total_messages": 0,
            }

    def _save_state(self):
        """Save current state"""
        self.state_file.write_text(json.dumps(self.state, indent=2))

    def start_session(self, session_id: Optional[str] = None):
        """Start a new brain session"""
        import uuid

        self.current_session_id = (
            session_id or f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        )
        self.session_messages = []

        # Update state
        if self.current_session_id not in self.state["sessions"]:
            self.state["sessions"].append(self.current_session_id)

        self._save_state()

        print(f"🧠 Brain: Session started - {self.current_session_id}")
        return self.current_session_id

    def record_message(self, role: str, content: str, metadata: Optional[Dict] = None):
        """Record a message to brain - syncs in real-time"""
        if not self.current_session_id:
            self.start_session()

        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {},
        }

        self.session_messages.append(message)
        self.state["total_messages"] += 1

        # Extract and index entities
        self._extract_entities(content, role)

        # REAL-TIME sync to Obsidian on EVERY message
        self._sync_to_obsidian()

        self._save_state()

    def _extract_entities(self, content: str, role: str):
        """Extract entities from content"""
        import re
        from pathlib import Path

        # Patterns to extract
        patterns = {
            # Backtick-quoted (existing)
            "file": r"`([^\s]+\.(?:py|js|ts|tsx|jsx|md|json|yml|yaml|toml|sh|bat|ps1))`",
            "command": r"`([a-zA-Z][^\s]*)`",
            "function": r"def\s+(\w+)|function\s+(\w+)|const\s+(\w+)\s*=",
            "class": r"class\s+(\w+)",
            "url": r"https?://[^\s]+",
            "mention": r"@(\w+)",
            # Plain keywords
            "keyword": r"\b(Python|JavaScript|TypeScript|React|Vue|Angular|Node\.js|FastAPI|Django|Flask|OpenAI|Gemini|Claude|Anthropic|Llama|Ollama|Docker|Kubernetes|AWS|GCP|Azure|PostgreSQL|Redis|MongoDB|MySQL|GraphQL|REST|API|MCP|Agent Zero|GitHub)\b",
            # Plain files without backticks
            "plain_file": r"(?:file|module|class|function)\s+([a-zA-Z_][a-zA-Z0-9_]*\.(?:py|js|ts|tsx|jsx|json|yml|yaml))",
        }

        seen = set()

        for entity_type, pattern in patterns.items():
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                # Handle groups
                name = (
                    match
                    if isinstance(match, str)
                    else next((g for g in match if g), None)
                )
                if name and len(name) > 1:
                    name = name.strip()
                    if name.lower() not in seen:
                        self._add_entity(name, entity_type)
                        seen.add(name.lower())

    def _add_entity(self, name: str, entity_type: str):
        """Add entity to index"""
        key = hashlib.md5(name.lower().encode()).hexdigest()[:8]

        if key not in self.state["entities"]:
            self.state["entities"][key] = {
                "name": name,
                "type": entity_type,
                "created": datetime.now().isoformat(),
                "frequency": 0,
                "sessions": [],
            }

        self.state["entities"][key]["frequency"] += 1
        if self.current_session_id:
            if self.current_session_id not in self.state["entities"][key]["sessions"]:
                self.state["entities"][key]["sessions"].append(self.current_session_id)

    def _sync_to_obsidian(self):
        """Sync current session to Obsidian in real-time - rewrites full session"""
        if not self.current_session_id:
            return

        session_file = (
            self.obsidian_dir / "01_Sessions" / f"{self.current_session_id}.md"
        )

        if not self.session_messages:
            return

        # Build full content from scratch (ensures correct order)
        lines = [
            "---",
            f"session_id: {self.current_session_id}",
            f"date: {self.session_messages[0]['timestamp']}",
            f"message_count: {len(self.session_messages)}",
            "---",
            "",
            f"# Session: {self.current_session_id}",
            "",
            f"**Started**: {self.session_messages[0]['timestamp'][:16].replace('T', ' ')}",
            "",
            "## Conversation",
            "",
        ]

        # Add ALL messages in chronological order
        for msg in self.session_messages:
            role = msg["role"].upper()
            content = msg["content"][:800]
            timestamp = msg["timestamp"]
            lines.append(f"### {role}")
            lines.append(f"*[{timestamp}]*")
            lines.append(content)
            lines.append("")

        # Add entities section
        session_entities = [
            e
            for e in self.state["entities"].values()
            if self.current_session_id in e.get("sessions", [])
        ]

        if session_entities:
            lines.extend(["## Entities Referenced", ""])
            for entity in session_entities:
                lines.append(
                    f"- **{entity['name']}** ({entity['type']}) - {entity['frequency']}x"
                )

        session_file.write_text("\n".join(lines))

        # Sync entities in real-time
        self._sync_entities_to_obsidian()

    def _sync_entities_to_obsidian(self):
        """Sync entities to Obsidian in real-time"""
        if not self.current_session_id:
            return

        # Get entities for current session
        session_entities = [
            e
            for e in self.state["entities"].values()
            if self.current_session_id in e.get("sessions", [])
        ]

        for entity in session_entities:
            safe_name = entity["name"].replace("/", "_").replace(":", "_")[:50]
            entity_file = self.obsidian_dir / "02_Entities" / f"{safe_name}.md"

            # Build content
            content_parts = [
                "---",
                f"entity_type: {entity['type']}",
                f"created: {entity['created']}",
                f"frequency: {entity['frequency']}",
                "---",
                "",
                f"# {entity['name']}",
                "",
                f"**Type**: {entity['type']}",
                f"**First Seen**: {entity['created']}",
                f"**Frequency**: {entity['frequency']} mentions",
                "",
                "## Sessions",
            ]

            for sess in entity.get("sessions", []):
                content_parts.append(f"- [[{sess}]]")

            content_parts.extend(
                [
                    "",
                    "## Recent Mentions",
                ]
            )

            # Add recent session mention
            content_parts.append(
                f"- Session [[{self.current_session_id}]]: {entity['frequency']}x"
            )

            entity_file.write_text("\n".join(content_parts))

    def end_session(self, summary: str = ""):
        """End current session"""
        if not self.current_session_id:
            return

        # Final sync
        self._sync_to_obsidian()

        # Create session summary
        summary_file = (
            self.obsidian_dir / "01_Sessions" / f"{self.current_session_id}_summary.md"
        )
        summary_file.write_text(f"""---
session_id: {self.current_session_id}
ended: {datetime.now().isoformat()}
message_count: {len(self.session_messages)}
---

# Session Summary: {self.current_session_id}

## Summary
{summary or "No summary provided"}

## Statistics
- Messages: {len(self.session_messages)}
- Entities: {len(self.state["entities"])}

## Top Entities
{chr(10).join(f"- {e['name']} ({e['frequency']}x)" for e in sorted(self.state["entities"].values(), key=lambda x: x["frequency"], reverse=True)[:5])}
""")

        self.session_messages = []
        self.current_session_id = None
        self._save_state()

        print(f"🧠 Brain: Session ended, synced to Obsidian")

    def get_context(self, query: str) -> str:
        """Get relevant context for query"""
        results = []

        # Search entities
        query_lower = query.lower()
        for key, entity in self.state["entities"].items():
            if query_lower in entity["name"].lower():
                results.append(
                    f"- {entity['name']} ({entity['type']}) - {entity['frequency']} references"
                )

        # Search recent sessions
        session_files = sorted(
            (self.obsidian_dir / "01_Sessions").glob("*.md"),
            key=lambda x: x.stat().st_mtime,
            reverse=True,
        )[:3]

        context = ["## Brain Context", ""]

        if results:
            context.extend(["### Relevant Entities", ""] + results[:5] + [""])

        context.extend(["### Recent Sessions", ""])

        for sf in session_files:
            context.append(f"- [[{sf.stem}]]")

        return "\n".join(context)

    def get_stats(self) -> Dict:
        """Get brain statistics"""
        return {
            "total_sessions": len(self.state["sessions"]),
            "total_messages": self.state["total_messages"],
            "total_entities": len(self.state["entities"]),
            "current_session": self.current_session_id,
            "messages_in_session": len(self.session_messages),
        }


# Global instance
_brain_instance: Optional[BrainPlugin] = None


def get_brain() -> BrainPlugin:
    """Get or create brain instance"""
    global _brain_instance
    if _brain_instance is None:
        _brain_instance = BrainPlugin()
    return _brain_instance


def initialize_brain():
    """Initialize brain - called on agent start"""
    brain = get_brain()
    brain.start_session()
    return brain


def record_user_message(content: str):
    """Record user message"""
    get_brain().record_message("user", content)


def record_agent_message(content: str, metadata: Optional[Dict] = None):
    """Record agent response"""
    get_brain().record_message("assistant", content, metadata)


def end_brain_session(summary: str = ""):
    """End session"""
    get_brain().end_session(summary)


def get_brain_context(query: str) -> str:
    """Get context for query"""
    return get_brain().get_context(query)


def get_brain_stats() -> Dict:
    """Get brain stats"""
    return get_brain().get_stats()
