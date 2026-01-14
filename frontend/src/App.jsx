import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/FirebaseAuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ResumeUpload from './pages/ResumeUpload'
import JobPosting from './pages/JobPosting'
import CandidateRanking from './pages/CandidateRanking'
import Profile from './pages/Profile'
import JobSearch from './pages/JobSearch'
import MyApplications from './pages/MyApplications'
import RecruiterDashboard from './pages/RecruiterDashboard'
import JobApplicants from './pages/JobApplicants'
import MyJobs from './pages/MyJobs'
import MyInterviews from './pages/MyInterviews'
import VideoCall from './pages/VideoCall'
import NotFound from './pages/NotFound'

/**
 * Main App component with routing and authentication context
 * Provides role-based navigation and protected routes
 */
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main>
              <ErrorBoundary>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/home" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/jobs" element={<div className="container mx-auto px-4 py-8"><JobSearch /></div>} />
                  
                  {/* Protected Routes */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <div className="container mx-auto px-4 py-8"><Dashboard /></div>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <div className="container mx-auto px-4 py-8"><Profile /></div>
                    </ProtectedRoute>
                  } />
                  
                  {/* Candidate Routes */}
                  <Route path="/upload-resume" element={
                    <ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']}>
                      <div className="container mx-auto px-4 py-8"><ResumeUpload /></div>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/my-applications" element={
                    <ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']}>
                      <div className="container mx-auto px-4 py-8"><MyApplications /></div>
                    </ProtectedRoute>
                  } />
                  
                  {/* Interview Routes - Both Candidate and Recruiter */}
                  <Route path="/my-interviews" element={
                    <ProtectedRoute>
                      <div className="container mx-auto px-4 py-8"><MyInterviews /></div>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/video-call/:interviewId" element={
                    <ProtectedRoute>
                      <VideoCall />
                    </ProtectedRoute>
                  } />
                  
                  {/* Recruiter Routes */}
                  <Route path="/post-job" element={
                    <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                      <div className="container mx-auto px-4 py-8"><JobPosting /></div>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/recruiter-dashboard" element={
                    <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                      <div className="container mx-auto px-4 py-8"><RecruiterDashboard /></div>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/my-jobs" element={
                    <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                      <div className="container mx-auto px-4 py-8"><MyJobs /></div>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/applications/:jobId" element={
                    <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                      <div className="container mx-auto px-4 py-8"><JobApplicants /></div>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/candidate-ranking" element={
                    <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                      <div className="container mx-auto px-4 py-8"><CandidateRanking /></div>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/candidate-ranking/:jobId" element={
                    <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                      <div className="container mx-auto px-4 py-8"><CandidateRanking /></div>
                    </ProtectedRoute>
                  } />
                  
                  {/* 404 Not Found - Must be last */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </main>
            
            {/* Toast notifications */}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
