import { useState, useEffect } from 'react'
import { AlertTriangle, X, Shield } from 'lucide-react'

/**
 * ProctorAlert - Shows real-time proctoring alerts to recruiters
 */
function ProctorAlert({ violation, onDismiss }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Auto-dismiss after 8 seconds for low severity
    if (violation.severity === 'low') {
      const timer = setTimeout(() => {
        handleDismiss()
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [violation.severity])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => {
      if (onDismiss) onDismiss()
    }, 300)
  }

  const getSeverityStyles = () => {
    switch (violation.severity) {
      case 'high':
        return 'bg-red-900/90 border-red-500 text-red-100'
      case 'medium':
        return 'bg-orange-900/90 border-orange-500 text-orange-100'
      case 'low':
        return 'bg-yellow-900/90 border-yellow-500 text-yellow-100'
      default:
        return 'bg-gray-900/90 border-gray-500 text-gray-100'
    }
  }

  const getSeverityIcon = () => {
    switch (violation.severity) {
      case 'high':
        return '🔴'
      case 'medium':
        return '🟠'
      case 'low':
        return '🟡'
      default:
        return '⚪'
    }
  }

  if (!isVisible) return null

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm rounded-lg border-2 p-4 shadow-2xl backdrop-blur-sm transition-all duration-300 ${getSeverityStyles()}`}>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <span className="text-lg">{getSeverityIcon()}</span>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-sm">Proctoring Alert</h4>
            <button 
              onClick={handleDismiss}
              className="text-current hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm mb-2">{violation.message}</p>
          
          <div className="flex items-center justify-between text-xs opacity-75">
            <span>{new Date(violation.timestamp).toLocaleTimeString()}</span>
            <span className="capitalize">{violation.severity} severity</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProctorAlert