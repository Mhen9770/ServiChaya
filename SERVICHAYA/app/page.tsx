'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  MapPin,
  Shield,
  Sparkles,
  Star,
  Users,
  CheckCircle2,
  Zap,
  Quote,
  Lock,
  DollarSign,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Home,
  Car,
  Laptop,
  Settings,
  Droplets,
  Plug,
  Hammer,
  Paintbrush,
  Sparkles as SparklesIcon,
  Menu,
  X,
  TrendingUp,
  Award,
  Heart,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ArrowUp,
  Search,
  // Category-specific icons
  Snowflake,
  Wind,
  Fan,
  Lightbulb,
  Cable,
  Battery,
  Power,
  Wrench as PipeIcon,
  Scissors as SawIcon,
  Drill,
  HardHat,
  Brush,
  Palette,
  Droplet as SprayIcon,
  Car as CarIcon,
  Bike,
  Truck,
  Cog,
  Cpu,
  Monitor,
  Smartphone,
  Tv,
  Radio,
} from 'lucide-react'
import { getHomePageData, getPlatformStats, getFeaturedTestimonials, type PlatformStatsDto, type TestimonialDto } from '@/lib/services/public'
import { getRootCategories, getAllCategories, getAllSubCategories, type ServiceCategory, type ServiceSubCategory } from '@/lib/services/service'
import { PageLoader, ContentLoader } from '@/components/ui/Loader'

// Banner carousel data
const banners = [
  {
    id: 1,
    title: 'Expert Home Services at Your Doorstep',
    subtitle: 'Verified professionals for all your home needs',
    description: 'From electrical repairs to deep cleaning, get quality service in minutes',
    image: 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800',
    cta: 'Book Now',
    icon: Home,
  },
  {
    id: 2,
    title: 'Same-Day Service Available',
    subtitle: 'Fast, reliable, and affordable',
    description: 'Emergency repairs? We connect you with nearby experts instantly',
    image: 'bg-gradient-to-br from-orange-500 via-red-600 to-pink-700',
    cta: 'Get Help Now',
    icon: Zap,
  },
  {
    id: 3,
    title: '100% Verified Professionals',
    subtitle: 'Trusted by thousands of customers',
    description: 'All providers are background checked and skill verified',
    image: 'bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700',
    cta: 'Explore Services',
    icon: Shield,
  },
]

