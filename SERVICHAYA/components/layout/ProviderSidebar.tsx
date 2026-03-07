'use client'

import Sidebar from './Sidebar'
import { LayoutDashboard, ClipboardList, Briefcase, User, DollarSign } from 'lucide-react'

export default function ProviderSidebar() {
  const items = [
    { label: 'Dashboard', href: '/provider/dashboard', icon: LayoutDashboard },
    { label: 'Available Jobs', href: '/provider/jobs/available', icon: ClipboardList },
    { label: 'My Jobs', href: '/provider/jobs', icon: Briefcase },
    { label: 'Profile', href: '/provider/profile', icon: User },
    { label: 'Earnings', href: '/provider/earnings', icon: DollarSign },
  ]

  return <Sidebar items={items} />
}
