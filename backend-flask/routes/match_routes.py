"""
Match routes for resume-job matching operations
Handles AI-powered matching and ranking
"""

from flask import Blueprint, request, jsonify
import logging
from functools import wraps
from repositories.match_repository import MatchRepository
from repositories.resume_repository import ResumeRepository
from repositories.job_repository import JobRepository
from repositories.user_repository import UserRepository
from models.match import Match
from services.ai_service import get_ai_service
from utils.auth_utils import get_current_user

logger = logging.getLogger(__name__)

match_bp = Blueprint('match', __name__)
match_repository = MatchRepository()
resume_repository = ResumeRepository()
job_repository = JobRepository()
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
            # Get user from database to check role
            user = user_repository.find_by_uid(current_user['uid'])
            
            if user:
                user_role = user.role.value
            else:
                user_role = current_user.get('role', 'CANDIDATE')
            
            if user_role not in allowed_roles and user_role != 'ADMIN':
                return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
            
            # Add role to current_user for use in the function
            current_user['role'] = user_role
            return f(current_user, *args, **kwargs)
        return decorated_function
    return decorator

@match_bp.route('/resume/<resume_id>/job/<job_id>', methods=['POST'])
@require_auth
@require_role(['RECRUITER', 'ADMIN'])
def match_resume_to_job(current_user, resume_id, job_id):
    """Match a specific resume to a job"""
    try:
        # Validate resume exists and is processed
        resume = resume_repository.find_by_id(resume_id)
        if not resume:
            return jsonify({'success': False, 'message': 'Resume not found'}), 404
        
        if not resume.processed:
            return jsonify({'success': False, 'message': 'Resume has not been processed yet'}), 400
        
        # Validate job exists and is active
        job = job_repository.find_by_id(job_id)
        if not job:
            return jsonify({'success': False, 'message': 'Job not found'}), 404
        
        if not job.active:
            return jsonify({'success': False, 'message': 'Job is not active'}), 400
        
        # Check if match already exists
        existing_match = match_repository.find_by_resume_and_job(resume_id, job_id)
        if existing_match:
            response = {
                'success': True,
                'message': 'Match already exists',
                'match': {
                    'id': existing_match.id,
                    'resume_id': existing_match.resume_id,
                    'job_id': existing_match.job_id,
                    'similarity_score': existing_match.similarity_score,
                    'matched_skills': existing_match.matched_skills,
                    'missing_skills': existing_match.missing_skills,
                    'reasoning': existing_match.reasoning,
                    'matched_at': existing_match.matched_at.isoformat()
                }
            }
            return jsonify(response)
        
        # Perform AI analysis for matching
        ai_response = ai_service.analyze_resume_for_job(
            resume.extracted_text,
            job.description,
            job.required_skills
        )
        
        # Create match record
        match = Match(
            resume_id=resume_id,
            job_id=job_id,
            similarity_score=ai_response.similarity_score,
            matched_skills=ai_response.matched_skills,
            missing_skills=ai_response.missing_skills,
            reasoning=ai_response.reasoning
        )
        
        saved_match = match_repository.save_match(match)
        
        response = {
            'success': True,
            'message': 'Resume matched to job successfully',
            'match': {
                'id': saved_match.id,
                'resume_id': saved_match.resume_id,
                'job_id': saved_match.job_id,
                'similarity_score': saved_match.similarity_score,
                'matched_skills': saved_match.matched_skills,
                'missing_skills': saved_match.missing_skills,
                'reasoning': saved_match.reasoning,
                'matched_at': saved_match.matched_at.isoformat()
            }
        }
        
        return jsonify(response), 201
        
    except Exception as e:
        logger.error(f"Failed to match resume {resume_id} to job {job_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@match_bp.route('/job/<job_id>', methods=['GET'])
@require_auth
@require_role(['RECRUITER', 'ADMIN'])
def get_matches_for_job(current_user, job_id):
    """Get matches for a specific job (ranked by similarity score)"""
    try:
        matches = match_repository.find_by_job_id(job_id)
        
        match_data = []
        for match in matches:
            # Get additional data
            resume = resume_repository.find_by_id(match.resume_id)
            job = job_repository.find_by_id(match.job_id)
            candidate = None
            
            if resume:
                candidate = user_repository.find_by_uid(resume.user_id)
            
            data = {
                'match_id': match.id,
                'resume_id': match.resume_id,
                'job_id': match.job_id,
                'candidate_name': candidate.name if candidate else '',
                'candidate_email': candidate.email if candidate else '',
                'job_title': job.title if job else '',
                'company': job.company if job else '',
                'similarity_score': match.similarity_score,
                'matched_skills': match.matched_skills,
                'missing_skills': match.missing_skills,
                'reasoning': match.reasoning,
                'matched_at': match.matched_at.isoformat(),
                'reviewed': match.reviewed,
                'recruiter_notes': match.recruiter_notes or ''
            }
            match_data.append(data)
        
        response = {
            'success': True,
            'matches': match_data
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Failed to get matches for job {job_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@match_bp.route('/<match_id>/review', methods=['PUT'])
@require_auth
@require_role(['RECRUITER', 'ADMIN'])
def update_match_review(current_user, match_id):
    """Update match review status and notes"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'Request body required'}), 400
        
        match = match_repository.find_by_id(match_id)
        if not match:
            return jsonify({'success': False, 'message': 'Match not found'}), 404
        
        reviewed = data.get('reviewed', False)
        notes = data.get('notes', '')
        
        match.update_review(reviewed, notes)
        updated_match = match_repository.update_match(match)
        
        response = {
            'success': True,
            'message': 'Match review updated successfully',
            'match': {
                'id': updated_match.id,
                'reviewed': updated_match.reviewed,
                'recruiter_notes': updated_match.recruiter_notes or '',
                'updated_at': updated_match.updated_at.isoformat()
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Failed to update match review {match_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@match_bp.route('/job/<job_id>/match-all', methods=['POST'])
@require_auth
@require_role(['RECRUITER', 'ADMIN'])
def match_all_resumes_to_job(current_user, job_id):
    """Match all processed resumes to a specific job"""
    try:
        # Validate job exists and is active
        job = job_repository.find_by_id(job_id)
        if not job:
            return jsonify({'success': False, 'message': 'Job not found'}), 404
        
        # Get all processed resumes
        all_resumes = resume_repository.find_all_processed()
        
        if not all_resumes:
            return jsonify({'success': False, 'message': 'No processed resumes found'}), 400
        
        matches_created = 0
        matches_existing = 0
        errors = 0
        
        for resume in all_resumes:
            try:
                # Check if match already exists
                existing_match = match_repository.find_by_resume_and_job(resume.id, job_id)
                if existing_match:
                    matches_existing += 1
                    continue
                
                # Perform AI analysis for matching
                ai_response = ai_service.analyze_resume_for_job(
                    resume.extracted_text,
                    job.description,
                    job.required_skills
                )
                
                # Create match record
                match = Match(
                    resume_id=resume.id,
                    job_id=job_id,
                    similarity_score=ai_response.similarity_score,
                    matched_skills=ai_response.matched_skills,
                    missing_skills=ai_response.missing_skills,
                    reasoning=ai_response.reasoning
                )
                
                match_repository.save_match(match)
                matches_created += 1
                
            except Exception as e:
                logger.error(f"Failed to match resume {resume.id} to job {job_id}: {e}")
                errors += 1
        
        response = {
            'success': True,
            'message': f'Matching completed: {matches_created} new matches, {matches_existing} existing, {errors} errors',
            'stats': {
                'new_matches': matches_created,
                'existing_matches': matches_existing,
                'errors': errors,
                'total_resumes': len(all_resumes)
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Failed to match all resumes to job {job_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500