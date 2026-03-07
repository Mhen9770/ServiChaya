'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, X, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, SlidersHorizontal, Sparkles } from 'lucide-react'

interface FilterOption {
  key: string
  label: string
  type: 'select' | 'date' | 'text' | 'number' | 'daterange' | 'range'
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
  placeholder?: string
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

  const activeCount = Object.keys(activeFilters).filter(key => {
    const value = activeFilters[key]
    return value !== undefined && value !== '' && value !== null && 
           !(Array.isArray(value) && value.length === 0) &&
           !(typeof value === 'object' && Object.keys(value).length === 0)
  }).length

  return (
    <div className="glass-dark border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between p-4 border-b border-white/10"
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-semibold text-white hover:text-primary-light transition-colors group"
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </motion.div>
          <span>Filters & Sort</span>
          {activeCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-2 py-0.5 bg-gradient-to-r from-primary-main to-primary-light text-white text-xs rounded-full font-bold shadow-lg"
            >
              {activeCount}
            </motion.span>
          )}
        </button>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-slate-300 hover:text-primary-light transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
          {sortOptions && sortOptions.length > 0 && onSortChange && (
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={currentSortBy || ''}
                onChange={(e) => onSortChange(e.target.value, currentSortDir || 'desc')}
                className="text-xs bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-main/50 transition-all"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.key} value={opt.key} className="bg-slate-900">
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => onSortChange(currentSortBy || sortOptions[0].key, currentSortDir === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 border border-white/20 rounded-lg hover:border-primary-main/50 hover:bg-primary-main/20 transition-all"
                title={`Sort ${currentSortDir === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {currentSortDir === 'asc' ? (
                  <ArrowUp className="w-3.5 h-3.5 text-primary-light" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5 text-primary-light" />
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Filter Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      {filter.label}
                    </label>
                    {filter.type === 'select' && filter.options ? (
                      <select
                        value={activeFilters[filter.key] || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-main/50 focus:border-primary-main/50 transition-all placeholder:text-slate-500"
                      >
                        <option value="" className="bg-slate-900">All</option>
                        {filter.options.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-slate-900">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : filter.type === 'daterange' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={activeFilters[filter.key]?.from || ''}
                          onChange={(e) => handleFilterChange(filter.key, { 
                            ...(activeFilters[filter.key] || {}), 
                            from: e.target.value 
                          })}
                          className="w-full px-3 py-2.5 text-sm bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-main/50 focus:border-primary-main/50 transition-all"
                        />
                        <input
                          type="date"
                          value={activeFilters[filter.key]?.to || ''}
                          onChange={(e) => handleFilterChange(filter.key, { 
                            ...(activeFilters[filter.key] || {}), 
                            to: e.target.value 
                          })}
                          className="w-full px-3 py-2.5 text-sm bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-main/50 focus:border-primary-main/50 transition-all"
                        />
                      </div>
                    ) : filter.type === 'range' ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min={filter.min}
                            max={filter.max}
                            step={filter.step}
                            value={activeFilters[filter.key]?.min || ''}
                            onChange={(e) => handleFilterChange(filter.key, { 
                              ...(activeFilters[filter.key] || {}), 
                              min: e.target.value ? Number(e.target.value) : undefined 
                            })}
                            placeholder={filter.placeholder || 'Min'}
                            className="w-full px-3 py-2.5 text-sm bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-main/50 focus:border-primary-main/50 transition-all placeholder:text-slate-500"
                          />
                          <input
                            type="number"
                            min={filter.min}
                            max={filter.max}
                            step={filter.step}
                            value={activeFilters[filter.key]?.max || ''}
                            onChange={(e) => handleFilterChange(filter.key, { 
                              ...(activeFilters[filter.key] || {}), 
                              max: e.target.value ? Number(e.target.value) : undefined 
                            })}
                            placeholder={filter.placeholder || 'Max'}
                            className="w-full px-3 py-2.5 text-sm bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-main/50 focus:border-primary-main/50 transition-all placeholder:text-slate-500"
                          />
                        </div>
                      </div>
                    ) : filter.type === 'text' ? (
                      <input
                        type="text"
                        value={activeFilters[filter.key] || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
                        className="w-full px-3 py-2.5 text-sm bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-main/50 focus:border-primary-main/50 transition-all placeholder:text-slate-500"
                      />
                    ) : filter.type === 'date' ? (
                      <input
                        type="date"
                        value={activeFilters[filter.key] || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-main/50 focus:border-primary-main/50 transition-all"
                      />
                    ) : (
                      <input
                        type="number"
                        min={filter.min}
                        max={filter.max}
                        step={filter.step}
                        value={activeFilters[filter.key] || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value ? Number(e.target.value) : undefined)}
                        placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}...`}
                        className="w-full px-3 py-2.5 text-sm bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-main/50 focus:border-primary-main/50 transition-all placeholder:text-slate-500"
                      />
                    )}
                    {(activeFilters[filter.key] && 
                      (typeof activeFilters[filter.key] !== 'object' || 
                       (typeof activeFilters[filter.key] === 'object' && Object.keys(activeFilters[filter.key]).length > 0))) && (
                      <button
                        onClick={() => clearFilter(filter.key)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary-light transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Clear
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Pills */}
      {activeCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 p-4 border-t border-white/10 bg-white/5"
        >
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value || value === '' || 
                (Array.isArray(value) && value.length === 0) ||
                (typeof value === 'object' && Object.keys(value).length === 0)) return null
            
            const filter = filters.find(f => f.key === key)
            let displayLabel = ''
            
            if (typeof value === 'object' && value !== null) {
              if (value.from && value.to) {
                displayLabel = `${value.from} - ${value.to}`
              } else if (value.min !== undefined && value.max !== undefined) {
                displayLabel = `₹${value.min} - ₹${value.max}`
              } else if (value.min !== undefined) {
                displayLabel = `Min: ₹${value.min}`
              } else if (value.max !== undefined) {
                displayLabel = `Max: ₹${value.max}`
              }
            } else {
              displayLabel = filter?.options?.find(opt => opt.value === value)?.label || String(value)
            }
            
            return (
              <motion.span
                key={key}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary-main/20 to-primary-light/20 border border-primary-main/30 text-primary-light text-xs font-semibold rounded-lg"
              >
                <Sparkles className="w-3 h-3" />
                <span>{filter?.label}: {displayLabel}</span>
                <button
                  onClick={() => clearFilter(key)}
                  className="hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
