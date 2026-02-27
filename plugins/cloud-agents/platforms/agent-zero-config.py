"""
Agent-Zero Integration for Multiplatform Autonomous Agent System

This module provides Agent-Zero specific adapters and configuration
for the Auto-Agent and Auto-Demo systems.

Installation:
  pip install auto-agent-multiplatform

Usage:
  from auto_agent import AutoAgentSystem, AutoDemoSystem

  # Initialize
  agent = AutoAgentSystem(platform='agent-zero')

  # Start autonomous task
  await agent.execute("Create a REST API with authentication")

  # Record demo
  demo = AutoDemoSystem(platform='agent-zero')
  demo.start_recording({"name": "API Demo"})
"""

import asyncio
import json
import os
import subprocess
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Callable
import aiofiles


class ActionType(Enum):
    FILE_CREATE = "file_create"
    FILE_EDIT = "file_edit"
    FILE_DELETE = "file_delete"
    COMMAND = "command"
    TEST = "test"
    GIT = "git"
    BROWSER = "browser"


class AgentRole(Enum):
    ARCHITECT = "architect"
    FRONTEND = "frontend"
    BACKEND = "backend"
    TESTING = "testing"
    DOCS = "docs"
    SECURITY = "security"
    DEVOPS = "devops"
    GENERAL = "general"


@dataclass
class AgentConfig:
    id: str
    role: AgentRole
    max_retries: int = 3
    timeout_ms: int = 3600000
    approval_mode: str = "hybrid"
    checkpoint_interval_ms: int = 900000


@dataclass
class RecordedAction:
    id: str
    timestamp: datetime
    action_type: ActionType
    target: str
    before: Optional[str] = None
    after: Optional[str] = None
    command: Optional[str] = None
    output: Optional[str] = None
    explanation: Optional[str] = None
    duration: int = 0


@dataclass
class DemoStep:
    id: str
    order: int
    title: str
    description: str
    actions: List[RecordedAction] = field(default_factory=list)
    code: Optional[str] = None
    language: Optional[str] = None


@dataclass
class Demo:
    id: str
    name: str
    steps: List[DemoStep]
    status: str = "ready"
    metadata: Dict[str, Any] = field(default_factory=dict)


