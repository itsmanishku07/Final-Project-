"""
Base repository class for Firestore operations
Provides common CRUD operations for all entities
"""

import logging
from typing import List, Optional, Dict, Any, Type, TypeVar
from config.firebase_config import get_firestore_client
from repositories.memory_store import get_collection

logger = logging.getLogger(__name__)

T = TypeVar('T')

class BaseRepository:
    """Base repository for Firestore operations"""
    
    def __init__(self, collection_name: str):
        self.collection_name = collection_name
        self.db = get_firestore_client()
        
        if self.db:
            logger.info(f"Using Firebase Admin SDK for {collection_name}")
        else:
            logger.info(f"Using in-memory storage for {collection_name}")
    
    @property
    def memory_data(self) -> Dict[str, Any]:
        """Get the shared memory store for this collection"""
        return get_collection(self.collection_name)
    
    def save(self, entity_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Save entity to Firestore or memory storage"""
        try:
            if self.db:
                # Use Admin SDK
                doc_ref = self.db.collection(self.collection_name).document(entity_id)
                doc_ref.set(data)
                logger.debug(f"Saved {self.collection_name}/{entity_id} via Admin SDK")
                return data
            else:
                # Use in-memory storage
                self.memory_data[entity_id] = data.copy()
                logger.debug(f"Saved {self.collection_name}/{entity_id} to memory")
                return data
            
        except Exception as e:
            logger.error(f"Failed to save {self.collection_name}/{entity_id}: {e}")
            # Fall back to memory storage
            self.memory_data[entity_id] = data.copy()
            return data
    
    def find_by_id(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Find entity by ID"""
        try:
            if self.db:
                # Use Admin SDK
                doc_ref = self.db.collection(self.collection_name).document(entity_id)
                doc = doc_ref.get()
                
                if doc.exists:
                    data = doc.to_dict()
                    data['id'] = doc.id
                    return data
                return None
            else:
                # Use in-memory storage
                data = self.memory_data.get(entity_id)
                if data:
                    result = data.copy()
                    result['id'] = entity_id
                    return result
                return None
            
        except Exception as e:
            logger.error(f"Failed to find {self.collection_name}/{entity_id}: {e}")
            # Check memory data as fallback
            data = self.memory_data.get(entity_id)
            if data:
                result = data.copy()
                result['id'] = entity_id
                return result
            return None
    
    def find_all(self, limit: Optional[int] = None, order_by: Optional[str] = None) -> List[Dict[str, Any]]:
        """Find all entities with optional limit and ordering"""
        try:
            if self.db:
                # Use Admin SDK
                query = self.db.collection(self.collection_name)
                
                if order_by:
                    query = query.order_by(order_by, direction='DESCENDING')
                
                if limit:
                    query = query.limit(limit)
                
                docs = query.stream()
                results = []
                
                for doc in docs:
                    data = doc.to_dict()
                    data['id'] = doc.id
                    results.append(data)
                
                return results
            else:
                # Use in-memory storage
                results = []
                for entity_id, data in self.memory_data.items():
                    result = data.copy()
                    result['id'] = entity_id
                    results.append(result)
                
                if order_by:
                    results.sort(key=lambda x: str(x.get(order_by, '')), reverse=True)
                if limit:
                    results = results[:limit]
                return results
            
        except Exception as e:
            logger.error(f"Failed to find all {self.collection_name}: {e}")
            # Return memory data as fallback
            results = []
            for entity_id, data in self.memory_data.items():
                result = data.copy()
                result['id'] = entity_id
                results.append(result)
            if order_by:
                results.sort(key=lambda x: str(x.get(order_by, '')), reverse=True)
            if limit:
                results = results[:limit]
            return results
    
    def find_by_field(self, field: str, value: Any, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Find entities by field value"""
        try:
            if self.db:
                # Use Admin SDK
                query = self.db.collection(self.collection_name).where(field, '==', value)
                
                if limit:
                    query = query.limit(limit)
                
                docs = query.stream()
                results = []
                
                for doc in docs:
                    data = doc.to_dict()
                    data['id'] = doc.id
                    results.append(data)
                
                return results
            else:
                # Use in-memory storage
                results = []
                for entity_id, data in self.memory_data.items():
                    if data.get(field) == value:
                        result = data.copy()
                        result['id'] = entity_id
                        results.append(result)
                
                if limit:
                    results = results[:limit]
                return results
            
        except Exception as e:
            logger.error(f"Failed to find {self.collection_name} by {field}={value}: {e}")
            # Return memory data as fallback
            results = []
            for entity_id, data in self.memory_data.items():
                if data.get(field) == value:
                    result = data.copy()
                    result['id'] = entity_id
                    results.append(result)
            if limit:
                results = results[:limit]
            return results
    
    def update(self, entity_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update entity"""
        try:
            if self.db:
                # Use Admin SDK
                doc_ref = self.db.collection(self.collection_name).document(entity_id)
                doc_ref.update(data)
                
                # Return updated document
                updated_doc = doc_ref.get()
                if updated_doc.exists:
                    result = updated_doc.to_dict()
                    result['id'] = updated_doc.id
                    return result
                
                raise ValueError(f"Entity {entity_id} not found after update")
            else:
                # Use in-memory storage
                if entity_id in self.memory_data:
                    self.memory_data[entity_id].update(data)
                    result = self.memory_data[entity_id].copy()
                    result['id'] = entity_id
                    return result
                else:
                    # Create if doesn't exist
                    self.memory_data[entity_id] = data.copy()
                    result = data.copy()
                    result['id'] = entity_id
                    return result
            
        except Exception as e:
            logger.error(f"Failed to update {self.collection_name}/{entity_id}: {e}")
            # Update memory data as fallback
            if entity_id in self.memory_data:
                self.memory_data[entity_id].update(data)
                result = self.memory_data[entity_id].copy()
                result['id'] = entity_id
                return result
            raise RuntimeError(f"Failed to update entity: {e}")
    
    def delete(self, entity_id: str) -> bool:
        """Delete entity by ID"""
        try:
            if self.db:
                # Use Admin SDK
                doc_ref = self.db.collection(self.collection_name).document(entity_id)
                doc_ref.delete()
                logger.debug(f"Deleted {self.collection_name}/{entity_id}")
                
                # Also remove from memory
                if entity_id in self.memory_data:
                    del self.memory_data[entity_id]
                return True
            else:
                # Use in-memory storage
                if entity_id in self.memory_data:
                    del self.memory_data[entity_id]
                    logger.debug(f"Deleted {self.collection_name}/{entity_id} from memory")
                    return True
                return False
            
        except Exception as e:
            logger.error(f"Failed to delete {self.collection_name}/{entity_id}: {e}")
            # Try to delete from memory
            if entity_id in self.memory_data:
                del self.memory_data[entity_id]
                return True
            return False
    
    def exists(self, entity_id: str) -> bool:
        """Check if entity exists"""
        try:
            if self.db:
                doc_ref = self.db.collection(self.collection_name).document(entity_id)
                doc = doc_ref.get()
                return doc.exists
            else:
                # Check memory
                return entity_id in self.memory_data
            
        except Exception as e:
            logger.error(f"Failed to check existence of {self.collection_name}/{entity_id}: {e}")
            return entity_id in self.memory_data
    
    def count(self) -> int:
        """Count total entities"""
        try:
            if self.db:
                # Note: Firestore doesn't have a direct count operation
                docs = self.db.collection(self.collection_name).stream()
                return len(list(docs))
            else:
                # Use memory storage
                return len(self.memory_data)
            
        except Exception as e:
            logger.error(f"Failed to count {self.collection_name}: {e}")
            return len(self.memory_data)