'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowRight, Bell, Briefcase, CheckCircle2, CircleDollarSign, Plus, Sparkles, Timer } from 'lucide-react'
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

  if (loading) return <div className="px-6 py-10 text-sm text-neutral-textSecondary">Loading dashboard...</div>

  return (
    <div className="px-6 py-6 space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark text-white p-7 border border-slate-800">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-300">Customer Command Center</p>
            <h1 className="text-3xl font-bold mt-2">Everything for your home services, in one place</h1>
            <p className="text-sm text-slate-300 mt-2">Track active jobs, spend, completion and next best actions without switching pages.</p>
          </div>
          <Link href="/customer/notifications" className="relative rounded-xl border border-slate-700 p-2.5 hover:bg-white/10">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent-orange text-xs font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/customer/jobs/create" className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-4 py-2.5 text-sm font-semibold">
            <Plus className="w-4 h-4" /> Book a service
          </Link>
          <Link href="/customer/about" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
            <Sparkles className="w-4 h-4" /> Why ServiChaya
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-4 gap-4">
        {[
          { label: 'Total Jobs', value: stats.total, icon: Briefcase },
          { label: 'Active Jobs', value: stats.active, icon: Timer },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2 },
          { label: 'Spend', value: `₹${stats.spend.toLocaleString()}`, icon: CircleDollarSign },
        ].map((item) => (
          <article key={item.label} className="rounded-2xl bg-white border border-neutral-border p-5">
            <div className="w-10 h-10 rounded-xl bg-primary-main/10 text-primary-main flex items-center justify-center mb-3"><item.icon className="w-5 h-5" /></div>
            <p className="text-xs text-neutral-textSecondary">{item.label}</p>
            <p className="text-2xl font-bold text-neutral-textPrimary">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-neutral-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Recent service requests</h2>
            <Link href="/customer/jobs" className="inline-flex items-center gap-1 text-sm text-primary-main font-semibold">View all <ArrowRight className="w-4 h-4" /></Link>
          </div>

          {jobs.length === 0 ? (
            <p className="text-sm text-neutral-textSecondary">No requests created yet. Start with your first booking.</p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Link key={job.id} href={`/customer/jobs/${job.id}`} className="block rounded-xl border border-neutral-border p-4 hover:border-primary-main/40 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-neutral-textPrimary">{job.title}</p>
                      <p className="text-xs text-neutral-textSecondary mt-1">{job.jobCode}</p>
                    </div>
                    <span className="text-xs font-semibold rounded-full px-2.5 py-1 bg-primary-main/10 text-primary-main">{job.status}</span>
                  </div>
                  <p className="text-xs text-neutral-textSecondary mt-2">Preferred: {new Date(job.preferredTime).toLocaleString()}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-2xl bg-gradient-to-br from-primary-main to-primary-dark text-white p-6">
          <p className="text-xs uppercase tracking-wide text-blue-100">Progress</p>
          <h3 className="text-xl font-bold mt-2">Completion Health: {completionPct}%</h3>
          <div className="mt-4 h-2 w-full rounded-full bg-white/30 overflow-hidden">
            <div className="h-full bg-white" style={{ width: `${completionPct}%` }} />
          </div>
          <ul className="mt-5 text-sm text-blue-100 space-y-2">
            <li>• Add complete details for faster provider match.</li>
            <li>• Keep profile updated for better communication.</li>
            <li>• Post reviews to improve future recommendations.</li>
          </ul>
        </aside>
      </section>
    </div>
  )
}
