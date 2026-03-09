'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Search,
  Star,
  MapPin,
  CheckCircle2,
  Shield,
  Clock,
  User,
  Users,
  Phone,
  Mail,
  ArrowRight,
  Wrench,
  Menu,
  X,
  Zap,
} from 'lucide-react'
import { getCategoryById, getProvidersByCategory, type ServiceCategory } from '@/lib/services/service'
import { type ProviderProfileDto } from '@/lib/services/provider'
import { toast } from 'react-hot-toast'
import { PageLoader, ContentLoader } from '@/components/ui/Loader'

// Import all icons needed
import {
  Snowflake,
  Droplets,
  Saw,
  Paintbrush,
  Sparkles as SparklesIcon,
  Car as CarIcon,
  Laptop,
  Settings,
  Fan,
  Lightbulb,
  Cable,
  Pipe,
  Drill,
  HardHat,
  Spray,
  Cog,
  Cpu,
  Monitor,
  Smartphone,
  Tv,
} from 'lucide-react'

// Service category icons mapping - same as home page
const getCategoryIcon = (category: ServiceCategory): any => {
  const code = (category.code || '').toUpperCase()
  const name = (category.name || '').toUpperCase()
  const categoryType = (category.categoryType || '').toUpperCase()
  
  // Check by code first (most specific)
  if (code.includes('AC_REPAIR') || code.includes('AIR_CONDITION') || name.includes('AC') || name.includes('AIR CONDITION')) {
    return Snowflake
  }
  if (code.includes('ELECTRICAL') || code.includes('ELECTRICIAN') || name.includes('ELECTRIC')) {
    return Zap
  }
  if (code.includes('PLUMBING') || code.includes('PLUMBER') || name.includes('PLUMB')) {
    return Droplets
  }
  if (code.includes('CARPENTRY') || code.includes('CARPENTER') || name.includes('CARPENT')) {
    return Saw
  }
  if (code.includes('PAINTING') || code.includes('PAINTER') || name.includes('PAINT')) {
    return Paintbrush
  }
  if (code.includes('CLEANING') || code.includes('CLEANER') || name.includes('CLEAN')) {
    return SparklesIcon
  }
  if (code.includes('AUTOMOTIVE') || code.includes('AUTO') || code.includes('CAR') || name.includes('AUTO') || name.includes('CAR')) {
    return CarIcon
  }
  if (code.includes('ELECTRONICS') || code.includes('ELECTRONIC') || name.includes('ELECTRONIC')) {
    return Laptop
  }
  if (code.includes('APPLIANCE') || name.includes('APPLIANCE')) {
    return Settings
  }
  if (code.includes('FAN') || name.includes('FAN')) {
    return Fan
  }
  if (code.includes('LIGHT') || name.includes('LIGHT') || name.includes('BULB')) {
    return Lightbulb
  }
  if (code.includes('WIRING') || name.includes('WIRING')) {
    return Cable
  }
  if (code.includes('PIPE') || name.includes('PIPE')) {
    return Pipe
  }
  if (code.includes('FAUCET') || name.includes('FAUCET') || name.includes('TAP')) {
    return Droplets
  }
  if (code.includes('REFRIGERATOR') || code.includes('FRIDGE') || name.includes('REFRIGERATOR') || name.includes('FRIDGE')) {
    return Settings
  }
  if (code.includes('WASHING') || name.includes('WASHING MACHINE')) {
    return Cog
  }
  if (code.includes('TV') || code.includes('TELEVISION') || name.includes('TV') || name.includes('TELEVISION')) {
    return Tv
  }
  if (code.includes('COMPUTER') || code.includes('PC') || name.includes('COMPUTER')) {
    return Monitor
  }
  if (code.includes('MOBILE') || code.includes('PHONE') || name.includes('MOBILE') || name.includes('PHONE')) {
    return Smartphone
  }
  if (code.includes('MICROWAVE') || name.includes('MICROWAVE')) {
    return Settings
  }
  if (code.includes('STOVE') || code.includes('GAS') || name.includes('STOVE') || name.includes('GAS')) {
    return Settings
  }
  if (code.includes('DRILL') || name.includes('DRILL')) {
    return Drill
  }
  if (code.includes('CONSTRUCTION') || name.includes('CONSTRUCTION')) {
    return HardHat
  }
  if (code.includes('VACUUM') || name.includes('VACUUM')) {
    return SparklesIcon
  }
  if (code.includes('SPRAY') || name.includes('SPRAY')) {
    return Spray
  }
  
  // Check by categoryType as fallback
  if (categoryType === 'ELECTRICAL') {
    return Zap
  }
  if (categoryType === 'PLUMBING') {
    return Droplets
  }
  if (categoryType === 'CARPENTRY') {
    return Saw
  }
  if (categoryType === 'PAINTING') {
    return Paintbrush
  }
  if (categoryType === 'CLEANING') {
    return SparklesIcon
  }
  if (categoryType === 'AUTOMOTIVE') {
    return CarIcon
  }
  if (categoryType === 'ELECTRONICS') {
    return Laptop
  }
  if (categoryType === 'APPLIANCE') {
    return Settings
  }
  
  // Default fallback
  return Wrench
}

