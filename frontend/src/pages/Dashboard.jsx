import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { resumeAPI, jobAPI } from '../services/api'
import { Upload, Briefcase, Users, BarChart3, FileText, Target } from 'lucide-react'
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
    processedResumes: 0
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
      const resumesResponse = await resumeAPI.getMyResumes()
      if (resumesResponse.data.success) {
        const resumes = resumesResponse.data.resumes
        setStats(prev => ({
          ...prev,
          resumes: resumes.length,
          processedResumes: resumes.filter(r => r.processed).length
        }))
        
        setRecentActivity(resumes.slice(0, 5).map(resume => ({
          id: resume.id,
          type: 'resume',
          title: `Uploaded ${resume.file_name || resume.fileName || 'Resume'}`,
          date: parseDate(resume.uploaded_at || resume.uploadedAt),
          status: resume.processed ? 'Processed' : 'Processing'
        })))
      }
    } catch (error) {
      console.error('Failed to load candidate data:', error)
    }
  }

  const loadRecruiterData = async () => {
    try {
      const jobsResponse = await jobAPI.getMyJobs()
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
          description: 'Upload your resume for AI analysis',
          icon: Upload,
          link: '/upload-resume',
          color: 'bg-blue-500'
        },
        {
          title: 'View My Resumes',
          description: 'Manage your uploaded resumes',
          icon: FileText,
          link: '/upload-resume',
          color: 'bg-green-500'
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
          title: 'View Candidates',
          description: 'Browse and rank candidates',
          icon: Users,
          link: '/candidate-ranking',
          color: 'bg-orange-500'
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
          title: 'Processed',
          value: stats.processedResumes,
          icon: Target,
          color: 'text-green-600',
          bgColor: 'bg-green-50'
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
          title: 'Total Matches',
          value: stats.matches,
          icon: Target,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50'
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {getQuickActions().map((action, index) => {
            const Icon = action.icon
            return (
              <Link
                key={index}
                to={action.link}
                className="card hover:shadow-lg transition-shadow duration-200 group"
              >
                <div className="flex items-center">
                  <div className={`p-4 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-gray-600">{action.description}</p>
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
                      activity.type === 'resume' ? 'bg-blue-50' : 'bg-purple-50'
                    }`}>
                      {activity.type === 'resume' ? (
                        <FileText className={`h-4 w-4 ${
                          activity.type === 'resume' ? 'text-blue-600' : 'text-purple-600'
                        }`} />
                      ) : (
                        <Briefcase className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">
                        {activity.date.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    activity.status === 'Processed' || activity.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard