import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    console.log('API Error:', {
      status: error.response?.status,
      url: originalRequest?.url,
      message: error.message,
      hasRetry: !!originalRequest._retry
    })

    // Only handle 401 errors and prevent infinite loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          // No refresh token, logout
          console.log('No refresh token found, redirecting to login')
          throw new Error('No refresh token')
        }

        console.log('Attempting to refresh token...')
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        })

        const { accessToken } = response.data.data
        localStorage.setItem('accessToken', accessToken)
        console.log('Token refreshed successfully, new token:', accessToken?.substring(0, 20))

        // Update default Authorization header and retry
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`
        
        console.log('Retrying original request:', originalRequest.url)
        return axios(originalRequest)
      } catch (refreshError) {
        // Refresh failed, logout user
        console.error('Token refresh failed:', refreshError.response?.data || refreshError.message)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        
        // Only redirect if we're not already on login page
        if (window.location.pathname !== '/login') {
          console.log('Redirecting to login...')
          setTimeout(() => {
            window.location.href = '/login'
          }, 100)
        }
        return Promise.reject(refreshError)
      }
    }

    // For other errors, just reject without logout
    console.log('Non-refresh error or already retried, rejecting')
    return Promise.reject(error)
  }
)

// Prediction API methods
export const predictionAPI = {
  // Train ML models with historical data
  train: async () => {
    const response = await api.post('/predictions/train')
    return response.data
  },
  
  // Get predictions
  predict: async (days = 7) => {
    const response = await api.post('/predictions/predict', { days })
    return response.data
  },
  
  // Check ML service health
  checkHealth: async () => {
    const response = await api.get('/predictions/health')
    return response.data
  }
}

// Settings API methods
export const settingsAPI = {
  getSocialLinks: async () => {
    const response = await api.get('/settings/social-links')
    return response.data
  },
  updateSocialLinks: async (links) => {
    const response = await api.put('/settings/social-links', links)
    return response.data
  }
}

export default api