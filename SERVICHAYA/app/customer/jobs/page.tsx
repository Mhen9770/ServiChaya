'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Calendar, CircleDollarSign, Clock3, MapPin, Plus, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getCurrentUser } from '@/lib/auth'
import { getCustomerJobs, type JobDto } from '@/lib/services/job'
import Pagination from '@/components/ui/Pagination'
import FilterBar from '@/components/ui/FilterBar'
import Loader from '@/components/ui/Loader'

export default function CustomerJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobDto[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(8)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [filters, setFilters] = useState<Record<string, any>>({ status: 'ALL' })
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login?redirect=/customer/jobs')
      return
    }
    fetchJobs(currentUser.userId)
  }, [router, currentPage, pageSize, filters, sortBy, sortDir])

  const fetchJobs = useCallback(async (customerId: number) => {
    try {
      setLoading(true)
      const result = await getCustomerJobs(customerId, currentPage, pageSize, filters.status, sortBy, sortDir)
      setJobs(result.content || [])
      setTotalPages(result.totalPages || 0)
      setTotalElements(result.totalElements || 0)
    } catch (error) {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, filters, sortBy, sortDir])

  const filteredJobs = useMemo(() => {
    if (!search.trim()) return jobs
    const term = search.toLowerCase()
    return jobs.filter((job) => [job.title, job.description, job.jobCode].filter(Boolean).join(' ').toLowerCase().includes(term))
  }, [jobs, search])

  const statusPill = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      MATCHED: 'bg-blue-100 text-blue-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-emerald-100 text-emerald-700',
      CANCELLED: 'bg-red-100 text-red-700',
    }
    return map[status] || 'bg-neutral-background text-neutral-textSecondary'
  }

  if (loading) return <Loader fullScreen text="Loading customer jobs..." />

  return (
    <div className="px-6 py-6 space-y-6">
      <motion.section initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-neutral-border p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Service Requests</h1>
            <p className="text-sm text-neutral-textSecondary mt-1">Monitor every request, stage and payment in one place.</p>
          </div>
          <Link href="/customer/jobs/create" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-main to-primary-dark text-white font-semibold">
            <Plus className="w-4 h-4" /> Create Job
          </Link>
        </div>

        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-neutral-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title, description or code"
            className="w-full rounded-xl border border-neutral-border pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-main/30"
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
        ]}
        onFilterChange={(newFilters) => {
          setFilters(newFilters)
          setCurrentPage(0)
        }}
        initialFilters={filters}
        sortOptions={[
          { key: 'createdAt', label: 'Created Date' },
          { key: 'preferredTime', label: 'Preferred Time' },
          { key: 'estimatedBudget', label: 'Budget' },
        ]}
        currentSortBy={sortBy}
        currentSortDir={sortDir}
        onSortChange={(key, dir) => {
          setSortBy(key)
          setSortDir(dir)
        }}
      />

      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-border p-10 text-center text-sm text-neutral-textSecondary">
          No jobs matched. Try a different filter or create a new service request.
        </div>
      ) : (
        <section className="grid lg:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <Link key={job.id} href={`/customer/jobs/${job.id}`} className="block bg-white border border-neutral-border rounded-2xl p-5 hover:border-primary-main/40 hover:shadow-sm transition">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-neutral-textPrimary">{job.title}</p>
                  <p className="text-xs text-neutral-textSecondary mt-1">{job.jobCode}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusPill(job.status)}`}>{job.status}</span>
              </div>

              <p className="text-sm text-neutral-textSecondary mt-3 line-clamp-2">{job.description}</p>

              <div className="mt-4 grid sm:grid-cols-2 gap-2 text-xs text-neutral-textSecondary">
                <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(job.createdAt).toLocaleDateString()}</span>
                <span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" />{new Date(job.preferredTime).toLocaleString()}</span>
                <span className="inline-flex items-center gap-1"><CircleDollarSign className="w-3.5 h-3.5" />₹{(job.finalPrice || job.estimatedBudget || 0).toLocaleString()}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.addressLine1}</span>
              </div>
            </Link>
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
          onPageSizeChange={(size) => {
            setPageSize(size)
            setCurrentPage(0)
          }}
        />
      </div>
    </div>
  )
}
