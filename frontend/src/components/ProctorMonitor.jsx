import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../config/firebase'
import { AlertTriangle, Eye, EyeOff, Monitor } from 'lucide-react'

/**
 * ProctorMonitor - Comprehensive proctoring system for video interviews
 * Monitors candidate behavior and sends real-time alerts to recruiters
 */
function ProctorMonitor({ 
  interviewId, 
  isCandidate, 
  onViolation, 
  isActive = false 
}) {
  const [violations, setViolations] = useState([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [tabVisible, setTabVisible] = useState(true)
  const [suspiciousActivity, setSuspiciousActivity] = useState(0)
  const [proctorStatus, setProctorStatus] = useState('monitoring')
  
  const violationCountRef = useRef(0)
  const lastViolationRef = useRef(0)
  const monitoringRef = useRef(false)
  const roomDocRef = useRef(null)

  useEffect(() => {
    if (isActive && interviewId) {
      roomDocRef.current = doc(db, 'rooms', `room_${interviewId}`)
      startProctoring()
    }
    return () => stopProctoring()
  }, [isActive, interviewId])

  const startProctoring = () => {
    if (monitoringRef.current) return
    
    console.log('[Proctor] Starting monitoring...')
    monitoringRef.current = true
    setProctorStatus('active')
    
    // Monitor visibility changes (tab switching)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Monitor fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)
    
    // Monitor window focus/blur
    window.addEventListener('focus', handleWindowFocus)
    window.addEventListener('blur', handleWindowBlur)
    
    // Monitor keyboard shortcuts (Alt+Tab, Ctrl+Tab, etc.)
    document.addEventListener('keydown', handleKeyDown)
    
    // Monitor mouse leave (potential window switching)
    document.addEventListener('mouseleave', handleMouseLeave)
    
    // Monitor right-click context menu
    document.addEventListener('contextmenu', handleContextMenu)
    
    // Monitor developer tools
    setInterval(detectDevTools, 2000)
    
    // Monitor screen recording/sharing
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      monitorScreenCapture()
    }
    
    // Initial fullscreen check
    checkFullscreenStatus()
    
    if (isCandidate) {
      toast.success('Proctoring active - Stay focused on this window', {
        duration: 5000,
        icon: '👁️'
      })
      
      // Force fullscreen for candidates after 3 seconds
      setTimeout(() => {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().then(() => {
            toast.success('Interview is now in fullscreen mode', {
              duration: 3000,
              icon: '🔒'
            })
          }).catch(() => {
            toast.error('Please enable fullscreen mode for the interview', {
              duration: 8000,
              icon: '⚠️'
            })
          })
        }
      }, 3000)
    }
  }

  const stopProctoring = () => {
    if (!monitoringRef.current) return
    
    console.log('[Proctor] Stopping monitoring...')
    monitoringRef.current = false
    setProctorStatus('inactive')
    
    // Remove all event listeners
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
    document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    window.removeEventListener('focus', handleWindowFocus)
    window.removeEventListener('blur', handleWindowBlur)
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('mouseleave', handleMouseLeave)
    document.removeEventListener('contextmenu', handleContextMenu)
  }

  const handleVisibilityChange = () => {
    const isVisible = !document.hidden
    setTabVisible(isVisible)
    
    if (!isVisible && isCandidate && monitoringRef.current) {
      // Immediately try to refocus the window
      window.focus()
      
      // Record violation
      recordViolation('TAB_SWITCH', 'Candidate attempted to switch tabs/windows - BLOCKED', 'high')
      
      // Show strong warning
      toast.error('⚠️ TAB SWITCHING DETECTED! Stay focused on the interview.', {
        duration: 8000,
        style: {
          background: '#dc2626',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold'
        }
      })
    }
  }

  const handleFullscreenChange = () => {
    const isFS = !!(document.fullscreenElement || 
                    document.webkitFullscreenElement || 
                    document.mozFullScreenElement || 
                    document.msFullscreenElement)
    
    setIsFullscreen(isFS)
    
    if (!isFS && isCandidate && monitoringRef.current) {
      recordViolation('FULLSCREEN_EXIT', 'Candidate exited fullscreen mode', 'medium')
      
      // Try to re-enter fullscreen
      setTimeout(() => {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {})
        }
      }, 1000)
    }
  }

  const handleWindowFocus = () => {
    console.log('[Proctor] Window gained focus')
  }

  const handleWindowBlur = () => {
    if (isCandidate && monitoringRef.current) {
      // Immediately try to refocus
      setTimeout(() => {
        window.focus()
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {})
        }
      }, 100)
      
      recordViolation('WINDOW_BLUR', 'Candidate switched away from interview window - BLOCKED', 'high')
      
      // Show critical warning
      toast.error('🚨 WINDOW SWITCHING BLOCKED! Return to interview immediately.', {
        duration: 10000,
        style: {
          background: '#dc2626',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold'
        }
      })
    }
  }

  const handleKeyDown = (event) => {
    if (!isCandidate || !monitoringRef.current) return
    
    const { key, altKey, ctrlKey, metaKey, shiftKey } = event
    
    // Block ALL suspicious key combinations for candidates
    const blockedKeys = [
      { condition: altKey && key === 'Tab', type: 'ALT_TAB', message: 'Alt+Tab blocked' },
      { condition: ctrlKey && key === 'Tab', type: 'CTRL_TAB', message: 'Ctrl+Tab blocked' },
      { condition: ctrlKey && shiftKey && key === 'I', type: 'DEV_TOOLS', message: 'Developer tools blocked' },
      { condition: key === 'F12', type: 'DEV_TOOLS', message: 'F12 blocked' },
      { condition: ctrlKey && shiftKey && key === 'J', type: 'DEV_TOOLS', message: 'Console blocked' },
      { condition: ctrlKey && key === 'u', type: 'VIEW_SOURCE', message: 'View source blocked' },
      { condition: ctrlKey && key === 'U', type: 'VIEW_SOURCE', message: 'View source blocked' },
      { condition: metaKey && key === 'Tab', type: 'CMD_TAB', message: 'Cmd+Tab blocked (Mac)' },
      { condition: altKey && key === 'F4', type: 'ALT_F4', message: 'Alt+F4 blocked' },
      { condition: ctrlKey && key === 'w', type: 'CLOSE_TAB', message: 'Close tab blocked' },
      { condition: ctrlKey && key === 'W', type: 'CLOSE_TAB', message: 'Close tab blocked' },
      { condition: ctrlKey && key === 't', type: 'NEW_TAB', message: 'New tab blocked' },
      { condition: ctrlKey && key === 'T', type: 'NEW_TAB', message: 'New tab blocked' },
      { condition: ctrlKey && key === 'n', type: 'NEW_WINDOW', message: 'New window blocked' },
      { condition: ctrlKey && key === 'N', type: 'NEW_WINDOW', message: 'New window blocked' },
      { condition: ctrlKey && shiftKey && key === 'N', type: 'INCOGNITO', message: 'Incognito window blocked' },
      { condition: key === 'F5', type: 'REFRESH', message: 'Page refresh blocked' },
      { condition: ctrlKey && key === 'r', type: 'REFRESH', message: 'Page refresh blocked' },
      { condition: ctrlKey && key === 'R', type: 'REFRESH', message: 'Page refresh blocked' }
    ]
    
    for (const shortcut of blockedKeys) {
      if (shortcut.condition) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        
        recordViolation(shortcut.type, shortcut.message, 'high')
        
        // Show immediate feedback
        toast.error(`🚫 ${shortcut.message.toUpperCase()}`, {
          duration: 3000,
          style: {
            background: '#dc2626',
            color: 'white',
            fontWeight: 'bold'
          }
        })
        
        return false
      }
    }
  }

  const handleMouseLeave = () => {
    if (isCandidate && monitoringRef.current) {
      // Only record if mouse leaves for more than 2 seconds
      setTimeout(() => {
        if (!document.querySelector(':hover')) {
          recordViolation('MOUSE_LEAVE', 'Mouse left the browser window', 'low')
        }
      }, 2000)
    }
  }

  const handleContextMenu = (event) => {
    if (isCandidate && monitoringRef.current) {
      event.preventDefault()
      recordViolation('RIGHT_CLICK', 'Right-click context menu attempted', 'low')
    }
  }

  const detectDevTools = () => {
    if (!isCandidate || !monitoringRef.current) return
    
    const threshold = 160
    const widthThreshold = window.outerWidth - window.innerWidth > threshold
    const heightThreshold = window.outerHeight - window.innerHeight > threshold
    
    if (widthThreshold || heightThreshold) {
      recordViolation('DEV_TOOLS_OPEN', 'Developer tools may be open', 'high')
    }
  }

  const monitorScreenCapture = async () => {
    try {
      // This is a basic check - more sophisticated detection would require additional APIs
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      
      if (isCandidate) {
        recordViolation('SCREEN_CAPTURE', 'Screen capture/recording detected', 'high')
      }
    } catch (e) {
      // User denied or no screen capture - this is expected
    }
  }

  const checkFullscreenStatus = () => {
    const isFS = !!(document.fullscreenElement || 
                    document.webkitFullscreenElement || 
                    document.mozFullScreenElement || 
                    document.msFullscreenElement)
    setIsFullscreen(isFS)
  }

  const recordViolation = async (type, message, severity = 'medium') => {
    const now = Date.now()
    
    // Prevent spam violations (max 1 per 3 seconds of same type)
    if (now - lastViolationRef.current < 3000) return
    lastViolationRef.current = now
    
    violationCountRef.current += 1
    const violationCount = violationCountRef.current
    
    const violation = {
      id: `${type}_${now}`,
      type,
      message,
      severity,
      timestamp: now,
      count: violationCount,
      userAgent: navigator.userAgent,
      screenSize: `${screen.width}x${screen.height}`,
      windowSize: `${window.innerWidth}x${window.innerHeight}`
    }
    
    setViolations(prev => [...prev.slice(-9), violation])
    setSuspiciousActivity(violationCount)
    
    // Show warning to candidate
    if (isCandidate) {
      const severityColors = {
        low: '🟡',
        medium: '🟠', 
        high: '🔴'
      }
      
      toast.error(`${severityColors[severity]} Proctoring Alert: ${message}`, {
        duration: 4000
      })
      
      // Show escalating warnings
      if (violationCount >= 5) {
        toast.error('⚠️ Multiple violations detected! Interview may be flagged.', {
          duration: 6000
        })
      }
    }
    
    // Send to recruiter via Firebase
    try {
      if (roomDocRef.current) {
        await updateDoc(roomDocRef.current, {
          proctorViolations: arrayUnion(violation),
          lastViolation: violation,
          violationCount: violationCount
        })
      }
    } catch (error) {
      console.error('[Proctor] Failed to send violation:', error)
    }
    
    // Callback to parent component
    if (onViolation) {
      onViolation(violation)
    }
    
    console.log(`[Proctor] Violation recorded:`, violation)
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-400'
      case 'medium': return 'text-orange-400'
      case 'low': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusColor = () => {
    if (suspiciousActivity >= 5) return 'text-red-400'
    if (suspiciousActivity >= 3) return 'text-orange-400'
    if (suspiciousActivity >= 1) return 'text-yellow-400'
    return 'text-green-400'
  }

  // Don't render anything for candidates (monitoring runs in background)
  if (isCandidate) {
    return null
  }

  // Recruiter view - show monitoring dashboard
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-medium">Proctoring Monitor</h3>
        </div>
        <div className={`flex items-center gap-2 ${getStatusColor()}`}>
          <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span className="text-sm font-medium">
            {proctorStatus === 'active' ? 'Monitoring' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm">
          {tabVisible ? (
            <Eye className="w-4 h-4 text-green-400" />
          ) : (
            <EyeOff className="w-4 h-4 text-red-400" />
          )}
          <span className={tabVisible ? 'text-green-400' : 'text-red-400'}>
            {tabVisible ? 'Tab Visible' : 'Tab Hidden'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Monitor className="w-4 h-4" />
          <span className={isFullscreen ? 'text-green-400' : 'text-orange-400'}>
            {isFullscreen ? 'Fullscreen' : 'Windowed'}
          </span>
        </div>
      </div>

      {/* Screen Sharing Status */}
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Screen Sharing</span>
          <span className="text-blue-400 font-medium">
            Candidate Only
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Only candidates can share their screen during interviews
        </div>
      </div>

      {/* Violation Counter */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Violations</span>
          <span className={`font-bold ${getStatusColor()}`}>
            {suspiciousActivity}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              suspiciousActivity >= 5 ? 'bg-red-500' :
              suspiciousActivity >= 3 ? 'bg-orange-500' :
              suspiciousActivity >= 1 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min((suspiciousActivity / 10) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Recent Violations */}
      {violations.length > 0 && (
        <div>
          <h4 className="text-gray-400 text-sm font-medium mb-2">Recent Activity</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {violations.slice(-5).reverse().map((violation) => (
              <div key={violation.id} className="flex items-start gap-2 text-xs">
                <AlertTriangle className={`w-3 h-3 mt-0.5 ${getSeverityColor(violation.severity)}`} />
                <div className="flex-1">
                  <div className={`${getSeverityColor(violation.severity)} font-medium`}>
                    {violation.message}
                  </div>
                  <div className="text-gray-500">
                    {new Date(violation.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {violations.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-4">
          No violations detected
        </div>
      )}
    </div>
  )
}

export default ProctorMonitor