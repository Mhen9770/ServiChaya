'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getAvailableJobsForProvider, acceptJob, type ProviderMatchDto } from '@/lib/services/matching'
import { getOnboardingStatus } from '@/lib/services/provider'
import { toast } from 'react-hot-toast'
import {PageLoader ,Loader, ContentLoader, ButtonLoader} from '@/components/ui/Loader'
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
    <div className="px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">Available Jobs</h1>
          <p className="text-sm text-neutral-textSecondary mt-1">Accept jobs that match your skills and location</p>
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
          className="flex items-center gap-2 px-4 py-2 bg-neutral-background text-neutral-textSecondary rounded-xl text-sm font-semibold hover:bg-neutral-border transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </motion.div>

      {jobs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-border text-center"
        >
          <div className="w-16 h-16 bg-neutral-background rounded-full flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-8 h-8 text-neutral-textSecondary" />
          </div>
          <p className="text-sm font-semibold text-neutral-textPrimary mb-1">No available jobs</p>
          <p className="text-xs text-neutral-textSecondary mb-4">New jobs matching your profile will appear here</p>
          <Link
            href="/provider/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl text-sm font-semibold hover:shadow-md transition-all"
          >
            Go to Dashboard
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid gap-4"
        >
          {jobs.map((match, index) => (
            <motion.div
              key={match.matchId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.01, y: -2 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border hover:shadow-md hover:border-primary-main/30 transition-all"
            >
              <div className="mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold text-neutral-textPrimary">{match.job.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        match.matchScore >= 80 
                          ? 'bg-accent-green/20 text-accent-green border border-accent-green/30' 
                          : match.matchScore >= 60
                          ? 'bg-primary-main/20 text-primary-main border border-primary-main/30'
                          : 'bg-accent-orange/20 text-accent-orange border border-accent-orange/30'
                      }`}>
                        {match.matchScore.toFixed(0)}% Match
                      </span>
                      {match.job.isEmergency && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          Emergency
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-textSecondary mb-3 line-clamp-2">{match.job.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3 p-3 bg-neutral-background rounded-xl">
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="w-4 h-4 text-primary-main" />
                    <div>
                      <div className="text-neutral-textSecondary">Preferred Time</div>
                      <div className="font-semibold text-neutral-textPrimary">{new Date(match.job.preferredTime).toLocaleDateString()}</div>
                    </div>
                  </div>
                  {match.job.estimatedBudget && (
                    <div className="flex items-center gap-2 text-xs">
                      <DollarSign className="w-4 h-4 text-accent-green" />
                      <div>
                        <div className="text-neutral-textSecondary">Budget</div>
                        <div className="font-semibold text-accent-green">₹{match.job.estimatedBudget.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin className="w-4 h-4 text-primary-main" />
                    <div>
                      <div className="text-neutral-textSecondary">Location</div>
                      <div className="font-semibold text-neutral-textPrimary truncate max-w-[120px]">{match.job.addressLine1}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-neutral-border">
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-textSecondary">Job Code: <span className="font-semibold text-neutral-textPrimary">{match.job.jobCode}</span></span>
                    {match.rankOrder && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-primary-main/10 text-primary-main rounded-full font-semibold">
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
                      <div className={`flex items-center gap-1 ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-accent-orange' : 'text-neutral-textSecondary'}`}>
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
              <div className="flex gap-2 pt-4 border-t border-neutral-border">
                <motion.button
                  whileHover={{ scale: accepting !== match.matchId && match.status !== 'ACCEPTED' ? 1.02 : 1 }}
                  whileTap={{ scale: accepting !== match.matchId && match.status !== 'ACCEPTED' ? 0.98 : 1 }}
                  onClick={() => handleAcceptJob(match.matchId)}
                  disabled={accepting === match.matchId || match.status === 'ACCEPTED'}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-accent-green to-green-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {accepting === match.matchId ? (
                    <>
                      <ButtonLoader />
                      Accepting...
                    </>
                  ) : match.status === 'ACCEPTED' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Accepted
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Accept Job
                    </>
                  )}
                </motion.button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={`/provider/jobs/${match.jobId}`}
                    className="flex items-center gap-2 px-4 py-2.5 bg-neutral-background text-neutral-textSecondary rounded-xl text-sm font-semibold hover:bg-neutral-border transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    Details
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
