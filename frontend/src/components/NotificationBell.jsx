import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCircle, AlertCircle, Info, Briefcase } from 'lucide-react'
import { useAuth } from '../contexts/FirebaseAuthContext'
import api from '../services/api'

/**
 * Notification Bell Component with dropdown
 */
function NotificationBell() {
  const { isAuthenticated, isCandidate, isRecruiter } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications()
    }
  }, [isAuthenticated])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadNotifications = async () => {
    // Generate contextual notifications based on user role
    const mockNotifications = []
    
    if (isCandidate) {
      try {
        const response = await api.get('/applications/my-applications')
        if (response.data.success && response.data.applications.length > 0) {
          const recentApps = response.data.applications.slice(0, 3)
          recentApps.forEach(app => {
            if (app.status === 'SHORTLISTED') {
              mockNotifications.push({
                id: app.id,
                type: 'success',
                title: 'Application Shortlisted!',
                message: `Your application for ${app.job_title} has been shortlisted.`,
                time: 'Recently',
                read: false
              })
            } else if (app.status === 'REVIEWED') {
              mockNotifications.push({
                id: app.id,
                type: 'info',
                title: 'Application Reviewed',
                message: `Your application for ${app.job_title} has been reviewed.`,
                time: 'Recently',
                read: true
              })
            }
          })
        }
      } catch (error) {
        console.error('Failed to load notifications:', error)
      }
      
      // Add default notifications
      mockNotifications.push({
        id: 'tip-1',
        type: 'info',
        title: 'Improve Your Resume',
        message: 'Check your ATS score and get AI suggestions to improve your resume.',
        time: 'Tip',
        read: true
      })
    }
    
    if (isRecruiter) {
      mockNotifications.push({
        id: 'recruiter-1',
        type: 'info',
        title: 'New Applicants',
        message: 'Check your job postings for new applications.',
        time: 'Tip',
        read: true
      })
    }
    
    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter(n => !n.read).length)
  }

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const clearAll = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'job':
        return <Briefcase className="w-5 h-5 text-purple-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-600 truncate">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