export default function ServicesPage() {
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('category')
  
  const [category, setCategory] = useState<ServiceCategory | null>(null)
  const [providers, setProviders] = useState<ProviderProfileDto[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (categoryId) {
      loadCategoryData()
    }
  }, [categoryId])

  const loadCategoryData = async () => {
    try {
      setLoading(true)
      const [categoryData, providersData] = await Promise.all([
        getCategoryById(Number(categoryId)),
        getProvidersByCategory(Number(categoryId)).catch(() => []) // Fetch providers, but don't fail if it errors
      ])
      setCategory(categoryData)
      setProviders(providersData || [])
    } catch (error) {
      console.error('Failed to load category:', error)
      toast.error('Failed to load service category')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoader text="Loading service category..." />
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-[#010B2A] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Category not found</p>
          <Link href="/services" className="text-primary-light hover:underline">
            Browse all services
          </Link>
        </div>
      </div>
    )
  }

  const IconComponent = getCategoryIcon(category)

  return (
    <div className="min-h-screen bg-[#010B2A] text-white">
      {/* Header - Matching Home Page */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 border-b border-white/10 glass-dark backdrop-blur-xl"
      >
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <Link href="/" className="text-2xl sm:text-3xl font-bold tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-main to-primary-light rounded-xl flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <span>SERVI<span className="text-primary-light gradient-text">CHAYA</span></span>
              </Link>
            </motion.div>
            
            <div className="hidden md:flex items-center gap-2 sm:gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="/login" 
                  className="rounded-full border border-white/25 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold hover:bg-white/10 transition whitespace-nowrap"
                >
                  Sign in
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="/customer/jobs/create" 
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-main to-primary-light px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold hover:shadow-lg hover:shadow-primary-main/50 transition-all whitespace-nowrap"
                >
                  <Zap className="w-4 h-4" />
                  Book Service
                </Link>
              </motion.div>
            </div>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      <main className="w-full">
        {/* Category Header */}
        <section className="w-full py-12 sm:py-16 bg-gradient-to-br from-primary-main/20 via-primary-dark/10 to-[#010B2A]">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <Link 
                href="/services"
                className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-primary-light transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to all services
              </Link>
              
              <div className="flex items-center gap-4 mb-6">
                <motion.div 
                  className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-main to-primary-dark rounded-2xl flex items-center justify-center relative overflow-hidden"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  animate={{ 
                    rotate: [0, 5],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 4, repeat: Infinity, repeatType: "reverse" as const, ease: "easeInOut" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  {IconComponent && (
                    <motion.div
                      animate={{ 
                        y: [0, -5, 0],
                        rotate: [0, 8]
                      }}
                      transition={{ 
                        y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                        rotate: { duration: 3, repeat: Infinity, repeatType: "reverse" as const, ease: "easeInOut" }
                      }}
                    >
                      <IconComponent className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    </motion.div>
                  )}
                  <motion.div
                    className="absolute inset-0 bg-white/20 rounded-2xl"
                    animate={{ 
                      scale: [1, 1.3],
                      opacity: [0.3, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">{category.name}</h1>
                  <p className="text-slate-300 text-sm sm:text-base">{category.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-light" />
                  <span className="text-slate-300">{category.providerCount || 0} Verified Providers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-slate-300">100% Verified</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works - Public Workflow */}
        <section className="w-full py-12 sm:py-16 lg:py-20 bg-[#010B2A]">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-12"
            >
              <span className="inline-block px-4 py-2 text-xs uppercase tracking-wider text-primary-light font-bold bg-primary-main/20 border border-primary-main/30 rounded-full mb-4">
                How it works
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4">
                Simple <span className="text-primary-light">3-Step</span> Process
              </h2>
            </motion.div>
            
            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {[
                { title: 'Select Provider', desc: 'Browse verified professionals in your area', icon: User, color: 'from-blue-500 to-blue-600' },
                { title: 'Book Service', desc: 'Schedule your service at your convenience', icon: Clock, color: 'from-purple-500 to-purple-600' },
                { title: 'Get Service Done', desc: 'Track progress and pay securely', icon: CheckCircle2, color: 'from-green-500 to-green-600' },
              ].map((step, idx) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  whileHover={{ scale: 1.05, y: -8 }}
                  className="relative rounded-3xl border-2 border-white/10 glass-dark p-6 sm:p-8 hover:border-primary-main/50 transition-all text-center"
                >
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br ${step.color} text-white flex items-center justify-center font-bold text-lg shadow-xl border-2 border-white/20`}>
                    {idx + 1}
                  </div>
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shadow-xl`}>
                    <step.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Providers List */}
        <section className="w-full py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-[#010B2A] to-[#000510]">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-12"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Available <span className="text-primary-light">Providers</span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
                Choose from our verified professionals
              </p>
            </motion.div>
            
            {providers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <Shield className="w-16 h-16 mx-auto mb-4 text-primary-light opacity-50" />
                <p className="text-xl text-slate-300 mb-2">No providers available yet</p>
                <p className="text-slate-400 mb-6">We're working on adding providers for this category</p>
                <Link
                  href="/customer/jobs/create"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-main to-primary-light px-6 py-3 font-semibold hover:shadow-lg transition-all"
                >
                  Create Job Request
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {providers.map((provider, idx) => (
                  <motion.div
                    key={provider.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="rounded-2xl glass-dark border border-white/10 p-6 hover:border-primary-main/50 transition-all"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-main to-primary-dark flex items-center justify-center font-bold text-xl text-white">
                        {provider.businessName?.charAt(0) || provider.providerType?.charAt(0) || 'P'}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1">{provider.businessName || provider.providerType}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(provider.rating || 0)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-slate-300">
                            {provider.rating?.toFixed(1) || '0.0'} ({provider.ratingCount || 0})
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span>{provider.totalJobsCompleted || 0} jobs</span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                            {provider.verificationStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                    {provider.bio && (
                      <p className="text-sm text-slate-300 mb-4 line-clamp-2">{provider.bio}</p>
                    )}
                    <Link
                      href={`/provider/${provider.id}`}
                      className="inline-flex items-center gap-2 w-full justify-center rounded-xl border border-primary-main/50 bg-primary-main/10 px-4 py-2 text-sm font-semibold hover:bg-primary-main/20 transition-colors"
                    >
                      View Profile
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary-main via-primary-dark to-[#010B2A]">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 text-white">
                Ready to Book {category.name}?
              </h2>
              <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Create a job request and get matched with the best providers in your area.
              </p>
              <Link
                href="/customer/jobs/create"
                className="inline-flex items-center gap-2 rounded-xl bg-white text-primary-dark px-8 py-4 font-bold text-lg hover:bg-slate-100 transition-colors shadow-2xl"
              >
                Create Job Request
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  )
}
