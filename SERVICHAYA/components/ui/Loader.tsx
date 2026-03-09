'use client'

import { Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  fullScreen?: boolean
  overlay?: boolean
  inline?: boolean
  className?: string
}

export default function Loader({ 
  size = 'md', 
  text, 
  fullScreen = false,
  overlay = false,
  inline = false,
  className = ''
}: LoaderProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className={`${sizeClasses[size]} text-primary-light`} />
      </motion.div>
      {text && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`${textSizeClasses[size]} text-slate-300 text-center`}
        >
          {text}
        </motion.p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#010B2A]/95 backdrop-blur-sm z-[9999] flex items-center justify-center"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    )
  }

  if (overlay) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#010B2A]/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    )
  }

  if (inline) {
    return (
      <div className="inline-flex items-center gap-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className={`${sizeClasses[size]} text-primary-light`} />
        </motion.div>
        {text && <span className={`${textSizeClasses[size]} text-slate-300`}>{text}</span>}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      {content}
    </div>
  )
}

// Button Loader Component
export function ButtonLoader({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  }
  
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="inline-block"
    >
      <Loader2 className={`${sizeClasses[size]} text-current`} />
    </motion.div>
  )
}

// Page Loader Component
export function PageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen bg-[#010B2A] flex items-center justify-center">
      <Loader size="lg" text={text} />
    </div>
  )
}

// Content Loader Component
export function ContentLoader({ text, className }: { text?: string; className?: string }) {
  return (
    <div className={`py-12 ${className || ''}`}>
      <Loader size="md" text={text} />
    </div>
  )
}
