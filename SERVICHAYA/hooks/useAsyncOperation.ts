'use client'

import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'

interface UseAsyncOperationOptions {
  showLoader?: boolean
  successMessage?: string
  errorMessage?: string
  onSuccess?: () => void
  onError?: (error: any) => void
}

export function useAsyncOperation() {
  const [loading, setLoading] = useState(false)

  const execute = useCallback(async (
    operation: () => Promise<any>,
    options: UseAsyncOperationOptions = {}
  ) => {
    const {
      showLoader = true,
      successMessage,
      errorMessage,
      onSuccess,
      onError
    } = options

    try {
      if (showLoader) {
        setLoading(true)
      }
      
      const result = await operation()
      
      if (successMessage) {
        toast.success(successMessage)
      }
      
      if (onSuccess) {
        onSuccess()
      }
      
      return result
    } catch (error: any) {
      const message = errorMessage || error?.response?.data?.message || 'An error occurred'
      toast.error(message)
      
      if (onError) {
        onError(error)
      }
      
      throw error
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }, [])

  return { execute, loading }
}
