import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/FirebaseAuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
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

/**
 * Main App component with routing and authentication context
 * Provides role-based navigation and protected routes
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/jobs" element={<JobSearch />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              {/* Candidate Routes */}
              <Route path="/upload-resume" element={
                <ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']}>
                  <ResumeUpload />
                </ProtectedRoute>
              } />
              
              <Route path="/my-applications" element={
                <ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']}>
                  <MyApplications />
                </ProtectedRoute>
              } />
              
              {/* Recruiter Routes */}
              <Route path="/post-job" element={
                <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                  <JobPosting />
                </ProtectedRoute>
              } />
              
              <Route path="/recruiter-dashboard" element={
                <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                  <RecruiterDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/my-jobs" element={
                <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                  <MyJobs />
                </ProtectedRoute>
              } />
              
              <Route path="/applications/:jobId" element={
                <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                  <JobApplicants />
                </ProtectedRoute>
              } />
              
              <Route path="/candidate-ranking" element={
                <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                  <CandidateRanking />
                </ProtectedRoute>
              } />
              
              <Route path="/candidate-ranking/:jobId" element={
                <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                  <CandidateRanking />
                </ProtectedRoute>
              } />
            </Routes>
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
  )
}

export default App
