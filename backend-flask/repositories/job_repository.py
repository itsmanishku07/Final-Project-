"""
Job repository for Firestore operations
Handles CRUD operations for jobs collection
"""

import logging
from typing import List, Optional
from repositories.base_repository import BaseRepository
from models.job import Job

logger = logging.getLogger(__name__)

class JobRepository(BaseRepository):
    """Repository for Job entities"""
    
    def __init__(self):
        super().__init__('jobs')
    
    def save_job(self, job: Job) -> Job:
        """Save job to Firestore"""
        data = job.to_dict()
        self.save(job.id, data)
        logger.info(f"Job saved successfully: {job.title}")
        return job
    
    def find_by_id(self, job_id: str) -> Optional[Job]:
        """Find job by ID"""
        data = super().find_by_id(job_id)
        if data:
            return Job.from_dict(data)
        return None
    
    def find_by_recruiter_id(self, recruiter_id: str) -> List[Job]:
        """Find jobs by recruiter ID"""
        results = self.find_by_field('recruiter_id', recruiter_id)
        return [Job.from_dict(data) for data in results]
    
    def find_all_active(self) -> List[Job]:
        """Find all active jobs"""
        results = self.find_by_field('active', True)
        return [Job.from_dict(data) for data in results]
    
    def find_all_jobs(self, limit: Optional[int] = None) -> List[Job]:
        """Find all jobs"""
        results = self.find_all(limit=limit, order_by='created_at')
        return [Job.from_dict(data) for data in results]
    
    def update_job(self, job: Job) -> Job:
        """Update job"""
        data = job.to_dict()
        self.update(job.id, data)
        logger.info(f"Job updated successfully: {job.id}")
        return job
    
    def delete_job(self, job_id: str) -> bool:
        """Delete job by ID"""
        result = self.delete(job_id)
        if result:
            logger.info(f"Job deleted successfully: {job_id}")
        return result