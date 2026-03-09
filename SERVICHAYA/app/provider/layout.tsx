'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Header from '@/components/layout/Header'
import ProviderSidebar from '@/components/layout/ProviderSidebar'

export default function ProviderLayout({
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
    // Allow CUSTOMER to access onboarding page (they want to become a provider)
    const isOnboardingPage = pathname.includes('/onboarding')
    if (currentUser.role !== 'SERVICE_PROVIDER' && !isOnboardingPage) {
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

  // Don't show sidebar on onboarding page
  const showSidebar = !pathname.includes('/onboarding')

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-background to-white">
      <Header showUserMenu={true} />
      <div className="flex">
        {showSidebar && <ProviderSidebar />}
        <main className={`flex-1 ${showSidebar ? '' : 'container mx-auto my-auto'}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
