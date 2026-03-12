'use client'

import Sidebar from './Sidebar'
import { LayoutDashboard, ClipboardList, Briefcase, User, DollarSign, MessageCircle, Users } from 'lucide-react'

export default function ProviderSidebar() {
  const items = [
    { label: 'Dashboard', href: '/provider/dashboard', icon: LayoutDashboard },
    { label: 'Available Jobs', href: '/provider/jobs/available', icon: ClipboardList },
    { label: 'My Jobs', href: '/provider/jobs', icon: Briefcase },
    { label: 'My Customers', href: '/provider/customers', icon: Users },
    { label: 'Profile', href: '/provider/profile', icon: User },
    { label: 'Earnings', href: '/provider/earnings', icon: DollarSign },
    { label: 'Feedback / Issues', href: '/feedback', icon: MessageCircle },
  ]

  return <Sidebar items={items} />
}