class AgentZeroAdapter:
    """Platform adapter for Agent-Zero"""

    def __init__(self):
        self.name = "agent-zero"
        self.sandbox_enabled = True

    async def execute_command(self, command: str, args: List[str] = None) -> Dict[str, Any]:
        """Execute a shell command"""
        args = args or []
        try:
            result = subprocess.run(
                [command] + args,
                capture_output=True,
                text=True,
                timeout=300
            )
            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "exit_code": result.returncode,
                "success": result.returncode == 0
            }
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": "Command timed out",
                "exit_code": -1,
                "success": False
            }
        except Exception as e:
            return {
                "stdout": "",
                "stderr": str(e),
                "exit_code": -1,
                "success": False
            }

    async def read_file(self, path: str) -> str:
        """Read file contents"""
        async with aiofiles.open(path, 'r') as f:
            return await f.read()

    async def write_file(self, path: str, content: str) -> None:
        """Write content to file"""
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(path, 'w') as f:
            await f.write(content)

    async def delete_file(self, path: str) -> None:
        """Delete a file"""
        Path(path).unlink(missing_ok=True)

    async def create_checkpoint(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Create a checkpoint of current state"""
        checkpoint_id = f"checkpoint-{datetime.now().isoformat()}"
        checkpoint = {
            "id": checkpoint_id,
            "timestamp": datetime.now().isoformat(),
            "state": state,
            "git_ref": await self._get_git_ref()
        }
        return checkpoint

    async def _get_git_ref(self) -> Optional[str]:
        """Get current git reference"""
        result = await self.execute_command("git", ["rev-parse", "HEAD"])
        if result["success"]:
            return result["stdout"].strip()
        return None


class DemoRecorder:
    """Records demo sessions for Agent-Zero"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.actions: List[RecordedAction] = []
        self.is_recording = False
        self.start_time: Optional[datetime] = None
        self.action_counter = 0

    def start(self) -> None:
        """Start recording"""
        self.is_recording = True
        self.start_time = datetime.now()
        self.actions = []
        self.action_counter = 0

    def stop(self) -> Demo:
        """Stop recording and return demo"""
        self.is_recording = False
        steps = self._group_actions_into_steps()
        return Demo(
            id=f"demo-{datetime.now().timestamp()}",
            name=self.config.get("name", "Untitled Demo"),
            steps=steps,
            metadata=self._calculate_metadata()
        )

    def record_file_action(
        self,
        action_type: ActionType,
        path: str,
        before: Optional[str] = None,
        after: Optional[str] = None
    ) -> None:
        """Record a file operation"""
        if not self.is_recording:
            return

        self.action_counter += 1
        self.actions.append(RecordedAction(
            id=f"action-{self.action_counter}",
            timestamp=datetime.now(),
            action_type=action_type,
            target=path,
            before=before,
            after=after,
            duration=int((datetime.now() - self.start_time).total_seconds() * 1000)
        ))

    def record_command(self, command: str, output: str) -> None:
        """Record a terminal command"""
        if not self.is_recording:
            return

        self.action_counter += 1
        self.actions.append(RecordedAction(
            id=f"action-{self.action_counter}",
            timestamp=datetime.now(),
            action_type=ActionType.COMMAND,
            target="terminal",
            command=command,
            output=output,
            duration=int((datetime.now() - self.start_time).total_seconds() * 1000)
        ))

    def explain(self, text: str) -> None:
        """Add explanation to last action"""
        if self.actions:
            self.actions[-1].explanation = text

    def _group_actions_into_steps(self) -> List[DemoStep]:
        """Group recorded actions into logical steps"""
        steps = []
        current_step = None
        step_order = 0

        for action in self.actions:
            if action.action_type == ActionType.FILE_CREATE or not current_step:
                if current_step:
                    steps.append(current_step)
                step_order += 1
                current_step = DemoStep(
                    id=f"step-{step_order}",
                    order=step_order,
                    title=self._generate_step_title(action),
                    description="",
                    actions=[]
                )

            current_step.actions.append(action)

            if action.action_type == ActionType.FILE_EDIT and action.after:
                current_step.code = action.after
                current_step.language = self._detect_language(action.target)

        if current_step:
            steps.append(current_step)

        return steps

    def _generate_step_title(self, action: RecordedAction) -> str:
        """Generate a title for a step"""
        filename = action.target.split("/")[-1]
        titles = {
            ActionType.FILE_CREATE: f"Create {filename}",
            ActionType.FILE_EDIT: f"Update {filename}",
            ActionType.FILE_DELETE: f"Delete {filename}",
            ActionType.COMMAND: f"Run: {action.command.split()[0] if action.command else 'Command'}",
            ActionType.TEST: f"Test: {action.target}",
            ActionType.GIT: f"Git: {action.command}",
        }
        return titles.get(action.action_type, "Step")

    def _detect_language(self, path: str) -> str:
        """Detect programming language from file extension"""
        ext_map = {
            ".py": "python",
            ".js": "javascript",
            ".ts": "typescript",
            ".tsx": "typescript",
            ".jsx": "javascript",
            ".go": "go",
            ".rs": "rust",
            ".java": "java",
            ".rb": "ruby",
            ".php": "php",
            ".c": "c",
            ".cpp": "cpp",
            ".cs": "csharp",
            ".swift": "swift",
            ".kt": "kotlin",
            ".sh": "bash",
            ".json": "json",
            ".yaml": "yaml",
            ".yml": "yaml",
            ".md": "markdown",
            ".html": "html",
            ".css": "css",
            ".scss": "scss",
        }
        ext = Path(path).suffix.lower()
        return ext_map.get(ext, "plaintext")

    def _calculate_metadata(self) -> Dict[str, Any]:
        """Calculate demo metadata"""
        files_changed = set()
        commands_run = 0
        tests_passed = 0
        tests_failed = 0

        for action in self.actions:
            if action.action_type in (ActionType.FILE_EDIT, ActionType.FILE_CREATE):
                files_changed.add(action.target)
            elif action.action_type == ActionType.COMMAND:
                commands_run += 1
            elif action.action_type == ActionType.TEST:
                if action.command == "PASS":
                    tests_passed += 1
                else:
                    tests_failed += 1

        return {
            "total_duration_ms": int((datetime.now() - self.start_time).total_seconds() * 1000) if self.start_time else 0,
            "files_changed": list(files_changed),
            "commands_run": commands_run,
            "tests_passed": tests_passed,
            "tests_failed": tests_failed,
            "platform": "agent-zero"
        }


class AutoDemoSystem:
    """Main Auto-Demo system for Agent-Zero"""

    def __init__(self):
        self.platform = "agent-zero"
        self.adapter = AgentZeroAdapter()
        self.recorder: Optional[DemoRecorder] = None

    def start_recording(self, config: Dict[str, Any]) -> str:
        """Start recording a demo"""
        self.recorder = DemoRecorder(config)
        self.recorder.start()
        return f"demo-{datetime.now().timestamp()}"

    def stop_recording(self) -> Optional[Demo]:
        """Stop recording and return demo"""
        if not self.recorder:
            return None
        return self.recorder.stop()

    def record_action(
        self,
        action_type: ActionType,
        target: str,
        data: Optional[Dict[str, Any]] = None
    ) -> None:
        """Record an action"""
        if not self.recorder:
            return

        data = data or {}

        if action_type in (ActionType.FILE_CREATE, ActionType.FILE_EDIT, ActionType.FILE_DELETE):
            self.recorder.record_file_action(
                action_type, target, data.get("before"), data.get("after")
            )
        elif action_type == ActionType.COMMAND:
            self.recorder.record_command(data.get("command", ""), data.get("output", ""))

    def explain(self, text: str) -> None:
        """Add explanation to current action"""
        if self.recorder:
            self.recorder.explain(text)


# Convenience exports
__all__ = [
    "AutoDemoSystem",
    "DemoRecorder",
    "AgentZeroAdapter",
    "ActionType",
    "AgentRole",
    "Demo",
    "DemoStep",
    "RecordedAction",
]
