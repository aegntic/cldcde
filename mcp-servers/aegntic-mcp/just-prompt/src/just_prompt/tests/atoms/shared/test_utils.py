"""
Tests for utility functions.
"""

import pytest
from just_prompt.atoms.shared.utils import split_provider_and_model, get_provider_from_prefix


def test_split_provider_and_model():
    """Test splitting provider and model from string."""
    # Test basic splitting
    provider, model = split_provider_and_model("openai:gpt-4")
    assert provider == "openai"
    assert model == "gpt-4"
    
    # Test short provider name
    provider, model = split_provider_and_model("o:gpt-4")
    assert provider == "o"
    assert model == "gpt-4"
    
    # Test model with colons
    provider, model = split_provider_and_model("ollama:llama3:latest")
    assert provider == "ollama"
    assert model == "llama3:latest"
    
    # Test invalid format
    with pytest.raises(ValueError):
        split_provider_and_model("invalid-model-string")


def test_get_provider_from_prefix():
    """Test getting provider from prefix."""
    # Test full names
    assert get_provider_from_prefix("openai") == "openai"
    assert get_provider_from_prefix("anthropic") == "anthropic"
    assert get_provider_from_prefix("gemini") == "gemini"
    assert get_provider_from_prefix("groq") == "groq"
    assert get_provider_from_prefix("deepseek") == "deepseek"
    assert get_provider_from_prefix("ollama") == "ollama"
    
    # Test short names
    assert get_provider_from_prefix("o") == "openai"
    assert get_provider_from_prefix("a") == "anthropic"
    assert get_provider_from_prefix("g") == "gemini"
    assert get_provider_from_prefix("q") == "groq"
    assert get_provider_from_prefix("d") == "deepseek"
    assert get_provider_from_prefix("l") == "ollama"
    
    # Test invalid prefix
    with pytest.raises(ValueError):
        get_provider_from_prefix("unknown")