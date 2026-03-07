'use client'

import { ReactNode } from 'react'
import Header from './Header'
import ProviderSidebar from './ProviderSidebar'
import CustomerSidebar from './CustomerSidebar'
import AdminSidebar from './AdminSidebar'
import { getCurrentUser } from '@/lib/auth'

interface PageLayoutProps {
  children: ReactNode
  showSidebar?: boolean
  sidebarType?: 'provider' | 'customer' | 'admin'
  headerProps?: {
    showUserMenu?: boolean
    showBackButton?: boolean
    backUrl?: string
    backLabel?: string
  }
}

export default function PageLayout({ 
  children, 
  showSidebar = false,
  sidebarType,
  headerProps = {}
}: PageLayoutProps) {
  const user = getCurrentUser()
  
  // Auto-detect sidebar type from user role if not specified
  if (showSidebar && !sidebarType && user) {
    if (user.role === 'SERVICE_PROVIDER') sidebarType = 'provider'
    else if (user.role === 'CUSTOMER') sidebarType = 'customer'
    else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') sidebarType = 'admin'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-background to-white">
      <Header {...headerProps} />
      
      <div className="flex">
        {showSidebar && sidebarType && (
          <>
            {sidebarType === 'provider' && <ProviderSidebar />}
            {sidebarType === 'customer' && <CustomerSidebar />}
            {sidebarType === 'admin' && <AdminSidebar />}
          </>
        )}
        
        <main className={`flex-1 ${showSidebar ? '' : 'container mx-auto px-4 py-8'}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
