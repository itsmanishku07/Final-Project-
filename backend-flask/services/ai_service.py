"""
AI Analysis Service for resume processing and job matching
Provides both demo and production implementations
"""

import os
import logging
import requests
import json
import time
import random
from typing import List, Dict, Any
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

class AIAnalysisResponse:
    """AI analysis response structure"""
    
    def __init__(self, skills: List[str], experience_years: int, education: str,
                 matched_skills: List[str], missing_skills: List[str],
                 similarity_score: float, reasoning: str):
        self.skills = skills
        self.experience_years = experience_years
        self.education = education
        self.matched_skills = matched_skills
        self.missing_skills = missing_skills
        self.similarity_score = similarity_score
        self.reasoning = reasoning
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'skills': self.skills,
            'experience_years': self.experience_years,
            'education': self.education,
            'matched_skills': self.matched_skills,
            'missing_skills': self.missing_skills,
            'similarity_score': self.similarity_score,
            'reasoning': self.reasoning
        }

class AIAnalysisInterface(ABC):
    """Abstract interface for AI analysis services"""
    
    @abstractmethod
    def analyze_resume(self, resume_text: str) -> AIAnalysisResponse:
        """Analyze resume text and extract skills, experience, education"""
        pass
    
    @abstractmethod
    def analyze_resume_for_job(self, resume_text: str, job_description: str, 
                              required_skills: List[str]) -> AIAnalysisResponse:
        """Analyze resume for a specific job"""
        pass

class DemoAIAnalysisService(AIAnalysisInterface):
    """Demo AI service with mock responses"""
    
    def __init__(self):
        logger.info("Demo AI Analysis Service initialized - using mock responses")
    
    def analyze_resume(self, resume_text: str) -> AIAnalysisResponse:
        """Mock resume analysis"""
        logger.info(f"Demo: Analyzing resume text (length: {len(resume_text)})")
        
        # Simulate processing delay
        time.sleep(2 + random.randint(1, 3))
        
        # Generate mock analysis
        skills = self._extract_skills_from_text(resume_text)
        experience_years = self._estimate_experience(resume_text)
        education = self._estimate_education(resume_text)
        
        reasoning = f"Resume analysis completed successfully with {len(skills)} skills identified"
        
        logger.info(f"Demo: Resume analysis completed - {len(skills)} skills, {experience_years} years experience")
        
        return AIAnalysisResponse(
            skills=skills,
            experience_years=experience_years,
            education=education,
            matched_skills=[],  # Empty for resume analysis
            missing_skills=[],  # Empty for resume analysis
            similarity_score=0,  # 0 for resume analysis
            reasoning=reasoning
        )
    
    def analyze_resume_for_job(self, resume_text: str, job_description: str, 
                              required_skills: List[str]) -> AIAnalysisResponse:
        """Mock resume-job matching analysis"""
        logger.info(f"Demo: Performing semantic matching for job with {len(required_skills)} required skills")
        
        # Simulate processing delay
        time.sleep(3 + random.randint(1, 4))
        
        # Generate mock matching analysis
        candidate_skills = self._extract_skills_from_text(resume_text)
        experience_years = self._estimate_experience(resume_text)
        education = self._estimate_education(resume_text)
        
        # Calculate matched and missing skills
        matched_skills = [
            skill for skill in candidate_skills
            if any(req.lower() in skill.lower() or skill.lower() in req.lower() 
                  for req in required_skills)
        ]
        
        missing_skills = [
            req for req in required_skills
            if not any(skill.lower() in req.lower() or req.lower() in skill.lower() 
                      for skill in candidate_skills)
        ]
        
        # Calculate similarity score
        base_score = (len(matched_skills) / len(required_skills)) * 100 if required_skills else 0
        experience_bonus = min(experience_years * 2, 20)  # Max 20 points
        education_bonus = 10 if 'master' in education.lower() else (5 if 'bachelor' in education.lower() else 0)
        
        final_score = min(base_score + experience_bonus + education_bonus + random.randint(0, 10), 100)
        
        reasoning = (
            f"Candidate matches {len(matched_skills)} out of {len(required_skills)} required skills "
            f"({base_score:.1f}%). Has {experience_years} years of experience and {education} education. "
            f"{'Excellent match!' if final_score > 80 else 'Good match with some gaps.' if final_score > 60 else 'Partial match, may need additional training.'}"
        )
        
        logger.info(f"Demo: Semantic matching completed - Score: {final_score}, Matched: {len(matched_skills)}, Missing: {len(missing_skills)}")
        
        return AIAnalysisResponse(
            skills=candidate_skills,
            experience_years=experience_years,
            education=education,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            similarity_score=final_score,
            reasoning=reasoning
        )
    
    def _extract_skills_from_text(self, text: str) -> List[str]:
        """Extract skills from text using keyword matching"""
        text_lower = text.lower()
        all_skills = [
            "Java", "JavaScript", "Python", "React", "Angular", "Vue.js", "Node.js",
            "Spring Boot", "Django", "Flask", "Express.js", "MongoDB", "PostgreSQL",
            "MySQL", "Redis", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
            "Git", "Jenkins", "CI/CD", "Agile", "Scrum", "REST API", "GraphQL",
            "HTML", "CSS", "TypeScript", "C++", "C#", ".NET", "PHP", "Ruby",
            "Machine Learning", "Data Science", "TensorFlow", "PyTorch", "Pandas",
            "NumPy", "Matplotlib", "Tableau", "Power BI", "Excel", "SQL"
        ]
        
        found_skills = [
            skill for skill in all_skills
            if skill.lower() in text_lower
        ]
        
        # Return 8-12 skills randomly
        return found_skills[:8 + random.randint(0, 4)]
    
    def _estimate_experience(self, text: str) -> int:
        """Estimate years of experience from text"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['senior', 'lead', 'architect']):
            return 5 + random.randint(0, 5)  # 5-10 years
        elif any(word in text_lower for word in ['mid', 'intermediate']):
            return 2 + random.randint(0, 3)  # 2-5 years
        elif any(word in text_lower for word in ['junior', 'entry']):
            return random.randint(0, 2)  # 0-2 years
        else:
            return 1 + random.randint(0, 7)  # 1-8 years
    
    def _estimate_education(self, text: str) -> str:
        """Estimate education level from text"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['phd', 'doctorate']):
            return "PhD"
        elif any(word in text_lower for word in ['master', 'mba', 'ms', 'ma']):
            return "Master's Degree"
        elif any(word in text_lower for word in ['bachelor', 'bs', 'ba', 'btech']):
            return "Bachelor's Degree"
        elif any(word in text_lower for word in ['associate', 'diploma']):
            return "Associate Degree"
        else:
            return "High School"

