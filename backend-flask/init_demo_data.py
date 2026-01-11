"""
Initialize demo data for mock authentication
Creates demo users in the repository for testing
"""

import logging
from repositories.user_repository import UserRepository
from models.user import User, UserRole

logger = logging.getLogger(__name__)

def initialize_demo_users():
    """Initialize demo users for mock authentication"""
    try:
        user_repository = UserRepository()
        
        # Demo users that match the frontend mock authentication
        demo_users = [
            {
                'uid': 'admin-123',
                'name': 'Admin User',
                'email': 'admin@example.com',
                'role': UserRole.ADMIN
            },
            {
                'uid': 'recruiter-123',
                'name': 'Recruiter User',
                'email': 'recruiter@example.com',
                'role': UserRole.RECRUITER
            },
            {
                'uid': 'candidate-123',
                'name': 'Candidate User',
                'email': 'candidate@example.com',
                'role': UserRole.CANDIDATE
            }
        ]
        
        for user_data in demo_users:
            # Check if user already exists
            existing_user = user_repository.find_by_uid(user_data['uid'])
            if not existing_user:
                # Create new demo user
                user = User(
                    uid=user_data['uid'],
                    name=user_data['name'],
                    email=user_data['email'],
                    role=user_data['role']
                )
                user_repository.save_user(user)
                logger.info(f"Created demo user: {user_data['email']} ({user_data['role'].value})")
            else:
                logger.info(f"Demo user already exists: {user_data['email']}")
        
        logger.info("Demo users initialization completed")
        
    except Exception as e:
        logger.error(f"Failed to initialize demo users: {e}")