"""
Vector database implementation using ChromaDB for local storage.
Replaces Supabase with a free, local-first vector database.
"""
import os
import sqlite3
import json
import uuid
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import chromadb
from chromadb.config import Settings
import aiosqlite
import asyncio
from contextlib import asynccontextmanager

class ChromaVectorDB:
    """
    ChromaDB-based vector database for storing and retrieving crawled content.
    """
    
    def __init__(self, persist_directory: str = None):
        """
        Initialize ChromaDB client.
        
        Args:
            persist_directory: Directory to persist the database
        """
        if persist_directory is None:
            persist_directory = str(Path.home() / ".crawl4ai_mcp" / "chroma_db")
        
        # Ensure directory exists
        Path(persist_directory).mkdir(parents=True, exist_ok=True)
        
        # Initialize ChromaDB with persistence
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Initialize collections
        self.docs_collection = self._get_or_create_collection("crawled_pages")
        self.code_collection = self._get_or_create_collection("code_examples")
        
        # Initialize SQLite for metadata and sources
        self.db_path = Path(persist_directory) / "metadata.db"
        self._init_sqlite()
    
    def _get_or_create_collection(self, name: str):
        """Get or create a ChromaDB collection."""
        try:
            return self.client.get_collection(name)
        except ValueError:
            return self.client.create_collection(name)
    
    def _init_sqlite(self):
        """Initialize SQLite database for metadata storage."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sources (
                    source_id TEXT PRIMARY KEY,
                    summary TEXT,
                    total_word_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
    
    async def add_documents(self, urls: List[str], chunk_numbers: List[int], 
                          contents: List[str], metadatas: List[Dict[str, Any]], 
                          embeddings: List[List[float]], batch_size: int = 20):
        """
        Add documents to the vector database.
        
        Args:
            urls: List of URLs
            chunk_numbers: List of chunk numbers
            contents: List of content strings
            metadatas: List of metadata dictionaries
            embeddings: List of embedding vectors
            batch_size: Batch size for processing
        """
        # Generate IDs for documents
        ids = [f"{url}#chunk_{chunk_num}" for url, chunk_num in zip(urls, chunk_numbers)]
        
        # Add to ChromaDB in batches
        for i in range(0, len(contents), batch_size):
            batch_end = min(i + batch_size, len(contents))
            
            self.docs_collection.add(
                ids=ids[i:batch_end],
                documents=contents[i:batch_end],
                metadatas=metadatas[i:batch_end],
                embeddings=embeddings[i:batch_end]
            )
    
    async def add_code_examples(self, urls: List[str], chunk_numbers: List[int],
                              code_examples: List[str], summaries: List[str],
                              metadatas: List[Dict[str, Any]], 
                              embeddings: List[List[float]], batch_size: int = 20):
        """
        Add code examples to the vector database.
        
        Args:
            urls: List of URLs
            chunk_numbers: List of chunk numbers
            code_examples: List of code example strings
            summaries: List of code summaries
            metadatas: List of metadata dictionaries
            embeddings: List of embedding vectors
            batch_size: Batch size for processing
        """
        # Generate IDs for code examples
        ids = [f"{url}#code_{chunk_num}" for url, chunk_num in zip(urls, chunk_numbers)]
        
        # Combine code and summary for document text
        documents = [f"Code: {code}\n\nSummary: {summary}" 
                    for code, summary in zip(code_examples, summaries)]
        
        # Add metadata for code content
        enhanced_metadatas = []
        for i, meta in enumerate(metadatas):
            enhanced_meta = meta.copy()
            enhanced_meta["code_content"] = code_examples[i]
            enhanced_meta["summary"] = summaries[i]
            enhanced_metadatas.append(enhanced_meta)
        
        # Add to ChromaDB in batches
        for i in range(0, len(documents), batch_size):
            batch_end = min(i + batch_size, len(documents))
            
            self.code_collection.add(
                ids=ids[i:batch_end],
                documents=documents[i:batch_end],
                metadatas=enhanced_metadatas[i:batch_end],
                embeddings=embeddings[i:batch_end]
            )
    
    def search_documents(self, query_embedding: List[float], match_count: int = 10,
                        filter_metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Search for similar documents.
        
        Args:
            query_embedding: Query embedding vector
            match_count: Number of results to return
            filter_metadata: Optional metadata filter
            
        Returns:
            List of matching documents with metadata and similarity scores
        """
        where_clause = filter_metadata if filter_metadata else None
        
        results = self.docs_collection.query(
            query_embeddings=[query_embedding],
            n_results=match_count,
            where=where_clause
        )
        
        # Format results
        formatted_results = []
        if results["documents"] and results["documents"][0]:
            for i, (doc, metadata, distance) in enumerate(zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0]
            )):
                formatted_results.append({
                    "id": results["ids"][0][i],
                    "content": doc,
                    "metadata": metadata,
                    "url": metadata.get("url", ""),
                    "source_id": metadata.get("source", ""),
                    "chunk_number": metadata.get("chunk_index", 0),
                    "similarity": 1 - distance  # Convert distance to similarity
                })
        
        return formatted_results
    
    def search_code_examples(self, query_embedding: List[float], match_count: int = 10,
                           filter_metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Search for similar code examples.
        
        Args:
            query_embedding: Query embedding vector
            match_count: Number of results to return
            filter_metadata: Optional metadata filter
            
        Returns:
            List of matching code examples with metadata and similarity scores
        """
        where_clause = filter_metadata if filter_metadata else None
        
        results = self.code_collection.query(
            query_embeddings=[query_embedding],
            n_results=match_count,
            where=where_clause
        )
        
        # Format results
        formatted_results = []
        if results["documents"] and results["documents"][0]:
            for i, (doc, metadata, distance) in enumerate(zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0]
            )):
                formatted_results.append({
                    "id": results["ids"][0][i],
                    "content": metadata.get("code_content", doc),
                    "summary": metadata.get("summary", ""),
                    "metadata": metadata,
                    "url": metadata.get("url", ""),
                    "source_id": metadata.get("source", ""),
                    "chunk_number": metadata.get("chunk_index", 0),
                    "similarity": 1 - distance  # Convert distance to similarity
                })
        
        return formatted_results
    
    async def update_source_info(self, source_id: str, summary: str, word_count: int):
        """
        Update source information in SQLite.
        
        Args:
            source_id: Source identifier
            summary: Source summary
            word_count: Total word count
        """
        async with aiosqlite.connect(self.db_path) as conn:
            await conn.execute("""
                INSERT OR REPLACE INTO sources (source_id, summary, total_word_count, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            """, (source_id, summary, word_count))
            await conn.commit()
    
    async def get_available_sources(self) -> List[Dict[str, Any]]:
        """
        Get all available sources.
        
        Returns:
            List of source information dictionaries
        """
        async with aiosqlite.connect(self.db_path) as conn:
            async with conn.execute("SELECT * FROM sources ORDER BY source_id") as cursor:
                rows = await cursor.fetchall()
                columns = [description[0] for description in cursor.description]
                return [dict(zip(columns, row)) for row in rows]
    
    def reset_database(self):
        """Reset the entire database (for testing/debugging)."""
        self.client.reset()
        
        # Recreate collections
        self.docs_collection = self._get_or_create_collection("crawled_pages")
        self.code_collection = self._get_or_create_collection("code_examples")
        
        # Reset SQLite
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("DELETE FROM sources")
            conn.commit()