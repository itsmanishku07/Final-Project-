# Vercel Deployment Guide for Flask Backend

## Quick Deploy Steps

### 1. Install Vercel CLI (if not installed)
```bash
npm install -g vercel
```

### 2. Navigate to backend folder
```bash
cd backend-flask
```

### 3. Deploy to Vercel
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Select your account
- Link to existing project? **No** (for first time)
- Project name? `ai-resume-api` (or your choice)
- Directory? `./` (current directory)
- Override settings? **No**

### 4. Set Environment Variables

Go to your Vercel Dashboard → Project → Settings → Environment Variables

Add these variables:

| Variable | Value |
|----------|-------|
| `APP_MODE` | `production` |
| `SECRET_KEY` | Your secret key (generate a random string) |
| `CORS_ORIGINS` | Your frontend URL (e.g., `https://your-frontend.vercel.app`) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Your Firebase service account JSON (see below) |

### 5. Get Firebase Service Account JSON

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Open the downloaded JSON file
4. Copy the entire content
5. Paste it as the value for `FIREBASE_SERVICE_ACCOUNT_JSON` in Vercel

**Important:** The JSON must be on a single line. You can use this command:
```bash
cat firebase-service-account.json | jq -c .
```

Or manually remove all newlines from the JSON.

### 6. Redeploy with Environment Variables
```bash
vercel --prod
```

## API Endpoints

After deployment, your API will be available at:
- `https://your-project.vercel.app/api/health` - Health check
- `https://your-project.vercel.app/api/auth/*` - Authentication
- `https://your-project.vercel.app/api/resumes/*` - Resume operations
- `https://your-project.vercel.app/api/jobs/*` - Job operations
- `https://your-project.vercel.app/api/applications/*` - Applications

## Update Frontend API URL

Update your frontend `.env.production`:
```
VITE_API_URL=https://your-backend.vercel.app
```

## Troubleshooting

### "Module not found" errors
Make sure all imports use relative paths from the `api/index.py` file.

### Firebase initialization fails
- Check that `FIREBASE_SERVICE_ACCOUNT_JSON` is valid JSON
- Ensure the JSON is on a single line
- Verify the service account has Firestore permissions

### CORS errors
- Add your frontend URL to `CORS_ORIGINS` environment variable
- Multiple origins: separate with commas (no spaces)

### Cold start issues
Vercel serverless functions have cold starts. First request may be slow.

## File Structure for Vercel

```
backend-flask/
├── api/
│   └── index.py          # Vercel entry point
├── config/
├── models/
├── repositories/
├── routes/
├── services/
├── utils/
├── requirements.txt
├── vercel.json           # Vercel configuration
└── .vercelignore
```

## Production Checklist

- [ ] Set strong `SECRET_KEY`
- [ ] Configure `CORS_ORIGINS` with frontend URL
- [ ] Add Firebase credentials
- [ ] Test `/api/health` endpoint
- [ ] Update frontend API URL
- [ ] Test authentication flow
- [ ] Test resume upload
