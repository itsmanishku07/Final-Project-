# Setup Script for AI Resume Matcher
# Switches between demo mode and Firebase mode

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("demo", "firebase")]
    [string]$Mode
)

Write-Host "🔥 AI Resume Matcher Setup" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

if ($Mode -eq "demo") {
    Write-Host "📋 Switching to DEMO mode..." -ForegroundColor Yellow
    
    # Update backend to demo mode
    $backendContent = Get-Content "backend-flask\.env" -Raw
    $backendContent = $backendContent -replace "APP_MODE=production", "APP_MODE=demo"
    $backendContent = $backendContent -replace "USE_FIREBASE=true", "USE_FIREBASE=false"
    $backendContent | Out-File -FilePath "backend-flask\.env" -Encoding UTF8 -NoNewline
    
    # Update frontend to use mock auth
    $appContent = Get-Content "frontend\src\App.jsx" -Raw
    $appContent = $appContent -replace "import { AuthProvider } from './contexts/FirebaseAuthContext'", "import { AuthProvider } from './contexts/MockAuthContext'"
    $appContent | Out-File -FilePath "frontend\src\App.jsx" -Encoding UTF8 -NoNewline
    
    Write-Host "✅ Demo mode activated!" -ForegroundColor Green
    Write-Host "📝 Demo credentials:" -ForegroundColor Cyan
    Write-Host "   Admin: admin@example.com / password123" -ForegroundColor White
    Write-Host "   Recruiter: recruiter@example.com / password123" -ForegroundColor White
    Write-Host "   Candidate: candidate@example.com / password123" -ForegroundColor White
    
} elseif ($Mode -eq "firebase") {
    Write-Host "🚀 Switching to FIREBASE mode..." -ForegroundColor Yellow
    
    # Check if Firebase service account exists
    if (-not (Test-Path "backend-flask\firebase-service-account.json")) {
        Write-Host "❌ Firebase service account file not found!" -ForegroundColor Red
        Write-Host "📋 Please follow these steps:" -ForegroundColor Yellow
        Write-Host "1. Create Firebase project at https://console.firebase.google.com/" -ForegroundColor White
        Write-Host "2. Enable Authentication (Email/Password + Google)" -ForegroundColor White
        Write-Host "3. Enable Firestore Database" -ForegroundColor White
        Write-Host "4. Get service account key and save as 'backend-flask\firebase-service-account.json'" -ForegroundColor White
        Write-Host "5. Update frontend\.env with your Firebase config" -ForegroundColor White
        Write-Host "6. Run this script again" -ForegroundColor White
        exit 1
    }
    
    # Update backend to production mode
    $backendContent = Get-Content "backend-flask\.env" -Raw
    $backendContent = $backendContent -replace "APP_MODE=demo", "APP_MODE=production"
    $backendContent = $backendContent -replace "USE_FIREBASE=false", "USE_FIREBASE=true"
    $backendContent | Out-File -FilePath "backend-flask\.env" -Encoding UTF8 -NoNewline
    
    # Update frontend to use Firebase auth
    $appContent = Get-Content "frontend\src\App.jsx" -Raw
    $appContent = $appContent -replace "import { AuthProvider } from './contexts/MockAuthContext'", "import { AuthProvider } from './contexts/FirebaseAuthContext'"
    $appContent | Out-File -FilePath "frontend\src\App.jsx" -Encoding UTF8 -NoNewline
    
    Write-Host "✅ Firebase mode activated!" -ForegroundColor Green
    Write-Host "🔥 Real Firebase authentication enabled" -ForegroundColor Cyan
    Write-Host "💾 Data will be saved to Firestore" -ForegroundColor Cyan
    Write-Host "🔐 Google Sign-in available" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart Flask backend: python backend-flask\app.py" -ForegroundColor White
Write-Host "2. Restart frontend: npm run dev (in frontend folder)" -ForegroundColor White
Write-Host "3. Open http://localhost:3000" -ForegroundColor White

if ($Mode -eq "demo") {
    Write-Host "4. Initialize demo users: POST http://localhost:8080/api/init-demo" -ForegroundColor White
}