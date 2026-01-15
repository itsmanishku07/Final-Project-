import { useEffect, useState } from 'react'
import { Shield, AlertTriangle, Eye } from 'lucide-react'

/**
 * InterviewLockdown - Professional overlay for candidate interview security
 */
function InterviewLockdown({ isActive, onViolation }) {
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')

  useEffect(() => {
    if (!isActive) return

    // Prevent page unload/refresh
    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = 'Leaving will end your interview. Are you sure?'
      onViolation?.({
        type: 'PAGE_UNLOAD_ATTEMPT',
        message: 'Candidate attempted to leave the interview',
        severity: 'high'
      })
      return 'Leaving will end your interview. Are you sure?'
    }

    // Prevent back/forward navigation
    const handlePopState = (e) => {
      e.preventDefault()
      window.history.pushState(null, '', window.location.href)
      showTemporaryWarning('Navigation blocked - Stay in the interview')
      onViolation?.({
        type: 'NAVIGATION_ATTEMPT',
        message: 'Candidate attempted to navigate away',
        severity: 'high'
      })
    }

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
    
    // Push initial state to prevent back navigation
    window.history.pushState(null, '', window.location.href)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isActive, onViolation])

  const showTemporaryWarning = (message) => {
    setWarningMessage(message)
    setShowWarning(true)
    setTimeout(() => {
      setShowWarning(false)
    }, 4000)
  }

  if (!isActive) return null

  return (
    <>
      {/* Warning Overlay */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-red-900 border-2 border-red-500 rounded-xl p-8 max-w-md mx-4 text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Interview Security Alert</h2>
            <p className="text-red-100 text-lg mb-6">{warningMessage}</p>
            <div className="flex items-center justify-center gap-2 text-red-200">
              <Eye className="w-5 h-5" />
              <span className="text-sm">This action has been logged</span>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Security Indicator */}
      <div className="fixed top-4 left-4 z-40 bg-green-900/90 border border-green-500 rounded-lg px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-green-100">
          <Shield className="w-4 h-4" />
          <span className="text-sm font-medium">Interview Secured</span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </div>
      </div>
    </>
  )
}

export default InterviewLockdown