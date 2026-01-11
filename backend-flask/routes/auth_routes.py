"""
Authentication routes for user registration and profile management
Handles Firebase authentication integration
"""

from flask import Blueprint, request, jsonify
import logging
from functools import wraps
from repositories.user_repository import UserRepository
from models.user import User, UserRole
from utils.auth_utils import verify_firebase_token, get_current_user

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)
user_repository = UserRepository()

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            user_data = get_current_user()
            if not user_data:
                return jsonify({'success': False, 'message': 'Authentication required'}), 401
            return f(user_data, *args, **kwargs)
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return jsonify({'success': False, 'message': 'Invalid authentication'}), 401
    return decorated_function

@auth_bp.route('/register', methods=['POST'])
@require_auth
def register_user(current_user):
    """Register new user after Firebase authentication"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'Request body required'}), 400
        
        # Validate required fields
        required_fields = ['name', 'email', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        # Validate role
        try:
            role = UserRole(data['role'])
        except ValueError:
            return jsonify({'success': False, 'message': 'Invalid role'}), 400
        
        # Check if user already exists
        existing_user = user_repository.find_by_uid(current_user['uid'])
        if existing_user:
            return jsonify({'success': False, 'message': 'User already exists'}), 400
        
        # Check if email is already registered
        existing_email_user = user_repository.find_by_email(data['email'])
        if existing_email_user:
            return jsonify({'success': False, 'message': 'Email already registered'}), 400
        
        # Create new user
        user = User(
            uid=current_user['uid'],
            name=data['name'],
            email=data['email'],
            role=role
        )
        
        saved_user = user_repository.save_user(user)
        
        response = {
            'success': True,
            'message': 'User registered successfully',
            'user': {
                'uid': saved_user.uid,
                'name': saved_user.name,
                'email': saved_user.email,
                'role': saved_user.role.value
            }
        }
        
        return jsonify(response), 201
        
    except Exception as e:
        logger.error(f"User registration failed: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@auth_bp.route('/auto-register', methods=['POST'])
@require_auth  
def auto_register_user(current_user):
    """Auto-register user with default settings"""
    try:
        # Check if user already exists
        existing_user = user_repository.find_by_uid(current_user['uid'])
        if existing_user:
            return jsonify({
                'success': True,
                'message': 'User already exists',
                'user': {
                    'uid': existing_user.uid,
                    'name': existing_user.name,
                    'email': existing_user.email,
                    'role': existing_user.role.value
                }
            })
        
        # Extract info from current_user
        email = current_user.get('email', f"user-{current_user['uid'][:8]}@example.com")
        name = email.split('@')[0].replace('.', ' ').title()
        
        # Create new user with default role
        user = User(
            uid=current_user['uid'],
            name=name,
            email=email,
            role=UserRole.CANDIDATE  # Default role
        )
        
        saved_user = user_repository.save_user(user)
        
        response = {
            'success': True,
            'message': 'User auto-registered successfully',
            'user': {
                'uid': saved_user.uid,
                'name': saved_user.name,
                'email': saved_user.email,
                'role': saved_user.role.value
            }
        }
        
        return jsonify(response), 201
        
    except Exception as e:
        logger.error(f"Auto-registration failed: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
@require_auth
def get_current_profile(current_user):
    """Get current user profile - auto-create if doesn't exist"""
    try:
        user = user_repository.find_by_uid(current_user['uid'])
        
        if not user:
            # Auto-create user if they don't exist (for Firebase auth users)
            logger.info(f"Auto-creating user profile for {current_user['uid']}")
            
            # Extract name from email if not provided
            email = current_user.get('email', f"user-{current_user['uid'][:8]}@example.com")
            name = email.split('@')[0].replace('.', ' ').title()
            
            # Create new user with default role
            user = User(
                uid=current_user['uid'],
                name=name,
                email=email,
                role=UserRole.CANDIDATE  # Default role
            )
            
            user = user_repository.save_user(user)
            logger.info(f"Auto-created user: {email}")
        
        if not user.active:
            return jsonify({'success': False, 'message': 'User account is deactivated'}), 403
        
        response = {
            'success': True,
            'user': {
                'uid': user.uid,
                'name': user.name,
                'email': user.email,
                'role': user.role.value,
                'active': user.active,
                'created_at': user.created_at.isoformat(),
                'updated_at': user.updated_at.isoformat()
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Failed to get user profile: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@auth_bp.route('/profile', methods=['PUT'])
@require_auth
def update_profile(current_user):
    """Update user profile"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'Request body required'}), 400
        
        user = user_repository.find_by_uid(current_user['uid'])
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Update allowed fields
        if 'name' in data:
            user.update_profile(name=data['name'])
        
        updated_user = user_repository.update_user(user)
        
        response = {
            'success': True,
            'message': 'Profile updated successfully',
            'user': {
                'uid': updated_user.uid,
                'name': updated_user.name,
                'email': updated_user.email,
                'role': updated_user.role.value
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Failed to update user profile: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@auth_bp.route('/validate', methods=['GET'])
@require_auth
def validate_token(current_user):
    """Validate authentication token"""
    try:
        response = {
            'valid': True,
            'uid': current_user['uid'],
            'email': current_user.get('email', ''),
            'role': current_user.get('role', '')
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Token validation failed: {e}")
        return jsonify({'valid': False, 'message': 'Invalid token'}), 401