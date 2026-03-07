'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Filter, ShieldCheck, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getAllCategories, type ServiceCategory } from '@/lib/services/service'
import { SkeletonCard } from '@/components/ui/Skeleton'

export default function ServicesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [featuredOnly])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await getAllCategories(featuredOnly)
      setCategories(data)
    } catch {
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const visibleCategories = useMemo(() => {
    if (!search.trim()) return categories
    const term = search.toLowerCase()
    return categories.filter((c) => `${c.name} ${c.description}`.toLowerCase().includes(term))
  }, [categories, search])

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-50 bg-white/95 border-b border-neutral-border backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary-main to-primary-dark bg-clip-text text-transparent">
            ServiChaya
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-semibold text-neutral-textSecondary hover:text-primary-main">Home</Link>
            <Link href="/login" className="px-4 py-2 rounded-xl bg-primary-main text-white text-sm font-semibold">Login</Link>
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-10">
        <div className="rounded-3xl p-7 md:p-9 bg-gradient-to-r from-primary-dark via-primary-main to-primary-light text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Browse service categories</h1>
          <p className="text-sm text-blue-100 max-w-2xl">Explore all offerings without login. Sign in only when you want to create and track a service request.</p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs text-blue-100">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 border border-white/20"><ShieldCheck className="w-3.5 h-3.5" /> Verified ecosystem</span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 border border-white/20"><Users className="w-3.5 h-3.5" /> Skilled provider network</span>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-10">
        <div className="bg-white rounded-2xl border border-neutral-border p-4 md:p-5 shadow-sm mb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
            <div className="inline-flex bg-neutral-background rounded-xl p-1 border border-neutral-border">
              <button onClick={() => setFeaturedOnly(false)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${!featuredOnly ? 'bg-primary-main text-white' : 'text-neutral-textSecondary'}`}>All</button>
              <button onClick={() => setFeaturedOnly(true)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${featuredOnly ? 'bg-primary-main text-white' : 'text-neutral-textSecondary'}`}>Featured</button>
            </div>
            <div className="relative w-full md:w-[320px]">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-textSecondary" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services"
                className="w-full rounded-xl border border-neutral-border pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-main/30"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, idx) => <SkeletonCard key={idx} />)}</div>
        ) : visibleCategories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-border p-10 text-center text-sm text-neutral-textSecondary">No services found for this filter.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleCategories.map((category, idx) => (
              <motion.article key={category.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="bg-white rounded-2xl border border-neutral-border p-5 shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 rounded-xl bg-primary-main/10 text-primary-main flex items-center justify-center text-xl mb-3">{category.iconUrl || '🛠️'}</div>
                <h3 className="font-bold text-neutral-textPrimary">{category.name}</h3>
                <p className="text-sm text-neutral-textSecondary mt-2 line-clamp-3">{category.description || 'Professional support available in your area.'}</p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-primary-main font-semibold">{category.providerCount || 0}+ providers</span>
                  <Link href={`/login?redirect=/customer/jobs/create`} className="inline-flex items-center gap-1 font-semibold text-neutral-textPrimary hover:text-primary-main">
                    Request <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
