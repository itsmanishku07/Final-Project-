import { useState, useEffect } from 'react'
import { Brain, Sparkles, Lightbulb, Zap, MessageSquare, Target, Briefcase, FileText, Search, User } from 'lucide-react'

const contextMessages = {
  default: [
    "Loading your content...",
    "Preparing everything...",
    "Almost ready...",
    "Just a moment..."
  ],
  interview: [
    "Analyzing candidate's resume...",
    "Identifying key skills and experience...",
    "Matching with job requirements...",
    "Crafting technical questions...",
    "Generating behavioral questions...",
    "Preparing gap analysis questions...",
    "Finalizing interview questions...",
    "Almost there..."
  ],
  jobs: [
    "Loading job listings...",
    "Fetching latest opportunities...",
    "Preparing job details...",
    "Almost ready..."
  ],
  applications: [
    "Loading your applications...",
    "Fetching application status...",
    "Preparing details...",
    "Almost ready..."
  ],
  profile: [
    "Loading your profile...",
    "Fetching your information...",
    "Preparing profile data...",
    "Almost ready..."
  ],
  resume: [
    "Processing your resume...",
    "Analyzing document...",
    "Extracting information...",
    "Almost ready..."
  ],
  dashboard: [
    "Loading dashboard...",
    "Fetching your data...",
    "Preparing overview...",
    "Almost ready..."
  ],
  search: [
    "Searching jobs...",
    "Finding best matches...",
    "Preparing results...",
    "Almost ready..."
  ]
}

const funFacts = [
  "💡 Tip: Keep your profile updated for better matches",
  "🎯 AI analyzes skills to find the best opportunities",
  "📊 Your match score is calculated in real-time",
  "🧠 Smart algorithms power our recommendations",
  "✨ Every interaction helps improve your experience"
]

function AILoadingAnimation({ 
  message = "Loading...", 
  context = "default",
  size = "large",
  showFacts = true 
}) {
  const [currentMessage, setCurrentMessage] = useState(0)
  const [currentFact, setCurrentFact] = useState(0)
  const [dots, setDots] = useState('')

  const messages = contextMessages[context] || contextMessages.default

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length)
    }, 2000)

    const factInterval = setInterval(() => {
      setCurrentFact(prev => (prev + 1) % funFacts.length)
    }, 4000)

    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 400)

    return () => {
      clearInterval(messageInterval)
      clearInterval(factInterval)
      clearInterval(dotsInterval)
    }
  }, [messages.length])

  const getContextIcon = () => {
    switch (context) {
      case 'interview': return <Lightbulb className="w-6 h-6 text-yellow-800" />
      case 'jobs': return <Briefcase className="w-6 h-6 text-blue-800" />
      case 'applications': return <FileText className="w-6 h-6 text-green-800" />
      case 'profile': return <User className="w-6 h-6 text-purple-800" />
      case 'resume': return <FileText className="w-6 h-6 text-indigo-800" />
      case 'search': return <Search className="w-6 h-6 text-blue-800" />
      default: return <Brain className="w-6 h-6 text-white" />
    }
  }

  // Small/inline version
  if (size === "small") {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-purple-200 animate-spin">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-500 rounded-full" />
          </div>
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 animate-pulse flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
        </div>
        <p className="text-purple-600 font-medium text-sm animate-pulse">
          {messages[currentMessage]}{dots}
        </p>
      </div>
    )
  }

  // Medium version
  if (size === "medium") {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-purple-200 animate-[spin_3s_linear_infinite]">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-500 rounded-full" />
          </div>
          <div className="absolute inset-3 rounded-full border-4 border-indigo-300 animate-[ping_2s_ease-in-out_infinite]" />
          <div className="absolute inset-5 rounded-full bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 animate-pulse flex items-center justify-center shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          
          {/* Floating sparkles */}
          <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-yellow-400 animate-pulse" />
          <Sparkles className="absolute -bottom-2 -left-2 w-4 h-4 text-purple-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">{message}</h3>
        
        <p className="text-purple-600 font-medium animate-pulse mb-4">
          {messages[currentMessage]}{dots}
        </p>

        <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-full animate-loading" />
        </div>

        <style>{`
          @keyframes loading {
            0% { width: 0%; margin-left: 0%; }
            50% { width: 60%; margin-left: 20%; }
            100% { width: 0%; margin-left: 100%; }
          }
          .animate-loading { animation: loading 1.5s ease-in-out infinite; }
        `}</style>
      </div>
    )
  }

  // Large/full version
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      {/* Main Animation Container */}
      <div className="relative w-40 h-40 mb-8">
        {/* Outer rotating ring */}
        <div className="absolute inset-0 rounded-full border-4 border-purple-200 animate-[spin_3s_linear_infinite]">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-purple-500 rounded-full" />
        </div>
        
        {/* Middle pulsing ring */}
        <div className="absolute inset-4 rounded-full border-4 border-indigo-300 animate-[ping_2s_ease-in-out_infinite]" />
        
        {/* Inner gradient circle */}
        <div className="absolute inset-6 rounded-full bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 animate-pulse flex items-center justify-center shadow-lg shadow-purple-500/50">
          <Brain className="w-12 h-12 text-white animate-bounce" />
        </div>

        {/* Floating icons */}
        <div className="absolute -top-2 -right-2 animate-bounce" style={{ animationDelay: '0s' }}>
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
            <Lightbulb className="w-5 h-5 text-yellow-800" />
          </div>
        </div>
        
        <div className="absolute -bottom-2 -left-2 animate-bounce" style={{ animationDelay: '0.3s' }}>
          <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center shadow-lg">
            <Target className="w-5 h-5 text-green-800" />
          </div>
        </div>
        
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 animate-bounce" style={{ animationDelay: '0.6s' }}>
          <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center shadow-lg">
            <Zap className="w-4 h-4 text-blue-800" />
          </div>
        </div>
        
        <div className="absolute top-1/2 -left-4 -translate-y-1/2 animate-bounce" style={{ animationDelay: '0.9s' }}>
          <div className="w-8 h-8 bg-pink-400 rounded-full flex items-center justify-center shadow-lg">
            <MessageSquare className="w-4 h-4 text-pink-800" />
          </div>
        </div>

        {/* Sparkles */}
        <Sparkles className="absolute -top-4 left-1/4 w-6 h-6 text-yellow-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
        <Sparkles className="absolute -bottom-4 right-1/4 w-5 h-5 text-purple-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <Sparkles className="absolute top-1/4 -left-6 w-4 h-4 text-blue-400 animate-pulse" style={{ animationDelay: '0.8s' }} />
      </div>

      {/* Main Message */}
      <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
        {message}
      </h3>

      {/* Animated Progress Message */}
      <div className="h-8 flex items-center justify-center mb-6">
        <p className="text-purple-600 font-medium animate-pulse">
          {messages[currentMessage]}{dots}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-full animate-loading" />
      </div>

      {/* Fun Fact */}
      {showFacts && (
        <div className="max-w-md text-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
          <p className="text-sm text-gray-600 transition-all duration-500">
            {funFacts[currentFact]}
          </p>
        </div>
      )}

      {/* Custom Keyframes */}
      <style>{`
        @keyframes loading {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .animate-loading { animation: loading 2s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

export default AILoadingAnimation
