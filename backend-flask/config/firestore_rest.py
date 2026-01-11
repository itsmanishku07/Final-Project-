"""
Firestore REST API client
Uses Firebase ID tokens to authenticate with Firestore REST API
This allows Firestore access without Admin SDK service account
"""

import os
import logging
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class FirestoreRestClient:
    """Firestore REST API client using user ID tokens"""
    
    def __init__(self):
        self.project_id = os.getenv('FIREBASE_PROJECT_ID', 'resume-project-5aa61')
        self.base_url = f"https://firestore.googleapis.com/v1/projects/{self.project_id}/databases/(default)/documents"
    
    def _get_headers(self, id_token: str = None) -> Dict[str, str]:
        """Get request headers with optional auth token"""
        headers = {
            'Content-Type': 'application/json'
        }
        if id_token:
            headers['Authorization'] = f'Bearer {id_token}'
        return headers
    
    def _convert_to_firestore_value(self, value: Any) -> Dict[str, Any]:
        """Convert Python value to Firestore value format"""
        if value is None:
            return {'nullValue': None}
        elif isinstance(value, bool):
            return {'booleanValue': value}
        elif isinstance(value, int):
            return {'integerValue': str(value)}
        elif isinstance(value, float):
            return {'doubleValue': value}
        elif isinstance(value, str):
            return {'stringValue': value}
        elif isinstance(value, datetime):
            # Format datetime as ISO string with Z suffix
            return {'timestampValue': value.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'}
        elif isinstance(value, list):
            return {'arrayValue': {'values': [self._convert_to_firestore_value(v) for v in value]}}
        elif isinstance(value, dict):
            return {'mapValue': {'fields': {k: self._convert_to_firestore_value(v) for k, v in value.items()}}}
        else:
            return {'stringValue': str(value)}
    
    def _convert_from_firestore_value(self, value: Dict[str, Any]) -> Any:
        """Convert Firestore value format to Python value"""
        if 'nullValue' in value:
            return None
        elif 'booleanValue' in value:
            return value['booleanValue']
        elif 'integerValue' in value:
            return int(value['integerValue'])
        elif 'doubleValue' in value:
            return value['doubleValue']
        elif 'stringValue' in value:
            return value['stringValue']
        elif 'timestampValue' in value:
            ts = value['timestampValue']
            if ts.endswith('Z'):
                ts = ts[:-1]
            try:
                return datetime.fromisoformat(ts)
            except:
                return ts
        elif 'arrayValue' in value:
            values = value['arrayValue'].get('values', [])
            return [self._convert_from_firestore_value(v) for v in values]
        elif 'mapValue' in value:
            fields = value['mapValue'].get('fields', {})
            return {k: self._convert_from_firestore_value(v) for k, v in fields.items()}
        else:
            return None
    
    def _document_to_dict(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        """Convert Firestore document to Python dict"""
        if not doc or 'fields' not in doc:
            return {}
        
        result = {}
        for key, value in doc.get('fields', {}).items():
            result[key] = self._convert_from_firestore_value(value)
        
        # Extract document ID from name
        if 'name' in doc:
            parts = doc['name'].split('/')
            result['id'] = parts[-1]
        
        return result
    
    def _dict_to_document(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert Python dict to Firestore document format"""
        fields = {}
        for key, value in data.items():
            if key != 'id':  # Skip id field
                fields[key] = self._convert_to_firestore_value(value)
        return {'fields': fields}
    
    def create_document(self, collection: str, doc_id: str, data: Dict[str, Any], id_token: str = None) -> Dict[str, Any]:
        """Create a document in Firestore"""
        try:
            url = f"{self.base_url}/{collection}?documentId={doc_id}"
            doc = self._dict_to_document(data)
            
            response = requests.post(url, json=doc, headers=self._get_headers(id_token))
            
            if response.status_code in [200, 201]:
                return self._document_to_dict(response.json())
            else:
                logger.error(f"Failed to create document: {response.status_code} - {response.text}")
                raise Exception(f"Failed to create document: {response.text}")
                
        except Exception as e:
            logger.error(f"Error creating document {collection}/{doc_id}: {e}")
            raise
    
    def get_document(self, collection: str, doc_id: str, id_token: str = None) -> Optional[Dict[str, Any]]:
        """Get a document from Firestore"""
        try:
            url = f"{self.base_url}/{collection}/{doc_id}"
            
            response = requests.get(url, headers=self._get_headers(id_token))
            
            if response.status_code == 200:
                return self._document_to_dict(response.json())
            elif response.status_code == 404:
                return None
            else:
                logger.error(f"Failed to get document: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting document {collection}/{doc_id}: {e}")
            return None
    
    def update_document(self, collection: str, doc_id: str, data: Dict[str, Any], id_token: str = None) -> Dict[str, Any]:
        """Update a document in Firestore"""
        try:
            url = f"{self.base_url}/{collection}/{doc_id}"
            doc = self._dict_to_document(data)
            
            # Build update mask
            update_mask = ','.join([f"updateMask.fieldPaths={k}" for k in data.keys() if k != 'id'])
            if update_mask:
                url = f"{url}?{update_mask}"
            
            response = requests.patch(url, json=doc, headers=self._get_headers(id_token))
            
            if response.status_code == 200:
                return self._document_to_dict(response.json())
            else:
                logger.error(f"Failed to update document: {response.status_code} - {response.text}")
                raise Exception(f"Failed to update document: {response.text}")
                
        except Exception as e:
            logger.error(f"Error updating document {collection}/{doc_id}: {e}")
            raise
    
    def delete_document(self, collection: str, doc_id: str, id_token: str = None) -> bool:
        """Delete a document from Firestore"""
        try:
            url = f"{self.base_url}/{collection}/{doc_id}"
            
            response = requests.delete(url, headers=self._get_headers(id_token))
            
            return response.status_code in [200, 204]
                
        except Exception as e:
            logger.error(f"Error deleting document {collection}/{doc_id}: {e}")
            return False
    
    def list_documents(self, collection: str, id_token: str = None, page_size: int = 100) -> List[Dict[str, Any]]:
        """List all documents in a collection"""
        try:
            url = f"{self.base_url}/{collection}?pageSize={page_size}"
            
            response = requests.get(url, headers=self._get_headers(id_token))
            
            if response.status_code == 200:
                data = response.json()
                documents = data.get('documents', [])
                return [self._document_to_dict(doc) for doc in documents]
            else:
                logger.error(f"Failed to list documents: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            logger.error(f"Error listing documents in {collection}: {e}")
            return []
    
    def query_documents(self, collection: str, field: str, value: Any, id_token: str = None) -> List[Dict[str, Any]]:
        """Query documents by field value"""
        try:
            # Use structured query
            url = f"https://firestore.googleapis.com/v1/projects/{self.project_id}/databases/(default)/documents:runQuery"
            
            query = {
                "structuredQuery": {
                    "from": [{"collectionId": collection}],
                    "where": {
                        "fieldFilter": {
                            "field": {"fieldPath": field},
                            "op": "EQUAL",
                            "value": self._convert_to_firestore_value(value)
                        }
                    }
                }
            }
            
            response = requests.post(url, json=query, headers=self._get_headers(id_token))
            
            if response.status_code == 200:
                results = response.json()
                documents = []
                for result in results:
                    if 'document' in result:
                        documents.append(self._document_to_dict(result['document']))
                return documents
            else:
                logger.error(f"Failed to query documents: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            logger.error(f"Error querying documents in {collection}: {e}")
            return []


# Global instance
_firestore_client = None

def get_firestore_rest_client() -> FirestoreRestClient:
    """Get Firestore REST client instance"""
    global _firestore_client
    if _firestore_client is None:
        _firestore_client = FirestoreRestClient()
    return _firestore_client
