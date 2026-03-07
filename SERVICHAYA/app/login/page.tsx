'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { sendOtp, verifyOtp, googleAuth } from '@/lib/auth'
import { toast } from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otpDisplay, setOtpDisplay] = useState('')
  const [redirectPath, setRedirectPath] = useState<string | null>(null)

  useEffect(() => {
    const redirect = searchParams.get('redirect')
    if (redirect) {
      setRedirectPath(redirect)
    }
  }, [searchParams])

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      const response = await googleAuth(
        'test@example.com',
        'Test User',
        'https://via.placeholder.com/150'
      )
      
      // Get redirect path directly from URL params (in case state hasn't updated)
      const redirect = searchParams.get('redirect')
      const finalRedirectPath = redirect || redirectPath
      
      toast.success('Login successful!')
      
      // Determine redirect path
      let targetPath = '/dashboard'
      
      // Check if there's a redirect parameter
      if (finalRedirectPath) {
        // Decode the redirect path in case it's URL encoded
        targetPath = decodeURIComponent(finalRedirectPath)
      } else {
        // Otherwise, redirect based on role
        if (response.role === 'CUSTOMER') {
          targetPath = '/customer/dashboard'
        } else if (response.role === 'SERVICE_PROVIDER') {
          targetPath = '/provider/dashboard'
        } else if (response.role === 'ADMIN' || response.role === 'SUPER_ADMIN') {
          targetPath = '/admin/dashboard'
        }
      }
      
      console.log('Redirecting to:', targetPath)
      
      // Use replace to avoid back button issues, and add small delay for toast
      setTimeout(() => {
        router.replace(targetPath)
      }, 300)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed')
      setLoading(false)
    }
  }

  const handleSendOTP = async () => {
    if (!mobile || mobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }

    try {
      setLoading(true)
      const otpCode = await sendOtp(mobile)
      setOtpDisplay(otpCode)
      setOtpSent(true)
      toast.success(`OTP sent! OTP: ${otpCode} (for testing)`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    try {
      setLoading(true)
      const response = await verifyOtp(mobile, otp)
      
      // Get redirect path directly from URL params (in case state hasn't updated)
      const redirect = searchParams.get('redirect')
      const finalRedirectPath = redirect || redirectPath
      
      toast.success('Login successful!')
      
      // Determine redirect path
      let targetPath = '/dashboard'
      
      // Check if there's a redirect parameter
      if (finalRedirectPath) {
        // Decode the redirect path in case it's URL encoded
        targetPath = decodeURIComponent(finalRedirectPath)
        // If redirecting to provider onboarding, allow CUSTOMER role
        if (targetPath === '/provider/onboarding' && response.role === 'CUSTOMER') {
          // Allow CUSTOMER to access onboarding - they want to become a provider
          // Don't change the target path
        }
      } else {
        // Otherwise, redirect based on role
        if (response.role === 'CUSTOMER') {
          targetPath = '/customer/dashboard'
        } else if (response.role === 'SERVICE_PROVIDER') {
          // Provider dashboard will check onboarding status and redirect if needed
          targetPath = '/provider/dashboard'
        } else if (response.role === 'ADMIN' || response.role === 'SUPER_ADMIN') {
          targetPath = '/admin/dashboard'
        }
      }
      
      console.log('Redirecting to:', targetPath)
      
      // Wait a bit longer to ensure cookie is set and localStorage is saved
      setTimeout(() => {
        // Force a full page reload to ensure middleware sees the cookie
        window.location.href = targetPath
      }, 800)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-main/5 via-white to-accent-green/5 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-main/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-green/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding & Features (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-16">
          <div className="max-w-md">
            <Link href="/" className="inline-block mb-8">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary-main to-primary-dark bg-clip-text text-transparent font-display">
                SERVICHAYA
              </div>
              <p className="text-sm text-neutral-textSecondary mt-1">सेवा आपके द्वार पर</p>
            </Link>
            
            <h1 className="text-5xl font-bold mb-6 font-display text-neutral-textPrimary leading-tight">
              Welcome Back to
              <span className="block bg-gradient-to-r from-primary-main to-primary-dark bg-clip-text text-transparent">
                SERVICHAYA
              </span>
            </h1>
            
            <p className="text-lg text-neutral-textSecondary mb-12 leading-relaxed">
              Connect with verified service providers. Get quality services delivered right to your doorstep.
            </p>

            {/* Trust Indicators */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-accent-green/20 to-accent-green/10 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-neutral-textPrimary">Verified Providers</div>
                  <div className="text-sm text-neutral-textSecondary">All professionals background checked</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-main/20 to-primary-light/10 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-neutral-textPrimary">Instant Matching</div>
                  <div className="text-sm text-neutral-textSecondary">Get matched within minutes</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-accent-orange/20 to-accent-orange/10 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-neutral-textPrimary">Secure Payments</div>
                  <div className="text-sm text-neutral-textSecondary">Protected with escrow system</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-12 pt-8 border-t border-neutral-border">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl font-bold text-primary-main font-display">10K+</div>
                  <div className="text-xs text-neutral-textSecondary mt-1">Providers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent-green font-display">50K+</div>
                  <div className="text-xs text-neutral-textSecondary mt-1">Jobs Done</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent-orange font-display">4.8★</div>
                  <div className="text-xs text-neutral-textSecondary mt-1">Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center py-12 px-4 lg:px-12">
          <div className="w-full max-w-md">
            {/* Logo for mobile */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-block text-3xl font-bold bg-gradient-to-r from-primary-main to-primary-dark bg-clip-text text-transparent font-display mb-2">
                SERVICHAYA
              </Link>
              <h1 className="text-3xl font-bold mb-2 font-display text-neutral-textPrimary">Welcome Back</h1>
              <p className="text-neutral-textSecondary">Sign in to continue</p>
            </div>

            {/* Login Card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-neutral-border/50 p-8 md:p-10">
              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-neutral-border rounded-2xl font-semibold hover:border-primary-main hover:bg-primary-main/5 hover:shadow-lg transition-all duration-300 mb-6 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="group-hover:text-primary-main transition-colors">Continue with Google</span>
              </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-neutral-textSecondary font-medium">OR</span>
            </div>
          </div>

              {/* Mobile OTP Login */}
              {!otpSent ? (
                <div>
                  <label className="block text-sm font-semibold mb-3 text-neutral-textPrimary">Mobile Number</label>
                  <div className="flex gap-3 mb-6">
                    <div className="w-20 px-4 py-3 bg-gradient-to-br from-primary-main/10 to-primary-light/5 border-2 border-primary-main/20 rounded-2xl text-center font-semibold text-primary-main">
                      +91
                    </div>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      maxLength={10}
                      className="flex-1 px-5 py-3 border-2 border-neutral-border rounded-2xl focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all font-medium text-lg"
                    />
                  </div>
                  <button
                    onClick={handleSendOTP}
                    disabled={loading || mobile.length !== 10}
                    className="w-full px-6 py-4 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-2xl font-bold text-lg shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.4)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                  {otpDisplay && (
                    <div className="mt-4 p-4 bg-gradient-to-br from-accent-green/10 to-accent-green/5 border-2 border-accent-green/30 rounded-2xl animate-pulse">
                      <p className="text-sm font-medium text-accent-green mb-1">OTP for Testing:</p>
                      <p className="text-2xl font-bold text-accent-green font-mono tracking-wider">{otpDisplay}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="mb-6 p-4 bg-gradient-to-br from-primary-main/5 to-primary-light/5 rounded-2xl border border-primary-main/20">
                    <p className="text-xs text-neutral-textSecondary mb-1">OTP sent to</p>
                    <p className="text-lg font-bold text-neutral-textPrimary flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      +91 {mobile}
                    </p>
                  </div>
                  <label className="block text-sm font-semibold mb-3 text-neutral-textPrimary">Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-5 py-4 border-2 border-neutral-border rounded-2xl focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all font-bold text-2xl text-center tracking-[0.5em] mb-6 bg-neutral-background"
                    autoFocus
                  />
                  <button
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="w-full px-6 py-4 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-2xl font-bold text-lg shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.4)] hover:scale-105 transition-all duration-300 mb-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      'Verify & Login'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setOtpSent(false)
                      setOtp('')
                      setOtpDisplay('')
                    }}
                    className="w-full text-sm text-primary-main hover:text-primary-dark font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Change Mobile Number
                  </button>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-neutral-border text-center">
                <p className="text-sm text-neutral-textSecondary">
                  New to SERVICHAYA?{' '}
                  <Link href="/signup" className="text-primary-main hover:text-primary-dark font-semibold hover:underline transition-colors">
                    Create Account
                  </Link>
                </p>
              </div>
            </div>

            {/* Back to Home - Mobile only */}
            <div className="lg:hidden text-center mt-6">
              <Link href="/" className="text-sm text-neutral-textSecondary hover:text-primary-main transition-colors inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
