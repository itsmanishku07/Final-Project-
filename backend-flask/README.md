# AI-Powered Resume Screening & Job Matching - Flask Backend

Enterprise-grade Flask backend for AI-powered resume screening and job matching application.

## Features

- **Flask REST API** with clean architecture
- **Firebase Authentication** integration
- **AI-powered resume analysis** (Demo and Production modes)
- **File processing** for PDF and DOCX resumes
- **Firestore database** with fallback to mock storage
- **Role-based access control** (Admin, Recruiter, Candidate)
- **Comprehensive error handling** and logging

## Architecture

```
backend-flask/
├── app.py                 # Flask application factory
├── run.py                 # Application runner
├── requirements.txt       # Python dependencies
├── config/               # Configuration modules
│   ├── firebase_config.py # Firebase initialization
├── models/               # Data models
│   ├── user.py           # User model
│   ├── resume.py         # Resume model
│   ├── job.py            # Job model
│   └── match.py          # Match model
├── repositories/         # Data access layer
│   ├── base_repository.py # Base repository class
│   ├── user_repository.py # User repository
│   ├── resume_repository.py # Resume repository
│   ├── job_repository.py  # Job repository
│   └── match_repository.py # Match repository
├── services/             # Business logic
│   ├── ai_service.py     # AI analysis service
│   └── file_service.py   # File processing service
├── routes/               # API endpoints
│   ├── auth_routes.py    # Authentication routes
│   ├── resume_routes.py  # Resume management routes
│   ├── job_routes.py     # Job posting routes
│   ├── match_routes.py   # Matching routes
│   └── admin_routes.py   # Admin routes
├── utils/                # Utility functions
│   └── auth_utils.py     # Authentication utilities
└── logs/                 # Application logs
```

## Installation

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Configuration

### Environment Variables

- `FLASK_ENV`: Environment (development/production)
- `FLASK_DEBUG`: Enable debug mode
- `PORT`: Server port (default: 8080)
- `APP_MODE`: Application mode (demo/production)
- `CORS_ORIGINS`: Allowed CORS origins

### Firebase Configuration

For production mode, configure Firebase credentials:
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Service account private key
- `FIREBASE_CLIENT_EMAIL`: Service account email

### Databricks Configuration (Production)

For production AI analysis:
- `DATABRICKS_API_URL`: Databricks workspace URL
- `DATABRICKS_TOKEN`: API token
- `DATABRICKS_MODEL_ENDPOINT`: Model serving endpoint

## Running the Application

### Development Mode

```bash
python run.py
```

### Production Mode

```bash
gunicorn -w 4 -b 0.0.0.0:8080 app:create_app()
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/validate` - Validate token

### Resume Management
- `POST /api/resumes/upload` - Upload resume
- `GET /api/resumes/my-resumes` - Get user's resumes
- `GET /api/resumes/<id>` - Get resume by ID
- `DELETE /api/resumes/<id>` - Delete resume
- `GET /api/resumes/processed` - Get processed resumes

### Job Management
- `POST /api/jobs` - Create job posting
- `GET /api/jobs` - Get all active jobs
- `GET /api/jobs/<id>` - Get job by ID
- `GET /api/jobs/my-jobs` - Get recruiter's jobs

### Matching
- `POST /api/matches/resume/<resume_id>/job/<job_id>` - Match resume to job
- `GET /api/matches/job/<job_id>` - Get matches for job
- `PUT /api/matches/<match_id>/review` - Update match review

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/<uid>/status` - Update user status
- `GET /api/admin/health` - System health check

## Demo Mode

The application runs in demo mode by default, which:
- Uses mock Firebase authentication
- Provides simulated AI analysis responses
- Uses in-memory storage instead of Firestore
- Allows testing without external dependencies

## Production Mode

Set `APP_MODE=production` to enable:
- Real Firebase authentication
- Databricks LLM integration
- Firestore database
- Production-grade error handling

## Security Features

- **JWT token validation** via Firebase
- **Role-based access control** (RBAC)
- **Input validation** and sanitization
- **CORS protection**
- **File type validation**
- **Request size limits**

## Logging

Application logs are written to:
- Console output (development)
- `logs/application.log` (production)

Log levels: DEBUG, INFO, WARNING, ERROR

## Error Handling

Comprehensive error handling with:
- Structured error responses
- Proper HTTP status codes
- Detailed logging
- Graceful degradation in demo mode

## Testing

The application includes:
- Mock services for testing
- Demo mode for development
- Comprehensive error scenarios
- Input validation testing

## Deployment

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8080

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8080", "app:create_app()"]
```

### Environment Setup

1. Set production environment variables
2. Configure Firebase service account
3. Set up Databricks integration
4. Configure logging and monitoring

## Monitoring

- Health check endpoint: `/api/health`
- Admin dashboard: `/api/admin/dashboard`
- Application logs in `logs/` directory
- Error tracking and metrics

## Contributing

1. Follow PEP 8 style guidelines
2. Add comprehensive error handling
3. Include logging for debugging
4. Write docstrings for all functions
5. Test in both demo and production modes