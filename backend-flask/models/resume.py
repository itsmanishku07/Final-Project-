"""
Resume model for Firebase Firestore
Represents resume entities and AI analysis results
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
import uuid

class ContactInfo:
    """Contact information extracted from resume"""
    
    def __init__(self, email: str = '', phone: str = '', linkedin: str = '', 
                 github: str = '', portfolio: str = '', location: str = '', name: str = ''):
        self.email = email
        self.phone = phone
        self.linkedin = linkedin
        self.github = github
        self.portfolio = portfolio
        self.location = location
        self.name = name
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'email': self.email,
            'phone': self.phone,
            'linkedin': self.linkedin,
            'github': self.github,
            'portfolio': self.portfolio,
            'location': self.location,
            'name': self.name
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ContactInfo':
        return cls(
            email=data.get('email', ''),
            phone=data.get('phone', ''),
            linkedin=data.get('linkedin', ''),
            github=data.get('github', ''),
            portfolio=data.get('portfolio', ''),
            location=data.get('location', ''),
            name=data.get('name', '')
        )

class AIAnalysis:
    """AI analysis results for resume"""
    
    def __init__(self, skills: List[str], experience_years: int, education: str,
                 contact_info: Optional[ContactInfo] = None):
        self.skills = skills
        self.experience_years = experience_years
        self.education = education
        self.contact_info = contact_info or ContactInfo()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'skills': self.skills,
            'experience_years': self.experience_years,
            'education': self.education,
            'contact_info': self.contact_info.to_dict()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AIAnalysis':
        contact_info = None
        if 'contact_info' in data and data['contact_info']:
            contact_info = ContactInfo.from_dict(data['contact_info'])
        
        return cls(
            skills=data.get('skills', []),
            experience_years=data.get('experience_years', 0),
            education=data.get('education', ''),
            contact_info=contact_info
        )

class Resume:
    """Resume model class"""
    
    def __init__(self, user_id: str, file_name: str, content_type: str, file_size: int):
        self.id = str(uuid.uuid4())
        self.user_id = user_id
        self.file_name = file_name
        self.content_type = content_type
        self.file_size = file_size
        self.extracted_text = ""
        self.ai_analysis: Optional[AIAnalysis] = None
        self.processed = False
        self.uploaded_at = datetime.now()
        self.analyzed_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert resume to dictionary for Firestore"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'file_name': self.file_name,
            'content_type': self.content_type,
            'file_size': self.file_size,
            'extracted_text': self.extracted_text,
            'processed': self.processed,
            'uploaded_at': self.uploaded_at,
            'analyzed_at': self.analyzed_at
        }
        
        if self.ai_analysis:
            data['ai_analysis'] = self.ai_analysis.to_dict()
        
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Resume':
        """Create resume from Firestore dictionary"""
        resume = cls(
            user_id=data['user_id'],
            file_name=data['file_name'],
            content_type=data['content_type'],
            file_size=data['file_size']
        )
        
        resume.id = data.get('id', str(uuid.uuid4()))
        resume.extracted_text = data.get('extracted_text', '')
        resume.processed = data.get('processed', False)
        resume.uploaded_at = data.get('uploaded_at', datetime.now())
        resume.analyzed_at = data.get('analyzed_at')
        
        if 'ai_analysis' in data and data['ai_analysis']:
            resume.ai_analysis = AIAnalysis.from_dict(data['ai_analysis'])
        
        return resume
    
    def set_extracted_text(self, text: str):
        """Set extracted text from resume file"""
        self.extracted_text = text
    
    def set_ai_analysis(self, analysis: AIAnalysis):
        """Set AI analysis results"""
        self.ai_analysis = analysis
        self.analyzed_at = datetime.now()
        self.processed = True
    
    def mark_processing_failed(self):
        """Mark resume processing as failed"""
        self.processed = False
        self.analyzed_at = None