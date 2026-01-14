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
    """Production AI service - uses Databricks LLM with fallback to rule-based analysis"""
    
    def __init__(self):
        self.api_url = os.getenv('DATABRICKS_API_URL')
        self.token = os.getenv('DATABRICKS_TOKEN')
        self.model_endpoint = os.getenv('DATABRICKS_MODEL_ENDPOINT')
        
        if self.api_url and self.token and self.model_endpoint:
            logger.info("Production AI Service initialized with Databricks LLM")
        else:
            logger.warning("Databricks credentials not fully configured, using fallback analysis")
    
    def _call_databricks_llm(self, prompt: str, system_prompt: str = None, max_tokens: int = 2000) -> str:
        """Call Databricks LLM API and return the response text"""
        if not self.api_url or not self.token or not self.model_endpoint:
            return None
        
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        messages = []
        if system_prompt:
            messages.append({'role': 'system', 'content': system_prompt})
        messages.append({'role': 'user', 'content': prompt})
        
        payload = {
            'messages': messages,
            'max_tokens': max_tokens,
            'temperature': 0.3
        }
        
        try:
            url = f"{self.api_url}{self.model_endpoint}/invocations"
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            response.raise_for_status()
            
            result = response.json()
            content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            return content
        except Exception as e:
            logger.error(f"Databricks LLM call failed: {e}")
            return None
    
    def _parse_json_response(self, response_text: str) -> Any:
        """Parse JSON from LLM response, handling markdown code blocks"""
        if not response_text:
            return None
        
        try:
            text = response_text.strip()
            
            # Remove markdown code blocks if present
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0]
            elif '```' in text:
                text = text.split('```')[1].split('```')[0]
            
            return json.loads(text.strip())
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {e}")
            
            # Try to extract JSON from response
            try:
                json_match = re.search(r'[\[{].*[\]}]', response_text, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
            except:
                pass
            
            return None
    
    def analyze_resume(self, resume_text: str) -> AIAnalysisResponse:
        """Analyze resume using Databricks LLM with fallback"""
        logger.info(f"Analyzing resume text (length: {len(resume_text)})")
        
        # Try Databricks LLM first
        prompt = f"""Analyze this resume and extract information. Return ONLY valid JSON with no markdown formatting.

Resume Text:
{resume_text[:4000]}

Return JSON in this exact format:
{{
    "skills": ["skill1", "skill2", "skill3"],
    "experience_years": 5,
    "education": "Bachelor's Degree in Computer Science",
    "contact_info": {{
        "email": "email@example.com",
        "phone": "+1234567890",
        "linkedin": "linkedin.com/in/username",
        "github": "github.com/username",
        "location": "City, Country",
        "name": "Full Name"
    }},
    "summary": "Brief professional summary"
}}

Rules:
- Extract ALL technical and soft skills mentioned
- Calculate total years of experience from work history
- Identify highest education level
- Extract contact information if present (leave empty string if not found)
- Be accurate and thorough"""

        system_prompt = "You are an expert resume analyzer. Extract information accurately and return valid JSON only."
        
        response = self._call_databricks_llm(prompt, system_prompt)
        result = self._parse_json_response(response)
        
        if result:
            logger.info("Resume analyzed using Databricks LLM")
            return AIAnalysisResponse(
                skills=result.get('skills', []),
                experience_years=result.get('experience_years', 0),
                education=result.get('education', ''),
                matched_skills=[],
                missing_skills=[],
                similarity_score=0,
                reasoning=result.get('summary', 'Resume analyzed successfully'),
                contact_info=result.get('contact_info', {})
            )
        
        # Fallback to rule-based extraction
        logger.info("Using fallback rule-based resume analysis")
        skills = self._extract_skills_from_text(resume_text)
        experience_years = self._estimate_experience(resume_text)
        education = self._estimate_education(resume_text)
        contact_info = self._extract_contact_info(resume_text)
        
        reasoning = f"Resume analysis completed. Found {len(skills)} skills, {experience_years} years experience, {education}."
        
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
        """Analyze resume for job using Databricks LLM with fallback"""
        logger.info(f"Performing job matching for {len(required_skills)} required skills")
        
        skills_str = ", ".join(required_skills) if required_skills else "Not specified"
        
        # Try Databricks LLM first
        prompt = f"""Analyze this resume against the job requirements. Return ONLY valid JSON.

RESUME:
{resume_text[:3000]}

JOB DESCRIPTION:
{job_description[:1500]}

REQUIRED SKILLS: {skills_str}

Return JSON in this exact format:
{{
    "skills": ["all", "candidate", "skills"],
    "experience_years": 5,
    "education": "Highest education level",
    "matched_skills": ["skills", "that", "match", "requirements"],
    "missing_skills": ["required", "skills", "candidate", "lacks"],
    "similarity_score": 75.5,
    "reasoning": "Detailed explanation of match quality and recommendations"
}}

Rules:
- similarity_score should be 0-100 based on overall fit
- matched_skills are skills from required_skills that candidate has
- missing_skills are skills from required_skills that candidate lacks
- Be thorough in skill matching (consider synonyms and related technologies)
- Provide actionable reasoning"""

        system_prompt = "You are an expert recruiter analyzing candidate fit. Be thorough and accurate. Return valid JSON only."
        
        response = self._call_databricks_llm(prompt, system_prompt)
        result = self._parse_json_response(response)
        
        if result:
            logger.info("Job matching completed using Databricks LLM")
            return AIAnalysisResponse(
                skills=result.get('skills', []),
                experience_years=result.get('experience_years', 0),
                education=result.get('education', ''),
                matched_skills=result.get('matched_skills', []),
                missing_skills=result.get('missing_skills', []),
                similarity_score=result.get('similarity_score', 0),
                reasoning=result.get('reasoning', ''),
                contact_info=self._extract_contact_info(resume_text)
            )
        
        # Fallback to rule-based matching
        logger.info("Using fallback rule-based job matching")
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
        """Get AI-powered resume suggestions using Databricks LLM with fallback"""
        logger.info("Getting resume suggestions")
        
        # Always calculate ATS score locally for accuracy
        ats_score = self._calculate_ats_score(resume_text)
        
        # Try Databricks LLM
        prompt = f"""Analyze this resume and provide improvement suggestions. Return ONLY valid JSON.

Resume:
{resume_text[:3500]}

Return JSON in this exact format:
{{
    "spelling_errors": [
        {{"word": "misspelled_word", "suggestion": "correct_word", "context": "sentence containing error"}}
    ],
    "grammar_errors": [
        {{"error": "description of error", "suggestion": "how to fix it"}}
    ],
    "missing_sections": ["section names that should be added"],
    "keyword_suggestions": ["industry keywords to add for better ATS"],
    "formatting_tips": ["specific formatting improvements"],
    "content_improvements": ["suggestions to improve content quality"],
    "summary": "Overall assessment and top 3 priorities for improvement"
}}

Rules:
- Check for actual spelling mistakes (not technical terms)
- Identify grammar issues
- Suggest missing standard resume sections
- Recommend relevant industry keywords
- Be specific and actionable in suggestions"""

        system_prompt = "You are a professional resume reviewer. Analyze resumes and provide actionable improvement suggestions. Return valid JSON only."
        
        response = self._call_databricks_llm(prompt, system_prompt)
        result = self._parse_json_response(response)
        
        if result:
            logger.info("Resume suggestions generated using Databricks LLM")
            return ResumeSuggestions(
                spelling_errors=result.get('spelling_errors', []),
                missing_sections=result.get('missing_sections', []),
                keyword_suggestions=result.get('keyword_suggestions', []),
                formatting_tips=result.get('formatting_tips', []) + result.get('content_improvements', []),
                overall_score=ats_score['total_score'],
                summary=result.get('summary', ''),
                ats_score=ats_score
            )
        
        # Fallback to smart rule-based suggestions
        logger.info("Using fallback rule-based suggestions")
        return self._get_rule_based_suggestions(resume_text)
    
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
        """Generate AI-powered interview questions using Databricks LLM only"""
        logger.info("Generating interview questions using Databricks LLM")
        
        skills_str = ", ".join(candidate_skills[:15]) if candidate_skills else "Not specified"
        required_str = ", ".join(required_skills) if required_skills else "Not specified"
        
        # Identify skill gaps
        missing_skills = [s for s in required_skills if not any(
            s.lower() in cs.lower() or cs.lower() in s.lower() 
            for cs in candidate_skills
        )]
        missing_str = ", ".join(missing_skills) if missing_skills else "None"
        
        prompt = f"""You are an expert technical interviewer. Generate personalized interview questions for this specific candidate.

CANDIDATE PROFILE:
- Years of Experience: {experience_years}
- Candidate Skills: {skills_str}
- Resume Content: {resume_text[:2500]}

JOB REQUIREMENTS:
- Job Description: {job_description[:1200]}
- Required Skills: {required_str}
- Skills Gap (candidate is missing): {missing_str}

INSTRUCTIONS:
Generate 12-15 unique, thoughtful interview questions tailored to THIS specific candidate. 

Question Categories to Include:
1. TECHNICAL (5-6 questions): Deep-dive questions on candidate's listed skills. Ask about specific technologies they know.
2. BEHAVIORAL (3-4 questions): Situational questions appropriate for their experience level ({experience_years} years).
3. EXPERIENCE (2-3 questions): Questions about their past work, projects, and achievements mentioned in resume.
4. GAP ANALYSIS (1-2 questions): Questions about skills they're missing but the job requires: {missing_str}

For each question provide:
- A specific, non-generic question
- Expected answer points the interviewer should look for
- Difficulty level based on candidate's experience
- Category and related skill

Return ONLY a valid JSON array with this exact structure:
[
    {{
        "question": "Your specific interview question here",
        "expected_answer": "Key points to look for in a good answer",
        "difficulty": "Easy|Medium|Hard",
        "category": "Technical|Behavioral|Experience|Gap Analysis",
        "skill": "Related skill or competency"
    }}
]

IMPORTANT: 
- Questions must be SPECIFIC to this candidate's background, not generic
- Technical questions should reference actual skills from their resume
- Adjust difficulty based on {experience_years} years of experience
- Expected answers should help the interviewer evaluate responses
- Return ONLY the JSON array, no other text"""

        system_prompt = "You are a senior technical interviewer with expertise in software engineering hiring. Generate highly relevant, personalized interview questions. Always return valid JSON array only."
        
        response = self._call_databricks_llm(prompt, system_prompt, max_tokens=4000)
        result = self._parse_json_response(response)
        
        if result and isinstance(result, list) and len(result) > 0:
            logger.info(f"Generated {len(result)} questions using Databricks LLM")
            return result
        
        # If Databricks fails, return error message as a question to indicate the issue
        logger.error("Databricks LLM failed to generate interview questions")
        return [{
            "question": "Unable to generate AI-powered questions at this time. Please try again.",
            "expected_answer": "System is experiencing issues connecting to AI service.",
            "difficulty": "N/A",
            "category": "System",
            "skill": "N/A"
        }]


def get_ai_service() -> AIAnalysisInterface:
    """Factory function to get appropriate AI service"""
    app_mode = os.getenv('APP_MODE', 'demo')
    
    if app_mode == 'demo':
        return DemoAIAnalysisService()
    else:
        return ProductionAIAnalysisService()