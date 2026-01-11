"""
Application model for Firebase Firestore
Represents job applications from candidates
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
import uuid

class ApplicationStatus:
    """Application status constants"""
    PENDING = "PENDING"
    REVIEWED = "REVIEWED"
    SHORTLISTED = "SHORTLISTED"
    REJECTED = "REJECTED"
    HIRED = "HIRED"

class Application:
    """Job Application model class"""
    
    def __init__(self, job_id: str, candidate_id: str, resume_id: str):
        self.id = str(uuid.uuid4())
        self.job_id = job_id
        self.candidate_id = candidate_id
        self.resume_id = resume_id
        self.status = ApplicationStatus.PENDING
        self.applied_at = datetime.now()
        self.updated_at = datetime.now()
        self.cover_letter: Optional[str] = None
        self.recruiter_notes: Optional[str] = None
        # AI Analysis data (copied from resume at application time)
        self.ai_analysis: Optional[Dict[str, Any]] = None
        self.match_score: float = 0.0
        self.matched_skills: List[str] = []
        self.missing_skills: List[str] = []
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert application to dictionary for Firestore"""
        return {
            'id': self.id,
            'job_id': self.job_id,
            'candidate_id': self.candidate_id,
            'resume_id': self.resume_id,
            'status': self.status,
            'applied_at': self.applied_at,
            'updated_at': self.updated_at,
            'cover_letter': self.cover_letter,
            'recruiter_notes': self.recruiter_notes,
            'ai_analysis': self.ai_analysis,
            'match_score': self.match_score,
            'matched_skills': self.matched_skills,
            'missing_skills': self.missing_skills
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Application':
        """Create application from Firestore dictionary"""
        app = cls(
            job_id=data['job_id'],
            candidate_id=data['candidate_id'],
            resume_id=data['resume_id']
        )
        
        app.id = data.get('id', str(uuid.uuid4()))
        app.status = data.get('status', ApplicationStatus.PENDING)
        app.applied_at = data.get('applied_at', datetime.now())
        app.updated_at = data.get('updated_at', datetime.now())
        app.cover_letter = data.get('cover_letter')
        app.recruiter_notes = data.get('recruiter_notes')
        app.ai_analysis = data.get('ai_analysis')
        app.match_score = data.get('match_score', 0.0)
        app.matched_skills = data.get('matched_skills', [])
        app.missing_skills = data.get('missing_skills', [])
        
        return app
    
    def update_status(self, status: str, notes: Optional[str] = None):
        """Update application status"""
        self.status = status
        if notes:
            self.recruiter_notes = notes
        self.updated_at = datetime.now()
    
    def set_match_analysis(self, score: float, matched: List[str], missing: List[str]):
        """Set AI match analysis"""
        self.match_score = score
        self.matched_skills = matched
        self.missing_skills = missing
        self.updated_at = datetime.now()