// Service category icons mapping - maps category codes and names to appropriate icons
const getCategoryIcon = (category: ServiceCategory): any => {
  const code = (category.code || '').toUpperCase()
  const name = (category.name || '').toUpperCase()
  const categoryType = (category.categoryType || '').toUpperCase()

  // Check by code first (most specific)
  if (code.includes('AC_REPAIR') || code.includes('AIR_CONDITION') || name.includes('AC') || name.includes('AIR CONDITION')) {
    return Snowflake
  }
  if (code.includes('ELECTRICAL') || code.includes('ELECTRICIAN') || name.includes('ELECTRIC')) {
    return Zap // Lightning bolt for electrical
  }
  if (code.includes('PLUMBING') || code.includes('PLUMBER') || name.includes('PLUMB')) {
    return Droplets // Water droplets for plumbing
  }
  if (code.includes('CARPENTRY') || code.includes('CARPENTER') || name.includes('CARPENT')) {
    return SawIcon // Saw for carpentry
  }
  if (code.includes('PAINTING') || code.includes('PAINTER') || name.includes('PAINT')) {
    return Paintbrush // Paintbrush for painting
  }
  if (code.includes('CLEANING') || code.includes('CLEANER') || name.includes('CLEAN')) {
    return SparklesIcon // Sparkles for cleaning
  }
  if (code.includes('AUTOMOTIVE') || code.includes('AUTO') || code.includes('CAR') || name.includes('AUTO') || name.includes('CAR')) {
    return CarIcon // Car for automotive
  }
  if (code.includes('ELECTRONICS') || code.includes('ELECTRONIC') || name.includes('ELECTRONIC')) {
    return Laptop // Laptop for electronics
  }
  if (code.includes('APPLIANCE') || name.includes('APPLIANCE')) {
    return Settings // Settings/gear for appliances
  }
  if (code.includes('FAN') || name.includes('FAN')) {
    return Fan // Fan icon
  }
  if (code.includes('LIGHT') || name.includes('LIGHT') || name.includes('BULB')) {
    return Lightbulb // Lightbulb for lighting
  }
  if (code.includes('WIRING') || name.includes('WIRING')) {
    return Cable // Cable for wiring
  }
  if (code.includes('PIPE') || name.includes('PIPE')) {
    return PipeIcon // Pipe for plumbing pipes
  }
  if (code.includes('FAUCET') || name.includes('FAUCET') || name.includes('TAP')) {
    return Droplets // Water droplets for faucet
  }
  if (code.includes('REFRIGERATOR') || code.includes('FRIDGE') || name.includes('REFRIGERATOR') || name.includes('FRIDGE')) {
    return Settings // Settings gear for refrigerator
  }
  if (code.includes('WASHING') || name.includes('WASHING MACHINE')) {
    return Cog // Gear for washing machine
  }
  if (code.includes('TV') || code.includes('TELEVISION') || name.includes('TV') || name.includes('TELEVISION')) {
    return Tv // TV icon
  }
  if (code.includes('COMPUTER') || code.includes('PC') || name.includes('COMPUTER')) {
    return Monitor // Monitor for computer
  }
  if (code.includes('MOBILE') || code.includes('PHONE') || name.includes('MOBILE') || name.includes('PHONE')) {
    return Smartphone // Smartphone icon
  }
  if (code.includes('MICROWAVE') || name.includes('MICROWAVE')) {
    return Settings // Settings gear for microwave
  }
  if (code.includes('STOVE') || code.includes('GAS') || name.includes('STOVE') || name.includes('GAS')) {
    return Settings // Settings gear for stove
  }
  if (code.includes('DRILL') || name.includes('DRILL')) {
    return Drill // Drill icon
  }
  if (code.includes('CONSTRUCTION') || name.includes('CONSTRUCTION')) {
    return HardHat // Hard hat for construction
  }
  if (code.includes('VACUUM') || name.includes('VACUUM')) {
    return SparklesIcon // Sparkles for vacuum cleaning
  }
  if (code.includes('SPRAY') || name.includes('SPRAY')) {
    return SprayIcon // Spray icon
  }

  // Check by categoryType as fallback
  if (categoryType === 'ELECTRICAL') {
    return Zap
  }
  if (categoryType === 'PLUMBING') {
    return Droplets
  }
  if (categoryType === 'CARPENTRY') {
    return SawIcon
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

export default function HomePage() {
  const router = useRouter()
  const [currentBanner, setCurrentBanner] = useState(0)
  const [stats, setStats] = useState<PlatformStatsDto | null>(null)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [subCategories, setSubCategories] = useState<ServiceSubCategory[]>([])
  const [featuredCategories, setFeaturedCategories] = useState<ServiceCategory[]>([])
  const [testimonials, setTestimonials] = useState<TestimonialDto[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)
  const bannerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  // Scroll to top button visibility
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    loadData()
    startBannerCarousel()

    // Handle scroll to top button
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)

    // Handle active section for navigation
    const handleScrollSection = () => {
      const sections = ['services', 'how-it-works', 'why-us']
      const scrollPosition = window.scrollY + 200

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }
    window.addEventListener('scroll', handleScrollSection)

    return () => {
      if (bannerIntervalRef.current) {
        clearInterval(bannerIntervalRef.current)
      }
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', handleScrollSection)
    }
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setMobileMenuOpen(false)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearch = (value?: string) => {
    const query = (value ?? searchTerm).trim()
    if (!query) return
    router.push(`/services?search=${encodeURIComponent(query)}`)
    setMobileMenuOpen(false)
  }

  const startBannerCarousel = () => {
    bannerIntervalRef.current = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length)
    }, 5000)
  }

  const loadData = async () => {
    try {
      setLoading(true)

      // Prefer single aggregated backend call for homepage data
      const aggregated = await getHomePageData().catch(() => null)

      if (aggregated) {
        setStats(aggregated.stats)
        setCategories((aggregated.rootCategories || []).slice(0, 8))
        setFeaturedCategories((aggregated.featuredCategories || []).slice(0, 6))
        setTestimonials(aggregated.featuredReviews || [])
        setSubCategories((aggregated.featuredSubCategories || []) as ServiceSubCategory[])
        return
      }

      // Fallback to individual calls if aggregated endpoint is unavailable
      const [statsData, categoriesData, featuredData, testimonialsData, subCategoryData] = await Promise.all([
        getPlatformStats().catch(() => null),
        getRootCategories().catch(() => []),
        getAllCategories(true).catch(() => []),
        getFeaturedTestimonials(3).catch(() => []),
        getAllSubCategories(undefined, true).catch(() => []),
      ])

      setStats(statsData)
      setCategories(categoriesData.slice(0, 8)) // Show top 8 categories
      setFeaturedCategories(featuredData.slice(0, 6)) // Show top 6 featured
      setTestimonials(testimonialsData)
      setSubCategories(subCategoryData || [])
    } catch (error) {
      console.error('Failed to load home page data:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length)
    if (bannerIntervalRef.current) {
      clearInterval(bannerIntervalRef.current)
      startBannerCarousel()
    }
  }

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)
    if (bannerIntervalRef.current) {
      clearInterval(bannerIntervalRef.current)
      startBannerCarousel()
    }
  }

  const goToBanner = (index: number) => {
    setCurrentBanner(index)
    if (bannerIntervalRef.current) {
      clearInterval(bannerIntervalRef.current)
      startBannerCarousel()
    }
  }

  const displayStats = [
    {
      value: stats ? `${(stats.verifiedProviders || 0).toLocaleString()}+` : '0',
      label: 'Verified Providers',
      icon: Users,
      color: 'text-blue-400',
    },
    {
      value: stats ? `${(stats.completedJobs || 0).toLocaleString()}+` : '0',
      label: 'Jobs Completed',
      icon: CheckCircle2,
      color: 'text-green-400',
    },
    {
      value: stats
        ? `${(typeof stats.averageRating === 'number' ? stats.averageRating : parseFloat(String(stats.averageRating || 0))).toFixed(1)}/5`
        : '0.0/5',
      label: 'Avg Rating',
      icon: Star,
      color: 'text-amber-400',
    },
    {
      value: stats ? `${(stats.citiesCovered || 0).toLocaleString()}+` : '0',
      label: 'Cities',
      icon: MapPin,
      color: 'text-purple-400',
    },
  ]

  // getCategoryIcon function is now defined above as a const

  if (loading) {
    return <PageLoader text="Loading SERVICHAYA..." />
  }

  return (
    <div className="min-h-screen bg-[#010B2A] text-white overflow-x-hidden">
      {/* Header */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4 mb-3 sm:mb-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <Link href="/" className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight hover:opacity-90 transition-opacity flex items-center gap-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-main to-primary-light rounded-xl flex items-center justify-center shadow-lg shadow-primary-main/40">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <span className="leading-tight">
                  SERVI<span className="text-primary-light gradient-text">CHAYA</span>
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-sm text-slate-300">
              {[
                { label: 'Services', id: 'services' },
                { label: 'How it works', id: 'how-it-works' },
                { label: 'Why us', id: 'why-us' }
              ].map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`hover:text-white transition-colors relative group ${
                    activeSection === item.id ? 'text-primary-light' : ''
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  {item.label}
                  <motion.span
                    className="absolute bottom-0 left-0 h-0.5 bg-primary-light"
                    initial={{ width: activeSection === item.id ? '100%' : 0 }}
                    animate={{ width: activeSection === item.id ? '100%' : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Desktop CTA Buttons */}
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
          </div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-2xl mx-auto"
          >
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
                placeholder="Search for services... (e.g., Electrician, Plumber, AC Repair)"
                className="w-full px-6 py-3 pl-12 pr-24 rounded-full bg-white/5 backdrop-blur-sm border border-white/15 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary-main/60 focus:border-primary-main transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <button
                type="button"
                onClick={() => handleSearch()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-primary-main text-xs font-semibold hover:bg-primary-light transition-colors"
              >
                Find services
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="text-slate-400">Popular:</span>
              {['AC repair', 'Electrician', 'Home cleaning', 'Plumber'].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setSearchTerm(label)
                    handleSearch(label)
                  }}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 hover:bg-primary-main/20 hover:border-primary-main/60 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-white/10 overflow-hidden"
            >
              <nav className="px-4 py-4 space-y-3">
                {[
                  { label: 'Services', id: 'services' },
                  { label: 'How it works', id: 'how-it-works' },
                  { label: 'Why us', id: 'why-us' }
                ].map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="block w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
                    whileTap={{ scale: 0.98 }}
                  >
                    {item.label}
                  </motion.button>
                ))}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <Link
                    href="/login"
                    className="block w-full text-center px-4 py-2 rounded-lg border border-white/25 hover:bg-white/10 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/customer/jobs/create"
                    className="block w-full text-center px-4 py-2 rounded-lg bg-gradient-to-r from-primary-main to-primary-light font-semibold hover:shadow-lg transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Book Service
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main className="w-full">
        {/* Banner Carousel Section */}
        <section className="relative w-full h-[440px] sm:h-[540px] lg:h-[620px] overflow-hidden">
          <AnimatePresence mode="wait">
            {banners.map((banner, index) => (
              index === currentBanner && (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className={`absolute inset-0 ${banner.image} flex items-center relative`}
                >
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <motion.div
                      animate={{
                        backgroundPosition: ['0% 0%', '100% 100%'],
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                      className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:50px_50px]"
                    />
                  </div>
                  <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
                    <div className="max-w-4xl mx-auto text-center">
                      <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.2, type: "tween", duration: 0.6, ease: "easeOut" }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6"
                      >
                        <motion.div
                          animate={{
                            rotate: [0, 10],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{
                            rotate: { duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" },
                            scale: { duration: 1.5, repeat: Infinity, repeatDelay: 1 }
                          }}
                        >
                          <banner.icon className="w-5 h-5" />
                        </motion.div>
                        <span className="text-sm font-semibold">{banner.subtitle}</span>
                      </motion.div>

                      <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, type: "tween", duration: 0.6, ease: "easeOut" }}
                        className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 leading-tight"
                      >
                        {banner.title.split(' ').map((word, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="inline-block mr-2"
                          >
                            {word}
                          </motion.span>
                        ))}
                      </motion.h1>

                      <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, type: "tween", duration: 0.6, ease: "easeOut" }}
                        className="text-lg sm:text-xl lg:text-2xl text-white/90 mb-8 max-w-2xl mx-auto"
                      >
                        {banner.description}
                      </motion.p>

                      <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.5, type: "tween", duration: 0.6, ease: "easeOut" }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Link
                            href="/customer/jobs/create"
                            className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-8 py-4 font-bold text-lg hover:bg-slate-100 transition-all shadow-2xl hover:shadow-3xl group"
                          >
                            {banner.cta}
                            <motion.div
                              animate={{ x: [0, 5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </motion.div>
                          </Link>
                        </motion.div>
                        <p className="mt-4 text-sm sm:text-base text-white/80">
                          Are you a service professional?{' '}
                          <Link
                            href="/provider/onboarding"
                            className="font-semibold text-white underline underline-offset-4 decoration-primary-light hover:text-primary-light"
                          >
                            Become a SERVICHAYA partner
                          </Link>
                        </p>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )
            ))}
          </AnimatePresence>

          {/* Carousel Controls */}
          <motion.button
            onClick={prevBanner}
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all flex items-center justify-center z-10 shadow-lg"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <motion.button
            onClick={nextBanner}
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all flex items-center justify-center z-10 shadow-lg"
            aria-label="Next banner"
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>

          {/* Carousel Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => goToBanner(index)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className={`h-2 rounded-full transition-all ${
                  index === currentBanner ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60 w-2'
                }`}
                aria-label={`Go to banner ${index + 1}`}
                animate={{
                  width: index === currentBanner ? 32 : 8,
                  opacity: index === currentBanner ? 1 : 0.4
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="w-full py-8 sm:py-12 bg-gradient-to-b from-transparent to-[#010B2A] border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {displayStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, type: "tween", duration: 0.5, ease: "easeOut" }}
                  whileHover={{ scale: 1.1, y: -8 }}
                  animate={{
                    rotate: [0, 2],
                    transition: { duration: 2, repeat: Infinity, repeatType: "reverse" as const, ease: "easeInOut" }
                  }}
                  className="text-center p-4 sm:p-6 rounded-2xl glass border border-white/10 hover:border-primary-light/50 transition-all relative overflow-hidden group"
                >
                  {/* Hover gradient effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary-main/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={false}
                  />
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-10 -right-10 w-20 h-20 bg-primary-main/5 rounded-full blur-xl"
                  />
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    animate={{
                      rotate: [0, 10],
                      scale: [1, 1.1, 1],
                      y: [0, -3, 0]
                    }}
                    transition={{
                      rotate: { duration: 3, repeat: Infinity, repeatType: "reverse" as const, ease: "easeInOut" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                      y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                    }}
                  >
                    <stat.icon className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 ${stat.color} relative z-10`} />
                  </motion.div>
                  <motion.p
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 relative z-10"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-xs sm:text-sm text-slate-300 relative z-10">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Categories Section */}
        {featuredCategories.length > 0 && (
          <section id="services" className="w-full py-12 sm:py-16 lg:py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-10 sm:mb-12"
              >
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                  Popular <span className="text-primary-light">Services</span>
                </h2>
                <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
                  Choose from our most trusted service categories
                </p>
              </motion.div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                {featuredCategories.map((category, index) => {
                  const IconComponent = getCategoryIcon(category)
                  const providerLabel =
                    category.providerCount && category.providerCount > 0
                      ? `${category.providerCount}+ providers`
                      : 'Onboarding providers'

                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                    >
                      <Link
                        href={`/services?category=${category.id}`}
                        className="block rounded-2xl glass-dark border border-white/10 hover:border-primary-light/50 p-6 text-center transition-all group relative overflow-hidden"
                      >
                        {/* Animated background on hover */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-primary-main/20 to-primary-dark/20 opacity-0 group-hover:opacity-100 transition-opacity"
                          initial={false}
                        />
                        <motion.div
                          whileHover={{ scale: 1.15, rotate: 5 }}
                          className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gradient-to-br from-primary-main to-primary-dark rounded-xl flex items-center justify-center relative z-10 shadow-lg overflow-hidden group/icon"
                        >
                          {IconComponent && (
                            <motion.div
                              animate={{
                                rotate: [0, 8],
                                scale: [1, 1.12, 1],
                                y: [0, -4, 0]
                              }}
                              transition={{
                                rotate: { duration: 3.5, repeat: Infinity, repeatType: "reverse" as const, ease: "easeInOut" },
                                scale: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                                y: { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
                              }}
                              className="relative z-10"
                            >
                              <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
                            </motion.div>
                          )}
                          {/* Pulsing glow effect */}
                          <motion.div
                            className="absolute inset-0 bg-white/30 rounded-xl"
                            animate={{
                              scale: [1, 1.4],
                              opacity: [0.4, 0]
                            }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                          />
                          {/* Rotating gradient */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 rounded-xl"
                            animate={{
                              rotate: [0, 360]
                            }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                          />
                          {/* Sparkle effect */}
                          <motion.div
                            className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"
                            animate={{
                              scale: [0, 1, 0],
                              opacity: [0, 1, 0]
                            }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                          />
                        </motion.div>
                        <div className="relative z-10 space-y-1">
                          {/* Small pill to highlight popularity for the first 1–2 cards */}
                          {index < 2 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary-main/15 border border-primary-main/30 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-light">
                              <SparklesIcon className="w-3 h-3" />
                              Top choice
                            </span>
                          )}
                          <h3 className="font-bold text-sm sm:text-base group-hover:text-primary-light transition-colors">
                            {category.name}
                          </h3>
                          <p className="text-[11px] text-slate-300 line-clamp-2">
                            {category.description && category.description.trim().length > 0
                              ? category.description
                              : providerLabel}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {providerLabel}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-center mt-8 sm:mt-10"
              >
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-primary-main/50 bg-primary-main/10 px-6 py-3 font-semibold hover:bg-primary-main/20 transition-all"
                >
                  View All Services
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </div>
          </section>
        )}

        {/* All Categories – structured list of subcategories, limited preview */}
        {subCategories.length > 0 && (
          <section className="w-full py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-[#010B2A] to-[#000510]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10"
              >
                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                    Explore All <span className="text-primary-light">Services</span>
                  </h2>
                  <p className="text-slate-300 text-sm sm:text-base max-w-xl">
                    Browse the full catalog of sub‑services available on SERVICHAYA and deep–dive into any category.
                  </p>
                </div>
                <div className="text-xs sm:text-sm text-slate-400">
                  Showing&nbsp;
                  <span className="font-semibold text-slate-200">
                    {Math.min(5, subCategories.length)}
                  </span>
                  &nbsp;of&nbsp;
                  <span className="font-semibold text-slate-200">{subCategories.length}</span> services
                </div>
              </motion.div>

              <div className="space-y-3">
                {subCategories.slice(0, 5).map((sub, index) => {
                  const IconComponent = getCategoryIcon({
                    id: sub.id,
                    code: sub.code,
                    name: sub.name,
                    description: sub.description,
                    iconUrl: sub.iconUrl,
                    displayOrder: sub.displayOrder,
                    isFeatured: sub.isFeatured,
                    providerCount: sub.providerCount,
                  } as ServiceCategory)
                  const providerLabel =
                    sub.providerCount && sub.providerCount > 0
                      ? `${sub.providerCount} active providers`
                      : 'Providers onboarding'

                  return (
                    <motion.div
                      key={sub.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Link
                        href={`/services?subcategory=${sub.id}`}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-2xl bg-slate-950/60 hover:bg-slate-900/80 border border-white/10 hover:border-primary-main/50 px-4 sm:px-5 py-3 sm:py-4 transition-all group"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <motion.div
                            className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-primary-main/20 to-primary-dark/20 rounded-lg flex items-center justify-center relative overflow-hidden"
                            whileHover={{ scale: 1.05, rotate: 3 }}
                          >
                            {IconComponent && (
                              <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-primary-light drop-shadow-md" />
                            )}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary-light transition-colors truncate">
                              {sub.name}
                            </h3>
                            <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-2">
                              {sub.description && sub.description.trim().length > 0
                                ? sub.description
                                : `View all providers offering ${sub.name.toLowerCase()} services.`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
                          <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs text-slate-300">
                            <Users className="w-3.5 h-3.5 text-primary-light" />
                            {providerLabel}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-primary-light font-semibold group-hover:translate-x-0.5 transition-transform whitespace-nowrap">
                            View details
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>

              {/* CTA to view the complete list in Services page */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-6 flex justify-center"
              >
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 rounded-xl border border-primary-main/60 bg-primary-main/10 px-6 py-2.5 text-sm font-semibold text-primary-light hover:bg-primary-main/20 transition-all"
                >
                  View all categories
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </section>
        )}

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-12 sm:py-16 lg:py-20 bg-[#010B2A]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
                { title: 'Share Your Need', desc: 'Tell us what service you need, when, and where', icon: MapPin, color: 'from-blue-500 to-blue-600' },
                { title: 'Get Matched', desc: 'We connect you with verified nearby professionals', icon: Users, color: 'from-purple-500 to-purple-600' },
                { title: 'Track & Pay', desc: 'Follow progress, pay securely, and rate the service', icon: BadgeCheck, color: 'from-green-500 to-green-600' },
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
                  <motion.div
                    className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shadow-xl relative overflow-hidden`}
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
                      <step.icon className="w-8 h-8" />
                    </motion.div>
                    <motion.div
                      className="absolute inset-0 bg-white/20 rounded-2xl"
                      animate={{
                        scale: [1, 1.3],
                        opacity: [0.3, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    />
                  </motion.div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section id="why-us" className="w-full py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-[#010B2A] to-[#000510]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-12"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Why Choose <span className="text-primary-light">SERVICHAYA</span>?
              </h2>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
                Experience the difference with our customer-first approach
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
              {[
                { icon: Shield, title: 'Verified Professionals', desc: 'All providers are background checked', color: 'from-purple-500 to-purple-600' },
                { icon: Clock3, title: 'Fast Response', desc: 'Get matched in minutes, not hours', color: 'from-blue-500 to-blue-600' },
                { icon: DollarSign, title: 'Fair Pricing', desc: 'Transparent pricing, no hidden charges', color: 'from-green-500 to-green-600' },
                { icon: Lock, title: 'Secure Payments', desc: 'Escrow protected transactions', color: 'from-orange-500 to-orange-600' },
                { icon: MessageCircle, title: 'Real-time Updates', desc: 'Track your service from start to finish', color: 'from-pink-500 to-pink-600' },
                { icon: CheckCircle2, title: 'Quality Guarantee', desc: '100% satisfaction or money back', color: 'from-cyan-500 to-cyan-600' },
              ].map((benefit, idx) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="rounded-2xl glass-dark border border-white/10 p-5 sm:p-6 hover:border-primary-main/50 transition-all"
                >
                  <motion.div
                    className={`w-12 h-12 bg-gradient-to-br ${benefit.color} rounded-xl flex items-center justify-center mb-4 relative overflow-hidden`}
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    animate={{
                      rotate: [0, 8],
                      scale: [1, 1.08, 1]
                    }}
                    transition={{
                        rotate: { duration: 3.5, repeat: Infinity, repeatType: "reverse" as const, ease: "easeInOut" },
                      scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                    }}
                  >
                    <motion.div
                      animate={{
                        y: [0, -4, 0],
                        rotate: [0, 5]
                      }}
                      transition={{
                        y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                        rotate: { duration: 3, repeat: Infinity, repeatType: "reverse" as const, ease: "easeInOut" }
                      }}
                    >
                      <benefit.icon className="w-6 h-6 text-white relative z-10" />
                    </motion.div>
                    <motion.div
                      className="absolute inset-0 bg-white/20 rounded-xl"
                      animate={{
                        scale: [1, 1.4],
                        opacity: [0.4, 0]
                      }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                    />
                  </motion.div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-sm sm:text-base text-slate-400">{benefit.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <section className="w-full py-12 sm:py-16 lg:py-20 bg-[#010B2A]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-10 sm:mb-12"
              >
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                  What Our <span className="text-primary-light">Customers</span> Say
                </h2>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
                {testimonials.map((testimonial, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.2 }}
                    whileHover={{ scale: 1.03, y: -8 }}
                    className="rounded-3xl glass-dark border border-white/10 p-6 sm:p-8 hover:border-primary-main/50 transition-all"
                  >
                    <Quote className="w-8 h-8 text-primary-light mb-4 opacity-50" />
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(testimonial.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">{testimonial.reviewText}</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary-main to-primary-dark flex items-center justify-center font-bold text-white">
                        {testimonial.customerName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CU'}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{testimonial.customerName || 'Customer'}</div>
                        <div className="text-xs sm:text-sm text-slate-400">{testimonial.customerLocation || 'Location'}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section className="w-full py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-[#000510] to-[#010B2A]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-10"
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-main/15 border border-primary-main/30 text-xs font-semibold uppercase tracking-wide text-primary-light">
                <SparklesIcon className="w-4 h-4" />
                FAQs
              </span>
              <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold">
                Everything you need to know before you{' '}
                <span className="text-primary-light">book</span>
              </h2>
            </motion.div>

            <div className="space-y-3 sm:space-y-4">
              {[
                {
                  q: 'How does SERVICHAYA ensure service quality?',
                  a: 'Every professional on SERVICHAYA is background-verified and skill-screened. We track ratings after every job and only keep top-performing providers active on the platform.'
                },
                {
                  q: 'Are prices fixed or will they change later?',
                  a: 'Indicative pricing is shared upfront based on your requirement. For many services, final pricing is confirmed after on-site inspection and always communicated before work starts.'
                },
                {
                  q: 'Is my payment safe?',
                  a: 'Yes. Payments are processed securely and released to providers only after the job is marked complete. Sensitive details are never shared with third parties.'
                },
                {
                  q: 'What if I am not satisfied with the service?',
                  a: 'Our support team will work with you and the provider to find the best resolution. Where applicable, we arrange rework or refunds as per our quality assurance policy.'
                },
              ].map((item, index) => {
                const isOpen = openFaqIndex === index
                return (
                  <motion.div
                    key={item.q}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 text-left"
                    >
                      <div>
                        <p className="text-sm sm:text-base font-semibold text-white">{item.q}</p>
                      </div>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="shrink-0 w-6 h-6 rounded-full border border-white/30 flex items-center justify-center text-xs text-white"
                      >
                        {isOpen ? '-' : '+'}
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="px-4 sm:px-6 pb-3 sm:pb-5 text-sm text-slate-200"
                        >
                          <p className="pt-1 sm:pt-0">{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary-main via-primary-dark to-[#010B2A]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-6 text-white" />
              <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 text-white">
                Ready to Get Started?
              </h2>
              <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of satisfied customers. Book your first service in under 2 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/customer/jobs/create"
                  className="inline-flex items-center gap-2 rounded-xl bg-white text-primary-dark px-8 py-4 font-bold text-lg hover:bg-slate-100 transition-colors shadow-2xl"
                >
                  Book Your Service Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 bg-white/10 backdrop-blur-sm text-white px-8 py-4 font-bold text-lg hover:bg-white/20 transition-colors"
                >
                  Create Account
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-white/10 bg-gradient-to-b from-[#010B2A] to-[#000510] py-12 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-main to-primary-light rounded-xl flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-xl font-bold">SERVICHAYA</h4>
                </div>
                <p className="text-sm text-slate-400 mb-4">Premium home services, delivered reliably.</p>
                <div className="flex gap-3">
                  {[Facebook, Twitter, Instagram, Linkedin].map((SocialIcon, idx) => (
                    <motion.a
                      key={idx}
                      href="#"
                      whileHover={{ scale: 1.2, y: -3 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-primary-main/20 flex items-center justify-center transition-colors"
                    >
                      <SocialIcon className="w-5 h-5 text-slate-300" />
                    </motion.a>
                  ))}
                </div>
              </motion.div>
              {[
                {
                  title: 'Services',
                  links: [
                    { label: 'Browse All', href: '/services' },
                    { label: 'Book Service', href: '/customer/jobs/create' }
                  ]
                },
                {
                  title: 'Company',
                  links: [
                    { label: 'How It Works', href: '#how-it-works', onClick: () => scrollToSection('how-it-works') },
                    { label: 'Why Us', href: '#why-us', onClick: () => scrollToSection('why-us') }
                  ]
                },
                {
                  title: 'Account',
                  links: [
                    { label: 'Sign In', href: '/login' },
                    { label: 'Become Provider', href: '/provider/onboarding' }
                  ]
                }
              ].map((section, idx) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <h4 className="text-sm font-semibold mb-4 uppercase tracking-wide text-slate-300">{section.title}</h4>
                  <ul className="space-y-3 text-sm text-slate-400">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        {'onClick' in link && link.onClick ? (
                          <button
                            onClick={link.onClick}
                            className="hover:text-primary-light transition-colors flex items-center gap-2 group"
                          >
                            {link.label}
                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </button>
                        ) : (
                          <Link href={link.href} className="hover:text-primary-light transition-colors flex items-center gap-2 group">
                            {link.label}
                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="pt-8 border-t border-white/10 text-center text-sm text-slate-400"
            >
              <p>© 2026 SERVICHAYA. All rights reserved.</p>
            </motion.div>
          </div>
        </footer>

        {/* Scroll to Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollToTop}
              className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-main to-primary-light rounded-full flex items-center justify-center shadow-2xl z-50 hover:shadow-primary-main/50 transition-all"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-6 h-6 text-white" />
            </motion.button>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
