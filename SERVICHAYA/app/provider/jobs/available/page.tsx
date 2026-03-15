'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getAvailableJobsForProvider, acceptJob, type ProviderMatchDto } from '@/lib/services/matching'
import { getOnboardingStatus } from '@/lib/services/provider'
import { toast } from 'react-hot-toast'
import { PageLoader, ContentLoader, ButtonLoader } from '@/components/ui/Loader'
import { RefreshCw, ClipboardList, AlertCircle, Calendar, DollarSign, MapPin, CheckCircle2, Eye, TrendingUp, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AvailableJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<ProviderMatchDto[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<number | null>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login?redirect=/provider/jobs/available')
      return
    }
    checkProviderStatus(currentUser.userId)
  }, [router])

  const checkProviderStatus = async (userId: number) => {
    try {
      const status = await getOnboardingStatus(userId)
      if (!status.onboardingCompleted || status.profileStatus !== 'ACTIVE') {
        if (status.profileStatus === 'PENDING_VERIFICATION') {
          toast('Your profile is pending verification. You cannot accept jobs yet.', {
            icon: 'ℹ️',
            duration: 4000
          })
        } else {
          router.push('/provider/onboarding')
        }
        return
      }
      if (status.providerId) {
        fetchAvailableJobs(status.providerId)
      } else {
        toast.error('Provider ID not found')
      }
    } catch (error: any) {
      console.error('Failed to check provider status:', error)
      const errorMsg = error.response?.data?.message || 'Failed to verify provider status'
      toast.error(errorMsg)
      router.push('/provider/onboarding')
    }
  }

  const fetchAvailableJobs = async (providerId: number) => {
    try {
      setLoading(true)
      const availableJobs = await getAvailableJobsForProvider(providerId)
      setJobs(availableJobs || [])
    } catch (error: any) {
      console.error('Failed to fetch available jobs:', error)
      const errorMsg = error.response?.data?.message || 'Failed to load available jobs'
      toast.error(errorMsg)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptJob = async (matchId: number) => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      toast.error('Please login first')
      router.push('/login?redirect=/provider/jobs/available')
      return
    }

    try {
      setAccepting(matchId)
      await acceptJob(matchId, currentUser.userId)
      toast.success('Job accepted successfully!')
      // Refresh the list
      const status = await getOnboardingStatus(currentUser.userId)
      if (status.providerId) {
        await fetchAvailableJobs(status.providerId)
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to accept job. Please try again.'
      toast.error(errorMsg)
      console.error('Accept job error:', error)
    } finally {
      setAccepting(null)
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-accent-green'
    if (score >= 60) return 'text-primary-main'
    return 'text-accent-orange'
  }

  if (loading) {
    return <PageLoader text="Loading available jobs..." />
  }

  const currentUser = getCurrentUser()

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark text-white p-5 sm:p-6 lg:p-7 border-2 border-slate-700/50 shadow-xl shadow-slate-950/50"
      >
        <div className="flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-300">Job Opportunities</p>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2 sm:mt-3 leading-tight">Available Jobs</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 sm:mt-3 leading-relaxed">Accept jobs that match your skills and location</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              if (currentUser) {
                try {
                  setLoading(true)
                  const status = await getOnboardingStatus(currentUser.userId)
                  if (status.providerId) {
                    await fetchAvailableJobs(status.providerId)
                  }
                } catch (error) {
                  console.error('Failed to refresh:', error)
                } finally {
                  setLoading(false)
                }
              }
            }}
            disabled={loading}
            className="rounded-lg sm:rounded-xl border-2 border-white/30 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold hover:bg-white/10 hover:border-white/50 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </motion.button>
        </div>
      </motion.section>

      {jobs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-xl sm:rounded-2xl glass-dark border-2 border-white/20 p-6 sm:p-8 text-center backdrop-blur-md shadow-lg shadow-black/20"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-white mb-1 sm:mb-2">No available jobs</p>
          <p className="text-[10px] sm:text-xs text-slate-300 mb-4 sm:mb-5 px-4">New jobs matching your profile will appear here</p>
          <Link
            href="/provider/dashboard"
            className="inline-flex items-center gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold hover:shadow-lg hover:shadow-primary-main/50 transition-all"
          >
            Go to Dashboard
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid gap-3 sm:gap-4"
        >
          {jobs.map((match, index) => {
            const matchScoreColor = match.matchScore >= 80 ? 'border-accent-green/50 bg-accent-green/5' :
                                   match.matchScore >= 60 ? 'border-primary-main/50 bg-primary-main/5' :
                                   'border-accent-orange/50 bg-accent-orange/5'
            const barColor = match.matchScore >= 80 ? 'bg-accent-green' :
                           match.matchScore >= 60 ? 'bg-primary-main' :
                           'bg-accent-orange'
            return (
            <motion.div
              key={match.matchId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className={`rounded-xl sm:rounded-2xl glass-dark border-2 ${matchScoreColor} p-4 sm:p-5 hover:border-primary-main/70 hover:shadow-xl hover:shadow-primary-main/20 transition-all relative overflow-hidden group backdrop-blur-md`}
            >
              {/* Match score indicator bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`} />
              
              <div className="mb-3 sm:mb-4 pl-2">
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-primary-light transition-colors line-clamp-1">{match.job.title}</h3>
                      <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold border ${
                        match.matchScore >= 80 
                          ? 'bg-accent-green/20 text-accent-green border-accent-green/50' 
                          : match.matchScore >= 60
                          ? 'bg-primary-main/20 text-primary-light border-primary-main/50'
                          : 'bg-accent-orange/20 text-accent-orange border-accent-orange/50'
                      }`}>
                        {match.matchScore.toFixed(0)}% Match
                      </span>
                      {match.job.isEmergency && (
                        <span className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-red-500/20 text-red-300 border border-red-400/50 rounded-full text-[9px] sm:text-xs font-semibold animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          Emergency
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mb-2 sm:mb-3 line-clamp-2 leading-relaxed">{match.job.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-2 sm:mb-3 p-2 sm:p-3 bg-slate-800/50 rounded-lg sm:rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="w-4 h-4 text-primary-light" />
                    <div>
                      <div className="text-slate-400">Preferred Time</div>
                      <div className="font-semibold text-white">{new Date(match.job.preferredTime).toLocaleDateString()}</div>
                    </div>
                  </div>
                  {match.job.estimatedBudget && (
                    <div className="flex items-center gap-2 text-xs">
                      <DollarSign className="w-4 h-4 text-accent-green" />
                      <div>
                        <div className="text-slate-400">Budget</div>
                        <div className="font-semibold text-accent-green">₹{match.job.estimatedBudget.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin className="w-4 h-4 text-primary-light" />
                    <div>
                      <div className="text-slate-400">Location</div>
                      <div className="font-semibold text-white truncate max-w-[120px]">{match.job.addressLine1}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] sm:text-xs pt-2 sm:pt-3 border-t border-white/10 flex-wrap gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="text-slate-400">Job Code: <span className="font-semibold text-white">{match.job.jobCode}</span></span>
                    {match.rankOrder && (
                      <span className="flex items-center gap-1 px-2 py-0.5 sm:py-1 bg-primary-main/20 text-primary-light border border-primary-main/50 rounded-full text-[9px] sm:text-xs font-semibold">
                        <TrendingUp className="w-3 h-3" />
                        Rank #{match.rankOrder}
                      </span>
                    )}
                  </div>
                  {match.notifiedAt && (() => {
                    const notifiedTime = new Date(match.notifiedAt).getTime()
                    const currentTime = Date.now()
                    const elapsedSeconds = Math.floor((currentTime - notifiedTime) / 1000)
                    const timeoutSeconds = 120 // From business rule PROVIDER_RESPONSE_TIMEOUT_SECONDS
                    const remainingSeconds = Math.max(0, timeoutSeconds - elapsedSeconds)
                    const isExpiringSoon = remainingSeconds < 60 && remainingSeconds > 0
                    const isExpired = remainingSeconds === 0
                    
                    return (
                      <div className={`flex items-center gap-1 ${isExpired ? 'text-red-400' : isExpiringSoon ? 'text-accent-orange' : 'text-slate-400'}`}>
                        <Clock className="w-3 h-3" />
                        {isExpired ? (
                          <span className="font-semibold">Expired</span>
                        ) : isExpiringSoon ? (
                          <span className="font-semibold">Expires in {Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s</span>
                        ) : (
                          <span>Notified {new Date(match.notifiedAt).toLocaleTimeString()}</span>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 pt-3 sm:pt-4 border-t border-white/10">
                <motion.button
                  whileHover={{ scale: accepting !== match.matchId && match.status !== 'ACCEPTED' ? 1.02 : 1 }}
                  whileTap={{ scale: accepting !== match.matchId && match.status !== 'ACCEPTED' ? 0.98 : 1 }}
                  onClick={() => handleAcceptJob(match.matchId)}
                  disabled={accepting === match.matchId || match.status === 'ACCEPTED'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-accent-green to-green-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold hover:shadow-lg hover:shadow-accent-green/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {accepting === match.matchId ? (
                    <>
                      <ButtonLoader />
                      <span className="hidden sm:inline">Accepting...</span>
                      <span className="sm:hidden">Accepting</span>
                    </>
                  ) : match.status === 'ACCEPTED' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Accepted
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Accept Job</span>
                      <span className="sm:hidden">Accept</span>
                    </>
                  )}
                </motion.button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={`/provider/jobs/${match.jobId}`}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-lg sm:rounded-xl border-2 border-white/30 text-white text-xs sm:text-sm font-semibold hover:bg-white/10 hover:border-white/50 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Details</span>
                    <span className="sm:hidden">View</span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
