'use client'

import Sidebar from './Sidebar'
import { Bell, Briefcase, CircleHelp, LayoutDashboard, Plus, Sparkles, User, MessageCircle, MessageSquare } from 'lucide-react'

export default function CustomerSidebar() {
  const items = [
    { label: 'Dashboard', href: '/customer/dashboard', icon: LayoutDashboard },
    { label: 'Book Service', href: '/customer/jobs/create', icon: Plus },
    { label: 'My Requests', href: '/customer/jobs', icon: Briefcase },
    { label: 'Chat', href: '/customer/chat', icon: MessageSquare },
    { label: 'Notifications', href: '/customer/notifications', icon: Bell },
    { label: 'Help Center', href: '/customer/help', icon: CircleHelp },
    { label: 'Feedback / Suggestion', href: '/feedback', icon: MessageCircle },
    { label: 'About Us', href: '/customer/about', icon: Sparkles },
    { label: 'Profile', href: '/customer/profile', icon: User },
  ]

  return <Sidebar items={items} />
}
