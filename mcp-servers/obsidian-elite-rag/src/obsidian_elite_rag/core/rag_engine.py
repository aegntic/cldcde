#!/usr/bin/env python3

"""
Elite RAG Engine - Multi-layer Retrieval-Augmented Generation System
Integrates Obsidian knowledge management with Claude Code for elite workflows
"""

import asyncio
import os
import sys
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Qdrant
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

import networkx as nx
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
import hashlib
import yaml

from .graphiti_adapter import GraphitiAdapter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/rag-engine.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class Document:
    """Represents a knowledge document"""
    content: str
    metadata: Dict[str, Any]
    doc_id: str
    embedding: Optional[List[float]] = None

class MultiLayerRAG:
    """Multi-layer RAG system implementation"""

    def __init__(self, vault_path: str, config_path: str = "config/automation-config.yaml"):
        self.vault_path = Path(vault_path)
        self.config = self._load_config(config_path)
        self.embeddings = OpenAIEmbeddings()
        self.qdrant_client = QdrantClient(host="localhost", port=6333)
        self.knowledge_graph = nx.DiGraph()
        self.cache = {}

        # Initialize collection
        self.collection_name = "obsidian_knowledge"
        self._init_vector_store()

        # Load existing knowledge graph
        self._load_knowledge_graph()

        # Initialize Graphiti adapter
        kg_config = self.config.get('knowledge_graph', {})
        if kg_config.get('enabled', False):
            self.graphiti_adapter = GraphitiAdapter(kg_config.get('graphiti', {}))
            asyncio.create_task(self.graphiti_adapter.initialize_database())
        else:
            self.graphiti_adapter = None
        
    def _init_vector_store(self):
        """Initialize Qdrant vector store"""
        try:
            collections = self.qdrant_client.get_collections().collections
            if not any(c.name == self.collection_name for c in collections):
                self.qdrant_client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
                )
                logger.info(f"Created collection: {self.collection_name}")
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {e}")

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from YAML file"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.warning(f"Failed to load config from {config_path}: {e}")
            return {}

    def _load_knowledge_graph(self):
        """Load knowledge graph from vault links"""
        try:
            for md_file in self.vault_path.rglob("*.md"):
                if md_file.is_file():
                    self._extract_links_from_file(md_file)
            logger.info(f"Loaded knowledge graph with {self.knowledge_graph.number_of_nodes()} nodes")
        except Exception as e:
            logger.error(f"Failed to load knowledge graph: {e}")
            
    def _extract_links_from_file(self, file_path: Path):
        """Extract wiki-style links from markdown file"""
        try:
            content = file_path.read_text(encoding='utf-8')
            import re
            
            # Find all wiki links [[link]]
            wiki_links = re.findall(r'\[\[([^\]]+)\]\]', content)
            source = str(file_path.relative_to(self.vault_path))
            
            # Add node
            self.knowledge_graph.add_node(source, 
                                         content=content[:500], 
                                         title=file_path.stem)
            
            # Add edges for links
            for link in wiki_links:
                self.knowledge_graph.add_edge(source, link)
                
        except Exception as e:
            logger.warning(f"Failed to extract links from {file_path}: {e}")
    
    async def ingest_vault(self):
        """Ingest all markdown files from vault"""
        logger.info("Starting vault ingestion...")

        documents = []
        for md_file in self.vault_path.rglob("*.md"):
            if md_file.is_file():
                doc = await self._process_markdown_file(md_file)
                if doc:
                    documents.append(doc)

                    # Extract and add entities/relationships to knowledge graph
                    if self.graphiti_adapter:
                        try:
                            entities, relationships = await self.graphiti_adapter.extract_entities_and_relationships(doc)
                            if entities or relationships:
                                await self.graphiti_adapter.add_entities_and_relationships(entities, relationships)
                        except Exception as e:
                            logger.warning(f"Failed to process knowledge graph for {md_file}: {e}")

        # Batch upload to vector store
        await self._batch_upload_documents(documents)
        logger.info(f"Ingested {len(documents)} documents")
    
    async def _process_markdown_file(self, file_path: Path) -> Optional[Document]:
        """Process a single markdown file"""
        try:
            content = file_path.read_text(encoding='utf-8')
            
            # Extract metadata from frontmatter
            metadata = self._extract_frontmatter(content)
            
            # Remove frontmatter from content
            if content.startswith('---'):
                content = content.split('---', 2)[-1].strip()
            
            # Create document
            doc = Document(
                content=content,
                metadata={
                    **metadata,
                    'source': str(file_path.relative_to(self.vault_path)),
                    'title': file_path.stem,
                    'modified': datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                },
                doc_id=self._generate_doc_id(file_path)
            )
            
            return doc
            
        except Exception as e:
            logger.warning(f"Failed to process {file_path}: {e}")
            return None
    
    def _extract_frontmatter(self, content: str) -> Dict[str, Any]:
        """Extract YAML frontmatter from markdown"""
        metadata = {}
        if content.startswith('---'):
            try:
                import yaml
                frontmatter_end = content.find('---', 3)
                if frontmatter_end != -1:
                    frontmatter = content[3:frontmatter_end]
                    metadata = yaml.safe_load(frontmatter) or {}
            except Exception:
                pass
        return metadata
    
    def _generate_doc_id(self, file_path: Path) -> str:
        """Generate unique document ID"""
        return hashlib.md5(str(file_path).encode()).hexdigest()
    
    async def _batch_upload_documents(self, documents: List[Document], batch_size: int = 100):
        """Upload documents to vector store in batches"""
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]
            
            # Generate embeddings
            texts = [doc.content for doc in batch]
            embeddings = await self._generate_embeddings_batch(texts)
            
            # Prepare points for Qdrant
            points = []
            for doc, embedding in zip(batch, embeddings):
                points.append(PointStruct(
                    id=doc.doc_id,
                    vector=embedding,
                    payload={
                        'content': doc.content,
                        'metadata': doc.metadata
                    }
                ))
            
            # Upload to Qdrant
            self.qdrant_client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            
            logger.info(f"Uploaded batch {i//batch_size + 1}/{(len(documents)-1)//batch_size + 1}")
    
    async def _generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a batch of texts"""
        loop = asyncio.get_event_loop()
        
        def generate_embeddings():
            return self.embeddings.embed_documents(texts)
        
        with ThreadPoolExecutor() as executor:
            embeddings = await loop.run_in_executor(executor, generate_embeddings)
        
        return embeddings
    
    async def retrieve(self, query: str, query_type: str = "general",
                      context: Optional[Dict] = None, limit: int = 10) -> List[Document]:
        """Multi-layer retrieval"""

        # Get layer configuration
        layers_config = self.config.get('rag_system', {}).get('layers', {})

        all_docs = []

        # Layer 1: Semantic Retrieval (30% weight)
        if layers_config.get('semantic', {}).get('enabled', True):
            semantic_limit = int(limit * layers_config.get('semantic', {}).get('weight', 0.3) * 2)
            semantic_docs = await self._semantic_retrieval(query, semantic_limit)
            all_docs.extend(semantic_docs)

        # Layer 2: Knowledge Graph Retrieval (25% weight)
        if layers_config.get('knowledge_graph', {}).get('enabled', True) and self.graphiti_adapter:
            kg_limit = int(limit * layers_config.get('knowledge_graph', {}).get('weight', 0.25) * 2)
            kg_docs = await self._knowledge_graph_retrieval(query, kg_limit, layers_config.get('knowledge_graph', {}))
            all_docs.extend(kg_docs)

        # Layer 3: Graph Traversal (15% weight) - NetworkX
        if layers_config.get('graph', {}).get('enabled', True):
            graph_limit = int(limit * layers_config.get('graph', {}).get('weight', 0.15) * 2)
            semantic_docs = await self._semantic_retrieval(query, graph_limit)  # Get seed docs
            graph_docs = await self._graph_traversal(semantic_docs,
                                                    depth=layers_config.get('graph', {}).get('max_depth', 3))
            all_docs.extend(graph_docs)

        # Layer 4: Temporal Context (15% weight)
        if layers_config.get('temporal', {}).get('enabled', True):
            temporal_limit = int(limit * layers_config.get('temporal', {}).get('weight', 0.15) * 2)
            temporal_docs = await self._temporal_retrieval(query, context, temporal_limit)
            all_docs.extend(temporal_docs)

        # Layer 5: Domain Specialization (15% weight)
        if layers_config.get('domain', {}).get('enabled', True):
            domain_limit = int(limit * layers_config.get('domain', {}).get('weight', 0.15) * 2)
            domain_docs = await self._domain_specialization(query, query_type, context, domain_limit)
            all_docs.extend(domain_docs)

        # Layer 6: Meta-Knowledge (remaining weight)
        if layers_config.get('meta', {}).get('enabled', True):
            meta_limit = max(1, limit // 2)
            semantic_docs = await self._semantic_retrieval(query, meta_limit)  # Get seed docs
            meta_docs = await self._meta_knowledge_retrieval(query, semantic_docs)
            all_docs.extend(meta_docs)

        # Combine and rank results
        ranked_docs = await self._rank_documents(query, all_docs)

        return ranked_docs[:limit]
    
    async def _semantic_retrieval(self, query: str, limit: int) -> List[Document]:
        """Layer 1: Semantic similarity search"""
        try:
            # Generate query embedding
            query_embedding = self.embeddings.embed_query(query)
            
            # Search in Qdrant
            search_result = self.qdrant_client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                limit=limit,
                score_threshold=0.7
            )
            
            documents = []
            for hit in search_result:
                doc = Document(
                    content=hit.payload['content'],
                    metadata=hit.payload['metadata'],
                    doc_id=hit.id,
                    embedding=hit.vector
                )
                documents.append(doc)
            
            return documents
            
        except Exception as e:
            logger.error(f"Semantic retrieval failed: {e}")
            return []

    async def _knowledge_graph_retrieval(self, query: str, limit: int, config: Dict[str, Any]) -> List[Document]:
        """Layer 2: Knowledge graph retrieval using Graphiti"""
        try:
            if not self.graphiti_adapter:
                return []

            # Extract entity types and relationship types from config
            entity_types = config.get('entity_types', ["concept", "person", "organization", "event"])
            relationship_types = config.get('relationship_types', ["related_to", "part_of", "mentions", "examples_of"])
            max_depth = config.get('max_depth', 4)

            # Search for entities in the knowledge graph
            entities = await self.graphiti_adapter.search_entities(query, entity_types, limit)

            documents = []

            # For each entity, get its context and related entities
            for entity in entities:
                entity_context = await self.graphiti_adapter.get_entity_context(entity['name'])

                if entity_context:
                    # Create a synthetic document from entity context
                    content_parts = [
                        f"Entity: {entity_context['entity']['name']}",
                        f"Type: {entity_context['entity']['type']}",
                        f"Description: {entity_context['entity']['description']}",
                    ]

                    if entity_context['relationships']:
                        content_parts.append("\nRelationships:")
                        for rel in entity_context['relationships'][:10]:  # Limit to 10 relationships
                            content_parts.append(
                                f"- {rel['relationship_type']}: {rel['related_name']} ({rel['related_type']})"
                            )

                    # Create document
                    doc = Document(
                        content="\n".join(content_parts),
                        metadata={
                            'source': f"knowledge_graph:{entity['name']}",
                            'title': f"Knowledge Graph: {entity['name']}",
                            'entity_type': entity['type'],
                            'entity_name': entity['name'],
                            'retrieval_method': 'knowledge_graph',
                            'entity_count': len(entities),
                            'relationship_count': len(entity_context['relationships'])
                        },
                        doc_id=f"kg_{entity['name']}"
                    )
                    documents.append(doc)

                    # Get related entities and create additional documents
                    related_entities = await self.graphiti_adapter.get_related_entities(
                        entity['name'], relationship_types, max_depth
                    )

                    for related_entity in related_entities[:5]:  # Limit to 5 related entities
                        related_context = await self.graphiti_adapter.get_entity_context(related_entity['name'])
                        if related_context:
                            related_doc = Document(
                                content=f"Related Entity: {related_context['entity']['name']}\n"
                                       f"Type: {related_context['entity']['type']}\n"
                                       f"Description: {related_context['entity']['description']}",
                                metadata={
                                    'source': f"knowledge_graph_related:{related_entity['name']}",
                                    'title': f"Related: {related_entity['name']}",
                                    'entity_type': related_entity['type'],
                                    'entity_name': related_entity['name'],
                                    'retrieval_method': 'knowledge_graph_related',
                                    'related_to': entity['name']
                                },
                                doc_id=f"kg_related_{related_entity['name']}"
                            )
                            documents.append(related_doc)

            logger.info(f"Knowledge graph retrieval found {len(documents)} documents for query: {query}")
            return documents[:limit]

        except Exception as e:
            logger.error(f"Knowledge graph retrieval failed: {e}")
            return []

    async def _graph_traversal(self, seed_docs: List[Document], depth: int = 2) -> List[Document]:
        """Layer 2: Graph traversal for related knowledge"""
        try:
            related_docs = []
            
            for doc in seed_docs:
                source = doc.metadata.get('source', '')
                if source in self.knowledge_graph:
                    # Get neighbors in graph
                    neighbors = list(nx.single_source_shortest_path_length(
                        self.knowledge_graph, source, cutoff=depth
                    ).keys())
                    
                    # Load neighbor documents
                    for neighbor in neighbors:
                        if neighbor != source:
                            neighbor_doc = await self._load_document_by_path(neighbor)
                            if neighbor_doc:
                                related_docs.append(neighbor_doc)
            
            return related_docs
            
        except Exception as e:
            logger.error(f"Graph traversal failed: {e}")
            return []
    
    async def _temporal_retrieval(self, query: str, context: Optional[Dict], limit: int = 10) -> List[Document]:
        """Layer 3: Temporal context retrieval"""
        try:
            # For now, return recent documents
            # In production, this would be more sophisticated
            recent_docs = []
            
            search_result = self.qdrant_client.scroll(
                collection_name=self.collection_name,
                scroll_filter={
                    "must": [
                        {"key": "metadata.modified", "range": {"gte": "2024-01-01"}}
                    ]
                },
                limit=20
            )[0]
            
            for hit in search_result:
                doc = Document(
                    content=hit.payload['content'],
                    metadata=hit.payload['metadata'],
                    doc_id=hit.id
                )
                recent_docs.append(doc)
            
            return recent_docs
            
        except Exception as e:
            logger.error(f"Temporal retrieval failed: {e}")
            return []
    
    async def _domain_specialization(self, query: str, query_type: str,
                                   context: Optional[Dict], limit: int = 10) -> List[Document]:
        """Layer 4: Domain-specific retrieval"""
        try:
            # Define domain-specific filters
            domain_filters = {
                "technical": {"key": "metadata.tags", "match": {"any": ["#technical", "#code", "#development"]}},
                "research": {"key": "metadata.tags", "match": {"any": ["#research", "#paper", "#study"]}},
                "workflow": {"key": "metadata.tags", "match": {"any": ["#workflow", "#process", "#automation"]}}
            }
            
            filter_config = domain_filters.get(query_type, {})
            
            if filter_config:
                search_result = self.qdrant_client.search(
                    collection_name=self.collection_name,
                    query_vector=self.embeddings.embed_query(query),
                    query_filter=filter_config,
                    limit=10
                )
                
                documents = []
                for hit in search_result:
                    doc = Document(
                        content=hit.payload['content'],
                        metadata=hit.payload['metadata'],
                        doc_id=hit.id
                    )
                    documents.append(doc)
                
                return documents
            
            return []
            
        except Exception as e:
            logger.error(f"Domain specialization failed: {e}")
            return []
    
    async def _meta_knowledge_retrieval(self, query: str, base_docs: List[Document]) -> List[Document]:
        """Layer 5: Meta-knowledge retrieval"""
        try:
            # Look for methodology, pattern, and learning notes
            meta_keywords = ["methodology", "pattern", "framework", "principle", "approach"]
            
            meta_docs = []
            for keyword in meta_keywords:
                search_result = self.qdrant_client.search(
                    collection_name=self.collection_name,
                    query_vector=self.embeddings.embed_query(keyword),
                    limit=5
                )
                
                for hit in search_result:
                    doc = Document(
                        content=hit.payload['content'],
                        metadata=hit.payload['metadata'],
                        doc_id=hit.id
                    )
                    meta_docs.append(doc)
            
            return meta_docs
            
        except Exception as e:
            logger.error(f"Meta-knowledge retrieval failed: {e}")
            return []
    
    async def _rank_documents(self, query: str, documents: List[Document]) -> List[Document]:
        """Rank documents by relevance"""
        # Simple ranking by semantic similarity
        # In production, this would be more sophisticated
        query_embedding = self.embeddings.embed_query(query)
        
        def calculate_similarity(doc):
            if doc.embedding:
                import numpy as np
                return np.dot(query_embedding, doc.embedding) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(doc.embedding)
                )
            return 0.5  # Default score
        
        # Remove duplicates
        unique_docs = {}
        for doc in documents:
            if doc.doc_id not in unique_docs:
                unique_docs[doc.doc_id] = doc
        
        # Sort by similarity
        ranked_docs = sorted(unique_docs.values(), key=calculate_similarity, reverse=True)
        return ranked_docs
    
    async def _load_document_by_path(self, path: str) -> Optional[Document]:
        """Load document by file path"""
        try:
            file_path = self.vault_path / path
            if file_path.exists():
                return await self._process_markdown_file(file_path)
        except Exception as e:
            logger.warning(f"Failed to load document {path}: {e}")
        return None

class RAGEngine:
    """Main RAG Engine API"""
    
    def __init__(self, vault_path: str):
        self.rag = MultiLayerRAG(vault_path)
        self.vault_path = vault_path
        
    async def initialize(self):
        """Initialize the RAG engine"""
        logger.info("Initializing RAG engine...")
        await self.rag.ingest_vault()
        logger.info("RAG engine initialized successfully")
    
    async def query(self, query: str, query_type: str = "general", 
                   context: Optional[Dict] = None) -> Dict[str, Any]:
        """Process a query"""
        # Retrieve relevant documents
        documents = await self.rag.retrieve(query, query_type, context)
        
        # Synthesize context
        context_text = self._synthesize_context(documents, query)
        
        return {
            'query': query,
            'context': context_text,
            'documents': [
                {
                    'content': doc.content[:500] + "...",
                    'metadata': doc.metadata,
                    'relevance': 0.8  # Placeholder
                }
                for doc in documents[:5]
            ]
        }
    
    def _synthesize_context(self, documents: List[Document], query: str) -> str:
        """Synthesize context from retrieved documents"""
        if not documents:
            return "No relevant information found in your knowledge base."
        
        context_parts = []
        context_parts.append(f"Query: {query}\n")
        context_parts.append("Relevant Knowledge:\n")
        
        for i, doc in enumerate(documents[:5], 1):
            context_parts.append(f"\n{i}. From: {doc.metadata.get('title', 'Unknown')}")
            context_parts.append(f"Content: {doc.content[:300]}...")
        
        return "\n".join(context_parts)

# CLI Interface
async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Elite RAG Engine")
    parser.add_argument("--vault", required=True, help="Path to Obsidian vault")
    parser.add_argument("--query", help="Query to process")
    parser.add_argument("--ingest", action="store_true", help="Ingest vault")
    parser.add_argument("--query-type", default="general", 
                       choices=["general", "technical", "research", "workflow"],
                       help="Type of query")
    
    args = parser.parse_args()
    
    # Create logs directory
    os.makedirs("logs", exist_ok=True)
    
    # Initialize RAG engine
    engine = RAGEngine(args.vault)
    
    if args.ingest:
        await engine.initialize()
    
    if args.query:
        result = await engine.query(args.query, args.query_type)
        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    asyncio.run(main())