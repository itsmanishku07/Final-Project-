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
import re
from typing import List, Dict, Any
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

class AIAnalysisResponse:
    """AI analysis response structure"""
    
    def __init__(self, skills: List[str], experience_years: int, education: str,
                 matched_skills: List[str], missing_skills: List[str],
                 similarity_score: float, reasoning: str, contact_info: Dict = None):
        self.skills = skills
        self.experience_years = experience_years
        self.education = education
        self.matched_skills = matched_skills
        self.missing_skills = missing_skills
        self.similarity_score = similarity_score
        self.reasoning = reasoning
        self.contact_info = contact_info or {}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'skills': self.skills,
            'experience_years': self.experience_years,
            'education': self.education,
            'matched_skills': self.matched_skills,
            'missing_skills': self.missing_skills,
            'similarity_score': self.similarity_score,
            'reasoning': self.reasoning,
            'contact_info': self.contact_info
        }


class ResumeSuggestions:
    """Resume improvement suggestions structure with ATS scoring"""
    
    def __init__(self, spelling_errors: List[Dict], missing_sections: List[str],
                 keyword_suggestions: List[str], formatting_tips: List[str],
                 overall_score: int, summary: str, ats_score: Dict = None):
        self.spelling_errors = spelling_errors
        self.missing_sections = missing_sections
        self.keyword_suggestions = keyword_suggestions
        self.formatting_tips = formatting_tips
        self.overall_score = overall_score
        self.summary = summary
        self.ats_score = ats_score or {}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'spelling_errors': self.spelling_errors,
            'missing_sections': self.missing_sections,
            'keyword_suggestions': self.keyword_suggestions,
            'formatting_tips': self.formatting_tips,
            'overall_score': self.overall_score,
            'summary': self.summary,
            'ats_score': self.ats_score
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
    
    @abstractmethod
    def get_resume_suggestions(self, resume_text: str) -> ResumeSuggestions:
        """Get AI-powered suggestions to improve resume"""
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
        contact_info = self._extract_contact_info(resume_text)
        
        reasoning = f"Resume analysis completed successfully with {len(skills)} skills identified"
        
        logger.info(f"Demo: Resume analysis completed - {len(skills)} skills, {experience_years} years experience")
        
        return AIAnalysisResponse(
            skills=skills,
            experience_years=experience_years,
            education=education,
            matched_skills=[],  # Empty for resume analysis
            missing_skills=[],  # Empty for resume analysis
            similarity_score=0,  # 0 for resume analysis
            reasoning=reasoning,
            contact_info=contact_info
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
            reasoning=reasoning,
            contact_info=self._extract_contact_info(resume_text)
        )
    
    def _extract_contact_info(self, text: str) -> Dict:
        """Extract contact information from resume text"""
        contact_info = {
            'email': '',
            'phone': '',
            'linkedin': '',
            'github': '',
            'portfolio': '',
            'location': '',
            'name': ''
        }
        
        # Extract email
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        if email_match:
            contact_info['email'] = email_match.group(0)
        
        # Extract phone number (various formats)
        phone_patterns = [
            r'\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\+\d{10,12}',
            r'\(\d{3}\)\s*\d{3}[-.\s]?\d{4}',
            r'\d{3}[-.\s]\d{3}[-.\s]\d{4}',
            r'\d{10}'
        ]
        for pattern in phone_patterns:
            phone_match = re.search(pattern, text)
            if phone_match:
                contact_info['phone'] = phone_match.group(0)
                break
        
        # Extract LinkedIn URL
        linkedin_match = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/[\w-]+/?', text, re.IGNORECASE)
        if linkedin_match:
            url = linkedin_match.group(0)
            if not url.startswith('http'):
                url = 'https://' + url
            contact_info['linkedin'] = url
        
        # Extract GitHub URL
        github_match = re.search(r'(?:https?://)?(?:www\.)?github\.com/[\w-]+/?', text, re.IGNORECASE)
        if github_match:
            url = github_match.group(0)
            if not url.startswith('http'):
                url = 'https://' + url
            contact_info['github'] = url
        
        # Extract portfolio/website URL
        portfolio_patterns = [
            r'(?:portfolio|website|site)[\s:]*(?:https?://)?[\w.-]+\.\w+[/\w.-]*',
            r'(?:https?://)?(?:www\.)?[\w-]+\.(?:dev|io|me|com|net|org)/?\b'
        ]
        for pattern in portfolio_patterns:
            portfolio_match = re.search(pattern, text, re.IGNORECASE)
            if portfolio_match and 'linkedin' not in portfolio_match.group(0).lower() and 'github' not in portfolio_match.group(0).lower():
                url = portfolio_match.group(0)
                # Clean up the URL
                url = re.sub(r'^(?:portfolio|website|site)[\s:]*', '', url, flags=re.IGNORECASE)
                if not url.startswith('http'):
                    url = 'https://' + url
                contact_info['portfolio'] = url
                break
        
        # Extract location (city, state/country patterns)
        location_patterns = [
            r'(?:location|address|based in|residing)[\s:]*([A-Za-z\s,]+(?:,\s*[A-Za-z\s]+)?)',
            r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*(?:[A-Z]{2}|[A-Z][a-z]+))\b'
        ]
        for pattern in location_patterns:
            location_match = re.search(pattern, text)
            if location_match:
                contact_info['location'] = location_match.group(1).strip() if location_match.lastindex else location_match.group(0).strip()
                break
        
        # Extract name (usually at the beginning of resume)
        lines = text.strip().split('\n')
        for line in lines[:5]:  # Check first 5 lines
            line = line.strip()
            # Name is usually a line with 2-4 capitalized words
            if line and len(line) < 50:
                name_match = re.match(r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$', line)
                if name_match:
                    contact_info['name'] = name_match.group(1)
                    break
        
        return contact_info
    
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
    
    def get_resume_suggestions(self, resume_text: str) -> ResumeSuggestions:
        """Get mock resume improvement suggestions with ATS score"""
        logger.info("Demo: Generating resume suggestions with ATS score")
        time.sleep(1)
        
        # Calculate ATS score using the same logic as production
        ats_score = self._calculate_ats_score(resume_text)
        
        return ResumeSuggestions(
            spelling_errors=[],
            missing_sections=['Professional Summary', 'Certifications'],
            keyword_suggestions=['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
            formatting_tips=['Use bullet points for achievements', 'Add quantifiable metrics'],
            overall_score=ats_score['total_score'],
            summary="Your resume is good but could be improved with more keywords and a professional summary.",
            ats_score=ats_score
        )
    
    def _calculate_ats_score(self, resume_text: str) -> Dict:
        """Calculate comprehensive ATS score"""
        text_lower = resume_text.lower()
        
        # 1. Contact Information Score (10 points)
        contact_score = 0
        contact_details = []
        if re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text):
            contact_score += 3
            contact_details.append('Email found')
        if re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', resume_text):
            contact_score += 3
            contact_details.append('Phone found')
        if 'linkedin' in text_lower:
            contact_score += 2
            contact_details.append('LinkedIn found')
        if re.search(r'github|portfolio|website', text_lower):
            contact_score += 2
            contact_details.append('Portfolio/GitHub found')
        
        # 2. Section Structure Score (20 points)
        section_score = 0
        sections_found = []
        section_checks = {
            'Summary/Objective': ['summary', 'objective', 'profile', 'about'],
            'Experience': ['experience', 'employment', 'work history', 'professional experience'],
            'Education': ['education', 'academic', 'qualification'],
            'Skills': ['skills', 'technical skills', 'competencies', 'expertise'],
            'Projects': ['project', 'portfolio']
        }
        
        for section, keywords in section_checks.items():
            if any(kw in text_lower for kw in keywords):
                section_score += 4
                sections_found.append(section)
        
        # 3. Keywords & Skills Score (25 points)
        keyword_score = 0
        skills_found = []
        technical_keywords = [
            'python', 'java', 'javascript', 'react', 'angular', 'node', 'sql', 'aws',
            'docker', 'kubernetes', 'git', 'agile', 'scrum', 'api', 'database',
            'machine learning', 'data', 'cloud', 'devops', 'ci/cd', 'linux',
            'html', 'css', 'typescript', 'mongodb', 'postgresql', 'redis'
        ]
        
        for keyword in technical_keywords:
            if keyword in text_lower:
                keyword_score += 1
                skills_found.append(keyword.title())
        keyword_score = min(keyword_score, 25)
        
        # 4. Experience Details Score (20 points)
        experience_score = 0
        experience_details = []
        
        # Check for dates (employment history)
        date_patterns = [
            r'\b(19|20)\d{2}\b',
            r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{4}\b',
            r'\b\d{1,2}/\d{4}\b'
        ]
        dates_found = sum(1 for pattern in date_patterns if re.search(pattern, text_lower))
        if dates_found > 0:
            experience_score += 5
            experience_details.append('Employment dates present')
        
        # Check for job titles
        job_titles = ['developer', 'engineer', 'manager', 'analyst', 'designer', 'lead', 
                     'architect', 'consultant', 'specialist', 'coordinator', 'director']
        if any(title in text_lower for title in job_titles):
            experience_score += 5
            experience_details.append('Job titles found')
        
        # Check for company names (capitalized words near experience section)
        if re.search(r'(at|@)\s+[A-Z][a-zA-Z]+', resume_text):
            experience_score += 5
            experience_details.append('Company names found')
        
        # Check for responsibilities/achievements
        action_verbs = ['developed', 'managed', 'led', 'created', 'implemented', 'designed',
                       'built', 'improved', 'increased', 'reduced', 'achieved', 'delivered']
        verbs_found = sum(1 for verb in action_verbs if verb in text_lower)
        if verbs_found >= 3:
            experience_score += 5
            experience_details.append(f'{verbs_found} action verbs used')
        
        # 5. Quantifiable Achievements Score (15 points)
        achievement_score = 0
        achievements = []
        
        # Check for percentages
        percentages = re.findall(r'\d+%', resume_text)
        if percentages:
            achievement_score += 5
            achievements.append(f'{len(percentages)} percentage metrics')
        
        # Check for numbers/metrics
        metrics = re.findall(r'\$[\d,]+|\d+\s*(users|customers|clients|projects|team members|employees)', text_lower)
        if metrics:
            achievement_score += 5
            achievements.append(f'{len(metrics)} quantified results')
        
        # Check for time-based achievements
        time_metrics = re.findall(r'\d+\s*(years?|months?|weeks?|days?|hours?)', text_lower)
        if time_metrics:
            achievement_score += 5
            achievements.append('Time-based metrics found')
        
        # 6. Formatting & Readability Score (10 points)
        format_score = 0
        format_details = []
        
        # Check resume length (ideal: 400-2000 words)
        word_count = len(resume_text.split())
        if 400 <= word_count <= 2000:
            format_score += 4
            format_details.append(f'Good length ({word_count} words)')
        elif 200 <= word_count < 400 or 2000 < word_count <= 3000:
            format_score += 2
            format_details.append(f'Acceptable length ({word_count} words)')
        
        # Check for bullet points
        bullet_count = resume_text.count('•') + resume_text.count('●') + text_lower.count('- ')
        if bullet_count >= 5:
            format_score += 3
            format_details.append(f'{bullet_count} bullet points')
        
        # Check for proper capitalization
        sentences = re.split(r'[.!?]', resume_text)
        proper_caps = sum(1 for s in sentences if s.strip() and s.strip()[0].isupper())
        if proper_caps > len(sentences) * 0.7:
            format_score += 3
            format_details.append('Proper capitalization')
        
        # Calculate total score
        total_score = contact_score + section_score + keyword_score + experience_score + achievement_score + format_score
        
        # Determine grade
        if total_score >= 85:
            grade = 'A'
            grade_description = 'Excellent - Highly ATS optimized'
        elif total_score >= 70:
            grade = 'B'
            grade_description = 'Good - Well optimized for ATS'
        elif total_score >= 55:
            grade = 'C'
            grade_description = 'Average - Needs improvement'
        elif total_score >= 40:
            grade = 'D'
            grade_description = 'Below Average - Significant improvements needed'
        else:
            grade = 'F'
            grade_description = 'Poor - Major revisions required'
        
        return {
            'total_score': total_score,
            'grade': grade,
            'grade_description': grade_description,
            'breakdown': {
                'contact_info': {
                    'score': contact_score,
                    'max': 10,
                    'details': contact_details
                },
                'section_structure': {
                    'score': section_score,
                    'max': 20,
                    'details': sections_found
                },
                'keywords_skills': {
                    'score': keyword_score,
                    'max': 25,
                    'details': skills_found[:10]
                },
                'experience_details': {
                    'score': experience_score,
                    'max': 20,
                    'details': experience_details
                },
                'quantifiable_achievements': {
                    'score': achievement_score,
                    'max': 15,
                    'details': achievements
                },
                'formatting': {
                    'score': format_score,
                    'max': 10,
                    'details': format_details
                }
            }
        }

    def generate_interview_questions(self, resume_text: str, job_description: str, 
                                     required_skills: List[str], candidate_skills: List[str],
                                     experience_years: int) -> List[Dict]:
        """Generate interview questions - delegates to production service logic"""
        # Use the same logic as production service
        prod_service = ProductionAIAnalysisService()
        return prod_service.generate_interview_questions(
            resume_text, job_description, required_skills, candidate_skills, experience_years
        )

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
        contact_info = self._extract_contact_info(resume_text)
        
        reasoning = f"Resume analysis completed. Found {len(skills)} skills, {experience_years} years experience, {education}."
        
        logger.info(f"Resume analysis completed - {len(skills)} skills, {experience_years} years experience")
        
        return AIAnalysisResponse(
            skills=skills,
            experience_years=experience_years,
            education=education,
            matched_skills=[],
            missing_skills=[],
            similarity_score=0,
            reasoning=reasoning,
            contact_info=contact_info
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
            reasoning=reasoning,
            contact_info=self._extract_contact_info(resume_text)
        )
    
    def _extract_contact_info(self, text: str) -> Dict:
        """Extract contact information from resume text"""
        contact_info = {
            'email': '',
            'phone': '',
            'linkedin': '',
            'github': '',
            'portfolio': '',
            'location': '',
            'name': ''
        }
        
        # Extract email
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        if email_match:
            contact_info['email'] = email_match.group(0)
        
        # Extract phone number (various formats)
        phone_patterns = [
            r'\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\+\d{10,12}',
            r'\(\d{3}\)\s*\d{3}[-.\s]?\d{4}',
            r'\d{3}[-.\s]\d{3}[-.\s]\d{4}',
            r'\d{10}'
        ]
        for pattern in phone_patterns:
            phone_match = re.search(pattern, text)
            if phone_match:
                contact_info['phone'] = phone_match.group(0)
                break
        
        # Extract LinkedIn URL
        linkedin_match = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/[\w-]+/?', text, re.IGNORECASE)
        if linkedin_match:
            url = linkedin_match.group(0)
            if not url.startswith('http'):
                url = 'https://' + url
            contact_info['linkedin'] = url
        
        # Extract GitHub URL
        github_match = re.search(r'(?:https?://)?(?:www\.)?github\.com/[\w-]+/?', text, re.IGNORECASE)
        if github_match:
            url = github_match.group(0)
            if not url.startswith('http'):
                url = 'https://' + url
            contact_info['github'] = url
        
        # Extract portfolio/website URL
        portfolio_patterns = [
            r'(?:portfolio|website|site)[\s:]*(?:https?://)?[\w.-]+\.\w+[/\w.-]*',
            r'(?:https?://)?(?:www\.)?[\w-]+\.(?:dev|io|me|com|net|org)/?\b'
        ]
        for pattern in portfolio_patterns:
            portfolio_match = re.search(pattern, text, re.IGNORECASE)
            if portfolio_match and 'linkedin' not in portfolio_match.group(0).lower() and 'github' not in portfolio_match.group(0).lower():
                url = portfolio_match.group(0)
                url = re.sub(r'^(?:portfolio|website|site)[\s:]*', '', url, flags=re.IGNORECASE)
                if not url.startswith('http'):
                    url = 'https://' + url
                contact_info['portfolio'] = url
                break
        
        # Extract location
        location_patterns = [
            r'(?:location|address|based in|residing)[\s:]*([A-Za-z\s,]+(?:,\s*[A-Za-z\s]+)?)',
            r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*(?:[A-Z]{2}|[A-Z][a-z]+))\b'
        ]
        for pattern in location_patterns:
            location_match = re.search(pattern, text)
            if location_match:
                contact_info['location'] = location_match.group(1).strip() if location_match.lastindex else location_match.group(0).strip()
                break
        
        # Extract name (usually at the beginning)
        lines = text.strip().split('\n')
        for line in lines[:5]:
            line = line.strip()
            if line and len(line) < 50:
                name_match = re.match(r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$', line)
                if name_match:
                    contact_info['name'] = name_match.group(1)
                    break
        
        return contact_info
    
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
    
    def get_resume_suggestions(self, resume_text: str) -> ResumeSuggestions:
        """Get AI-powered resume suggestions using Databricks"""
        logger.info("Getting resume suggestions from Databricks AI")
        
        # Try Databricks API first
        if self.api_url and self.token:
            try:
                suggestions = self._get_databricks_suggestions(resume_text)
                if suggestions:
                    return suggestions
            except Exception as e:
                logger.warning(f"Databricks API failed, using fallback: {e}")
        
        # Fallback to smart rule-based suggestions
        return self._get_rule_based_suggestions(resume_text)
    
    def _get_databricks_suggestions(self, resume_text: str) -> ResumeSuggestions:
        """Call Databricks AI for resume suggestions"""
        # Always calculate ATS score locally for accuracy
        ats_score = self._calculate_ats_score(resume_text)
        
        prompt = f"""Analyze this resume and provide improvement suggestions in JSON format:

Resume:
{resume_text[:3000]}

Respond with ONLY valid JSON in this exact format:
{{
    "spelling_errors": [{{"word": "misspelled", "suggestion": "correct", "context": "sentence with error"}}],
    "missing_sections": ["section names that should be added"],
    "keyword_suggestions": ["industry keywords to add"],
    "formatting_tips": ["specific formatting improvements"],
    "overall_score": 75,
    "summary": "Brief overall assessment"
}}"""

        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'messages': [
                {'role': 'system', 'content': 'You are a professional resume reviewer. Analyze resumes and provide actionable improvement suggestions. Always respond with valid JSON only.'},
                {'role': 'user', 'content': prompt}
            ],
            'max_tokens': 1500,
            'temperature': 0.3
        }
        
        url = f"{self.api_url}{self.model_endpoint}/invocations"
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        content = result.get('choices', [{}])[0].get('message', {}).get('content', '{}')
        
        # Parse JSON from response
        try:
            # Clean up response - extract JSON if wrapped in markdown
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0]
            elif '```' in content:
                content = content.split('```')[1].split('```')[0]
            
            data = json.loads(content.strip())
            
            return ResumeSuggestions(
                spelling_errors=data.get('spelling_errors', []),
                missing_sections=data.get('missing_sections', []),
                keyword_suggestions=data.get('keyword_suggestions', []),
                formatting_tips=data.get('formatting_tips', []),
                overall_score=ats_score['total_score'],  # Use calculated ATS score
                summary=data.get('summary', 'Resume analyzed successfully.'),
                ats_score=ats_score  # Include full ATS score breakdown
            )
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Databricks response: {e}")
            raise
    
    def _get_rule_based_suggestions(self, resume_text: str) -> ResumeSuggestions:
        """Generate suggestions using smart rule-based analysis with ATS scoring"""
        text_lower = resume_text.lower()
        
        # Calculate comprehensive ATS score
        ats_score = self._calculate_ats_score(resume_text)
        
        # Check for common spelling errors
        spelling_errors = self._check_spelling(resume_text)
        
        # Check for missing sections
        missing_sections = []
        section_keywords = {
            'Professional Summary': ['summary', 'objective', 'profile', 'about me'],
            'Work Experience': ['experience', 'employment', 'work history'],
            'Education': ['education', 'academic', 'degree', 'university', 'college'],
            'Skills': ['skills', 'technical skills', 'competencies'],
            'Certifications': ['certification', 'certified', 'certificate'],
            'Projects': ['project', 'portfolio'],
            'Contact Information': ['email', 'phone', 'linkedin', 'address']
        }
        
        for section, keywords in section_keywords.items():
            if not any(kw in text_lower for kw in keywords):
                missing_sections.append(section)
        
        # Suggest trending keywords based on what's missing
        keyword_suggestions = []
        trending_keywords = [
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'DevOps',
            'Machine Learning', 'Data Science', 'Python', 'JavaScript', 'React',
            'Node.js', 'Microservices', 'REST API', 'Agile', 'Scrum',
            'Git', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'Redis',
            'TensorFlow', 'PyTorch', 'Deep Learning', 'NLP', 'Computer Vision'
        ]
        
        for keyword in trending_keywords:
            if keyword.lower() not in text_lower:
                keyword_suggestions.append(keyword)
        keyword_suggestions = keyword_suggestions[:8]
        
        # Formatting tips based on ATS analysis
        formatting_tips = []
        
        if ats_score['breakdown']['contact_info']['score'] < 6:
            formatting_tips.append("Add complete contact information: email, phone, and LinkedIn profile.")
        
        if ats_score['breakdown']['section_structure']['score'] < 12:
            formatting_tips.append("Include all essential sections: Summary, Experience, Education, and Skills.")
        
        if ats_score['breakdown']['keywords_skills']['score'] < 15:
            formatting_tips.append("Add more industry-relevant technical keywords and skills.")
        
        if ats_score['breakdown']['experience_details']['score'] < 10:
            formatting_tips.append("Use strong action verbs and include specific job titles and company names.")
        
        if ats_score['breakdown']['quantifiable_achievements']['score'] < 8:
            formatting_tips.append("Add quantifiable achievements (e.g., 'Increased sales by 25%', 'Managed team of 10').")
        
        if ats_score['breakdown']['formatting']['score'] < 6:
            formatting_tips.append("Improve formatting with bullet points and proper structure.")
        
        # Additional tips
        if len(resume_text) < 500:
            formatting_tips.append("Resume appears too short. Add more details about your experience.")
        elif len(resume_text) > 5000:
            formatting_tips.append("Resume may be too long. Consider condensing to 1-2 pages.")
        
        if '@' not in resume_text:
            formatting_tips.append("Ensure your email address is clearly visible.")
        
        if not re.search(r'linkedin\.com|github\.com', text_lower):
            formatting_tips.append("Consider adding LinkedIn or GitHub profile links.")
        
        # Generate summary based on ATS score
        total = ats_score['total_score']
        if total >= 85:
            summary = f"Excellent resume! Your ATS score of {total}/100 indicates strong optimization. Minor tweaks suggested."
        elif total >= 70:
            summary = f"Good resume with ATS score of {total}/100. Some improvements can boost your visibility to recruiters."
        elif total >= 55:
            summary = f"Average ATS score of {total}/100. Focus on adding keywords, metrics, and improving structure."
        elif total >= 40:
            summary = f"Below average ATS score of {total}/100. Significant improvements needed in multiple areas."
        else:
            summary = f"Low ATS score of {total}/100. Major revisions required to pass ATS screening."
        
        return ResumeSuggestions(
            spelling_errors=spelling_errors,
            missing_sections=missing_sections,
            keyword_suggestions=keyword_suggestions,
            formatting_tips=formatting_tips,
            overall_score=total,
            summary=summary,
            ats_score=ats_score
        )
    
    def _calculate_ats_score(self, resume_text: str) -> Dict:
        """Calculate comprehensive ATS (Applicant Tracking System) score
        
        ATS Score Breakdown (100 points total):
        - Contact Information: 10 points
        - Section Structure: 20 points  
        - Keywords & Skills: 25 points
        - Experience Details: 20 points
        - Quantifiable Achievements: 15 points
        - Formatting & Readability: 10 points
        """
        text_lower = resume_text.lower()
        
        # 1. Contact Information Score (10 points)
        contact_score = 0
        contact_details = []
        
        # Email (3 points)
        if re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text):
            contact_score += 3
            contact_details.append('Email found')
        else:
            contact_details.append('Missing email')
        
        # Phone (3 points)
        if re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{10,12}', resume_text):
            contact_score += 3
            contact_details.append('Phone found')
        else:
            contact_details.append('Missing phone')
        
        # LinkedIn (2 points)
        if 'linkedin' in text_lower:
            contact_score += 2
            contact_details.append('LinkedIn found')
        
        # Portfolio/GitHub (2 points)
        if re.search(r'github|portfolio|website|\.com', text_lower):
            contact_score += 2
            contact_details.append('Portfolio/Website found')
        
        # 2. Section Structure Score (20 points)
        section_score = 0
        sections_found = []
        sections_missing = []
        
        section_checks = {
            'Summary/Objective': (['summary', 'objective', 'profile', 'about', 'overview'], 4),
            'Work Experience': (['experience', 'employment', 'work history', 'professional experience', 'career'], 5),
            'Education': (['education', 'academic', 'qualification', 'degree', 'university', 'college'], 4),
            'Skills': (['skills', 'technical skills', 'competencies', 'expertise', 'technologies'], 4),
            'Projects': (['project', 'portfolio', 'achievements'], 3)
        }
        
        for section, (keywords, points) in section_checks.items():
            if any(kw in text_lower for kw in keywords):
                section_score += points
                sections_found.append(section)
            else:
                sections_missing.append(section)
        
        # 3. Keywords & Skills Score (25 points)
        keyword_score = 0
        skills_found = []
        
        # Technical skills (weighted by importance)
        high_value_keywords = {
            'python': 2, 'java': 2, 'javascript': 2, 'react': 2, 'angular': 2,
            'node.js': 2, 'sql': 2, 'aws': 2, 'docker': 2, 'kubernetes': 2,
            'machine learning': 2, 'data science': 2, 'devops': 2
        }
        
        medium_value_keywords = {
            'git': 1, 'agile': 1, 'scrum': 1, 'api': 1, 'rest': 1,
            'mongodb': 1, 'postgresql': 1, 'redis': 1, 'linux': 1,
            'html': 1, 'css': 1, 'typescript': 1, 'ci/cd': 1,
            'azure': 1, 'gcp': 1, 'tensorflow': 1, 'pytorch': 1
        }
        
        for keyword, points in high_value_keywords.items():
            if keyword in text_lower:
                keyword_score += points
                skills_found.append(keyword.title())
        
        for keyword, points in medium_value_keywords.items():
            if keyword in text_lower:
                keyword_score += points
                skills_found.append(keyword.title())
        
        keyword_score = min(keyword_score, 25)
        
        # 4. Experience Details Score (20 points)
        experience_score = 0
        experience_details = []
        
        # Employment dates (5 points)
        date_patterns = [
            r'\b(19|20)\d{2}\s*[-–]\s*(19|20)?\d{2}|present|current\b',
            r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,]+\d{4}\b',
            r'\b\d{1,2}/\d{4}\b'
        ]
        dates_found = sum(1 for pattern in date_patterns if re.search(pattern, text_lower))
        if dates_found > 0:
            experience_score += 5
            experience_details.append('Employment dates present')
        else:
            experience_details.append('Missing employment dates')
        
        # Job titles (5 points)
        job_titles = ['developer', 'engineer', 'manager', 'analyst', 'designer', 'lead', 
                     'architect', 'consultant', 'specialist', 'coordinator', 'director',
                     'intern', 'associate', 'senior', 'junior', 'principal']
        titles_found = [t for t in job_titles if t in text_lower]
        if titles_found:
            experience_score += 5
            experience_details.append(f'Job titles: {", ".join(titles_found[:3])}')
        else:
            experience_details.append('Missing clear job titles')
        
        # Company context (5 points)
        if re.search(r'(at|@|for)\s+[A-Z][a-zA-Z\s]+|inc\.|ltd\.|llc|corp', text_lower):
            experience_score += 5
            experience_details.append('Company names found')
        
        # Action verbs (5 points)
        action_verbs = ['developed', 'managed', 'led', 'created', 'implemented', 'designed',
                       'built', 'improved', 'increased', 'reduced', 'achieved', 'delivered',
                       'launched', 'optimized', 'streamlined', 'coordinated', 'executed']
        verbs_found = [v for v in action_verbs if v in text_lower]
        if len(verbs_found) >= 3:
            experience_score += 5
            experience_details.append(f'{len(verbs_found)} action verbs used')
        elif len(verbs_found) >= 1:
            experience_score += 2
            experience_details.append(f'Only {len(verbs_found)} action verbs - add more')
        else:
            experience_details.append('Missing action verbs')
        
        # 5. Quantifiable Achievements Score (15 points)
        achievement_score = 0
        achievements = []
        
        # Percentages (5 points)
        percentages = re.findall(r'\d+%', resume_text)
        if percentages:
            achievement_score += 5
            achievements.append(f'{len(percentages)} percentage metrics found')
        
        # Dollar amounts or numbers (5 points)
        metrics = re.findall(r'\$[\d,]+[KMB]?|\d+[KMB]\+?|\d+\s*(users|customers|clients|projects|team|members|employees|revenue)', text_lower)
        if metrics:
            achievement_score += 5
            achievements.append(f'{len(metrics)} quantified results')
        
        # Time-based achievements (5 points)
        time_metrics = re.findall(r'(\d+)\s*(years?|months?|weeks?)\s*(ahead|early|faster|reduction)', text_lower)
        if time_metrics:
            achievement_score += 5
            achievements.append('Time-based improvements found')
        elif re.search(r'\d+\s*x\s*(faster|improvement|increase)', text_lower):
            achievement_score += 3
            achievements.append('Multiplier metrics found')
        
        if not achievements:
            achievements.append('No quantifiable achievements - add metrics!')
        
        # 6. Formatting & Readability Score (10 points)
        format_score = 0
        format_details = []
        
        # Resume length (4 points) - ideal: 400-1500 words
        word_count = len(resume_text.split())
        if 400 <= word_count <= 1500:
            format_score += 4
            format_details.append(f'Optimal length ({word_count} words)')
        elif 300 <= word_count < 400 or 1500 < word_count <= 2000:
            format_score += 2
            format_details.append(f'Acceptable length ({word_count} words)')
        else:
            format_details.append(f'Suboptimal length ({word_count} words)')
        
        # Bullet points (3 points)
        bullet_count = resume_text.count('•') + resume_text.count('●') + resume_text.count('○') + text_lower.count('\n- ') + text_lower.count('\n* ')
        if bullet_count >= 8:
            format_score += 3
            format_details.append(f'{bullet_count} bullet points - well structured')
        elif bullet_count >= 4:
            format_score += 2
            format_details.append(f'{bullet_count} bullet points - add more')
        else:
            format_details.append('Few/no bullet points - add structure')
        
        # Proper formatting (3 points)
        lines = resume_text.split('\n')
        non_empty_lines = [l for l in lines if l.strip()]
        if len(non_empty_lines) >= 20:
            format_score += 2
            format_details.append('Good content density')
        
        # Check for ALL CAPS abuse
        caps_words = re.findall(r'\b[A-Z]{4,}\b', resume_text)
        if len(caps_words) < 5:
            format_score += 1
            format_details.append('Proper capitalization')
        else:
            format_details.append('Reduce ALL CAPS usage')
        
        # Calculate total score
        total_score = contact_score + section_score + keyword_score + experience_score + achievement_score + format_score
        
        # Determine grade
        if total_score >= 85:
            grade = 'A'
            grade_description = 'Excellent - Highly ATS optimized, likely to pass most systems'
        elif total_score >= 70:
            grade = 'B'
            grade_description = 'Good - Well optimized, should pass most ATS systems'
        elif total_score >= 55:
            grade = 'C'
            grade_description = 'Average - May pass basic ATS, needs improvement'
        elif total_score >= 40:
            grade = 'D'
            grade_description = 'Below Average - Likely to be filtered out by ATS'
        else:
            grade = 'F'
            grade_description = 'Poor - Will likely fail ATS screening'
        
        return {
            'total_score': total_score,
            'grade': grade,
            'grade_description': grade_description,
            'breakdown': {
                'contact_info': {
                    'score': contact_score,
                    'max': 10,
                    'label': 'Contact Information',
                    'details': contact_details
                },
                'section_structure': {
                    'score': section_score,
                    'max': 20,
                    'label': 'Section Structure',
                    'details': sections_found if sections_found else ['Missing key sections']
                },
                'keywords_skills': {
                    'score': keyword_score,
                    'max': 25,
                    'label': 'Keywords & Skills',
                    'details': skills_found[:10] if skills_found else ['No technical keywords found']
                },
                'experience_details': {
                    'score': experience_score,
                    'max': 20,
                    'label': 'Experience Details',
                    'details': experience_details
                },
                'quantifiable_achievements': {
                    'score': achievement_score,
                    'max': 15,
                    'label': 'Quantifiable Achievements',
                    'details': achievements
                },
                'formatting': {
                    'score': format_score,
                    'max': 10,
                    'label': 'Formatting & Readability',
                    'details': format_details
                }
            }
        }
    
    def _check_spelling(self, text: str) -> List[Dict]:
        """Check for common spelling errors in resume"""
        common_errors = {
            'teh': 'the', 'recieve': 'receive', 'occured': 'occurred',
            'seperate': 'separate', 'definately': 'definitely', 'accomodate': 'accommodate',
            'occurence': 'occurrence', 'refered': 'referred', 'managment': 'management',
            'developement': 'development', 'enviroment': 'environment', 'responsibilites': 'responsibilities',
            'proffesional': 'professional', 'experiance': 'experience', 'acheive': 'achieve',
            'beleive': 'believe', 'calender': 'calendar', 'collegue': 'colleague',
            'commited': 'committed', 'comunication': 'communication', 'concious': 'conscious',
            'consistant': 'consistent', 'decison': 'decision', 'diffrent': 'different',
            'efficent': 'efficient', 'excellant': 'excellent', 'familar': 'familiar',
            'goverment': 'government', 'immediatly': 'immediately', 'independant': 'independent',
            'knowlege': 'knowledge', 'liason': 'liaison', 'maintainance': 'maintenance',
            'neccessary': 'necessary', 'noticable': 'noticeable', 'occassion': 'occasion',
            'paralel': 'parallel', 'persistant': 'persistent', 'posession': 'possession',
            'prefered': 'preferred', 'priviledge': 'privilege', 'recomend': 'recommend',
            'relevent': 'relevant', 'succesful': 'successful', 'tommorow': 'tomorrow',
            'untill': 'until', 'wierd': 'weird', 'writting': 'writing'
        }
        
        errors = []
        words = re.findall(r'\b\w+\b', text.lower())
        
        for word in words:
            if word in common_errors:
                # Find context
                pattern = re.compile(r'.{0,30}' + re.escape(word) + r'.{0,30}', re.IGNORECASE)
                match = pattern.search(text)
                context = match.group(0) if match else word
                
                errors.append({
                    'word': word,
                    'suggestion': common_errors[word],
                    'context': f"...{context}..."
                })
        
        return errors[:10]  # Limit to 10 errors
    
    def generate_interview_questions(self, resume_text: str, job_description: str, 
                                     required_skills: List[str], candidate_skills: List[str],
                                     experience_years: int) -> List[Dict]:
        """Generate AI-powered interview questions based on candidate profile and job requirements"""
        logger.info("Generating interview questions")
        
        questions = []
        
        # 1. Technical Skills Questions (based on matched skills)
        matched_skills = [s for s in candidate_skills if any(
            s.lower() in req.lower() or req.lower() in s.lower() 
            for req in required_skills
        )]
        
        # Shuffle matched skills for variety on refresh
        import random
        shuffled_skills = matched_skills.copy()
        random.shuffle(shuffled_skills)
        
        skill_questions = self._generate_skill_questions(shuffled_skills, experience_years)
        questions.extend(skill_questions)
        
        # 2. Experience-based Questions
        exp_questions = self._generate_experience_questions(resume_text, experience_years)
        questions.extend(exp_questions)
        
        # 3. Job-specific Questions
        job_questions = self._generate_job_questions(job_description, required_skills)
        questions.extend(job_questions)
        
        # 4. Behavioral Questions
        behavioral_questions = self._generate_behavioral_questions(experience_years)
        questions.extend(behavioral_questions)
        
        # 5. Gap Analysis Questions (for missing skills)
        missing_skills = [s for s in required_skills if not any(
            s.lower() in cs.lower() or cs.lower() in s.lower() 
            for cs in candidate_skills
        )]
        if missing_skills:
            random.shuffle(missing_skills)
            gap_questions = self._generate_gap_questions(missing_skills)
            questions.extend(gap_questions)
        
        # Shuffle all questions for variety
        random.shuffle(questions)
        
        return questions[:15]  # Return top 15 questions
    
    def _generate_skill_questions(self, skills: List[str], experience_years: int) -> List[Dict]:
        """Generate technical questions based on candidate's skills"""
        import random
        questions = []
        
        # Multiple questions per skill for variety on refresh
        skill_question_templates = {
            'python': [
                {
                    'question': "Can you explain the difference between lists and tuples in Python? When would you use each?",
                    'expected_answer': "Lists are mutable (can be modified), tuples are immutable. Use tuples for fixed data like coordinates, database records. Use lists when you need to modify the collection.",
                    'difficulty': 'Medium'
                },
                {
                    'question': "What are Python decorators and how would you use them?",
                    'expected_answer': "Decorators are functions that modify the behavior of other functions. They use @decorator syntax. Common uses: logging, authentication, caching, timing. They wrap functions to add functionality without modifying the original code.",
                    'difficulty': 'Medium'
                },
                {
                    'question': "Explain the Global Interpreter Lock (GIL) in Python. How does it affect multithreading?",
                    'expected_answer': "GIL is a mutex that allows only one thread to execute Python bytecode at a time. It affects CPU-bound multithreading performance. Use multiprocessing for CPU-bound tasks, threading for I/O-bound tasks.",
                    'difficulty': 'Hard'
                }
            ],
            'java': [
                {
                    'question': "Explain the concept of garbage collection in Java. How does it work?",
                    'expected_answer': "Garbage collection automatically manages memory by identifying and removing objects no longer in use. JVM uses algorithms like Mark-and-Sweep to find unreachable objects and free their memory.",
                    'difficulty': 'Medium'
                },
                {
                    'question': "What is the difference between abstract classes and interfaces in Java?",
                    'expected_answer': "Abstract classes can have implemented methods and state, single inheritance. Interfaces define contracts with default methods (Java 8+), multiple inheritance. Use abstract for 'is-a' relationships, interfaces for 'can-do' capabilities.",
                    'difficulty': 'Medium'
                },
                {
                    'question': "Explain Java's memory model and the difference between stack and heap.",
                    'expected_answer': "Stack stores method calls and local variables (fast, LIFO). Heap stores objects and instance variables (slower, garbage collected). Primitives on stack, objects on heap with references on stack.",
                    'difficulty': 'Hard'
                }
            ],
            'javascript': [
                {
                    'question': "What is the difference between 'let', 'const', and 'var' in JavaScript?",
                    'expected_answer': "'var' is function-scoped and hoisted. 'let' is block-scoped and not hoisted. 'const' is block-scoped and cannot be reassigned. Modern JS prefers 'const' by default, 'let' when reassignment needed.",
                    'difficulty': 'Easy'
                },
                {
                    'question': "Explain closures in JavaScript with an example use case.",
                    'expected_answer': "A closure is a function that remembers its outer scope even after the outer function returns. Use cases: data privacy, function factories, callbacks. Inner function 'closes over' outer variables.",
                    'difficulty': 'Medium'
                },
                {
                    'question': "What is the difference between == and === in JavaScript?",
                    'expected_answer': "== performs type coercion before comparison (loose equality). === compares both value and type without coercion (strict equality). Always prefer === to avoid unexpected type conversions.",
                    'difficulty': 'Easy'
                }
            ],
            'react': [
                {
                    'question': "Explain the concept of React hooks. What problems do they solve?",
                    'expected_answer': "Hooks allow using state and lifecycle features in functional components. They solve code reuse issues, complex component hierarchies, and confusing class components. Common hooks: useState, useEffect, useContext.",
                    'difficulty': 'Medium'
                },
                {
                    'question': "What is the Virtual DOM and how does React use it for performance?",
                    'expected_answer': "Virtual DOM is a lightweight copy of the real DOM. React compares virtual DOM changes (diffing), calculates minimal updates needed, and batches real DOM updates. This reduces expensive DOM operations.",
                    'difficulty': 'Medium'
                },
                {
                    'question': "Explain the useEffect hook and its cleanup function.",
                    'expected_answer': "useEffect handles side effects in functional components (data fetching, subscriptions, DOM manipulation). Cleanup function runs before component unmounts or before next effect. Return cleanup function to prevent memory leaks.",
                    'difficulty': 'Medium'
                }
            ],
            'node.js': [
                {
                    'question': "How does Node.js handle asynchronous operations? Explain the event loop.",
                    'expected_answer': "Node.js uses a single-threaded event loop with non-blocking I/O. The event loop processes callbacks from the callback queue when the call stack is empty. This enables handling many concurrent connections efficiently.",
                    'difficulty': 'Medium'
                },
                {
                    'question': "What is the difference between process.nextTick() and setImmediate()?",
                    'expected_answer': "process.nextTick() executes before the event loop continues (microtask queue). setImmediate() executes in the check phase of the event loop. nextTick has higher priority but can starve I/O if overused.",
                    'difficulty': 'Hard'
                }
            ],
            'sql': [
                {
                    'question': "What is the difference between INNER JOIN and LEFT JOIN? Give an example use case.",
                    'expected_answer': "INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from left table plus matching rows from right (NULL if no match). Use LEFT JOIN when you need all records from one table regardless of matches.",
                    'difficulty': 'Easy'
                },
                {
                    'question': "Explain database indexing. When would you create an index?",
                    'expected_answer': "Indexes speed up data retrieval by creating a sorted data structure. Create indexes on frequently queried columns, WHERE clause columns, JOIN columns. Avoid over-indexing as it slows writes and uses storage.",
                    'difficulty': 'Medium'
                },
                {
                    'question': "What is database normalization? Explain the first three normal forms.",
                    'expected_answer': "Normalization reduces data redundancy. 1NF: atomic values, no repeating groups. 2NF: 1NF + no partial dependencies. 3NF: 2NF + no transitive dependencies. Balance normalization with query performance needs.",
                    'difficulty': 'Medium'
                }
            ],
            'docker': [
                {
                    'question': "What is the difference between a Docker image and a container?",
                    'expected_answer': "An image is a read-only template with instructions for creating a container. A container is a runnable instance of an image. Images are built from Dockerfiles, containers are created from images.",
                    'difficulty': 'Easy'
                },
                {
                    'question': "How do you optimize Docker image size?",
                    'expected_answer': "Use multi-stage builds, smaller base images (alpine), combine RUN commands, remove unnecessary files, use .dockerignore, avoid installing dev dependencies in production images.",
                    'difficulty': 'Medium'
                }
            ],
            'kubernetes': [
                {
                    'question': "Explain the concept of Pods in Kubernetes. Why not just use containers directly?",
                    'expected_answer': "A Pod is the smallest deployable unit, containing one or more containers that share storage and network. Pods provide abstraction for co-located containers, shared resources, and lifecycle management that raw containers don't offer.",
                    'difficulty': 'Medium'
                },
                {
                    'question': "What is the difference between a Deployment and a StatefulSet?",
                    'expected_answer': "Deployments manage stateless applications with interchangeable pods. StatefulSets manage stateful applications with stable network identities, persistent storage, and ordered deployment/scaling. Use StatefulSets for databases.",
                    'difficulty': 'Hard'
                }
            ],
            'aws': [
                {
                    'question': "Describe a scenario where you would use AWS Lambda vs EC2.",
                    'expected_answer': "Use Lambda for event-driven, short-running tasks (API endpoints, file processing) - pay per execution, auto-scales. Use EC2 for long-running processes, specific OS requirements, or when you need persistent state.",
                    'difficulty': 'Medium'
                },
                {
                    'question': "Explain the difference between S3 storage classes and when to use each.",
                    'expected_answer': "Standard: frequently accessed. Intelligent-Tiering: unknown patterns. Standard-IA: infrequent access. Glacier: archival (minutes to hours retrieval). Glacier Deep Archive: long-term archive (12+ hours). Choose based on access patterns and cost.",
                    'difficulty': 'Medium'
                }
            ],
            'machine learning': [
                {
                    'question': "Explain the difference between supervised and unsupervised learning with examples.",
                    'expected_answer': "Supervised learning uses labeled data to predict outcomes (spam detection, price prediction). Unsupervised learning finds patterns in unlabeled data (customer segmentation, anomaly detection). Semi-supervised combines both.",
                    'difficulty': 'Medium'
                },
                {
                    'question': "What is overfitting and how do you prevent it?",
                    'expected_answer': "Overfitting is when a model learns training data too well, including noise, and performs poorly on new data. Prevent with: cross-validation, regularization (L1/L2), dropout, early stopping, more training data, simpler models.",
                    'difficulty': 'Medium'
                }
            ],
            'git': [
                {
                    'question': "How would you resolve a merge conflict in Git? Walk me through the process.",
                    'expected_answer': "1) Pull latest changes, 2) Git marks conflicts in files, 3) Open files and manually resolve conflicts between <<<< and >>>> markers, 4) Stage resolved files with git add, 5) Complete merge with git commit.",
                    'difficulty': 'Easy'
                },
                {
                    'question': "What is the difference between git merge and git rebase?",
                    'expected_answer': "Merge creates a new commit combining branches, preserving history. Rebase moves commits to a new base, creating linear history. Use merge for shared branches, rebase for local cleanup before pushing.",
                    'difficulty': 'Medium'
                }
            ],
            'rest api': [
                {
                    'question': "What are the key principles of RESTful API design?",
                    'expected_answer': "Stateless communication, uniform interface (HTTP methods), resource-based URLs, proper status codes, HATEOAS (hypermedia links). Use nouns for resources, HTTP verbs for actions, proper versioning.",
                    'difficulty': 'Medium'
                },
                {
                    'question': "How do you handle API versioning and why is it important?",
                    'expected_answer': "Versioning allows API evolution without breaking clients. Methods: URL path (/v1/), query param (?version=1), header (Accept-Version). URL path is most common. Important for backward compatibility and gradual migration.",
                    'difficulty': 'Medium'
                }
            ],
            'mongodb': [
                {
                    'question': "When would you choose MongoDB over a relational database?",
                    'expected_answer': "Choose MongoDB for: flexible/evolving schemas, document-oriented data, horizontal scaling needs, rapid development. Choose relational for: complex transactions, strict data integrity, complex joins, ACID compliance.",
                    'difficulty': 'Medium'
                },
                {
                    'question': "Explain MongoDB's aggregation pipeline with an example.",
                    'expected_answer': "Aggregation pipeline processes documents through stages: $match (filter), $group (aggregate), $sort, $project (reshape), $lookup (join). Example: group sales by product, calculate totals, sort by revenue.",
                    'difficulty': 'Medium'
                }
            ],
            'agile': [
                {
                    'question': "Describe your experience with Agile methodology. How do you handle changing requirements?",
                    'expected_answer': "Agile embraces change through iterative development, sprint planning, daily standups, and retrospectives. Handle changes by prioritizing backlog, breaking into smaller stories, and maintaining communication with stakeholders.",
                    'difficulty': 'Easy'
                },
                {
                    'question': "What is the difference between Scrum and Kanban?",
                    'expected_answer': "Scrum uses fixed sprints, defined roles (Scrum Master, PO), sprint planning/review. Kanban uses continuous flow, WIP limits, no fixed iterations. Scrum for predictable delivery, Kanban for continuous delivery and support.",
                    'difficulty': 'Easy'
                }
            ]
        }
        
        for skill in skills[:5]:  # Limit to 5 skill questions
            skill_lower = skill.lower()
            for key, q_list in skill_question_templates.items():
                if key in skill_lower or skill_lower in key:
                    # Randomly select one question from the list
                    q_data = random.choice(q_list)
                    questions.append({
                        'question': q_data['question'],
                        'expected_answer': q_data['expected_answer'],
                        'difficulty': q_data['difficulty'],
                        'category': 'Technical',
                        'skill': skill
                    })
                    break
        
        return questions
    
    def _generate_experience_questions(self, resume_text: str, experience_years: int) -> List[Dict]:
        """Generate questions based on experience level"""
        questions = []
        
        if experience_years >= 5:
            questions.append({
                'question': "Describe a complex technical challenge you faced and how you led your team to solve it.",
                'expected_answer': "Look for: clear problem definition, leadership approach, technical decision-making, team coordination, measurable outcome. Senior candidates should demonstrate strategic thinking and mentorship.",
                'difficulty': 'Hard',
                'category': 'Experience',
                'skill': 'Leadership'
            })
            questions.append({
                'question': "How do you approach system design for scalability? Give a specific example.",
                'expected_answer': "Should cover: load balancing, caching strategies, database sharding, microservices, async processing. Look for real-world examples with specific numbers (users, requests/sec).",
                'difficulty': 'Hard',
                'category': 'Technical',
                'skill': 'System Design'
            })
        elif experience_years >= 2:
            questions.append({
                'question': "Tell me about a project where you had to learn a new technology quickly. How did you approach it?",
                'expected_answer': "Look for: structured learning approach, documentation reading, hands-on practice, seeking help when needed, applying knowledge to solve real problems.",
                'difficulty': 'Medium',
                'category': 'Experience',
                'skill': 'Learning Ability'
            })
        else:
            questions.append({
                'question': "What personal or academic projects have you worked on? What did you learn?",
                'expected_answer': "Look for: passion for technology, self-initiative, problem-solving approach, willingness to learn, understanding of fundamentals.",
                'difficulty': 'Easy',
                'category': 'Experience',
                'skill': 'Initiative'
            })
        
        return questions
    
    def _generate_job_questions(self, job_description: str, required_skills: List[str]) -> List[Dict]:
        """Generate questions specific to the job requirements"""
        questions = []
        job_lower = job_description.lower()
        
        if 'team' in job_lower or 'collaborate' in job_lower:
            questions.append({
                'question': "Describe your experience working in a team environment. How do you handle disagreements?",
                'expected_answer': "Look for: communication skills, respect for others' opinions, conflict resolution, focus on team goals over personal preferences, examples of successful collaboration.",
                'difficulty': 'Medium',
                'category': 'Behavioral',
                'skill': 'Teamwork'
            })
        
        if 'deadline' in job_lower or 'fast-paced' in job_lower:
            questions.append({
                'question': "How do you prioritize tasks when facing multiple deadlines?",
                'expected_answer': "Look for: prioritization frameworks (urgency/importance matrix), communication with stakeholders, breaking down tasks, time management techniques, handling pressure.",
                'difficulty': 'Medium',
                'category': 'Behavioral',
                'skill': 'Time Management'
            })
        
        if 'customer' in job_lower or 'client' in job_lower:
            questions.append({
                'question': "Tell me about a time you had to explain a technical concept to a non-technical stakeholder.",
                'expected_answer': "Look for: ability to simplify complex concepts, use of analogies, patience, checking for understanding, adapting communication style.",
                'difficulty': 'Medium',
                'category': 'Communication',
                'skill': 'Communication'
            })
        
        return questions
    
    def _generate_behavioral_questions(self, experience_years: int) -> List[Dict]:
        """Generate behavioral/situational questions"""
        import random
        
        all_behavioral_questions = [
            {
                'question': "Tell me about a time when you made a mistake at work. How did you handle it?",
                'expected_answer': "Look for: ownership of mistake, quick action to fix, communication with affected parties, learning from the experience, preventive measures implemented.",
                'difficulty': 'Medium',
                'category': 'Behavioral',
                'skill': 'Accountability'
            },
            {
                'question': "Describe a situation where you had to work with limited resources or tight constraints.",
                'expected_answer': "Look for: creativity, prioritization, resourcefulness, communication about constraints, delivering value despite limitations.",
                'difficulty': 'Medium',
                'category': 'Behavioral',
                'skill': 'Problem Solving'
            },
            {
                'question': "Tell me about a time you received critical feedback. How did you respond?",
                'expected_answer': "Look for: openness to feedback, emotional maturity, concrete actions taken to improve, follow-up with feedback giver, growth mindset.",
                'difficulty': 'Medium',
                'category': 'Behavioral',
                'skill': 'Growth Mindset'
            },
            {
                'question': "Describe a situation where you had to meet a tight deadline. What was your approach?",
                'expected_answer': "Look for: prioritization, time management, communication with stakeholders, quality vs speed tradeoffs, stress management.",
                'difficulty': 'Medium',
                'category': 'Behavioral',
                'skill': 'Time Management'
            },
            {
                'question': "Tell me about a time you disagreed with a colleague or manager. How did you handle it?",
                'expected_answer': "Look for: respectful communication, focus on facts not emotions, willingness to understand other perspectives, finding common ground, professional resolution.",
                'difficulty': 'Medium',
                'category': 'Behavioral',
                'skill': 'Conflict Resolution'
            },
            {
                'question': "Describe a project that didn't go as planned. What did you learn from it?",
                'expected_answer': "Look for: honest assessment of what went wrong, personal accountability, lessons learned, changes implemented for future projects.",
                'difficulty': 'Medium',
                'category': 'Behavioral',
                'skill': 'Learning from Failure'
            }
        ]
        
        if experience_years >= 3:
            all_behavioral_questions.extend([
                {
                    'question': "Have you ever had to push back on a requirement? How did you handle it?",
                    'expected_answer': "Look for: professional communication, data-driven arguments, proposing alternatives, understanding business needs while advocating for technical best practices.",
                    'difficulty': 'Medium',
                    'category': 'Behavioral',
                    'skill': 'Communication'
                },
                {
                    'question': "Tell me about a time you mentored or helped a junior team member.",
                    'expected_answer': "Look for: patience, teaching ability, investment in others' growth, specific examples of guidance provided, measurable improvement in mentee.",
                    'difficulty': 'Medium',
                    'category': 'Behavioral',
                    'skill': 'Mentorship'
                }
            ])
        
        # Randomly select 2 behavioral questions
        random.shuffle(all_behavioral_questions)
        return all_behavioral_questions[:2]
    
    def _generate_gap_questions(self, missing_skills: List[str]) -> List[Dict]:
        """Generate questions about skills the candidate may be missing"""
        questions = []
        
        for skill in missing_skills[:2]:  # Limit to 2 gap questions
            questions.append({
                'question': f"This role requires {skill}. While it's not prominent in your resume, do you have any experience with it?",
                'expected_answer': f"Look for: any related experience, willingness to learn, transferable skills, concrete plan to acquire the skill if hired.",
                'difficulty': 'Medium',
                'category': 'Gap Analysis',
                'skill': skill
            })
        
        return questions


def get_ai_service() -> AIAnalysisInterface:
    """Factory function to get appropriate AI service"""
    app_mode = os.getenv('APP_MODE', 'demo')
    
    if app_mode == 'demo':
        return DemoAIAnalysisService()
    else:
        return ProductionAIAnalysisService()