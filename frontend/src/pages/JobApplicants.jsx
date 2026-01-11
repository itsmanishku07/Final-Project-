import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

/**
 * Job Applicants Page
 * Shows all applicants for a specific job with AI analysis
 */
function JobApplicants() {
  const { jobId } = useParams()
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [jobId])

  const loadApplications = async () => {
    try {
      const response = await api.get(`/applications/job/${jobId}`)
      if (response.data.success) {
        setJob(response.data.job)
        setApplications(response.data.applications)
      }
    } catch (error) {
      console.error('Failed to load applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (applicationId, newStatus, notes = '') => {
    setUpdating(true)
    try {
      const response = await api.put(`/applications/${applicationId}/status`, {
        status: newStatus,
        notes: notes
      })
      if (response.data.success) {
        toast.success('Status updated successfully')
        loadApplications()
        setSelectedApp(null)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'REVIEWED': return 'bg-blue-100 text-blue-800'
      case 'SHORTLISTED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'HIRED': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-blue-600 bg-blue-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link to="/recruiter-dashboard" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Applicants for {job?.title}
        </h1>
        <p className="text-gray-600">{job?.company} • {applications.length} applicants</p>
        
        {/* Required Skills */}
        {job?.required_skills && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 mr-2">Required Skills:</span>
            {job.required_skills.map((skill, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">No applications received yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  {/* Candidate Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-semibold">
                        {app.candidate_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{app.candidate_name}</h3>
                        <p className="text-gray-600 text-sm">{app.candidate_email}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </div>

                    {/* Match Score & Skills */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Match Score */}
                      <div className={`p-4 rounded-lg ${getMatchScoreColor(app.match_score)}`}>
                        <div className="text-3xl font-bold">{app.match_score.toFixed(0)}%</div>
                        <div className="text-sm">Match Score</div>
                      </div>

                      {/* AI Analysis */}
                      {app.ai_analysis && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">AI Analysis</div>
                          <div className="font-medium">{app.ai_analysis.experience_years} years exp</div>
                          <div className="text-sm text-gray-600">{app.ai_analysis.education}</div>
                        </div>
                      )}
                    </div>

                    {/* Matched Skills */}
                    {app.matched_skills?.length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-600 mr-2">Matched Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {app.matched_skills.map((skill, index) => (
                            <span key={index} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                              ✓ {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Skills */}
                    {app.missing_skills?.length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-600 mr-2">Missing Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {app.missing_skills.map((skill, index) => (
                            <span key={index} className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                              ✗ {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Candidate Skills */}
                    {app.ai_analysis?.skills?.length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-600 mr-2">All Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {app.ai_analysis.skills.map((skill, index) => (
                            <span key={index} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cover Letter */}
                    {app.cover_letter && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Cover Letter</h4>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{app.cover_letter}</p>
                      </div>
                    )}

                    <div className="mt-4 text-sm text-gray-500">
                      Applied: {formatDate(app.applied_at)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-6 flex flex-col gap-2">
                    {app.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => updateStatus(app.id, 'REVIEWED')}
                          disabled={updating}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                        >
                          Mark Reviewed
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, 'SHORTLISTED')}
                          disabled={updating}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, 'REJECTED')}
                          disabled={updating}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {app.status === 'REVIEWED' && (
                      <>
                        <button
                          onClick={() => updateStatus(app.id, 'SHORTLISTED')}
                          disabled={updating}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, 'REJECTED')}
                          disabled={updating}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {app.status === 'SHORTLISTED' && (
                      <>
                        <button
                          onClick={() => updateStatus(app.id, 'HIRED')}
                          disabled={updating}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50"
                        >
                          Mark as Hired
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, 'REJECTED')}
                          disabled={updating}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default JobApplicants
