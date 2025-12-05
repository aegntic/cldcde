"""
AI Collaboration Hub - Type Definitions
Created by: Mattae Cooper <human@mattaecooper.org> and '{ae}'aegntic.ai <contact@aegntic.ai>
License: Dual License (Free for non-commercial use, commercial license required)
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel


class MessageSource(str, Enum):
    CLAUDE = "claude"
    GEMINI = "gemini"
    USER = "user"


class ConversationMessage(BaseModel):
    id: str
    timestamp: datetime
    source: MessageSource
    content: str
    approved: bool = False
    context: Optional[str] = None


class SessionLimits(BaseModel):
    max_exchanges: int = 50
    timeout_minutes: int = 60
    require_approval: bool = True


class CollaborationSession(BaseModel):
    id: str
    start_time: datetime
    messages: List[ConversationMessage] = []
    active: bool = True
    limits: SessionLimits = SessionLimits()


class ApprovalRequest(BaseModel):
    message_id: str
    source: MessageSource
    target: MessageSource
    content: str
    context: Optional[str] = None


class GeminiConfig(BaseModel):
    api_key: Optional[str] = None
    base_url: str = "https://openrouter.ai/api/v1"
    model: str = "google/gemini-pro-1.5"
    max_tokens: int = 1000000