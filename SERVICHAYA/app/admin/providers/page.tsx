'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getProviders, type ProviderDto } from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import Pagination from '@/components/ui/Pagination'
import FilterBar from '@/components/ui/FilterBar'
import DataTable, { Column } from '@/components/ui/DataTable'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Eye, CheckCircle2, X, Star, Phone, Mail, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminProvidersPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [providers, setProviders] = useState<ProviderDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [filters, setFilters] = useState<Record<string, any>>({
    status: searchParams.get('status') || 'ALL'
  })
  const [sortKey, setSortKey] = useState<string>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchProviders()
  }, [currentPage, pageSize, filters, sortKey, sortDirection])

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getProviders(
        filters.status,
        currentPage,
        pageSize,
        sortKey,
        sortDirection
      )
      setProviders(result.content || [])
      setTotalPages(result.totalPages || 0)
      setTotalElements(result.totalElements || 0)
    } catch (error: any) {
      console.error('Failed to fetch providers:', error)
      const errorMsg = error.response?.data?.message || 'Failed to load providers'
      toast.error(errorMsg)
      setProviders([])
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
    router.push(`/admin/providers?${params.toString()}`)
  }

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key)
    setSortDirection(direction)
    setCurrentPage(0)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_VERIFICATION': return 'bg-yellow-100 text-yellow-800'
      case 'ACTIVE': return 'bg-accent-green/20 text-accent-green'
      case 'SUSPENDED': return 'bg-red-100 text-red-800'
      case 'REJECTED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-neutral-background text-neutral-textSecondary'
    }
  }

  const columns: Column<ProviderDto>[] = [
    {
      key: 'providerCode',
      header: 'Code',
      sortable: true,
      render: (provider) => (
        <Link href={`/admin/providers/${provider.id}`} className="font-semibold text-primary-main hover:text-primary-dark transition-colors">
          {provider.providerCode}
        </Link>
      )
    },
    {
      key: 'businessName',
      header: 'Business Name',
      sortable: true,
      render: (provider) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-neutral-textSecondary" />
          <span className="font-semibold text-neutral-textPrimary">{provider.businessName || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'providerType',
      header: 'Type',
      render: (provider) => (
        <span className="text-xs text-neutral-textSecondary capitalize">{provider.providerType?.replace('_', ' ')}</span>
      )
    },
    {
      key: 'email',
      header: 'Contact',
      render: (provider) => (
        <div className="space-y-1">
          {provider.email && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-textSecondary">
              <Mail className="w-3.5 h-3.5" />
              {provider.email}
            </div>
          )}
          {provider.mobileNumber && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-textSecondary">
              <Phone className="w-3.5 h-3.5" />
              {provider.mobileNumber}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'rating',
      header: 'Rating',
      sortable: true,
      render: (provider) => provider.rating ? (
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="font-semibold text-neutral-textPrimary">{provider.rating.toFixed(1)}</span>
          {provider.totalJobsCompleted && (
            <span className="text-xs text-neutral-textSecondary">({provider.totalJobsCompleted})</span>
          )}
        </div>
      ) : <span className="text-xs text-neutral-textSecondary">-</span>
    },
    {
      key: 'verificationStatus',
      header: 'Verification',
      sortable: true,
      render: (provider) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
          provider.verificationStatus === 'VERIFIED' ? 'bg-accent-green/20 text-accent-green' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {provider.verificationStatus}
        </span>
      )
    },
    {
      key: 'profileStatus',
      header: 'Status',
      sortable: true,
      render: (provider) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(provider.profileStatus)}`}>
          {provider.profileStatus.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'isAvailable',
      header: 'Available',
      sortable: true,
      render: (provider) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
          provider.isAvailable ? 'bg-accent-green/20 text-accent-green' : 'bg-neutral-background text-neutral-textSecondary'
        }`}>
          {provider.isAvailable ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (provider) => (
        <Link
          href={`/admin/providers/${provider.id}`}
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
        <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">Manage Providers</h1>
        <p className="text-sm text-neutral-textSecondary mt-1">Approve and manage service providers</p>
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
                { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'SUSPENDED', label: 'Suspended' },
                { value: 'REJECTED', label: 'Rejected' }
              ]
            }
          ]}
          onFilterChange={handleFilterChange}
          initialFilters={filters}
          sortOptions={[
            { key: 'createdAt', label: 'Created Date' },
            { key: 'businessName', label: 'Business Name' },
            { key: 'rating', label: 'Rating' },
            { key: 'profileStatus', label: 'Status' }
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
            data={providers}
            columns={columns}
            onSort={handleSort}
            sortKey={sortKey}
            sortDirection={sortDirection}
            loading={loading}
            emptyMessage="No providers found matching your filters"
            onRowClick={(provider) => router.push(`/admin/providers/${provider.id}`)}
          />

          {providers.length > 0 && (
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
