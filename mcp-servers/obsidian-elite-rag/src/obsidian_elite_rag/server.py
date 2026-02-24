#!/usr/bin/env python3

"""
Obsidian Elite RAG MCP Server

Provides MCP (Model Context Protocol) server functionality for the elite RAG system.
Integrates with Claude Code and other MCP-compatible AI assistants.

Author: Mattae Cooper (research@aegntic.ai)
Organization: Aegntic AI (https://aegntic.ai)
License: MIT
"""

import asyncio
import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence

import mcp.types as types
from mcp.server import Server
from mcp.server.stdio import stdio_server
from pydantic import AnyUrl

from .core.rag_engine import MultiLayerRAG, Document
from .core.graphiti_adapter import GraphitiAdapter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("logs/mcp-server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Global server instance
server = Server("obsidian-elite-rag")
rag_instance: Optional[MultiLayerRAG] = None


def initialize_rag(vault_path: str, config_path: Optional[str] = None) -> MultiLayerRAG:
    """Initialize the RAG system with the given vault path."""
    global rag_instance
    if rag_instance is None:
        config = config_path or str(Path(__file__).parent.parent.parent / "config" / "automation-config.yaml")
        rag_instance = MultiLayerRAG(vault_path, config)
        logger.info(f"RAG system initialized with vault: {vault_path}")
    return rag_instance


@server.list_tools()
async def handle_list_tools() -> List[types.Tool]:
    """List available MCP tools."""
    return [
        types.Tool(
            name="ingest_vault",
            description="Ingest all markdown files from an Obsidian vault into the RAG system",
            inputSchema={
                "type": "object",
                "properties": {
                    "vault_path": {
                        "type": "string",
                        "description": "Path to the Obsidian vault directory"
                    }
                },
                "required": ["vault_path"]
            }
        ),
        types.Tool(
            name="query_rag",
            description="Query the elite RAG system with multi-layer retrieval",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The query to search for"
                    },
                    "vault_path": {
                        "type": "string",
                        "description": "Path to the Obsidian vault directory"
                    },
                    "query_type": {
                        "type": "string",
                        "enum": ["general", "technical", "research", "workflow"],
                        "description": "Type of query for domain specialization",
                        "default": "general"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of results to return",
                        "default": 10
                    }
                },
                "required": ["query", "vault_path"]
            }
        ),
        types.Tool(
            name="search_knowledge_graph",
            description="Search the Graphiti knowledge graph for entities and relationships",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query for entities"
                    },
                    "vault_path": {
                        "type": "string",
                        "description": "Path to the Obsidian vault directory"
                    },
                    "entity_types": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Types of entities to search for",
                        "default": ["concept", "person", "organization", "technology"]
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of results to return",
                        "default": 20
                    }
                },
                "required": ["query", "vault_path"]
            }
        ),
        types.Tool(
            name="get_entity_context",
            description="Get rich context for a specific entity including relationships",
            inputSchema={
                "type": "object",
                "properties": {
                    "entity_name": {
                        "type": "string",
                        "description": "Name of the entity to get context for"
                    },
                    "vault_path": {
                        "type": "string",
                        "description": "Path to the Obsidian vault directory"
                    }
                },
                "required": ["entity_name", "vault_path"]
            }
        ),
        types.Tool(
            name="get_related_entities",
            description="Get entities related to a given entity through knowledge graph relationships",
            inputSchema={
                "type": "object",
                "properties": {
                    "entity_name": {
                        "type": "string",
                        "description": "Name of the source entity"
                    },
                    "vault_path": {
                        "type": "string",
                        "description": "Path to the Obsidian vault directory"
                    },
                    "relationship_types": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Types of relationships to follow",
                        "default": ["related_to", "implements", "uses", "depends_on"]
                    },
                    "max_depth": {
                        "type": "integer",
                        "description": "Maximum depth for relationship traversal",
                        "default": 3
                    }
                },
                "required": ["entity_name", "vault_path"]
            }
        ),
        types.Tool(
            name="get_system_status",
            description="Get status of the RAG system including database connections",
            inputSchema={
                "type": "object",
                "properties": {
                    "vault_path": {
                        "type": "string",
                        "description": "Path to the Obsidian vault directory"
                    }
                },
                "required": ["vault_path"]
            }
        )
    ]


