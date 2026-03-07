'use client'

import { ReactNode } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
}

export default function DataTable<T extends { id: number | string }>({
  data,
  columns,
  onSort,
  sortKey,
  sortDirection,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick
}: DataTableProps<T>) {
  const handleSort = (key: string) => {
    if (!onSort || !columns.find(c => c.key === key)?.sortable) return
    
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(key, newDirection)
  }

  const getSortIcon = (key: string) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-neutral-textSecondary" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-primary-main" />
      : <ArrowDown className="w-3.5 h-3.5 text-primary-main" />
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-border overflow-hidden">
        <div className="animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border-b border-neutral-border last:border-0">
              <div className="h-14 bg-neutral-background" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-border p-12 text-center">
        <p className="text-sm text-neutral-textSecondary">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-background border-b border-neutral-border">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-neutral-textSecondary uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-neutral-border/50' : ''
                  } ${column.className || ''}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && (
                      <span className="flex-shrink-0">{getSortIcon(column.key)}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-border">
            {data.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={`hover:bg-neutral-background transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3 text-sm ${column.className || ''}`}>
                    {column.render ? column.render(item) : (item as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
