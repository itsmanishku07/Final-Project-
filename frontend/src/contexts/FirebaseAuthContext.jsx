import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth'
import { auth } from '../config/firebase'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

/**
 * Firebase Authentication context with Google Sign-in support
 * Provides login, register, Google auth, logout functionality with role management
 */
const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Google Auth Provider
  const googleProvider = new GoogleAuthProvider()
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  })

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Fetch user profile from backend
        try {
          const response = await authAPI.getProfile()
          if (response.data.success) {
            setUserProfile(response.data.user)
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error)
          // If profile fetch fails, user might not be registered in backend
          setUserProfile(null)
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // Login with email and password
  const login = async (email, password) => {
    try {
      setLoading(true)
      const result = await signInWithEmailAndPassword(auth, email, password)
      
      // Fetch user profile after successful login (will auto-create if doesn't exist)
      try {
        const response = await authAPI.getProfile()
        if (response.data.success) {
          setUserProfile(response.data.user)
          toast.success('Login successful!')
          return { success: true, user: result.user }
        }
      } catch (profileError) {
        console.error('Profile error:', profileError)
        // Profile endpoint should auto-create user, so this shouldn't happen
        toast.error('Failed to load user profile')
        return { success: false, error: 'Failed to load user profile' }
      }
    } catch (error) {
      console.error('Login error:', error)
      let message = 'Login failed'
      
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email'
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password'
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address'
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later'
      }
      
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setLoading(true)
      const result = await signInWithPopup(auth, googleProvider)
      
      // Auto-register user in backend if they don't exist
      try {
        const response = await authAPI.getProfile()
        if (response.data.success) {
          setUserProfile(response.data.user)
        }
      } catch (profileError) {
        // If profile doesn't exist, it will be auto-created by the profile endpoint
        console.log('Profile will be auto-created')
        // Try to get profile again after auto-creation
        try {
          const retryResponse = await authAPI.getProfile()
          if (retryResponse.data.success) {
            setUserProfile(retryResponse.data.user)
          }
        } catch (retryError) {
          console.error('Failed to get profile after auto-creation:', retryError)
        }
      }
      
      toast.success('Google sign-in successful!')
      return { success: true, user: result.user }
      
    } catch (error) {
      console.error('Google sign-in error:', error)
      let message = 'Google sign-in failed'
      
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in cancelled'
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Popup blocked. Please allow popups and try again'
      }
      
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  // Register new user
  const register = async (email, password, userData) => {
    try {
      setLoading(true)
      
      // Create Firebase user
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // Register user in backend
      const registrationData = {
        name: userData.name,
        email: email,
        role: userData.role
      }
      
      const response = await authAPI.register(registrationData)
      
      if (response.data.success) {
        setUserProfile(response.data.user)
        toast.success('Registration successful!')
        return { success: true, user: result.user }
      } else {
        // If backend registration fails, delete Firebase user
        await result.user.delete()
        throw new Error(response.data.message || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      let message = 'Registration failed'
      
      if (error.code === 'auth/email-already-in-use') {
        message = 'Email address is already registered'
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters'
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address'
      } else if (error.response?.data?.message) {
        message = error.response.data.message
      }
      
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  // Logout
  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setUserProfile(null)
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed')
    }
  }

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData)
      if (response.data.success) {
        setUserProfile(response.data.user)
        toast.success('Profile updated successfully')
        return { success: true }
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile')
      return { success: false, error: error.message }
    }
  }

  // Check if user has specific role
  const hasRole = (role) => {
    return userProfile?.role === role
  }

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(userProfile?.role)
  }

  const value = {
    user,
    userProfile,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!user && !!userProfile,
    isAdmin: userProfile?.role === 'ADMIN',
    isRecruiter: userProfile?.role === 'RECRUITER',
    isCandidate: userProfile?.role === 'CANDIDATE',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}