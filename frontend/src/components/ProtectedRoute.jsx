import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/FirebaseAuthContext'
import LoadingSpinner from './LoadingSpinner'

/**
 * Protected route component for role-based access control
 * Redirects unauthenticated users to login page
 * Restricts access based on user roles
 */
const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { user, userProfile, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles && !allowedRoles.includes(userProfile?.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Required roles: {allowedRoles.join(', ')}
          </p>
          <p className="text-sm text-gray-500">
            Your role: {userProfile?.role || 'Unknown'}
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute