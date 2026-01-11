"""
Application repository for Firestore operations
Handles CRUD operations for applications collection
"""

import logging
from typing import List, Optional
from repositories.base_repository import BaseRepository
from models.application import Application

logger = logging.getLogger(__name__)

class ApplicationRepository(BaseRepository):
    """Repository for Application entities"""
    
    def __init__(self):
        super().__init__('applications')
    
    def save_application(self, application: Application) -> Application:
        """Save application to Firestore"""
        data = application.to_dict()
        self.save(application.id, data)
        logger.info(f"Application saved: {application.id} for job {application.job_id}")
        return application
    
    def find_by_id(self, application_id: str) -> Optional[Application]:
        """Find application by ID"""
        data = super().find_by_id(application_id)
        if data:
            return Application.from_dict(data)
        return None
    
    def find_by_job_id(self, job_id: str) -> List[Application]:
        """Find all applications for a job"""
        results = self.find_by_field('job_id', job_id)
        applications = [Application.from_dict(data) for data in results]
        # Sort by match_score descending
        applications.sort(key=lambda x: x.match_score, reverse=True)
        return applications
    
    def find_by_candidate_id(self, candidate_id: str) -> List[Application]:
        """Find all applications by a candidate"""
        results = self.find_by_field('candidate_id', candidate_id)
        return [Application.from_dict(data) for data in results]
    
    def find_by_job_and_candidate(self, job_id: str, candidate_id: str) -> Optional[Application]:
        """Check if candidate already applied to job"""
        results = self.find_by_field('job_id', job_id)
        for data in results:
            if data.get('candidate_id') == candidate_id:
                return Application.from_dict(data)
        return None
    
    def update_application(self, application: Application) -> Application:
        """Update application"""
        data = application.to_dict()
        self.update(application.id, data)
        logger.info(f"Application updated: {application.id}")
        return application
    
    def delete_application(self, application_id: str) -> bool:
        """Delete application"""
        result = self.delete(application_id)
        if result:
            logger.info(f"Application deleted: {application_id}")
        return result
    
    def count_by_job_id(self, job_id: str) -> int:
        """Count applications for a job"""
        results = self.find_by_field('job_id', job_id)
        return len(results)
