'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { useState, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface SidebarItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
  children?: SidebarItem[]
}

interface SidebarProps {
  items: SidebarItem[]
}

function SidebarItem({ item, pathname }: { item: SidebarItem; pathname: string }) {
  const hasChildren = item.children && item.children.length > 0
  const isActive = pathname === item.href || (hasChildren && item.children?.some(child => pathname === child.href || pathname.startsWith(child.href + '/')))
  const [isExpanded, setIsExpanded] = useState(isActive)
  const Icon = item.icon

  useEffect(() => {
    if (isActive && hasChildren) {
      setIsExpanded(true)
    }
  }, [isActive, hasChildren])

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
            isActive
              ? 'bg-gradient-to-r from-primary-main to-primary-dark text-white shadow-md'
              : 'text-neutral-textSecondary hover:bg-neutral-background hover:text-primary-main'
          }`}
        >
          <Icon className="w-5 h-5" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronRight
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        </button>
        {isExpanded && (
          <div className="ml-4 mt-2 space-y-1 border-l-2 border-neutral-border pl-4">
            {item.children.map((child) => {
              const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/')
              const ChildIcon = child.icon
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isChildActive
                      ? 'bg-primary-main/10 text-primary-main border-l-2 border-primary-main'
                      : 'text-neutral-textSecondary hover:bg-neutral-background hover:text-primary-main'
                  }`}
                >
                  <ChildIcon className="w-4 h-4" />
                  <span>{child.label}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-r from-primary-main to-primary-dark text-white shadow-md'
          : 'text-neutral-textSecondary hover:bg-neutral-background hover:text-primary-main'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="flex-1">{item.label}</span>
      {item.badge && item.badge > 0 && (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          isActive ? 'bg-white/20 text-white' : 'bg-primary-main/10 text-primary-main'
        }`}>
          {item.badge}
        </span>
      )}
    </Link>
  )
}

export default function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  return (
    <aside className="w-64 bg-white border-r border-neutral-border min-h-screen sticky top-0 h-screen overflow-y-auto shadow-sm">
      <div className="p-6">
        {user && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-main to-primary-dark rounded-xl flex items-center justify-center text-white font-bold text-lg">
                {(user?.name || user?.mobileNumber || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-textPrimary">{user?.name || user?.mobileNumber || 'User'}</p>
                <p className="text-xs text-neutral-textSecondary capitalize">{user?.role?.toLowerCase().replace('_', ' ') || 'User'}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="space-y-2">
          {items.map((item) => (
            <SidebarItem key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
      </div>
    </aside>
  )
}
