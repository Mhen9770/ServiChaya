'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getProviderJobs, type JobDto } from '@/lib/services/job'
import { getOnboardingStatus } from '@/lib/services/provider'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import Pagination from '@/components/ui/Pagination'
import FilterBar from '@/components/ui/FilterBar'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Briefcase, Calendar, MapPin, DollarSign, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ProviderJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [filters, setFilters] = useState<Record<string, any>>({
    status: 'ALL'
  })
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const fetchJobs = useCallback(async (providerId: number) => {
    try {
      setLoading(true)
      const result = await getProviderJobs(
        providerId, 
        currentPage, 
        pageSize,
        filters.status,
        sortBy,
        sortDir
      )
      setJobs(result.content || [])
      setTotalPages(result.totalPages || 0)
      setTotalElements(result.totalElements || 0)
    } catch (error: any) {
      console.error('Failed to fetch jobs:', error)
      const errorMsg = error.response?.data?.message || 'Failed to load jobs'
      toast.error(errorMsg)
      setJobs([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, filters, sortBy, sortDir])

  const checkProviderStatus = async (userId: number) => {
    try {
      const status = await getOnboardingStatus(userId)
      if (!status.onboardingCompleted || status.profileStatus !== 'ACTIVE') {
        if (status.profileStatus === 'PENDING_VERIFICATION') {
          toast('Your profile is pending verification', {
            icon: 'ℹ️',
            duration: 4000
          })
        } else {
          router.push('/provider/onboarding')
        }
        return
      }
      if (status.providerId) {
        fetchJobs(status.providerId)
      }
    } catch (error: any) {
      console.error('Failed to check provider status:', error)
      const errorMsg = error.response?.data?.message || 'Failed to verify provider status'
      toast.error(errorMsg)
      router.push('/provider/onboarding')
    }
  }

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login?redirect=/provider/jobs')
      return
    }
    checkProviderStatus(currentUser.userId)
  }, [router])

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      getOnboardingStatus(currentUser.userId).then(status => {
        if (status.providerId) {
          fetchJobs(status.providerId)
        }
      }).catch(() => {
        // Error handled in checkProviderStatus
      })
    }
  }, [currentPage, pageSize, filters, sortBy, sortDir, fetchJobs])

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
    return <Loader fullScreen text="Loading your jobs..." />
  }

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
    setCurrentPage(0)
  }

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortBy(key)
    setSortDir(direction)
    setCurrentPage(0)
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark text-white p-5 sm:p-6 lg:p-7 border-2 border-slate-700/50 shadow-xl shadow-slate-950/50"
      >
        <p className="text-xs uppercase tracking-wide text-slate-300">Job Management</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2">My Jobs</h1>
        <p className="text-sm text-slate-300 mt-2">Manage your accepted jobs and track their progress</p>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <FilterBar
          filters={[
            {
              key: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { value: 'ALL', label: 'All Status' },
                { value: 'ACCEPTED', label: 'Accepted' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' }
              ]
            },
            {
              key: 'dateRange',
              label: 'Created Date',
              type: 'daterange'
            },
            {
              key: 'budgetRange',
              label: 'Budget Range (₹)',
              type: 'range',
              min: 0,
              max: 100000,
              step: 100,
              placeholder: 'Amount'
            }
          ]}
          onFilterChange={handleFilterChange}
          initialFilters={filters}
          sortOptions={[
            { key: 'createdAt', label: 'Created Date' },
            { key: 'preferredTime', label: 'Preferred Time' },
            { key: 'estimatedBudget', label: 'Budget' },
            { key: 'status', label: 'Status' }
          ]}
          currentSortBy={sortBy}
          currentSortDir={sortDir}
          onSortChange={handleSort}
        />
      </motion.div>

      {loading ? (
        <div className="grid gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl sm:rounded-2xl glass-dark border-2 border-white/20 p-6 sm:p-8 text-center backdrop-blur-md shadow-lg shadow-black/20"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-white mb-1 sm:mb-2">No jobs yet</p>
          <p className="text-[10px] sm:text-xs text-slate-300 mb-4 sm:mb-5 px-4">You'll see jobs here once you accept them from available jobs</p>
          <Link
            href="/provider/jobs/available"
            className="inline-flex items-center gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold hover:shadow-lg hover:shadow-primary-main/50 transition-all"
          >
            View Available Jobs
          </Link>
        </motion.div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {jobs.map((job, index) => {
            const statusColors = {
              'COMPLETED': { border: 'border-emerald-400/40', bg: 'bg-emerald-500/5', bar: 'bg-emerald-400' },
              'IN_PROGRESS': { border: 'border-primary-main/40', bg: 'bg-primary-main/5', bar: 'bg-primary-main' },
              'ACCEPTED': { border: 'border-primary-main/40', bg: 'bg-primary-main/5', bar: 'bg-primary-main' },
              'MATCHED': { border: 'border-indigo-400/40', bg: 'bg-indigo-500/5', bar: 'bg-indigo-400' },
              'PENDING': { border: 'border-amber-400/40', bg: 'bg-amber-500/5', bar: 'bg-amber-400' },
            }
            const colors = statusColors[job.status as keyof typeof statusColors] || { border: 'border-slate-400/40', bg: 'bg-slate-500/5', bar: 'bg-slate-400' }
            return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01, x: 3 }}
            >
              <Link
                href={`/provider/jobs/${job.id}`}
                className={`block rounded-lg sm:rounded-xl border-2 ${colors.border} glass p-4 sm:p-5 hover:border-primary-main/70 hover:${colors.bg} hover:shadow-lg hover:shadow-primary-main/10 transition-all group relative overflow-hidden backdrop-blur-md`}
              >
                {/* Status indicator bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.bar}`} />
                
                  <div className="flex items-start justify-between gap-2 sm:gap-3 pl-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-primary-light transition-colors line-clamp-1">{job.title}</h3>
                        <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold border ${
                          job.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/60' :
                          job.status === 'IN_PROGRESS' || job.status === 'ACCEPTED' ? 'bg-primary-main/15 text-primary-light border-primary-main/60' :
                          job.status === 'MATCHED' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-400/60' :
                          job.status === 'PENDING' ? 'bg-amber-500/10 text-amber-300 border-amber-400/60' :
                          'bg-slate-600/10 text-slate-200 border-slate-500/60'
                        }`}>
                          {job.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 mb-2 sm:mb-3 line-clamp-2 leading-relaxed">{job.description}</p>
                      <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-slate-300 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                          {new Date(job.preferredTime).toLocaleDateString()}
                        </span>
                        {job.estimatedBudget && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                            ₹{job.estimatedBudget.toLocaleString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1 min-w-0">
                          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                          <span className="truncate max-w-[100px] sm:max-w-[120px]">{job.addressLine1}</span>
                        </span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-400 mt-2">
                        {job.jobCode}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0 ml-2 sm:ml-3 group-hover:text-primary-light group-hover:translate-x-1 transition-all" />
                    </div>
              </Link>
            </motion.div>
            )
          })}
        </div>
      )}

      {jobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-3 sm:mt-4"
        >
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </motion.div>
      )}
    </div>
  )
}
