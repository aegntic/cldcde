"""
Tests for list_models functionality for all providers.
"""

import pytest
import os
from dotenv import load_dotenv
from just_prompt.molecules.list_models import list_models

# Load environment variables
load_dotenv()

def test_list_models_openai():
    """Test listing OpenAI models with real API call."""
    # Skip if API key isn't available
    if not os.environ.get("OPENAI_API_KEY"):
        pytest.skip("OpenAI API key not available")
        
    # Test with full provider name
    models = list_models("openai")
    
    # Assertions
    assert isinstance(models, list)
    assert len(models) > 0
    
    # Check for specific model patterns that should exist
    assert any("gpt" in model.lower() for model in models)
    
def test_list_models_anthropic():
    """Test listing Anthropic models with real API call."""
    # Skip if API key isn't available
    if not os.environ.get("ANTHROPIC_API_KEY"):
        pytest.skip("Anthropic API key not available")
        
    # Test with full provider name
    models = list_models("anthropic")
    
    # Assertions
    assert isinstance(models, list)
    assert len(models) > 0
    
    # Check for specific model patterns that should exist
    assert any("claude" in model.lower() for model in models)

def test_list_models_gemini():
    """Test listing Gemini models with real API call."""
    # Skip if API key isn't available
    if not os.environ.get("GEMINI_API_KEY"):
        pytest.skip("Gemini API key not available")
        
    # Test with full provider name
    models = list_models("gemini")
    
    # Assertions
    assert isinstance(models, list)
    assert len(models) > 0
    
    # Check for specific model patterns that should exist
    assert any("gemini" in model.lower() for model in models)

def test_list_models_groq():
    """Test listing Groq models with real API call."""
    # Skip if API key isn't available
    if not os.environ.get("GROQ_API_KEY"):
        pytest.skip("Groq API key not available")
        
    # Test with full provider name
    models = list_models("groq")
    
    # Assertions
    assert isinstance(models, list)
    assert len(models) > 0
    
    # Check for specific model patterns (llama or mixtral are common in Groq)
    assert any(("llama" in model.lower() or "mixtral" in model.lower()) for model in models)

def test_list_models_deepseek():
    """Test listing DeepSeek models with real API call."""
    # Skip if API key isn't available
    if not os.environ.get("DEEPSEEK_API_KEY"):
        pytest.skip("DeepSeek API key not available")
        
    # Test with full provider name
    models = list_models("deepseek")
    
    # Assertions
    assert isinstance(models, list)
    assert len(models) > 0
    
    # Check for basic list return (no specific pattern needed)
    assert all(isinstance(model, str) for model in models)

def test_list_models_ollama():
    """Test listing Ollama models with real API call."""
    # Test with full provider name
    models = list_models("ollama")
    
    # Assertions
    assert isinstance(models, list)
    assert len(models) > 0
    
    # Check for basic list return (model entries could be anything)
    assert all(isinstance(model, str) for model in models)

def test_list_models_with_short_names():
    """Test listing models using short provider names."""
    # Test each provider with short name (only if API key available)
    
    # OpenAI - short name "o"
    if os.environ.get("OPENAI_API_KEY"):
        models = list_models("o")
        assert isinstance(models, list)
        assert len(models) > 0
        assert any("gpt" in model.lower() for model in models)
    
    # Anthropic - short name "a"
    if os.environ.get("ANTHROPIC_API_KEY"):
        models = list_models("a")
        assert isinstance(models, list)
        assert len(models) > 0
        assert any("claude" in model.lower() for model in models)
    
    # Gemini - short name "g"
    if os.environ.get("GEMINI_API_KEY"):
        models = list_models("g")
        assert isinstance(models, list)
        assert len(models) > 0
        assert any("gemini" in model.lower() for model in models)
    
    # Groq - short name "q"
    if os.environ.get("GROQ_API_KEY"):
        models = list_models("q")
        assert isinstance(models, list)
        assert len(models) > 0
    
    # DeepSeek - short name "d"
    if os.environ.get("DEEPSEEK_API_KEY"):
        models = list_models("d")
        assert isinstance(models, list)
        assert len(models) > 0
    
    # Ollama - short name "l"
    models = list_models("l")
    assert isinstance(models, list)
    assert len(models) > 0

def test_list_models_invalid_provider():
    """Test with invalid provider name."""
    # Test invalid provider
    with pytest.raises(ValueError):
        list_models("unknown_provider")