"""
Tests for DeepSeek provider.
"""

import pytest
import os
from dotenv import load_dotenv
from just_prompt.atoms.llm_providers import deepseek

# Load environment variables
load_dotenv()

# Skip tests if API key not available
if not os.environ.get("DEEPSEEK_API_KEY"):
    pytest.skip("DeepSeek API key not available", allow_module_level=True)


def test_list_models():
    """Test listing DeepSeek models."""
    models = deepseek.list_models()
    assert isinstance(models, list)
    assert len(models) > 0
    assert all(isinstance(model, str) for model in models)


def test_prompt():
    """Test sending prompt to DeepSeek."""
    response = deepseek.prompt("What is the capital of France?", "deepseek-coder")
    assert isinstance(response, str)
    assert len(response) > 0
    assert "paris" in response.lower() or "Paris" in response