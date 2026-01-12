"""
Application routes for job applications
Handles candidate applications and recruiter review
"""

from flask import Blueprint, request, jsonify
import logging
from functools import wraps
from repositories.application_repository import ApplicationRepository
from repositories.job_repository import JobRepository
from repositories.resume_repository import ResumeRepository
from repositories.user_repository import UserRepository
from models.application import Application, ApplicationStatus
from services.ai_service import get_ai_service
from utils.auth_utils import get_current_user

logger = logging.getLogger(__name__)

application_bp = Blueprint('application', __name__)
application_repository = ApplicationRepository()
job_repository = JobRepository()
resume_repository = ResumeRepository()
user_repository = UserRepository()
ai_service = get_ai_service()

def require_auth(f):
    """Decorator to require authentication"""
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
    """Decorator to require specific roles"""
    def decorator(f):
        @wraps(f)
        def decorated_function(current_user, *args, **kwargs):
            user = user_repository.find_by_uid(current_user['uid'])
            if user:
                user_role = user.role.value
            else:
                user_role = current_user.get('role', 'CANDIDATE')
            
            if user_role not in allowed_roles and user_role != 'ADMIN':
                return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
            
            current_user['role'] = user_role
            return f(current_user, *args, **kwargs)
        return decorated_function
    return decorator


