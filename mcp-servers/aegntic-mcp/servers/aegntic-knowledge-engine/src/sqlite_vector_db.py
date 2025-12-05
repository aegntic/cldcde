"""
Pure SQLite vector database with zero external dependencies.
Implements vector similarity search using cosine similarity in pure Python.
"""
import os
import sqlite3
import json
import uuid
import math
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import aiosqlite
import asyncio
from datetime import datetime

class SQLiteVectorDB:
    """
    Pure SQLite vector database with local cosine similarity search.
    Zero external dependencies, completely free.
    """
    
    def __init__(self, db_path: str = None):
        """
        Initialize SQLite vector database.
        
        Args:
            db_path: Path to SQLite database file
        """
        if db_path is None:
            persist_dir = os.getenv("VECTOR_DB_DIR", str(Path.home() / ".aegntic_knowledge"))
            Path(persist_dir).mkdir(parents=True, exist_ok=True)
            db_path = str(Path(persist_dir) / "vector_database.db")
        
        self.db_path = db_path
        self._init_database()
    
    def _init_database(self):
        """Initialize the SQLite database with required tables."""
        with sqlite3.connect(self.db_path) as conn:
            # Enable JSON1 extension if available
            try:
                conn.execute("SELECT json('{}')").fetchone()
            except sqlite3.OperationalError:
                print("Warning: SQLite JSON1 extension not available")
            
            # Documents table for vector storage
            conn.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    url TEXT NOT NULL,
                    chunk_number INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    embedding TEXT NOT NULL,  -- JSON array of floats
                    metadata TEXT NOT NULL DEFAULT '{}',  -- JSON metadata
                    source_id TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(url, chunk_number)
                )
            """)
            
            # Code examples table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS code_examples (
                    id TEXT PRIMARY KEY,
                    url TEXT NOT NULL,
                    chunk_number INTEGER NOT NULL,
                    content TEXT NOT NULL,  -- The code example content
                    summary TEXT NOT NULL,  -- Summary of the code example
                    embedding TEXT NOT NULL,  -- JSON array of floats
                    metadata TEXT NOT NULL DEFAULT '{}',  -- JSON metadata
                    source_id TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(url, chunk_number)
                )
            """)
            
            # Sources table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sources (
                    source_id TEXT PRIMARY KEY,
                    summary TEXT,
                    total_word_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create indexes for better performance
            conn.executescript("""
                CREATE INDEX IF NOT EXISTS idx_documents_source ON documents(source_id);
                CREATE INDEX IF NOT EXISTS idx_documents_url ON documents(url);
                CREATE INDEX IF NOT EXISTS idx_code_examples_source ON code_examples(source_id);
                CREATE INDEX IF NOT EXISTS idx_code_examples_url ON code_examples(url);
            """)
            
            conn.commit()
    
    def _cosine_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors.
        
        Args:
            embedding1: First vector
            embedding2: Second vector
            
        Returns:
            Cosine similarity score (0-1)
        """
        if len(embedding1) != len(embedding2):
            return 0.0
        
        # Calculate dot product
        dot_product = sum(a * b for a, b in zip(embedding1, embedding2))
        
        # Calculate magnitudes
        magnitude1 = math.sqrt(sum(a * a for a in embedding1))
        magnitude2 = math.sqrt(sum(a * a for a in embedding2))
        
        # Avoid division by zero
        if magnitude1 == 0.0 or magnitude2 == 0.0:
            return 0.0
        
        # Calculate cosine similarity
        similarity = dot_product / (magnitude1 * magnitude2)
        
        # Ensure result is between 0 and 1
        return max(0.0, min(1.0, (similarity + 1.0) / 2.0))
    
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
        async with aiosqlite.connect(self.db_path) as conn:
            for i in range(0, len(contents), batch_size):
                batch_end = min(i + batch_size, len(contents))
                
                for j in range(i, batch_end):
                    doc_id = f"{urls[j]}#chunk_{chunk_numbers[j]}"
                    embedding_json = json.dumps(embeddings[j])
                    metadata_json = json.dumps(metadatas[j])
                    source_id = metadatas[j].get("source", "unknown")
                    
                    await conn.execute("""
                        INSERT OR REPLACE INTO documents 
                        (id, url, chunk_number, content, embedding, metadata, source_id)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (doc_id, urls[j], chunk_numbers[j], contents[j], 
                         embedding_json, metadata_json, source_id))
                
                await conn.commit()
    
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
        async with aiosqlite.connect(self.db_path) as conn:
            for i in range(0, len(code_examples), batch_size):
                batch_end = min(i + batch_size, len(code_examples))
                
                for j in range(i, batch_end):
                    code_id = f"{urls[j]}#code_{chunk_numbers[j]}"
                    embedding_json = json.dumps(embeddings[j])
                    metadata_json = json.dumps(metadatas[j])
                    source_id = metadatas[j].get("source", "unknown")
                    
                    await conn.execute("""
                        INSERT OR REPLACE INTO code_examples 
                        (id, url, chunk_number, content, summary, embedding, metadata, source_id)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (code_id, urls[j], chunk_numbers[j], code_examples[j],
                         summaries[j], embedding_json, metadata_json, source_id))
                
                await conn.commit()
    
    def search_documents(self, query_embedding: List[float], match_count: int = 10,
                        filter_metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Search for similar documents using cosine similarity.
        
        Args:
            query_embedding: Query embedding vector
            match_count: Number of results to return
            filter_metadata: Optional metadata filter
            
        Returns:
            List of matching documents with metadata and similarity scores
        """
        with sqlite3.connect(self.db_path) as conn:
            # Build query with optional filtering
            query = """
                SELECT id, url, chunk_number, content, embedding, metadata, source_id
                FROM documents
            """
            params = []
            
            if filter_metadata and "source" in filter_metadata:
                query += " WHERE source_id = ?"
                params.append(filter_metadata["source"])
            
            cursor = conn.execute(query, params)
            
            # Calculate similarities
            results_with_similarity = []
            for row in cursor:
                doc_id, url, chunk_number, content, embedding_json, metadata_json, source_id = row
                
                try:
                    stored_embedding = json.loads(embedding_json)
                    similarity = self._cosine_similarity(query_embedding, stored_embedding)
                    metadata = json.loads(metadata_json)
                    
                    results_with_similarity.append({
                        "id": doc_id,
                        "url": url,
                        "chunk_number": chunk_number,
                        "content": content,
                        "metadata": metadata,
                        "source_id": source_id,
                        "similarity": similarity
                    })
                except (json.JSONDecodeError, TypeError):
                    # Skip invalid embeddings
                    continue
            
            # Sort by similarity and return top results
            results_with_similarity.sort(key=lambda x: x["similarity"], reverse=True)
            return results_with_similarity[:match_count]
    
    def search_code_examples(self, query_embedding: List[float], match_count: int = 10,
                           filter_metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Search for similar code examples using cosine similarity.
        
        Args:
            query_embedding: Query embedding vector
            match_count: Number of results to return
            filter_metadata: Optional metadata filter
            
        Returns:
            List of matching code examples with metadata and similarity scores
        """
        with sqlite3.connect(self.db_path) as conn:
            # Build query with optional filtering
            query = """
                SELECT id, url, chunk_number, content, summary, embedding, metadata, source_id
                FROM code_examples
            """
            params = []
            
            if filter_metadata and "source" in filter_metadata:
                query += " WHERE source_id = ?"
                params.append(filter_metadata["source"])
            
            cursor = conn.execute(query, params)
            
            # Calculate similarities
            results_with_similarity = []
            for row in cursor:
                code_id, url, chunk_number, content, summary, embedding_json, metadata_json, source_id = row
                
                try:
                    stored_embedding = json.loads(embedding_json)
                    similarity = self._cosine_similarity(query_embedding, stored_embedding)
                    metadata = json.loads(metadata_json)
                    
                    results_with_similarity.append({
                        "id": code_id,
                        "url": url,
                        "chunk_number": chunk_number,
                        "content": content,
                        "summary": summary,
                        "metadata": metadata,
                        "source_id": source_id,
                        "similarity": similarity
                    })
                except (json.JSONDecodeError, TypeError):
                    # Skip invalid embeddings
                    continue
            
            # Sort by similarity and return top results
            results_with_similarity.sort(key=lambda x: x["similarity"], reverse=True)
            return results_with_similarity[:match_count]
    
    async def update_source_info(self, source_id: str, summary: str, word_count: int):
        """
        Update source information.
        
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
                columns = [description[0] for description in cursor.description]
                sources = []
                async for row in cursor:
                    source_dict = dict(zip(columns, row))
                    sources.append(source_dict)
                return sources
    
    def get_database_stats(self) -> Dict[str, Any]:
        """Get database statistics."""
        with sqlite3.connect(self.db_path) as conn:
            # Count documents
            doc_count = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
            
            # Count code examples
            code_count = conn.execute("SELECT COUNT(*) FROM code_examples").fetchone()[0]
            
            # Count sources
            source_count = conn.execute("SELECT COUNT(*) FROM sources").fetchone()[0]
            
            # Database size
            db_size = Path(self.db_path).stat().st_size if Path(self.db_path).exists() else 0
            
            return {
                "document_count": doc_count,
                "code_example_count": code_count,
                "source_count": source_count,
                "database_size_bytes": db_size,
                "database_size_mb": round(db_size / 1024 / 1024, 2),
                "database_path": self.db_path
            }
    
    def reset_database(self):
        """Reset the entire database (for testing/debugging)."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("DELETE FROM documents")
            conn.execute("DELETE FROM code_examples") 
            conn.execute("DELETE FROM sources")
            conn.commit()