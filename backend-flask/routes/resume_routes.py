"""
Resume routes for file upload and management
Handles resume processing and AI analysis
"""

from flask import Blueprint, request, jsonify
import logging
from functools import wraps
from repositories.resume_repository import ResumeRepository
from repositories.user_repository import UserRepository
from models.resume import Resume, AIAnalysis, ContactInfo
from services.file_service import FileProcessingService
from services.ai_service import get_ai_service
from utils.auth_utils import get_current_user
import threading

logger = logging.getLogger(__name__)

resume_bp = Blueprint('resume', __name__)
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

@resume_bp.route('/upload', methods=['POST'])
@require_auth
@require_role(['CANDIDATE', 'ADMIN'])
def upload_resume(current_user):
    """Upload resume file"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No file selected'}), 400
        
        # Validate user exists and is active
        user = user_repository.find_by_uid(current_user['uid'])
        if not user or not user.active:
            return jsonify({'success': False, 'message': 'User not found or inactive'}), 403
        
        # Validate file
        if not FileProcessingService.is_allowed_file(file.filename, file.content_type):
            return jsonify({'success': False, 'message': 'Invalid file type. Only PDF and DOCX files are allowed'}), 400
        
        file_content = file.read()
        if not FileProcessingService.is_valid_file_size(len(file_content)):
            return jsonify({'success': False, 'message': 'File size exceeds maximum limit of 10MB'}), 400
        
        # Extract text from file
        extracted_text = FileProcessingService.extract_text_from_file(
            file_content, file.content_type, file.filename
        )
        
        # Create resume entity
        resume = Resume(
            user_id=current_user['uid'],
            file_name=file.filename,
            content_type=file.content_type,
            file_size=len(file_content)
        )
        resume.set_extracted_text(extracted_text)
        
        # Save resume
        saved_resume = resume_repository.save_resume(resume)
        
        # Process asynchronously with AI
        def process_resume_async():
            try:
                logger.info(f"Starting AI analysis for resume: {saved_resume.id}")
                ai_response = ai_service.analyze_resume(extracted_text)
                
                # Create contact info from AI response
                contact_info = None
                if ai_response.contact_info:
                    contact_info = ContactInfo(
                        email=ai_response.contact_info.get('email', ''),
                        phone=ai_response.contact_info.get('phone', ''),
                        linkedin=ai_response.contact_info.get('linkedin', ''),
                        github=ai_response.contact_info.get('github', ''),
                        portfolio=ai_response.contact_info.get('portfolio', ''),
                        location=ai_response.contact_info.get('location', ''),
                        name=ai_response.contact_info.get('name', '')
                    )
                
                # Update resume with AI analysis
                analysis = AIAnalysis(
                    skills=ai_response.skills,
                    experience_years=ai_response.experience_years,
                    education=ai_response.education,
                    contact_info=contact_info
                )
                saved_resume.set_ai_analysis(analysis)
                resume_repository.update_resume(saved_resume)
                
                logger.info(f"AI analysis completed for resume: {saved_resume.id}")
                
            except Exception as e:
                logger.error(f"AI analysis failed for resume: {saved_resume.id}: {e}")
                saved_resume.mark_processing_failed()
                resume_repository.update_resume(saved_resume)
        
        # Start background processing
        thread = threading.Thread(target=process_resume_async)
        thread.daemon = True
        thread.start()
        
        response = {
            'success': True,
            'message': 'Resume uploaded successfully',
            'resume': {
                'id': saved_resume.id,
                'file_name': saved_resume.file_name,
                'file_size': saved_resume.file_size,
                'uploaded_at': saved_resume.uploaded_at.isoformat(),
                'processed': saved_resume.processed
            }
        }
        
        return jsonify(response), 201
        
    except Exception as e:
        logger.error(f"Resume upload failed: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@resume_bp.route('/my-resumes', methods=['GET'])
@require_auth
@require_role(['CANDIDATE', 'ADMIN'])
def get_my_resumes(current_user):
    """Get user's resumes"""
    try:
        resumes = resume_repository.find_by_user_id(current_user['uid'])
        
        resume_data = []
        for resume in resumes:
            data = {
                'id': resume.id,
                'file_name': resume.file_name,
                'file_size': resume.file_size,
                'uploaded_at': resume.uploaded_at.isoformat(),
                'analyzed_at': resume.analyzed_at.isoformat() if resume.analyzed_at else '',
                'processed': resume.processed,
                'ai_analysis': None
            }
            
            if resume.ai_analysis:
                data['ai_analysis'] = {
                    'skills': resume.ai_analysis.skills,
                    'experience_years': resume.ai_analysis.experience_years,
                    'education': resume.ai_analysis.education,
                    'contact_info': resume.ai_analysis.contact_info.to_dict() if resume.ai_analysis.contact_info else {}
                }
            
            resume_data.append(data)
        
        response = {
            'success': True,
            'resumes': resume_data
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Failed to get user resumes: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@resume_bp.route('/<resume_id>', methods=['GET'])
@require_auth
@require_role(['CANDIDATE', 'RECRUITER', 'ADMIN'])
def get_resume(current_user, resume_id):
    """Get resume by ID"""
    try:
        resume = resume_repository.find_by_id(resume_id)
        if not resume:
            return jsonify({'success': False, 'message': 'Resume not found'}), 404
        
        # Check access permissions
        user_role = current_user.get('role', '')
        if user_role not in ['ADMIN', 'RECRUITER'] and resume.user_id != current_user['uid']:
            return jsonify({'success': False, 'message': 'Unauthorized access'}), 403
        
        data = {
            'id': resume.id,
            'file_name': resume.file_name,
            'file_size': resume.file_size,
            'uploaded_at': resume.uploaded_at.isoformat(),
            'analyzed_at': resume.analyzed_at.isoformat() if resume.analyzed_at else '',
            'processed': resume.processed,
            'extracted_text': resume.extracted_text if user_role == 'ADMIN' else '',
            'ai_analysis': None
        }
        
        if resume.ai_analysis:
            data['ai_analysis'] = {
                'skills': resume.ai_analysis.skills,
                'experience_years': resume.ai_analysis.experience_years,
                'education': resume.ai_analysis.education,
                'contact_info': resume.ai_analysis.contact_info.to_dict() if resume.ai_analysis.contact_info else {}
            }
        
        response = {
            'success': True,
            'resume': data
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Failed to get resume {resume_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@resume_bp.route('/<resume_id>', methods=['DELETE'])
@require_auth
@require_role(['CANDIDATE', 'ADMIN'])
def delete_resume(current_user, resume_id):
    """Delete resume"""
    try:
        resume = resume_repository.find_by_id(resume_id)
        if not resume:
            return jsonify({'success': False, 'message': 'Resume not found'}), 404
        
        # Check ownership (unless admin)
        if current_user.get('role') != 'ADMIN' and resume.user_id != current_user['uid']:
            return jsonify({'success': False, 'message': 'Unauthorized to delete this resume'}), 403
        
        resume_repository.delete_resume(resume_id)
        
        response = {
            'success': True,
            'message': 'Resume deleted successfully'
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Failed to delete resume {resume_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@resume_bp.route('/processed', methods=['GET'])
@require_auth
@require_role(['RECRUITER', 'ADMIN'])
def get_processed_resumes(current_user):
    """Get all processed resumes (for recruiters)"""
    try:
        resumes = resume_repository.find_all_processed()
        
        resume_data = []
        for resume in resumes:
            data = {
                'id': resume.id,
                'file_name': resume.file_name,
                'uploaded_at': resume.uploaded_at.isoformat(),
                'analyzed_at': resume.analyzed_at.isoformat() if resume.analyzed_at else '',
                'ai_analysis': None
            }
            
            if resume.ai_analysis:
                data['ai_analysis'] = {
                    'skills': resume.ai_analysis.skills,
                    'experience_years': resume.ai_analysis.experience_years,
                    'education': resume.ai_analysis.education,
                    'contact_info': resume.ai_analysis.contact_info.to_dict() if resume.ai_analysis.contact_info else {}
                }
            
            resume_data.append(data)
        
        response = {
            'success': True,
            'resumes': resume_data
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Failed to get processed resumes: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@resume_bp.route('/<resume_id>/suggestions', methods=['GET'])
@require_auth
@require_role(['CANDIDATE', 'ADMIN'])
def get_resume_suggestions(current_user, resume_id):
    """Get AI-powered suggestions to improve resume"""
    try:
        resume = resume_repository.find_by_id(resume_id)
        if not resume:
            return jsonify({'success': False, 'message': 'Resume not found'}), 404
        
        # Check ownership
        if current_user.get('role') != 'ADMIN' and resume.user_id != current_user['uid']:
            return jsonify({'success': False, 'message': 'Unauthorized access'}), 403
        
        if not resume.extracted_text:
            return jsonify({'success': False, 'message': 'Resume text not available'}), 400
        
        # Get AI suggestions
        suggestions = ai_service.get_resume_suggestions(resume.extracted_text)
        
        response = {
            'success': True,
            'suggestions': suggestions.to_dict()
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Failed to get resume suggestions: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500