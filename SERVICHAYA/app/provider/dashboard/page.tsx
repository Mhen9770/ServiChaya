'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getOnboardingStatus } from '@/lib/services/provider'
import { getProviderJobs, type JobDto } from '@/lib/services/job'
import { getEarningsSummary } from '@/lib/services/payment'
import { getUnreadCount } from '@/lib/services/notification'
import { getAvailableJobsForProvider } from '@/lib/services/matching'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { 
  Clock, FileText, CheckCircle2, ArrowRight, ClipboardList, 
  Briefcase, DollarSign, Bell, TrendingUp, AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'

interface OnboardingStatus {
  currentStep: number
  onboardingCompleted: boolean
  profileStatus: string
  verificationStatus: string
  providerId?: number
}

export default function ProviderDashboard() {
  const router = useRouter()
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null)
  const [stats, setStats] = useState({
    activeJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    availableJobs: 0
  })
  const [recentJobs, setRecentJobs] = useState<JobDto[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login?redirect=/provider/dashboard')
      return
    }
    // If user is CUSTOMER trying to access provider dashboard, redirect to onboarding
    if (currentUser.role === 'CUSTOMER') {
      router.push('/provider/onboarding')
      return
    }
    if (currentUser.role !== 'SERVICE_PROVIDER') {
      router.push('/dashboard')
      return
    }
    checkOnboardingStatus(currentUser.userId)
  }, [router])

  const checkOnboardingStatus = async (userId: number) => {
    try {
      const status = await getOnboardingStatus(userId)
      setOnboardingStatus(status)
      
      if (status.profileStatus === 'NOT_STARTED' || (!status.onboardingCompleted && status.profileStatus !== 'PENDING_VERIFICATION')) {
        router.push('/provider/onboarding')
        return
      }
      
      if (status.profileStatus === 'PENDING_VERIFICATION') {
        setLoading(false)
        return
      }

      await fetchDashboardData(userId, status.providerId)
    } catch (error) {
      console.error('Failed to fetch onboarding status:', error)
      router.push('/provider/onboarding')
    }
  }

  const fetchDashboardData = async (userId: number, providerId?: number) => {
    try {
      setLoading(true)
      if (!providerId) {
        toast.error('Provider ID not found')
        setLoading(false)
        return
      }
      
      const [jobsResult, earnings, notifications, availableJobs] = await Promise.all([
        getProviderJobs(providerId, 0, 5).catch((err) => {
          console.error('Failed to fetch provider jobs:', err)
          return { content: [], totalElements: 0, totalPages: 0 }
        }),
        getEarningsSummary(providerId).catch((err) => {
          console.error('Failed to fetch earnings:', err)
          return { totalEarnings: 0, pendingEarnings: 0, paidEarnings: 0, totalJobs: 0, completedJobs: 0 }
        }),
        getUnreadCount(userId, 'PROVIDER').catch(() => 0),
        getAvailableJobsForProvider(providerId).catch((err) => {
          console.error('Failed to fetch available jobs:', err)
          return []
        })
      ])
      
      const jobs = jobsResult.content || []
      const active = jobs.filter(j => ['ACCEPTED', 'IN_PROGRESS'].includes(j.status)).length
      const completed = earnings.completedJobs || 0
      const totalEarnings = earnings.totalEarnings || 0
      
      setStats({ 
        activeJobs: active, 
        completedJobs: completed, 
        totalEarnings,
        availableJobs: availableJobs.length || 0
      })
      setRecentJobs(jobs)
      setUnreadNotifications(notifications || 0)
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error)
      const errorMsg = error.response?.data?.message || 'Failed to load dashboard'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800'
      case 'COMPLETED': return 'bg-accent-green/20 text-accent-green'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-neutral-background text-neutral-textSecondary'
    }
  }

  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (onboardingStatus?.profileStatus === 'PENDING_VERIFICATION') {
    return (
      <div className="px-6 py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-lg border border-neutral-border text-center"
        >
          <div className="w-16 h-16 bg-primary-main/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-primary-main" />
          </div>
          <h1 className="text-2xl font-bold mb-3 text-neutral-textPrimary">Verification Pending</h1>
          <p className="text-sm text-neutral-textSecondary mb-6">
            Your profile is under review. We'll notify you once it's verified and you can start receiving jobs.
          </p>
          <Link
            href="/provider/onboarding"
            className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-primary-main text-primary-main rounded-xl text-sm font-semibold hover:bg-primary-main hover:text-white transition-all duration-300"
          >
            <FileText className="w-4 h-4" />
            View Profile
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">Dashboard</h1>
            <p className="text-sm text-neutral-textSecondary mt-1">Manage your jobs and earnings</p>
          </div>
          {unreadNotifications > 0 && (
            <Link
              href="/provider/notifications"
              className="relative p-2.5 bg-primary-main/10 text-primary-main rounded-xl hover:bg-primary-main hover:text-white transition-all"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-orange text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Link>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid md:grid-cols-4 gap-4 mb-6"
      >
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-main/10 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary-main" />
            </div>
            <div>
              <div className="text-xs text-neutral-textSecondary">Active Jobs</div>
              <div className="text-2xl font-bold text-primary-main">{stats.activeJobs}</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-accent-green/10 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-accent-green" />
            </div>
            <div>
              <div className="text-xs text-neutral-textSecondary">Completed</div>
              <div className="text-2xl font-bold text-accent-green">{stats.completedJobs}</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-accent-green/10 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-accent-green" />
            </div>
            <div>
              <div className="text-xs text-neutral-textSecondary">Total Earnings</div>
              <div className="text-2xl font-bold text-accent-green">₹{stats.totalEarnings.toLocaleString()}</div>
            </div>
          </div>
        </motion.div>

        {stats.availableJobs > 0 && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-accent-orange to-orange-600 rounded-2xl p-5 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Link href="/provider/jobs/available" className="block">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-orange-100">Available</div>
                  <div className="text-2xl font-bold">{stats.availableJobs}</div>
                </div>
              </div>
              <div className="text-xs text-orange-100">New jobs waiting</div>
            </Link>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-neutral-textPrimary font-display">Active Jobs</h2>
          <Link href="/provider/jobs" className="flex items-center gap-1.5 text-xs text-primary-main hover:text-primary-dark font-semibold transition-colors">
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        
        {recentJobs.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-neutral-background rounded-full flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-8 h-8 text-neutral-textSecondary" />
            </div>
            <p className="text-sm font-semibold text-neutral-textPrimary mb-1">No active jobs yet</p>
            <p className="text-xs text-neutral-textSecondary mb-4">Start accepting jobs to get started!</p>
            <Link href="/provider/jobs/available" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl text-sm font-semibold hover:shadow-md hover:scale-105 transition-all duration-300">
              <CheckCircle2 className="w-4 h-4" />
              View Available Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentJobs.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                <Link
                  href={`/provider/jobs/${job.id}`}
                  className="block p-4 rounded-xl border border-neutral-border hover:border-primary-main/30 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-bold text-neutral-textPrimary">{job.title}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}>
                          {job.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-neutral-textSecondary">
                        {job.estimatedBudget && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            ₹{job.estimatedBudget}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-textSecondary flex-shrink-0 ml-3" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
