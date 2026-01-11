"""
User repository for Firestore operations
Handles CRUD operations for users collection
"""

import logging
from typing import List, Optional
from repositories.base_repository import BaseRepository
from models.user import User

logger = logging.getLogger(__name__)

class UserRepository(BaseRepository):
    """Repository for User entities"""
    
    def __init__(self):
        super().__init__('users')
    
    def save_user(self, user: User) -> User:
        """Save user to Firestore"""
        data = user.to_dict()
        self.save(user.uid, data)
        logger.info(f"User saved successfully: {user.email}")
        return user
    
    def find_by_uid(self, uid: str) -> Optional[User]:
        """Find user by UID"""
        data = self.find_by_id(uid)
        if data:
            return User.from_dict(data)
        return None
    
    def find_by_email(self, email: str) -> Optional[User]:
        """Find user by email"""
        results = self.find_by_field('email', email, limit=1)
        if results:
            return User.from_dict(results[0])
        return None
    
    def find_all_users(self, limit: Optional[int] = None) -> List[User]:
        """Find all users"""
        results = self.find_all(limit=limit, order_by='created_at')
        return [User.from_dict(data) for data in results]
    
    def update_user(self, user: User) -> User:
        """Update user"""
        data = user.to_dict()
        self.update(user.uid, data)
        logger.info(f"User updated successfully: {user.email}")
        return user
    
    def delete_user(self, uid: str) -> bool:
        """Delete user by UID"""
        result = self.delete(uid)
        if result:
            logger.info(f"User deleted successfully: {uid}")
        return result