# AI Resume Matcher - Deployment Guide

## Prerequisites

### Backend Requirements
- Java 17 or higher
- Maven 3.6+
- Firebase project with Firestore enabled
- Databricks workspace with LLM endpoint

### Frontend Requirements
- Node.js 18+ and npm
- Modern web browser

## Environment Setup

### 1. Firebase Configuration

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project
3. Enable Authentication (Email/Password)
4. Enable Firestore Database
5. Generate service account key

#### Download Service Account Key
1. Go to Project Settings > Service Accounts
2. Generate new private key
3. Save as `backend/src/main/resources/firebase-service-account.json`

#### Configure Firestore Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules
```

### 2. Databricks Setup

#### Create Databricks Workspace
1. Sign up for Databricks account
2. Create workspace
3. Deploy LLM model endpoint
4. Generate access token

#### Model Endpoint Configuration
- Use a foundation model like Llama 2 or GPT-3.5
- Configure for text generation with JSON output
- Note the endpoint URL and token

### 3. Backend Deployment

#### Local Development
```bash
cd backend

# Set environment variables
export FIREBASE_PROJECT_ID=your-project-id
export DATABRICKS_API_URL=https://your-workspace.databricks.com
export DATABRICKS_TOKEN=your-databricks-token
export DATABRICKS_MODEL_ENDPOINT=/serving-endpoints/your-model
export JWT_SECRET=your-jwt-secret-256-bits

# Run application
mvn spring-boot:run
```

#### Production Deployment (Docker)
```dockerfile
# Dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app
COPY target/ai-resume-matcher-1.0.0.jar app.jar
COPY src/main/resources/firebase-service-account.json /app/firebase-service-account.json

EXPOSE 8080

ENV FIREBASE_SERVICE_ACCOUNT_KEY=file:/app/firebase-service-account.json

CMD ["java", "-jar", "app.jar"]
```

```bash
# Build and deploy
mvn clean package
docker build -t ai-resume-matcher-backend .
docker run -p 8080:8080 \
  -e FIREBASE_PROJECT_ID=your-project-id \
  -e DATABRICKS_API_URL=https://your-workspace.databricks.com \
  -e DATABRICKS_TOKEN=your-databricks-token \
  -e DATABRICKS_MODEL_ENDPOINT=/serving-endpoints/your-model \
  -e JWT_SECRET=your-jwt-secret \
  ai-resume-matcher-backend
```

### 4. Frontend Deployment

#### Environment Configuration
Create `frontend/.env`:
```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_BASE_URL=http://localhost:8080/api
```

#### Local Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Production Build
```bash
# Build for production
npm run build

# Serve static files (example with nginx)
# Copy dist/ contents to web server
```

#### Deployment to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

## Production Considerations

### Security
- Use HTTPS in production
- Secure Firebase service account key
- Rotate Databricks tokens regularly
- Implement rate limiting
- Enable CORS only for trusted domains

### Monitoring
- Set up application logging
- Monitor Databricks API usage
- Track Firebase usage and costs
- Implement health checks

### Scaling
- Use load balancer for multiple backend instances
- Configure Firestore indexes for performance
- Implement caching for frequent queries
- Monitor and optimize AI API calls

### Backup and Recovery
- Regular Firestore backups
- Version control for configurations
- Document recovery procedures

## Environment Variables Reference

### Backend
```env
# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY=path-to-service-account.json

# Databricks
DATABRICKS_API_URL=https://your-workspace.databricks.com
DATABRICKS_TOKEN=your-databricks-token
DATABRICKS_MODEL_ENDPOINT=/serving-endpoints/your-model

# Security
JWT_SECRET=your-jwt-secret-256-bits

# Optional
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Frontend
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id

# API Configuration
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

## Troubleshooting

### Common Issues

#### Firebase Authentication Errors
- Verify service account key is valid
- Check Firebase project ID
- Ensure Firestore is enabled

#### Databricks Connection Issues
- Verify API URL and token
- Check model endpoint availability
- Monitor API rate limits

#### CORS Issues
- Configure allowed origins in backend
- Verify frontend domain is whitelisted

#### File Upload Issues
- Check file size limits (10MB)
- Verify supported file types (PDF, DOCX)
- Ensure Apache Tika dependencies are included

### Performance Optimization
- Enable Firestore indexes for queries
- Implement connection pooling
- Cache frequently accessed data
- Optimize AI prompt length
- Use CDN for frontend assets

### Monitoring Commands
```bash
# Check backend health
curl http://localhost:8080/api/health

# Monitor logs
docker logs -f container-name

# Check Firestore usage
firebase use your-project-id
firebase firestore:usage
```