'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCustomers, type CustomerDto } from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import { PageLoader } from '@/components/ui/Loader'
import Loader from '@/components/ui/Loader'
import Pagination from '@/components/ui/Pagination'
import FilterBar from '@/components/ui/FilterBar'
import DataTable, { Column } from '@/components/ui/DataTable'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Eye, Phone, Mail, MapPin, Calendar, UserCheck, UserX } from 'lucide-react'
import { motion } from 'framer-motion'

function AdminCustomersPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [filters, setFilters] = useState<Record<string, any>>({
    status: searchParams.get('status') || 'ALL'
  })
  const [sortKey, setSortKey] = useState<string>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchCustomers()
  }, [currentPage, pageSize, filters, sortKey, sortDirection])

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getCustomers(filters.status, currentPage, pageSize, sortKey, sortDirection)
      setCustomers(result.content || [])
      setTotalPages(result.totalPages || 0)
      setTotalElements(result.totalElements || 0)
    } catch (error: any) {
      console.error('Failed to fetch customers:', error)
      const errorMsg = error.response?.data?.message || 'Failed to load customers'
      toast.error(errorMsg)
      setCustomers([])
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
    router.push(`/admin/customers?${params.toString()}`)
  }

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key)
    setSortDirection(direction)
    setCurrentPage(0)
  }

  const columns: Column<CustomerDto>[] = [
    {
      key: 'customerCode',
      header: 'Code',
      sortable: true,
      render: (customer) => (
        <span className="font-semibold text-primary-main">{customer.customerCode}</span>
      )
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (customer) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-main to-primary-dark rounded-lg flex items-center justify-center text-white text-xs font-bold">
            {customer.name?.charAt(0).toUpperCase() || 'C'}
          </div>
          <span className="font-semibold text-neutral-textPrimary">{customer.name}</span>
        </div>
      )
    },
    {
      key: 'mobileNumber',
      header: 'Contact',
      render: (customer) => (
        <div className="flex flex-col gap-1">
          {customer.mobileNumber && (
            <div className="flex items-center gap-1.5 text-sm">
              <Phone className="w-3.5 h-3.5 text-neutral-textSecondary" />
              <span>{customer.mobileNumber}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-1.5 text-sm text-neutral-textSecondary">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate max-w-[200px]">{customer.email}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'totalJobsCreated',
      header: 'Jobs',
      sortable: true,
      render: (customer) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Created: {customer.totalJobsCreated || 0}</span>
          <span className="text-xs text-neutral-textSecondary">Completed: {customer.totalJobsCompleted || 0}</span>
        </div>
      )
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (customer) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
          customer.isActive 
            ? 'bg-accent-green/20 text-accent-green' 
            : 'bg-red-100 text-red-800'
        }`}>
          {customer.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
          {customer.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      render: (customer) => (
        <div className="flex items-center gap-1.5 text-sm text-neutral-textSecondary">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(customer.createdAt).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (customer) => (
        <Link
          href={`/admin/customers/${customer.id}`}
          className="p-1.5 text-primary-main hover:bg-primary-main/10 rounded-lg transition-all inline-flex"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">Manage Customers</h1>
            <p className="text-sm text-neutral-textSecondary mt-1">View and manage all platform customers</p>
          </div>
        </div>
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
                { value: 'ALL', label: 'All' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' }
              ]
            }
          ]}
          onFilterChange={handleFilterChange}
          initialFilters={filters}
          sortOptions={[
            { key: 'name', label: 'Name' },
            { key: 'customerCode', label: 'Code' },
            { key: 'totalJobsCreated', label: 'Jobs Created' },
            { key: 'createdAt', label: 'Joined Date' },
            { key: 'isActive', label: 'Status' }
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
            data={customers}
            columns={columns}
            onSort={handleSort}
            sortKey={sortKey}
            sortDirection={sortDirection}
            loading={loading}
            emptyMessage="No customers found. Customers will appear here once they register."
          />

          {customers.length > 0 && (
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

export default function AdminCustomersPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading customers..." />}>
      <AdminCustomersPageContent />
    </Suspense>
  )
}
