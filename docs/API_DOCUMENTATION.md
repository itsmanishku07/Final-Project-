# AI Resume Matcher - API Documentation

## Overview

The AI Resume Matcher API provides endpoints for user management, resume processing, job posting, and AI-powered matching. All endpoints require Firebase authentication except for registration.

**Base URL:** `http://localhost:8080/api`

## Authentication

All API requests (except registration) must include a Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## API Endpoints

### Authentication Endpoints

#### POST /auth/register
Register a new user in the system after Firebase authentication.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "CANDIDATE"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "uid": "firebase-uid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CANDIDATE"
  }
}
```

#### GET /auth/profile
Get current user profile.

**Response:**
```json
{
  "success": true,
  "user": {
    "uid": "firebase-uid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CANDIDATE",
    "active": true,
    "createdAt": "2024-01-10T10:00:00Z",
    "updatedAt": "2024-01-10T10:00:00Z"
  }
}
```

### Resume Endpoints

#### POST /resumes/upload
Upload a resume file for processing.

**Request:** Multipart form data with file field
- **file**: PDF or DOCX file (max 10MB)

**Response:**
```json
{
  "success": true,
  "message": "Resume uploaded successfully",
  "resume": {
    "id": "resume-id",
    "fileName": "john_doe_resume.pdf",
    "fileSize": 1024000,
    "uploadedAt": "2024-01-10T10:00:00Z",
    "processed": false
  }
}
```

#### GET /resumes/my-resumes
Get all resumes for the current user.

**Response:**
```json
{
  "success": true,
  "resumes": [
    {
      "id": "resume-id",
      "fileName": "john_doe_resume.pdf",
      "fileSize": 1024000,
      "uploadedAt": "2024-01-10T10:00:00Z",
      "analyzedAt": "2024-01-10T10:05:00Z",
      "processed": true,
      "aiAnalysis": {
        "skills": ["JavaScript", "React", "Node.js"],
        "experienceYears": 5,
        "education": "Bachelor's Degree"
      }
    }
  ]
}
```

#### GET /resumes/{id}
Get a specific resume by ID.

**Response:**
```json
{
  "success": true,
  "resume": {
    "id": "resume-id",
    "fileName": "john_doe_resume.pdf",
    "fileSize": 1024000,
    "uploadedAt": "2024-01-10T10:00:00Z",
    "analyzedAt": "2024-01-10T10:05:00Z",
    "processed": true,
    "extractedText": "Resume content...", // Only for admins
    "aiAnalysis": {
      "skills": ["JavaScript", "React", "Node.js"],
      "experienceYears": 5,
      "education": "Bachelor's Degree"
    }
  }
}
```

### Job Endpoints

#### POST /jobs
Create a new job posting.

**Request Body:**
```json
{
  "title": "Senior Frontend Developer",
  "description": "We are looking for an experienced frontend developer...",
  "company": "Tech Corp",
  "location": "San Francisco, CA",
  "requiredSkills": ["React", "JavaScript", "TypeScript"],
  "minExperience": 3,
  "maxExperience": 8,
  "educationLevel": "Bachelor's Degree",
  "jobType": "FULL_TIME",
  "salaryMin": 80000,
  "salaryMax": 120000,
  "expiresAt": "2024-03-10T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job created successfully",
  "job": {
    "id": "job-id",
    "title": "Senior Frontend Developer",
    "company": "Tech Corp",
    "createdAt": "2024-01-10T10:00:00Z",
    "active": true
  }
}
```

#### GET /jobs/my-jobs
Get all jobs posted by the current recruiter.

**Response:**
```json
{
  "success": true,
  "jobs": [
    {
      "id": "job-id",
      "title": "Senior Frontend Developer",
      "company": "Tech Corp",
      "location": "San Francisco, CA",
      "requiredSkills": ["React", "JavaScript", "TypeScript"],
      "createdAt": "2024-01-10T10:00:00Z",
      "active": true
    }
  ]
}
```

### Match Endpoints

#### GET /matches/job/{jobId}
Get all candidate matches for a specific job, ranked by similarity score.

**Response:**
```json
{
  "success": true,
  "matches": [
    {
      "matchId": "match-id",
      "resumeId": "resume-id",
      "jobId": "job-id",
      "candidateName": "John Doe",
      "candidateEmail": "john@example.com",
      "similarityScore": 85.5,
      "matchedSkills": ["React", "JavaScript"],
      "missingSkills": ["TypeScript"],
      "reasoning": "Strong match with relevant frontend experience",
      "matchedAt": "2024-01-10T10:00:00Z",
      "reviewed": false
    }
  ]
}
```

#### POST /matches/generate/{jobId}
Generate AI matches for a specific job against all processed resumes.

**Response:**
```json
{
  "success": true,
  "message": "Matches generated successfully",
  "matchCount": 15
}
```

## AI Analysis Response Format

The Databricks LLM returns analysis in this exact JSON format:

```json
{
  "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
  "experience_years": 5,
  "education": "Bachelor's Degree in Computer Science",
  "matched_skills": ["JavaScript", "React"],
  "missing_skills": ["TypeScript", "AWS"],
  "similarity_score": 78.5,
  "reasoning": "Strong frontend skills with React experience, missing some backend technologies"
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "VALIDATION_ERROR" // Optional error code
}
```

## HTTP Status Codes

- **200**: Success
- **201**: Created successfully
- **400**: Bad request / Validation error
- **401**: Unauthorized / Invalid token
- **403**: Forbidden / Insufficient permissions
- **404**: Resource not found
- **500**: Internal server error

## Rate Limiting

- File uploads: 5 requests per minute per user
- AI analysis: 10 requests per minute per user
- General API: 100 requests per minute per user

## File Upload Constraints

- **Supported formats**: PDF, DOCX
- **Maximum size**: 10MB
- **Text extraction**: Automatic via Apache Tika
- **Processing**: Asynchronous AI analysis