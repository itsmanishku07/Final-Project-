"""
Vercel Serverless Function Entry Point
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask
from flask_cors import CORS
import logging
from datetime import datetime

# Create Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = 'ai-resume-screening-secret-key-2024'
app.config['DEBUG'] = False
app.config['APP_MODE'] = 'production'

# CORS - Allow all origins for now (update with your frontend URL later)
CORS(app, origins=['*'], supports_credentials=True)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

# Initialize Firebase
try:
    from config.firebase_config import initialize_firebase
    initialize_firebase()
except Exception as e:
    logging.error(f"Firebase initialization error: {e}")

# Register blueprints
try:
    from routes.auth_routes import auth_bp
    from routes.resume_routes import resume_bp
    from routes.job_routes import job_bp
    from routes.match_routes import match_bp
    from routes.admin_routes import admin_bp
    from routes.application_routes import application_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(resume_bp, url_prefix='/api/resumes')
    app.register_blueprint(job_bp, url_prefix='/api/jobs')
    app.register_blueprint(match_bp, url_prefix='/api/matches')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(application_bp, url_prefix='/api/applications')
except Exception as e:
    logging.error(f"Blueprint registration error: {e}")

@app.route('/api/health')
def health_check():
    return {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'platform': 'vercel'
    }

@app.route('/')
def root():
    return {
        'message': 'AI Resume Screening API',
        'version': '1.0.0',
        'status': 'running'
    }

@app.errorhandler(400)
def bad_request(error):
    return {'success': False, 'message': 'Bad request'}, 400

@app.errorhandler(401)
def unauthorized(error):
    return {'success': False, 'message': 'Unauthorized'}, 401

@app.errorhandler(404)
def not_found(error):
    return {'success': False, 'message': 'Not found'}, 404

@app.errorhandler(500)
def internal_error(error):
    return {'success': False, 'message': 'Internal server error'}, 500
