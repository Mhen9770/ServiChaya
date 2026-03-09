import axios from 'axios'

// Backend API URL from environment variable
// Set NEXT_PUBLIC_API_URL in your Linux environment or .env file
// Example: export NEXT_PUBLIC_API_URL=http://localhost:8080/api
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL

if (!BACKEND_URL) {
  throw new Error(
    'NEXT_PUBLIC_API_URL environment variable is not set. ' +
    'Please set it in your environment or .env file. ' +
    'Example: NEXT_PUBLIC_API_URL=http://localhost:8080/api'
  )
}

const api = axios.create({
  baseURL: BACKEND_URL, // Direct backend URL
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
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
      // Handle unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