@application_bp.route('/apply', methods=['POST'])
@require_auth
@require_role(['CANDIDATE', 'ADMIN'])
def apply_to_job(current_user):
    """Apply to a job with resume"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'Request body required'}), 400
        
        job_id = data.get('job_id')
        resume_id = data.get('resume_id')
        cover_letter = data.get('cover_letter', '')
        
        if not job_id or not resume_id:
            return jsonify({'success': False, 'message': 'job_id and resume_id are required'}), 400
        
        # Check if job exists and is active
        job = job_repository.find_by_id(job_id)
        if not job:
            return jsonify({'success': False, 'message': 'Job not found'}), 404
        if not job.active:
            return jsonify({'success': False, 'message': 'Job is no longer accepting applications'}), 400
        
        # Check if resume exists and belongs to user
        resume = resume_repository.find_by_id(resume_id)
        if not resume:
            return jsonify({'success': False, 'message': 'Resume not found'}), 404
        if resume.user_id != current_user['uid']:
            return jsonify({'success': False, 'message': 'Resume does not belong to you'}), 403
        
        # Check if already applied
        existing = application_repository.find_by_job_and_candidate(job_id, current_user['uid'])
        if existing:
            return jsonify({'success': False, 'message': 'You have already applied to this job'}), 400
        
        # Create application
        application = Application(
            job_id=job_id,
            candidate_id=current_user['uid'],
            resume_id=resume_id
        )
        application.cover_letter = cover_letter
        
        # Copy AI analysis from resume (including contact info)
        if resume.ai_analysis:
            application.ai_analysis = {
                'skills': resume.ai_analysis.skills,
                'experience_years': resume.ai_analysis.experience_years,
                'education': resume.ai_analysis.education,
                'contact_info': resume.ai_analysis.contact_info.to_dict() if resume.ai_analysis.contact_info else {}
            }
        
        # Calculate match score with job
        if resume.processed and resume.extracted_text:
            try:
                match_result = ai_service.analyze_resume_for_job(
                    resume.extracted_text,
                    job.description,
                    job.required_skills
                )
                application.match_score = match_result.similarity_score
                application.matched_skills = match_result.matched_skills
                application.missing_skills = match_result.missing_skills
            except Exception as e:
                logger.error(f"Failed to calculate match score: {e}")
                application.match_score = 0
        
        saved_application = application_repository.save_application(application)
        
        response = {
            'success': True,
            'message': 'Application submitted successfully',
            'application': {
                'id': saved_application.id,
                'job_id': saved_application.job_id,
                'status': saved_application.status,
                'match_score': saved_application.match_score,
                'applied_at': saved_application.applied_at.isoformat()
            }
        }
        
        return jsonify(response), 201
        
    except Exception as e:
        logger.error(f"Application failed: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@application_bp.route('/my-applications', methods=['GET'])
@require_auth
@require_role(['CANDIDATE', 'ADMIN'])
def get_my_applications(current_user):
    """Get all applications by current candidate"""
    try:
        applications = application_repository.find_by_candidate_id(current_user['uid'])
        
        app_data = []
        for app in applications:
            # Get job details
            job = job_repository.find_by_id(app.job_id)
            
            data = {
                'id': app.id,
                'job_id': app.job_id,
                'job_title': job.title if job else 'Unknown',
                'company': job.company if job else 'Unknown',
                'location': job.location if job else '',
                'status': app.status,
                'match_score': app.match_score,
                'applied_at': app.applied_at.isoformat(),
                'updated_at': app.updated_at.isoformat()
            }
            app_data.append(data)
        
        return jsonify({'success': True, 'applications': app_data})
        
    except Exception as e:
        logger.error(f"Failed to get applications: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@application_bp.route('/job/<job_id>', methods=['GET'])
@require_auth
@require_role(['RECRUITER', 'ADMIN'])
def get_job_applications(current_user, job_id):
    """Get all applications for a job (recruiter view)"""
    try:
        # Verify job belongs to recruiter
        job = job_repository.find_by_id(job_id)
        if not job:
            return jsonify({'success': False, 'message': 'Job not found'}), 404
        
        if job.recruiter_id != current_user['uid'] and current_user.get('role') != 'ADMIN':
            return jsonify({'success': False, 'message': 'Not authorized to view these applications'}), 403
        
        applications = application_repository.find_by_job_id(job_id)
        
        app_data = []
        for app in applications:
            # Get candidate details from user profile
            candidate = user_repository.find_by_uid(app.candidate_id)
            resume = resume_repository.find_by_id(app.resume_id)
            
            # Get profile data from user (not from resume)
            candidate_profile = {}
            if candidate and candidate.profile:
                candidate_profile = {
                    'phone': candidate.profile.phone,
                    'location': candidate.profile.location,
                    'linkedin': candidate.profile.linkedin,
                    'github': candidate.profile.github,
                    'portfolio': candidate.profile.portfolio,
                    'bio': candidate.profile.bio,
                    'headline': candidate.profile.headline,
                    'skills': candidate.profile.skills,
                    'work_experience': [exp.to_dict() for exp in candidate.profile.work_experience],
                    'education': [edu.to_dict() for edu in candidate.profile.education]
                }
            
            # AI analysis from resume (skills, experience, education only)
            ai_analysis = app.ai_analysis or {}
            if resume and resume.ai_analysis:
                ai_analysis = {
                    'skills': resume.ai_analysis.skills,
                    'experience_years': resume.ai_analysis.experience_years,
                    'education': resume.ai_analysis.education
                }
            
            data = {
                'id': app.id,
                'candidate_id': app.candidate_id,
                'candidate_name': candidate.name if candidate else 'Unknown',
                'candidate_email': candidate.email if candidate else '',
                'candidate_profile': candidate_profile,  # Profile data from user
                'resume_id': app.resume_id,
                'resume_name': resume.file_name if resume else '',
                'status': app.status,
                'match_score': app.match_score,
                'matched_skills': app.matched_skills,
                'missing_skills': app.missing_skills,
                'ai_analysis': ai_analysis,  # Skills/experience from resume
                'cover_letter': app.cover_letter or '',
                'recruiter_notes': app.recruiter_notes or '',
                'applied_at': app.applied_at.isoformat(),
                'updated_at': app.updated_at.isoformat()
            }
            app_data.append(data)
        
        return jsonify({
            'success': True,
            'job': {
                'id': job.id,
                'title': job.title,
                'company': job.company,
                'required_skills': job.required_skills
            },
            'applications': app_data,
            'total': len(app_data)
        })
        
    except Exception as e:
        logger.error(f"Failed to get job applications: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@application_bp.route('/<application_id>/status', methods=['PUT'])
@require_auth
@require_role(['RECRUITER', 'ADMIN'])
def update_application_status(current_user, application_id):
    """Update application status (recruiter action)"""
    try:
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify({'success': False, 'message': 'Status is required'}), 400
        
        new_status = data['status']
        valid_statuses = [ApplicationStatus.PENDING, ApplicationStatus.REVIEWED, 
                        ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED, 
                        ApplicationStatus.HIRED]
        
        if new_status not in valid_statuses:
            return jsonify({'success': False, 'message': 'Invalid status'}), 400
        
        application = application_repository.find_by_id(application_id)
        if not application:
            return jsonify({'success': False, 'message': 'Application not found'}), 404
        
        # Verify recruiter owns the job
        job = job_repository.find_by_id(application.job_id)
        if job and job.recruiter_id != current_user['uid'] and current_user.get('role') != 'ADMIN':
            return jsonify({'success': False, 'message': 'Not authorized'}), 403
        
        notes = data.get('notes', '')
        application.update_status(new_status, notes)
        
        updated = application_repository.update_application(application)
        
        return jsonify({
            'success': True,
            'message': 'Application status updated',
            'application': {
                'id': updated.id,
                'status': updated.status,
                'updated_at': updated.updated_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to update application status: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@application_bp.route('/dashboard', methods=['GET'])
@require_auth
@require_role(['RECRUITER', 'ADMIN'])
def get_recruiter_dashboard(current_user):
    """Get recruiter dashboard with all jobs and application stats"""
    try:
        # Get all jobs by recruiter
        jobs = job_repository.find_by_recruiter_id(current_user['uid'])
        
        dashboard_data = []
        total_applications = 0
        total_pending = 0
        total_shortlisted = 0
        
        for job in jobs:
            applications = application_repository.find_by_job_id(job.id)
            
            pending = len([a for a in applications if a.status == ApplicationStatus.PENDING])
            reviewed = len([a for a in applications if a.status == ApplicationStatus.REVIEWED])
            shortlisted = len([a for a in applications if a.status == ApplicationStatus.SHORTLISTED])
            rejected = len([a for a in applications if a.status == ApplicationStatus.REJECTED])
            hired = len([a for a in applications if a.status == ApplicationStatus.HIRED])
            
            total_applications += len(applications)
            total_pending += pending
            total_shortlisted += shortlisted
            
            # Get top 3 candidates by match score
            top_candidates = []
            for app in applications[:3]:
                candidate = user_repository.find_by_uid(app.candidate_id)
                top_candidates.append({
                    'name': candidate.name if candidate else 'Unknown',
                    'match_score': app.match_score,
                    'status': app.status
                })
            
            dashboard_data.append({
                'job_id': job.id,
                'title': job.title,
                'company': job.company,
                'active': job.active,
                'created_at': job.created_at.isoformat(),
                'total_applications': len(applications),
                'pending': pending,
                'reviewed': reviewed,
                'shortlisted': shortlisted,
                'rejected': rejected,
                'hired': hired,
                'top_candidates': top_candidates
            })
        
        return jsonify({
            'success': True,
            'summary': {
                'total_jobs': len(jobs),
                'active_jobs': len([j for j in jobs if j.active]),
                'total_applications': total_applications,
                'pending_review': total_pending,
                'shortlisted': total_shortlisted
            },
            'jobs': dashboard_data
        })
        
    except Exception as e:
        logger.error(f"Failed to get dashboard: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@application_bp.route('/<application_id>/interview-questions', methods=['GET'])
@require_auth
@require_role(['RECRUITER', 'ADMIN'])
def get_interview_questions(current_user, application_id):
    """Generate AI-powered interview questions for a shortlisted candidate"""
    try:
        # Get application
        application = application_repository.find_by_id(application_id)
        if not application:
            return jsonify({'success': False, 'message': 'Application not found'}), 404
        
        # Verify recruiter owns the job
        job = job_repository.find_by_id(application.job_id)
        if not job:
            return jsonify({'success': False, 'message': 'Job not found'}), 404
        
        if job.recruiter_id != current_user['uid'] and current_user.get('role') != 'ADMIN':
            return jsonify({'success': False, 'message': 'Not authorized'}), 403
        
        # Check if candidate is shortlisted or hired
        if application.status not in [ApplicationStatus.SHORTLISTED, ApplicationStatus.HIRED]:
            return jsonify({
                'success': False, 
                'message': 'Interview questions are only available for shortlisted candidates'
            }), 400
        
        # Get candidate's resume
        resume = resume_repository.find_by_id(application.resume_id)
        resume_text = resume.extracted_text if resume else ''
        
        # Get candidate skills from application or resume
        candidate_skills = []
        experience_years = 0
        
        if application.ai_analysis:
            candidate_skills = application.ai_analysis.get('skills', [])
            experience_years = application.ai_analysis.get('experience_years', 0)
        elif resume and resume.ai_analysis:
            candidate_skills = resume.ai_analysis.skills
            experience_years = resume.ai_analysis.experience_years
        
        # Generate interview questions
        questions = ai_service.generate_interview_questions(
            resume_text=resume_text,
            job_description=job.description,
            required_skills=job.required_skills,
            candidate_skills=candidate_skills,
            experience_years=experience_years
        )
        
        # Get candidate info for context
        candidate = user_repository.find_by_uid(application.candidate_id)
        
        return jsonify({
            'success': True,
            'candidate': {
                'name': candidate.name if candidate else 'Unknown',
                'experience_years': experience_years,
                'skills_count': len(candidate_skills),
                'matched_skills': application.matched_skills or [],
                'missing_skills': application.missing_skills or []
            },
            'job': {
                'title': job.title,
                'company': job.company,
                'required_skills': job.required_skills
            },
            'questions': questions,
            'total_questions': len(questions)
        })
        
    except Exception as e:
        logger.error(f"Failed to generate interview questions: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
