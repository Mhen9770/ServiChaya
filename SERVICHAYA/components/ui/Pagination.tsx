'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

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

  if (totalPages === 0) return null

  return (
    <div className="glass-dark border border-white/10 rounded-2xl p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Results Info & Page Size */}
        <div className="flex items-center gap-4 flex-wrap">
          <p className="text-xs text-slate-300">
            Showing <span className="font-bold text-white">{start.toLocaleString()}</span> to{' '}
            <span className="font-bold text-white">{end.toLocaleString()}</span> of{' '}
            <span className="font-bold text-white">{totalElements.toLocaleString()}</span> results
          </p>
          {onPageSizeChange && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="text-xs bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-main/50 transition-all"
              >
                <option value={10} className="bg-slate-900">10</option>
                <option value={20} className="bg-slate-900">20</option>
                <option value={50} className="bg-slate-900">50</option>
                <option value={100} className="bg-slate-900">100</option>
              </select>
            </div>
          )}
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          {/* First Page */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onPageChange(0)}
            disabled={currentPage === 0}
            className="p-2 rounded-xl border border-white/20 hover:border-primary-main/50 hover:bg-primary-main/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4 text-white" />
          </motion.button>

          {/* Previous Page */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="p-2 rounded-xl border border-white/20 hover:border-primary-main/50 hover:bg-primary-main/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </motion.button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: page !== '...' ? 1.1 : 1 }}
                whileTap={{ scale: page !== '...' ? 0.9 : 1 }}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={page === '...'}
                className={`min-w-[40px] h-10 px-3 rounded-xl text-xs font-bold transition-all ${
                  page === currentPage
                    ? 'bg-gradient-to-r from-primary-main to-primary-light text-white shadow-lg shadow-primary-main/50'
                    : page === '...'
                    ? 'cursor-default text-slate-400'
                    : 'border border-white/20 text-slate-300 hover:border-primary-main/50 hover:bg-primary-main/20 hover:text-white'
                }`}
              >
                {page === '...' ? '...' : (page as number) + 1}
              </motion.button>
            ))}
          </div>

          {/* Next Page */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            className="p-2 rounded-xl border border-white/20 hover:border-primary-main/50 hover:bg-primary-main/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </motion.button>

          {/* Last Page */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onPageChange(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
            className="p-2 rounded-xl border border-white/20 hover:border-primary-main/50 hover:bg-primary-main/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
