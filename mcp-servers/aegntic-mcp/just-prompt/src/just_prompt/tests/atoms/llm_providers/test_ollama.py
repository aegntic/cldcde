"""
Tests for Ollama provider.
"""

import pytest
import os
from dotenv import load_dotenv
from just_prompt.atoms.llm_providers import ollama

# Load environment variables
load_dotenv()


def test_list_models():
    """Test listing Ollama models."""
    models = ollama.list_models()
    assert isinstance(models, list)
    assert isinstance(models[0], str)
    assert len(models) > 0


def test_prompt():
    """Test sending prompt to Ollama."""
    # Using llama3 as default model - adjust if needed based on your environment

    response = ollama.prompt("What is the capital of France?", "gemma3:12b")

    # Assertions
    assert isinstance(response, str)
    assert len(response) > 0
    assert "paris" in response.lower() or "Paris" in response
