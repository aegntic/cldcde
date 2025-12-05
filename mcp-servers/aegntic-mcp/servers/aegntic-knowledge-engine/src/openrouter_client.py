"""
OpenRouter client for free premium models.
Replaces OpenAI API with OpenRouter's free tier offerings.
"""
import os
import json
import httpx
import asyncio
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class OpenRouterConfig:
    """Configuration for OpenRouter client."""
    api_key: str = ""
    base_url: str = "https://openrouter.ai/api/v1"
    embedding_model: str = "text-embedding-3-small"
    chat_model: str = "microsoft/phi-3.5-mini-instruct:free"
    max_retries: int = 3
    timeout: int = 30

class OpenRouterClient:
    """
    Client for OpenRouter API with free premium models.
    """
    
    def __init__(self, config: Optional[OpenRouterConfig] = None):
        """
        Initialize OpenRouter client.
        
        Args:
            config: OpenRouter configuration
        """
        if config is None:
            config = OpenRouterConfig()
            
        self.config = config
        self.api_key = config.api_key or os.getenv("OPENROUTER_API_KEY", "")
        
        # If no OpenRouter key, use free models without auth
        self.headers = {
            "Content-Type": "application/json",
        }
        
        if self.api_key:
            self.headers["Authorization"] = f"Bearer {self.api_key}"
        
        # HTTP client with async support
        self.client = httpx.AsyncClient(
            base_url=config.base_url,
            headers=self.headers,
            timeout=config.timeout
        )
    
    async def create_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Create embeddings using free models.
        Falls back to sentence-transformers if OpenRouter fails.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        # Try OpenRouter first
        try:
            return await self._create_openrouter_embeddings(texts)
        except Exception as e:
            print(f"OpenRouter embeddings failed: {e}")
            print("Falling back to local sentence-transformers...")
            return await self._create_local_embeddings(texts)
    
    async def _create_openrouter_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Create embeddings using OpenRouter API.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        # OpenRouter embeddings endpoint
        payload = {
            "input": texts,
            "model": self.config.embedding_model
        }
        
        response = await self.client.post("/embeddings", json=payload)
        response.raise_for_status()
        
        result = response.json()
        return [item["embedding"] for item in result["data"]]
    
    async def _create_local_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Create embeddings using local sentence-transformers.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        from sentence_transformers import SentenceTransformer
        
        # Use a lightweight model for fast local embeddings
        model = SentenceTransformer('all-MiniLM-L6-v2')
        embeddings = model.encode(texts, convert_to_tensor=False)
        
        # Convert to list format
        return [embedding.tolist() for embedding in embeddings]
    
    async def generate_summary(self, text: str, context: str = "") -> str:
        """
        Generate summary using free chat models.
        
        Args:
            text: Text to summarize
            context: Additional context
            
        Returns:
            Generated summary
        """
        try:
            return await self._generate_openrouter_summary(text, context)
        except Exception as e:
            print(f"OpenRouter summary failed: {e}")
            return await self._generate_local_summary(text, context)
    
    async def _generate_openrouter_summary(self, text: str, context: str = "") -> str:
        """
        Generate summary using OpenRouter free models.
        
        Args:
            text: Text to summarize
            context: Additional context
            
        Returns:
            Generated summary
        """
        prompt = f"""Summarize the following content concisely:

Context: {context}

Content:
{text}

Summary:"""
        
        payload = {
            "model": self.config.chat_model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 150,
            "temperature": 0.3
        }
        
        response = await self.client.post("/chat/completions", json=payload)
        response.raise_for_status()
        
        result = response.json()
        return result["choices"][0]["message"]["content"].strip()
    
    async def _generate_local_summary(self, text: str, context: str = "") -> str:
        """
        Generate a simple extractive summary locally.
        
        Args:
            text: Text to summarize
            context: Additional context
            
        Returns:
            Generated summary
        """
        # Simple extractive summarization
        sentences = text.split('. ')
        if len(sentences) <= 3:
            return text
        
        # Take first and most relevant sentences
        summary_sentences = sentences[:2]
        if len(sentences) > 5:
            summary_sentences.append(sentences[-1])
        
        return '. '.join(summary_sentences) + '.'
    
    async def generate_contextual_chunk(self, full_document: str, chunk: str) -> str:
        """
        Generate contextual information for a chunk.
        
        Args:
            full_document: Full document text
            chunk: Specific chunk to contextualize
            
        Returns:
            Contextual information
        """
        try:
            return await self._generate_openrouter_contextual_chunk(full_document, chunk)
        except Exception as e:
            print(f"OpenRouter contextual chunk failed: {e}")
            return await self._generate_local_contextual_chunk(full_document, chunk)
    
    async def _generate_openrouter_contextual_chunk(self, full_document: str, chunk: str) -> str:
        """
        Generate contextual chunk using OpenRouter.
        
        Args:
            full_document: Full document text
            chunk: Specific chunk to contextualize
            
        Returns:
            Contextual information
        """
        prompt = f"""Given the full document context, provide additional context for this specific chunk:

Full Document (first 1000 chars):
{full_document[:1000]}

Specific Chunk:
{chunk}

Additional Context:"""
        
        payload = {
            "model": self.config.chat_model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 100,
            "temperature": 0.2
        }
        
        response = await self.client.post("/chat/completions", json=payload)
        response.raise_for_status()
        
        result = response.json()
        return result["choices"][0]["message"]["content"].strip()
    
    async def _generate_local_contextual_chunk(self, full_document: str, chunk: str) -> str:
        """
        Generate simple contextual information locally.
        
        Args:
            full_document: Full document text
            chunk: Specific chunk to contextualize
            
        Returns:
            Contextual information
        """
        # Extract surrounding context
        chunk_pos = full_document.find(chunk)
        if chunk_pos == -1:
            return chunk
        
        # Get context before and after
        start = max(0, chunk_pos - 200)
        end = min(len(full_document), chunk_pos + len(chunk) + 200)
        context = full_document[start:end]
        
        return f"Context: {context}"
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()

# Global client instance
_global_client: Optional[OpenRouterClient] = None

def get_openrouter_client() -> OpenRouterClient:
    """Get or create a global OpenRouter client."""
    global _global_client
    if _global_client is None:
        _global_client = OpenRouterClient()
    return _global_client

async def create_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """
    Create embeddings for multiple texts.
    
    Args:
        texts: List of texts to create embeddings for
        
    Returns:
        List of embeddings (each embedding is a list of floats)
    """
    client = get_openrouter_client()
    return await client.create_embeddings(texts)

def generate_code_example_summary(code: str, context_before: str = "", context_after: str = "") -> str:
    """
    Generate a summary for a code example (synchronous wrapper).
    
    Args:
        code: Code content
        context_before: Context before the code
        context_after: Context after the code
        
    Returns:
        Generated summary
    """
    async def _generate():
        client = get_openrouter_client()
        context = f"Before: {context_before}\nAfter: {context_after}"
        return await client.generate_summary(code, context)
    
    # Run in event loop
    try:
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(_generate())
    except RuntimeError:
        # No event loop running, create one
        return asyncio.run(_generate())

def extract_source_summary(source_id: str, content: str) -> str:
    """
    Extract a summary for a source (synchronous wrapper).
    
    Args:
        source_id: Source identifier
        content: Source content
        
    Returns:
        Generated summary
    """
    async def _generate():
        client = get_openrouter_client()
        return await client.generate_summary(content, f"Source: {source_id}")
    
    # Run in event loop
    try:
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(_generate())
    except RuntimeError:
        # No event loop running, create one
        return asyncio.run(_generate())