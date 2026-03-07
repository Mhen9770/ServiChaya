'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getCustomerJobs, type JobDto } from '@/lib/services/job'
import { getUnreadCount } from '@/lib/services/notification'
import { getCustomerProfile } from '@/lib/services/customer'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { 
  ClipboardList, ArrowRight, Plus, Briefcase, CheckCircle2, 
  DollarSign, Clock, Bell, TrendingUp
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function CustomerDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    activeJobs: 0,
    completedJobs: 0,
    totalSpent: 0
  })
  const [recentJobs, setRecentJobs] = useState<JobDto[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login?redirect=/customer/dashboard')
      return
    }
    if (currentUser.role !== 'CUSTOMER') {
      router.push('/dashboard')
      return
    }
    fetchDashboardData(currentUser.userId)
  }, [router])

  const fetchDashboardData = async (customerId: number) => {
    try {
      setLoading(true)
      const [profile, jobsResult, notifications] = await Promise.all([
        getCustomerProfile(customerId).catch(() => null),
        getCustomerJobs(customerId, 0, 5).catch(() => ({ content: [], totalElements: 0, totalPages: 0 })),
        getUnreadCount(customerId, 'CUSTOMER').catch(() => 0)
      ])
      
      const jobs = jobsResult.content || []
      const active = jobs.filter(j => ['PENDING', 'MATCHED', 'ACCEPTED', 'IN_PROGRESS'].includes(j.status)).length
      const completed = profile?.completedJobs || jobs.filter(j => j.status === 'COMPLETED').length
      const totalSpent = profile?.totalSpent || jobs.filter(j => j.finalPrice).reduce((sum, j) => sum + (j.finalPrice || 0), 0)
      
      setStats({ activeJobs: active, completedJobs: completed, totalSpent })
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
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'MATCHED': return 'bg-blue-100 text-blue-800'
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
            <p className="text-sm text-neutral-textSecondary mt-1">Manage your services and bookings</p>
          </div>
          {unreadNotifications > 0 && (
            <Link
              href="/customer/notifications"
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
        className="grid md:grid-cols-3 gap-4 mb-6"
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
          <div className="h-1.5 bg-neutral-background rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stats.activeJobs / Math.max(stats.activeJobs + stats.completedJobs, 1)) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="h-full bg-gradient-to-r from-primary-main to-primary-light"
            />
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
          <div className="h-1.5 bg-neutral-background rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stats.completedJobs / Math.max(stats.activeJobs + stats.completedJobs, 1)) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="h-full bg-gradient-to-r from-accent-green to-accent-green/60"
            />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-primary-main to-primary-dark rounded-2xl p-5 text-white shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Link href="/customer/jobs/create" className="block">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-blue-100">Quick Action</div>
                <div className="text-sm font-semibold">Create Job</div>
              </div>
            </div>
            <div className="text-xs text-blue-100">Book a service now</div>
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-neutral-textPrimary font-display">Recent Jobs</h2>
          <Link href="/customer/jobs" className="flex items-center gap-1.5 text-xs text-primary-main hover:text-primary-dark font-semibold transition-colors">
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        
        {recentJobs.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-neutral-background rounded-full flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-8 h-8 text-neutral-textSecondary" />
            </div>
            <p className="text-sm font-semibold text-neutral-textPrimary mb-1">No jobs yet</p>
            <p className="text-xs text-neutral-textSecondary mb-4">Book your first service to get started!</p>
            <Link href="/customer/jobs/create" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl text-sm font-semibold hover:shadow-md hover:scale-105 transition-all duration-300">
              <Plus className="w-4 h-4" />
              Book a Service
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
                  href={`/customer/jobs/${job.id}`}
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
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(job.preferredTime).toLocaleDateString()}
                        </span>
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
