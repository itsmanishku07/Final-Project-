import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/FirebaseAuthContext'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { User, Mail, Shield, Calendar, Clock, Download, Key, Trash2, CheckCircle } from 'lucide-react'

/**
 * Profile Page
 * Allows users to view and update their profile information
 */
function Profile() {
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const response = await api.get('/auth/profile')
      if (response.data.success) {
        setProfile(response.data.user)
        setFormData({
          name: response.data.user.name,
          email: response.data.user.email
        })
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    setLoading(true)
    try {
      const response = await api.put('/auth/profile', {
        name: formData.name.trim()
      })
      
      if (response.data.success) {
        toast.success('Profile updated successfully')
        setProfile(response.data.user)
        setEditing(false)
        
        // Update auth context
        updateProfile(response.data.user)
      } else {
        toast.error(response.data.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update failed:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      email: profile?.email || ''
    })
    setEditing(false)
  }

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator'
      case 'RECRUITER':
        return 'Recruiter'
      case 'CANDIDATE':
        return 'Candidate'
      default:
        return role
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800'
      case 'RECRUITER':
        return 'bg-blue-100 text-blue-800'
      case 'CANDIDATE':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && !profile) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        {/* Profile Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">{profile?.name}</h2>
                <p className="text-gray-600">{profile?.email}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getRoleBadgeColor(profile?.role)}`}>
                  {getRoleDisplayName(profile?.role)}
                </span>
              </div>
            </div>
            
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <div className="p-6">
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                  disabled
                />
                <p className="mt-1 text-sm text-gray-500">
                  Email address cannot be changed. Contact support if you need to update your email.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={getRoleDisplayName(profile?.role)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                  disabled
                />
                <p className="mt-1 text-sm text-gray-500">
                  Role cannot be changed. Contact an administrator if you need a role change.
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {loading && <LoadingSpinner size="small" className="mr-2" />}
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <p className="text-gray-900">{profile?.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <p className="text-gray-900">{profile?.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <p className="text-gray-900">{getRoleDisplayName(profile?.role)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Status
                  </label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile?.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {profile?.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Member Since
                  </label>
                  <p className="text-gray-900">
                    {profile?.created_at ? formatDate(profile.created_at) : 'Unknown'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Updated
                  </label>
                  <p className="text-gray-900">
                    {profile?.updated_at ? formatDate(profile.updated_at) : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Actions */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Change Password</h4>
              <p className="text-sm text-gray-500">
                Update your password through Firebase Authentication
              </p>
            </div>
            <button
              onClick={() => toast.info('Password change functionality will be implemented with Firebase Auth')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Change Password
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Download Data</h4>
              <p className="text-sm text-gray-500">
                Download a copy of your account data and activity
              </p>
            </div>
            <button
              onClick={() => toast.info('Data export functionality will be implemented')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Download
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div>
              <h4 className="text-sm font-medium text-red-900">Delete Account</h4>
              <p className="text-sm text-red-600">
                Permanently delete your account and all associated data
              </p>
            </div>
            <button
              onClick={() => toast.error('Account deletion must be requested through support')}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile