#!/usr/bin/env python3
"""
Brain Integration Module
========================
Auto-loads brain system on Agent Zero startup.
Hooks into the message processing to record all conversations.
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path

# Ensure brain plugin is in path
PLUGIN_DIR = Path("/a0/plugins")
sys.path.insert(0, str(PLUGIN_DIR))

# Brain instance
_brain = None


def initialize_brain():
    """Initialize brain on agent startup"""
    global _brain

    try:
        from brain_plugin import get_brain, initialize_brain as init_brain_func

        _brain = init_brain_func()
        print("🧠 Brain System: Initialized")
        print(f"   Obsidian Vault: {_brain.obsidian_dir}")
        return True
    except Exception as e:
        print(f"⚠️ Brain System: Failed to initialize - {e}")
        return False


def get_brain_instance():
    """Get brain instance"""
    global _brain
    if _brain is None:
        initialize_brain()
    return _brain


def on_user_message(content: str):
    """Hook: Called when user sends a message"""
    brain = get_brain_instance()
    if brain:
        brain.record_message("user", content)


def on_agent_message(content: str, metadata: dict = None):
    """Hook: Called when agent responds"""
    brain = get_brain_instance()
    if brain:
        brain.record_message("assistant", content, metadata)


def on_session_start(session_id: str = None):
    """Hook: Called when new session starts"""
    brain = get_brain_instance()
    if brain:
        brain.start_session(session_id)


def on_session_end(summary: str = ""):
    """Hook: Called when session ends"""
    brain = get_brain_instance()
    if brain:
        brain.end_session(summary)


def get_context_for_query(query: str) -> str:
    """Get relevant context from brain"""
    brain = get_brain_instance()
    if brain:
        return brain.get_context(query)
    return ""


def get_brain_stats() -> dict:
    """Get brain statistics"""
    brain = get_brain_instance()
    if brain:
        return brain.get_stats()
    return {"status": "not initialized"}


# Auto-initialize on import
def _auto_init():
    """Auto-initialize when module is imported"""
    settings_path = Path("/a0/usr/settings.json")
    if settings_path.exists():
        try:
            settings = json.loads(settings_path.read_text())
            if settings.get("brain_enabled", False):
                initialize_brain()
        except:
            pass


# Run auto-init
_auto_init()
