import axios from 'axios'
import { auth } from '../config/firebase'

/**
 * API service for backend communication
 * Handles authentication headers and request/response interceptors
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add authentication token
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser
      if (user) {
        const token = await user.getIdToken()
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Failed to get auth token:', error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access - redirecting to login')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  validateToken: () => api.get('/auth/validate'),
}

// Resume API
export const resumeAPI = {
  upload: (formData) => api.post('/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getMyResumes: () => api.get('/resumes/my-resumes'),
  getResume: (id) => api.get(`/resumes/${id}`),
  deleteResume: (id) => api.delete(`/resumes/${id}`),
  getProcessedResumes: () => api.get('/resumes/processed'),
  reprocessResume: (id) => api.post(`/resumes/${id}/reprocess`),
}

// Job API
export const jobAPI = {
  create: (jobData) => api.post('/jobs', jobData),
  getAll: () => api.get('/jobs'),
  getById: (id) => api.get(`/jobs/${id}`),
  getMyJobs: () => api.get('/jobs/my-jobs'),
  update: (id, jobData) => api.put(`/jobs/${id}`, jobData),
  delete: (id) => api.delete(`/jobs/${id}`),
}

// Match API
export const matchAPI = {
  getByJobId: (jobId) => api.get(`/matches/job/${jobId}`),
  getByResumeId: (resumeId) => api.get(`/matches/resume/${resumeId}`),
  updateMatch: (matchId, data) => api.put(`/matches/${matchId}`, data),
  generateMatches: (jobId) => api.post(`/matches/generate/${jobId}`),
}

// Admin API
export const adminAPI = {
  getAllUsers: (limit = 50, startAfter = null) => 
    api.get('/admin/users', { params: { limit, startAfter } }),
  updateUserRole: (uid, role) => 
    api.put(`/admin/users/${uid}/role`, { role }),
  deactivateUser: (uid) => 
    api.put(`/admin/users/${uid}/deactivate`),
  getSystemStats: () => 
    api.get('/admin/stats'),
}

export default api