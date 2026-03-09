'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { PageLoader, ContentLoader, ButtonLoader } from '@/components/ui/Loader'

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

  return <PageLoader text="Redirecting..." />
}
