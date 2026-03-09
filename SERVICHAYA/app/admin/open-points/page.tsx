'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PageLoader, ButtonLoader } from '@/components/ui/Loader'
import DataTable, { type Column } from '@/components/ui/DataTable'
import { SkeletonTable } from '@/components/ui/Skeleton'
import FilterBar from '@/components/ui/FilterBar'
import Pagination from '@/components/ui/Pagination'
import { getAdminOpenPoints, type PublicOpenPointResponse, type OpenPointStatus, type OpenPointType } from '@/lib/services/feedback'
import { AlertCircle, CheckCircle2, CircleDot, CircleSlash2, Clock3, MessageCircle, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'

function OpenPointsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [points, setPoints] = useState<PublicOpenPointResponse[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [filters, setFilters] = useState<{
    status?: OpenPointStatus | 'ALL'
    type?: OpenPointType | 'ALL'
  }>({
    status: (searchParams.get('status') as OpenPointStatus) || 'NEW',
    type: (searchParams.get('type') as OpenPointType) || 'ALL',
  })
  const [sortKey, setSortKey] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, filters, sortKey, sortDirection])

  const fetchData = async () => {
    try {
      setLoading(true)
      const result = await getAdminOpenPoints({
        status: filters.status && filters.status !== 'ALL' ? (filters.status as OpenPointStatus) : undefined,
        type: filters.type && filters.type !== 'ALL' ? (filters.type as OpenPointType) : undefined,
        page: currentPage,
        size: pageSize,
        sortBy: sortKey,
        sortDir: sortDirection.toUpperCase() as 'ASC' | 'DESC',
      })
      setPoints(result.content || [])
      setTotalPages(result.totalPages || 0)
      setTotalElements(result.totalElements || 0)
    } catch (error: any) {
      console.error('Failed to load open points', error)
      toast.error(error?.response?.data?.message || 'Failed to load open points')
      setPoints([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters: Record<string, any>) => {
    const updated: typeof filters = {
      status: newFilters.status || 'ALL',
      type: newFilters.type || 'ALL',
    }
    setFilters(updated)
    setCurrentPage(0)

    const params = new URLSearchParams()
    if (updated.status && updated.status !== 'ALL') params.set('status', updated.status)
    if (updated.type && updated.type !== 'ALL') params.set('type', updated.type)
    router.push(`/admin/open-points?${params.toString()}`)
  }

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key)
    setSortDirection(direction)
    setCurrentPage(0)
  }

  const getStatusBadge = (status: OpenPointStatus) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800'
      case 'UNDER_REVIEW':
        return 'bg-amber-100 text-amber-800'
      case 'PLANNED':
        return 'bg-indigo-100 text-indigo-800'
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800'
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-neutral-background text-neutral-textSecondary'
    }
  }

  const columns: Column<PublicOpenPointResponse>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      render: (item) => (
        <Link
          href={`/admin/open-points/${item.id}`}
          className="font-mono text-xs text-primary-main hover:text-primary-dark"
        >
          OP-{item.id}
        </Link>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (item) => (
        <span className="text-xs font-semibold text-neutral-textPrimary">
          {item.type.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (item) => (
        <div>
          <div className="text-sm font-semibold text-neutral-textPrimary line-clamp-1">{item.title}</div>
          <div className="text-xs text-neutral-textSecondary line-clamp-1">{item.description}</div>
        </div>
      ),
    },
    {
      key: 'impactArea',
      header: 'Impact',
      sortable: true,
      render: (item) => (
        <span className="text-xs text-neutral-textSecondary">
          {item.impactArea?.replace('_', ' ') || 'Other'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadge(
            item.status,
          )}`}
        >
          {item.status === 'NEW' && <CircleDot className="w-3 h-3" />}
          {item.status === 'IN_PROGRESS' && <Clock3 className="w-3 h-3" />}
          {item.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
          {item.status === 'REJECTED' && <CircleSlash2 className="w-3 h-3" />}
          {item.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (item) => {
        const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold'
        let cls = 'bg-slate-100 text-slate-800'
        if (item.priority === 'HIGH') cls = 'bg-orange-100 text-orange-800'
        if (item.priority === 'CRITICAL') cls = 'bg-red-100 text-red-800'
        if (item.priority === 'LOW') cls = 'bg-slate-100 text-slate-700'
        return (
          <span className={`${base} ${cls}`}>
            {item.priority}
          </span>
        )
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (item) => (
        <span className="text-xs text-neutral-textSecondary">
          {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
        </span>
      ),
    },
  ]

  return (
    <div className="px-6 py-6 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-neutral-textPrimary font-display flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary-main" />
            Open Points & Feedback
          </h1>
          <p className="text-sm text-neutral-textSecondary mt-1">
            Review feature requests, flow issues and suggestions submitted from public.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
      >
        <FilterBar
          filters={[
            {
              key: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { value: 'ALL', label: 'All' },
                { value: 'NEW', label: 'New' },
                { value: 'UNDER_REVIEW', label: 'Under review' },
                { value: 'PLANNED', label: 'Planned' },
                { value: 'IN_PROGRESS', label: 'In progress' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'REJECTED', label: 'Rejected' },
              ],
            },
            {
              key: 'type',
              label: 'Type',
              type: 'select',
              options: [
                { value: 'ALL', label: 'All' },
                { value: 'FEATURE_REQUEST', label: 'Feature request' },
                { value: 'FLOW_ISSUE', label: 'Flow issue' },
                { value: 'CHANGE_SUGGESTION', label: 'Change suggestion' },
                { value: 'BUG', label: 'Bug' },
                { value: 'OTHER', label: 'Other' },
              ],
            },
          ]}
          onFilterChange={handleFilterChange}
          initialFilters={filters}
          sortOptions={[
            { key: 'createdAt', label: 'Created time' },
            { key: 'priority', label: 'Priority' },
            { key: 'type', label: 'Type' },
          ]}
          currentSortBy={sortKey}
          currentSortDir={sortDirection}
          onSortChange={handleSort}
        />
      </motion.div>

      {loading ? (
        <SkeletonTable rows={5} cols={7} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          <DataTable
            data={points}
            columns={columns}
            onSort={handleSort}
            sortKey={sortKey}
            sortDirection={sortDirection}
            loading={loading}
            emptyMessage="No open points yet. When users submit feedback, it will appear here."
          />

          {points.length > 0 && (
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="rounded-2xl border border-primary-main/30 bg-primary-main/5 px-4 py-3 flex items-start gap-2 text-xs text-neutral-textSecondary"
      >
        <Sparkles className="w-4 h-4 text-primary-main mt-0.5" />
        <p>
          Tip: Use this list during roadmap planning to quickly see real issues from customers and providers. You
          can filter by status and type to focus on what matters now.
        </p>
      </motion.div>
    </div>
  )
}

export default function OpenPointsPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading open points..." />}>
      <OpenPointsPageContent />
    </Suspense>
  )
}

