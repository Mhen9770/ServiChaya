'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import {
  ArrowRight,
  Bell,
  BookOpenCheck,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  Sparkles,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getCustomerJobs, type JobDto } from '@/lib/services/job'
import { getCustomerProfile } from '@/lib/services/customer'
import { getUnreadCount } from '@/lib/services/notification'

export default function CustomerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<JobDto[]>([])
  const [unread, setUnread] = useState(0)
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, spending: 0 })

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
      const [jobRes, profile, unreadRes] = await Promise.all([
        getCustomerJobs(customerId, 0, 6).catch(() => ({ content: [] })),
        getCustomerProfile(customerId).catch(() => null),
        getUnreadCount(customerId, 'CUSTOMER').catch(() => 0),
      ])

      const allJobs = jobRes.content || []
      const active = allJobs.filter((j) => ['PENDING', 'MATCHED', 'ACCEPTED', 'IN_PROGRESS'].includes(j.status)).length
      const completed = profile?.completedJobs || allJobs.filter((j) => j.status === 'COMPLETED').length
      const spending = profile?.totalSpent || allJobs.reduce((sum, j) => sum + (j.finalPrice || 0), 0)

      setJobs(allJobs)
      setUnread(unreadRes || 0)
      setStats({ total: profile?.totalJobs || allJobs.length, active, completed, spending })
    } catch {
      toast.error('Unable to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const completionRate = useMemo(() => {
    if (!stats.total) return 0
    return Math.round((stats.completed / stats.total) * 100)
  }, [stats])

  if (loading) {
    return <div className="px-6 py-10 text-sm text-neutral-textSecondary">Loading dashboard...</div>
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <section className="rounded-3xl bg-slate-900 text-white p-7 border border-slate-800">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-300">Customer Control Center</p>
            <h1 className="text-3xl font-bold mt-2">Welcome back. Your services are under control.</h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl">
              Create requests, track status, monitor spend, and keep service history organized from one place.
            </p>
          </div>
          <Link href="/customer/notifications" className="relative inline-flex p-3 rounded-xl border border-slate-700 hover:bg-white/5">
            <Bell className="w-5 h-5" />
            {unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-orange text-xs font-bold flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/customer/jobs/create" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-semibold">
            <Wrench className="w-4 h-4" /> New request
          </Link>
          <Link href="/customer/about" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/30 hover:bg-white/10">
            <Sparkles className="w-4 h-4" /> About us
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-4 gap-4">
        {[
          { label: 'Total Jobs', value: stats.total, icon: BookOpenCheck },
          { label: 'Active Jobs', value: stats.active, icon: Clock3 },
          { label: 'Completed', value: stats.completed, icon: TrendingUp },
          { label: 'Total Spend', value: `₹${stats.spending.toLocaleString()}`, icon: CircleDollarSign },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-neutral-border p-5">
            <div className="w-10 h-10 rounded-xl bg-primary-main/10 text-primary-main flex items-center justify-center mb-3"><stat.icon className="w-5 h-5" /></div>
            <p className="text-xs text-neutral-textSecondary">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Recent requests</h2>
            <Link href="/customer/jobs" className="inline-flex items-center gap-1 text-sm text-primary-main font-semibold">View all <ArrowRight className="w-4 h-4" /></Link>
          </div>

          {jobs.length === 0 ? (
            <p className="text-sm text-neutral-textSecondary">No requests yet. Start by creating your first request.</p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Link key={job.id} href={`/customer/jobs/${job.id}`} className="block border border-neutral-border rounded-xl p-4 hover:border-primary-main/30 transition">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold">{job.title}</p>
                      <p className="text-xs text-neutral-textSecondary mt-1">{job.jobCode}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-primary-main/10 text-primary-main font-semibold">{job.status}</span>
                  </div>
                  <div className="mt-2 text-xs text-neutral-textSecondary inline-flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5" /> {new Date(job.preferredTime).toLocaleString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-primary-main to-primary-dark text-white rounded-2xl p-6">
          <p className="text-xs uppercase tracking-wide text-blue-100">Performance</p>
          <h3 className="text-xl font-bold mt-2">Completion score: {completionRate}%</h3>
          <div className="w-full h-2 bg-white/25 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-white" style={{ width: `${completionRate}%` }} />
          </div>
          <ul className="mt-5 text-sm text-blue-100 space-y-2">
            <li>• Keep request details complete for faster matching.</li>
            <li>• Update profile details for smoother communication.</li>
            <li>• Review completed jobs to improve recommendations.</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
