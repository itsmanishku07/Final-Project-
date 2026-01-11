# Firebase Setup Script for Windows
# This script helps you switch between demo and production modes

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("demo", "production")]
    [string]$Mode
)

Write-Host "🔥 Firebase Setup Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

if ($Mode -eq "demo") {
    Write-Host "📋 Switching to DEMO mode..." -ForegroundColor Yellow
    
    # Copy demo environment files
    Copy-Item "backend-flask\.env" "backend-flask\.env.backup" -Force
    Copy-Item "frontend\.env" "frontend\.env.backup" -Force
    
    # Update backend to demo mode
    $backendEnv = @"
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
PORT=8080

# Application Mode
APP_MODE=demo
USE_FIREBASE=false

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
"@
    
    $backendEnv | Out-File -FilePath "backend-flask\.env" -Encoding UTF8
    
    Write-Host "✅ Demo mode activated!" -ForegroundColor Green
    Write-Host "📝 Demo credentials:" -ForegroundColor Cyan
    Write-Host "   Admin: admin@example.com / password123" -ForegroundColor White
    Write-Host "   Recruiter: recruiter@example.com / password123" -ForegroundColor White
    Write-Host "   Candidate: candidate@example.com / password123" -ForegroundColor White
    
} elseif ($Mode -eq "production") {
    Write-Host "🚀 Switching to PRODUCTION mode..." -ForegroundColor Yellow
    
    # Check if Firebase service account exists
    if (-not (Test-Path "backend-flask\firebase-service-account.json")) {
        Write-Host "❌ Firebase service account file not found!" -ForegroundColor Red
        Write-Host "📋 Please follow these steps:" -ForegroundColor Yellow
        Write-Host "1. Go to Firebase Console → Project Settings → Service Accounts" -ForegroundColor White
        Write-Host "2. Click 'Generate new private key'" -ForegroundColor White
        Write-Host "3. Save the downloaded file as 'backend-flask\firebase-service-account.json'" -ForegroundColor White
        Write-Host "4. Update frontend\.env.production with your Firebase config" -ForegroundColor White
        Write-Host "5. Run this script again" -ForegroundColor White
        exit 1
    }
    
    # Copy production environment files
    if (Test-Path "backend-flask\.env.production") {
        Copy-Item "backend-flask\.env.production" "backend-flask\.env" -Force
    }
    
    if (Test-Path "frontend\.env.production") {
        Copy-Item "frontend\.env.production" "frontend\.env" -Force
    }
    
    Write-Host "✅ Production mode activated!" -ForegroundColor Green
    Write-Host "🔥 Firebase authentication enabled" -ForegroundColor Cyan
    Write-Host "💾 Data will be saved to Firestore" -ForegroundColor Cyan
    Write-Host "🔐 Google Sign-in available" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart Flask backend: python backend-flask\app.py" -ForegroundColor White
Write-Host "2. Restart frontend: npm run dev (in frontend folder)" -ForegroundColor White
Write-Host "3. Open http://localhost:3000" -ForegroundColor White