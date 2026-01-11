#!/usr/bin/env python3
"""
Flask application runner
Simple script to start the Flask development server
"""

from app import create_app
import os

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 8080))
    
    print(f"Starting Flask server on port {port}")
    print(f"Mode: {app.config['APP_MODE']}")
    print(f"Debug: {app.config['DEBUG']}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=app.config['DEBUG'],
        threaded=True
    )