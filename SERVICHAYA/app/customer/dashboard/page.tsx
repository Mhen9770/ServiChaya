'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Bell,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  IndianRupee,
  MapPin,
  Plus,
  Sparkles,
  Star,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getCurrentUser } from '@/lib/auth'
import { getCustomerJobs, type JobDto } from '@/lib/services/job'
import { getUnreadCount } from '@/lib/services/notification'
import { getCustomerProfile } from '@/lib/services/customer'
import { getAllCategories, type ServiceCategory } from '@/lib/services/service'
import { SkeletonCard } from '@/components/ui/Skeleton'

export default function CustomerDashboard() {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobDto[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [stats, setStats] = useState({ activeJobs: 0, completedJobs: 0, totalSpent: 0 })
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
    fetchData(currentUser.userId)
  }, [router])

  const fetchData = async (customerId: number) => {
    try {
      setLoading(true)
      const [profile, jobsResult, notifications, featuredCategories] = await Promise.all([
        getCustomerProfile(customerId).catch(() => null),
        getCustomerJobs(customerId, 0, 5).catch(() => ({ content: [] })),
        getUnreadCount(customerId, 'CUSTOMER').catch(() => 0),
        getAllCategories(true).catch(() => []),
      ])

      const currentJobs = jobsResult.content || []
      const activeJobs = currentJobs.filter((job) => ['PENDING', 'MATCHED', 'ACCEPTED', 'IN_PROGRESS'].includes(job.status)).length
      const completedJobs = profile?.completedJobs || currentJobs.filter((job) => job.status === 'COMPLETED').length
      const totalSpent = profile?.totalSpent || currentJobs.reduce((sum, job) => sum + (job.finalPrice || 0), 0)

      setStats({ activeJobs, completedJobs, totalSpent })
      setJobs(currentJobs)
      setUnreadNotifications(notifications || 0)
      setCategories(featuredCategories.slice(0, 6))
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const activeRate = useMemo(() => {
    const total = stats.activeJobs + stats.completedJobs
    return total ? Math.round((stats.activeJobs / total) * 100) : 0
  }, [stats])

  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="grid md:grid-cols-3 gap-4 mb-6">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
      </div>
    )
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-primary-dark via-primary-main to-primary-light text-white p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-blue-100 mb-2">Customer experience portal</p>
            <h1 className="text-3xl font-bold mb-2">Plan, book & track every home service</h1>
            <p className="text-sm text-blue-100 max-w-2xl">
              ServiChaya connects you with verified professionals for electrician, plumbing, cleaning and emergency support.
            </p>
          </div>
          <Link href="/customer/notifications" className="relative bg-white/20 rounded-xl p-2.5 hover:bg-white/30 transition">
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-orange text-xs font-bold flex items-center justify-center">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/customer/jobs/create" className="inline-flex items-center gap-2 bg-white text-primary-main px-4 py-2 rounded-xl font-semibold">
            <Plus className="w-4 h-4" /> New Service Request
          </Link>
          <Link href="/customer/about" className="inline-flex items-center gap-2 border border-white/40 px-4 py-2 rounded-xl font-semibold hover:bg-white/10">
            <Sparkles className="w-4 h-4" /> Why ServiChaya
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {[
          { label: 'Active Jobs', value: stats.activeJobs, icon: Briefcase },
          { label: 'Completed Jobs', value: stats.completedJobs, icon: CheckCircle2 },
          { label: 'Total Spend', value: `₹${stats.totalSpent.toLocaleString()}`, icon: IndianRupee },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-neutral-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary-main/10 flex items-center justify-center text-primary-main"><item.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-neutral-textSecondary">{item.label}</p>
                <p className="text-2xl font-bold text-neutral-textPrimary">{item.value}</p>
              </div>
            </div>
            {item.label === 'Active Jobs' && (
              <>
                <div className="w-full h-2 rounded-full bg-neutral-background overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${activeRate}%` }} className="h-full bg-gradient-to-r from-primary-main to-primary-light" />
                </div>
                <p className="text-xs text-neutral-textSecondary mt-2">{activeRate}% of your jobs are currently live.</p>
              </>
            )}
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Recent Requests</h2>
            <Link href="/customer/jobs" className="text-sm text-primary-main font-semibold inline-flex items-center gap-1">View all <ArrowRight className="w-4 h-4" /></Link>
          </div>
          {jobs.length === 0 ? (
            <div className="text-sm text-neutral-textSecondary bg-neutral-background rounded-xl p-4">No jobs yet. Create your first service request.</div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Link key={job.id} href={`/customer/jobs/${job.id}`} className="block border border-neutral-border rounded-xl p-4 hover:border-primary-main/30 hover:bg-primary-main/[0.03] transition">
                  <p className="font-semibold text-sm text-neutral-textPrimary">{job.title}</p>
                  <div className="mt-2 text-xs text-neutral-textSecondary flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-1"><CalendarClock className="w-3 h-3" />{new Date(job.createdAt).toLocaleDateString()}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{job.cityId ? `City #${job.cityId}` : 'Location TBD'}</span>
                    <span className="font-medium text-primary-main">{job.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-neutral-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Popular service categories</h2>
          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            {categories.length > 0 ? categories.map((category) => (
              <div key={category.id} className="rounded-xl border border-neutral-border p-3">
                <p className="text-sm font-semibold text-neutral-textPrimary">{category.name}</p>
                <p className="text-xs text-neutral-textSecondary mt-1 line-clamp-2">{category.description || 'Trusted partners available in your area.'}</p>
              </div>
            )) : (
              <div className="text-sm text-neutral-textSecondary">Categories will appear when loaded from the master data.</div>
            )}
          </div>
          <div className="rounded-xl bg-neutral-background p-4">
            <h3 className="font-semibold text-sm mb-2 inline-flex items-center gap-2"><Star className="w-4 h-4 text-accent-orange" />Customer promise</h3>
            <ul className="text-xs text-neutral-textSecondary space-y-1 list-disc list-inside">
              <li>Verified & background-checked professionals</li>
              <li>Transparent pricing and real-time updates</li>
              <li>Easy support and quick issue resolution</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
