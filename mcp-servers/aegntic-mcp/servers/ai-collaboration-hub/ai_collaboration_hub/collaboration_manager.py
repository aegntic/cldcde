"""
AI Collaboration Hub - Collaboration Manager
Created by: Mattae Cooper <human@mattaecooper.org> and '{ae}'aegntic.ai <contact@aegntic.ai>
License: Dual License (Free for non-commercial use, commercial license required)
"""
import asyncio
from datetime import datetime
from typing import Dict, List, Optional
from .types import (
    CollaborationSession, ConversationMessage, MessageSource, 
    SessionLimits, ApprovalRequest
)
from .openrouter_client import OpenRouterClient


class CollaborationManager:
    def __init__(self, gemini_client: OpenRouterClient):
        self.sessions: Dict[str, CollaborationSession] = {}
        self.gemini_client = gemini_client
        self.pending_approvals: Dict[str, ApprovalRequest] = {}

    def create_session(self, limits: Optional[Dict] = None) -> str:
        """Create a new collaboration session"""
        session_id = f"session_{int(datetime.now().timestamp())}"
        
        session_limits = SessionLimits()
        if limits:
            session_limits = SessionLimits(**limits)
        
        session = CollaborationSession(
            id=session_id,
            start_time=datetime.now(),
            limits=session_limits
        )
        
        self.sessions[session_id] = session
        return session_id

    async def send_to_gemini(self, session_id: str, content: str, context: Optional[str] = None) -> str:
        """Send message to Gemini with user approval if required"""
        session = self.sessions.get(session_id)
        if not session or not session.active:
            raise ValueError("Session not found or inactive")

        if len(session.messages) >= session.limits.max_exchanges:
            raise ValueError("Session exchange limit reached")

        message_id = f"msg_{int(datetime.now().timestamp())}"
        
        # User approval gate
        if session.limits.require_approval:
            print(f"\n🔄 Claude → Gemini: {content[:100]}...")
            if context:
                print(f"📝 Context: {context[:100]}...")
            
            approval = input("\n❓ Approve this message? (y/n): ").lower().strip()
            if approval != 'y':
                raise ValueError("Message not approved by user")

        # Send to Gemini
        response = await self.gemini_client.send_message(content, context)        # Log the exchange
        claude_msg = ConversationMessage(
            id=message_id,
            timestamp=datetime.now(),
            source=MessageSource.CLAUDE,
            content=content,
            approved=True,
            context=context
        )
        
        gemini_msg = ConversationMessage(
            id=f"{message_id}_response",
            timestamp=datetime.now(),
            source=MessageSource.GEMINI,
            content=response,
            approved=True
        )
        
        session.messages.extend([claude_msg, gemini_msg])
        print(f"\n🤖 Gemini: {response[:200]}...")
        return response

    def get_conversation_log(self, session_id: str) -> List[ConversationMessage]:
        """Get conversation history for session"""
        session = self.sessions.get(session_id)
        return session.messages if session else []

    def end_session(self, session_id: str) -> None:
        """End collaboration session"""
        session = self.sessions.get(session_id)
        if session:
            session.active = False
            print(f"📝 Session ended: {session_id}")

    def get_session(self, session_id: str) -> Optional[CollaborationSession]:
        """Get session by ID"""
        return self.sessions.get(session_id)