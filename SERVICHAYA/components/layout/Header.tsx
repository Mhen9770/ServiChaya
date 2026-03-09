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
    <nav className="sticky top-0 z-50 border-b border-white/10 glass-dark backdrop-blur-md bg-slate-900/85">
      <div className="max-w-6xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <Link
              href="/"
              className="shrink-0 text-2xl sm:text-3xl font-bold tracking-tight hover:opacity-90 transition-opacity"
            >
              SERVI<span className="text-primary-light gradient-text">CHAYA</span>
            </Link>
            {showBackButton && backUrl && (
              <Link
                href={backUrl}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-300 hover:text-primary-light font-medium transition-colors truncate"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="truncate">{backLabel}</span>
              </Link>
            )}
          </div>

          {showUserMenu && (
            <div className="flex items-center gap-3 sm:gap-4">
              {user && (
                <>
                  <div className="hidden sm:block text-right leading-tight">
                    <p className="text-[11px] text-slate-400">Welcome</p>
                    <p className="text-sm font-semibold text-white truncate max-w-[140px]">
                      {user.name || user.mobileNumber || 'User'}
                    </p>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-main to-primary-dark rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {(user.name || user.mobileNumber || 'U').charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center gap-2 px-2.5 sm:px-4 py-2 text-xs sm:text-sm text-slate-300 hover:text-primary-light font-medium transition-colors rounded-lg hover:bg-white/10"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
