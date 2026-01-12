import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  Mail, Phone, Linkedin, Github, Globe, MapPin, User, Briefcase, 
  GraduationCap, X, FileText, Calendar, Code, ExternalLink,
  CheckCircle, XCircle, Building, ChevronDown, MessageSquare, HelpCircle,
  Lightbulb, Target, AlertCircle, RefreshCw
} from 'lucide-react'

function JobApplicants() {
  const { jobId } = useParams()
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [interviewQuestions, setInterviewQuestions] = useState(null)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [refreshingQuestions, setRefreshingQuestions] = useState(false)
  const [selectedAppForQuestions, setSelectedAppForQuestions] = useState(null)

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

  const updateStatus = async (applicationId, newStatus) => {
    setUpdating(true)
    try {
      const response = await api.put(`/applications/${applicationId}/status`, { status: newStatus })
      if (response.data.success) {
        toast.success('Status updated successfully')
        loadApplications()
      }
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'REVIEWED': 'bg-blue-100 text-blue-800',
      'SHORTLISTED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'HIRED': 'bg-purple-100 text-purple-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-blue-600 bg-blue-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const loadInterviewQuestions = async (applicationId) => {
    setLoadingQuestions(true)
    setSelectedAppForQuestions(applicationId)
    try {
      const response = await api.get(`/applications/${applicationId}/interview-questions`)
      if (response.data.success) {
        setInterviewQuestions(response.data)
      }
    } catch (error) {
      console.error('Failed to load interview questions:', error)
      toast.error(error.response?.data?.message || 'Failed to generate interview questions')
      setInterviewQuestions(null)
    } finally {
      setLoadingQuestions(false)
    }
  }

  const closeInterviewQuestions = () => {
    setInterviewQuestions(null)
    setSelectedAppForQuestions(null)
  }

  const refreshInterviewQuestions = async () => {
    if (!selectedAppForQuestions) return
    setRefreshingQuestions(true)
    try {
      const response = await api.get(`/applications/${selectedAppForQuestions}/interview-questions`)
      if (response.data.success) {
        setInterviewQuestions(response.data)
        toast.success('New questions generated!')
      }
    } catch (error) {
      toast.error('Failed to generate new questions')
    } finally {
      setRefreshingQuestions(false)
    }
  }

  // Candidate Profile Modal
  const CandidateProfileModal = ({ app, onClose }) => {
    const modalBodyRef = useRef(null)
    const [showScrollBtn, setShowScrollBtn] = useState(true)
    
    if (!app) return null
    
    const profile = app.candidate_profile || {}
    
    const handleModalScroll = () => {
      if (modalBodyRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = modalBodyRef.current
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100)
      }
    }
    
    const scrollModalToBottom = () => {
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTo({ top: modalBodyRef.current.scrollHeight, behavior: 'smooth' })
      }
    }
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-2xl flex-shrink-0">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                  {app.candidate_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{app.candidate_name}</h2>
                  {profile.headline && <p className="text-blue-100">{profile.headline}</p>}
                  <p className="text-blue-200">{app.candidate_email}</p>
                  <span className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    app.status === 'SHORTLISTED' ? 'bg-green-500' :
                    app.status === 'HIRED' ? 'bg-purple-500' :
                    app.status === 'REJECTED' ? 'bg-red-500' : 'bg-white/20'
                  }`}>
                    {app.status}
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Stats */}
            <div className="mt-4 flex items-center gap-4">
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <div className="text-3xl font-bold">{app.match_score?.toFixed(0) || 0}%</div>
                <div className="text-sm text-blue-100">Match Score</div>
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <div className="text-xl font-bold">{app.ai_analysis?.experience_years || 0} years</div>
                <div className="text-sm text-blue-100">Experience</div>
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <div className="text-sm font-bold">{app.ai_analysis?.education || 'N/A'}</div>
                <div className="text-sm text-blue-100">Education</div>
              </div>
            </div>
          </div>
          
          {/* Body */}
          <div 
            ref={modalBodyRef}
            onScroll={handleModalScroll}
            className="p-6 space-y-6 overflow-y-auto flex-1 relative"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
            {/* Contact Information from Profile */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center p-3 bg-white rounded-lg border">
                  <Mail className="w-5 h-5 text-indigo-500 mr-3" />
                  <div>
                    <div className="text-xs text-gray-500">Email</div>
                    <a href={`mailto:${app.candidate_email}`} className="text-indigo-600 hover:underline font-medium">
                      {app.candidate_email}
                    </a>
                  </div>
                </div>
                
                {profile.phone ? (
                  <div className="flex items-center p-3 bg-white rounded-lg border">
                    <Phone className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <div className="text-xs text-gray-500">Phone</div>
                      <a href={`tel:${profile.phone}`} className="text-green-600 hover:underline font-medium">
                        {profile.phone}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center p-3 bg-gray-100 rounded-lg border border-dashed">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-400 text-sm">Phone not provided</span>
                  </div>
                )}
                
                {profile.location ? (
                  <div className="flex items-center p-3 bg-white rounded-lg border">
                    <MapPin className="w-5 h-5 text-red-500 mr-3" />
                    <div>
                      <div className="text-xs text-gray-500">Location</div>
                      <span className="font-medium">{profile.location}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center p-3 bg-gray-100 rounded-lg border border-dashed">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-400 text-sm">Location not provided</span>
                  </div>
                )}
                
                {profile.linkedin ? (
                  <div className="flex items-center p-3 bg-white rounded-lg border">
                    <Linkedin className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <div className="text-xs text-gray-500">LinkedIn</div>
                      <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                         className="text-blue-600 hover:underline font-medium flex items-center">
                        View Profile <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center p-3 bg-gray-100 rounded-lg border border-dashed">
                    <Linkedin className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-400 text-sm">LinkedIn not provided</span>
                  </div>
                )}
                
                {profile.github ? (
                  <div className="flex items-center p-3 bg-white rounded-lg border">
                    <Github className="w-5 h-5 text-gray-800 mr-3" />
                    <div>
                      <div className="text-xs text-gray-500">GitHub</div>
                      <a href={profile.github} target="_blank" rel="noopener noreferrer"
                         className="text-gray-700 hover:underline font-medium flex items-center">
                        View Profile <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center p-3 bg-gray-100 rounded-lg border border-dashed">
                    <Github className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-400 text-sm">GitHub not provided</span>
                  </div>
                )}
                
                {profile.portfolio ? (
                  <div className="flex items-center p-3 bg-white rounded-lg border">
                    <Globe className="w-5 h-5 text-purple-500 mr-3" />
                    <div>
                      <div className="text-xs text-gray-500">Portfolio</div>
                      <a href={profile.portfolio} target="_blank" rel="noopener noreferrer"
                         className="text-purple-600 hover:underline font-medium flex items-center">
                        View Website <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center p-3 bg-gray-100 rounded-lg border border-dashed">
                    <Globe className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-400 text-sm">Portfolio not provided</span>
                  </div>
                )}
              </div>
              
              {/* Bio */}
              {profile.bio && (
                <div className="mt-4 p-4 bg-white rounded-lg border">
                  <div className="text-xs text-gray-500 mb-2">About</div>
                  <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}
            </div>

            {/* Skills Analysis */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Code className="w-5 h-5 mr-2 text-blue-600" />
                Skills Analysis (from Resume)
              </h3>
              
              {app.matched_skills?.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center text-sm text-green-700 mb-2">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Matched Skills ({app.matched_skills.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {app.matched_skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {app.missing_skills?.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center text-sm text-red-700 mb-2">
                    <XCircle className="w-4 h-4 mr-1" />
                    Missing Skills ({app.missing_skills.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {app.missing_skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        ✗ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {app.ai_analysis?.skills?.length > 0 && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">All Skills ({app.ai_analysis.skills.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {app.ai_analysis.skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Work Experience from Profile */}
            {profile.work_experience?.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                  Work Experience
                </h3>
                <div className="space-y-4">
                  {profile.work_experience.map((exp, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-lg border-l-4 border-blue-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                          <p className="text-blue-600 flex items-center text-sm">
                            <Building className="w-4 h-4 mr-1" />{exp.company}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {exp.start_date && new Date(exp.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                          {' - '}
                          {exp.is_current ? 'Present' : (exp.end_date && new Date(exp.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }))}
                        </span>
                      </div>
                      {exp.location && <p className="text-sm text-gray-500 mt-1"><MapPin className="w-3 h-3 inline mr-1" />{exp.location}</p>}
                      {exp.description && <p className="text-gray-700 mt-2 text-sm">{exp.description}</p>}
                      {exp.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {exp.technologies.map((tech, techIdx) => (
                            <span key={techIdx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{tech}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education from Profile */}
            {profile.education?.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                  Education
                </h3>
                <div className="space-y-4">
                  {profile.education.map((edu, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-lg border-l-4 border-green-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{edu.degree} {edu.field && `in ${edu.field}`}</h4>
                          <p className="text-green-600 flex items-center text-sm">
                            <GraduationCap className="w-4 h-4 mr-1" />{edu.institution}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {edu.start_date && new Date(edu.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                          {' - '}
                          {edu.end_date && new Date(edu.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      {edu.grade && <p className="text-sm text-gray-600 mt-1">Grade: {edu.grade}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Skills */}
            {profile.skills?.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Code className="w-5 h-5 mr-2 text-purple-600" />
                  Skills (from Profile)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Cover Letter */}
            {app.cover_letter && (
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Cover Letter
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">{app.cover_letter}</p>
              </div>
            )}
            
            {/* Application Info */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Application Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Applied On:</span>
                  <span className="ml-2 font-medium">{formatDate(app.applied_at)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Resume:</span>
                  <span className="ml-2 font-medium">{app.resume_name || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              <a href={`mailto:${app.candidate_email}`}
                 className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Mail className="w-4 h-4 mr-2" /> Send Email
              </a>
              {profile.phone && (
                <a href={`tel:${profile.phone}`}
                   className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Phone className="w-4 h-4 mr-2" /> Call
                </a>
              )}
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
                </a>
              )}
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
                  <Github className="w-4 h-4 mr-2" /> GitHub
                </a>
              )}
            </div>
            
            {/* Floating Scroll Down Button */}
            {showScrollBtn && (
              <button
                onClick={scrollModalToBottom}
                className="sticky bottom-4 ml-auto w-10 h-10 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center transition-all duration-300 hover:scale-110"
                title="Scroll to bottom"
              >
                <ChevronDown className="w-5 h-5 animate-bounce" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Interview Questions Modal
  const InterviewQuestionsModal = ({ data, onClose, onRefresh, isRefreshing }) => {
    const [expandedQuestions, setExpandedQuestions] = useState({})
    
    if (!data) return null
    
    const toggleAnswer = (index) => {
      setExpandedQuestions(prev => ({
        ...prev,
        [index]: !prev[index]
      }))
    }
    
    const getDifficultyColor = (difficulty) => {
      switch (difficulty?.toLowerCase()) {
        case 'easy': return 'bg-green-100 text-green-700'
        case 'medium': return 'bg-yellow-100 text-yellow-700'
        case 'hard': return 'bg-red-100 text-red-700'
        default: return 'bg-gray-100 text-gray-700'
      }
    }
    
    const getCategoryIcon = (category) => {
      switch (category?.toLowerCase()) {
        case 'technical': return <Code className="w-4 h-4" />
        case 'behavioral': return <User className="w-4 h-4" />
        case 'experience': return <Briefcase className="w-4 h-4" />
        case 'communication': return <MessageSquare className="w-4 h-4" />
        case 'gap analysis': return <AlertCircle className="w-4 h-4" />
        default: return <HelpCircle className="w-4 h-4" />
      }
    }
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6 rounded-t-2xl flex-shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold flex items-center">
                  <Lightbulb className="w-7 h-7 mr-3" />
                  Interview Questions
                </h2>
                <p className="text-purple-100 mt-1">AI-generated questions for {data.candidate?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={onRefresh} 
                  disabled={isRefreshing}
                  className="p-2 hover:bg-white/20 rounded-full disabled:opacity-50 flex items-center gap-1"
                  title="Generate new questions"
                >
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Candidate Summary */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/20 rounded-lg px-3 py-2">
                <div className="text-lg font-bold">{data.candidate?.experience_years || 0} yrs</div>
                <div className="text-xs text-purple-100">Experience</div>
              </div>
              <div className="bg-white/20 rounded-lg px-3 py-2">
                <div className="text-lg font-bold">{data.candidate?.skills_count || 0}</div>
                <div className="text-xs text-purple-100">Skills</div>
              </div>
              <div className="bg-white/20 rounded-lg px-3 py-2">
                <div className="text-lg font-bold">{data.candidate?.matched_skills?.length || 0}</div>
                <div className="text-xs text-purple-100">Matched</div>
              </div>
              <div className="bg-white/20 rounded-lg px-3 py-2">
                <div className="text-lg font-bold">{data.total_questions}</div>
                <div className="text-xs text-purple-100">Questions</div>
              </div>
            </div>
          </div>
          
          {/* Questions List */}
          <div className="p-6 overflow-y-auto flex-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="space-y-4">
              {data.questions?.map((q, index) => (
                <div key={index} className="border rounded-xl overflow-hidden">
                  {/* Question Header */}
                  <div 
                    className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleAnswer(index)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center font-medium">
                            {index + 1}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(q.difficulty)}`}>
                            {q.difficulty}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                            {getCategoryIcon(q.category)}
                            {q.category}
                          </span>
                          {q.skill && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                              {q.skill}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-900 font-medium">{q.question}</p>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedQuestions[index] ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  
                  {/* Expected Answer */}
                  {expandedQuestions[index] && (
                    <div className="p-4 bg-green-50 border-t">
                      <div className="flex items-start gap-2">
                        <Target className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-green-800 mb-1">Expected Answer / What to Look For:</div>
                          <p className="text-green-700 text-sm">{q.expected_answer}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Tips Section */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <h3 className="font-semibold text-blue-900 flex items-center mb-2">
                <Lightbulb className="w-5 h-5 mr-2" />
                Interview Tips
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Click on each question to reveal the expected answer</li>
                <li>• Questions are tailored based on the candidate's resume and job requirements</li>
                <li>• Technical questions focus on skills mentioned in their resume</li>
                <li>• Gap analysis questions address skills the candidate may be missing</li>
              </ul>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Questions generated for: <span className="font-medium">{data.job?.title}</span> at <span className="font-medium">{data.job?.company}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={onRefresh} 
                disabled={isRefreshing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Generating...' : 'New Questions'}
              </button>
              <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Applicants for {job?.title}</h1>
        <p className="text-gray-600">{job?.company} • {applications.length} applicants</p>
        
        {job?.required_skills && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 mr-2">Required Skills:</span>
            {job.required_skills.map((skill, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{skill}</span>
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
          {applications.map((app) => {
            const profile = app.candidate_profile || {}
            
            return (
              <div key={app.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-semibold">
                          {app.candidate_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{app.candidate_name}</h3>
                          {profile.headline && <p className="text-gray-600 text-sm">{profile.headline}</p>}
                          <p className="text-gray-500 text-sm">{app.candidate_email}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className={`p-3 rounded-lg ${getMatchScoreColor(app.match_score)}`}>
                          <div className="text-2xl font-bold">{app.match_score?.toFixed(0) || 0}%</div>
                          <div className="text-xs">Match Score</div>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <div className="text-xl font-bold text-purple-700">{app.ai_analysis?.experience_years || 0} yrs</div>
                          <div className="text-xs text-purple-600">Experience</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-sm font-semibold text-green-700">{app.ai_analysis?.education || 'N/A'}</div>
                          <div className="text-xs text-green-600">Education</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-xl font-bold text-blue-700">{app.ai_analysis?.skills?.length || 0}</div>
                          <div className="text-xs text-blue-600">Skills</div>
                        </div>
                      </div>

                      {/* Quick Contact Info */}
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                        {profile.phone && (
                          <span className="flex items-center"><Phone className="w-4 h-4 mr-1 text-green-500" />{profile.phone}</span>
                        )}
                        {profile.location && (
                          <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-red-500" />{profile.location}</span>
                        )}
                        {profile.linkedin && (
                          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                            <Linkedin className="w-4 h-4 mr-1" />LinkedIn
                          </a>
                        )}
                        {profile.github && (
                          <a href={profile.github} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 hover:underline">
                            <Github className="w-4 h-4 mr-1" />GitHub
                          </a>
                        )}
                      </div>

                      {/* Matched Skills Preview */}
                      {app.matched_skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {app.matched_skills.slice(0, 5).map((skill, index) => (
                            <span key={index} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">✓ {skill}</span>
                          ))}
                          {app.matched_skills.length > 5 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">+{app.matched_skills.length - 5} more</span>
                          )}
                        </div>
                      )}

                      <div className="text-sm text-gray-500">Applied: {formatDate(app.applied_at)}</div>
                    </div>

                    {/* Actions */}
                    <div className="ml-6 flex flex-col gap-2">
                      <button onClick={() => setSelectedCandidate(app)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center justify-center">
                        <User className="w-4 h-4 mr-1" /> View Profile
                      </button>
                      
                      {app.status === 'PENDING' && (
                        <>
                          <button onClick={() => updateStatus(app.id, 'REVIEWED')} disabled={updating}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50">Mark Reviewed</button>
                          <button onClick={() => updateStatus(app.id, 'SHORTLISTED')} disabled={updating}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50">Shortlist</button>
                          <button onClick={() => updateStatus(app.id, 'REJECTED')} disabled={updating}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50">Reject</button>
                        </>
                      )}
                      {app.status === 'REVIEWED' && (
                        <>
                          <button onClick={() => updateStatus(app.id, 'SHORTLISTED')} disabled={updating}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50">Shortlist</button>
                          <button onClick={() => updateStatus(app.id, 'REJECTED')} disabled={updating}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50">Reject</button>
                        </>
                      )}
                      {app.status === 'SHORTLISTED' && (
                        <>
                          <button onClick={() => loadInterviewQuestions(app.id)} disabled={loadingQuestions && selectedAppForQuestions === app.id}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50 flex items-center justify-center">
                            {loadingQuestions && selectedAppForQuestions === app.id ? (
                              <LoadingSpinner size="small" />
                            ) : (
                              <><Lightbulb className="w-4 h-4 mr-1" /> Interview Questions</>
                            )}
                          </button>
                          <button onClick={() => updateStatus(app.id, 'HIRED')} disabled={updating}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50">Mark as Hired</button>
                          <button onClick={() => updateStatus(app.id, 'REJECTED')} disabled={updating}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50">Reject</button>
                        </>
                      )}
                      {app.status === 'HIRED' && (
                        <button onClick={() => loadInterviewQuestions(app.id)} disabled={loadingQuestions && selectedAppForQuestions === app.id}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50 flex items-center justify-center">
                          {loadingQuestions && selectedAppForQuestions === app.id ? (
                            <LoadingSpinner size="small" />
                          ) : (
                            <><Lightbulb className="w-4 h-4 mr-1" /> Interview Questions</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedCandidate && (
        <CandidateProfileModal app={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
      )}
      
      {interviewQuestions && (
        <InterviewQuestionsModal 
          data={interviewQuestions} 
          onClose={closeInterviewQuestions} 
          onRefresh={refreshInterviewQuestions}
          isRefreshing={refreshingQuestions}
        />
      )}
    </div>
  )
}

export default JobApplicants
