#!/usr/bin/env python3
"""
Flask Backend Startup Script
Installs dependencies and starts the Flask development server
"""

import os
import sys
import subprocess
import platform

def install_dependencies():
    """Install Python dependencies"""
    print("Installing Python dependencies...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def create_logs_directory():
    """Create logs directory if it doesn't exist"""
    logs_dir = 'logs'
    if not os.path.exists(logs_dir):
        os.makedirs(logs_dir)
        print(f"✅ Created {logs_dir} directory")

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} detected")
    return True

def start_flask_server():
    """Start the Flask development server"""
    print("\n🚀 Starting Flask server...")
    print("=" * 50)
    
    # Set environment variables
    os.environ['FLASK_ENV'] = 'development'
    os.environ['FLASK_DEBUG'] = 'True'
    
    try:
        # Import and run the Flask app
        from app import create_app
        
        app = create_app()
        port = int(os.getenv('PORT', 8080))
        
        print(f"🌐 Server starting on http://localhost:{port}")
        print(f"📊 Mode: {app.config['APP_MODE']}")
        print(f"🔧 Debug: {app.config['DEBUG']}")
        print("=" * 50)
        print("Press Ctrl+C to stop the server")
        
        app.run(
            host='0.0.0.0',
            port=port,
            debug=app.config['DEBUG'],
            threaded=True
        )
        
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        return False
    
    return True

def main():
    """Main startup function"""
    print("🐍 AI Resume Matcher - Flask Backend")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Create necessary directories
    create_logs_directory()
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Setup failed. Please check the error messages above.")
        sys.exit(1)
    
    # Start the server
    if not start_flask_server():
        sys.exit(1)

if __name__ == '__main__':
    main()