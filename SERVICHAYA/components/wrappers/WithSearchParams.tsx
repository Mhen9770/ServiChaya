'use client'

import { Suspense, ReactNode } from 'react'
import { PageLoader } from '@/components/ui/Loader'

interface WithSearchParamsProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Wrapper component to handle useSearchParams() Suspense boundary requirement
 * Use this to wrap components that use useSearchParams() hook
 */
export default function WithSearchParams({ 
  children, 
  fallback = <PageLoader text="Loading..." /> 
}: WithSearchParamsProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )
}
