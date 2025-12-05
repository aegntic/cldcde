#!/usr/bin/env python3
"""
AI Collaboration Hub - MCP Server
Created by: Mattae Cooper <human@mattaecooper.org> and '{ae}'aegntic.ai <contact@aegntic.ai>
License: Dual License (Free for non-commercial use, commercial license required)
Repository: https://github.com/aegntic/aegntic-MCP
"""
import asyncio
import sys
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

from .collaboration_manager import CollaborationManager
from .openrouter_client import OpenRouterClient
from .types import GeminiConfig

collaboration_manager: CollaborationManager = None

async def initialize_clients():
    global collaboration_manager
    
    try:
        gemini_config = GeminiConfig()
        gemini_client = OpenRouterClient(gemini_config)
        collaboration_manager = CollaborationManager(gemini_client)
        print("🚀 AI Collaboration Hub initialized", file=sys.stderr)
        print("📄 Created by: Mattae Cooper & '{ae}'aegntic.ai | Dual Licensed", file=sys.stderr)
        
    except Exception as e:
        print(f"❌ Failed to initialize: {e}", file=sys.stderr)
        sys.exit(1)

TOOLS = [
    Tool(
        name="start_collaboration",
        description="Start new AI collaboration session",
        inputSchema={
            "type": "object",
            "properties": {
                "max_exchanges": {"type": "integer"},
                "require_approval": {"type": "boolean"}
            }
        }
    ),
    Tool(
        name="collaborate_with_gemini", 
        description="Send message to Gemini with oversight",
        inputSchema={
            "type": "object",
            "properties": {
                "session_id": {"type": "string"},
                "content": {"type": "string"},
                "context": {"type": "string"}
            },
            "required": ["session_id", "content"]
        }
    )    Tool(
        name="view_conversation",
        description="View conversation log for session",
        inputSchema={
            "type": "object",
            "properties": {"session_id": {"type": "string"}},
            "required": ["session_id"]
        }
    ),
    Tool(
        name="end_collaboration",
        description="End collaboration session",
        inputSchema={
            "type": "object", 
            "properties": {"session_id": {"type": "string"}},
            "required": ["session_id"]
        }
    )
]


async def handle_call_tool(name: str, arguments: dict):
    """Handle MCP tool calls"""
    try:
        if name == "start_collaboration":
            session_id = collaboration_manager.create_session(arguments)
            return [TextContent(type="text", text=f"🚀 Started collaboration session: {session_id}")]

        elif name == "collaborate_with_gemini":
            response = await collaboration_manager.send_to_gemini(
                arguments["session_id"],
                arguments["content"],
                arguments.get("context")
            )
            return [TextContent(type="text", text=f"✅ Gemini responded: {response}")]

        elif name == "view_conversation":
            log = collaboration_manager.get_conversation_log(arguments["session_id"])
            formatted = "\n".join([
                f"[{msg.timestamp.isoformat()}] {msg.source.value}: {msg.content}"
                for msg in log
            ])
            return [TextContent(type="text", text=f"📝 Conversation log:\n{formatted}")]

        elif name == "end_collaboration":
            collaboration_manager.end_session(arguments["session_id"])
            return [TextContent(type="text", text=f"🔚 Ended session: {arguments['session_id']}")]

        else:
            raise ValueError(f"Unknown tool: {name}")

    except Exception as e:
        return [TextContent(type="text", text=f"❌ Error: {str(e)}")]


async def main():
    """Main entry point"""
    await initialize_clients()
    
    server = Server("ai-collaboration-hub")
    
    @server.list_tools()
    async def list_tools():
        return TOOLS
    
    @server.call_tool()
    async def call_tool(name: str, arguments: dict):
        return await handle_call_tool(name, arguments)
    
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())