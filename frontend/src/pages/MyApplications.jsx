import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

/**
 * My Applications Page
 * Shows all job applications submitted by the candidate
 */
function MyApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      const response = await api.get('/applications/my-applications')
      if (response.data.success) {
        setApplications(response.data.applications)
      }
    } catch (error) {
      console.error('Failed to load applications:', error)
      toast.error('Failed to load your applications')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'REVIEWED':
        return 'bg-blue-100 text-blue-800'
      case 'SHORTLISTED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'HIRED':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return '⏳'
      case 'REVIEWED':
        return '👁️'
      case 'SHORTLISTED':
        return '⭐'
      case 'REJECTED':
        return '❌'
      case 'HIRED':
        return '🎉'
      default:
        return '📋'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
        <p className="text-gray-600">Track the status of your job applications</p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-500 mb-4">Start applying to jobs to see your applications here.</p>
          <a
            href="/jobs"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Jobs
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{app.job_title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                      {getStatusIcon(app.status)} {app.status}
                    </span>
                  </div>
                  <p className="text-blue-600 font-medium mb-2">{app.company}</p>
                  {app.location && (
                    <p className="text-gray-500 text-sm mb-3">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {app.location}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span>Applied: {formatDate(app.applied_at)}</span>
                    {app.match_score > 0 && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Match Score: {app.match_score.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Score Circle */}
                {app.match_score > 0 && (
                  <div className="ml-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold ${
                      app.match_score >= 80 ? 'bg-green-500' :
                      app.match_score >= 60 ? 'bg-blue-500' :
                      app.match_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      {app.match_score.toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Status Timeline */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm">
                  <span className={`w-3 h-3 rounded-full ${app.status === 'PENDING' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                  <span className="text-gray-600">Applied</span>
                  <span className="flex-1 h-px bg-gray-200 mx-2"></span>
                  <span className={`w-3 h-3 rounded-full ${['REVIEWED', 'SHORTLISTED', 'REJECTED', 'HIRED'].includes(app.status) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <span className="text-gray-600">Reviewed</span>
                  <span className="flex-1 h-px bg-gray-200 mx-2"></span>
                  <span className={`w-3 h-3 rounded-full ${['SHORTLISTED', 'HIRED'].includes(app.status) ? 'bg-green-500' : app.status === 'REJECTED' ? 'bg-red-500' : 'bg-gray-300'}`}></span>
                  <span className="text-gray-600">Decision</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyApplications
