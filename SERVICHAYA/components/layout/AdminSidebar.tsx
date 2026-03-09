'use client'

import Sidebar from './Sidebar'
import { 
  LayoutDashboard, ClipboardList, Users, User, Settings, 
  MapPin, Building2, Layers, List, Sliders, Globe, Wrench, Shield, Package,
  DollarSign, UserPlus, MessageCircle
} from 'lucide-react'

export default function AdminSidebar() {
  const items = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Jobs', href: '/admin/jobs', icon: ClipboardList },
    { label: 'Providers', href: '/admin/providers', icon: Users },
    { label: 'Customers', href: '/admin/customers', icon: User },
    { label: 'Open Points', href: '/admin/open-points', icon: MessageCircle },
    { 
      label: 'Master Data', 
      href: '#', 
      icon: Package,
      children: [
        { label: 'Countries', href: '/admin/master-data/countries', icon: Globe },
        { label: 'States', href: '/admin/master-data/states', icon: MapPin },
        { label: 'Cities', href: '/admin/master-data/cities', icon: MapPin },
        { label: 'Zones', href: '/admin/master-data/zones', icon: Building2 },
        { label: 'PODs', href: '/admin/master-data/pods', icon: Layers },
        { label: 'Service Categories', href: '/admin/master-data/service-categories', icon: List },
        { label: 'Service SubCategories', href: '/admin/master-data/service-subcategories', icon: List },
        { label: 'Service Skills', href: '/admin/master-data/service-skills', icon: Wrench },
        { label: 'Matching Rules', href: '/admin/master-data/matching-rules', icon: Sliders },
        { label: 'User Roles', href: '/admin/master-data/user-roles', icon: Shield },
      ]
    },
    {
      label: 'Earning Config',
      href: '#',
      icon: DollarSign,
      children: [
        { label: 'Platform Config', href: '/admin/earning-config/platform', icon: DollarSign },
        { label: 'Provider Config', href: '/admin/earning-config/provider', icon: User },
      ]
    },
    { label: 'Configuration', href: '/admin/configuration', icon: Settings },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  return <Sidebar items={items} />
}
