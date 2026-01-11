import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

/**
 * Recruiter Dashboard
 * Shows all jobs with application statistics and top candidates
 */
function RecruiterDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const response = await api.get('/applications/dashboard')
      if (response.data.success) {
        setDashboard(response.data)
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Recruiter Dashboard</h1>
        <p className="text-gray-600">Overview of your job postings and applications</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-blue-600">{dashboard.summary.total_jobs}</div>
          <div className="text-gray-600">Total Jobs</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-green-600">{dashboard.summary.active_jobs}</div>
          <div className="text-gray-600">Active Jobs</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-purple-600">{dashboard.summary.total_applications}</div>
          <div className="text-gray-600">Total Applications</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-yellow-600">{dashboard.summary.pending_review}</div>
          <div className="text-gray-600">Pending Review</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-emerald-600">{dashboard.summary.shortlisted}</div>
          <div className="text-gray-600">Shortlisted</div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Your Job Postings</h2>
          <Link
            to="/post-job"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            + Post New Job
          </Link>
        </div>

        {dashboard.jobs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">No jobs posted yet</p>
            <Link
              to="/post-job"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Post Your First Job
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {dashboard.jobs.map((job) => (
              <div key={job.job_id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{job.company}</p>

                    {/* Application Stats */}
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-medium">
                          {job.total_applications}
                        </span>
                        <span className="text-sm text-gray-600">Total</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center text-sm font-medium">
                          {job.pending}
                        </span>
                        <span className="text-sm text-gray-600">Pending</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-sm font-medium">
                          {job.shortlisted}
                        </span>
                        <span className="text-sm text-gray-600">Shortlisted</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-red-100 text-red-800 flex items-center justify-center text-sm font-medium">
                          {job.rejected}
                        </span>
                        <span className="text-sm text-gray-600">Rejected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-sm font-medium">
                          {job.hired}
                        </span>
                        <span className="text-sm text-gray-600">Hired</span>
                      </div>
                    </div>

                    {/* Top Candidates */}
                    {job.top_candidates.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Top Candidates</h4>
                        <div className="space-y-2">
                          {job.top_candidates.map((candidate, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm text-gray-900">{candidate.name}</span>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  candidate.match_score >= 80 ? 'bg-green-100 text-green-800' :
                                  candidate.match_score >= 60 ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {candidate.match_score.toFixed(0)}% match
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  candidate.status === 'SHORTLISTED' ? 'bg-green-100 text-green-800' :
                                  candidate.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {candidate.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <Link
                      to={`/applications/${job.job_id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                    >
                      View Applicants ({job.total_applications})
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RecruiterDashboard
