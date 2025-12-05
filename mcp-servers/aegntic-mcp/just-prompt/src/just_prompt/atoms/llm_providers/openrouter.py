"""
OpenRouter provider for just-prompt.
"""

import os
import json
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Global cache for models
_cached_models = None
_cache_timestamp = None
_cache_duration = timedelta(hours=72)  # Cache for 72 hours

def _should_refresh_cache() -> bool:
    """Check if model cache should be refreshed."""
    global _cached_models, _cache_timestamp
    if _cached_models is None or _cache_timestamp is None:
        return True
    return datetime.now() - _cache_timestamp > _cache_duration

def _fetch_models() -> List[Dict[str, Any]]:
    """Fetch all models from OpenRouter API."""
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        return []
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'HTTP-Referer': 'https://claude.ai',
        'X-Title': 'just-prompt MCP'
    }
    
    try:
        response = requests.get('https://openrouter.ai/api/v1/models', headers=headers, timeout=10)
        response.raise_for_status()
        return response.json().get('data', [])
    except Exception as e:
        logger.error(f"Error fetching OpenRouter models: {e}")
        return []

def _filter_free_models(models: List[Dict[str, Any]]) -> List[str]:
    """Filter models to only free ones, prioritized by capability."""
    free_models = []
    
    for model in models:
        pricing = model.get('pricing', {})
        prompt_price = float(pricing.get('prompt', '999'))
        completion_price = float(pricing.get('completion', '999'))
        
        # Check if model is free (price = 0)
        if prompt_price == 0 and completion_price == 0:
            free_models.append(model)
    
    # Sort by capability and recency
    def model_score(model):
        context_length = model.get('context_length', 0)
        model_id = model.get('id', '').lower()
        
        # Prioritize certain model families
        family_bonus = 0
        if 'gpt-4' in model_id or 'o1' in model_id:
            family_bonus = 1000000
        elif 'claude' in model_id:
            family_bonus = 900000
        elif 'gemini' in model_id and ('pro' in model_id or '2.0' in model_id):
            family_bonus = 800000
        elif 'llama' in model_id and ('70b' in model_id or '405b' in model_id):
            family_bonus = 700000
        elif 'qwen' in model_id and ('72b' in model_id or '2.5' in model_id):
            family_bonus = 600000
        elif 'mistral' in model_id:
            family_bonus = 500000
        
        return context_length + family_bonus
    
    free_models.sort(key=model_score, reverse=True)
    return [model.get('id', '') for model in free_models if model.get('id')]

def list_models() -> List[str]:
    """List all available OpenRouter models."""
    global _cached_models, _cache_timestamp
    
    if _should_refresh_cache():
        logger.info("Refreshing OpenRouter model cache...")
        models = _fetch_models()
        if models:
            _cached_models = [model.get('id', '') for model in models if model.get('id')]
            _cache_timestamp = datetime.now()
            logger.info(f"Found {len(_cached_models)} OpenRouter models")
        else:
            logger.warning("Failed to fetch models, using cached data")
    
    if not _cached_models:
        # Fallback to known models
        return [
            "google/gemini-2.0-flash-exp",
            "meta-llama/llama-3.3-70b-instruct", 
            "qwen/qwen-2.5-72b-instruct"
        ]
    
    return _cached_models

def get_best_free_models(limit: int = 3) -> List[str]:
    """Get the best free models available."""
    global _cached_models, _cache_timestamp
    
    if _should_refresh_cache():
        logger.info("Refreshing OpenRouter model cache...")
        models = _fetch_models()
        if models:
            free_models = _filter_free_models(models)
            _cached_models = free_models
            _cache_timestamp = datetime.now()
            logger.info(f"Found {len(free_models)} free OpenRouter models")
        else:
            logger.warning("Failed to fetch models, using cached data")
    
    if not _cached_models:
        # Fallback to known good free models
        logger.info("Using fallback models")
        return [
            "google/gemini-2.0-flash-exp",
            "meta-llama/llama-3.3-70b-instruct", 
            "qwen/qwen-2.5-72b-instruct"
        ]
    
    return _cached_models[:limit]

def prompt(text: str, model: str) -> str:
    """Send a prompt to OpenRouter model."""
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable not set")
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'HTTP-Referer': 'https://claude.ai',
        'X-Title': 'just-prompt MCP',
        'Content-Type': 'application/json'
    }
    
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": text}]
    }
    
    try:
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        
        result = response.json()
        return result['choices'][0]['message']['content']
        
    except Exception as e:
        logger.error(f"Error generating response with OpenRouter model {model}: {e}")
        raise

def get_auto_updated_default_models() -> str:
    """Get automatically updated default models from OpenRouter."""
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        logger.warning("No OPENROUTER_API_KEY found, using fallback models")
        return "openrouter:google/gemini-2.0-flash-exp,openrouter:meta-llama/llama-3.3-70b-instruct,openrouter:qwen/qwen-2.5-72b-instruct"
    
    try:
        best_models = get_best_free_models(3)
        
        # Format for just-prompt (add openrouter: prefix)
        formatted_models = [f"openrouter:{model}" for model in best_models]
        models_str = ",".join(formatted_models)
        
        logger.info(f"Auto-updated default models: {models_str}")
        return models_str
        
    except Exception as e:
        logger.error(f"Error getting auto-updated models: {e}")
        # Fallback to known good models
        return "openrouter:google/gemini-2.0-flash-exp,openrouter:meta-llama/llama-3.3-70b-instruct,openrouter:qwen/qwen-2.5-72b-instruct"