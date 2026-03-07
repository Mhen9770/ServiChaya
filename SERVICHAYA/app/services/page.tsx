'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAllCategories, type ServiceCategory, type ServiceSubCategory } from '@/lib/services/service'
import { toast } from 'react-hot-toast'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function ServicesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchCategories()
  }, [featuredOnly])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const categories = await getAllCategories(featuredOnly)
      setCategories(categories)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-background to-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-neutral-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary-main to-primary-dark bg-clip-text text-transparent font-display">
              SERVICHAYA
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-neutral-textPrimary hover:text-primary-main transition-colors font-medium">
                Home
              </Link>
              <Link href="/login" className="px-6 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 md:py-16 px-4 bg-gradient-to-br from-primary-main/5 via-white to-accent-green/5">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-1.5 bg-primary-main/10 text-primary-main rounded-full text-xs font-semibold mb-4">
              Browse Services
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display">
              <span className="bg-gradient-to-r from-primary-main to-primary-dark bg-clip-text text-transparent">
                All Services
              </span>
            </h1>
            <p className="text-base md:text-lg text-neutral-textSecondary max-w-2xl mx-auto">
              Choose from our wide range of verified service categories
            </p>
          </div>

          {/* Filter Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-white rounded-2xl p-1 shadow-md border border-neutral-border">
              <button
                onClick={() => setFeaturedOnly(false)}
                className={`px-6 py-2 rounded-xl font-semibold text-sm transition-all ${
                  !featuredOnly
                    ? 'bg-gradient-to-r from-primary-main to-primary-dark text-white shadow-md'
                    : 'text-neutral-textSecondary hover:text-primary-main'
                }`}
              >
                All Services
              </button>
              <button
                onClick={() => setFeaturedOnly(true)}
                className={`px-6 py-2 rounded-xl font-semibold text-sm transition-all ${
                  featuredOnly
                    ? 'bg-gradient-to-r from-primary-main to-primary-dark text-white shadow-md'
                    : 'text-neutral-textSecondary hover:text-primary-main'
                }`}
              >
                Featured
              </button>
            </div>
          </div>

          {/* Categories Grid */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6 max-w-7xl mx-auto"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <SkeletonCard />
                </motion.div>
              ))}
            </motion.div>
          ) : categories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <p className="text-lg text-neutral-textSecondary">No services found</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6 max-w-7xl mx-auto"
            >
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                >
                  <Link
                    href={`/services/${category.code.toLowerCase()}`}
                    className="group relative bg-white rounded-3xl p-6 md:p-7 shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-primary-main/30 overflow-hidden block"
                  >
                    {/* Hover Effect Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-main/5 to-accent-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative z-10">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 6 }}
                        className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary-main/20 to-primary-light/10 rounded-3xl flex items-center justify-center text-4xl mb-5 transition-all duration-500"
                      >
                        {category.iconUrl || '🔧'}
                      </motion.div>
                      <h3 className="text-lg md:text-xl font-bold text-neutral-textPrimary mb-2 group-hover:text-primary-main transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-xs md:text-sm text-neutral-textSecondary mb-4 line-clamp-2">
                        {category.description}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-neutral-border/50">
                        <span className="text-xs font-bold text-primary-main">
                          {category.providerCount || 0}+ providers
                        </span>
                        {category.subCategories && category.subCategories.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              const newExpanded = new Set(expandedCategories)
                              if (newExpanded.has(category.id)) {
                                newExpanded.delete(category.id)
                              } else {
                                newExpanded.add(category.id)
                              }
                              setExpandedCategories(newExpanded)
                            }}
                            className="text-xs text-primary-main hover:text-primary-dark font-semibold flex items-center gap-1"
                          >
                            {expandedCategories.has(category.id) ? (
                              <>
                                <ChevronUp className="w-3 h-3" />
                                Hide ({category.subCategories.length})
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" />
                                View ({category.subCategories.length})
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      {category.subCategories && category.subCategories.length > 0 && (
                        <AnimatePresence>
                          {expandedCategories.has(category.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden mt-4 pt-4 border-t border-neutral-border/50"
                            >
                              <p className="text-xs font-semibold text-neutral-textSecondary mb-2 uppercase tracking-wide">
                                Subcategories
                              </p>
                              <div className="grid grid-cols-1 gap-2">
                                {category.subCategories.map((subCat: ServiceSubCategory) => (
                                  <Link
                                    key={subCat.id}
                                    href={`/services/${category.code.toLowerCase()}/${subCat.code.toLowerCase()}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="group/subcat flex items-center justify-between p-2 rounded-lg bg-neutral-background hover:bg-primary-main/5 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      {subCat.iconUrl && (
                                        <span className="text-lg">{subCat.iconUrl}</span>
                                      )}
                                      <span className="text-xs font-medium text-neutral-textPrimary group-hover/subcat:text-primary-main">
                                        {subCat.name}
                                      </span>
                                    </div>
                                    <span className="text-xs text-neutral-textSecondary">
                                      {subCat.providerCount || 0}+
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </div>
                    
                    {/* Shine Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  )
}
