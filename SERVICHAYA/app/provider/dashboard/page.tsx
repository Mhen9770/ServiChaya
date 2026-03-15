'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getOnboardingStatus, getProviderProfile, getProviderCustomers, updateProviderProfile, type ProviderProfileDto, type ProviderCustomerSummary } from '@/lib/services/provider'
import { getProviderJobs, type JobDto } from '@/lib/services/job'
import { getEarningsSummary } from '@/lib/services/payment'
import { getUnreadCount } from '@/lib/services/notification'
import { getAvailableJobsForProvider } from '@/lib/services/matching'
import { toast } from 'react-hot-toast'
import { PageLoader, ContentLoader, ButtonLoader } from '@/components/ui/Loader'
import { SkeletonCard } from '@/components/ui/Skeleton'
import OneSignalRegistration from '@/components/onesignal/OneSignalRegistration'
import { 
  Clock, FileText, CheckCircle2, ArrowRight, ClipboardList, 
  Briefcase, DollarSign, Bell, TrendingUp, AlertCircle, Sparkles, Plus, MapPin
} from 'lucide-react'
import { motion } from 'framer-motion'
import LocationPicker from '@/components/map/LocationPicker'

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
  const [providerProfile, setProviderProfile] = useState<ProviderProfileDto | null>(null)
  const [stats, setStats] = useState({
    activeJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    availableJobs: 0
  })
  const [recentJobs, setRecentJobs] = useState<JobDto[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [topCustomers, setTopCustomers] = useState<ProviderCustomerSummary[]>([])
  const [updatingAvailability, setUpdatingAvailability] = useState(false)

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

  // Capture provider's current browser location once for today's map
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      () => {
        // ignore failure; map will just center on first job or a default
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    )
  }, [])

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
      
      const [jobsResult, earnings, notifications, availableJobs, profile, customers] = await Promise.all([
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
        }),
        getProviderProfile(providerId).catch((err) => {
          console.error('Failed to fetch provider profile for referral info:', err)
          return null
        }),
        getProviderCustomers(providerId).catch((err) => {
          console.error('Failed to fetch provider customers:', err)
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
      if (profile) {
        setProviderProfile(profile)
      }
      setTopCustomers((customers || []).slice(0, 5))
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error)
      const errorMsg = error.response?.data?.message || 'Failed to load dashboard'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }


  if (loading) {
    return <PageLoader text="Loading dashboard..." />
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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <OneSignalRegistration />
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark text-white p-5 sm:p-6 lg:p-7 border-2 border-slate-700/50 shadow-xl shadow-slate-950/50"
      >
        <div className="flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-300">Provider Command Center</p>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2 sm:mt-3 leading-tight">Everything for your service business, in one place</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 sm:mt-3 leading-relaxed">Track active jobs, earnings, and available opportunities without switching pages.</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* OneSignal custom subscription link - shows only if not subscribed */}
            <div className="mb-2">
              <div className="onesignal-customlink-container" />
            </div>
            <Link href="/provider/notifications" className="relative rounded-lg sm:rounded-xl border border-slate-700 p-2 sm:p-2.5 hover:bg-white/10 transition-all">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadNotifications > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-accent-orange text-[10px] sm:text-xs font-bold text-white flex items-center justify-center"
                >
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </motion.span>
              )}
            </Link>
          </motion.div>
        </div>

        <div className="mt-4 sm:mt-5 flex flex-wrap gap-2 sm:gap-3">
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/provider/jobs/available" className="inline-flex items-center gap-2 rounded-lg sm:rounded-xl bg-white text-slate-900 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold hover:shadow-lg transition-all">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
              <span className="hidden sm:inline">View Available Jobs</span>
              <span className="sm:hidden">Available Jobs</span>
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/provider/profile" className="inline-flex items-center gap-2 rounded-lg sm:rounded-xl border border-white/30 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold hover:bg-white/10 transition-all">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
              <span className="hidden sm:inline">Update Profile</span>
              <span className="sm:hidden">Profile</span>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Today / pipeline strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'New offers',
            value: stats.availableJobs,
            caption: 'Jobs waiting for your response',
            href: '/provider/jobs/available',
            highlight: stats.availableJobs > 0,
          },
          {
            label: 'Active now',
            value: stats.activeJobs,
            caption: 'Accepted or in-progress jobs',
            href: '/provider/jobs?status=IN_PROGRESS',
          },
          {
            label: 'Completed',
            value: stats.completedJobs,
            caption: 'Lifetime jobs completed',
            href: '/provider/jobs?status=COMPLETED',
          },
          {
            label: 'Total earned',
            value: `₹${stats.totalEarnings.toLocaleString()}`,
            caption: 'All time on SERVICHAYA',
            href: '/provider/earnings',
          },
        ].map((item) => (
          <motion.article
            key={item.label}
            whileHover={{ scale: 1.03, y: -2 }}
            className={`rounded-xl sm:rounded-2xl glass-dark border px-3 sm:px-4 py-3 sm:py-4 cursor-pointer transition-all ${
              item.highlight
                ? 'border-accent-orange/70 bg-accent-orange/10 shadow-lg shadow-accent-orange/20'
                : 'border-white/15 hover:border-primary-main/60 hover:shadow-lg hover:shadow-primary-main/15'
            }`}
          >
            <Link href={item.href} className="block space-y-1">
              <p className="text-[10px] sm:text-xs text-slate-300 font-medium">{item.label}</p>
              <p className="text-lg sm:text-xl font-bold text-white">{item.value}</p>
              <p className="text-[10px] sm:text-[11px] text-slate-400">{item.caption}</p>
            </Link>
          </motion.article>
        ))}
      </section>

      {/* My customers & Referral Section */}
      {providerProfile && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl sm:rounded-2xl glass-dark border-2 border-white/20 p-4 sm:p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-light" />
              <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-300">
                Grow with your own customers
              </p>
            </div>
            <Link
              href="/provider/profile"
              className="text-[10px] sm:text-xs text-primary-light hover:text-primary-main underline-offset-2 hover:underline"
            >
              Manage profile
            </Link>
          </div>

          <div className="grid md:grid-cols-[1.4fr,1.1fr] gap-4 sm:gap-5 items-start">
            {/* Top customers list */}
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white mb-2">
                Your customers on SERVICHAYA
              </h2>
              {topCustomers.length === 0 ? (
                <p className="text-[11px] sm:text-xs text-slate-400">
                  As your customers start booking through SERVICHAYA, they will appear here so you can track repeat work and earnings.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                  {topCustomers.map((c) => (
                    <div
                      key={c.customerId}
                      className="flex items-start justify-between gap-2 rounded-lg sm:rounded-xl border border-white/15 bg-slate-900/40 px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">
                          {c.name || 'Customer'}{' '}
                          {c.primaryForThisProvider && (
                            <span className="ml-1 inline-flex items-center rounded-full bg-primary-main/20 px-1.5 py-0.5 text-[9px] text-primary-light border border-primary-main/40">
                              Primary
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] sm:text-xs text-slate-300 truncate">
                          {c.mobileNumber}
                          {c.email && ` · ${c.email}`}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                          {c.completedJobsTogether} jobs · ₹{c.totalEarningsFromCustomer.toLocaleString()} earned ·{' '}
                          <span className="uppercase">{c.source?.toLowerCase() === 'referral_code' ? 'Referral' : c.source}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window === 'undefined') return
                          const baseUrl = window.location.origin || 'https://servichaya.com'
                          const link = `${baseUrl}/?ref=${encodeURIComponent(providerProfile.providerCode)}`
                          const msg = `Hi ${c.name || ''},\n\nNext time you need a service, please book me via SERVICHAYA using this link:\n${link}\n\nThis helps me stay as your preferred provider and keeps all jobs tracked in one place.`
                          const encoded = encodeURIComponent(msg)
                          window.open(`https://wa.me/?text=${encoded}`, '_blank')
                        }}
                        className="ml-2 inline-flex items-center justify-center rounded-full border border-primary-main/50 px-2.5 py-1 text-[10px] sm:text-xs text-primary-light hover:bg-primary-main/10 transition-colors"
                      >
                        Share link
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Referral tools */}
            <div className="rounded-lg sm:rounded-xl border border-white/15 bg-slate-900/50 p-3 sm:p-4 space-y-2.5">
              <p className="text-[11px] sm:text-xs text-slate-300">
                Share your personal link with new customers. When they join from your link, they see you first for matching services in your area.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] sm:text-xs text-slate-300 whitespace-nowrap">
                  Your provider code
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/70 border border-white/20 text-xs font-semibold text-white">
                  {providerProfile.providerCode}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window === 'undefined') return
                    const baseUrl = window.location.origin || 'https://servichaya.com'
                    const link = `${baseUrl}/?ref=${encodeURIComponent(providerProfile.providerCode)}`
                    navigator.clipboard?.writeText(link)
                      .then(() => toast.success('Referral link copied'))
                      .catch(() => toast.error('Unable to copy link'))
                  }}
                  className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white text-[11px] sm:text-sm font-semibold hover:shadow-lg hover:shadow-primary-main/40 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Copy link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window === 'undefined') return
                    const baseUrl = window.location.origin || 'https://servichaya.com'
                    const link = `${baseUrl}/?ref=${encodeURIComponent(providerProfile.providerCode)}`
                    const msg = `Hi, I now manage my jobs via SERVICHAYA.\n\nUse this link to book me directly:\n${link}\n\nThis keeps all your service history and my work in one place.`
                    const encoded = encodeURIComponent(msg)
                    window.open(`https://wa.me/?text=${encoded}`, '_blank')
                  }}
                  className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-white/25 text-[11px] sm:text-sm text-white hover:bg-white/10 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Share via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Active Jobs', value: stats.activeJobs, icon: Briefcase, link: '/provider/jobs?status=IN_PROGRESS', color: 'from-orange-500 to-orange-600', borderColor: 'border-orange-400/30' },
          { label: 'Completed', value: stats.completedJobs, icon: CheckCircle2, link: '/provider/jobs?status=COMPLETED', color: 'from-green-500 to-green-600', borderColor: 'border-green-400/30' },
          { label: 'Total Earnings', value: `₹${stats.totalEarnings.toLocaleString()}`, icon: DollarSign, link: '/provider/earnings', color: 'from-purple-500 to-purple-600', borderColor: 'border-purple-400/30' },
          { label: 'Available Jobs', value: stats.availableJobs, icon: AlertCircle, link: '/provider/jobs/available', color: 'from-blue-500 to-blue-600', borderColor: 'border-blue-400/30', urgent: stats.availableJobs > 0 }
        ].map((item, index) => (
          <motion.article
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`rounded-xl sm:rounded-2xl glass-dark border-2 ${item.urgent ? 'border-orange-400/60 bg-gradient-to-br from-accent-orange/15 to-orange-600/15 shadow-lg shadow-orange-500/10' : item.borderColor} p-4 sm:p-5 hover:border-primary-main/70 hover:shadow-xl hover:shadow-primary-main/20 transition-all cursor-pointer group backdrop-blur-md`}
          >
            <Link href={item.link} className="block">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-black/20`}>
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <p className="text-[10px] sm:text-xs text-slate-300 mb-0.5 sm:mb-1 font-medium">{item.label}</p>
              <p className={`text-lg sm:text-xl lg:text-2xl font-bold text-white group-hover:text-primary-light transition-colors ${item.urgent ? 'text-orange-100' : ''}`}>{item.value}</p>
            </Link>
          </motion.article>
        ))}
      </section>

      {/* Availability & service areas */}
      {providerProfile && (
        <section className="rounded-xl sm:rounded-2xl glass-dark border-2 border-white/20 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary-light" />
              <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-300">
                Today&apos;s availability
              </p>
            </div>
            <p className="text-sm sm:text-base font-semibold text-white">
              Let SERVICHAYA know if you are open for new jobs today.
            </p>
            <p className="text-[10px] sm:text-xs text-slate-300">
              When you are available, we prioritise you for nearby matches within your service areas.
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs text-slate-300">
              <span className="px-2 py-1 rounded-full bg-slate-800/80 border border-white/10">
                Service areas configured: {providerProfile.serviceAreas?.length || 0}
              </span>
              <Link
                href="/provider/profile"
                className="inline-flex items-center gap-1 text-primary-light hover:text-primary-main underline-offset-2 hover:underline"
              >
                <MapPin className="w-3 h-3" />
                Edit service areas
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <span className="text-[11px] sm:text-xs text-slate-300">
                I am available for new jobs today
              </span>
              <button
                type="button"
                onClick={async () => {
                  if (!providerProfile || updatingAvailability) return
                  try {
                    setUpdatingAvailability(true)
                    const next = !providerProfile.isAvailable
                    const updated = await updateProviderProfile(providerProfile.id, { isAvailable: next })
                    setProviderProfile(updated)
                    toast.success(next ? 'You are now available for new jobs' : 'You are marked as unavailable')
                  } catch (err: any) {
                    console.error('Failed to update availability', err)
                    toast.error(err?.response?.data?.message || 'Could not update availability')
                  } finally {
                    setUpdatingAvailability(false)
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
                  providerProfile.isAvailable
                    ? 'bg-emerald-500 border-emerald-400'
                    : 'bg-slate-700 border-slate-500'
                } ${updatingAvailability ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    providerProfile.isAvailable ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
            <p className="text-[10px] sm:text-[11px] text-slate-400 max-w-xs text-left md:text-right">
              Toggle this off when you are not taking new work. You will still see your existing jobs.
            </p>
          </div>
        </section>
      )}

      {/* Money focus card */}
      <section className="rounded-xl sm:rounded-2xl glass-dark border-2 border-emerald-400/30 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
            <DollarSign className="w-4 h-4 text-emerald-300" />
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-emerald-200">
              Your money on SERVICHAYA
            </p>
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-white mb-1">
            Total earned so far:{' '}
            <span className="text-emerald-300">
              ₹{stats.totalEarnings.toLocaleString()}
            </span>
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-300">
            Complete your active jobs on time to move more of this into your pocket and unlock better ranking.
          </p>
        </div>
        <Link
          href="/provider/earnings"
          className="inline-flex items-center gap-2 rounded-lg sm:rounded-xl bg-emerald-500/90 text-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/40 transition-all"
        >
          <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          View earnings
        </Link>
      </section>

      <section className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 rounded-xl sm:rounded-2xl glass-dark border-2 border-white/20 p-4 sm:p-5 lg:p-6 backdrop-blur-md shadow-lg shadow-black/20"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-white">Recent Jobs</h2>
            <motion.div
              whileHover={{ x: 5 }}
            >
              <Link href="/provider/jobs" className="inline-flex items-center gap-1 text-xs sm:text-sm text-primary-light font-semibold hover:gap-2 transition-all">
                <span className="hidden sm:inline">View all</span>
                <span className="sm:hidden">All</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </motion.div>
          </div>

          {recentJobs.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <ClipboardList className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-400 mb-2 sm:mb-3 opacity-50" />
              <p className="text-xs sm:text-sm text-slate-300 mb-3 sm:mb-4 px-2">No active jobs yet. Start accepting jobs to get started!</p>
              <Link href="/provider/jobs/available" className="inline-flex items-center gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold hover:shadow-lg hover:shadow-primary-main/50 transition-all">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                <span className="hidden sm:inline">View Available Jobs</span>
                <span className="sm:hidden">Available Jobs</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {recentJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <Link href={`/provider/jobs/${job.id}`} className="block rounded-lg sm:rounded-xl border-2 border-white/20 glass p-3 sm:p-4 hover:border-primary-main/70 hover:bg-primary-main/10 hover:shadow-lg hover:shadow-primary-main/10 transition-all group relative overflow-hidden backdrop-blur-md">
                    {/* Status indicator bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      job.status === 'COMPLETED' ? 'bg-emerald-400' :
                      job.status === 'IN_PROGRESS' || job.status === 'ACCEPTED' ? 'bg-primary-main' :
                      job.status === 'MATCHED' ? 'bg-indigo-400' :
                      job.status === 'PENDING' ? 'bg-amber-400' :
                      'bg-slate-400'
                    }`} />
                    
                    <div className="flex items-start justify-between gap-2 sm:gap-3 pl-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base text-white group-hover:text-primary-light transition-colors line-clamp-1">{job.title}</p>
                        <p className="text-[10px] sm:text-xs text-slate-300 mt-1">Code: {job.jobCode}</p>
                        {job.estimatedBudget && (
                          <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-1.5">
                            ₹{job.estimatedBudget.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <span className={`text-[9px] sm:text-[10px] font-semibold rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 whitespace-nowrap border shrink-0 ${
                        job.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/60' :
                        job.status === 'IN_PROGRESS' || job.status === 'ACCEPTED' ? 'bg-primary-main/15 text-primary-light border-primary-main/60' :
                        job.status === 'MATCHED' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-400/60' :
                        job.status === 'PENDING' ? 'bg-amber-500/10 text-amber-300 border-amber-400/60' :
                        'bg-slate-600/10 text-slate-200 border-slate-500/60'
                      }`}>
                        {job.status.replace('_', ' ')}
                      </span>
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
          className="space-y-4 sm:space-y-5"
        >
          {/* Today's map card */}
          <div className="rounded-xl sm:rounded-2xl glass-dark border-2 border-primary-main/40 p-4 sm:p-5 lg:p-6 backdrop-blur-md shadow-lg shadow-primary-main/20">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary-light" />
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-300">Today&apos;s map</p>
                  <h3 className="text-sm sm:text-base font-bold text-white">Where your jobs are today</h3>
                </div>
              </div>
              <Link
                href="/provider/jobs"
                className="text-[10px] sm:text-xs text-primary-light hover:text-primary-main underline-offset-2 hover:underline"
              >
                View list
              </Link>
            </div>
            {recentJobs.length === 0 ? (
              <p className="text-[11px] sm:text-xs text-slate-400">
                No active or recent jobs to show on map yet.
              </p>
            ) : (
              <div className="space-y-2">
                <LocationPicker
                  center={
                    currentLocation && !Number.isNaN(currentLocation.lat) && !Number.isNaN(currentLocation.lng)
                      ? currentLocation
                      : recentJobs[0].latitude != null && recentJobs[0].longitude != null
                      ? { lat: recentJobs[0].latitude, lng: recentJobs[0].longitude }
                      : { lat: 22.9734, lng: 78.6569 } // India center fallback
                  }
                  value={
                    // For now, just highlight first job; future: cluster jobs
                    recentJobs[0].latitude != null && recentJobs[0].longitude != null
                      ? { lat: recentJobs[0].latitude, lng: recentJobs[0].longitude }
                      : undefined
                  }
                  height={200}
                  readOnly
                />
                <p className="text-[11px] sm:text-xs text-slate-400">
                  This map uses your current device location (if allowed) plus today&apos;s jobs to give you a quick spatial view.
                </p>
              </div>
            )}
          </div>

          {/* Performance tips card */}
          <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-main to-primary-dark text-white p-4 sm:p-5 lg:p-6 border-2 border-primary-light/30 shadow-xl shadow-primary-main/20">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              <p className="text-[10px] sm:text-xs uppercase tracking-wide text-blue-100">Performance</p>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mt-1 sm:mt-2">
              Completion Health:{' '}
              {stats.completedJobs > 0
                ? Math.round((stats.completedJobs / (stats.activeJobs + stats.completedJobs)) * 100)
                : 0}
              %
            </h3>
            <div className="mt-3 sm:mt-4 h-2 w-full rounded-full bg-white/30 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    stats.completedJobs > 0
                      ? Math.min(100, (stats.completedJobs / (stats.activeJobs + stats.completedJobs)) * 100)
                      : 0
                  }%`,
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-white"
              />
            </div>
            <ul className="mt-4 sm:mt-5 text-xs sm:text-sm text-blue-100 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                <span>Complete jobs on time to maintain rating.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                <span>Update availability status regularly.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                <span>Check available jobs daily for new opportunities.</span>
              </li>
            </ul>
            <Link
              href="/provider/profile"
              className="mt-3 sm:mt-4 inline-block text-[10px] sm:text-xs text-blue-100 hover:text-white underline transition-colors"
            >
              Update profile →
            </Link>
          </div>
        </motion.aside>
      </section>
    </div>
  )
}
