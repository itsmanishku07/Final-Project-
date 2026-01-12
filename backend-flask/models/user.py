"""
User model for Firebase Firestore
Represents user entities in the system
"""

from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, List

class UserRole(Enum):
    """User roles in the system"""
    ADMIN = "ADMIN"
    RECRUITER = "RECRUITER"
    CANDIDATE = "CANDIDATE"

class WorkExperience:
    """Work experience entry"""
    
    def __init__(self):
        self.id = ""
        self.company = ""
        self.position = ""
        self.location = ""
        self.start_date = ""
        self.end_date = ""  # Empty means current
        self.is_current = False
        self.description = ""
        self.technologies = []  # List of technologies used
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'company': self.company,
            'position': self.position,
            'location': self.location,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'is_current': self.is_current,
            'description': self.description,
            'technologies': self.technologies
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'WorkExperience':
        exp = cls()
        exp.id = data.get('id', '')
        exp.company = data.get('company', '')
        exp.position = data.get('position', '')
        exp.location = data.get('location', '')
        exp.start_date = data.get('start_date', '')
        exp.end_date = data.get('end_date', '')
        exp.is_current = data.get('is_current', False)
        exp.description = data.get('description', '')
        exp.technologies = data.get('technologies', [])
        return exp

class Education:
    """Education entry"""
    
    def __init__(self):
        self.id = ""
        self.institution = ""
        self.degree = ""
        self.field = ""
        self.start_date = ""
        self.end_date = ""
        self.grade = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'institution': self.institution,
            'degree': self.degree,
            'field': self.field,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'grade': self.grade
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Education':
        edu = cls()
        edu.id = data.get('id', '')
        edu.institution = data.get('institution', '')
        edu.degree = data.get('degree', '')
        edu.field = data.get('field', '')
        edu.start_date = data.get('start_date', '')
        edu.end_date = data.get('end_date', '')
        edu.grade = data.get('grade', '')
        return edu

class UserProfile:
    """Extended user profile information"""
    
    def __init__(self):
        self.phone = ""
        self.location = ""
        self.linkedin = ""
        self.github = ""
        self.portfolio = ""
        self.bio = ""
        self.headline = ""
        self.skills = []  # List of skills
        self.work_experience = []  # List of WorkExperience
        self.education = []  # List of Education
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'phone': self.phone,
            'location': self.location,
            'linkedin': self.linkedin,
            'github': self.github,
            'portfolio': self.portfolio,
            'bio': self.bio,
            'headline': self.headline,
            'skills': self.skills,
            'work_experience': [exp.to_dict() for exp in self.work_experience],
            'education': [edu.to_dict() for edu in self.education]
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'UserProfile':
        profile = cls()
        profile.phone = data.get('phone', '')
        profile.location = data.get('location', '')
        profile.linkedin = data.get('linkedin', '')
        profile.github = data.get('github', '')
        profile.portfolio = data.get('portfolio', '')
        profile.bio = data.get('bio', '')
        profile.headline = data.get('headline', '')
        profile.skills = data.get('skills', [])
        
        # Parse work experience
        work_exp_data = data.get('work_experience', [])
        profile.work_experience = [WorkExperience.from_dict(exp) for exp in work_exp_data]
        
        # Parse education
        edu_data = data.get('education', [])
        profile.education = [Education.from_dict(edu) for edu in edu_data]
        
        return profile

class User:
    """User model class"""
    
    def __init__(self, uid: str, name: str, email: str, role: UserRole):
        self.uid = uid
        self.name = name
        self.email = email
        self.role = role
        self.active = True
        self.profile = UserProfile()
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
            'profile': self.profile.to_dict(),
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
        
        # Load profile if exists
        if 'profile' in data and data['profile']:
            user.profile = UserProfile.from_dict(data['profile'])
        
        return user
    
    def update_profile(self, name: Optional[str] = None, profile_data: Optional[Dict] = None):
        """Update user profile"""
        if name:
            self.name = name
        if profile_data:
            self.profile.phone = profile_data.get('phone', self.profile.phone)
            self.profile.location = profile_data.get('location', self.profile.location)
            self.profile.linkedin = profile_data.get('linkedin', self.profile.linkedin)
            self.profile.github = profile_data.get('github', self.profile.github)
            self.profile.portfolio = profile_data.get('portfolio', self.profile.portfolio)
            self.profile.bio = profile_data.get('bio', self.profile.bio)
            self.profile.headline = profile_data.get('headline', self.profile.headline)
            self.profile.skills = profile_data.get('skills', self.profile.skills)
            
            # Update work experience
            if 'work_experience' in profile_data:
                self.profile.work_experience = [
                    WorkExperience.from_dict(exp) for exp in profile_data['work_experience']
                ]
            
            # Update education
            if 'education' in profile_data:
                self.profile.education = [
                    Education.from_dict(edu) for edu in profile_data['education']
                ]
        
        self.updated_at = datetime.now()
    
    def deactivate(self):
        """Deactivate user account"""
        self.active = False
        self.updated_at = datetime.now()
    
    def activate(self):
        """Activate user account"""
        self.active = True
        self.updated_at = datetime.now()