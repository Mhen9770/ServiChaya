'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Calendar, MapPin, Plus, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getCurrentUser } from '@/lib/auth'
import { getCustomerJobs, type JobDto } from '@/lib/services/job'
import FilterBar from '@/components/ui/FilterBar'
import Pagination from '@/components/ui/Pagination'
import Loader from '@/components/ui/Loader'

export default function CustomerJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [filters, setFilters] = useState<Record<string, any>>({ status: 'ALL' })
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push('/login?redirect=/customer/jobs')
      return
    }
    fetchJobs(user.userId)
  }, [router, currentPage, pageSize, filters, sortBy, sortDir])

  const fetchJobs = useCallback(async (userId: number) => {
    try {
      setLoading(true)
      const res = await getCustomerJobs(userId, currentPage, pageSize, filters.status, sortBy, sortDir)
      setJobs(res.content || [])
      setTotalPages(res.totalPages || 0)
      setTotalElements(res.totalElements || 0)
    } catch {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, filters, sortBy, sortDir])

  const visibleJobs = useMemo(() => {
    if (!search.trim()) return jobs
    const term = search.toLowerCase()
    return jobs.filter((job) => `${job.title} ${job.jobCode} ${job.description}`.toLowerCase().includes(term))
  }, [jobs, search])

  const statusClass = (status: string) => ({
    PENDING: 'bg-amber-100 text-amber-700',
    MATCHED: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    IN_PROGRESS: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
  }[status] || 'bg-neutral-background text-neutral-textSecondary')

  if (loading) return <Loader fullScreen text="Loading your service requests..." />

  return (
    <div className="px-6 py-6 space-y-5">
      <section className="bg-white rounded-2xl border border-neutral-border p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Jobs</h1>
            <p className="text-sm text-neutral-textSecondary mt-1">Search, filter, and monitor all requests in a cleaner timeline view.</p>
          </div>
          <Link href="/customer/jobs/create" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-main text-white font-semibold">
            <Plus className="w-4 h-4" /> New Request
          </Link>
        </div>

        <div className="mt-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-textSecondary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, code or details"
            className="w-full rounded-xl border border-neutral-border pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-main/30"
          />
        </div>
      </section>

      <FilterBar
        filters={[{ key: 'status', label: 'Status', type: 'select', options: [
          { value: 'ALL', label: 'All' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'MATCHED', label: 'Matched' },
          { value: 'ACCEPTED', label: 'Accepted' },
          { value: 'IN_PROGRESS', label: 'In Progress' },
          { value: 'COMPLETED', label: 'Completed' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ] }]}
        onFilterChange={(next) => { setFilters(next); setCurrentPage(0) }}
        initialFilters={filters}
        sortOptions={[{ key: 'createdAt', label: 'Created Date' }, { key: 'preferredTime', label: 'Preferred Time' }, { key: 'estimatedBudget', label: 'Budget' }]}
        currentSortBy={sortBy}
        currentSortDir={sortDir}
        onSortChange={(key, dir) => { setSortBy(key); setSortDir(dir) }}
      />

      {visibleJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-border p-12 text-center text-sm text-neutral-textSecondary">No matching jobs found.</div>
      ) : (
        <section className="space-y-3">
          {visibleJobs.map((job) => (
            <article key={job.id} className="bg-white rounded-2xl border border-neutral-border p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-base">{job.title}</h3>
                  <p className="text-xs text-neutral-textSecondary mt-1">{job.jobCode}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(job.status)}`}>{job.status}</span>
              </div>
              <p className="text-sm text-neutral-textSecondary mt-2 line-clamp-2">{job.description}</p>
              <div className="mt-3 text-xs text-neutral-textSecondary grid sm:grid-cols-3 gap-2">
                <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(job.preferredTime).toLocaleString()}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.addressLine1}</span>
                <span>Budget: ₹{(job.finalPrice || job.estimatedBudget || 0).toLocaleString()}</span>
              </div>
              <div className="mt-4">
                <Link href={`/customer/jobs/${job.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary-main">Open details <ArrowRight className="w-4 h-4" /></Link>
              </div>
            </article>
          ))}
        </section>
      )}

      <div className="bg-white rounded-2xl border border-neutral-border p-3">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(0) }}
        />
      </div>
    </div>
  )
}