class ProductionAIAnalysisService(AIAnalysisInterface):
    """Production AI service - uses smart rule-based analysis"""
    
    def __init__(self):
        self.api_url = os.getenv('DATABRICKS_API_URL')
        self.token = os.getenv('DATABRICKS_TOKEN')
        self.model_endpoint = os.getenv('DATABRICKS_MODEL_ENDPOINT')
        logger.info("Production AI Analysis Service initialized")
    
    def analyze_resume(self, resume_text: str) -> AIAnalysisResponse:
        """Analyze resume using smart rule-based extraction"""
        logger.info(f"Analyzing resume text (length: {len(resume_text)})")
        
        # Use smart extraction instead of external API
        skills = self._extract_skills_from_text(resume_text)
        experience_years = self._estimate_experience(resume_text)
        education = self._estimate_education(resume_text)
        
        reasoning = f"Resume analysis completed. Found {len(skills)} skills, {experience_years} years experience, {education}."
        
        logger.info(f"Resume analysis completed - {len(skills)} skills, {experience_years} years experience")
        
        return AIAnalysisResponse(
            skills=skills,
            experience_years=experience_years,
            education=education,
            matched_skills=[],
            missing_skills=[],
            similarity_score=0,
            reasoning=reasoning
        )
    
    def analyze_resume_for_job(self, resume_text: str, job_description: str, 
                              required_skills: List[str]) -> AIAnalysisResponse:
        """Analyze resume for job using smart matching"""
        logger.info(f"Performing job matching for {len(required_skills)} required skills")
        
        # Extract candidate info
        candidate_skills = self._extract_skills_from_text(resume_text)
        experience_years = self._estimate_experience(resume_text)
        education = self._estimate_education(resume_text)
        
        # Smart skill matching (case-insensitive, partial match)
        matched_skills = []
        missing_skills = []
        
        for req_skill in required_skills:
            req_lower = req_skill.lower()
            found = False
            for cand_skill in candidate_skills:
                cand_lower = cand_skill.lower()
                # Check for exact match, partial match, or related skills
                if (req_lower in cand_lower or cand_lower in req_lower or
                    self._are_related_skills(req_lower, cand_lower)):
                    matched_skills.append(req_skill)
                    found = True
                    break
            if not found:
                missing_skills.append(req_skill)
        
        # Calculate similarity score
        skill_score = (len(matched_skills) / len(required_skills) * 60) if required_skills else 0
        exp_score = min(experience_years * 3, 20)  # Max 20 points for experience
        edu_score = self._get_education_score(education)  # Max 20 points
        
        similarity_score = min(round(skill_score + exp_score + edu_score, 1), 100)
        
        # Generate reasoning
        if similarity_score >= 80:
            match_quality = "Excellent match"
        elif similarity_score >= 60:
            match_quality = "Good match"
        elif similarity_score >= 40:
            match_quality = "Moderate match"
        else:
            match_quality = "Low match"
        
        reasoning = (
            f"{match_quality}. Candidate has {len(matched_skills)}/{len(required_skills)} required skills, "
            f"{experience_years} years experience, and {education}."
        )
        
        logger.info(f"Job matching completed - Score: {similarity_score}, Matched: {len(matched_skills)}")
        
        return AIAnalysisResponse(
            skills=candidate_skills,
            experience_years=experience_years,
            education=education,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            similarity_score=similarity_score,
            reasoning=reasoning
        )
    
    def _are_related_skills(self, skill1: str, skill2: str) -> bool:
        """Check if two skills are related"""
        related_groups = [
            ['javascript', 'js', 'typescript', 'ts', 'node', 'nodejs', 'react', 'angular', 'vue'],
            ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
            ['java', 'spring', 'springboot', 'hibernate', 'maven'],
            ['sql', 'mysql', 'postgresql', 'postgres', 'oracle', 'database'],
            ['aws', 'amazon', 'ec2', 's3', 'lambda', 'cloud'],
            ['azure', 'microsoft cloud'],
            ['gcp', 'google cloud'],
            ['docker', 'kubernetes', 'k8s', 'container'],
            ['machine learning', 'ml', 'ai', 'deep learning', 'tensorflow', 'pytorch'],
            ['html', 'css', 'frontend', 'front-end', 'ui'],
            ['git', 'github', 'gitlab', 'version control'],
            ['agile', 'scrum', 'kanban'],
            ['c#', 'csharp', '.net', 'dotnet'],
            ['c++', 'cpp'],
        ]
        
        for group in related_groups:
            if skill1 in group and skill2 in group:
                return True
        return False
    
    def _get_education_score(self, education: str) -> int:
        """Get score based on education level"""
        edu_lower = education.lower()
        if 'phd' in edu_lower or 'doctorate' in edu_lower:
            return 20
        elif 'master' in edu_lower or 'mba' in edu_lower:
            return 15
        elif 'bachelor' in edu_lower:
            return 10
        elif 'associate' in edu_lower or 'diploma' in edu_lower:
            return 5
        return 0
    
    def _extract_skills_from_text(self, text: str) -> List[str]:
        """Extract skills from text using comprehensive keyword matching"""
        text_lower = text.lower()
        all_skills = [
            "Java", "JavaScript", "Python", "React", "Angular", "Vue.js", "Node.js",
            "Spring Boot", "Django", "Flask", "Express.js", "MongoDB", "PostgreSQL",
            "MySQL", "Redis", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
            "Git", "Jenkins", "CI/CD", "Agile", "Scrum", "REST API", "GraphQL",
            "HTML", "CSS", "TypeScript", "C++", "C#", ".NET", "PHP", "Ruby",
            "Machine Learning", "Data Science", "TensorFlow", "PyTorch", "Pandas",
            "NumPy", "Matplotlib", "Tableau", "Power BI", "Excel", "SQL",
            "Linux", "Unix", "Bash", "Shell Scripting", "Terraform", "Ansible",
            "Microservices", "API Development", "System Design", "OOP",
            "Data Structures", "Algorithms", "Problem Solving", "Communication",
            "Leadership", "Team Management", "Project Management"
        ]
        
        found_skills = [skill for skill in all_skills if skill.lower() in text_lower]
        return found_skills
    
    def _estimate_experience(self, text: str) -> int:
        """Estimate years of experience from text"""
        import re
        text_lower = text.lower()
        
        # Look for explicit year mentions
        year_patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s*)?experience',
            r'experience[:\s]*(\d+)\+?\s*years?',
            r'(\d+)\+?\s*years?\s*in\s*(?:software|development|programming)',
        ]
        
        for pattern in year_patterns:
            match = re.search(pattern, text_lower)
            if match:
                return min(int(match.group(1)), 30)
        
        # Estimate based on keywords
        if any(word in text_lower for word in ['senior', 'lead', 'principal', 'architect', 'director']):
            return 7
        elif any(word in text_lower for word in ['mid-level', 'intermediate', 'experienced']):
            return 4
        elif any(word in text_lower for word in ['junior', 'entry', 'fresher', 'graduate']):
            return 1
        
        return 3  # Default
    
    def _estimate_education(self, text: str) -> str:
        """Estimate education level from text"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['phd', 'ph.d', 'doctorate', 'doctoral']):
            return "PhD"
        elif any(word in text_lower for word in ['master', 'mba', 'm.s.', 'm.tech', 'mca']):
            return "Master's Degree"
        elif any(word in text_lower for word in ['bachelor', 'b.s.', 'b.tech', 'bca', 'b.e.', 'bsc']):
            return "Bachelor's Degree"
        elif any(word in text_lower for word in ['associate', 'diploma', 'certificate']):
            return "Associate Degree"
        
        return "Bachelor's Degree"  # Default assumption
    
def get_ai_service() -> AIAnalysisInterface:
    """Factory function to get appropriate AI service"""
    app_mode = os.getenv('APP_MODE', 'demo')
    
    if app_mode == 'demo':
        return DemoAIAnalysisService()
    else:
        return ProductionAIAnalysisService()