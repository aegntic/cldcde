"""
List providers functionality for just-prompt.
"""

from typing import List, Dict
import logging
from ..atoms.shared.data_types import ModelProviders

logger = logging.getLogger(__name__)


def list_providers() -> List[Dict[str, str]]:
    """
    List all available providers with their full and short names.
    
    Returns:
        List of dictionaries with provider information
    """
    providers = []
    for provider in ModelProviders:
        providers.append({
            "name": provider.name,
            "full_name": provider.full_name,
            "short_name": provider.short_name
        })
    
    return providers