"""
Admin routes for system-wide monitoring and management
Handles administrative operations and dashboard statistics
"""

from flask import Blueprint, request, jsonify
import logging
from functools import wraps
from repositories.user_repository import UserRepository
from repositories.resume_repository import ResumeRepository
from repositories.job_repository import JobRepository
from repositories.match_repository import MatchRepository
from utils.auth_utils import get_current_user

logger = logging.getLogger(__name__)

admin_bp = Blueprint('admin', __name__)
user_repository = UserRepository()
resume_repository = ResumeRepository()
job_repository = JobRepository()
match_repository = MatchRepository()

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

def require_admin(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(current_user, *args, **kwargs):
        # Get user from database to check role
        user = user_repository.find_by_uid(current_user['uid'])
        
        if user:
            user_role = user.role.value
        else:
            user_role = current_user.get('role', 'CANDIDATE')
        
        if user_role != 'ADMIN':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        # Add role to current_user for use in the function
        current_user['role'] = user_role
        return f(current_user, *args, **kwargs)
    return decorated_function

@admin_bp.route('/dashboard', methods=['GET'])
@require_auth
@require_admin
def get_dashboard_stats(current_user):
    """Get system dashboard statistics"""
    try:
        # Get user statistics
        all_users = user_repository.find_all_users()
        total_users = len(all_users)
        active_users = len([u for u in all_users if u.active])
        candidate_count = len([u for u in all_users if u.role.value == 'CANDIDATE'])
        recruiter_count = len([u for u in all_users if u.role.value == 'RECRUITER'])
        admin_count = len([u for u in all_users if u.role.value == 'ADMIN'])
        
        # Get resume statistics
        all_resumes = resume_repository.find_all_resumes()
        total_resumes = len(all_resumes)
        processed_resumes = len([r for r in all_resumes if r.processed])
        processing_rate = (processed_resumes / total_resumes * 100) if total_resumes > 0 else 0
        
        # Get job statistics
        all_jobs = job_repository.find_all_jobs()
        total_jobs = len(all_jobs)
        active_jobs = len([j for j in all_jobs if j.active])
        
        # Get match statistics
        total_matches = match_repository.count_matches()
        top_matches = match_repository.find_top_matches(10)
        
        stats = {
            'users': {
                'total': total_users,
                'active': active_users,
                'candidates': candidate_count,
                'recruiters': recruiter_count,
                'admins': admin_count
            },
            'resumes': {
                'total': total_resumes,
                'processed': processed_resumes,
                'processing_rate': round(processing_rate, 2)
            },
            'jobs': {
                'total': total_jobs,
                'active': active_jobs
            },
            'matches': {
                'total': total_matches,
                'top_matches': [
                    {
                        'match_id': match.id,
                        'resume_id': match.resume_id,
                        'job_id': match.job_id,
                        'similarity_score': match.similarity_score,
                        'matched_at': match.matched_at.isoformat()
                    }
                    for match in top_matches
                ]
            }
        }
        
        response = {
            'success': True,
            'stats': stats
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Failed to get dashboard stats: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/users', methods=['GET'])
@require_auth
@require_admin
def get_all_users(current_user):
    """Get all users with pagination"""
    try:
        page = int(request.args.get('page', 0))
        size = int(request.args.get('size', 50))
        
        users = user_repository.find_all_users()
        
        # Simple pagination
        start = page * size
        end = start + size
        paginated_users = users[start:end]
        
        user_data = [
            {
                'uid': user.uid,
                'name': user.name,
                'email': user.email,
                'role': user.role.value,
                'active': user.active,
                'created_at': user.created_at.isoformat(),
                'updated_at': user.updated_at.isoformat()
            }
            for user in paginated_users
        ]
        
        response = {
            'success': True,
            'users': user_data,
            'pagination': {
                'page': page,
                'size': size,
                'total': len(users),
                'total_pages': (len(users) + size - 1) // size
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Failed to get all users: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/users/<uid>/status', methods=['PUT'])
@require_auth
@require_admin
def update_user_status(current_user, uid):
    """Activate/Deactivate user"""
    try:
        data = request.get_json()
        
        if not data or 'active' not in data:
            return jsonify({'success': False, 'message': 'Active status required'}), 400
        
        user = user_repository.find_by_uid(uid)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        active = data['active']
        if active:
            user.activate()
        else:
            user.deactivate()
        
        updated_user = user_repository.update_user(user)
        
        response = {
            'success': True,
            'message': 'User status updated successfully',
            'user': {
                'uid': updated_user.uid,
                'name': updated_user.name,
                'email': updated_user.email,
                'active': updated_user.active,
                'updated_at': updated_user.updated_at.isoformat()
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Failed to update user status {uid}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/health', methods=['GET'])
@require_auth
@require_admin
def get_system_health(current_user):
    """System health check"""
    try:
        from datetime import datetime
        
        health = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'services': {
                'database': 'connected',
                'ai_service': 'active',
                'file_processing': 'active'
            }
        }
        
        response = {
            'success': True,
            'health': health
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500