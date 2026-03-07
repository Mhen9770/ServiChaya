'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Header from '@/components/layout/Header'
import CustomerSidebar from '@/components/layout/CustomerSidebar'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }
    if (currentUser.role !== 'CUSTOMER') {
      router.push('/dashboard')
      return
    }
    setUser(currentUser)
    setLoading(false)
  }, [router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#010B2A] text-white overflow-x-hidden">
      <Header showUserMenu={true} />
      <div className="flex">
        <CustomerSidebar />
        <main className="flex-1 pt-0">
          {children}
        </main>
      </div>
    </div>
  )
}
