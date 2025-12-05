"""
Tests for Groq provider.
"""

import pytest
import os
from dotenv import load_dotenv
from just_prompt.atoms.llm_providers import groq

# Load environment variables
load_dotenv()

# Skip tests if API key not available
if not os.environ.get("GROQ_API_KEY"):
    pytest.skip("Groq API key not available", allow_module_level=True)


def test_list_models():
    """Test listing Groq models."""
    models = groq.list_models()
    assert isinstance(models, list)
    assert len(models) > 0
    assert all(isinstance(model, str) for model in models)


def test_prompt():
    """Test sending prompt to Groq."""
    response = groq.prompt("What is the capital of France?", "qwen-qwq-32b")
    assert isinstance(response, str)
    assert len(response) > 0
    assert "paris" in response.lower() or "Paris" in response
