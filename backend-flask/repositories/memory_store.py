"""
Shared in-memory data store
Provides persistent storage during application runtime
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Global shared storage for all repositories
_memory_store: Dict[str, Dict[str, Any]] = {
    'users': {},
    'jobs': {},
    'resumes': {},
    'matches': {}
}

def get_collection(collection_name: str) -> Dict[str, Any]:
    """Get a collection from the memory store"""
    if collection_name not in _memory_store:
        _memory_store[collection_name] = {}
    return _memory_store[collection_name]

def clear_collection(collection_name: str):
    """Clear a collection"""
    if collection_name in _memory_store:
        _memory_store[collection_name] = {}

def clear_all():
    """Clear all collections"""
    for key in _memory_store:
        _memory_store[key] = {}

def get_all_data() -> Dict[str, Dict[str, Any]]:
    """Get all data (for debugging)"""
    return _memory_store
