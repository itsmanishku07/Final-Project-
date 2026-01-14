import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/FirebaseAuthContext'
import api from '../services/api'
import AILoadingAnimation from '../components/AILoadingAnimation'
import LoadingSpinner from '../components/LoadingSpinner'

/**
 * Candidate Ranking Page
 * Shows AI-powered candidate rankings for job postings
 */
function CandidateRanking() {
  const { jobId } = useParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [matching, setMatching] = useState(false)
  const [job, setJob] = useState(null)
  const [matches, setMatches] = useState([])
  const [selectedJob, setSelectedJob] = useState(jobId || '')
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    loadJobs()
  }, [])

  useEffect(() => {
    if (selectedJob) {
      loadJobDetails()
      loadMatches()
    }
  }, [selectedJob])

  const loadJobs = async () => {
    try {
      const response = await api.get('/jobs/my-jobs')
      if (response.data.success) {
        setJobs(response.data.jobs)
        if (!selectedJob && response.data.jobs.length > 0) {
          setSelectedJob(response.data.jobs[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load jobs:', error)
      toast.error('Failed to load your jobs')
    }
  }

  const loadJobDetails = async () => {
    try {
      const response = await api.get(`/jobs/${selectedJob}`)
      if (response.data.success) {
        setJob(response.data.job)
      }
    } catch (error) {
      console.error('Failed to load job details:', error)
      toast.error('Failed to load job details')
    }
  }

  const loadMatches = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/matches/job/${selectedJob}`)
      if (response.data.success) {
        setMatches(response.data.matches)
      }
    } catch (error) {
      console.error('Failed to load matches:', error)
      toast.error('Failed to load candidate matches')
    } finally {
      setLoading(false)
    }
  }

  const handleMatchAllResumes = async () => {
    if (!selectedJob) return

    setMatching(true)
    try {
      const response = await api.post(`/matches/job/${selectedJob}/match-all`)
      if (response.data.success) {
        toast.success(`Matched ${response.data.matchCount} resumes to this job`)
        loadMatches()
      }
    } catch (error) {
      console.error('Failed to match resumes:', error)
      toast.error('Failed to match resumes to job')
    } finally {
      setMatching(false)
    }
  }

  const handleUpdateReview = async (matchId, reviewed, notes = '') => {
    try {
      const response = await api.put(`/matches/${matchId}/review`, {
        reviewed,
        notes
      })
      if (response.data.success) {
        toast.success('Review updated successfully')
        loadMatches()
      }
    } catch (error) {
      console.error('Failed to update review:', error)
      toast.error('Failed to update review')
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent Match'
    if (score >= 60) return 'Good Match'
    return 'Partial Match'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Candidate Ranking</h1>
        <p className="text-gray-600">
          AI-powered candidate matching and ranking for your job postings
        </p>
      </div>

      {/* Job Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Job Posting
            </label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a job...</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} - {job.company}
                </option>
              ))}
            </select>
          </div>
          
          {selectedJob && (
            <button
              onClick={handleMatchAllResumes}
              disabled={matching}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {matching && <LoadingSpinner size="small" className="mr-2" />}
              {matching ? 'Matching...' : 'Match All Resumes'}
            </button>
          )}
        </div>

        {/* Job Details */}
        {job && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{job.title}</h3>
            <p className="text-gray-600 mb-3">{job.company} • {job.location || 'Location not specified'}</p>
            <p className="text-gray-700 text-sm mb-3 line-clamp-3">{job.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-sm text-gray-600 font-medium">Required Skills:</span>
              {job.required_skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                >
                  {skill}
                </span>
              ))}
            </div>
            
            <div className="text-sm text-gray-600">
              <span>Experience: {job.min_experience}-{job.max_experience} years</span>
              {job.education_level && (
                <span className="ml-4">Education: {job.education_level}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Matches List */}
      {selectedJob && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Candidate Matches ({matches.length})
              </h2>
              <div className="text-sm text-gray-500">
                Sorted by AI similarity score
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 flex justify-center">
              <AILoadingAnimation message="Loading Candidates" context="applications" size="medium" showFacts={false} />
            </div>
          ) : matches.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No candidate matches found for this job.</p>
              <p className="mt-2">Click "Match All Resumes" to find potential candidates.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {matches.map((match, index) => (
                <div key={match.match_id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex items-center">
                          <span className="text-lg font-medium text-gray-500 mr-3">
                            #{index + 1}
                          </span>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {match.candidate_name || 'Anonymous Candidate'}
                            </h3>
                            <p className="text-gray-600">{match.candidate_email}</p>
                          </div>
                        </div>
                        
                        <div className="ml-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(match.similarity_score)}`}>
                            {Math.round(match.similarity_score)}% • {getScoreLabel(match.similarity_score)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Skills Match */}
                      <div className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-green-700 mb-2">
                              Matched Skills ({match.matched_skills.length})
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {match.matched_skills.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          {match.missing_skills.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-red-700 mb-2">
                                Missing Skills ({match.missing_skills.length})
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {match.missing_skills.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-800"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* AI Reasoning */}
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">AI Analysis</h4>
                        <p className="text-sm text-gray-600">{match.reasoning}</p>
                      </div>
                      
                      {/* Review Status */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            Matched {formatDate(match.matched_at)}
                          </span>
                          {match.reviewed ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              Reviewed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                              Pending Review
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {!match.reviewed ? (
                            <button
                              onClick={() => handleUpdateReview(match.match_id, true)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Mark as Reviewed
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateReview(match.match_id, false)}
                              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                            >
                              Mark as Unreviewed
                            </button>
                          )}
                          
                          <button
                            onClick={() => window.open(`/resumes/${match.resume_id}`, '_blank')}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            View Resume
                          </button>
                        </div>
                      </div>
                      
                      {/* Recruiter Notes */}
                      {match.recruiter_notes && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                          <h4 className="text-sm font-medium text-yellow-800 mb-1">Notes</h4>
                          <p className="text-sm text-yellow-700">{match.recruiter_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CandidateRanking