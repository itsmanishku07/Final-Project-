"""
Interview routes for scheduling and managing interviews
"""

from flask import Blueprint, request, jsonify
import logging
import os
from functools import wraps
from datetime import datetime
from repositories.interview_repository import InterviewRepository
from repositories.application_repository import ApplicationRepository
from repositories.job_repository import JobRepository
from repositories.user_repository import UserRepository
from models.interview import Interview, InterviewStatus
from models.application import ApplicationStatus
from services.email_service import get_email_service
from utils.auth_utils import get_current_user

logger = logging.getLogger(__name__)

interview_bp = Blueprint('interview', __name__)
interview_repository = InterviewRepository()
application_repository = ApplicationRepository()
job_repository = JobRepository()
user_repository = UserRepository()
email_service = get_email_service()

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            user_data = get_current_user()
            if not user_data:
                return jsonify({'success': False, 'message': 'Authentication required'}), 401
            return f(user_data, *args, **kwargs)
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return jsonify({'success': False, 'message': 'Invalid authentication'}), 401
    return decorated_function

def require_role(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(current_user, *args, **kwargs):
            user = user_repository.find_by_uid(current_user['uid'])
            user_role = user.role.value if user else current_user.get('role', 'CANDIDATE')
            if user_role not in allowed_roles and user_role != 'ADMIN':
                return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
            current_user['role'] = user_role
            return f(current_user, *args, **kwargs)
        return decorated_function
    return decorator


@interview_bp.route('/schedule', methods=['POST'])
@require_auth
@require_role(['RECRUITER', 'ADMIN'])
def schedule_interview(current_user):
    """Schedule an interview for a shortlisted candidate"""
    try:
        data = request.get_json()
        
        application_id = data.get('application_id')
        scheduled_at = data.get('scheduled_at')
        duration = data.get('duration_minutes', 30)
        notes = data.get('notes', '')
        
        if not application_id or not scheduled_at:
            return jsonify({'success': False, 'message': 'application_id and scheduled_at are required'}), 400
        
        # Get application
        application = application_repository.find_by_id(application_id)
        if not application:
            return jsonify({'success': False, 'message': 'Application not found'}), 404
        
        # Verify application is shortlisted
        if application.status not in [ApplicationStatus.SHORTLISTED, ApplicationStatus.HIRED]:
            return jsonify({'success': False, 'message': 'Can only schedule interviews for shortlisted candidates'}), 400
        
        # Verify recruiter owns the job
        job = job_repository.find_by_id(application.job_id)
        if not job or (job.recruiter_id != current_user['uid'] and current_user['role'] != 'ADMIN'):
            return jsonify({'success': False, 'message': 'Not authorized'}), 403
        
        # Parse scheduled time - keep as local time without timezone conversion
        logger.info(f"Received scheduled_at: {scheduled_at}")
        try:
            # datetime-local input gives format: "2026-01-15T14:30"
            scheduled_datetime = datetime.strptime(scheduled_at[:16], '%Y-%m-%dT%H:%M')
            logger.info(f"Parsed datetime: {scheduled_datetime}")
        except Exception as e:
            logger.error(f"Failed to parse datetime: {scheduled_at}, error: {e}")
            return jsonify({'success': False, 'message': f'Invalid datetime format: {scheduled_at}'}), 400
        
        # Create interview
        interview = Interview(
            application_id=application_id,
            job_id=application.job_id,
            candidate_id=application.candidate_id,
            recruiter_id=current_user['uid'],
            scheduled_at=scheduled_datetime
        )
        interview.duration_minutes = duration
        interview.notes = notes
        
        saved_interview = interview_repository.save_interview(interview)
        
        # Get frontend URL for meeting link
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        full_meeting_link = f"{frontend_url}/video-call/{saved_interview.id}"
        
        # Send email notification to candidate
        candidate = user_repository.find_by_uid(application.candidate_id)
        recruiter = user_repository.find_by_uid(current_user['uid'])
        
        if candidate and candidate.email:
            send_interview_email(
                candidate_email=candidate.email,
                candidate_name=candidate.name or 'Candidate',
                job_title=job.title,
                company=job.company,
                scheduled_at=scheduled_datetime,
                duration=duration,
                meeting_link=full_meeting_link,
                recruiter_name=recruiter.name if recruiter else 'Recruiter',
                notes=notes
            )
        
        return jsonify({
            'success': True,
            'message': 'Interview scheduled successfully',
            'interview': {
                'id': saved_interview.id,
                'scheduled_at': saved_interview.scheduled_at.isoformat(),
                'duration_minutes': saved_interview.duration_minutes,
                'meeting_link': saved_interview.meeting_link,
                'meeting_room_id': saved_interview.meeting_room_id,
                'status': saved_interview.status
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Failed to schedule interview: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


def send_interview_email(candidate_email, candidate_name, job_title, company, 
                         scheduled_at, duration, meeting_link, recruiter_name, notes=''):
    """Send interview invitation email"""
    subject = f"Interview Scheduled - {job_title} at {company}"
    
    formatted_date = scheduled_at.strftime('%A, %B %d, %Y')
    formatted_time = scheduled_at.strftime('%I:%M %p')
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }}
        .footer {{ background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }}
        .meeting-box {{ background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }}
        .meeting-link {{ display: inline-block; background: white; color: #059669; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px; }}
        .details {{ background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .detail-row {{ display: flex; margin: 10px 0; }}
        .detail-label {{ font-weight: 600; width: 120px; color: #6b7280; }}
        h1 {{ margin: 0; font-size: 24px; }}
        .emoji {{ font-size: 48px; margin-bottom: 10px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">📅</div>
            <h1>Interview Scheduled!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">You're one step closer to your dream job</p>
        </div>
        <div class="content">
            <p>Dear {candidate_name},</p>
            
            <p>Great news! Your interview for the <strong>{job_title}</strong> position at <strong>{company}</strong> has been scheduled.</p>
            
            <div class="details">
                <div class="detail-row">
                    <span class="detail-label">📆 Date:</span>
                    <span>{formatted_date}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">⏰ Time:</span>
                    <span>{formatted_time}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">⏱️ Duration:</span>
                    <span>{duration} minutes</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">👤 Interviewer:</span>
                    <span>{recruiter_name}</span>
                </div>
            </div>
            
            <div class="meeting-box">
                <p style="margin: 0 0 10px 0; font-size: 18px;">🎥 Video Interview</p>
                <p style="margin: 0; opacity: 0.9;">Click the button below to join the meeting at the scheduled time</p>
                <a href="{meeting_link}" class="meeting-link">Join Video Call</a>
            </div>
            
            {f'<div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;"><strong>📝 Notes from recruiter:</strong><br>{notes}</div>' if notes else ''}
            
            <p><strong>Tips for your interview:</strong></p>
            <ul>
                <li>Test your camera and microphone before the interview</li>
                <li>Find a quiet place with good lighting</li>
                <li>Have your resume ready for reference</li>
                <li>Join 5 minutes early to ensure everything works</li>
            </ul>
            
            <p>Best of luck!</p>
            <p>Best regards,<br><strong>{recruiter_name}</strong><br>{company}</p>
        </div>
        <div class="footer">
            <p>This interview was scheduled via AI Resume Screening Platform</p>
            <p>Meeting Link: <a href="{meeting_link}">{meeting_link}</a></p>
        </div>
    </div>
</body>
</html>
"""
    
    text_content = f"""
Interview Scheduled - {job_title} at {company}

Dear {candidate_name},

Your interview has been scheduled!

Date: {formatted_date}
Time: {formatted_time}
Duration: {duration} minutes
Interviewer: {recruiter_name}

Join Video Call: {meeting_link}

{f'Notes: {notes}' if notes else ''}

Best of luck!
{recruiter_name}
{company}
"""
    
    return email_service.send_email(candidate_email, subject, html_content, text_content)


@interview_bp.route('/my-interviews', methods=['GET'])
@require_auth
def get_my_interviews(current_user):
    """Get interviews for current user (candidate or recruiter)"""
    try:
        user = user_repository.find_by_uid(current_user['uid'])
        user_role = user.role.value if user else 'CANDIDATE'
        
        if user_role == 'CANDIDATE':
            interviews = interview_repository.find_by_candidate_id(current_user['uid'])
        else:
            interviews = interview_repository.find_by_recruiter_id(current_user['uid'])
        
        interview_data = []
        for interview in interviews:
            # Get related data
            job = job_repository.find_by_id(interview.job_id)
            candidate = user_repository.find_by_uid(interview.candidate_id)
            recruiter = user_repository.find_by_uid(interview.recruiter_id)
            
            data = {
                'id': interview.id,
                'application_id': interview.application_id,
                'job_id': interview.job_id,
                'job_title': job.title if job else 'Unknown',
                'company': job.company if job else 'Unknown',
                'candidate_id': interview.candidate_id,
                'candidate_name': candidate.name if candidate else 'Unknown',
                'candidate_email': candidate.email if candidate else '',
                'recruiter_id': interview.recruiter_id,
                'recruiter_name': recruiter.name if recruiter else 'Unknown',
                'scheduled_at': interview.scheduled_at.isoformat(),
                'duration_minutes': interview.duration_minutes,
                'status': interview.status,
                'meeting_link': interview.meeting_link,
                'meeting_room_id': interview.meeting_room_id,
                'notes': interview.notes or '',
                'recruiter_feedback': interview.recruiter_feedback or '',
                'rating': interview.rating,
                'created_at': interview.created_at.isoformat()
            }
            interview_data.append(data)
        
        return jsonify({
            'success': True,
            'interviews': interview_data,
            'total': len(interview_data)
        })
        
    except Exception as e:
        logger.error(f"Failed to get interviews: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@interview_bp.route('/application/<application_id>', methods=['GET'])
@require_auth
def get_interviews_for_application(current_user, application_id):
    """Get all interviews for an application"""
    try:
        interviews = interview_repository.find_by_application_id(application_id)
        
        interview_data = []
        for interview in interviews:
            recruiter = user_repository.find_by_uid(interview.recruiter_id)
            data = {
                'id': interview.id,
                'scheduled_at': interview.scheduled_at.isoformat(),
                'duration_minutes': interview.duration_minutes,
                'status': interview.status,
                'meeting_link': interview.meeting_link,
                'recruiter_name': recruiter.name if recruiter else 'Unknown',
                'notes': interview.notes or '',
                'recruiter_feedback': interview.recruiter_feedback or '',
                'rating': interview.rating
            }
            interview_data.append(data)
        
        return jsonify({
            'success': True,
            'interviews': interview_data
        })
        
    except Exception as e:
        logger.error(f"Failed to get interviews: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@interview_bp.route('/<interview_id>', methods=['PUT'])
@require_auth
@require_role(['RECRUITER', 'ADMIN'])
def update_interview(current_user, interview_id):
    """Update interview (reschedule, add feedback, change status)"""
    try:
        interview = interview_repository.find_by_id(interview_id)
        if not interview:
            return jsonify({'success': False, 'message': 'Interview not found'}), 404
        
        # Verify ownership
        if interview.recruiter_id != current_user['uid'] and current_user['role'] != 'ADMIN':
            return jsonify({'success': False, 'message': 'Not authorized'}), 403
        
        data = request.get_json()
        
        if 'scheduled_at' in data:
            try:
                new_time = datetime.fromisoformat(data['scheduled_at'].replace('Z', '+00:00'))
            except:
                new_time = datetime.strptime(data['scheduled_at'], '%Y-%m-%dT%H:%M')
            interview.scheduled_at = new_time
        
        if 'duration_minutes' in data:
            interview.duration_minutes = data['duration_minutes']
        
        if 'status' in data:
            interview.status = data['status']
        
        if 'notes' in data:
            interview.notes = data['notes']
        
        if 'recruiter_feedback' in data:
            interview.recruiter_feedback = data['recruiter_feedback']
        
        if 'rating' in data:
            interview.rating = min(max(data['rating'], 1), 5)
        
        interview.updated_at = datetime.now()
        updated = interview_repository.update_interview(interview)
        
        return jsonify({
            'success': True,
            'message': 'Interview updated',
            'interview': {
                'id': updated.id,
                'scheduled_at': updated.scheduled_at.isoformat(),
                'status': updated.status
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to update interview: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@interview_bp.route('/<interview_id>/cancel', methods=['POST'])
@require_auth
def cancel_interview(current_user, interview_id):
    """Cancel an interview"""
    try:
        interview = interview_repository.find_by_id(interview_id)
        if not interview:
            return jsonify({'success': False, 'message': 'Interview not found'}), 404
        
        # Both recruiter and candidate can cancel
        if interview.recruiter_id != current_user['uid'] and interview.candidate_id != current_user['uid']:
            return jsonify({'success': False, 'message': 'Not authorized'}), 403
        
        interview.status = InterviewStatus.CANCELLED
        interview.updated_at = datetime.now()
        interview_repository.update_interview(interview)
        
        return jsonify({
            'success': True,
            'message': 'Interview cancelled'
        })
        
    except Exception as e:
        logger.error(f"Failed to cancel interview: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@interview_bp.route('/<interview_id>/join', methods=['GET'])
@require_auth
def get_meeting_info(current_user, interview_id):
    """Get meeting info for joining"""
    try:
        interview = interview_repository.find_by_id(interview_id)
        if not interview:
            return jsonify({'success': False, 'message': 'Interview not found'}), 404
        
        # Verify user is participant
        if interview.recruiter_id != current_user['uid'] and interview.candidate_id != current_user['uid']:
            return jsonify({'success': False, 'message': 'Not authorized'}), 403
        
        user = user_repository.find_by_uid(current_user['uid'])
        job = job_repository.find_by_id(interview.job_id)
        
        # Log the scheduled time for debugging
        logger.info(f"Interview scheduled_at: {interview.scheduled_at}, type: {type(interview.scheduled_at)}")
        
        # Format scheduled_at as ISO string without timezone conversion
        scheduled_at_str = interview.scheduled_at.strftime('%Y-%m-%dT%H:%M:%S')
        
        return jsonify({
            'success': True,
            'meeting': {
                'room_id': interview.meeting_room_id,
                'meeting_link': interview.meeting_link,
                'user_name': user.name if user else 'Participant',
                'job_title': job.title if job else 'Interview',
                'company': job.company if job else '',
                'scheduled_at': scheduled_at_str,
                'duration_minutes': interview.duration_minutes
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to get meeting info: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
