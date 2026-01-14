import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import AILoadingAnimation from '../components/AILoadingAnimation'
import LoadingSpinner from '../components/LoadingSpinner'

/**
 * My Jobs Page
 * Shows recruiter's job posting history with edit and delete options
 */
function MyJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingJob, setEditingJob] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const response = await api.get('/jobs/my-jobs')
      if (response.data.success) {
        setJobs(response.data.jobs)
      }
    } catch (error) {
      console.error('Failed to load jobs:', error)
      toast.error('Failed to load your jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (job) => {
    setEditingJob({
      ...job,
      required_skills: job.required_skills || []
    })
  }

  const handleCancelEdit = () => {
    setEditingJob(null)
  }

  const handleSaveEdit = async () => {
    if (!editingJob) return

    setSaving(true)
    try {
      const response = await api.put(`/jobs/${editingJob.id}`, {
        title: editingJob.title,
        description: editingJob.description,
        company: editingJob.company,
        location: editingJob.location,
        required_skills: editingJob.required_skills,
        min_experience: editingJob.min_experience,
        max_experience: editingJob.max_experience,
        education_level: editingJob.education_level,
        job_type: editingJob.job_type,
        salary_min: editingJob.salary_min,
        salary_max: editingJob.salary_max,
        active: editingJob.active
      })

      if (response.data.success) {
        toast.success('Job updated successfully')
        setEditingJob(null)
        loadJobs()
      } else {
        toast.error(response.data.message || 'Failed to update job')
      }
    } catch (error) {
      console.error('Failed to update job:', error)
      toast.error(error.response?.data?.message || 'Failed to update job')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return
    }

    setDeleting(jobId)
    try {
      const response = await api.delete(`/jobs/${jobId}`)
      if (response.data.success) {
        toast.success('Job deleted successfully')
        loadJobs()
      } else {
        toast.error(response.data.message || 'Failed to delete job')
      }
    } catch (error) {
      console.error('Failed to delete job:', error)
      toast.error(error.response?.data?.message || 'Failed to delete job')
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleActive = async (job) => {
    try {
      const response = await api.put(`/jobs/${job.id}`, {
        ...job,
        active: !job.active
      })

      if (response.data.success) {
        toast.success(job.active ? 'Job deactivated' : 'Job activated')
        loadJobs()
      }
    } catch (error) {
      console.error('Failed to toggle job status:', error)
      toast.error('Failed to update job status')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleEditChange = (field, value) => {
    setEditingJob(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSkillAdd = (skill) => {
    if (skill.trim() && !editingJob.required_skills.includes(skill.trim())) {
      setEditingJob(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, skill.trim()]
      }))
    }
  }

  const handleSkillRemove = (skillToRemove) => {
    setEditingJob(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter(s => s !== skillToRemove)
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <AILoadingAnimation message="Loading Jobs" context="jobs" size="medium" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Job Postings</h1>
          <p className="text-gray-600">Manage your job postings - edit, delete, or toggle status</p>
        </div>
        <Link
          to="/post-job"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Post New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
          <p className="text-gray-500 mb-4">Start by posting your first job opening.</p>
          <Link
            to="/post-job"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Post Your First Job
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {editingJob?.id === job.id ? (
                /* Edit Mode */
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Job</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                      <input
                        type="text"
                        value={editingJob.title}
                        onChange={(e) => handleEditChange('title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input
                        type="text"
                        value={editingJob.company}
                        onChange={(e) => handleEditChange('company', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={editingJob.location || ''}
                        onChange={(e) => handleEditChange('location', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                      <select
                        value={editingJob.job_type || ''}
                        onChange={(e) => handleEditChange('job_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select type</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Experience (years)</label>
                      <input
                        type="number"
                        value={editingJob.min_experience}
                        onChange={(e) => handleEditChange('min_experience', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Experience (years)</label>
                      <input
                        type="number"
                        value={editingJob.max_experience}
                        onChange={(e) => handleEditChange('max_experience', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={editingJob.description}
                        onChange={(e) => handleEditChange('description', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editingJob.required_skills.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center">
                            {skill}
                            <button
                              onClick={() => handleSkillRemove(skill)}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a skill"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleSkillAdd(e.target.value)
                              e.target.value = ''
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = e.target.previousSibling
                            handleSkillAdd(input.value)
                            input.value = ''
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    <div className="md:col-span-2 flex items-center">
                      <input
                        type="checkbox"
                        id="active"
                        checked={editingJob.active}
                        onChange={(e) => handleEditChange('active', e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                        Job is active and accepting applications
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      {saving ? (
                        <>
                          <LoadingSpinner size="small" className="mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {job.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-blue-600 font-medium mb-2">{job.company}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                        {job.location && (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {job.location}
                          </span>
                        )}
                        {job.job_type && <span>{job.job_type}</span>}
                        <span>{job.min_experience}-{job.max_experience} years exp</span>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">{job.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.required_skills?.slice(0, 5).map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                        {job.required_skills?.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{job.required_skills.length - 5} more
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Posted: {formatDate(job.created_at)}
                        {job.updated_at !== job.created_at && (
                          <span className="ml-4">Updated: {formatDate(job.updated_at)}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Link
                        to={`/applications/${job.id}`}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 text-center"
                      >
                        View Applicants
                      </Link>
                      <button
                        onClick={() => handleEdit(job)}
                        className="px-4 py-2 border border-blue-600 text-blue-600 text-sm rounded-lg hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(job)}
                        className={`px-4 py-2 text-sm rounded-lg ${
                          job.active
                            ? 'border border-yellow-600 text-yellow-600 hover:bg-yellow-50'
                            : 'border border-green-600 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {job.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        disabled={deleting === job.id}
                        className="px-4 py-2 border border-red-600 text-red-600 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        {deleting === job.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyJobs
