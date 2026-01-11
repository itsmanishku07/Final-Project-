import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { Menu, X, User, LogOut, Upload, Briefcase, BarChart3, Search, FileText, Users, Home } from 'lucide-react'
import NotificationBell from './NotificationBell'

/**
 * Navigation bar component with role-based menu items
 * Responsive design with mobile menu support
 */
const Navbar = () => {
  const { isAuthenticated, userProfile, logout, isCandidate, isRecruiter, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    setIsMobileMenuOpen(false)
  }

  const isActivePath = (path) => {
    return location.pathname === path
  }

  const navItems = [
    {
      name: 'Home',
      path: '/home',
      icon: Home,
      show: !isAuthenticated
    },
    {
      name: 'Dashboard',
      path: '/',
      icon: BarChart3,
      show: isAuthenticated
    },
    {
      name: 'Find Jobs',
      path: '/jobs',
      icon: Search,
      show: isCandidate || (!isAuthenticated)
    },
    {
      name: 'Upload Resume',
      path: '/upload-resume',
      icon: Upload,
      show: isCandidate || isAdmin
    },
    {
      name: 'My Applications',
      path: '/my-applications',
      icon: FileText,
      show: isCandidate || isAdmin
    },
    {
      name: 'Post Job',
      path: '/post-job',
      icon: Briefcase,
      show: isRecruiter || isAdmin
    },
    {
      name: 'My Jobs',
      path: '/my-jobs',
      icon: FileText,
      show: isRecruiter || isAdmin
    },
    {
      name: 'Applicants',
      path: '/recruiter-dashboard',
      icon: Users,
      show: isRecruiter || isAdmin
    }
  ]

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Resume</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                {navItems.filter(item => item.show).map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                        isActivePath(item.path)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
                
                {/* User Menu */}
                <div className="flex items-center space-x-2 ml-6 pl-6 border-l border-gray-200">
                  <NotificationBell />
                  
                  <Link
                    to="/profile"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActivePath('/profile')
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <User size={18} />
                    <span>{userProfile?.name || 'Profile'}</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {isAuthenticated ? (
              <div className="space-y-2">
                {navItems.filter(item => item.show).map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        isActivePath(item.path)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
                
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActivePath('/profile')
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <User size={18} />
                    <span>{userProfile?.name || 'Profile'}</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar