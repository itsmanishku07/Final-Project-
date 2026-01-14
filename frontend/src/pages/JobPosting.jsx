import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/FirebaseAuthContext'
import api from '../services/api'
import AILoadingAnimation from '../components/AILoadingAnimation'
import LoadingSpinner from '../components/LoadingSpinner'
import { IndianRupee } from 'lucide-react'

/**
 * Job Posting Page
 * Allows recruiters to create and manage job postings
 */
function JobPosting() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    required_skills: [],
    min_experience: 0,
    max_experience: 10,
    education_level: '',
    job_type: '',
    compensation_type: 'CTC', // CTC or Stipend
    salary_min: '',
    salary_max: '',
    stipend_amount: '',
    expires_at: ''
  })
  const [skillInput, setSkillInput] = useState('')

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
      setLoadingJobs(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddSkill = (e) => {
    e.preventDefault()
    if (skillInput.trim() && !formData.required_skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, skillInput.trim()]
      }))
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('Job title is required')
      return
    }
    if (!formData.description.trim()) {
      toast.error('Job description is required')
      return
    }
    if (!formData.company.trim()) {
      toast.error('Company name is required')
      return
    }
    if (formData.required_skills.length === 0) {
      toast.error('At least one required skill must be specified')
      return
    }

    setLoading(true)

    try {
      const submitData = {
        ...formData,
        salary_min: formData.compensation_type === 'CTC' && formData.salary_min ? parseFloat(formData.salary_min) : 0,
        salary_max: formData.compensation_type === 'CTC' && formData.salary_max ? parseFloat(formData.salary_max) : 0,
        stipend_amount: formData.compensation_type === 'Stipend' && formData.stipend_amount ? parseFloat(formData.stipend_amount) : 0,
        expires_at: formData.expires_at || null
      }

      const response = await api.post('/jobs', submitData)
      
      if (response.data.success) {
        toast.success('Job posted successfully!')
        setShowForm(false)
        setFormData({
          title: '',
          description: '',
          company: '',
          location: '',
          required_skills: [],
          min_experience: 0,
          max_experience: 10,
          education_level: '',
          job_type: '',
          compensation_type: 'CTC',
          salary_min: '',
          salary_max: '',
          stipend_amount: '',
          expires_at: ''
        })
        loadJobs()
      } else {
        toast.error(response.data.message || 'Failed to post job')
      }
    } catch (error) {
      console.error('Job posting failed:', error)
      toast.error(error.response?.data?.message || 'Failed to post job')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatSalary = (job) => {
    if (job.stipend_amount && job.stipend_amount > 0) {
      return `₹${job.stipend_amount.toLocaleString('en-IN')}/month (Stipend)`
    }
    if (job.salary_min > 0 && job.salary_max > 0) {
      return `₹${job.salary_min.toLocaleString('en-IN')} - ₹${job.salary_max.toLocaleString('en-IN')} LPA`
    }
    if (job.salary_min > 0) {
      return `₹${job.salary_min.toLocaleString('en-IN')}+ LPA`
    }
    if (job.salary_max > 0) {
      return `Up to ₹${job.salary_max.toLocaleString('en-IN')} LPA`
    }
    return null
  }

  if (loadingJobs) {
    return <div className="flex justify-center items-center min-h-[400px]"><AILoadingAnimation message="Loading Jobs" context="jobs" size="medium" /></div>
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Postings</h1>
          <p className="text-gray-600">Create and manage your job postings</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Post New Job'}
        </button>
      </div>

      {/* Job Posting Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Job Posting</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company *
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  name="job_type"
                  value={formData.job_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select job type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
            </div>

            {/* Required Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Skills *
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill(e)}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.required_skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Experience (years)
                </label>
                <input
                  type="number"
                  name="min_experience"
                  value={formData.min_experience}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Experience (years)
                </label>
                <input
                  type="number"
                  name="max_experience"
                  value={formData.max_experience}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education Level
                </label>
                <select
                  name="education_level"
                  value={formData.education_level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  <option value="High School">High School</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
            </div>

            {/* Compensation Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Compensation Type
              </label>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="compensation_type"
                    value="CTC"
                    checked={formData.compensation_type === 'CTC'}
                    onChange={handleInputChange}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">CTC (Annual Package)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="compensation_type"
                    value="Stipend"
                    checked={formData.compensation_type === 'Stipend'}
                    onChange={handleInputChange}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Stipend (Monthly)</span>
                </label>
              </div>

              {formData.compensation_type === 'CTC' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum CTC (₹ LPA)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        <IndianRupee className="w-4 h-4" />
                      </span>
                      <input
                        type="number"
                        name="salary_min"
                        value={formData.salary_min}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Enter amount in Lakhs Per Annum</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum CTC (₹ LPA)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        <IndianRupee className="w-4 h-4" />
                      </span>
                      <input
                        type="number"
                        name="salary_max"
                        value={formData.salary_max}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Enter amount in Lakhs Per Annum</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Stipend (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      <IndianRupee className="w-4 h-4" />
                    </span>
                    <input
                      type="number"
                      name="stipend_amount"
                      value={formData.stipend_amount}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enter monthly stipend amount in Rupees</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Deadline
              </label>
              <input
                type="datetime-local"
                name="expires_at"
                value={formData.expires_at}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading && <LoadingSpinner size="small" className="mr-2" />}
                Post Job
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Your Job Postings</h2>
        </div>
        
        {jobs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No job postings yet. Create your first job posting to get started!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {jobs.map((job) => (
              <div key={job.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                      <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        job.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{job.company} • {job.location || 'Location not specified'}</p>
                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">{job.description}</p>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.required_skills.slice(0, 5).map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.required_skills.length > 5 && (
                        <span className="text-xs text-gray-500">
                          +{job.required_skills.length - 5} more
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-500 flex flex-wrap gap-4">
                      <span>Experience: {job.min_experience}-{job.max_experience} years</span>
                      {formatSalary(job) && (
                        <span className="flex items-center text-green-700 font-medium">
                          <IndianRupee className="w-3 h-3 mr-1" />
                          {formatSalary(job)}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-500">
                      Posted {formatDate(job.created_at)}
                      {job.expires_at && (
                        <span className="ml-4">Expires {formatDate(job.expires_at)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => window.location.href = `/candidate-ranking/${job.id}`}
                      className="text-blue-600 hover:text-blue-800 px-3 py-1 text-sm border border-blue-600 rounded hover:bg-blue-50"
                    >
                      View Candidates
                    </button>
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

export default JobPosting
