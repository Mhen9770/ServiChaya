import api from './api'

export interface AuthResponse {
  token: string
  refreshToken: string
  userId: number
  email: string
  mobileNumber: string
  name: string
  role: string
  profileComplete: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

// Send OTP
export const sendOtp = async (mobileNumber: string): Promise<string> => {
  const response = await api.post<ApiResponse<string>>('/auth/otp/send', {
    mobileNumber,
  })
  return response.data.data
}

// Verify OTP
export const verifyOtp = async (
  mobileNumber: string,
  otpCode: string
): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<AuthResponse>>('/auth/otp/verify', {
    mobileNumber,
    otpCode,
  })
  
  // Store token in both localStorage and cookie
  if (response.data.data.token) {
    localStorage.setItem('auth_token', response.data.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.data))
    
    // Also set cookie for middleware to access
    if (typeof document !== 'undefined') {
      document.cookie = `auth_token=${response.data.data.token}; path=/; max-age=86400; SameSite=Lax`
    }
  }
  
  return response.data.data
}

// Google OAuth
export const googleAuth = async (
  email: string,
  name: string,
  profileImageUrl?: string
): Promise<AuthResponse> => {
  const url = `/auth/google?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}${profileImageUrl ? `&profileImageUrl=${encodeURIComponent(profileImageUrl)}` : ''}`
  const response = await api.post<ApiResponse<AuthResponse>>(url)
  
  // Store token in both localStorage and cookie
  if (response.data.data.token) {
    localStorage.setItem('auth_token', response.data.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.data))
    
    // Also set cookie for middleware to access
    if (typeof document !== 'undefined') {
      document.cookie = `auth_token=${response.data.data.token}; path=/; max-age=86400; SameSite=Lax`
    }
  }
  
  return response.data.data
}

// Get current user
export const getCurrentUser = (): AuthResponse | null => {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

// Logout
export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    // Clear cookie
    document.cookie = 'auth_token=; path=/; max-age=0'
    window.location.href = '/login'
  }
}

// Check if authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('auth_token')
}
