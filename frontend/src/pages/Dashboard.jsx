import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { resumeAPI, jobAPI } from '../services/api'
import api from '../services/api'
import { Upload, Briefcase, Users, BarChart3, FileText, Target, TrendingUp, Clock, CheckCircle, Eye } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

// Helper to safely parse dates from backend (handles both ISO strings and invalid values)
const parseDate = (dateValue) => {
  if (!dateValue) return new Date()
  const parsed = new Date(dateValue)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}

/**
 * Dashboard component with role-based content
 * Shows different metrics and actions based on user role
 */
const Dashboard = () => {
  const { userProfile, isCandidate, isRecruiter, isAdmin } = useAuth()
  const [stats, setStats] = useState({
    resumes: 0,
    jobs: 0,
    matches: 0,
    processedResumes: 0,
    applications: 0,
    shortlisted: 0,
    pending: 0,
    totalApplicants: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [userProfile])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      if (isCandidate) {
        await loadCandidateData()
      } else if (isRecruiter) {
        await loadRecruiterData()
      } else if (isAdmin) {
        await loadAdminData()
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCandidateData = async () => {
    try {
      const [resumesResponse, applicationsResponse] = await Promise.all([
        resumeAPI.getMyResumes(),
        api.get('/applications/my-applications')
      ])
      
      if (resumesResponse.data.success) {
        const resumes = resumesResponse.data.resumes
        setStats(prev => ({
          ...prev,
          resumes: resumes.length,
          processedResumes: resumes.filter(r => r.processed).length
        }))
        
        // Add resume activities
        const resumeActivities = resumes.slice(0, 3).map(resume => ({
          id: resume.id,
          type: 'resume',
          title: `Uploaded ${resume.file_name || resume.fileName || 'Resume'}`,
          date: parseDate(resume.uploaded_at || resume.uploadedAt),
          status: resume.processed ? 'Processed' : 'Processing'
        }))
        
        setRecentActivity(prev => [...resumeActivities])
      }
      
      if (applicationsResponse.data.success) {
        const applications = applicationsResponse.data.applications
        const shortlisted = applications.filter(a => a.status === 'SHORTLISTED').length
        const pending = applications.filter(a => a.status === 'PENDING').length
        
        setStats(prev => ({
          ...prev,
          applications: applications.length,
          shortlisted,
          pending
        }))
        
        // Add application activities
        const appActivities = applications.slice(0, 3).map(app => ({
          id: app.id,
          type: 'application',
          title: `Applied to ${app.job_title}`,
          date: parseDate(app.applied_at),
          status: app.status
        }))
        
        setRecentActivity(prev => [...prev, ...appActivities].slice(0, 5))
      }
    } catch (error) {
      console.error('Failed to load candidate data:', error)
    }
  }

  const loadRecruiterData = async () => {
    try {
      const [jobsResponse, dashboardResponse] = await Promise.all([
        jobAPI.getMyJobs(),
        api.get('/applications/dashboard')
      ])
      
      if (jobsResponse.data.success) {
        const jobs = jobsResponse.data.jobs
        setStats(prev => ({
          ...prev,
          jobs: jobs.length
        }))
        
        setRecentActivity(jobs.slice(0, 5).map(job => ({
          id: job.id,
          type: 'job',
          title: `Posted ${job.title}`,
          date: parseDate(job.created_at || job.createdAt),
          status: job.active ? 'Active' : 'Inactive'
        })))
      }
      
      if (dashboardResponse.data.success) {
        const summary = dashboardResponse.data.summary
        setStats(prev => ({
          ...prev,
          totalApplicants: summary.total_applications || 0,
          pending: summary.pending_review || 0,
          shortlisted: summary.shortlisted || 0
        }))
      }
    } catch (error) {
      console.error('Failed to load recruiter data:', error)
    }
  }

  const loadAdminData = async () => {
    try {
      const [resumesResponse, jobsResponse] = await Promise.all([
        resumeAPI.getProcessedResumes(),
        jobAPI.getAll()
      ])
      
      if (resumesResponse.data.success) {
        setStats(prev => ({
          ...prev,
          resumes: resumesResponse.data.resumes.length
        }))
      }
      
      if (jobsResponse.data.success) {
        setStats(prev => ({
          ...prev,
          jobs: jobsResponse.data.jobs.length
        }))
      }
    } catch (error) {
      console.error('Failed to load admin data:', error)
    }
  }

  const getQuickActions = () => {
    if (isCandidate) {
      return [
        {
          title: 'Upload Resume',
          description: 'Upload your resume for AI analysis & ATS score',
          icon: Upload,
          link: '/upload-resume',
          color: 'bg-blue-500'
        },
        {
          title: 'Find Jobs',
          description: 'Browse and apply to job openings',
          icon: Briefcase,
          link: '/jobs',
          color: 'bg-green-500'
        },
        {
          title: 'My Applications',
          description: 'Track your job applications',
          icon: FileText,
          link: '/my-applications',
          color: 'bg-purple-500'
        }
      ]
    } else if (isRecruiter) {
      return [
        {
          title: 'Post New Job',
          description: 'Create a new job posting',
          icon: Briefcase,
          link: '/post-job',
          color: 'bg-purple-500'
        },
        {
          title: 'View Applicants',
          description: 'Review job applications',
          icon: Users,
          link: '/recruiter-dashboard',
          color: 'bg-orange-500'
        },
        {
          title: 'My Jobs',
          description: 'Manage your job postings',
          icon: FileText,
          link: '/my-jobs',
          color: 'bg-blue-500'
        }
      ]
    } else if (isAdmin) {
      return [
        {
          title: 'System Overview',
          description: 'Monitor system performance',
          icon: BarChart3,
          link: '/admin/overview',
          color: 'bg-red-500'
        },
        {
          title: 'Manage Users',
          description: 'User management and roles',
          icon: Users,
          link: '/admin/users',
          color: 'bg-indigo-500'
        }
      ]
    }
    return []
  }

  const getStatCards = () => {
    if (isCandidate) {
      return [
        {
          title: 'My Resumes',
          value: stats.resumes,
          icon: FileText,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        },
        {
          title: 'AI Analyzed',
          value: stats.processedResumes,
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        },
        {
          title: 'Applications',
          value: stats.applications,
          icon: Briefcase,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        },
        {
          title: 'Shortlisted',
          value: stats.shortlisted,
          icon: TrendingUp,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50'
        }
      ]
    } else if (isRecruiter) {
      return [
        {
          title: 'Active Jobs',
          value: stats.jobs,
          icon: Briefcase,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        },
        {
          title: 'Total Applicants',
          value: stats.totalApplicants,
          icon: Users,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        },
        {
          title: 'Pending Review',
          value: stats.pending,
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50'
        },
        {
          title: 'Shortlisted',
          value: stats.shortlisted,
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        }
      ]
    } else if (isAdmin) {
      return [
        {
          title: 'Total Resumes',
          value: stats.resumes,
          icon: FileText,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        },
        {
          title: 'Total Jobs',
          value: stats.jobs,
          icon: Briefcase,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        }
      ]
    }
    return []
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processed':
      case 'Active':
      case 'SHORTLISTED':
      case 'HIRED':
        return 'bg-green-100 text-green-800'
      case 'Processing':
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'REVIEWED':
        return 'bg-blue-100 text-blue-800'
      case 'REJECTED':
      case 'Inactive':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {userProfile?.name}!
        </h1>
        <p className="text-primary-100 text-lg">
          {isCandidate && "Upload your resume and discover perfect job matches with AI"}
          {isRecruiter && "Find the best candidates for your job openings"}
          {isAdmin && "Monitor and manage the AI resume matching platform"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatCards().map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {getQuickActions().map((action, index) => {
            const Icon = action.icon
            return (
              <Link
                key={index}
                to={action.link}
                className="card card-hover group"
              >
                <div className="flex items-center">
                  <div className={`p-4 rounded-xl ${action.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{action.description}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="card">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'resume' ? 'bg-blue-50' : 
                      activity.type === 'application' ? 'bg-purple-50' : 'bg-green-50'
                    }`}>
                      {activity.type === 'resume' ? (
                        <FileText className="h-4 w-4 text-blue-600" />
                      ) : activity.type === 'application' ? (
                        <Briefcase className="h-4 w-4 text-purple-600" />
                      ) : (
                        <Briefcase className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">
                        {activity.date.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tips Section for Candidates */}
      {isCandidate && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Tips to Improve Your Job Search</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Upload your resume and check your ATS score to improve visibility</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Add relevant keywords suggested by AI to match more jobs</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Apply to jobs that match your skills for better success rate</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default Dashboard