@server.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[types.TextContent]:
    """Handle tool calls."""
    try:
        if name == "ingest_vault":
            vault_path = arguments["vault_path"]
            rag = initialize_rag(vault_path)

            await rag.ingest_vault()

            return [
                types.TextContent(
                    type="text",
                    text=f"✅ Successfully ingested vault: {vault_path}"
                )
            ]

        elif name == "query_rag":
            query = arguments["query"]
            vault_path = arguments["vault_path"]
            query_type = arguments.get("query_type", "general")
            limit = arguments.get("limit", 10)

            rag = initialize_rag(vault_path)

            documents = await rag.retrieve(query, query_type, limit=limit)

            if not documents:
                return [
                    types.TextContent(
                        type="text",
                        text=f"No results found for query: {query}"
                    )
                ]

            # Format results
            results = []
            for i, doc in enumerate(documents, 1):
                source = doc.metadata.get('source', 'Unknown')
                title = doc.metadata.get('title', 'Untitled')
                retrieval_method = doc.metadata.get('retrieval_method', 'unknown')

                result = f"## {i}. {title}\n"
                result += f"**Source:** {source}\n"
                result += f"**Retrieval Method:** {retrieval_method}\n\n"
                result += f"{doc.content[:1000]}"
                if len(doc.content) > 1000:
                    result += "..."
                result += "\n\n---\n"

                results.append(result)

            return [
                types.TextContent(
                    type="text",
                    text=f"# RAG Query Results: {query}\n\n" + "\n".join(results)
                )
            ]

        elif name == "search_knowledge_graph":
            query = arguments["query"]
            vault_path = arguments["vault_path"]
            entity_types = arguments.get("entity_types", ["concept", "person", "organization", "technology"])
            limit = arguments.get("limit", 20)

            rag = initialize_rag(vault_path)

            if not rag.graphiti_adapter:
                return [
                    types.TextContent(
                        type="text",
                        text="❌ Knowledge graph is not available. Please ensure Neo4j is running and Graphiti is properly configured."
                    )
                ]

            entities = await rag.graphiti_adapter.search_entities(query, entity_types, limit)

            if not entities:
                return [
                    types.TextContent(
                        type="text",
                        text=f"No entities found for query: {query}"
                    )
                ]

            # Format results
            results = []
            for entity in entities:
                result = f"## {entity['name']}\n"
                result += f"**Type:** {entity['type']}\n"
                result += f"**Description:** {entity['description']}\n"
                result += f"**Source Document:** {entity['source_doc_id']}\n\n"
                results.append(result)

            return [
                types.TextContent(
                    type="text",
                    text=f"# Knowledge Graph Search Results: {query}\n\n" + "\n".join(results)
                )
            ]

        elif name == "get_entity_context":
            entity_name = arguments["entity_name"]
            vault_path = arguments["vault_path"]

            rag = initialize_rag(vault_path)

            if not rag.graphiti_adapter:
                return [
                    types.TextContent(
                        type="text",
                        text="❌ Knowledge graph is not available. Please ensure Neo4j is running and Graphiti is properly configured."
                    )
                ]

            context = await rag.graphiti_adapter.get_entity_context(entity_name)

            if not context:
                return [
                    types.TextContent(
                        type="text",
                        text=f"No context found for entity: {entity_name}"
                    )
                ]

            entity = context['entity']
            relationships = context['relationships']

            # Format results
            result = f"# Entity Context: {entity['name']}\n\n"
            result += f"**Type:** {entity['type']}\n"
            result += f"**Description:** {entity['description']}\n\n"

            if relationships:
                result += "## Relationships\n\n"
                for rel in relationships[:20]:  # Limit to 20 relationships
                    result += f"- **{rel['relationship_type']}:** {rel['related_name']} ({rel['related_type']})\n"
                    if rel.get('confidence'):
                        result += f"  - Confidence: {rel['confidence']:.2f}\n"
                result += "\n"

            if context.get('related_documents'):
                result += "## Related Documents\n\n"
                for doc in context['related_documents'][:5]:  # Limit to 5 documents
                    result += f"- **{doc['title']}**\n"
                    result += f"  {doc['content'][:200]}...\n\n"

            return [
                types.TextContent(
                    type="text",
                    text=result
                )
            ]

        elif name == "get_related_entities":
            entity_name = arguments["entity_name"]
            vault_path = arguments["vault_path"]
            relationship_types = arguments.get("relationship_types", ["related_to", "implements", "uses", "depends_on"])
            max_depth = arguments.get("max_depth", 3)

            rag = initialize_rag(vault_path)

            if not rag.graphiti_adapter:
                return [
                    types.TextContent(
                        type="text",
                        text="❌ Knowledge graph is not available. Please ensure Neo4j is running and Graphiti is properly configured."
                    )
                ]

            related_entities = await rag.graphiti_adapter.get_related_entities(
                entity_name, relationship_types, max_depth
            )

            if not related_entities:
                return [
                    types.TextContent(
                        type="text",
                        text=f"No related entities found for: {entity_name}"
                    )
                ]

            # Format results
            results = []
            for entity in related_entities:
                result = f"## {entity['name']}\n"
                result += f"**Type:** {entity['type']}\n"
                result += f"**Description:** {entity['description']}\n\n"
                results.append(result)

            return [
                types.TextContent(
                    type="text",
                    text=f"# Related Entities for: {entity_name}\n\n" + "\n".join(results)
                )
            ]

        elif name == "get_system_status":
            vault_path = arguments["vault_path"]

            try:
                rag = initialize_rag(vault_path)

                status = "# System Status\n\n"

                # Check vault
                vault_path_obj = Path(vault_path)
                if vault_path_obj.exists():
                    md_files = list(vault_path_obj.rglob("*.md"))
                    status += f"✅ **Vault:** {vault_path} ({len(md_files)} markdown files)\n\n"
                else:
                    status += f"❌ **Vault:** {vault_path} (not found)\n\n"
                    return [types.TextContent(type="text", text=status)]

                # Check Qdrant
                try:
                    collections = rag.qdrant_client.get_collections().collections
                    qdrant_status = "✅ **Qdrant:** Connected"
                    if any(c.name == rag.collection_name for c in collections):
                        qdrant_status += f" (collection '{rag.collection_name}' exists)"
                    status += qdrant_status + "\n\n"
                except Exception as e:
                    status += f"❌ **Qdrant:** Connection failed - {str(e)}\n\n"

                # Check Neo4j/Graphiti
                if rag.graphiti_adapter:
                    try:
                        # Simple connection test
                        with rag.graphiti_adapter.driver.session() as session:
                            result = session.run("RETURN 1 as test").single()
                        status += "✅ **Neo4j:** Connected\n"
                        status += "✅ **Graphiti:** Enabled\n\n"
                    except Exception as e:
                        status += f"❌ **Neo4j:** Connection failed - {str(e)}\n\n"
                else:
                    status += "⚠️ **Graphiti:** Disabled (not configured)\n\n"

                # Check knowledge graph
                if rag.knowledge_graph.number_of_nodes() > 0:
                    status += f"✅ **NetworkX Graph:** {rag.knowledge_graph.number_of_nodes()} nodes, {rag.knowledge_graph.number_of_edges()} edges\n\n"
                else:
                    status += "⚠️ **NetworkX Graph:** Empty\n\n"

                status += "## Ready for RAG operations! 🚀"

                return [
                    types.TextContent(
                        type="text",
                        text=status
                    )
                ]

            except Exception as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"❌ Failed to get system status: {str(e)}"
                    )
                ]

        else:
            return [
                types.TextContent(
                    type="text",
                    text=f"Unknown tool: {name}"
                )
            ]

    except Exception as e:
        logger.error(f"Error in tool {name}: {str(e)}")
        return [
            types.TextContent(
                type="text",
                text=f"Error executing {name}: {str(e)}"
            )
        ]


def create_server() -> Server:
    """Create and return the MCP server instance."""
    return server


async def main():
    """Main entry point for the MCP server."""
    # Create logs directory
    Path("logs").mkdir(exist_ok=True)

    logger.info("Starting Obsidian Elite RAG MCP Server...")
    logger.info("Author: Mattae Cooper (research@aegntic.ai)")
    logger.info("Organization: Aegntic AI (https://aegntic.ai)")

    # Run the server
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())