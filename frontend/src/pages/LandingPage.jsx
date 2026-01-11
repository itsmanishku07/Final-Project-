import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { 
  Upload, Search, BarChart3, Shield, Zap, Users, 
  CheckCircle, ArrowRight, Star, TrendingUp 
} from 'lucide-react'

/**
 * Professional Landing Page for AI Resume Screening Platform
 */
function LandingPage() {
  const { isAuthenticated } = useAuth()

  const features = [
    {
      icon: Upload,
      title: 'Smart Resume Upload',
      description: 'Upload your resume in PDF or DOCX format. Our AI extracts and analyzes your skills, experience, and education automatically.',
      color: 'bg-blue-500'
    },
    {
      icon: Zap,
      title: 'AI-Powered Analysis',
      description: 'Advanced AI algorithms analyze your resume, identify key skills, and provide an ATS compatibility score with improvement suggestions.',
      color: 'bg-purple-500'
    },
    {
      icon: Search,
      title: 'Smart Job Matching',
      description: 'Get matched with relevant job opportunities based on your skills and experience. Apply with one click.',
      color: 'bg-green-500'
    },
    {
      icon: BarChart3,
      title: 'Detailed Analytics',
      description: 'Track your application status, view match scores, and get insights to improve your job search success rate.',
      color: 'bg-orange-500'
    }
  ]

  const stats = [
    { value: '10K+', label: 'Resumes Analyzed' },
    { value: '500+', label: 'Companies Hiring' },
    { value: '95%', label: 'ATS Accuracy' },
    { value: '3x', label: 'Faster Hiring' }
  ]

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Software Developer',
      company: 'Tech Corp',
      content: 'The ATS score feature helped me optimize my resume. Got 3 interview calls within a week!',
      rating: 5
    },
    {
      name: 'Rahul Verma',
      role: 'HR Manager',
      company: 'StartupXYZ',
      content: 'As a recruiter, this platform saves me hours of manual screening. The AI matching is incredibly accurate.',
      rating: 5
    },
    {
      name: 'Anita Patel',
      role: 'Data Analyst',
      company: 'Analytics Inc',
      content: 'The keyword suggestions improved my resume significantly. Landed my dream job!',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full text-sm mb-6 backdrop-blur-sm">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Resume Screening Platform
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Land Your Dream Job with
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                AI-Powered Resume Analysis
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl mx-auto">
              Upload your resume, get instant ATS score, receive AI suggestions, and match with perfect job opportunities.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link
                  to="/"
                  className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-8 py-4 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-all backdrop-blur-sm"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Job Seekers & Recruiters
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to streamline your hiring process or land your next opportunity
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={index} 
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">Simple steps to get started</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '1', title: 'Upload Resume', desc: 'Upload your resume in PDF or DOCX format' },
                { step: '2', title: 'AI Analysis', desc: 'Get instant ATS score and improvement suggestions' },
                { step: '3', title: 'Apply & Track', desc: 'Apply to matched jobs and track your applications' }
              ].map((item, index) => (
                <div key={index} className="text-center relative">
                  <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-indigo-200"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">Join thousands of satisfied users</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold">{testimonial.name[0]}</span>
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role} at {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Supercharge Your Job Search?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers who have improved their resumes and landed their dream jobs.
          </p>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            >
              Start Free Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">AI</span>
                </div>
                <span className="text-xl font-bold">Resume</span>
              </div>
              <p className="text-gray-400">
                AI-powered resume screening and job matching platform for modern hiring.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Candidates</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/register" className="hover:text-white transition-colors">Upload Resume</Link></li>
                <li><Link to="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">ATS Score Check</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Recruiters</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/register" className="hover:text-white transition-colors">Post Jobs</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Find Candidates</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">AI Matching</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>support@airesume.com</li>
                <li>+91 1234567890</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2026 AI Resume. All rights reserved. | MCA Final Year Project</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
