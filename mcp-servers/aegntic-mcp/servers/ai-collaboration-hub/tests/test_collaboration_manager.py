import pytest
from unittest.mock import AsyncMock, MagicMock
from ai_collaboration_hub.collaboration_manager import CollaborationManager
from ai_collaboration_hub.openrouter_client import OpenRouterClient
from ai_collaboration_hub.types import MessageSource


@pytest.fixture
def mock_gemini_client():
    client = MagicMock(spec=OpenRouterClient)
    client.send_message = AsyncMock(return_value="Test response from Gemini")
    return client


@pytest.fixture
def collaboration_manager(mock_gemini_client):
    return CollaborationManager(mock_gemini_client)


def test_create_session(collaboration_manager):
    """Test session creation with default limits"""
    session_id = collaboration_manager.create_session()
    
    assert session_id.startswith("session_")
    assert session_id in collaboration_manager.sessions
    
    session = collaboration_manager.sessions[session_id]
    assert session.active is True
    assert session.limits.max_exchanges == 50
    assert session.limits.require_approval is True


def test_create_session_with_custom_limits(collaboration_manager):
    """Test session creation with custom limits"""
    custom_limits = {"max_exchanges": 10, "require_approval": False}
    session_id = collaboration_manager.create_session(custom_limits)
    
    session = collaboration_manager.sessions[session_id]
    assert session.limits.max_exchanges == 10
    assert session.limits.require_approval is False


@pytest.mark.asyncio
async def test_send_to_gemini_no_approval(collaboration_manager, mock_gemini_client, monkeypatch):
    """Test sending message to Gemini without approval requirement"""
    # Create session without approval requirement
    session_id = collaboration_manager.create_session({"require_approval": False})
    
    # Mock the input function to avoid interactive prompts
    monkeypatch.setattr('builtins.input', lambda _: 'y')
    
    response = await collaboration_manager.send_to_gemini(
        session_id, 
        "Test message", 
        "Test context"
    )
    
    assert response == "Test response from Gemini"
    mock_gemini_client.send_message.assert_called_once_with("Test message", "Test context")
    
    # Check message logging
    session = collaboration_manager.sessions[session_id]
    assert len(session.messages) == 2  # Claude message + Gemini response
    assert session.messages[0].source == MessageSource.CLAUDE
    assert session.messages[1].source == MessageSource.GEMINI


@pytest.mark.asyncio
async def test_send_to_gemini_with_approval(collaboration_manager, mock_gemini_client, monkeypatch):
    """Test sending message to Gemini with approval requirement"""
    session_id = collaboration_manager.create_session({"require_approval": True})
    
    # Mock user approval
    monkeypatch.setattr('builtins.input', lambda _: 'y')
    
    response = await collaboration_manager.send_to_gemini(session_id, "Test message")
    
    assert response == "Test response from Gemini"
    mock_gemini_client.send_message.assert_called_once()


@pytest.mark.asyncio 
async def test_send_to_gemini_approval_denied(collaboration_manager, monkeypatch):
    """Test message rejection when user denies approval"""
    session_id = collaboration_manager.create_session({"require_approval": True})
    
    # Mock user denial
    monkeypatch.setattr('builtins.input', lambda _: 'n')
    
    with pytest.raises(ValueError, match="Message not approved by user"):
        await collaboration_manager.send_to_gemini(session_id, "Test message")


def test_get_conversation_log(collaboration_manager):
    """Test retrieving conversation log"""
    session_id = collaboration_manager.create_session()
    
    # Initially empty
    log = collaboration_manager.get_conversation_log(session_id)
    assert len(log) == 0
    
    # Non-existent session
    log = collaboration_manager.get_conversation_log("invalid_session")
    assert len(log) == 0


def test_end_session(collaboration_manager):
    """Test ending a session"""
    session_id = collaboration_manager.create_session()
    
    # Session should be active initially
    session = collaboration_manager.sessions[session_id]
    assert session.active is True
    
    # End the session
    collaboration_manager.end_session(session_id)
    assert session.active is False


def test_get_session(collaboration_manager):
    """Test retrieving session by ID"""
    session_id = collaboration_manager.create_session()
    
    # Valid session
    session = collaboration_manager.get_session(session_id)
    assert session is not None
    assert session.id == session_id
    
    # Invalid session
    session = collaboration_manager.get_session("invalid_session")
    assert session is None


@pytest.mark.asyncio
async def test_session_exchange_limit(collaboration_manager, mock_gemini_client, monkeypatch):
    """Test session exchange limit enforcement"""
    session_id = collaboration_manager.create_session({
        "max_exchanges": 1,
        "require_approval": False
    })
    
    monkeypatch.setattr('builtins.input', lambda _: 'y')
    
    # First exchange should work
    await collaboration_manager.send_to_gemini(session_id, "Message 1")
    
    # Second exchange should fail due to limit (2 messages = 1 exchange)
    with pytest.raises(ValueError, match="Session exchange limit reached"):
        await collaboration_manager.send_to_gemini(session_id, "Message 2")


@pytest.mark.asyncio
async def test_inactive_session(collaboration_manager):
    """Test sending message to inactive session"""
    session_id = collaboration_manager.create_session()
    collaboration_manager.end_session(session_id)
    
    with pytest.raises(ValueError, match="Session not found or inactive"):
        await collaboration_manager.send_to_gemini(session_id, "Test message")