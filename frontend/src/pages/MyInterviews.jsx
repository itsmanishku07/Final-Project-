import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from '../contexts/FirebaseAuthContext'
import AILoadingAnimation from '../components/AILoadingAnimation'
import { 
  Video, Calendar, Clock, Briefcase, Building, User,
  CheckCircle, XCircle, AlertCircle, Copy
} from 'lucide-react'

function MyInterviews() {
  const { isCandidate, isRecruiter } = useAuth()
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, upcoming, completed

  useEffect(() => {
    loadInterviews()
  }, [])

  const loadInterviews = async () => {
    try {
      const response = await api.get('/interviews/my-interviews')
      if (response.data.success) {
        setInterviews(response.data.interviews)
      }
    } catch (error) {
      console.error('Failed to load interviews:', error)
      toast.error('Failed to load interviews')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'CONFIRMED': 'bg-green-100 text-green-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'NO_SHOW': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SCHEDULED':
      case 'CONFIRMED':
        return <Calendar className="w-4 h-4" />
      case 'IN_PROGRESS':
        return <Video className="w-4 h-4" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />
      case 'CANCELLED':
      case 'NO_SHOW':
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    }
  }

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date()
  }

  const copyMeetingLink = (link) => {
    navigator.clipboard.writeText(link)
    toast.success('Meeting link copied!')
  }

  const filteredInterviews = interviews.filter(interview => {
    if (filter === 'upcoming') {
      return isUpcoming(interview.scheduled_at) && !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(interview.status)
    }
    if (filter === 'completed') {
      return ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(interview.status)
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <AILoadingAnimation message="Loading Interviews" context="interview" size="medium" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Interviews</h1>
        <p className="text-gray-600">
          {isCandidate ? 'View and join your scheduled interviews' : 'Manage your scheduled interviews'}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'upcoming', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {filteredInterviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Interviews Found</h3>
          <p className="text-gray-500">
            {filter === 'upcoming' 
              ? "You don't have any upcoming interviews scheduled."
              : filter === 'completed'
              ? "You don't have any completed interviews yet."
              : "You don't have any interviews scheduled yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map((interview) => {
            const { date, time, full } = formatDateTime(interview.scheduled_at)
            const upcoming = isUpcoming(interview.scheduled_at)
            const canJoin = upcoming && ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(interview.status)

            return (
              <div 
                key={interview.id} 
                className={`bg-white rounded-xl shadow-md overflow-hidden ${
                  canJoin ? 'border-l-4 border-green-500' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Job Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{interview.job_title}</h3>
                          <p className="text-gray-600 flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {interview.company}
                          </p>
                        </div>
                      </div>

                      {/* Date/Time */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span>{date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4 text-green-500" />
                          <span>{time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4 text-purple-500" />
                          <span>{interview.duration_minutes} min</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">
                            {isCandidate ? interview.recruiter_name : interview.candidate_name}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(interview.status)}`}>
                          {getStatusIcon(interview.status)}
                          {interview.status}
                        </span>
                        {canJoin && (
                          <span className="text-green-600 text-sm font-medium animate-pulse">
                            Ready to join
                          </span>
                        )}
                      </div>

                      {/* Notes */}
                      {interview.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Notes:</span> {interview.notes}
                          </p>
                        </div>
                      )}

                      {/* Feedback (for completed) */}
                      {interview.recruiter_feedback && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Feedback:</span> {interview.recruiter_feedback}
                          </p>
                          {interview.rating && (
                            <div className="mt-2 flex items-center gap-1">
                              <span className="text-sm font-medium text-blue-800">Rating:</span>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className={star <= interview.rating ? 'text-yellow-500' : 'text-gray-300'}>
                                  ★
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="ml-4 flex flex-col gap-2">
                      {canJoin && (
                        <Link
                          to={`/video-call/${interview.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          <Video className="w-4 h-4" />
                          Join Call
                        </Link>
                      )}
                      <button
                        onClick={() => copyMeetingLink(`${window.location.origin}/video-call/${interview.id}`)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MyInterviews
