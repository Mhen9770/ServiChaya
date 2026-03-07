'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

export default function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange
}: PaginationProps) {
  const start = currentPage * pageSize + 1
  const end = Math.min((currentPage + 1) * pageSize, totalElements)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage < 3) {
        for (let i = 0; i < 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages - 1)
      } else if (currentPage > totalPages - 4) {
        pages.push(0)
        pages.push('...')
        for (let i = totalPages - 4; i < totalPages; i++) pages.push(i)
      } else {
        pages.push(0)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages - 1)
      }
    }
    return pages
  }

  return (
    <div className="flex items-center justify-between border-t border-neutral-border pt-4">
      <div className="flex items-center gap-4">
        <p className="text-xs text-neutral-textSecondary">
          Showing <span className="font-semibold text-neutral-textPrimary">{start}</span> to{' '}
          <span className="font-semibold text-neutral-textPrimary">{end}</span> of{' '}
          <span className="font-semibold text-neutral-textPrimary">{totalElements}</span> results
        </p>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs border border-neutral-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary-main"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="p-2 rounded-lg border border-neutral-border hover:bg-neutral-background disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, idx) => (
          <button
            key={idx}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`min-w-[36px] h-9 px-3 rounded-lg text-xs font-semibold transition-all ${
              page === currentPage
                ? 'bg-gradient-to-r from-primary-main to-primary-dark text-white shadow-md'
                : page === '...'
                ? 'cursor-default'
                : 'border border-neutral-border hover:bg-neutral-background text-neutral-textSecondary hover:text-primary-main'
            }`}
          >
            {page === '...' ? '...' : (page as number) + 1}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="p-2 rounded-lg border border-neutral-border hover:bg-neutral-background disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
