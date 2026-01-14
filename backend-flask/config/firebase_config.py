"""
Firebase configuration and initialization
Handles Firebase Admin SDK setup for authentication and Firestore
"""

import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
import json
import logging

logger = logging.getLogger(__name__)

# Global flag to track initialization status
_firebase_initialized = False
_firebase_error = None

def initialize_firebase():
    """Initialize Firebase Admin SDK from JSON file"""
    global _firebase_initialized, _firebase_error
    
    try:
        # Delete any existing apps to force fresh initialization
        if firebase_admin._apps:
            for app_name in list(firebase_admin._apps.keys()):
                firebase_admin.delete_app(firebase_admin.get_app(app_name))
            logger.info("Deleted existing Firebase apps for fresh initialization")
        
        # Load from JSON file (not embedded credentials)
        json_path = os.path.join(os.path.dirname(__file__), '..', 'firebase-service-account.json')
        
        if os.path.exists(json_path):
            logger.info(f"Loading Firebase credentials from: {json_path}")
            
            # Read and validate the JSON file
            with open(json_path, 'r') as f:
                cred_data = json.load(f)
            
            # Log key info (not the actual key)
            logger.info(f"Project ID: {cred_data.get('project_id')}")
            logger.info(f"Client Email: {cred_data.get('client_email')}")
            logger.info(f"Private Key ID: {cred_data.get('private_key_id')}")
            logger.info(f"Client ID: {cred_data.get('client_id')}")
            
            # Validate required fields
            required_fields = ['type', 'project_id', 'private_key', 'client_email']
            for field in required_fields:
                if field not in cred_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Create credentials from the loaded data
            cred = credentials.Certificate(cred_data)
            firebase_admin.initialize_app(cred)
            
            _firebase_initialized = True
            _firebase_error = None
            logger.info("Firebase initialized successfully from JSON file")
        else:
            _firebase_error = "firebase-service-account.json not found"
            logger.error(f"Firebase service account file not found: {json_path}")
            raise FileNotFoundError(_firebase_error)
                
    except Exception as e:
        _firebase_initialized = False
        _firebase_error = str(e)
        logger.error(f"Failed to initialize Firebase: {e}")
        raise

def get_firestore_client():
    """Get Firestore client"""
    global _firebase_error
    try:
        if not firebase_admin._apps:
            if _firebase_error:
                logger.warning(f"Firebase not available: {_firebase_error}")
            return None
        return firestore.client()
    except Exception as e:
        logger.warning(f"Failed to get Firestore client: {e}")
        return None

def get_auth_client():
    """Get Firebase Auth client"""
    global _firebase_error
    try:
        if not firebase_admin._apps:
            if _firebase_error:
                logger.warning(f"Firebase not available: {_firebase_error}")
            return None
        return auth
    except Exception as e:
        logger.warning(f"Failed to get Auth client: {e}")
        return None

def is_firebase_available():
    """Check if Firebase is properly initialized"""
    return _firebase_initialized and bool(firebase_admin._apps)
