"""
Tests for OpenAI provider.
"""

import pytest
import os
from dotenv import load_dotenv
from just_prompt.atoms.llm_providers import openai

# Load environment variables
load_dotenv()

# Skip tests if API key not available
if not os.environ.get("OPENAI_API_KEY"):
    pytest.skip("OpenAI API key not available", allow_module_level=True)


def test_list_models():
    """Test listing OpenAI models."""
    models = openai.list_models()
    
    # Assertions
    assert isinstance(models, list)
    assert len(models) > 0
    assert all(isinstance(model, str) for model in models)
    
    # Check for at least one expected model
    gpt_models = [model for model in models if "gpt" in model.lower()]
    assert len(gpt_models) > 0, "No GPT models found"


def test_prompt():
    """Test sending prompt to OpenAI with a regular model."""
    response = openai.prompt("What is the capital of France?", "gpt-4o-mini")

    # Assertions
    assert isinstance(response, str)
    assert len(response) > 0
    assert "paris" in response.lower() or "Paris" in response


def test_parse_reasoning_suffix():
    """Test parsing reasoning effort suffix from model names."""

    # No suffix
    assert openai.parse_reasoning_suffix("o4-mini") == ("o4-mini", "")
    assert openai.parse_reasoning_suffix("o3") == ("o3", "")

    # Supported suffixes
    assert openai.parse_reasoning_suffix("o4-mini:low") == ("o4-mini", "low")
    assert openai.parse_reasoning_suffix("o4-mini:medium") == ("o4-mini", "medium")
    assert openai.parse_reasoning_suffix("o4-mini:high") == ("o4-mini", "high")
    assert openai.parse_reasoning_suffix("o3-mini:LOW") == ("o3-mini", "low")  # case insensitive

    # Unsupported model – suffix ignored
    assert openai.parse_reasoning_suffix("gpt-4o-mini:low") == ("gpt-4o-mini:low", "")


@pytest.mark.parametrize("model_suffix", ["o4-mini:low", "o4-mini:medium", "o4-mini:high"])
def test_prompt_with_reasoning(model_suffix):
    """Test sending prompt with reasoning effort enabled."""

    response = openai.prompt("What is the capital of Spain?", model_suffix)

    # Assertions
    assert isinstance(response, str)
    assert len(response) > 0
    assert "madrid" in response.lower() or "Madrid" in response