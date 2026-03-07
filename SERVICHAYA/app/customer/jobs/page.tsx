'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Calendar, CircleDollarSign, Clock3, MapPin, Plus, Search, ArrowRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getCurrentUser } from '@/lib/auth'
import { getCustomerJobs, type JobDto } from '@/lib/services/job'
import FilterBar from '@/components/ui/FilterBar'
import Pagination from '@/components/ui/Pagination'
import Loader from '@/components/ui/Loader'

export default function CustomerJobsPage() {
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

  if (loading) return <Loader fullScreen text="Loading your requests..." />

  return (
    <div className="px-6 py-6 space-y-6">
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark text-white border border-slate-800 p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-300">Service Management</p>
            <h1 className="text-3xl font-bold mt-2">My Service Requests</h1>
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

      {visibleJobs.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl glass-dark border border-white/10 p-10 text-center"
        >
          <Search className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-50" />
          <p className="text-sm font-semibold text-white mb-1">No requests matched your filters</p>
          <p className="text-sm text-slate-300 mb-4">Try changing status or search query.</p>
          <Link href="/customer/jobs/create" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 py-2 text-sm font-semibold hover:shadow-lg hover:shadow-primary-main/50 transition-all">
            <Plus className="w-4 h-4" /> Create new request
          </Link>
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
              <Link href={`/customer/jobs/${job.id}`} className="block rounded-2xl glass-dark border border-white/10 p-5 hover:border-primary-main/50 hover:shadow-lg hover:shadow-primary-main/20 transition-all group">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex-1">
                    <p className="font-semibold text-white group-hover:text-primary-light transition-colors">{job.title}</p>
                    <p className="text-xs text-slate-300 mt-1">Code: {job.jobCode}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-primary-main/20 text-primary-light whitespace-nowrap border border-primary-main/30">{job.status}</span>
                </div>

                <p className="text-sm text-slate-300 mt-3 line-clamp-2">{job.description}</p>
                <div className="mt-4 grid gap-2 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Created: {new Date(job.createdAt).toLocaleDateString()}</span>
                  <span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> Preferred: {new Date(job.preferredTime).toLocaleString()}</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.addressLine1}</span>
                  <span className="inline-flex items-center gap-1"><CircleDollarSign className="w-3.5 h-3.5" /> ₹{(job.finalPrice || job.estimatedBudget || 0).toLocaleString()}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-300">View details</span>
                  <ArrowRight className="w-4 h-4 text-primary-light opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </section>
      )}

      <div className="rounded-2xl glass-dark border border-white/10 p-3">
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
  )
}
