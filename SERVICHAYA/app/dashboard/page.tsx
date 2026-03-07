'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Redirect based on role
    if (user.role === 'CUSTOMER') {
      router.push('/customer/dashboard')
    } else if (user.role === 'SERVICE_PROVIDER') {
      router.push('/provider/dashboard')
    } else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      router.push('/admin/dashboard')
    } else if (user.role === 'SUPPORT_AGENT' || user.role === 'STAFF') {
      router.push('/staff/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main mx-auto"></div>
        <p className="mt-4 text-neutral-textSecondary">Redirecting...</p>
      </div>
    </div>
  )
}
