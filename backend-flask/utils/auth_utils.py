"""
Authentication utilities for Firebase token verification
Handles JWT token validation and user context
"""

import os
import time
import logging
from typing import Optional, Dict, Any
from flask import request
from firebase_admin import auth
from config.firebase_config import get_auth_client

logger = logging.getLogger(__name__)

def verify_firebase_token(id_token: str) -> Optional[Dict[str, Any]]:
    """Verify Firebase ID token"""
    try:
        auth_client = get_auth_client()
        
        if auth_client:
            # Real Firebase verification
            try:
                decoded_token = auth_client.verify_id_token(id_token)
                user_data = {
                    'uid': decoded_token['uid'],
                    'email': decoded_token.get('email', ''),
                    'role': decoded_token.get('role', 'CANDIDATE')
                }
                logger.debug(f"Token verified for user: {user_data['uid']}")
                return user_data
            except Exception as e:
                logger.error(f"Firebase token verification failed: {e}")
                return None
        else:
            # No Firebase Admin SDK - extract user info from JWT token
            logger.info("Firebase Admin not available, extracting user from JWT")
            try:
                # Firebase ID tokens are JWTs - decode without verification for user info
                import base64
                import json
                
                # Split the JWT token
                parts = id_token.split('.')
                if len(parts) != 3:
                    logger.error("Invalid JWT format")
                    return None
                
                # Decode the payload (second part)
                payload = parts[1]
                # Add padding if needed
                padding = 4 - len(payload) % 4
                if padding != 4:
                    payload += '=' * padding
                
                decoded_payload = base64.urlsafe_b64decode(payload)
                token_data = json.loads(decoded_payload)
                
                # Extract user info from Firebase JWT
                user_data = {
                    'uid': token_data.get('user_id') or token_data.get('sub', ''),
                    'email': token_data.get('email', ''),
                    'role': 'CANDIDATE'  # Default role
                }
                
                if user_data['uid']:
                    logger.info(f"Extracted user from JWT: {user_data['email']}")
                    return user_data
                else:
                    logger.error("No user_id in token")
                    return None
                    
            except Exception as e:
                logger.error(f"Failed to decode JWT token: {e}")
                return None
        
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        return None
        
        # Extract user information
        user_data = {
            'uid': decoded_token['uid'],
            'email': decoded_token.get('email', ''),
            'role': decoded_token.get('role', 'CANDIDATE')  # Default role
        }
        
        logger.debug(f"Token verified for user: {user_data['uid']}")
        return user_data
        
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        return None

def get_current_user() -> Optional[Dict[str, Any]]:
    """Get current user from request headers"""
    try:
        # Get Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        
        # Extract token from "Bearer <token>" format
        if not auth_header.startswith('Bearer '):
            return None
        
        id_token = auth_header.split('Bearer ')[1]
        return verify_firebase_token(id_token)
        
    except Exception as e:
        logger.error(f"Failed to get current user: {e}")
        return None

def require_role(required_role: str):
    """Decorator to require specific role"""
    def decorator(f):
        def decorated_function(*args, **kwargs):
            user_data = get_current_user()
            if not user_data:
                return {'success': False, 'message': 'Authentication required'}, 401
            
            user_role = user_data.get('role', '')
            if user_role != required_role and user_role != 'ADMIN':
                return {'success': False, 'message': 'Insufficient permissions'}, 403
            
            return f(user_data, *args, **kwargs)
        return decorated_function
    return decorator