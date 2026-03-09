'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Loader from '@/components/ui/Loader'

let navigationTimeout: NodeJS.Timeout | null = null

export function NavigationLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    // Show loader when route changes
    setIsNavigating(true)
    
    // Clear any existing timeout
    if (navigationTimeout) {
      clearTimeout(navigationTimeout)
    }
    
    // Hide loader after a short delay (route has changed)
    navigationTimeout = setTimeout(() => {
      setIsNavigating(false)
    }, 300)

    return () => {
      if (navigationTimeout) {
        clearTimeout(navigationTimeout)
      }
    }
  }, [pathname, searchParams])

  if (!isNavigating) return null

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[9998] bg-transparent">
      <div className="h-full bg-gradient-to-r from-primary-main to-primary-light animate-pulse" 
           style={{ 
             width: '100%',
             animation: 'loading-bar 1s ease-in-out infinite'
           }} 
      />
      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
