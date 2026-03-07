'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
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
  TrendingUp,
  Award,
  Heart,
  ArrowUpRight,
  Quote,
  Lock,
  DollarSign,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  ThumbsUp,
  Timer,
  Phone,
  Mail,
} from 'lucide-react'
import { getPlatformStats, getFeaturedServices, getFeaturedTestimonials, type PlatformStatsDto, type FeaturedServiceDto, type TestimonialDto } from '@/lib/services/public'
import { getAllCategories } from '@/lib/services/service'

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0])

  const [stats, setStats] = useState<PlatformStatsDto | null>(null)
  const [featuredServices, setFeaturedServices] = useState<FeaturedServiceDto[]>([])
  const [testimonials, setTestimonials] = useState<TestimonialDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsData, servicesData, testimonialsData] = await Promise.all([
        getPlatformStats().catch(() => null),
        getFeaturedServices(4).catch(() => []),
        getFeaturedTestimonials(3).catch(() => []),
      ])
      
      setStats(statsData)
      setFeaturedServices(servicesData)
      setTestimonials(testimonialsData)
    } catch (error) {
      console.error('Failed to load home page data:', error)
    } finally {
      setLoading(false)
    }
  }

  const displayStats = stats ? [
    { value: `${(stats.verifiedProviders || 0).toLocaleString()}+`, label: 'Verified Providers', icon: Users, color: 'text-blue-400' },
    { value: `${(stats.completedJobs || 0).toLocaleString()}+`, label: 'Requests Completed', icon: CheckCircle2, color: 'text-green-400' },
    { value: `${(typeof stats.averageRating === 'number' ? stats.averageRating : parseFloat(String(stats.averageRating || 0))).toFixed(1)}/5`, label: 'Average Rating', icon: Star, color: 'text-amber-400' },
    { value: `${(stats.citiesCovered || 0).toLocaleString()}+`, label: 'Cities Covered', icon: MapPin, color: 'text-purple-400' },
  ] : [
    { value: '2,500+', label: 'Verified Providers', icon: Users, color: 'text-blue-400' },
    { value: '120K+', label: 'Requests Completed', icon: CheckCircle2, color: 'text-green-400' },
    { value: '4.8/5', label: 'Average Rating', icon: Star, color: 'text-amber-400' },
    { value: '35+', label: 'Cities Covered', icon: MapPin, color: 'text-purple-400' },
  ]

  const displayServices = featuredServices.length > 0 ? featuredServices.map((service, index) => ({
    name: service.name,
    eta: service.avgResponseTime ? `${service.avgResponseTime} mins avg arrival` : 'Available now',
    rating: service.avgRating ? service.avgRating.toFixed(1) : '4.5',
    color: service.color || ['from-yellow-400 to-orange-500', 'from-blue-400 to-blue-600', 'from-green-400 to-emerald-600', 'from-purple-400 to-purple-600'][index % 4],
  })) : [
    { name: 'Electrical Repair', eta: '45 mins avg arrival', rating: '4.8', color: 'from-yellow-400 to-orange-500' },
    { name: 'Plumbing Services', eta: '50 mins avg arrival', rating: '4.7', color: 'from-blue-400 to-blue-600' },
    { name: 'Home Deep Cleaning', eta: 'Scheduled slots', rating: '4.9', color: 'from-green-400 to-emerald-600' },
    { name: 'Appliance Setup', eta: 'Same day available', rating: '4.6', color: 'from-purple-400 to-purple-600' },
  ]

  return (
    <div className="min-h-screen bg-[#010B2A] text-white overflow-x-hidden">
      {/* Enhanced Header with Glass Morphism */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="sticky top-0 z-50 border-b border-white/10 glass-dark"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/" className="text-2xl sm:text-3xl font-bold tracking-tight hover:opacity-80 transition-opacity">
              SERVI<span className="text-primary-light gradient-text">CHAYA</span>
            </Link>
          </motion.div>
          <nav className="hidden md:flex items-center gap-8 lg:gap-10 text-sm text-slate-300">
            {['Services', 'How it works', 'Why us'].map((item, idx) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="hover:text-white transition-colors relative group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-light group-hover:w-full transition-all duration-300" />
              </motion.a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="/login" 
                className="rounded-full border border-white/25 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold hover:bg-white/10 transition whitespace-nowrap backdrop-blur-sm"
              >
                Sign in
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="/customer/jobs/create" 
                className="hidden sm:inline-flex rounded-full bg-gradient-to-r from-primary-main to-primary-light px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold hover:shadow-lg hover:shadow-primary-main/50 transition-all whitespace-nowrap glow-hover"
              >
                Book a service
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main>
        {/* Enhanced Hero Section with Parallax */}
        <section ref={heroRef} className="relative overflow-hidden py-12 sm:py-16 md:py-24" id="services">
          {/* Enhanced Animated Background Elements */}
          <motion.div 
            className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-primary-main/40 to-blue-600/30 blur-3xl"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
              x: [0, 50, 0],
              y: [0, 30, 0]
            }}
            transition={{ 
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute top-20 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-500/20 blur-3xl"
            animate={{ 
              scale: [1, 1.4, 1],
              opacity: [0.2, 0.5, 0.2],
              x: [0, -30, 0],
              y: [0, 50, 0]
            }}
            transition={{ 
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          <motion.div 
            className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-gradient-to-br from-accent-green/20 to-emerald-400/15 blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          <motion.div 
            style={{ y, opacity }}
            className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 items-center relative z-10"
          >
            {/* Left Content with Enhanced Animations */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 text-xs rounded-full border border-white/20 glass mb-6 group"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05, borderColor: 'rgba(59, 130, 246, 0.5)' }}
              >
                <Sparkles className="w-4 h-4 text-accent-orange animate-pulse" />
                <span className="font-medium">Customer-first home service platform</span>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  <Award className="w-3.5 h-3.5 text-primary-light ml-1" />
                </motion.div>
              </motion.div>
              
              <motion.h1 
                className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-bold leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Premium Home
                <br />
                Services, <motion.span 
                  className="text-primary-light inline-block"
                  animate={{ 
                    backgroundPosition: ['0%', '100%', '0%'],
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    background: 'linear-gradient(90deg, #3B82F6, #10B981, #3B82F6)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Delivered
                </motion.span>
                <br />
                <motion.span 
                  className="text-primary-light inline-block"
                  animate={{ 
                    backgroundPosition: ['0%', '100%', '0%'],
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 0.5
                  }}
                  style={{
                    background: 'linear-gradient(90deg, #3B82F6, #10B981, #3B82F6)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Reliably.
                </motion.span>
              </motion.h1>
              
              <motion.p 
                className="mt-6 max-w-2xl text-slate-300 text-base sm:text-lg leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                Discover trusted local professionals without creating an account first.
                Browse services, compare trust signals, and log in only when you are ready to place a booking.
              </motion.p>

              <motion.div 
                className="mt-8 flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    href="/services" 
                    className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-white to-slate-50 text-slate-900 px-8 py-4 font-semibold hover:shadow-2xl hover:shadow-white/20 transition-all relative overflow-hidden"
                  >
                    <span className="relative z-10">Explore services</span>
                    <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-main to-primary-light opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="absolute inset-0 bg-gradient-to-r from-primary-main to-primary-light opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white flex items-center justify-center gap-2">
                      Explore services <ArrowRight className="w-5 h-5" />
                    </span>
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    href="/login" 
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 font-semibold hover:bg-white/10 hover:border-white/50 transition-all glass backdrop-blur-sm"
                  >
                    Continue with account
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              </motion.div>

              {/* Enhanced Stats Grid */}
              <motion.div 
                className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {displayStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    whileHover={{ scale: 1.1, y: -8, rotate: 2 }}
                    className="rounded-2xl border border-white/10 glass p-5 hover:border-primary-light/50 hover:glow transition-all cursor-default group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <stat.icon className={`w-5 h-5 ${stat.color} group-hover:scale-125 transition-transform`} />
                        <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-white to-slate-300 bg-clip-text text-transparent">{stat.value}</p>
                      </div>
                      <p className="text-xs text-slate-300 font-medium">{stat.label}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Enhanced Right Content - Live Category Snapshot */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotateY: -15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              whileHover={{ scale: 1.02, rotateY: 2 }}
              className="rounded-3xl bg-gradient-to-br from-white to-slate-50 text-slate-900 p-7 sm:p-8 border border-slate-200/50 shadow-2xl hover:shadow-[0_20px_60px_rgba(59,130,246,0.3)] transition-all relative overflow-hidden group"
            >
              {/* Shimmer overlay */}
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              {/* Gradient border effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-main/20 via-transparent to-accent-green/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Zap className="w-5 h-5 text-primary-main" />
                  </motion.div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-main">Live category snapshot</p>
                  <motion.div
                    className="ml-auto w-2 h-2 rounded-full bg-green-500"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.7, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity
                    }}
                  />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mt-2 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  What customers book most
                </h2>
                <div className="mt-6 space-y-3">
                  {displayServices.map((service, index) => (
                    <motion.div
                      key={service.name}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.15 }}
                      whileHover={{ scale: 1.03, x: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                      className="rounded-xl border-2 border-slate-200 p-4 hover:border-primary-main/50 hover:bg-gradient-to-br hover:from-primary-main/5 hover:to-transparent transition-all cursor-pointer group/item relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/item:translate-x-full transition-transform duration-1000" />
                      <div className="relative z-10 flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${service.color}`} />
                            <p className="font-bold text-base sm:text-lg group-hover/item:text-primary-main transition-colors">{service.name}</p>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-500">{service.eta}</p>
                        </div>
                        <div className="inline-flex items-center gap-1 text-amber-600 font-bold bg-gradient-to-br from-amber-50 to-amber-100 px-3 py-1.5 rounded-lg border border-amber-200">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm">{service.rating}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  whileHover={{ x: 5 }}
                  className="mt-6"
                >
                  <Link 
                    href="/services" 
                    className="group inline-flex items-center gap-2 text-primary-main font-bold hover:text-primary-dark transition-colors"
                  >
                    Browse all categories 
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Enhanced How It Works Section - Dark Theme */}
        <section id="how-it-works" className="relative bg-[#010B2A] text-white py-16 sm:py-20 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0">
            <motion.div
              className="absolute top-0 left-0 w-full h-full"
              animate={{
                background: [
                  'radial-gradient(circle at 30% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 70% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 30% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
                ]
              }}
              transition={{ duration: 8, repeat: Infinity }}
            />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <motion.span
                className="inline-block px-4 py-2 text-xs uppercase tracking-wider text-primary-light font-bold bg-primary-main/20 border border-primary-main/30 rounded-full mb-4 glass"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                How it works
              </motion.span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-4 bg-gradient-to-r from-white via-primary-light to-white bg-clip-text text-transparent">
                Zero-friction journey for customers
              </h2>
            </motion.div>
            
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[
                { title: 'Share location & need', desc: 'Add requirement, preferred time and address details.', icon: MapPin, color: 'from-blue-500 via-blue-600 to-blue-700', borderColor: 'border-blue-500/30' },
                { title: 'Get matched fast', desc: 'Our matching engine routes verified nearby professionals.', icon: Users, color: 'from-purple-500 via-purple-600 to-purple-700', borderColor: 'border-purple-500/30' },
                { title: 'Track, pay and review', desc: 'Get updates, close payment, and rate service quality.', icon: BadgeCheck, color: 'from-accent-green via-green-600 to-emerald-700', borderColor: 'border-green-500/30' },
              ].map((step, idx) => (
                <motion.article
                  key={step.title}
                  initial={{ opacity: 0, y: 50, rotateX: -15 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: idx * 0.2, duration: 0.6 }}
                  whileHover={{ scale: 1.05, y: -12, rotateY: 5 }}
                  className="relative rounded-3xl border-2 border-white/10 glass-dark p-8 hover:border-primary-main/50 hover:shadow-2xl hover:shadow-primary-main/20 transition-all group"
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-20 transition-opacity`} />
                  
                  {/* Number badge */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-to-br from-primary-main to-primary-dark text-white flex items-center justify-center font-bold text-lg shadow-xl border-2 border-white/20">
                    {idx + 1}
                  </div>
                  
                  <motion.div 
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <step.icon className="w-8 h-8" />
                  </motion.div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Step {idx + 1}</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 group-hover:text-primary-light transition-colors mb-3 text-white">{step.title}</h3>
                  <p className="text-base text-slate-300 leading-relaxed">{step.desc}</p>
                  
                  {/* Decorative arrow */}
                  {idx < 2 && (
                    <motion.div
                      className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 text-primary-main/40"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.2 + 0.3 }}
                    >
                      <ArrowRight className="w-12 h-12" />
                    </motion.div>
                  )}
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Trust & Security Section */}
        <section className="relative py-12 sm:py-16 bg-[#010B2A] border-y border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Trusted by Thousands</h2>
              <p className="text-slate-400 text-sm sm:text-base">Your security and satisfaction are our top priorities</p>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {[
                { icon: Shield, title: 'Verified Providers', desc: 'Background checked' },
                { icon: Lock, title: 'Secure Payments', desc: 'Escrow protected' },
                { icon: BadgeCheck, title: 'Quality Guaranteed', desc: '100% satisfaction' },
                { icon: Clock3, title: '24/7 Support', desc: 'Always available' },
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="text-center p-4 sm:p-6 rounded-2xl glass border border-white/10 hover:border-primary-main/50 transition-all"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 bg-gradient-to-br from-primary-main to-primary-dark rounded-xl flex items-center justify-center">
                    <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base mb-1">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="relative py-16 sm:py-20 bg-[#010B2A] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-main/5 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <motion.span
                className="inline-block px-4 py-2 text-xs uppercase tracking-wider text-primary-light font-bold bg-primary-main/20 border border-primary-main/30 rounded-full mb-4 glass"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                Customer Stories
              </motion.span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-primary-light to-white bg-clip-text text-transparent">
                Loved by Customers Nationwide
              </h2>
              <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
                See what our customers are saying about their experience with SERVICHAYA
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {(testimonials.length > 0 ? testimonials.map((t) => ({
                name: t.customerName,
                location: t.customerLocation || 'Customer',
                rating: t.rating,
                text: t.reviewText,
                service: t.serviceName || 'Service',
                avatar: t.customerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              })) : [
                {
                  name: 'Rajesh Kumar',
                  location: 'Mumbai',
                  rating: 5,
                  text: 'Found an electrician within 30 minutes! The service was professional and the pricing was transparent. Highly recommend!',
                  service: 'Electrical Repair',
                  avatar: 'RK'
                },
                {
                  name: 'Priya Sharma',
                  location: 'Delhi',
                  rating: 5,
                  text: 'Best platform for home services. The plumber arrived on time, fixed everything perfectly, and the payment was secure.',
                  service: 'Plumbing Services',
                  avatar: 'PS'
                },
                {
                  name: 'Amit Patel',
                  location: 'Bangalore',
                  rating: 5,
                  text: 'Used SERVICHAYA for deep cleaning. The team was thorough, professional, and left my home spotless. Will use again!',
                  service: 'Home Cleaning',
                  avatar: 'AP'
                },
              ]).map((testimonial, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: idx * 0.2, duration: 0.6 }}
                  whileHover={{ scale: 1.03, y: -8 }}
                  className="rounded-3xl glass-dark border border-white/10 p-6 sm:p-8 hover:border-primary-main/50 hover:shadow-2xl transition-all relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-main/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <Quote className="w-8 h-8 text-primary-light mb-4 opacity-50" />
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">{testimonial.text}</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary-main to-primary-dark flex items-center justify-center font-bold text-white text-sm sm:text-base">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm sm:text-base">{testimonial.name}</div>
                        <div className="text-xs sm:text-sm text-slate-400">{testimonial.location} • {testimonial.service}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits/Features Section */}
        <section className="relative py-16 sm:py-20 bg-[#010B2A] border-y border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Why Choose <span className="text-primary-light">SERVICHAYA</span>?
              </h2>
              <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
                Experience the difference with our customer-first approach
              </p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[
                { icon: Timer, title: 'Fast Response', desc: 'Get matched with providers in minutes, not hours', color: 'from-blue-500 to-blue-600' },
                { icon: DollarSign, title: 'Fair Pricing', desc: 'Transparent pricing with no hidden charges', color: 'from-green-500 to-green-600' },
                { icon: Shield, title: 'Verified Professionals', desc: 'All providers are background checked and verified', color: 'from-purple-500 to-purple-600' },
                { icon: MessageCircle, title: 'Real-time Updates', desc: 'Track your service request from start to finish', color: 'from-orange-500 to-orange-600' },
                { icon: ThumbsUp, title: 'Quality Guarantee', desc: '100% satisfaction guarantee or money back', color: 'from-pink-500 to-pink-600' },
                { icon: CheckCircle2, title: 'Easy Booking', desc: 'Book services in under 2 minutes, no account needed', color: 'from-cyan-500 to-cyan-600' },
              ].map((benefit, idx) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="rounded-2xl glass-dark border border-white/10 p-6 hover:border-primary-main/50 transition-all group"
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${benefit.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                    <benefit.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 text-white">{benefit.title}</h3>
                  <p className="text-sm sm:text-base text-slate-400 leading-relaxed">{benefit.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="relative py-16 sm:py-20 bg-[#010B2A] overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <motion.span
                className="inline-block px-4 py-2 text-xs uppercase tracking-wider text-primary-light font-bold bg-primary-main/20 border border-primary-main/30 rounded-full mb-4 glass"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                Frequently Asked
              </motion.span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Got Questions? <span className="text-primary-light">We've Got Answers</span>
              </h2>
            </motion.div>
            
            <div className="space-y-4">
              {[
                {
                  q: 'Do I need to create an account to book a service?',
                  a: 'No! You can browse services and compare providers without creating an account. You only need to sign in when you\'re ready to place a booking.'
                },
                {
                  q: 'How quickly can I get a service provider?',
                  a: 'Most services can be matched within 30-60 minutes. For emergency services, we prioritize faster matching. You\'ll receive real-time updates on provider availability.'
                },
                {
                  q: 'Are all providers verified and background checked?',
                  a: 'Yes! All providers on SERVICHAYA go through a comprehensive verification process including identity checks, background verification, and skill assessments before they can accept jobs.'
                },
                {
                  q: 'How does payment work?',
                  a: 'We use a secure escrow system. Your payment is held securely until the service is completed to your satisfaction. You can pay via multiple methods including UPI, cards, and wallets.'
                },
                {
                  q: 'What if I\'m not satisfied with the service?',
                  a: 'We offer a 100% satisfaction guarantee. If you\'re not happy with the service, contact our support team within 24 hours and we\'ll work to resolve the issue or provide a refund.'
                },
                {
                  q: 'Can I book services in advance?',
                  a: 'Absolutely! You can schedule services for future dates and times that work best for you. Our platform supports both immediate and scheduled bookings.'
                },
              ].map((faq, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-2xl glass-dark border border-white/10 p-6 hover:border-primary-main/50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary-main/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <HelpCircle className="w-5 h-5 text-primary-light" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-2 text-base sm:text-lg">{faq.q}</h3>
                      <p className="text-slate-400 text-sm sm:text-base leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative py-16 sm:py-20 bg-gradient-to-br from-primary-main via-primary-dark to-[#010B2A] overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0">
            <motion.div
              className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
                x: [0, 50, 0],
                y: [0, -30, 0]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-96 h-96 bg-accent-green/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
                x: [0, -30, 0],
                y: [0, 50, 0]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block mb-6"
              >
                <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
              </motion.div>
              <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 text-white">
                Ready to Get Started?
              </h2>
              <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of satisfied customers. Book your first service in under 2 minutes and experience the SERVICHAYA difference.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/customer/jobs/create"
                    className="inline-flex items-center gap-2 rounded-xl bg-white text-primary-dark px-8 py-4 font-bold text-lg hover:bg-slate-100 transition-colors shadow-2xl hover:shadow-3xl"
                  >
                    Book Your Service Now
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 bg-white/10 backdrop-blur-sm text-white px-8 py-4 font-bold text-lg hover:bg-white/20 transition-colors"
                  >
                    Create Account
                  </Link>
                </motion.div>
              </div>
              <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent-green" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent-green" />
                  <span>100% satisfaction guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent-green" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Enhanced Why Us Section */}
        <section id="why-us" className="relative py-16 sm:py-20 bg-[#010B2A] overflow-hidden border-t border-white/10">
          {/* Animated background */}
          <div className="absolute inset-0">
            <motion.div
              className="absolute top-0 left-0 w-full h-full"
              animate={{
                background: [
                  'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                ]
              }}
              transition={{ duration: 10, repeat: Infinity }}
            />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-6 sm:gap-8 relative z-10">
            <motion.article
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl border border-white/15 glass-dark p-8 sm:p-10 hover:border-primary-main/50 hover:glow transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-main/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <Heart className="w-8 h-8 text-accent-orange" />
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold">Why customers prefer ServiChaya</h3>
                </div>
                <ul className="space-y-5 text-base sm:text-lg text-slate-300">
                  {[
                    { icon: Shield, text: 'Identity and profile checks for providers.' },
                    { icon: Clock3, text: 'Reliable slots and emergency request handling.' },
                    { icon: BadgeCheck, text: 'Transparent status updates and post-service reviews.' },
                  ].map((item, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-4 group/item"
                    >
                      <motion.div
                        className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover/item:bg-emerald-500/30 transition-colors"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <item.icon className="w-5 h-5 text-emerald-400" />
                      </motion.div>
                      <span className="pt-1.5">{item.text}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.article>
            
            <motion.article
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl border-2 border-primary-main/40 bg-gradient-to-br from-primary-main/20 via-primary-main/15 to-primary-main/10 p-8 sm:p-10 hover:border-primary-main/60 hover:shadow-2xl hover:shadow-primary-main/30 transition-all relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-main/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block mb-4"
                >
                  <TrendingUp className="w-8 h-8 text-primary-light" />
                </motion.div>
                <p className="text-slate-200 text-base sm:text-lg font-medium mb-2">Ready to experience it?</p>
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">Book your first request in under 2 minutes.</h3>
                <div className="flex flex-wrap gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link 
                      href="/customer/jobs/create" 
                      className="inline-flex items-center gap-2 rounded-xl bg-white text-primary-dark px-8 py-4 font-bold hover:bg-slate-100 transition-colors shadow-xl hover:shadow-2xl"
                    >
                      Start booking
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link 
                      href="/login" 
                      className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 px-8 py-4 font-bold hover:bg-white/10 transition-colors glass backdrop-blur-sm"
                    >
                      Sign in / Register
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.article>
          </div>
        </section>

        {/* Enhanced Footer */}
        <footer className="relative border-t border-white/10 bg-gradient-to-b from-[#010B2A] to-[#000510] py-12 sm:py-16">
          <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(0deg,transparent,white)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h4 className="text-xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">SERVICHAYA</h4>
                <p className="text-sm text-slate-400 leading-relaxed">Premium home services, delivered reliably.</p>
              </motion.div>
              {['Services', 'Company', 'Account'].map((section, idx) => (
                <motion.div
                  key={section}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <h4 className="text-sm font-semibold mb-4 uppercase tracking-wide text-slate-300">{section}</h4>
                  <ul className="space-y-3 text-sm text-slate-400">
                    {section === 'Services' && (
                      <>
                        <li><Link href="/services" className="hover:text-white transition-colors flex items-center gap-2 group">Browse All <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></Link></li>
                        <li><Link href="/customer/jobs/create" className="hover:text-white transition-colors flex items-center gap-2 group">Book Service <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></Link></li>
                      </>
                    )}
                    {section === 'Company' && (
                      <>
                        <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                        <li><a href="#why-us" className="hover:text-white transition-colors">Why Us</a></li>
                      </>
                    )}
                    {section === 'Account' && (
                      <>
                        <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                        <li><Link href="/provider/onboarding" className="hover:text-white transition-colors">Become Provider</Link></li>
                      </>
                    )}
                  </ul>
                </motion.div>
              ))}
            </div>
            <motion.div 
              className="pt-8 border-t border-white/10 text-center text-sm text-slate-400"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <p>© 2026 SERVICHAYA. All rights reserved.</p>
            </motion.div>
          </div>
        </footer>
      </main>
    </div>
  )
}
