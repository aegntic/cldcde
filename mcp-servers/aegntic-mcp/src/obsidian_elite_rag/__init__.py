"""
Obsidian Elite RAG MCP Server

An elite Retrieval-Augmented Generation system that transforms Obsidian vaults
into AI-paired cognitive workflow engines with Graphiti knowledge graph integration.

Author: Mattae Cooper (research@aegntic.ai)
Organization: Aegntic AI (https://aegntic.ai)
License: MIT
"""

__version__ = "1.0.0"
__author__ = "Mattae Cooper"
__email__ = "research@aegntic.ai"
__license__ = "MIT"

from .core.rag_engine import MultiLayerRAG
from .core.graphiti_adapter import GraphitiAdapter
from .server import create_server
from .cli import main as cli_main

__all__ = [
    "MultiLayerRAG",
    "GraphitiAdapter",
    "create_server",
    "cli_main",
    "__version__",
]