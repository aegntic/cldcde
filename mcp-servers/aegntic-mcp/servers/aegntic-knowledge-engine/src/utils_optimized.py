"""
Optimized utility functions for the Crawl4AI MCP server.
Uses ChromaDB instead of Supabase and OpenRouter instead of OpenAI.
"""
import os
import concurrent.futures
from typing import List, Dict, Any, Optional, Tuple
import json
from urllib.parse import urlparse
import re
import time

from sqlite_vector_db import SQLiteVectorDB
from openrouter_client import create_embeddings_batch, generate_code_example_summary, extract_source_summary

# Global vector database instance
_global_vector_db: Optional[SQLiteVectorDB] = None

def get_vector_db() -> SQLiteVectorDB:
    """
    Get or create a global vector database instance.
    
    Returns:
        SQLiteVectorDB instance
    """
    global _global_vector_db
    if _global_vector_db is None:
        db_path = os.getenv("VECTOR_DB_PATH", None)
        _global_vector_db = SQLiteVectorDB(db_path=db_path)
    return _global_vector_db

async def add_documents_to_vector_db(urls: List[str], chunk_numbers: List[int], 
                                   contents: List[str], metadatas: List[Dict[str, Any]], 
                                   url_to_full_document: Dict[str, str], 
                                   batch_size: int = 20):
    """
    Add documents to ChromaDB with embeddings.
    
    Args:
        urls: List of URLs
        chunk_numbers: List of chunk numbers  
        contents: List of content strings
        metadatas: List of metadata dictionaries
        url_to_full_document: Mapping of URLs to full documents
        batch_size: Batch size for processing
    """
    if not contents:
        return
    
    # Create embeddings for all content
    print(f"Creating embeddings for {len(contents)} documents...")
    
    # Process contextual embeddings if enabled
    use_contextual_embeddings = os.getenv("USE_CONTEXTUAL_EMBEDDINGS", "false") == "true"
    
    if use_contextual_embeddings:
        from openrouter_client import get_openrouter_client
        client = get_openrouter_client()
        
        enhanced_contents = []
        for i, content in enumerate(contents):
            url = urls[i]
            full_doc = url_to_full_document.get(url, content)
            
            try:
                contextual_info = await client.generate_contextual_chunk(full_doc, content)
                enhanced_content = f"{content}\n\nContext: {contextual_info}"
                enhanced_contents.append(enhanced_content)
            except Exception as e:
                print(f"Failed to generate contextual embedding for chunk {i}: {e}")
                enhanced_contents.append(content)
        
        embeddings = await create_embeddings_batch(enhanced_contents)
    else:
        embeddings = await create_embeddings_batch(contents)
    
    # Add to vector database
    vector_db = get_vector_db()
    await vector_db.add_documents(urls, chunk_numbers, contents, metadatas, embeddings, batch_size)
    
    print(f"Added {len(contents)} documents to vector database")

async def add_code_examples_to_vector_db(urls: List[str], chunk_numbers: List[int],
                                       code_examples: List[str], summaries: List[str],
                                       metadatas: List[Dict[str, Any]], batch_size: int = 20):
    """
    Add code examples to ChromaDB with embeddings.
    
    Args:
        urls: List of URLs
        chunk_numbers: List of chunk numbers
        code_examples: List of code example strings
        summaries: List of code summaries
        metadatas: List of metadata dictionaries
        batch_size: Batch size for processing
    """
    if not code_examples:
        return
    
    # Create embeddings for code + summary combinations
    print(f"Creating embeddings for {len(code_examples)} code examples...")
    
    combined_texts = [f"Code: {code}\n\nSummary: {summary}" 
                     for code, summary in zip(code_examples, summaries)]
    
    embeddings = await create_embeddings_batch(combined_texts)
    
    # Add to vector database
    vector_db = get_vector_db()
    await vector_db.add_code_examples(urls, chunk_numbers, code_examples, summaries, 
                                    metadatas, embeddings, batch_size)
    
    print(f"Added {len(code_examples)} code examples to vector database")

def search_documents(query: str, match_count: int = 10, 
                    filter_metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Search for documents using semantic similarity.
    
    Args:
        query: Search query
        match_count: Number of results to return
        filter_metadata: Optional metadata filter
        
    Returns:
        List of matching documents
    """
    # Create query embedding
    import asyncio
    query_embedding = asyncio.run(create_embeddings_batch([query]))[0]
    
    # Search in vector database
    vector_db = get_vector_db()
    return vector_db.search_documents(query_embedding, match_count, filter_metadata)

def search_code_examples(query: str, match_count: int = 10,
                        filter_metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Search for code examples using semantic similarity.
    
    Args:
        query: Search query
        match_count: Number of results to return
        filter_metadata: Optional metadata filter
        
    Returns:
        List of matching code examples
    """
    # Create query embedding
    import asyncio
    query_embedding = asyncio.run(create_embeddings_batch([query]))[0]
    
    # Search in vector database
    vector_db = get_vector_db()
    return vector_db.search_code_examples(query_embedding, match_count, filter_metadata)

async def update_source_info(source_id: str, summary: str, word_count: int):
    """
    Update source information in the database.
    
    Args:
        source_id: Source identifier
        summary: Source summary
        word_count: Total word count
    """
    vector_db = get_vector_db()
    await vector_db.update_source_info(source_id, summary, word_count)

async def get_available_sources() -> List[Dict[str, Any]]:
    """
    Get all available sources from the database.
    
    Returns:
        List of source information dictionaries
    """
    vector_db = get_vector_db()
    return await vector_db.get_available_sources()

def extract_code_blocks(markdown_content: str) -> List[Dict[str, str]]:
    """
    Extract code blocks from markdown content.
    
    Args:
        markdown_content: Markdown content to parse
        
    Returns:
        List of code block dictionaries with code, context_before, and context_after
    """
    code_blocks = []
    
    # Pattern to match code blocks with optional language specifier
    code_pattern = r'```(?:\w+)?\n(.*?)\n```'
    
    # Find all code blocks
    for match in re.finditer(code_pattern, markdown_content, re.DOTALL):
        code = match.group(1).strip()
        
        # Only include substantial code blocks (more than 300 characters as per original)
        if len(code) >= 300:
            start_pos = match.start()
            end_pos = match.end()
            
            # Get context before (500 characters)
            context_before = markdown_content[max(0, start_pos - 500):start_pos].strip()
            
            # Get context after (500 characters)  
            context_after = markdown_content[end_pos:end_pos + 500].strip()
            
            code_blocks.append({
                'code': code,
                'context_before': context_before,
                'context_after': context_after
            })
    
    return code_blocks

# Backward compatibility aliases for the main MCP server
def get_supabase_client():
    """Backward compatibility - returns vector database instead."""
    return get_vector_db()

def add_documents_to_supabase(*args, **kwargs):
    """Backward compatibility wrapper."""
    import asyncio
    return asyncio.run(add_documents_to_vector_db(*args, **kwargs))

def add_code_examples_to_supabase(*args, **kwargs):
    """Backward compatibility wrapper."""
    import asyncio
    return asyncio.run(add_code_examples_to_vector_db(*args, **kwargs))