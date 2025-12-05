"""
Groq provider implementation.
"""

import os
from typing import List
import logging
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def prompt(text: str, model: str) -> str:
    """
    Send a prompt to Groq and get a response.
    
    Args:
        text: The prompt text
        model: The model name
        
    Returns:
        Response string from the model
    """
    try:
        logger.info(f"Sending prompt to Groq model: {model}")
        
        # Create chat completion
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": text}],
            model=model,
        )
        
        # Extract response content
        return chat_completion.choices[0].message.content
    except Exception as e:
        logger.error(f"Error sending prompt to Groq: {e}")
        raise ValueError(f"Failed to get response from Groq: {str(e)}")


def list_models() -> List[str]:
    """
    List available Groq models.
    
    Returns:
        List of model names
    """
    try:
        logger.info("Listing Groq models")
        response = client.models.list()
        
        # Extract model IDs
        models = [model.id for model in response.data]
        
        return models
    except Exception as e:
        logger.error(f"Error listing Groq models: {e}")
        # Return some known models if API fails
        logger.info("Returning hardcoded list of known Groq models")
        return [
            "llama-3.3-70b-versatile",
            "llama-3.1-70b-versatile",
            "llama-3.1-8b-versatile",
            "mixtral-8x7b-32768",
            "gemma-7b-it",
            "qwen-2.5-32b"
        ]