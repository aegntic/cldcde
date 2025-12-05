"""
Tests for prompt functionality.
"""

import pytest
import os
from dotenv import load_dotenv
from just_prompt.molecules.prompt import prompt

# Load environment variables
load_dotenv()

def test_prompt_basic():
    """Test basic prompt functionality with a real API call."""
    # Define a simple test case
    test_prompt = "What is the capital of France?"
    test_models = ["openai:gpt-4o-mini"]

    # Call the prompt function with a real model
    response = prompt(test_prompt, test_models)

    # Assertions
    assert isinstance(response, list)
    assert len(response) == 1
    assert "paris" in response[0].lower() or "Paris" in response[0]

def test_prompt_multiple_models():
    """Test prompt with multiple models."""
    # Skip if API keys aren't available
    if not os.environ.get("OPENAI_API_KEY") or not os.environ.get("ANTHROPIC_API_KEY"):
        pytest.skip("Required API keys not available")
        
    # Define a simple test case
    test_prompt = "What is the capital of France?"
    test_models = ["openai:gpt-4o-mini", "anthropic:claude-3-5-haiku-20241022"]

    # Call the prompt function with multiple models
    response = prompt(test_prompt, test_models)

    # Assertions
    assert isinstance(response, list)
    assert len(response) == 2
    # Check all responses contain Paris
    for r in response:
        assert "paris" in r.lower() or "Paris" in r
