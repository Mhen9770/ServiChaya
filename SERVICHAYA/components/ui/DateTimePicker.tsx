'use client'

import { useState, useEffect, useRef } from 'react'
import { CalendarDays, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DateTimePickerProps {
  label: string
  value: string // ISO datetime string or empty
  onChange: (value: string) => void
  required?: boolean
  icon?: React.ComponentType<{ className?: string }>
  minDate?: Date
  maxDate?: Date
}

export default function DateTimePicker({
  label,
  value,
  onChange,
  required,
  icon: Icon,
  minDate,
  maxDate,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedHour, setSelectedHour] = useState(12)
  const [selectedMinute, setSelectedMinute] = useState(0)
  const [isAM, setIsAM] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date')
  const containerRef = useRef<HTMLDivElement>(null)

  // Parse initial value
  useEffect(() => {
    if (value) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        setSelectedDate(date)
        setSelectedHour(date.getHours() % 12 || 12)
        setSelectedMinute(date.getMinutes())
        setIsAM(date.getHours() < 12)
        setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1))
      }
    } else {
      setSelectedDate(null)
    }
  }, [value])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const formatDisplayValue = () => {
    if (!selectedDate) return ''
    const dateStr = selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const hour12 = selectedHour === 12 ? 12 : selectedHour
    const timeStr = `${hour12.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')} ${isAM ? 'AM' : 'PM'}`
    return `${dateStr} • ${timeStr}`
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    // Auto-switch to time tab after selecting date
    setTimeout(() => setActiveTab('time'), 200)
  }

  const handleConfirm = () => {
    if (!selectedDate) return
    
    const hour24 = isAM 
      ? (selectedHour === 12 ? 0 : selectedHour)
      : (selectedHour === 12 ? 12 : selectedHour + 12)
    
    const finalDate = new Date(selectedDate)
    finalDate.setHours(hour24, selectedMinute, 0, 0)
    
    // Format: YYYY-MM-DDTHH:mm (ISO datetime-local format)
    const year = finalDate.getFullYear()
    const month = String(finalDate.getMonth() + 1).padStart(2, '0')
    const day = String(finalDate.getDate()).padStart(2, '0')
    const hours = String(hour24).padStart(2, '0')
    const minutes = String(selectedMinute).padStart(2, '0')
    
    onChange(`${year}-${month}-${day}T${hours}:${minutes}`)
    setIsOpen(false)
  }

  const handleClear = () => {
    setSelectedDate(null)
    setSelectedHour(12)
    setSelectedMinute(0)
    setIsAM(true)
    onChange('')
    setIsOpen(false)
  }

  const handleToday = () => {
    const today = new Date()
    setSelectedDate(today)
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedHour(today.getHours() % 12 || 12)
    setSelectedMinute(today.getMinutes())
    setIsAM(today.getHours() < 12)
    setActiveTab('time')
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days: (Date | null)[] = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const days = getDaysInMonth(currentMonth)
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = [0, 15, 30, 45] // Common intervals

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-semibold mb-1 text-white">
        {label}{required ? ' *' : ''}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full rounded-xl glass border px-3 py-2.5 text-sm text-white bg-white/5 placeholder:text-slate-400 flex items-center gap-2 transition-all ${
          isOpen 
            ? 'border-primary-main/60 bg-white/10 shadow-lg shadow-primary-main/20' 
            : 'border-white/20 hover:border-white/30 hover:bg-white/8'
        }`}
      >
        {Icon && <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />}
        <span className="flex-1 text-left text-white">
          {formatDisplayValue() || <span className="text-slate-400">Select date & time</span>}
        </span>
        <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full max-w-sm bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-primary-main/20 via-primary-main/10 to-primary-light/20 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Select Date & Time</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
              </div>

              {/* Tab Switcher */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('date')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'date'
                      ? 'bg-primary-main text-white shadow-lg'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <CalendarDays className="w-3 h-3 inline mr-1.5" />
                  Date
                </button>
                <button
                  onClick={() => setActiveTab('time')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'time'
                      ? 'bg-primary-main text-white shadow-lg'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <Clock className="w-3 h-3 inline mr-1.5" />
                  Time
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Date Picker */}
              {activeTab === 'date' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <h4 className="text-sm font-semibold text-white">{monthName}</h4>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map(day => (
                      <div key={day} className="text-center text-[10px] text-slate-400 font-medium py-1.5">
                        {day.slice(0, 1)}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {days.map((date, idx) => {
                      if (!date) {
                        return <div key={`empty-${idx}`} className="aspect-square" />
                      }
                      const disabled = isDateDisabled(date)
                      const selected = isDateSelected(date)
                      const today = isToday(date)
                      
                      return (
                        <button
                          key={date.getTime()}
                          onClick={() => !disabled && handleDateSelect(date)}
                          disabled={disabled}
                          className={`aspect-square text-xs font-medium rounded-lg transition-all ${
                            disabled
                              ? 'text-slate-600 cursor-not-allowed'
                              : selected
                              ? 'bg-primary-main text-white shadow-lg scale-110 font-semibold'
                              : today
                              ? 'bg-primary-main/30 text-primary-light border border-primary-main/50 font-semibold'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {date.getDate()}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* Time Picker */}
              {activeTab === 'time' && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Hour & Minute */}
                  <div className="flex items-center justify-center gap-4">
                    {/* Hour */}
                    <div className="flex-1">
                      <div className="text-[10px] text-slate-400 mb-2 text-center font-medium">Hour</div>
                      <div className="bg-slate-800/50 rounded-xl p-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-main/50 scrollbar-track-transparent">
                        <div className="flex flex-col gap-1">
                          {hours.map(hour => (
                            <button
                              key={hour}
                              onClick={() => setSelectedHour(hour)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                selectedHour === hour
                                  ? 'bg-primary-main text-white shadow-lg scale-105'
                                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {hour.toString().padStart(2, '0')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-2xl font-bold text-white py-8">:</div>

                    {/* Minute */}
                    <div className="flex-1">
                      <div className="text-[10px] text-slate-400 mb-2 text-center font-medium">Minute</div>
                      <div className="bg-slate-800/50 rounded-xl p-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-main/50 scrollbar-track-transparent">
                        <div className="flex flex-col gap-1">
                          {minutes.map(minute => (
                            <button
                              key={minute}
                              onClick={() => setSelectedMinute(minute)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                selectedMinute === minute
                                  ? 'bg-primary-main text-white shadow-lg scale-105'
                                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {minute.toString().padStart(2, '0')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AM/PM Toggle */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsAM(true)}
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isAM
                          ? 'bg-primary-main text-white shadow-lg'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      AM
                    </button>
                    <button
                      onClick={() => setIsAM(false)}
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        !isAM
                          ? 'bg-primary-main text-white shadow-lg'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      PM
                    </button>
                  </div>

                  {/* Selected Time Display */}
                  <div className="bg-primary-main/10 border border-primary-main/30 rounded-xl p-3 text-center">
                    <div className="text-xs text-slate-400 mb-1">Selected Time</div>
                    <div className="text-lg font-bold text-white">
                      {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')} {isAM ? 'AM' : 'PM'}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 p-4 pt-0 border-t border-white/10">
              <button
                onClick={handleClear}
                className="flex-1 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                Clear
              </button>
              <button
                onClick={handleToday}
                className="flex-1 px-3 py-2 text-xs font-medium text-primary-light hover:text-primary-main transition-colors rounded-lg hover:bg-primary-main/10"
              >
                Today
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedDate}
                className="flex-1 px-3 py-2 text-xs font-semibold bg-primary-main text-white rounded-lg hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-main/30"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
