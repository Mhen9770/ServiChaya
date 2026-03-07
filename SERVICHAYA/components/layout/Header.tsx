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
    <nav className="sticky top-0 z-50 border-b border-white/10 glass-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-2xl sm:text-3xl font-bold tracking-tight hover:opacity-80 transition-opacity">
              SERVI<span className="text-primary-light gradient-text">CHAYA</span>
            </Link>
            {showBackButton && backUrl && (
              <Link href={backUrl} className="flex items-center gap-2 text-sm text-slate-300 hover:text-primary-light font-medium transition-colors">
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
                    <p className="text-xs text-slate-400">Welcome</p>
                    <p className="text-sm font-semibold text-white">{user.name || user.mobileNumber || 'User'}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-main to-primary-dark rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {(user.name || user.mobileNumber || 'U').charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-primary-light font-medium transition-colors rounded-lg hover:bg-white/10"
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
