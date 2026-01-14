"""
Job model for Firebase Firestore
Represents job posting entities
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
import uuid

class Job:
    """Job model class"""
    
    def __init__(self, recruiter_id: str, title: str, description: str, company: str, 
                 required_skills: List[str], min_experience: int, max_experience: int):
        self.id = str(uuid.uuid4())
        self.recruiter_id = recruiter_id
        self.title = title
        self.description = description
        self.company = company
        self.location: Optional[str] = None
        self.required_skills = required_skills
        self.min_experience = min_experience
        self.max_experience = max_experience
        self.education_level: Optional[str] = None
        self.job_type: Optional[str] = None
        self.salary_min: float = 0.0
        self.salary_max: float = 0.0
        self.stipend_amount: float = 0.0
        self.compensation_type: str = 'CTC'  # CTC or Stipend
        self.expires_at: Optional[datetime] = None
        self.active = True
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert job to dictionary for Firestore"""
        return {
            'id': self.id,
            'recruiter_id': self.recruiter_id,
            'title': self.title,
            'description': self.description,
            'company': self.company,
            'location': self.location,
            'required_skills': self.required_skills,
            'min_experience': self.min_experience,
            'max_experience': self.max_experience,
            'education_level': self.education_level,
            'job_type': self.job_type,
            'salary_min': self.salary_min,
            'salary_max': self.salary_max,
            'stipend_amount': self.stipend_amount,
            'compensation_type': self.compensation_type,
            'expires_at': self.expires_at,
            'active': self.active,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Job':
        """Create job from Firestore dictionary"""
        job = cls(
            recruiter_id=data['recruiter_id'],
            title=data['title'],
            description=data['description'],
            company=data['company'],
            required_skills=data.get('required_skills', []),
            min_experience=data.get('min_experience', 0),
            max_experience=data.get('max_experience', 0)
        )
        
        job.id = data.get('id', str(uuid.uuid4()))
        job.location = data.get('location')
        job.education_level = data.get('education_level')
        job.job_type = data.get('job_type')
        job.salary_min = data.get('salary_min', 0.0)
        job.salary_max = data.get('salary_max', 0.0)
        job.stipend_amount = data.get('stipend_amount', 0.0)
        job.compensation_type = data.get('compensation_type', 'CTC')
        job.expires_at = data.get('expires_at')
        job.active = data.get('active', True)
        job.created_at = data.get('created_at', datetime.now())
        job.updated_at = data.get('updated_at', datetime.now())
        
        return job
    
    def update(self, title: Optional[str] = None, description: Optional[str] = None,
               company: Optional[str] = None, location: Optional[str] = None,
               required_skills: Optional[List[str]] = None, min_experience: Optional[int] = None,
               max_experience: Optional[int] = None, education_level: Optional[str] = None,
               job_type: Optional[str] = None, salary_min: Optional[float] = None,
               salary_max: Optional[float] = None, stipend_amount: Optional[float] = None,
               compensation_type: Optional[str] = None, expires_at: Optional[datetime] = None):
        """Update job details"""
        if title is not None:
            self.title = title
        if description is not None:
            self.description = description
        if company is not None:
            self.company = company
        if location is not None:
            self.location = location
        if required_skills is not None:
            self.required_skills = required_skills
        if min_experience is not None:
            self.min_experience = min_experience
        if max_experience is not None:
            self.max_experience = max_experience
        if education_level is not None:
            self.education_level = education_level
        if job_type is not None:
            self.job_type = job_type
        if salary_min is not None:
            self.salary_min = salary_min
        if salary_max is not None:
            self.salary_max = salary_max
        if stipend_amount is not None:
            self.stipend_amount = stipend_amount
        if compensation_type is not None:
            self.compensation_type = compensation_type
        if expires_at is not None:
            self.expires_at = expires_at
        
        self.updated_at = datetime.now()
    
    def deactivate(self):
        """Deactivate job posting"""
        self.active = False
        self.updated_at = datetime.now()
    
    def activate(self):
        """Activate job posting"""
        self.active = True
        self.updated_at = datetime.now()
    
    def is_expired(self) -> bool:
        """Check if job posting has expired"""
        if self.expires_at is None:
            return False
        return datetime.now() > self.expires_at