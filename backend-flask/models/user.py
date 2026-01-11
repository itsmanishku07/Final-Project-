"""
User model for Firebase Firestore
Represents user entities in the system
"""

from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any

class UserRole(Enum):
    """User roles in the system"""
    ADMIN = "ADMIN"
    RECRUITER = "RECRUITER"
    CANDIDATE = "CANDIDATE"

class User:
    """User model class"""
    
    def __init__(self, uid: str, name: str, email: str, role: UserRole):
        self.uid = uid
        self.name = name
        self.email = email
        self.role = role
        self.active = True
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert user to dictionary for Firestore"""
        return {
            'uid': self.uid,
            'name': self.name,
            'email': self.email,
            'role': self.role.value,
            'active': self.active,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'User':
        """Create user from Firestore dictionary"""
        user = cls(
            uid=data['uid'],
            name=data['name'],
            email=data['email'],
            role=UserRole(data['role'])
        )
        user.active = data.get('active', True)
        user.created_at = data.get('created_at', datetime.now())
        user.updated_at = data.get('updated_at', datetime.now())
        return user
    
    def update_profile(self, name: Optional[str] = None):
        """Update user profile"""
        if name:
            self.name = name
        self.updated_at = datetime.now()
    
    def deactivate(self):
        """Deactivate user account"""
        self.active = False
        self.updated_at = datetime.now()
    
    def activate(self):
        """Activate user account"""
        self.active = True
        self.updated_at = datetime.now()