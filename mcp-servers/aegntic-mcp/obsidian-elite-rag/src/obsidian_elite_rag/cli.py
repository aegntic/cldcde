#!/usr/bin/env python3

"""
Obsidian Elite RAG CLI

Command-line interface for the elite RAG system with MCP server support.

Author: Mattae Cooper (research@aegntic.ai)
Organization: Aegntic AI (https://aegntic.ai)
License: MIT
"""

import asyncio
import click
import logging
import sys
from pathlib import Path
from typing import Optional

from .core.rag_engine import MultiLayerRAG
from .server import main as server_main

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@click.group()
@click.version_option(version="1.0.0", prog_name="obsidian-elite-rag")
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose logging")
def cli(verbose: bool):
    """Obsidian Elite RAG CLI - Multi-layer Retrieval-Augmented Generation with Graphiti Knowledge Graph.

    Author: Mattae Cooper (research@aegntic.ai)
    Organization: Aegntic AI (https://aegntic.ai)
    """
    if verbose:
        logging.getLogger().setLevel(logging.DEBUG)


@cli.command()
@click.argument("vault_path", type=click.Path(exists=True, file_okay=False, dir_okay=True))
@click.option("--config", "-c", type=click.Path(exists=True), help="Path to configuration file")
@click.option("--watch", is_flag=True, help="Watch for file changes and auto-update")
async def ingest(vault_path: str, config: Optional[str], watch: bool):
    """Ingest markdown files from an Obsidian vault into the RAG system."""
    try:
        rag = MultiLayerRAG(vault_path, config or "")

        click.echo(f"🚀 Starting ingestion of vault: {vault_path}")
        await rag.ingest_vault()

        click.echo("✅ Ingestion completed successfully!")

        if watch:
            click.echo("👀 Watching for file changes...")
            # TODO: Implement file watching

    except Exception as e:
        click.echo(f"❌ Ingestion failed: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.argument("query")
@click.argument("vault_path", type=click.Path(exists=True, file_okay=False, dir_okay=True))
@click.option("--query-type", "-t",
              type=click.Choice(["general", "technical", "research", "workflow"]),
              default="general", help="Type of query for domain specialization")
@click.option("--limit", "-l", default=10, help="Maximum number of results")
@click.option("--config", "-c", type=click.Path(exists=True), help="Path to configuration file")
async def query(query: str, vault_path: str, query_type: str, limit: int, config: Optional[str]):
    """Query the elite RAG system with multi-layer retrieval."""
    try:
        rag = MultiLayerRAG(vault_path, config or "")

        click.echo(f"🔍 Querying RAG system: {query}")
        documents = await rag.retrieve(query, query_type, limit=limit)

        if not documents:
            click.echo("No results found.")
            return

        click.echo(f"\n📊 Found {len(documents)} results:\n")

        for i, doc in enumerate(documents, 1):
            source = doc.metadata.get('source', 'Unknown')
            title = doc.metadata.get('title', 'Untitled')
            retrieval_method = doc.metadata.get('retrieval_method', 'unknown')

            click.echo(f"{i}. {title}")
            click.echo(f"   Source: {source}")
            click.echo(f"   Method: {retrieval_method}")
            click.echo(f"   Content: {doc.content[:200]}...")
            click.echo()

    except Exception as e:
        click.echo(f"❌ Query failed: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.argument("vault_path", type=click.Path(exists=True, file_okay=False, dir_okay=True))
@click.option("--config", "-c", type=click.Path(exists=True), help="Path to configuration file")
async def status(vault_path: str, config: Optional[str]):
    """Get system status including database connections."""
    try:
        rag = MultiLayerRAG(vault_path, config or "")

        click.echo("🔍 System Status\n")

        # Check vault
        vault_path_obj = Path(vault_path)
        md_files = list(vault_path_obj.rglob("*.md"))
        click.echo(f"✅ Vault: {vault_path} ({len(md_files)} markdown files)")

        # Check Qdrant
        try:
            collections = rag.qdrant_client.get_collections().collections
            if any(c.name == rag.collection_name for c in collections):
                click.echo(f"✅ Qdrant: Connected (collection '{rag.collection_name}' exists)")
            else:
                click.echo("⚠️ Qdrant: Connected (collection not found)")
        except Exception as e:
            click.echo(f"❌ Qdrant: Connection failed - {str(e)}")

        # Check Neo4j/Graphiti
        if rag.graphiti_adapter:
            try:
                with rag.graphiti_adapter.driver.session() as session:
                    session.run("RETURN 1")
                click.echo("✅ Neo4j: Connected")
                click.echo("✅ Graphiti: Enabled")
            except Exception as e:
                click.echo(f"❌ Neo4j: Connection failed - {str(e)}")
        else:
            click.echo("⚠️ Graphiti: Disabled")

        # Check knowledge graph
        if rag.knowledge_graph.number_of_nodes() > 0:
            click.echo(f"✅ NetworkX Graph: {rag.knowledge_graph.number_of_nodes()} nodes, {rag.knowledge_graph.number_of_edges()} edges")
        else:
            click.echo("⚠️ NetworkX Graph: Empty")

        click.echo("\n🚀 System ready for RAG operations!")

    except Exception as e:
        click.echo(f"❌ Status check failed: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
def server():
    """Start the MCP server for Claude Code integration."""
    click.echo("🚀 Starting Obsidian Elite RAG MCP Server...")
    click.echo("Author: Mattae Cooper (research@aegntic.ai)")
    click.echo("Organization: Aegntic AI (https://aegntic.ai)")
    click.echo()

    asyncio.run(server_main())


@cli.command()
@click.argument("vault_path", type=click.Path(exists=True, file_okay=False, dir_okay=True))
@click.option("--config", "-c", type=click.Path(exists=True), help="Path to configuration file")
@click.option("--entity-query", "-e", help="Search for specific entities")
@click.option("--entity-types", "-t", multiple=True,
              default=["concept", "person", "organization", "technology"],
              help="Entity types to search for")
async def graph(vault_path: str, config: Optional[str], entity_query: Optional[str], entity_types: tuple):
    """Interact with the Graphiti knowledge graph."""
    try:
        rag = MultiLayerRAG(vault_path, config or "")

        if not rag.graphiti_adapter:
            click.echo("❌ Graphiti is not available. Please ensure Neo4j is running.")
            return

        if entity_query:
            # Search for entities
            click.echo(f"🔍 Searching knowledge graph: {entity_query}")
            entities = await rag.graphiti_adapter.search_entities(entity_query, list(entity_types), 20)

            if not entities:
                click.echo("No entities found.")
                return

            click.echo(f"\n📊 Found {len(entities)} entities:\n")

            for entity in entities:
                click.echo(f"• {entity['name']} ({entity['type']})")
                click.echo(f"  {entity['description'][:100]}...")
                click.echo()

        else:
            # Show graph statistics
            click.echo("📊 Knowledge Graph Statistics")

            # Get entity counts by type
            entity_type_counts = {}
            for entity_type in entity_types:
                entities = await rag.graphiti_adapter.search_entities("", [entity_type], 1000)
                entity_type_counts[entity_type] = len(entities)

            click.echo("\nEntity Types:")
            for entity_type, count in entity_type_counts.items():
                click.echo(f"  • {entity_type}: {count} entities")

    except Exception as e:
        click.echo(f"❌ Graph operation failed: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
def setup():
    """Setup the Obsidian Elite RAG system."""
    click.echo("🚀 Setting up Obsidian Elite RAG System...")
    click.echo()

    # Check prerequisites
    click.echo("📋 Checking prerequisites...")

    # Check Docker
    try:
        import subprocess
        result = subprocess.run(["docker", "--version"], capture_output=True, text=True)
        click.echo(f"✅ Docker: {result.stdout.strip()}")
    except:
        click.echo("❌ Docker not found. Please install Docker.")
        return

    # Check Python
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}"
    if sys.version_info >= (3, 9):
        click.echo(f"✅ Python: {python_version}")
    else:
        click.echo(f"❌ Python {python_version} is too old. Please upgrade to 3.9+")
        return

    # Create directories
    click.echo("\n📁 Creating directories...")
    directories = ["logs", "data/qdrant", "data/neo4j", "data/embeddings", "data/cache"]
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        click.echo(f"✅ {directory}")

    click.echo("\n🎯 Next steps:")
    click.echo("1. Start databases: npm run start:databases")
    click.echo("2. Ingest your vault: obsidian-elite-rag-cli ingest /path/to/vault")
    click.echo("3. Start MCP server: obsidian-elite-rag-cli server")
    click.echo("4. Configure Claude Code to use this MCP server")
    click.echo()
    click.echo("📚 For detailed documentation, see README.md")


def main():
    """Main entry point for the CLI."""
    cli()


if __name__ == "__main__":
    main()