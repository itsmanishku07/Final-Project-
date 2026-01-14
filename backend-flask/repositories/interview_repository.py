"""
Interview repository for Firestore operations
Handles CRUD operations for interviews collection
"""

import logging
from typing import List, Optional
from repositories.base_repository import BaseRepository
from models.interview import Interview

logger = logging.getLogger(__name__)

class InterviewRepository(BaseRepository):
    """Repository for Interview entities"""
    
    def __init__(self):
        super().__init__('interviews')
    
    def save_interview(self, interview: Interview) -> Interview:
        """Save interview to Firestore"""
        data = interview.to_dict()
        self.save(interview.id, data)
        logger.info(f"Interview saved: {interview.id}")
        return interview
    
    def find_by_id(self, interview_id: str) -> Optional[Interview]:
        """Find interview by ID"""
        data = super().find_by_id(interview_id)
        if data:
            return Interview.from_dict(data)
        return None
    
    def find_by_application_id(self, application_id: str) -> List[Interview]:
        """Find all interviews for an application"""
        results = self.find_by_field('application_id', application_id)
        return [Interview.from_dict(data) for data in results]
    
    def find_by_candidate_id(self, candidate_id: str) -> List[Interview]:
        """Find all interviews for a candidate"""
        results = self.find_by_field('candidate_id', candidate_id)
        interviews = [Interview.from_dict(data) for data in results]
        # Sort by scheduled_at descending
        interviews.sort(key=lambda x: x.scheduled_at, reverse=True)
        return interviews
    
    def find_by_recruiter_id(self, recruiter_id: str) -> List[Interview]:
        """Find all interviews by a recruiter"""
        results = self.find_by_field('recruiter_id', recruiter_id)
        interviews = [Interview.from_dict(data) for data in results]
        interviews.sort(key=lambda x: x.scheduled_at, reverse=True)
        return interviews
    
    def find_by_job_id(self, job_id: str) -> List[Interview]:
        """Find all interviews for a job"""
        results = self.find_by_field('job_id', job_id)
        return [Interview.from_dict(data) for data in results]
    
    def find_upcoming_by_candidate(self, candidate_id: str) -> List[Interview]:
        """Find upcoming interviews for a candidate"""
        from datetime import datetime
        interviews = self.find_by_candidate_id(candidate_id)
        now = datetime.now()
        return [i for i in interviews if i.scheduled_at > now and i.status in ['SCHEDULED', 'CONFIRMED']]
    
    def find_upcoming_by_recruiter(self, recruiter_id: str) -> List[Interview]:
        """Find upcoming interviews for a recruiter"""
        from datetime import datetime
        interviews = self.find_by_recruiter_id(recruiter_id)
        now = datetime.now()
        return [i for i in interviews if i.scheduled_at > now and i.status in ['SCHEDULED', 'CONFIRMED']]
    
    def update_interview(self, interview: Interview) -> Interview:
        """Update interview"""
        data = interview.to_dict()
        self.update(interview.id, data)
        logger.info(f"Interview updated: {interview.id}")
        return interview
    
    def delete_interview(self, interview_id: str) -> bool:
        """Delete interview"""
        result = self.delete(interview_id)
        if result:
            logger.info(f"Interview deleted: {interview_id}")
        return result
