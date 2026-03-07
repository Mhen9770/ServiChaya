'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAdminStats, type AdminStatsDto } from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import { ClipboardList, Users, Clock, CheckCircle2, TrendingUp, DollarSign, UserCheck } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStatsDto>({
    totalJobs: 0,
    pendingJobs: 0,
    activeProviders: 0,
    pendingVerifications: 0,
    totalCustomers: 0,
    totalEarnings: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const data = await getAdminStats()
      setStats(data)
    } catch (error: any) {
      console.error('Failed to fetch stats:', error)
      const errorMsg = error.response?.data?.message || 'Failed to load dashboard stats'
      toast.error(errorMsg)
      // Set default values on error
      setStats({
        totalJobs: 0,
        pendingJobs: 0,
        activeProviders: 0,
        pendingVerifications: 0,
        totalCustomers: 0,
        totalEarnings: 0
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loader fullScreen text="Loading dashboard..." />
  }

  return (
    <div className="px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">Admin Dashboard</h1>
        <p className="text-sm text-neutral-textSecondary mt-1">Manage platform operations</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6"
      >
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border hover:shadow-md hover:border-primary-main/30 transition-all duration-200"
        >
          <Link href="/admin/jobs" className="block">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-main/10 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-primary-main" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="text-2xl font-bold text-primary-main"
              >
                {stats.totalJobs.toLocaleString()}
              </motion.div>
            </div>
            <div className="text-xs font-semibold text-neutral-textSecondary">Total Jobs</div>
          </Link>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border hover:shadow-md hover:border-yellow-500/30 transition-all duration-200"
        >
          <Link href="/admin/jobs?status=PENDING" className="block">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="text-2xl font-bold text-yellow-600"
              >
                {stats.pendingJobs.toLocaleString()}
              </motion.div>
            </div>
            <div className="text-xs font-semibold text-neutral-textSecondary">Pending Jobs</div>
          </Link>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border hover:shadow-md hover:border-green-500/30 transition-all duration-200"
        >
          <Link href="/admin/providers" className="block">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-accent-green/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-accent-green" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="text-2xl font-bold text-accent-green"
              >
                {stats.activeProviders.toLocaleString()}
              </motion.div>
            </div>
            <div className="text-xs font-semibold text-neutral-textSecondary">Active Providers</div>
          </Link>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border hover:shadow-md hover:border-orange-500/30 transition-all duration-200"
        >
          <Link href="/admin/providers?status=PENDING_VERIFICATION" className="block">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-accent-orange/10 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-accent-orange" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="text-2xl font-bold text-accent-orange"
              >
                {stats.pendingVerifications.toLocaleString()}
              </motion.div>
            </div>
            <div className="text-xs font-semibold text-neutral-textSecondary">Pending Verifications</div>
          </Link>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border hover:shadow-md hover:border-blue-500/30 transition-all duration-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="text-2xl font-bold text-blue-600"
            >
              {stats.totalCustomers.toLocaleString()}
            </motion.div>
          </div>
          <div className="text-xs font-semibold text-neutral-textSecondary">Total Customers</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-gradient-to-br from-accent-green to-green-600 rounded-2xl p-5 shadow-md text-white hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.7 }}
              className="text-2xl font-bold"
            >
              ₹{stats.totalEarnings.toLocaleString()}
            </motion.div>
          </div>
          <div className="text-xs font-semibold text-green-100">Platform Earnings</div>
        </motion.div>
      </motion.div>
    </div>
  )
}
