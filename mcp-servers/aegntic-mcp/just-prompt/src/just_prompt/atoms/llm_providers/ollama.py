"""
Ollama provider implementation.
"""

import os
from typing import List
import logging
import ollama
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)


def prompt(text: str, model: str) -> str:
    """
    Send a prompt to Ollama and get a response.

    Args:
        text: The prompt text
        model: The model name

    Returns:
        Response string from the model
    """
    try:
        logger.info(f"Sending prompt to Ollama model: {model}")

        # Create chat completion
        response = ollama.chat(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": text,
                },
            ],
        )

        # Extract response content
        return response.message.content
    except Exception as e:
        logger.error(f"Error sending prompt to Ollama: {e}")
        raise ValueError(f"Failed to get response from Ollama: {str(e)}")


def list_models() -> List[str]:
    """
    List available Ollama models.

    Returns:
        List of model names
    """
    logger.info("Listing Ollama models")
    response = ollama.list()

    # Extract model names from the models attribute
    models = [model.model for model in response.models]

    return models
