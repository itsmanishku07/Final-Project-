"""
Firebase configuration and initialization
Handles Firebase Admin SDK setup for authentication and Firestore
"""

import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
import logging
import json

logger = logging.getLogger(__name__)

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        app_mode = os.getenv('APP_MODE', 'demo')
        use_firebase = os.getenv('USE_FIREBASE', 'false').lower() == 'true'
        
        if app_mode == 'demo' and not use_firebase:
            # Pure demo mode - skip Firebase initialization entirely
            logger.info("Running in pure demo mode - skipping Firebase initialization")
            return
            
        elif app_mode == 'production' or use_firebase:
            # Production mode - try to use actual service account file
            service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', 'firebase-service-account.json')
            
            if os.path.exists(service_account_path):
                try:
                    cred = credentials.Certificate(service_account_path)
                    firebase_admin.initialize_app(cred)
                    logger.info("Firebase initialized successfully in production mode")
                    return
                except Exception as e:
                    logger.error(f"Failed to initialize Firebase with service account: {e}")
                    logger.info("Falling back to demo mode due to invalid credentials")
            else:
                logger.error(f"Firebase service account file not found: {service_account_path}")
                logger.info("Falling back to demo mode")
            
            # If Firebase initialization fails, continue without it
            logger.warning("Firebase initialization failed - continuing with mock repositories")
                
        else:
            # Demo mode with Firebase emulator (if available)
            logger.info("Initializing Firebase in demo mode with emulator")
            
            # Create demo service account credentials
            demo_creds = {
                "type": "service_account",
                "project_id": os.getenv('FIREBASE_PROJECT_ID', 'demo-project'),
                "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID', 'demo-key-id'),
                "private_key": os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n'),
                "client_email": os.getenv('FIREBASE_CLIENT_EMAIL', 'demo@demo-project.iam.gserviceaccount.com'),
                "client_id": os.getenv('FIREBASE_CLIENT_ID', 'demo-client-id'),
                "auth_uri": os.getenv('FIREBASE_AUTH_URI', 'https://accounts.google.com/o/oauth2/auth'),
                "token_uri": os.getenv('FIREBASE_TOKEN_URI', 'https://oauth2.googleapis.com/token')
            }
            
            try:
                cred = credentials.Certificate(demo_creds)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized successfully in demo mode")
            except Exception as e:
                logger.warning(f"Firebase demo initialization failed: {e}")
                logger.info("Continuing without Firebase - using mock services")
                
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        logger.info("Continuing without Firebase - using mock services")

def get_firestore_client():
    """Get Firestore client"""
    try:
        # Check if Firebase is initialized
        if not firebase_admin._apps:
            logger.info("Firebase not initialized - returning None for Firestore client")
            return None
        return firestore.client()
    except Exception as e:
        logger.warning(f"Failed to get Firestore client: {e}")
        return None

def get_auth_client():
    """Get Firebase Auth client"""
    try:
        # Check if Firebase is initialized
        if not firebase_admin._apps:
            logger.info("Firebase not initialized - returning None for Auth client")
            return None
        return auth
    except Exception as e:
        logger.warning(f"Failed to get Auth client: {e}")
        return None