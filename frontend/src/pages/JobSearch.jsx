import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/FirebaseAuthContext'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

/**
 * Job Search Page
 * Allows candidates to search and browse jobs by company
 */
function JobSearch() {
  const { userProfile, isCandidate } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [resumes, setResumes] = useState([])
  const [selectedResume, setSelectedResume] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [applying, setApplying] = useState(false)
  const [appliedJobs, setAppliedJobs] = useState(new Set())

  useEffect(() => {
    loadJobs()
    loadCompanies()
    if (isCandidate) {
      loadResumes()
      loadMyApplications()
    }
  }, [isCandidate])

  const loadJobs = async (search = '', company = '') => {
    try {
      setLoading(true)
      let url = '/jobs'
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (company) params.append('company', company)
      if (params.toString()) url += `?${params.toString()}`
      
      const response = await api.get(url)
      if (response.data.success) {
        setJobs(response.data.jobs)
      }
    } catch (error) {
      console.error('Failed to load jobs:', error)
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const loadCompanies = async () => {
    try {
      const response = await api.get('/jobs/companies')
      if (response.data.success) {
        setCompanies(response.data.companies)
      }
    } catch (error) {
      console.error('Failed to load companies:', error)
    }
  }

  const loadResumes = async () => {
    try {
      const response = await api.get('/resumes/my-resumes')
      if (response.data.success) {
        setResumes(response.data.resumes.filter(r => r.processed))
      }
    } catch (error) {
      console.error('Failed to load resumes:', error)
    }
  }

  const loadMyApplications = async () => {
    try {
      const response = await api.get('/applications/my-applications')
      if (response.data.success) {
        const appliedJobIds = new Set(response.data.applications.map(app => app.job_id))
        setAppliedJobs(appliedJobIds)
      }
    } catch (error) {
      console.error('Failed to load applications:', error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadJobs(searchTerm, selectedCompany)
  }

  const handleCompanyFilter = (company) => {
    setSelectedCompany(company)
    loadJobs(searchTerm, company)
  }

  const handleApplyClick = (job) => {
    if (!userProfile) {
      toast.error('Please login to apply')
      navigate('/login')
      return
    }
    if (!isCandidate) {
      toast.error('Only candidates can apply to jobs')
      return
    }
    if (resumes.length === 0) {
      toast.error('Please upload a resume first')
      navigate('/upload-resume')
      return
    }
    setSelectedJob(job)
    setShowApplyModal(true)
  }

  const handleApply = async () => {
    if (!selectedResume) {
      toast.error('Please select a resume')
      return
    }

    setApplying(true)
    try {
      const response = await api.post('/applications/apply', {
        job_id: selectedJob.id,
        resume_id: selectedResume,
        cover_letter: coverLetter
      })

      if (response.data.success) {
        toast.success('Application submitted successfully!')
        setShowApplyModal(false)
        setSelectedJob(null)
        setSelectedResume('')
        setCoverLetter('')
        // Add job to applied list
        setAppliedJobs(prev => new Set([...prev, selectedJob.id]))
      } else {
        toast.error(response.data.message || 'Application failed')
      }
    } catch (error) {
      console.error('Application failed:', error)
      toast.error(error.response?.data?.message || 'Application failed')
    } finally {
      setApplying(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Not specified'
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    if (min) return `From $${min.toLocaleString()}`
    return `Up to $${max.toLocaleString()}`
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Jobs</h1>
        <p className="text-gray-600">Search and apply to jobs from top companies</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search jobs by title, company, or skills..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="md:w-64">
            <select
              value={selectedCompany}
              onChange={(e) => handleCompanyFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Companies</option>
              {companies.map((company, index) => (
                <option key={index} value={company.name}>
                  {company.name} ({company.job_count} jobs)
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No jobs found. Try a different search.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h3>
                      <p className="text-blue-600 font-medium mb-2">{job.company}</p>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-3">
                        {job.location && (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {job.location}
                          </span>
                        )}
                        {job.job_type && (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {job.job_type}
                          </span>
                        )}
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {job.min_experience}-{job.max_experience} years
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">{job.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.required_skills.slice(0, 5).map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                        {job.required_skills.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{job.required_skills.length - 5} more
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Posted {formatDate(job.created_at)}
                        </span>
                        {appliedJobs.has(job.id) ? (
                          <span className="px-4 py-2 bg-green-100 text-green-800 text-sm rounded-lg font-medium flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Applied
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApplyClick(job)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Apply Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Companies Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Companies Hiring</h3>
            <div className="space-y-3">
              {companies.slice(0, 10).map((company, index) => (
                <button
                  key={index}
                  onClick={() => handleCompanyFilter(company.name)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedCompany === company.name
                      ? 'bg-blue-100 text-blue-800'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">{company.name}</div>
                  <div className="text-sm text-gray-500">{company.job_count} open positions</div>
                </button>
              ))}
            </div>
            {selectedCompany && (
              <button
                onClick={() => handleCompanyFilter('')}
                className="mt-4 w-full text-center text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Apply to {selectedJob.title}</h3>
                  <p className="text-blue-600">{selectedJob.company}</p>
                </div>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Resume *
                  </label>
                  <select
                    value={selectedResume}
                    onChange={(e) => setSelectedResume(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose a resume</option>
                    {resumes.map((resume) => (
                      <option key={resume.id} value={resume.id}>
                        {resume.file_name} - {resume.ai_analysis?.skills?.length || 0} skills detected
                      </option>
                    ))}
                  </select>
                  {resumes.length === 0 && (
                    <p className="mt-1 text-sm text-red-600">
                      No processed resumes found. Please upload a resume first.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter (Optional)
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={4}
                    placeholder="Tell the employer why you're a great fit for this role..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.required_skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowApplyModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={applying || !selectedResume}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {applying ? (
                      <>
                        <LoadingSpinner size="small" className="mr-2" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobSearch
