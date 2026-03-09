'use client'

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Calendar, CircleDollarSign, Clock3, MapPin, Plus, Search, ArrowRight, CheckCircle2, Loader2, CreditCard, AlertCircle, User } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getCurrentUser } from '@/lib/auth'
import { getCustomerJobs, type JobDto } from '@/lib/services/job'
import FilterBar from '@/components/ui/FilterBar'
import Pagination from '@/components/ui/Pagination'
import { PageLoader, ContentLoader, ButtonLoader } from '@/components/ui/Loader'

function CustomerJobsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<JobDto[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(8)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [filters, setFilters] = useState<Record<string, any>>({ status: searchParams.get('status') || 'ALL' })
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push('/login?redirect=/customer/jobs')
      return
    }
    fetchJobs(user.userId)
  }, [router, page, size, filters, sortBy, sortDir])

  const fetchJobs = useCallback(async (customerId: number) => {
    try {
      setLoading(true)
      const filterParams = {
        isEmergency: filters.isEmergency === 'true' ? true : filters.isEmergency === 'false' ? false : undefined,
        dateFrom: filters.dateRange?.from ? `${filters.dateRange.from}T00:00:00` : undefined,
        dateTo: filters.dateRange?.to ? `${filters.dateRange.to}T23:59:59` : undefined,
        budgetMin: filters.budgetRange?.min,
        budgetMax: filters.budgetRange?.max,
      }
      const result = await getCustomerJobs(customerId, page, size, filters.status, sortBy, sortDir, filterParams)
      setJobs(result.content || [])
      setTotalPages(result.totalPages || 0)
      setTotalElements(result.totalElements || 0)
    } catch {
      toast.error('Failed to load your service requests')
    } finally {
      setLoading(false)
    }
  }, [page, size, filters, sortBy, sortDir])

  const visibleJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs
    const q = searchQuery.toLowerCase()
    return jobs.filter((job) => [job.title, job.description, job.jobCode, job.addressLine1].join(' ').toLowerCase().includes(q))
  }, [jobs, searchQuery])

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-300 border-amber-400/60'
      case 'MATCHED':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-400/60'
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        return 'bg-primary-main/15 text-primary-light border-primary-main/60'
      case 'COMPLETED':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/60'
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-300 border-red-400/60'
      default:
        return 'bg-slate-600/10 text-slate-200 border-slate-500/60'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return Clock3
      case 'MATCHED':
        return User
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        return Loader2
      case 'PENDING_FOR_PAYMENT':
      case 'PAYMENT_PENDING':
        return CreditCard
      case 'COMPLETED':
        return CheckCircle2
      case 'CANCELLED':
        return AlertCircle
      default:
        return Clock3
    }
  }

  const getStatusHint = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Waiting for provider match'
      case 'MATCHED':
        return 'Provider assigned, awaiting acceptance'
      case 'PENDING_FOR_PAYMENT':
        return 'Upfront payment required'
      case 'ACCEPTED':
        return 'Provider accepted, work starting soon'
      case 'IN_PROGRESS':
        return 'Service in progress'
      case 'PAYMENT_PENDING':
        return 'Final payment due'
      case 'COMPLETED':
        return 'Job completed successfully'
      default:
        return null
    }
  }

  if (loading) return <PageLoader text="Loading your requests..." />

  return (
    <div className="min-h-full bg-[#010B2A]">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 lg:space-y-6">
        <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark text-white border border-slate-800/80 p-5 sm:p-7 shadow-lg shadow-slate-950/40"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-300">Service Management</p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-2">My Service Requests</h1>
            <p className="text-sm text-slate-300 mt-2">Use this board to monitor status, budget and schedule of all customer requests.</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/customer/jobs/create" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:shadow-lg transition-all">
              <Plus className="w-4 h-4" /> New request
            </Link>
          </motion.div>
        </div>

        <div className="relative mt-5">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, job code, or address"
            className="w-full rounded-xl bg-white/10 border border-white/20 pl-9 pr-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
          />
        </div>
      </motion.section>

      {/* Filters card */}
      <section className="rounded-2xl glass-dark border border-white/10 shadow-md shadow-slate-950/30 p-3 sm:p-4 lg:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Filters &amp; Sort
          </p>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>Refine to find the right request faster</span>
          </div>
        </div>
        <FilterBar
        filters={[
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'ALL', label: 'All Status' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'MATCHED', label: 'Matched' },
              { value: 'ACCEPTED', label: 'Accepted' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ],
          },
          {
            key: 'isEmergency',
            label: 'Emergency',
            type: 'select',
            options: [
              { value: '', label: 'All' },
              { value: 'true', label: 'Emergency Only' },
              { value: 'false', label: 'Regular Only' },
            ],
          },
          {
            key: 'dateRange',
            label: 'Created Date',
            type: 'daterange',
          },
          {
            key: 'budgetRange',
            label: 'Budget Range (₹)',
            type: 'range',
            min: 0,
            max: 100000,
            step: 100,
            placeholder: 'Amount',
          },
        ]}
        onFilterChange={(nextFilters) => {
          setFilters(nextFilters)
          setPage(0)
        }}
        initialFilters={filters}
        sortOptions={[
          { key: 'createdAt', label: 'Created Date' },
          { key: 'preferredTime', label: 'Preferred Time' },
          { key: 'estimatedBudget', label: 'Budget' },
        ]}
        currentSortBy={sortBy}
        currentSortDir={sortDir}
        onSortChange={(key, direction) => {
          setSortBy(key)
          setSortDir(direction)
          setPage(0)
        }}
      />
      </section>

      {visibleJobs.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl glass-dark border border-white/10 p-12 text-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary-main/10 flex items-center justify-center"
          >
            <Search className="w-10 h-10 text-primary-light opacity-60" />
          </motion.div>
          <h3 className="text-lg font-bold text-white mb-2">No requests found</h3>
          {searchQuery.trim() || filters.status !== 'ALL' || Object.keys(filters).some(k => k !== 'status' && filters[k]) ? (
            <>
              <p className="text-sm text-slate-300 mb-1">No requests match your current filters or search.</p>
              <p className="text-xs text-slate-400 mb-6">Try adjusting your search query or filter criteria.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSearchQuery('')
                    setFilters({ status: 'ALL' })
                  }}
                  className="px-4 py-2 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  Clear filters
                </motion.button>
                <Link href="/customer/jobs/create" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 py-2 text-sm font-semibold hover:shadow-lg hover:shadow-primary-main/50 transition-all">
                  <Plus className="w-4 h-4" /> Create new request
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-300 mb-1">You haven't created any service requests yet.</p>
              <p className="text-xs text-slate-400 mb-6">Get started by booking your first service.</p>
              <Link href="/customer/jobs/create" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-6 py-3 text-sm font-semibold hover:shadow-lg hover:shadow-primary-main/50 transition-all">
                <Plus className="w-4 h-4" /> Create your first request
              </Link>
            </>
          )}
        </motion.div>
      ) : (
        <section className="grid md:grid-cols-2 gap-4">
          {visibleJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <Link
                href={`/customer/jobs/${job.id}`}
                className="block rounded-2xl glass-dark border border-white/5 p-5 lg:p-6 hover:border-primary-main/60 hover:shadow-xl hover:shadow-primary-main/25 transition-all group relative overflow-hidden"
              >
                {/* top accent bar */}
                <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary-main/0 via-primary-main/60 to-primary-main/0 opacity-60 group-hover:opacity-100 transition-opacity" />

                <div className="flex flex-col gap-3">
                  {/* Title + status row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white group-hover:text-primary-light transition-colors line-clamp-1">
                        {job.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Code: <span className="text-slate-200/80">{job.jobCode}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`text-[11px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap border inline-flex items-center gap-1 ${getStatusClasses(
                          job.status,
                        )}`}
                      >
                        {(() => {
                          const StatusIcon = getStatusIcon(job.status)
                          return (
                            <>
                              <StatusIcon className="w-3 h-3" />
                              {job.status.replace('_', ' ')}
                            </>
                          )
                        })()}
                      </span>
                      <p className="text-[11px] text-slate-400 font-medium">
                        ₹{(job.finalPrice || job.estimatedBudget || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-300/95 line-clamp-2">
                    {job.description || 'No additional description added for this request.'}
                  </p>

                  {/* Meta grid */}
                  <div className="mt-1 grid gap-2 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-300/80" />
                      <span className="font-medium text-slate-200/90">Created</span>
                      <span>· {new Date(job.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="w-3.5 h-3.5 text-slate-300/80" />
                      <span className="font-medium text-slate-200/90">Preferred</span>
                      <span>· {new Date(job.preferredTime).toLocaleString()}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-300/80" />
                      <span className="truncate">{job.addressLine1}</span>
                    </span>
                  </div>

                  {/* Status hint */}
                  {getStatusHint(job.status) && (
                    <div className="mt-2 px-3 py-1.5 rounded-lg bg-primary-main/10 border border-primary-main/20">
                      <p className="text-xs text-primary-light font-medium inline-flex items-center gap-1.5">
                        <Clock3 className="w-3 h-3" />
                        {getStatusHint(job.status)}
                      </p>
                    </div>
                  )}

                  {/* Footer row */}
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      View details
                    </span>
                    <ArrowRight className="w-4 h-4 text-primary-light opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </section>
      )}

      <div className="rounded-2xl glass-dark border border-white/10 p-3 sm:p-4 backdrop-blur-md">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={size}
          onPageChange={setPage}
          onPageSizeChange={(nextSize) => {
            setSize(nextSize)
            setPage(0)
          }}
        />
      </div>
      </div>
    </div>
  )
}

export default function CustomerJobsPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading jobs..." />}>
      <CustomerJobsPageContent />
    </Suspense>
  )
}
