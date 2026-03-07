'use client'

import { useState } from 'react'
import { Filter, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface FilterOption {
  key: string
  label: string
  type: 'select' | 'date' | 'text' | 'number'
  options?: { value: string; label: string }[]
}

interface SortOption {
  key: string
  label: string
}

interface FilterBarProps {
  filters: FilterOption[]
  onFilterChange: (filters: Record<string, any>) => void
  initialFilters?: Record<string, any>
  sortOptions?: SortOption[]
  currentSortBy?: string
  currentSortDir?: 'asc' | 'desc'
  onSortChange?: (sortBy: string, sortDir: 'asc' | 'desc') => void
}

export default function FilterBar({ 
  filters, 
  onFilterChange, 
  initialFilters = {},
  sortOptions,
  currentSortBy,
  currentSortDir,
  onSortChange
}: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>(initialFilters)

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value || undefined }
    setActiveFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilter = (key: string) => {
    const newFilters = { ...activeFilters }
    delete newFilters[key]
    setActiveFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearAll = () => {
    setActiveFilters({})
    onFilterChange({})
  }

  const activeCount = Object.keys(activeFilters).filter(key => activeFilters[key] !== undefined && activeFilters[key] !== '').length

  return (
    <div className="bg-white rounded-2xl border border-neutral-border p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-semibold text-neutral-textPrimary hover:text-primary-main transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeCount > 0 && (
            <span className="px-2 py-0.5 bg-primary-main text-white text-xs rounded-full">
              {activeCount}
            </span>
          )}
        </button>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-neutral-textSecondary hover:text-primary-main transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {isOpen && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-neutral-border">
          {filters.map((filter) => (
            <div key={filter.key}>
              <label className="block text-xs font-semibold text-neutral-textSecondary mb-1.5">
                {filter.label}
              </label>
              {filter.type === 'select' && filter.options ? (
                <select
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                >
                  <option value="">All</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : filter.type === 'text' ? (
                <input
                  type="text"
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  placeholder={`Search ${filter.label.toLowerCase()}...`}
                  className="w-full px-3 py-2 text-sm border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                />
              ) : filter.type === 'date' ? (
                <input
                  type="date"
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                />
              ) : (
                <input
                  type="number"
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  placeholder={`Enter ${filter.label.toLowerCase()}...`}
                  className="w-full px-3 py-2 text-sm border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                />
              )}
              {activeFilters[filter.key] && (
                <button
                  onClick={() => clearFilter(filter.key)}
                  className="mt-1.5 flex items-center gap-1 text-xs text-neutral-textSecondary hover:text-primary-main"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-neutral-border">
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value || value === '') return null
            const filter = filters.find(f => f.key === key)
            const label = filter?.options?.find(opt => opt.value === value)?.label || value
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-main/10 text-primary-main text-xs font-semibold rounded-lg"
              >
                {filter?.label}: {label}
                <button
                  onClick={() => clearFilter(key)}
                  className="hover:text-primary-dark"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {sortOptions && sortOptions.length > 0 && onSortChange && (
        <div className="mt-4 pt-4 border-t border-neutral-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-textSecondary">
              <ArrowUpDown className="w-4 h-4" />
              Sort by:
            </div>
            <select
              value={currentSortBy || ''}
              onChange={(e) => onSortChange(e.target.value, currentSortDir || 'desc')}
              className="px-3 py-2 text-sm border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
            >
              {sortOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => onSortChange(currentSortBy || sortOptions[0].key, currentSortDir === 'asc' ? 'desc' : 'asc')}
              className="p-2 border-2 border-neutral-border rounded-xl hover:border-primary-main hover:bg-primary-main/10 transition-all"
              title={`Sort ${currentSortDir === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {currentSortDir === 'asc' ? (
                <ArrowUp className="w-4 h-4 text-primary-main" />
              ) : (
                <ArrowDown className="w-4 h-4 text-primary-main" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
