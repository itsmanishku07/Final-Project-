"""
Resume repository for Firestore operations
Handles CRUD operations for resumes collection
"""

import logging
from typing import List, Optional
from repositories.base_repository import BaseRepository
from models.resume import Resume

logger = logging.getLogger(__name__)

class ResumeRepository(BaseRepository):
    """Repository for Resume entities"""
    
    def __init__(self):
        super().__init__('resumes')
    
    def save_resume(self, resume: Resume) -> Resume:
        """Save resume to Firestore"""
        data = resume.to_dict()
        self.save(resume.id, data)
        logger.info(f"Resume saved successfully: {resume.file_name}")
        return resume
    
    def find_by_id(self, resume_id: str) -> Optional[Resume]:
        """Find resume by ID"""
        data = super().find_by_id(resume_id)
        if data:
            return Resume.from_dict(data)
        return None
    
    def find_by_user_id(self, user_id: str) -> List[Resume]:
        """Find resumes by user ID"""
        results = self.find_by_field('user_id', user_id)
        return [Resume.from_dict(data) for data in results]
    
    def find_all_processed(self) -> List[Resume]:
        """Find all processed resumes"""
        results = self.find_by_field('processed', True)
        return [Resume.from_dict(data) for data in results]
    
    def find_all_resumes(self, limit: Optional[int] = None) -> List[Resume]:
        """Find all resumes"""
        results = self.find_all(limit=limit, order_by='uploaded_at')
        return [Resume.from_dict(data) for data in results]
    
    def update_resume(self, resume: Resume) -> Resume:
        """Update resume"""
        data = resume.to_dict()
        self.update(resume.id, data)
        logger.info(f"Resume updated successfully: {resume.id}")
        return resume
    
    def delete_resume(self, resume_id: str) -> bool:
        """Delete resume by ID"""
        result = self.delete(resume_id)
        if result:
            logger.info(f"Resume deleted successfully: {resume_id}")
        return result