"""
Match model for Firebase Firestore
Represents AI-powered resume-job matches
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
import uuid

class Match:
    """Match model class"""
    
    def __init__(self, resume_id: str, job_id: str, similarity_score: float,
                 matched_skills: List[str], missing_skills: List[str], reasoning: str):
        self.id = str(uuid.uuid4())
        self.resume_id = resume_id
        self.job_id = job_id
        self.similarity_score = similarity_score
        self.matched_skills = matched_skills
        self.missing_skills = missing_skills
        self.reasoning = reasoning
        self.matched_at = datetime.now()
        self.updated_at = datetime.now()
        self.reviewed = False
        self.recruiter_notes: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert match to dictionary for Firestore"""
        return {
            'id': self.id,
            'resume_id': self.resume_id,
            'job_id': self.job_id,
            'similarity_score': self.similarity_score,
            'matched_skills': self.matched_skills,
            'missing_skills': self.missing_skills,
            'reasoning': self.reasoning,
            'matched_at': self.matched_at,
            'updated_at': self.updated_at,
            'reviewed': self.reviewed,
            'recruiter_notes': self.recruiter_notes
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Match':
        """Create match from Firestore dictionary"""
        match = cls(
            resume_id=data['resume_id'],
            job_id=data['job_id'],
            similarity_score=data.get('similarity_score', 0.0),
            matched_skills=data.get('matched_skills', []),
            missing_skills=data.get('missing_skills', []),
            reasoning=data.get('reasoning', '')
        )
        
        match.id = data.get('id', str(uuid.uuid4()))
        match.matched_at = data.get('matched_at', datetime.now())
        match.updated_at = data.get('updated_at', datetime.now())
        match.reviewed = data.get('reviewed', False)
        match.recruiter_notes = data.get('recruiter_notes')
        
        return match
    
    def update_review(self, reviewed: bool, recruiter_notes: Optional[str] = None):
        """Update match review status and notes"""
        self.reviewed = reviewed
        if recruiter_notes is not None:
            self.recruiter_notes = recruiter_notes
        self.updated_at = datetime.now()