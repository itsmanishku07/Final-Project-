"""
Job routes for job posting and management
Handles job creation, retrieval, and management
"""

from flask import Blueprint, request, jsonify
import logging
from functools import wraps
from repositories.job_repository import JobRepository
from models.job import Job
from utils.auth_utils import get_current_user
from datetime import datetime

logger = logging.getLogger(__name__)

job_bp = Blueprint('job', __name__)
job_repository = JobRepository()

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
            from repositories.user_repository import UserRepository
            user_repo = UserRepository()
            user = user_repo.find_by_uid(current_user['uid'])
            
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

@job_bp.route('', methods=['POST'])
@require_auth
@require_role(['RECRUITER', 'ADMIN'])
def create_job(current_user):
    """Create new job posting"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': 'Request body required'}), 400
        
        # Validate required fields
        required_fields = ['title', 'description', 'company', 'required_skills', 'min_experience', 'max_experience']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        # Create job
        job = Job(
            recruiter_id=current_user['uid'],
            title=data['title'],
            description=data['description'],
            company=data['company'],
            required_skills=data['required_skills'],
            min_experience=data['min_experience'],
            max_experience=data['max_experience']
        )
        
        # Set optional fields
        if 'location' in data:
            job.location = data['location']
        if 'education_level' in data:
            job.education_level = data['education_level']
        if 'job_type' in data:
            job.job_type = data['job_type']
        if 'salary_min' in data:
            job.salary_min = data['salary_min']
        if 'salary_max' in data:
            job.salary_max = data['salary_max']
        if 'expires_at' in data:
            job.expires_at = datetime.fromisoformat(data['expires_at'])
        
        saved_job = job_repository.save_job(job)
        
        response = {
            'success': True,
            'message': 'Job created successfully',
            'job': {
                'id': saved_job.id,
                'title': saved_job.title,
                'company': saved_job.company,
                'location': saved_job.location or '',
                'required_skills': saved_job.required_skills,
                'min_experience': saved_job.min_experience,
                'max_experience': saved_job.max_experience,
                'created_at': saved_job.created_at.isoformat(),
                'active': saved_job.active
            }
        }
        
        return jsonify(response), 201
        
    except Exception as e:
        logger.error(f"Job creation failed: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@job_bp.route('', methods=['GET'])
def get_all_active_jobs():
    """Get all active jobs with optional search"""
    try:
        # Get search parameters
        search = request.args.get('search', '').lower()
        company = request.args.get('company', '').lower()
        
        jobs = job_repository.find_all_active()
        
        # Filter by search term (searches in title, company, description)
        if search:
            jobs = [j for j in jobs if 
                    search in j.title.lower() or 
                    search in j.company.lower() or 
                    search in j.description.lower() or
                    any(search in skill.lower() for skill in j.required_skills)]
        
        # Filter by company name
        if company:
            jobs = [j for j in jobs if company in j.company.lower()]
        
        job_data = []
        for job in jobs:
            data = {
                'id': job.id,
                'title': job.title,
                'company': job.company,
                'location': job.location or '',
                'description': job.description,
                'required_skills': job.required_skills,
                'min_experience': job.min_experience,
                'max_experience': job.max_experience,
                'education_level': job.education_level or '',
                'job_type': job.job_type or '',
                'salary_min': job.salary_min,
                'salary_max': job.salary_max,
                'created_at': job.created_at.isoformat(),
                'expires_at': job.expires_at.isoformat() if job.expires_at else ''
            }
            job_data.append(data)
        
        response = {
            'success': True,
            'jobs': job_data,
            'total': len(job_data)
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Failed to get active jobs: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@job_bp.route('/companies', methods=['GET'])
def get_companies():
    """Get list of all companies with job counts"""
    try:
        jobs = job_repository.find_all_active()
        
        # Group by company
        companies = {}
        for job in jobs:
            company = job.company
            if company not in companies:
                companies[company] = {'name': company, 'job_count': 0, 'jobs': []}
            companies[company]['job_count'] += 1
            companies[company]['jobs'].append({
                'id': job.id,
                'title': job.title,
                'location': job.location or ''
            })
        
        company_list = sorted(companies.values(), key=lambda x: x['job_count'], reverse=True)
        
        return jsonify({
            'success': True,
            'companies': company_list,
            'total': len(company_list)
        })
        
    except Exception as e:
        logger.error(f"Failed to get companies: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@job_bp.route('/<job_id>', methods=['GET'])
def get_job(job_id):
    """Get job by ID"""
    try:
        job = job_repository.find_by_id(job_id)
        if not job:
            return jsonify({'success': False, 'message': 'Job not found'}), 404
        
        data = {
            'id': job.id,
            'title': job.title,
            'company': job.company,
            'location': job.location or '',
            'description': job.description,
            'required_skills': job.required_skills,
            'min_experience': job.min_experience,
            'max_experience': job.max_experience,
            'education_level': job.education_level or '',
            'job_type': job.job_type or '',
            'salary_min': job.salary_min,
            'salary_max': job.salary_max,
            'created_at': job.created_at.isoformat(),
            'updated_at': job.updated_at.isoformat(),
            'expires_at': job.expires_at.isoformat() if job.expires_at else '',
            'active': job.active
        }
        
        response = {
            'success': True,
            'job': data
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Failed to get job {job_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@job_bp.route('/my-jobs', methods=['GET'])
@require_auth
@require_role(['RECRUITER', 'ADMIN'])
def get_my_jobs(current_user):
    """Get jobs posted by current recruiter"""
    try:
        jobs = job_repository.find_by_recruiter_id(current_user['uid'])
        
        job_data = []
        for job in jobs:
            data = {
                'id': job.id,
                'title': job.title,
                'company': job.company,
                'location': job.location or '',
                'description': job.description,
                'required_skills': job.required_skills,
                'min_experience': job.min_experience,
                'max_experience': job.max_experience,
                'education_level': job.education_level or '',
                'job_type': job.job_type or '',
                'salary_min': job.salary_min,
                'salary_max': job.salary_max,
                'created_at': job.created_at.isoformat(),
                'updated_at': job.updated_at.isoformat(),
                'expires_at': job.expires_at.isoformat() if job.expires_at else '',
                'active': job.active
            }
            job_data.append(data)
        
        response = {
            'success': True,
            'jobs': job_data
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Failed to get recruiter jobs: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@job_bp.route('/<job_id>', methods=['PUT'])
@require_auth
@require_role(['RECRUITER', 'ADMIN'])
def update_job(current_user, job_id):
    """Update a job posting"""
    try:
        job = job_repository.find_by_id(job_id)
        if not job:
            return jsonify({'success': False, 'message': 'Job not found'}), 404
        
        # Check ownership (unless admin)
        if current_user['role'] != 'ADMIN' and job.recruiter_id != current_user['uid']:
            return jsonify({'success': False, 'message': 'You can only edit your own jobs'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Request body required'}), 400
        
        # Update fields
        if 'title' in data:
            job.title = data['title']
        if 'description' in data:
            job.description = data['description']
        if 'company' in data:
            job.company = data['company']
        if 'location' in data:
            job.location = data['location']
        if 'required_skills' in data:
            job.required_skills = data['required_skills']
        if 'min_experience' in data:
            job.min_experience = data['min_experience']
        if 'max_experience' in data:
            job.max_experience = data['max_experience']
        if 'education_level' in data:
            job.education_level = data['education_level']
        if 'job_type' in data:
            job.job_type = data['job_type']
        if 'salary_min' in data:
            job.salary_min = data['salary_min']
        if 'salary_max' in data:
            job.salary_max = data['salary_max']
        if 'active' in data:
            job.active = data['active']
        if 'expires_at' in data and data['expires_at']:
            job.expires_at = datetime.fromisoformat(data['expires_at'])
        
        # Update timestamp
        job.updated_at = datetime.utcnow()
        
        updated_job = job_repository.update_job(job)
        
        return jsonify({
            'success': True,
            'message': 'Job updated successfully',
            'job': {
                'id': updated_job.id,
                'title': updated_job.title,
                'company': updated_job.company,
                'active': updated_job.active,
                'updated_at': updated_job.updated_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to update job {job_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@job_bp.route('/<job_id>', methods=['DELETE'])
@require_auth
@require_role(['RECRUITER', 'ADMIN'])
def delete_job(current_user, job_id):
    """Delete a job posting"""
    try:
        job = job_repository.find_by_id(job_id)
        if not job:
            return jsonify({'success': False, 'message': 'Job not found'}), 404
        
        # Check ownership (unless admin)
        if current_user['role'] != 'ADMIN' and job.recruiter_id != current_user['uid']:
            return jsonify({'success': False, 'message': 'You can only delete your own jobs'}), 403
        
        job_repository.delete_job(job_id)
        
        return jsonify({
            'success': True,
            'message': 'Job deleted successfully'
        })
        
    except Exception as e:
        logger.error(f"Failed to delete job {job_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500