'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { ArrowRight, Bell, Briefcase, CheckCircle2, CircleDollarSign, MapPin, Plus, Sparkles, Timer, TrendingUp } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getCustomerJobs, type JobDto } from '@/lib/services/job'
import { getCustomerProfile } from '@/lib/services/customer'
import { getUnreadCount } from '@/lib/services/notification'

export default function CustomerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<JobDto[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, spend: 0 })

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push('/login?redirect=/customer/dashboard')
      return
    }
    if (user.role !== 'CUSTOMER') {
      router.push('/dashboard')
      return
    }
    load(user.userId)
  }, [router])

  const load = async (customerId: number) => {
    try {
      setLoading(true)
      const [jobsRes, profileRes, unreadRes] = await Promise.all([
        getCustomerJobs(customerId, 0, 6).catch(() => ({ content: [] })),
        getCustomerProfile(customerId).catch(() => null),
        getUnreadCount(customerId, 'CUSTOMER').catch(() => 0),
      ])

      const customerJobs = jobsRes.content || []
      const activeJobs = customerJobs.filter((j) => ['PENDING', 'MATCHED', 'ACCEPTED', 'IN_PROGRESS'].includes(j.status)).length
      const completedJobs = profileRes?.completedJobs || customerJobs.filter((j) => j.status === 'COMPLETED').length
      const spend = profileRes?.totalSpent || customerJobs.reduce((sum, j) => sum + (j.finalPrice || 0), 0)

      setJobs(customerJobs)
      setUnreadCount(unreadRes || 0)
      setStats({
        total: profileRes?.totalJobs || customerJobs.length,
        active: activeJobs,
        completed: completedJobs,
        spend,
      })
    } catch {
      toast.error('Could not load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const completionPct = useMemo(() => {
    if (!stats.total) return 0
    return Math.round((stats.completed / stats.total) * 100)
  }, [stats])

  if (loading) return <div className="px-6 py-10 text-sm text-slate-300">Loading dashboard...</div>

  const statCards = [
    { label: 'Total Jobs', value: stats.total, icon: Briefcase, link: '/customer/jobs', color: 'from-blue-500 to-blue-600' },
    { label: 'Active Jobs', value: stats.active, icon: Timer, link: '/customer/jobs?status=IN_PROGRESS', color: 'from-orange-500 to-orange-600' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, link: '/customer/jobs?status=COMPLETED', color: 'from-green-500 to-green-600' },
    { label: 'Spend', value: `₹${stats.spend.toLocaleString()}`, icon: CircleDollarSign, link: '/customer/profile', color: 'from-purple-500 to-purple-600' },
  ]

  return (
    <div className="px-6 py-6 space-y-6">
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark text-white p-7 border border-slate-800"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-300">Customer Command Center</p>
            <h1 className="text-3xl font-bold mt-2">Everything for your home services, in one place</h1>
            <p className="text-sm text-slate-300 mt-2">Track active jobs, spend, completion and next best actions without switching pages.</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/customer/notifications" className="relative rounded-xl border border-slate-700 p-2.5 hover:bg-white/10 transition-all">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent-orange text-xs font-bold text-white flex items-center justify-center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </Link>
          </motion.div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/customer/jobs/create" className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-4 py-2.5 text-sm font-semibold hover:shadow-lg transition-all">
              <Plus className="w-4 h-4" /> Book a service
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/customer/about" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold hover:bg-white/10 transition-all">
              <Sparkles className="w-4 h-4" /> Why ServiChaya
            </Link>
          </motion.div>
        </div>
      </motion.section>

      <section className="grid md:grid-cols-4 gap-4">
        {statCards.map((item, index) => (
          <motion.article
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="rounded-2xl glass-dark border border-white/10 p-5 hover:border-primary-main/50 transition-all cursor-pointer group"
          >
            <Link href={item.link} className="block">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-300">{item.label}</p>
              <p className="text-2xl font-bold text-white group-hover:text-primary-light transition-colors">{item.value}</p>
            </Link>
          </motion.article>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-5">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 rounded-2xl glass-dark border border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Recent service requests</h2>
            <motion.div
              whileHover={{ x: 5 }}
            >
              <Link href="/customer/jobs" className="inline-flex items-center gap-1 text-sm text-primary-light font-semibold hover:gap-2 transition-all">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-50" />
              <p className="text-sm text-slate-300 mb-3">No requests created yet. Start with your first booking.</p>
              <Link href="/customer/jobs/create" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 py-2 text-sm font-semibold hover:shadow-lg hover:shadow-primary-main/50 transition-all">
                <Plus className="w-4 h-4" /> Create your first request
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <Link href={`/customer/jobs/${job.id}`} className="block rounded-xl border border-white/10 glass p-4 hover:border-primary-main/50 hover:bg-primary-main/10 transition-all group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-white group-hover:text-primary-light transition-colors">{job.title}</p>
                        <p className="text-xs text-slate-300 mt-1">Code: {job.jobCode}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-300">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.addressLine1}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Timer className="w-3.5 h-3.5" />
                            {new Date(job.preferredTime).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold rounded-full px-2.5 py-1 bg-primary-main/20 text-primary-light whitespace-nowrap border border-primary-main/30">{job.status}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.aside 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl bg-gradient-to-br from-primary-main to-primary-dark text-white p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5" />
            <p className="text-xs uppercase tracking-wide text-blue-100">Progress</p>
          </div>
          <h3 className="text-xl font-bold mt-2">Completion Health: {completionPct}%</h3>
          <div className="mt-4 h-2 w-full rounded-full bg-white/30 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-white"
            />
          </div>
          <ul className="mt-5 text-sm text-blue-100 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Add complete details for faster provider match.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Keep profile updated for better communication.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Post reviews to improve future recommendations.</span>
            </li>
          </ul>
          <Link href="/customer/profile" className="mt-4 inline-block text-xs text-blue-100 hover:text-white underline">
            Update profile →
          </Link>
        </motion.aside>
      </section>
    </div>
  )
}
