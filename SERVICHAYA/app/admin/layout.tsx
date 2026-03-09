'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Header from '@/components/layout/Header'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default function AdminLayout({
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
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
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
    <div className="h-full bg-gradient-to-b from-neutral-background to-white overflow-hidden flex flex-col">
      <Header showUserMenu={true} />
      <div className="flex-1 flex min-h-0">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  )
}
