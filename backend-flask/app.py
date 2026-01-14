"""
AI-Powered Resume Screening & Job Matching Application - Flask Backend
Enterprise-grade Flask application with Firebase authentication and AI analysis
"""

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging
from datetime import datetime

# Load environment variables
load_dotenv()

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    app.config['APP_MODE'] = os.getenv('APP_MODE', 'demo')
    
    # CORS Configuration
    cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    CORS(app, origins=cors_origins, supports_credentials=True)
    
    # Logging Configuration
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('logs/application.log'),
            logging.StreamHandler()
        ]
    )
    
    # Create logs directory if it doesn't exist
    os.makedirs('logs', exist_ok=True)
    
    # Initialize Firebase
    from config.firebase_config import initialize_firebase
    initialize_firebase()
    
    # Initialize demo data in demo mode
    if app.config['APP_MODE'] == 'demo':
        from init_demo_data import initialize_demo_users
        initialize_demo_users()
    
    # Register blueprints
    from routes.auth_routes import auth_bp
    from routes.resume_routes import resume_bp
    from routes.job_routes import job_bp
    from routes.match_routes import match_bp
    from routes.admin_routes import admin_bp
    from routes.application_routes import application_bp
    from routes.interview_routes import interview_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(resume_bp, url_prefix='/api/resumes')
    app.register_blueprint(job_bp, url_prefix='/api/jobs')
    app.register_blueprint(match_bp, url_prefix='/api/matches')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(application_bp, url_prefix='/api/applications')
    app.register_blueprint(interview_bp, url_prefix='/api/interviews')
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'mode': app.config['APP_MODE'],
            'version': '1.0.0'
        }
    
    # Demo data initialization endpoint
    @app.route('/api/init-demo', methods=['POST'])
    def init_demo_data():
        if app.config['APP_MODE'] != 'demo':
            return {'success': False, 'message': 'Only available in demo mode'}, 400
        
        try:
            from init_demo_data import initialize_demo_users
            initialize_demo_users()
            return {'success': True, 'message': 'Demo users initialized'}
        except Exception as e:
            app.logger.error(f"Failed to initialize demo data: {e}")
            return {'success': False, 'message': str(e)}, 500
    
    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return {'success': False, 'message': 'Bad request'}, 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return {'success': False, 'message': 'Unauthorized'}, 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return {'success': False, 'message': 'Forbidden'}, 403
    
    @app.errorhandler(404)
    def not_found(error):
        return {'success': False, 'message': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'success': False, 'message': 'Internal server error'}, 500
    
    app.logger.info(f"Flask application initialized in {app.config['APP_MODE']} mode")
    
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG'])