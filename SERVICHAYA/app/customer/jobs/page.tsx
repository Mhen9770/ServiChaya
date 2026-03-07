'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getCustomerJobs, type JobDto } from '@/lib/services/job'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import Pagination from '@/components/ui/Pagination'
import FilterBar from '@/components/ui/FilterBar'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Plus, ClipboardList, Calendar, MapPin, DollarSign, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CustomerJobsPage() {
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
      const result = await getCustomerJobs(
        customerId, 
        currentPage, 
        pageSize, 
        filters.status,
        sortBy,
        sortDir
      )
      setJobs(result.content)
      setTotalPages(result.totalPages)
      setTotalElements(result.totalElements)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, filters, sortBy, sortDir])

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
    <div className="px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">My Jobs</h1>
          <p className="text-sm text-neutral-textSecondary mt-1">Track all your service requests</p>
        </div>
        <Link
          href="/customer/jobs/create"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl text-sm font-semibold hover:shadow-md hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Job
        </Link>
      </motion.div>

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
                { value: 'PENDING', label: 'Pending' },
                { value: 'MATCHED', label: 'Matched' },
                { value: 'ACCEPTED', label: 'Accepted' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' }
              ]
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
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-border text-center">
          <div className="w-16 h-16 bg-neutral-background rounded-full flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-8 h-8 text-neutral-textSecondary" />
          </div>
          <p className="text-sm font-semibold text-neutral-textPrimary mb-1">No jobs yet</p>
          <p className="text-xs text-neutral-textSecondary mb-4">Create your first service request to get started!</p>
          <Link
            href="/customer/jobs/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl text-sm font-semibold hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Your First Job
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/customer/jobs/${job.id}`}
              className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-border hover:shadow-md hover:border-primary-main/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-lg font-bold text-neutral-textPrimary">{job.title}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-textSecondary mb-3 line-clamp-2">{job.description}</p>
                  <div className="flex items-center gap-4 text-xs text-neutral-textSecondary flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(job.preferredTime).toLocaleDateString()}
                    </span>
                    {job.estimatedBudget && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        ₹{job.estimatedBudget}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.addressLine1.substring(0, 30)}...
                    </span>
                  </div>
                  <div className="text-xs text-neutral-textSecondary mt-2">
                    {job.jobCode}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-textSecondary flex-shrink-0 ml-3" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {jobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-4"
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
