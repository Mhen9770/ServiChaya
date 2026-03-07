'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bell, CheckCircle2, CircleDollarSign, ClipboardList, Compass, Plus, ShieldCheck, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getCurrentUser } from '@/lib/auth'
import { getCustomerJobs, type JobDto } from '@/lib/services/job'
import { getUnreadCount } from '@/lib/services/notification'
import { getCustomerProfile } from '@/lib/services/customer'

export default function CustomerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<JobDto[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, spent: 0 })

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
    loadDashboard(user.userId)
  }, [router])

  const loadDashboard = async (userId: number) => {
    try {
      setLoading(true)
      const [profile, jobRes, unread] = await Promise.all([
        getCustomerProfile(userId).catch(() => null),
        getCustomerJobs(userId, 0, 6).catch(() => ({ content: [] })),
        getUnreadCount(userId, 'CUSTOMER').catch(() => 0),
      ])
      const data = jobRes.content || []
      const active = data.filter((j) => ['PENDING', 'MATCHED', 'ACCEPTED', 'IN_PROGRESS'].includes(j.status)).length
      const completed = profile?.completedJobs ?? data.filter((j) => j.status === 'COMPLETED').length
      const spent = profile?.totalSpent ?? data.reduce((acc, j) => acc + (j.finalPrice || 0), 0)
      setStats({ total: profile?.totalJobs || data.length, active, completed, spent })
      setJobs(data)
      setUnreadNotifications(unread || 0)
    } catch {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const completionRatio = useMemo(() => {
    if (!stats.total) return 0
    return Math.round((stats.completed / stats.total) * 100)
  }, [stats])

  if (loading) {
    return <div className="px-6 py-8 text-sm text-neutral-textSecondary">Loading customer experience...</div>
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <section className="rounded-3xl text-white bg-gradient-to-r from-slate-900 via-primary-dark to-primary-main p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-100 mb-2">Customer command center</p>
            <h1 className="text-3xl font-bold mb-2">Everything about your services, in one place.</h1>
            <p className="text-sm text-blue-100 max-w-2xl">Create requests, monitor progress, and keep all details transparent from booking to completion.</p>
          </div>
          <Link href="/customer/notifications" className="relative rounded-xl p-2.5 bg-white/15 border border-white/20 hover:bg-white/20 transition">
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-accent-orange text-[10px] flex items-center justify-center font-bold">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>}
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/customer/jobs/create" className="inline-flex items-center gap-2 bg-white text-primary-main px-4 py-2 rounded-xl font-semibold"><Plus className="w-4 h-4" /> Create Job</Link>
          <Link href="/customer/jobs" className="inline-flex items-center gap-2 border border-white/35 px-4 py-2 rounded-xl font-semibold">Track My Jobs</Link>
        </div>
      </section>

      <section className="grid md:grid-cols-4 gap-4">
        <Metric icon={ClipboardList} label="Total Jobs" value={stats.total} />
        <Metric icon={Compass} label="Active Jobs" value={stats.active} />
        <Metric icon={CheckCircle2} label="Completed" value={stats.completed} />
        <Metric icon={CircleDollarSign} label="Total Spent" value={`₹${stats.spent.toLocaleString()}`} />
      </section>

      <section className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-neutral-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Recent service requests</h2>
            <Link href="/customer/jobs" className="text-sm text-primary-main font-semibold">View all</Link>
          </div>
          {jobs.length === 0 ? (
            <p className="text-sm text-neutral-textSecondary">No jobs yet. Your journey starts with a new service request.</p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Link key={job.id} href={`/customer/jobs/${job.id}`} className="block rounded-xl border border-neutral-border p-4 hover:border-primary-main/40 transition">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-sm">{job.title}</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary-main/10 text-primary-main font-semibold">{job.status}</span>
                  </div>
                  <p className="text-xs text-neutral-textSecondary mt-1 line-clamp-2">{job.description}</p>
                  <div className="mt-2 text-xs text-neutral-textSecondary">{new Date(job.createdAt).toLocaleString()}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-neutral-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold mb-3">Progress snapshot</h3>
          <div className="rounded-xl bg-neutral-background p-4 mb-4">
            <p className="text-sm font-semibold">Completion rate: {completionRatio}%</p>
            <div className="mt-2 h-2 rounded-full bg-white overflow-hidden"><div className="h-full bg-gradient-to-r from-primary-main to-primary-light" style={{ width: `${completionRatio}%` }} /></div>
          </div>
          <ul className="space-y-2 text-xs text-neutral-textSecondary mb-5">
            <li className="inline-flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-accent-green" /> Verified professionals in network</li>
            <li className="inline-flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-accent-orange" /> Transparent pricing and timeline visibility</li>
          </ul>
          <Link href="/customer/about" className="inline-flex text-sm font-semibold text-primary-main">Learn more about ServiChaya</Link>
        </motion.div>
      </section>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <article className="bg-white border border-neutral-border rounded-2xl p-4 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-primary-main/10 text-primary-main flex items-center justify-center mb-2"><Icon className="w-5 h-5" /></div>
      <p className="text-xs text-neutral-textSecondary">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </article>
  )
}
