'use client'

import Link from 'next/link'
import { getCurrentUser, logout } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, LogOut } from 'lucide-react'

interface HeaderProps {
  showUserMenu?: boolean
  showBackButton?: boolean
  backUrl?: string
  backLabel?: string
}

export default function Header({ 
  showUserMenu = true, 
  showBackButton = false,
  backUrl,
  backLabel = 'Back'
}: HeaderProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  const handleLogout = () => {
    logout()
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-neutral-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary-main to-primary-dark bg-clip-text text-transparent font-display hover:scale-105 transition-transform">
              SERVICHAYA
            </Link>
            {showBackButton && backUrl && (
              <Link href={backUrl} className="flex items-center gap-2 text-sm text-neutral-textSecondary hover:text-primary-main font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" />
                {backLabel}
              </Link>
            )}
          </div>
          
          {showUserMenu && (
            <div className="flex items-center gap-6">
              {user && (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-neutral-textSecondary">Welcome</p>
                    <p className="text-sm font-semibold text-neutral-textPrimary">{user.name || user.mobileNumber || 'User'}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-main to-primary-dark rounded-full flex items-center justify-center text-white font-bold">
                    {(user.name || user.mobileNumber || 'U').charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-textSecondary hover:text-primary-main font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
