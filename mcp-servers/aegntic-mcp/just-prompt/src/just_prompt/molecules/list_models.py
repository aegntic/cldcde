"""
List models functionality for just-prompt.
"""

from typing import List
import logging
from ..atoms.shared.validator import validate_provider
from ..atoms.shared.model_router import ModelRouter

logger = logging.getLogger(__name__)


def list_models(provider: str) -> List[str]:
    """
    List available models for a provider.
    
    Args:
        provider: Provider name (full or short)
        
    Returns:
        List of model names
    """
    # Validate provider
    validate_provider(provider)
    
    # Get models from provider
    return ModelRouter.route_list_models(provider)