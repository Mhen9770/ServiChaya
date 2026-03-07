'use client'

import Sidebar from './Sidebar'
import { LayoutDashboard, Plus, Briefcase, User, Sparkles } from 'lucide-react'

export default function CustomerSidebar() {
  const items = [
    { label: 'Dashboard', href: '/customer/dashboard', icon: LayoutDashboard },
    { label: 'Create Job', href: '/customer/jobs/create', icon: Plus },
    { label: 'My Jobs', href: '/customer/jobs', icon: Briefcase },
    { label: 'About Us', href: '/customer/about', icon: Sparkles },
    { label: 'Profile', href: '/customer/profile', icon: User },
  ]

  return <Sidebar items={items} />
}
