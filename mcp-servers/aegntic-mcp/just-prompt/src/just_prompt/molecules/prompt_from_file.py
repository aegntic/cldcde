"""
Prompt from file functionality for just-prompt.
"""

from typing import List
import logging
import os
from pathlib import Path
from .prompt import prompt

logger = logging.getLogger(__name__)


def prompt_from_file(file: str, models_prefixed_by_provider: List[str] = None) -> List[str]:
    """
    Read text from a file and send it as a prompt to multiple models.
    
    Args:
        file: Path to the text file
        models_prefixed_by_provider: List of model strings in format "provider:model"
                                    If None, uses the DEFAULT_MODELS environment variable
        
    Returns:
        List of responses from the models
    """
    file_path = Path(file)
    
    # Validate file
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file}")
    
    if not file_path.is_file():
        raise ValueError(f"Not a file: {file}")
    
    # Read file content
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
    except Exception as e:
        logger.error(f"Error reading file {file}: {e}")
        raise ValueError(f"Error reading file: {str(e)}")
    
    # Send prompt with file content
    return prompt(text, models_prefixed_by_provider)