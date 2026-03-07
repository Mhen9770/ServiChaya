'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAllJobs, type JobDto } from '@/lib/services/job'
import { getAllJobs as getAllJobsAdmin } from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import Pagination from '@/components/ui/Pagination'
import FilterBar from '@/components/ui/FilterBar'
import DataTable, { Column } from '@/components/ui/DataTable'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { 
  Eye, Calendar, MapPin, DollarSign, AlertCircle, 
  CheckCircle2, Clock, X, ArrowUpDown
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminJobsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [jobs, setJobs] = useState<JobDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [filters, setFilters] = useState<Record<string, any>>({
    status: searchParams.get('status') || 'ALL',
    cityId: searchParams.get('cityId') || undefined
  })
  const [sortKey, setSortKey] = useState<string>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchJobs()
  }, [currentPage, pageSize, filters, sortKey, sortDirection])

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getAllJobsAdmin(
        filters.status,
        filters.cityId ? Number(filters.cityId) : undefined,
        currentPage,
        pageSize,
        sortKey,
        sortDirection
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
  }, [currentPage, pageSize, filters, sortKey, sortDirection])

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
    setCurrentPage(0)
    const params = new URLSearchParams()
    if (newFilters.status && newFilters.status !== 'ALL') params.set('status', newFilters.status)
    if (newFilters.cityId) params.set('cityId', newFilters.cityId.toString())
    router.push(`/admin/jobs?${params.toString()}`)
  }

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key)
    setSortDirection(direction)
    setCurrentPage(0)
  }

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

  const columns: Column<JobDto>[] = [
    {
      key: 'jobCode',
      header: 'Job Code',
      sortable: true,
      render: (job) => (
        <Link href={`/admin/jobs/${job.id}`} className="font-semibold text-primary-main hover:text-primary-dark transition-colors">
          {job.jobCode}
        </Link>
      )
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (job) => (
        <div>
          <div className="font-semibold text-neutral-textPrimary">{job.title}</div>
          <div className="text-xs text-neutral-textSecondary line-clamp-1">{job.description}</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (job) => (
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}>
            {job.status.replace('_', ' ')}
          </span>
          {job.isEmergency && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
              <AlertCircle className="w-3 h-3" />
              Emergency
            </span>
          )}
        </div>
      )
    },
    {
      key: 'customerId',
      header: 'Customer',
      render: (job) => <span className="text-sm">ID: {job.customerId}</span>
    },
    {
      key: 'providerId',
      header: 'Provider',
      render: (job) => job.providerId ? <span className="text-sm">ID: {job.providerId}</span> : <span className="text-xs text-neutral-textSecondary">Not assigned</span>
    },
    {
      key: 'estimatedBudget',
      header: 'Budget',
      sortable: true,
      render: (job) => job.estimatedBudget ? (
        <span className="font-semibold text-accent-green">₹{job.estimatedBudget}</span>
      ) : <span className="text-xs text-neutral-textSecondary">-</span>
    },
    {
      key: 'preferredTime',
      header: 'Preferred Time',
      sortable: true,
      render: (job) => (
        <div className="flex items-center gap-1.5 text-xs text-neutral-textSecondary">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(job.preferredTime).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'addressLine1',
      header: 'Location',
      render: (job) => (
        <div className="flex items-center gap-1.5 text-xs text-neutral-textSecondary">
          <MapPin className="w-3.5 h-3.5" />
          <span className="line-clamp-1">{job.addressLine1}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (job) => (
        <Link
          href={`/admin/jobs/${job.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-main/10 text-primary-main rounded-lg text-xs font-semibold hover:bg-primary-main hover:text-white transition-all"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </Link>
      )
    }
  ]

  return (
    <div className="px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">Manage Jobs</h1>
        <p className="text-sm text-neutral-textSecondary mt-1">View and manage all platform jobs</p>
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
            },
            {
              key: 'cityId',
              label: 'City ID',
              type: 'number'
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
          currentSortBy={sortKey}
          currentSortDir={sortDirection}
          onSortChange={handleSort}
        />
      </motion.div>

      {loading ? (
        <SkeletonTable />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <DataTable
            data={jobs}
            columns={columns}
            onSort={handleSort}
            sortKey={sortKey}
            sortDirection={sortDirection}
            loading={loading}
            emptyMessage="No jobs found matching your filters"
            onRowClick={(job) => router.push(`/admin/jobs/${job.id}`)}
          />

          {jobs.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
