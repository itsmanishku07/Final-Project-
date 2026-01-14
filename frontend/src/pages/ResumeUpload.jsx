import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/FirebaseAuthContext'
import api from '../services/api'
import AILoadingAnimation from '../components/AILoadingAnimation'
import LoadingSpinner from '../components/LoadingSpinner'

/**
 * Resume Upload Page
 * Allows candidates to upload their resume files for AI analysis
 */
function ResumeUpload() {
  const { } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedResume, setExpandedResume] = useState(null)
  const [suggestions, setSuggestions] = useState({})
  const [loadingSuggestions, setLoadingSuggestions] = useState({})
  const fileInputRef = useRef(null)

  // Load user's existing resumes
  useEffect(() => {
    loadResumes()
  }, [])

  const loadResumes = async () => {
    try {
      const response = await api.get('/resumes/my-resumes')
      if (response.data.success) {
        setResumes(response.data.resumes)
      }
    } catch (error) {
      console.error('Failed to load resumes:', error)
      toast.error('Failed to load your resumes')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (files) => {
    const file = files[0]
    if (file) {
      uploadResume(file)
    }
  }

  const uploadResume = async (file) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or DOCX file')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        toast.success('Resume uploaded successfully! AI analysis in progress...')
        loadResumes()
        // Auto-refresh after a few seconds to get analysis results
        setTimeout(() => loadResumes(), 5000)
      } else {
        toast.error(response.data.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error(error.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return
    }

    try {
      const response = await api.delete(`/resumes/${resumeId}`)
      if (response.data.success) {
        toast.success('Resume deleted successfully')
        loadResumes()
      }
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('Failed to delete resume')
    }
  }

  const toggleExpand = (resumeId) => {
    setExpandedResume(expandedResume === resumeId ? null : resumeId)
  }

  const loadSuggestions = async (resumeId) => {
    if (suggestions[resumeId]) return // Already loaded
    
    setLoadingSuggestions(prev => ({ ...prev, [resumeId]: true }))
    try {
      const response = await api.get(`/resumes/${resumeId}/suggestions`)
      if (response.data.success) {
        setSuggestions(prev => ({ ...prev, [resumeId]: response.data.suggestions }))
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error)
      toast.error('Failed to load AI suggestions')
    } finally {
      setLoadingSuggestions(prev => ({ ...prev, [resumeId]: false }))
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
    return <div className="flex justify-center items-center min-h-[400px]"><AILoadingAnimation message="Loading Resumes" context="resume" size="medium" /></div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Resume</h1>
        <p className="text-gray-600">
          Upload your resume for AI-powered analysis and job matching
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <LoadingSpinner size="large" />
              <p className="mt-4 text-gray-600">Uploading and analyzing your resume...</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop your resume here, or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports PDF and DOCX files up to 10MB
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Choose File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </>
          )}
        </div>
      </div>

      {/* Resume List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Your Resumes</h2>
          <button
            onClick={loadResumes}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        
        {resumes.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No resumes uploaded yet. Upload your first resume to get started!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {resumes.map((resume) => (
              <div key={resume.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">{resume.file_name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatFileSize(resume.file_size)}</span>
                          <span>Uploaded {formatDate(resume.uploaded_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Processing Status */}
                    <div className="mt-3">
                      {resume.processed ? (
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            AI Analysis Complete
                          </span>
                          {resume.ai_analysis && (
                            <button
                              onClick={() => toggleExpand(resume.id)}
                              className="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                            >
                              {expandedResume === resume.id ? 'Hide Details' : 'View Analysis'}
                              <svg 
                                className={`w-4 h-4 ml-1 transform transition-transform ${expandedResume === resume.id ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <svg className="animate-spin w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing... (Click Refresh to check status)
                        </span>
                      )}
                    </div>

                    {/* Expanded AI Analysis Details */}
                    {expandedResume === resume.id && resume.ai_analysis && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          AI Analysis Results
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Experience */}
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="font-medium text-gray-700">Experience</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-600">
                              {resume.ai_analysis.experience_years} years
                            </p>
                          </div>

                          {/* Education */}
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                              </svg>
                              <span className="font-medium text-gray-700">Education</span>
                            </div>
                            <p className="text-lg font-semibold text-green-600">
                              {resume.ai_analysis.education}
                            </p>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="mt-4">
                          <div className="flex items-center mb-3">
                            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            <span className="font-medium text-gray-700">
                              Skills Identified ({resume.ai_analysis.skills?.length || 0})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {resume.ai_analysis.skills?.map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                              >
                                {skill}
                              </span>
                            ))}
                            {(!resume.ai_analysis.skills || resume.ai_analysis.skills.length === 0) && (
                              <span className="text-gray-500 text-sm">No skills identified</span>
                            )}
                          </div>
                        </div>

                        {/* Analysis Date */}
                        {resume.analyzed_at && (
                          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
                            Analyzed on {formatDate(resume.analyzed_at)}
                          </div>
                        )}

                        {/* AI Suggestions Section */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                              <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              AI Improvement Suggestions
                            </h4>
                            {!suggestions[resume.id] && (
                              <button
                                onClick={() => loadSuggestions(resume.id)}
                                disabled={loadingSuggestions[resume.id]}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 text-sm flex items-center"
                              >
                                {loadingSuggestions[resume.id] ? (
                                  <>
                                    <LoadingSpinner size="small" className="mr-2" />
                                    Analyzing...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Get AI Suggestions
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {suggestions[resume.id] && (
                            <div className="space-y-4">
                              {/* ATS Score Card */}
                              {suggestions[resume.id].ats_score && (
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-lg text-white">
                                  <div className="flex items-center justify-between mb-4">
                                    <div>
                                      <h5 className="text-xl font-bold">ATS Compatibility Score</h5>
                                      <p className="text-indigo-100 text-sm">How well your resume passes Applicant Tracking Systems</p>
                                    </div>
                                    <div className="text-center">
                                      <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4 ${
                                        suggestions[resume.id].ats_score.total_score >= 70 ? 'border-green-300 bg-green-500/20' :
                                        suggestions[resume.id].ats_score.total_score >= 55 ? 'border-yellow-300 bg-yellow-500/20' :
                                        'border-red-300 bg-red-500/20'
                                      }`}>
                                        {suggestions[resume.id].ats_score.total_score}
                                      </div>
                                      <div className="mt-2 text-2xl font-bold">{suggestions[resume.id].ats_score.grade}</div>
                                    </div>
                                  </div>
                                  <p className="text-indigo-100">{suggestions[resume.id].ats_score.grade_description}</p>
                                </div>
                              )}

                              {/* ATS Score Breakdown */}
                              {suggestions[resume.id].ats_score?.breakdown && (
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    ATS Score Breakdown
                                  </h5>
                                  <div className="space-y-4">
                                    {Object.entries(suggestions[resume.id].ats_score.breakdown).map(([key, data]) => (
                                      <div key={key} className="border-b border-gray-100 pb-3 last:border-0">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-medium text-gray-700">{data.label || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                          <span className={`font-bold ${
                                            data.score >= data.max * 0.7 ? 'text-green-600' :
                                            data.score >= data.max * 0.4 ? 'text-yellow-600' : 'text-red-600'
                                          }`}>
                                            {data.score}/{data.max}
                                          </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                          <div 
                                            className={`h-2 rounded-full transition-all ${
                                              data.score >= data.max * 0.7 ? 'bg-green-500' :
                                              data.score >= data.max * 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${(data.score / data.max) * 100}%` }}
                                          ></div>
                                        </div>
                                        {data.details && data.details.length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                            {data.details.slice(0, 5).map((detail, idx) => (
                                              <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                {detail}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Summary */}
                              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-gray-700">{suggestions[resume.id].summary}</p>
                              </div>

                              {/* Spelling Errors */}
                              {suggestions[resume.id].spelling_errors?.length > 0 && (
                                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                  <h5 className="font-medium text-red-800 mb-2 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Spelling Errors ({suggestions[resume.id].spelling_errors.length})
                                  </h5>
                                  <div className="space-y-2">
                                    {suggestions[resume.id].spelling_errors.map((error, idx) => (
                                      <div key={idx} className="text-sm">
                                        <span className="text-red-600 line-through">{error.word}</span>
                                        <span className="mx-2">→</span>
                                        <span className="text-green-600 font-medium">{error.suggestion}</span>
                                        {error.context && (
                                          <p className="text-gray-500 text-xs mt-1 italic">{error.context}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Missing Sections */}
                              {suggestions[resume.id].missing_sections?.length > 0 && (
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                  <h5 className="font-medium text-orange-800 mb-2 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Missing Sections
                                  </h5>
                                  <div className="flex flex-wrap gap-2">
                                    {suggestions[resume.id].missing_sections.map((section, idx) => (
                                      <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                                        + {section}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Keyword Suggestions */}
                              {suggestions[resume.id].keyword_suggestions?.length > 0 && (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                  <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    Recommended Keywords to Add
                                  </h5>
                                  <div className="flex flex-wrap gap-2">
                                    {suggestions[resume.id].keyword_suggestions.map((keyword, idx) => (
                                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                        {keyword}
                                      </span>
                                    ))}
                                  </div>
                                  <p className="text-xs text-blue-600 mt-2">
                                    Adding these trending keywords can improve your ATS score and visibility to recruiters
                                  </p>
                                </div>
                              )}

                              {/* Formatting Tips */}
                              {suggestions[resume.id].formatting_tips?.length > 0 && (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                  <h5 className="font-medium text-green-800 mb-2 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Improvement Tips
                                  </h5>
                                  <ul className="space-y-2">
                                    {suggestions[resume.id].formatting_tips.map((tip, idx) => (
                                      <li key={idx} className="text-sm text-green-700 flex items-start">
                                        <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        {tip}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleDeleteResume(resume.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Delete resume"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
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

export default ResumeUpload
