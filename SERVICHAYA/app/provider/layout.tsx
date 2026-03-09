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
  const isOnboarding = pathname.includes('/onboarding')
  const showSidebar = !isOnboarding

  // For onboarding, keep layout simple and allow full-page scroll (no fixed shell)
  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-[#010B2A] text-white flex flex-col">
        <Header showUserMenu={true} />
        <main className="flex-1 w-full overflow-y-auto">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-b from-neutral-background to-white overflow-hidden flex flex-col">
      <Header showUserMenu={true} />
      <div className="flex-1 flex min-h-0">
        {showSidebar && <ProviderSidebar />}
        <main className="flex-1 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  )
}
