"""
Context manager for documentation and library context retrieval.
Integrates Context7-like functionality with caching and optimization.
"""
import os
import json
import httpx
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import aiosqlite
from pathlib import Path

class ContextManager:
    """
    Context manager for documentation and library context retrieval.
    """
    
    def __init__(self, db_path: str = None):
        """
        Initialize context manager.
        
        Args:
            db_path: Path to SQLite database file
        """
        if db_path is None:
            persist_dir = os.getenv("VECTOR_DB_DIR", str(Path.home() / ".aegntic_knowledge"))
            Path(persist_dir).mkdir(parents=True, exist_ok=True)
            db_path = str(Path(persist_dir) / "knowledge_graph.db")
        
        self.db_path = db_path
        self.base_url = "https://api.context7.ai"
        self.client = httpx.AsyncClient(timeout=30.0)
        
        # Common library mappings for quick resolution
        self.library_mappings = {
            "react": "/reactjs/react.dev",
            "fastapi": "/tiangolo/fastapi", 
            "next": "/vercel/next.js",
            "nextjs": "/vercel/next.js",
            "vue": "/vuejs/core",
            "angular": "/angular/angular",
            "express": "/expressjs/express",
            "django": "/django/django",
            "flask": "/pallets/flask",
            "pytorch": "/pytorch/pytorch",
            "tensorflow": "/tensorflow/tensorflow",
            "pandas": "/pandas-dev/pandas",
            "numpy": "/numpy/numpy",
            "scikit-learn": "/scikit-learn/scikit-learn"
        }
    
    async def resolve_library_id(self, library_name: str) -> Dict[str, Any]:
        """
        Resolve a library name to Context7-compatible library ID.
        
        Args:
            library_name: Library name to search for
            
        Returns:
            Dictionary with library information and resolved ID
        """
        library_lower = library_name.lower()
        
        # Check local mappings first
        if library_lower in self.library_mappings:
            library_id = self.library_mappings[library_lower]
            
            # Try to get cached info
            cached_info = await self._get_cached_context(library_id)
            if cached_info:
                return {
                    "library_id": library_id,
                    "name": library_name,
                    "description": f"Cached documentation for {library_name}",
                    "source": "cache",
                    "cached_at": cached_info.get("cached_at"),
                    "snippet_count": cached_info.get("snippet_count", 0),
                    "trust_score": cached_info.get("trust_score", 8.0)
                }
            
            return {
                "library_id": library_id,
                "name": library_name,
                "description": f"Mapped library ID for {library_name}",
                "source": "mapping",
                "snippet_count": 0,
                "trust_score": 8.0
            }
        
        # Try Context7 API search (if available)
        try:
            search_url = f"{self.base_url}/search"
            response = await self.client.get(search_url, params={"q": library_name})
            
            if response.status_code == 200:
                results = response.json()
                if results and len(results) > 0:
                    best_match = results[0]
                    return {
                        "library_id": best_match.get("id", f"/{library_name}"),
                        "name": best_match.get("name", library_name),
                        "description": best_match.get("description", ""),
                        "source": "context7_api",
                        "snippet_count": best_match.get("snippets", 0),
                        "trust_score": best_match.get("trust_score", 5.0)
                    }
        except Exception as e:
            print(f"Context7 API search failed: {e}")
        
        # Fallback: create a synthetic library ID
        synthetic_id = f"/{library_name.lower()}"
        return {
            "library_id": synthetic_id,
            "name": library_name,
            "description": f"Synthetic library ID for {library_name}",
            "source": "synthetic",
            "snippet_count": 0,
            "trust_score": 3.0
        }
    
    async def get_library_docs(self, library_id: str, 
                             tokens: int = 10000,
                             topic: Optional[str] = None) -> Dict[str, Any]:
        """
        Get documentation for a library.
        
        Args:
            library_id: Context7-compatible library ID
            tokens: Maximum tokens of documentation to retrieve
            topic: Optional topic to focus on
            
        Returns:
            Documentation content and metadata
        """
        # Check cache first
        cached_content = await self._get_cached_context(library_id)
        if cached_content and not self._is_cache_expired(cached_content):
            return {
                "library_id": library_id,
                "content": cached_content["content"],
                "tokens_used": min(len(cached_content["content"]), tokens),
                "source": "cache",
                "cached_at": cached_content["cached_at"],
                "topic": topic
            }
        
        # Try Context7 API
        try:
            docs_url = f"{self.base_url}/docs{library_id}"
            params = {"tokens": tokens}
            if topic:
                params["topic"] = topic
                
            response = await self.client.get(docs_url, params=params)
            
            if response.status_code == 200:
                content = response.text
                
                # Cache the content
                await self._cache_context(library_id, content, 
                                        snippet_count=len(content.split('\n')),
                                        trust_score=8.0)
                
                return {
                    "library_id": library_id,
                    "content": content,
                    "tokens_used": len(content),
                    "source": "context7_api",
                    "retrieved_at": datetime.now().isoformat(),
                    "topic": topic
                }
        except Exception as e:
            print(f"Context7 API docs failed: {e}")
        
        # Fallback: return cached content even if expired, or generate synthetic docs
        if cached_content:
            return {
                "library_id": library_id,
                "content": cached_content["content"],
                "tokens_used": min(len(cached_content["content"]), tokens),
                "source": "expired_cache",
                "cached_at": cached_content["cached_at"],
                "topic": topic
            }
        
        # Generate synthetic documentation stub
        synthetic_content = f"""
# {library_id} Documentation

This is a placeholder for {library_id} documentation.

## Overview
{library_id} is a library that requires documentation to be crawled or provided.

## Usage
Please crawl the official documentation for this library to populate real content.

## Topics
{f'Focus area: {topic}' if topic else 'No specific topic provided'}

## Next Steps
1. Use the crawl4ai functionality to fetch real documentation
2. Store the documentation in the vector database
3. Query for specific information about this library
"""
        
        # Cache the synthetic content briefly
        await self._cache_context(library_id, synthetic_content,
                                snippet_count=1, trust_score=1.0,
                                expire_hours=1)
        
        return {
            "library_id": library_id,
            "content": synthetic_content,
            "tokens_used": len(synthetic_content),
            "source": "synthetic",
            "generated_at": datetime.now().isoformat(),
            "topic": topic
        }
    
    async def _get_cached_context(self, library_id: str) -> Optional[Dict[str, Any]]:
        """Get cached context for a library."""
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.execute("""
                SELECT content, snippet_count, trust_score, cached_at, expires_at
                FROM context_cache 
                WHERE library_id = ?
            """, (library_id,))
            
            row = await cursor.fetchone()
            if row:
                return {
                    "content": row[0],
                    "snippet_count": row[1],
                    "trust_score": row[2],
                    "cached_at": row[3],
                    "expires_at": row[4]
                }
        
        return None
    
    async def _cache_context(self, library_id: str, content: str,
                           snippet_count: int = 0, trust_score: float = 5.0,
                           expire_hours: int = 24):
        """Cache context for a library."""
        expires_at = datetime.now() + timedelta(hours=expire_hours)
        
        async with aiosqlite.connect(self.db_path) as conn:
            await conn.execute("""
                INSERT OR REPLACE INTO context_cache 
                (library_id, content, snippet_count, trust_score, cached_at, expires_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
            """, (library_id, content, snippet_count, trust_score, expires_at.isoformat()))
            
            await conn.commit()
    
    def _is_cache_expired(self, cached_content: Dict[str, Any]) -> bool:
        """Check if cached content is expired."""
        expires_at_str = cached_content.get("expires_at")
        if not expires_at_str:
            return True
        
        try:
            expires_at = datetime.fromisoformat(expires_at_str)
            return datetime.now() > expires_at
        except (ValueError, TypeError):
            return True
    
    async def clear_expired_cache(self) -> int:
        """Clear expired cache entries."""
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.execute("""
                DELETE FROM context_cache 
                WHERE expires_at < CURRENT_TIMESTAMP
            """)
            await conn.commit()
            return cursor.rowcount
    
    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        async with aiosqlite.connect(self.db_path) as conn:
            # Total cached libraries
            cursor = await conn.execute("SELECT COUNT(*) FROM context_cache")
            total_cached = (await cursor.fetchone())[0]
            
            # Expired entries
            cursor = await conn.execute("""
                SELECT COUNT(*) FROM context_cache 
                WHERE expires_at < CURRENT_TIMESTAMP
            """)
            expired_count = (await cursor.fetchone())[0]
            
            # Cache size
            cursor = await conn.execute("""
                SELECT SUM(LENGTH(content)) FROM context_cache
            """)
            total_size = (await cursor.fetchone())[0] or 0
        
        return {
            "total_cached": total_cached,
            "expired_count": expired_count,
            "active_count": total_cached - expired_count,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / 1024 / 1024, 2)
        }
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()