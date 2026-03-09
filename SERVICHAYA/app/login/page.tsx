'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Phone,
  Shield,
  CheckCircle2,
  Clock,
  Lock,
  Sparkles,
  Wrench,
  Zap,
  Users,
  Star,
  MapPin,
} from 'lucide-react'
import { sendOtp, verifyOtp, googleAuth } from '@/lib/auth'
import { toast } from 'react-hot-toast'
import { ButtonLoader, PageLoader } from '@/components/ui/Loader'

function LoginPageContent() {
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
      
      const redirect = searchParams.get('redirect')
      const finalRedirectPath = redirect || redirectPath
      
      toast.success('Login successful!')
      
      let targetPath = '/dashboard'
      if (finalRedirectPath) {
        targetPath = decodeURIComponent(finalRedirectPath)
      } else {
        if (response.role === 'CUSTOMER') {
          targetPath = '/customer/dashboard'
        } else if (response.role === 'SERVICE_PROVIDER') {
          targetPath = '/provider/dashboard'
        } else if (response.role === 'ADMIN' || response.role === 'SUPER_ADMIN') {
          targetPath = '/admin/dashboard'
        }
      }
      
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
      
      const redirect = searchParams.get('redirect')
      const finalRedirectPath = redirect || redirectPath
      
      toast.success('Login successful!')
      
      let targetPath = '/dashboard'
      if (finalRedirectPath) {
        targetPath = decodeURIComponent(finalRedirectPath)
        if (targetPath === '/provider/onboarding' && response.role === 'CUSTOMER') {
          // Allow CUSTOMER to access onboarding
        }
      } else {
        if (response.role === 'CUSTOMER') {
          targetPath = '/customer/dashboard'
        } else if (response.role === 'SERVICE_PROVIDER') {
          targetPath = '/provider/dashboard'
        } else if (response.role === 'ADMIN' || response.role === 'SUPER_ADMIN') {
          targetPath = '/admin/dashboard'
        }
      }
      
      setTimeout(() => {
        window.location.href = targetPath
      }, 800)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#010B2A] text-white overflow-x-hidden">
      {/* Header - Matching Home Page */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 border-b border-white/10 glass-dark backdrop-blur-xl"
      >
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <Link href="/" className="text-2xl sm:text-3xl font-bold tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-main to-primary-light rounded-xl flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <span>SERVI<span className="text-primary-light gradient-text">CHAYA</span></span>
              </Link>
            </motion.div>
            
            <Link 
              href="/" 
              className="text-sm text-slate-300 hover:text-primary-light transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="w-full">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Side - Branding & Features */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="hidden lg:flex flex-col justify-center space-y-8"
            >
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-main/20 border border-primary-main/30 mb-6"
                >
                  <Sparkles className="w-5 h-5 text-primary-light" />
                  <span className="text-sm font-semibold">Welcome to SERVICHAYA</span>
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-tight"
                >
                  Get Started with
                  <span className="block text-primary-light mt-2">SERVICHAYA</span>
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-slate-300 mb-10 leading-relaxed"
                >
                  Connect with verified service providers. Get quality services delivered right to your doorstep.
                </motion.p>
              </div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid sm:grid-cols-2 gap-6"
              >
                {[
                  { icon: Shield, title: 'Verified Providers', desc: 'All professionals background checked', color: 'from-purple-500 to-purple-600' },
                  { icon: Clock, title: 'Instant Matching', desc: 'Get matched within minutes', color: 'from-blue-500 to-blue-600' },
                  { icon: Lock, title: 'Secure Payments', desc: 'Protected with escrow system', color: 'from-green-500 to-green-600' },
                  { icon: CheckCircle2, title: 'Quality Guarantee', desc: '100% satisfaction or money back', color: 'from-orange-500 to-orange-600' },
                ].map((item, idx) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="rounded-2xl glass-dark border border-white/10 p-5 hover:border-primary-main/50 transition-all"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-3`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10"
              >
                {[
                  { value: '2,500+', label: 'Providers', icon: Users, color: 'text-blue-400' },
                  { value: '120K+', label: 'Jobs Done', icon: CheckCircle2, color: 'text-green-400' },
                  { value: '4.8/5', label: 'Rating', icon: Star, color: 'text-amber-400' },
                ].map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.1 + idx * 0.1 }}
                    className="text-center"
                  >
                    <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                    <p className="text-2xl font-bold mb-1">{stat.value}</p>
                    <p className="text-xs text-slate-400">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Side - Login Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center"
            >
              <div className="w-full max-w-md">
                {/* Mobile Header */}
                <div className="lg:hidden text-center mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-main/20 border border-primary-main/30 mb-4"
                  >
                    <Sparkles className="w-4 h-4 text-primary-light" />
                    <span className="text-xs font-semibold">Welcome</span>
                  </motion.div>
                  <h1 className="text-3xl font-bold mb-2">Get Started</h1>
                  <p className="text-slate-300">Sign in or create account</p>
                </div>

                {/* Login Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-3xl glass-dark border border-white/10 p-8 sm:p-10 backdrop-blur-xl"
                >
                  <AnimatePresence mode="wait">
                    {!otpSent ? (
                      <motion.div
                        key="mobile-form"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <h2 className="text-2xl font-bold mb-2">Sign In / Sign Up</h2>
                        <p className="text-sm text-slate-400 mb-6">
                          Enter your mobile number. We'll send you an OTP to verify.
                        </p>

                        {/* Google Login */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleGoogleLogin}
                          disabled={loading}
                          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/10 border-2 border-white/20 rounded-xl font-semibold hover:border-primary-main hover:bg-primary-main/20 transition-all mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <span>Continue with Google</span>
                        </motion.button>

                        <div className="relative mb-6">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/20"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-[#010B2A] text-slate-400 font-medium">OR</span>
                          </div>
                        </div>

                        {/* Mobile OTP */}
                        <div>
                          <label className="block text-sm font-semibold mb-3 text-white">Mobile Number</label>
                          <div className="flex gap-3 mb-6">
                            <div className="w-20 px-4 py-3 bg-gradient-to-br from-primary-main/20 to-primary-light/10 border-2 border-primary-main/30 rounded-xl text-center font-semibold text-primary-light flex items-center justify-center">
                              +91
                            </div>
                            <input
                              type="tel"
                              value={mobile}
                              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                              placeholder="9876543210"
                              maxLength={10}
                              className="flex-1 px-5 py-3 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:border-primary-main focus:ring-2 focus:ring-primary-main/50 transition-all font-medium text-lg text-white placeholder:text-white/40"
                            />
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSendOTP}
                            disabled={loading || mobile.length !== 10}
                            className="w-full px-6 py-4 bg-gradient-to-r from-primary-main to-primary-light text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-primary-main/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                          {loading ? (
                            <span className="flex items-center justify-center gap-2">
                              <ButtonLoader />
                              Sending...
                            </span>
                          ) : (
                            'Send OTP'
                          )}
                          </motion.button>
                          {otpDisplay && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="mt-4 p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/30 rounded-xl"
                            >
                              <p className="text-sm font-medium text-green-400 mb-1">OTP for Testing:</p>
                              <p className="text-2xl font-bold text-green-300 font-mono tracking-wider">{otpDisplay}</p>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="otp-form"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <h2 className="text-2xl font-bold mb-2">Verify OTP</h2>
                        <p className="text-sm text-slate-400 mb-6">
                          Enter the 6-digit OTP sent to your mobile
                        </p>

                        <div className="mb-6 p-4 bg-gradient-to-br from-primary-main/10 to-primary-light/5 rounded-xl border border-primary-main/20">
                          <p className="text-xs text-slate-400 mb-1">OTP sent to</p>
                          <p className="text-lg font-bold text-white flex items-center gap-2">
                            <Phone className="w-5 h-5 text-primary-light" />
                            +91 {mobile}
                          </p>
                        </div>

                        <label className="block text-sm font-semibold mb-3 text-white">Enter OTP</label>
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          maxLength={6}
                          className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-xl focus:outline-none focus:border-primary-main focus:ring-2 focus:ring-primary-main/50 transition-all font-bold text-2xl text-center tracking-[0.5em] mb-6 text-white placeholder:text-white/20"
                          autoFocus
                        />
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleVerifyOTP}
                          disabled={loading || otp.length !== 6}
                          className="w-full px-6 py-4 bg-gradient-to-r from-primary-main to-primary-light text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-primary-main/50 transition-all mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <span className="flex items-center justify-center gap-2">
                              <ButtonLoader />
                              Verifying...
                            </span>
                          ) : (
                            'Verify & Continue'
                          )}
                        </motion.button>
                        <button
                          onClick={() => {
                            setOtpSent(false)
                            setOtp('')
                            setOtpDisplay('')
                          }}
                          className="w-full text-sm text-primary-light hover:text-primary-main font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Change Mobile Number
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <p className="text-sm text-slate-400">
                      By continuing, you agree to our{' '}
                      <Link href="/terms" className="text-primary-light hover:underline">
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link href="/privacy" className="text-primary-light hover:underline">
                        Privacy Policy
                      </Link>
                    </p>
                  </div>
                </motion.div>

                {/* Info Note */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-center"
                >
                  <p className="text-sm text-blue-300">
                    <Shield className="w-4 h-4 inline mr-2" />
                    New users are automatically registered when they verify OTP
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading..." />}>
      <LoginPageContent />
    </Suspense>
  )
}
