"""
Match repository for Firestore operations
Handles CRUD operations for matches collection
"""

import logging
from typing import List, Optional
from repositories.base_repository import BaseRepository
from models.match import Match

logger = logging.getLogger(__name__)

class MatchRepository(BaseRepository):
    """Repository for Match entities"""
    
    def __init__(self):
        super().__init__('matches')
    
    def save_match(self, match: Match) -> Match:
        """Save match to Firestore"""
        data = match.to_dict()
        self.save(match.id, data)
        logger.info(f"Match saved successfully: {match.id}")
        return match
    
    def find_by_id(self, match_id: str) -> Optional[Match]:
        """Find match by ID"""
        data = super().find_by_id(match_id)
        if data:
            return Match.from_dict(data)
        return None
    
    def find_by_job_id(self, job_id: str) -> List[Match]:
        """Find matches by job ID, ordered by similarity score"""
        results = self.find_by_field('job_id', job_id)
        matches = [Match.from_dict(data) for data in results]
        # Sort by similarity score descending
        matches.sort(key=lambda x: x.similarity_score, reverse=True)
        return matches
    
    def find_by_resume_id(self, resume_id: str) -> List[Match]:
        """Find matches by resume ID, ordered by similarity score"""
        results = self.find_by_field('resume_id', resume_id)
        matches = [Match.from_dict(data) for data in results]
        # Sort by similarity score descending
        matches.sort(key=lambda x: x.similarity_score, reverse=True)
        return matches
    
    def find_by_resume_and_job(self, resume_id: str, job_id: str) -> Optional[Match]:
        """Find match by resume and job ID"""
        # Since we can't do compound queries easily with our base repository,
        # we'll get all matches for the resume and filter by job
        resume_matches = self.find_by_resume_id(resume_id)
        for match in resume_matches:
            if match.job_id == job_id:
                return match
        return None
    
    def find_top_matches(self, limit: int = 50) -> List[Match]:
        """Find top matches across all jobs"""
        results = self.find_all(limit=limit)
        matches = [Match.from_dict(data) for data in results]
        # Sort by similarity score descending
        matches.sort(key=lambda x: x.similarity_score, reverse=True)
        return matches[:limit]
    
    def update_match(self, match: Match) -> Match:
        """Update match"""
        data = match.to_dict()
        self.update(match.id, data)
        logger.info(f"Match updated successfully: {match.id}")
        return match
    
    def delete_match(self, match_id: str) -> bool:
        """Delete match by ID"""
        result = self.delete(match_id)
        if result:
            logger.info(f"Match deleted successfully: {match_id}")
        return result
    
    def count_matches(self) -> int:
        """Count total matches"""
        return self.count()