'use client'

import Sidebar from './Sidebar'
import { Briefcase, LayoutDashboard, Plus, Sparkles, User } from 'lucide-react'

export default function CustomerSidebar() {
  const items = [
    { label: 'Dashboard', href: '/customer/dashboard', icon: LayoutDashboard },
    { label: 'Book Service', href: '/customer/jobs/create', icon: Plus },
    { label: 'My Requests', href: '/customer/jobs', icon: Briefcase },
    { label: 'About Us', href: '/customer/about', icon: Sparkles },
    { label: 'Profile', href: '/customer/profile', icon: User },
  ]

  return <Sidebar items={items} />
}
