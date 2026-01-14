"""
Interview model for Firebase Firestore
Represents scheduled interviews between recruiters and candidates
"""

from datetime import datetime
from typing import Optional, Dict, Any
import uuid

class InterviewStatus:
    """Interview status constants"""
    SCHEDULED = "SCHEDULED"
    CONFIRMED = "CONFIRMED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"

class Interview:
    """Interview model class"""
    
    def __init__(self, application_id: str, job_id: str, candidate_id: str, 
                 recruiter_id: str, scheduled_at: datetime):
        self.id = str(uuid.uuid4())
        self.application_id = application_id
        self.job_id = job_id
        self.candidate_id = candidate_id
        self.recruiter_id = recruiter_id
        self.scheduled_at = scheduled_at
        self.duration_minutes: int = 30
        self.status = InterviewStatus.SCHEDULED
        self.meeting_room_id: str = f"interview-{self.id[:8]}"
        self.meeting_link: Optional[str] = None
        self.notes: Optional[str] = None
        self.candidate_notes: Optional[str] = None
        self.recruiter_feedback: Optional[str] = None
        self.rating: Optional[int] = None  # 1-5 rating
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        
        # Generate meeting link
        self._generate_meeting_link()
    
    def _generate_meeting_link(self):
        """Generate internal meeting link"""
        # Use internal video call route instead of external service
        self.meeting_link = f"/video-call/{self.id}"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert interview to dictionary for Firestore"""
        return {
            'id': self.id,
            'application_id': self.application_id,
            'job_id': self.job_id,
            'candidate_id': self.candidate_id,
            'recruiter_id': self.recruiter_id,
            'scheduled_at': self.scheduled_at.strftime('%Y-%m-%dT%H:%M:%S'),  # Store as string
            'duration_minutes': self.duration_minutes,
            'status': self.status,
            'meeting_room_id': self.meeting_room_id,
            'meeting_link': self.meeting_link,
            'notes': self.notes,
            'candidate_notes': self.candidate_notes,
            'recruiter_feedback': self.recruiter_feedback,
            'rating': self.rating,
            'created_at': self.created_at.strftime('%Y-%m-%dT%H:%M:%S') if isinstance(self.created_at, datetime) else self.created_at,
            'updated_at': self.updated_at.strftime('%Y-%m-%dT%H:%M:%S') if isinstance(self.updated_at, datetime) else self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Interview':
        """Create interview from Firestore dictionary"""
        # Handle scheduled_at - could be string, Firestore Timestamp, or datetime
        scheduled_at = data.get('scheduled_at')
        if isinstance(scheduled_at, str):
            # Parse string format
            try:
                scheduled_at = datetime.strptime(scheduled_at[:19], '%Y-%m-%dT%H:%M:%S')
            except:
                scheduled_at = datetime.strptime(scheduled_at[:16], '%Y-%m-%dT%H:%M')
        elif hasattr(scheduled_at, 'timestamp'):
            # Firestore Timestamp object
            scheduled_at = datetime.fromtimestamp(scheduled_at.timestamp())
        elif not isinstance(scheduled_at, datetime):
            scheduled_at = datetime.now()
        
        interview = cls(
            application_id=data['application_id'],
            job_id=data['job_id'],
            candidate_id=data['candidate_id'],
            recruiter_id=data['recruiter_id'],
            scheduled_at=scheduled_at
        )
        
        interview.id = data.get('id', str(uuid.uuid4()))
        interview.duration_minutes = data.get('duration_minutes', 30)
        interview.status = data.get('status', InterviewStatus.SCHEDULED)
        interview.meeting_room_id = data.get('meeting_room_id', f"interview-{interview.id[:8]}")
        interview.meeting_link = data.get('meeting_link')
        interview.notes = data.get('notes')
        interview.candidate_notes = data.get('candidate_notes')
        interview.recruiter_feedback = data.get('recruiter_feedback')
        interview.rating = data.get('rating')
        
        # Handle created_at
        created_at = data.get('created_at')
        if isinstance(created_at, str):
            try:
                interview.created_at = datetime.strptime(created_at[:19], '%Y-%m-%dT%H:%M:%S')
            except:
                interview.created_at = datetime.now()
        elif hasattr(created_at, 'timestamp'):
            interview.created_at = datetime.fromtimestamp(created_at.timestamp())
        elif isinstance(created_at, datetime):
            interview.created_at = created_at
        else:
            interview.created_at = datetime.now()
            
        # Handle updated_at
        updated_at = data.get('updated_at')
        if isinstance(updated_at, str):
            try:
                interview.updated_at = datetime.strptime(updated_at[:19], '%Y-%m-%dT%H:%M:%S')
            except:
                interview.updated_at = datetime.now()
        elif hasattr(updated_at, 'timestamp'):
            interview.updated_at = datetime.fromtimestamp(updated_at.timestamp())
        elif isinstance(updated_at, datetime):
            interview.updated_at = updated_at
        else:
            interview.updated_at = datetime.now()
        
        if not interview.meeting_link:
            interview._generate_meeting_link()
        
        return interview
    
    def update_status(self, status: str):
        """Update interview status"""
        self.status = status
        self.updated_at = datetime.now()
    
    def add_feedback(self, feedback: str, rating: int = None):
        """Add recruiter feedback"""
        self.recruiter_feedback = feedback
        if rating:
            self.rating = min(max(rating, 1), 5)  # Clamp between 1-5
        self.updated_at = datetime.now()
    
    def reschedule(self, new_time: datetime, duration: int = None):
        """Reschedule interview"""
        self.scheduled_at = new_time
        if duration:
            self.duration_minutes = duration
        self.status = InterviewStatus.SCHEDULED
        self.updated_at = datetime.now()
