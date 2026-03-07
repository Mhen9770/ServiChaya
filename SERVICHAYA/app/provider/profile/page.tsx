'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getOnboardingStatus, getProviderProfile, updateProviderProfile, updateProviderSkills, updateProviderServiceAreas, getAllServiceSkills, type ProviderProfileDto, type UpdateProviderProfileDto, type OnboardingStep3Dto, type OnboardingStep4Dto } from '@/lib/services/provider'
import { getAllActiveCities, getZonesByCity, getPodsByZone } from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import { 
  User, Building2, Star, CheckCircle2, Clock, MapPin, 
  Briefcase, Award, Shield, Edit2, Save, X, ToggleLeft, ToggleRight,
  Plus, Trash2, Upload, FileText, Sparkles, TrendingUp, Users, Mail, Phone
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SkillFormData {
  skillId: number
  isPrimary: boolean
  experienceYears: number
  certificationName: string
  certificationDocumentUrl: string
}

interface ServiceAreaFormData {
  cityId: number
  zoneId: number
  podId: number
  serviceRadiusKm: number
  isPrimary: boolean
}

export default function ProviderProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProviderProfileDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'locations'>('overview')
  
  // Master data
  const [availableSkills, setAvailableSkills] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [zones, setZones] = useState<Record<number, any[]>>({})
  const [pods, setPods] = useState<Record<number, any[]>>({})
  const [loadingMasterData, setLoadingMasterData] = useState(false)

  // Form data
  const [formData, setFormData] = useState<UpdateProviderProfileDto>({
    businessName: '',
    bio: '',
    experienceYears: 0,
    isAvailable: true
  })
  const [skillsData, setSkillsData] = useState<SkillFormData[]>([])
  const [serviceAreasData, setServiceAreasData] = useState<ServiceAreaFormData[]>([])

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login?redirect=/provider/profile')
      return
    }
    if (currentUser.role !== 'SERVICE_PROVIDER') {
      router.push('/dashboard')
      return
    }
    checkProviderAndFetchProfile(currentUser.userId)
  }, [router])

  const checkProviderAndFetchProfile = async (userId: number) => {
    try {
      setLoading(true)
      const status = await getOnboardingStatus(userId)
      if (!status.providerId) {
        router.push('/provider/onboarding')
        return
      }
      await Promise.all([
        fetchProfile(status.providerId),
        loadMasterData()
      ])
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const loadMasterData = async () => {
    try {
      setLoadingMasterData(true)
      const [skills, citiesData] = await Promise.all([
        getAllServiceSkills(),
        getAllActiveCities()
      ])
      setAvailableSkills(skills.filter(s => s.isActive))
      setCities(citiesData)
    } catch (error) {
      console.error('Failed to load master data:', error)
      toast.error('Failed to load master data')
    } finally {
      setLoadingMasterData(false)
    }
  }

  const loadZonesForCity = async (cityId: number) => {
    if (zones[cityId]) return
    try {
      const zonesData = await getZonesByCity(cityId)
      setZones(prev => ({ ...prev, [cityId]: zonesData }))
    } catch (error) {
      console.error('Failed to load zones:', error)
    }
  }

  const loadPodsForZone = async (zoneId: number) => {
    if (pods[zoneId]) return
    try {
      const podsData = await getPodsByZone(zoneId)
      setPods(prev => ({ ...prev, [zoneId]: podsData }))
    } catch (error) {
      console.error('Failed to load pods:', error)
    }
  }

  const fetchProfile = async (providerId: number) => {
    try {
      const data = await getProviderProfile(providerId)
      setProfile(data)
      setFormData({
        businessName: data.businessName || '',
        bio: data.bio || '',
        experienceYears: data.experienceYears || 0,
        isAvailable: data.isAvailable
      })
      
      // Initialize skills data
      if (data.skills) {
        setSkillsData(data.skills.map(s => ({
          skillId: s.skillId,
          isPrimary: s.isPrimary || false,
          experienceYears: s.experienceYears || 0,
          certificationName: s.certificationName || '',
          certificationDocumentUrl: s.certificationDocumentUrl || ''
        })))
      }
      
      // Initialize service areas data
      if (data.serviceAreas) {
        setServiceAreasData(data.serviceAreas.map(a => ({
          cityId: a.cityId,
          zoneId: a.zoneId || 0,
          podId: a.podId,
          serviceRadiusKm: a.serviceRadiusKm,
          isPrimary: a.isPrimary || false
        })))
        
        // Preload zones and pods for existing service areas
        const uniqueCityIds = [...new Set(data.serviceAreas.map(a => a.cityId))]
        const uniqueZoneIds = [...new Set(data.serviceAreas.map(a => a.zoneId).filter(z => z))]
        
        await Promise.all([
          ...uniqueCityIds.map(cityId => loadZonesForCity(cityId)),
          ...uniqueZoneIds.map(zoneId => loadPodsForZone(zoneId))
        ])
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      toast.error('Failed to load profile')
    }
  }

  const handleSaveBasicInfo = async () => {
    if (!profile) return

    const validationError = validateBasicForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      setSaving(true)
      const updated = await updateProviderProfile(profile.id, {
        ...formData,
        businessName: formData.businessName?.trim(),
        bio: formData.bio?.trim()
      })
      setProfile(updated)
      setEditingSection(null)
      toast.success('Profile updated successfully! 🎉')
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to update profile'
      toast.error(errorMsg)
      console.error('Update profile error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSkills = async () => {
    if (!profile) return

    if (skillsData.length === 0) {
      toast.error('Please add at least one skill')
      return
    }

    const primaryCount = skillsData.filter(s => s.isPrimary).length
    if (primaryCount !== 1) {
      toast.error('Please mark exactly one skill as primary')
      return
    }

    try {
      setSaving(true)
      const skillsPayload: OnboardingStep3Dto['skills'] = skillsData.map(s => ({
        skillId: s.skillId,
        isPrimary: s.isPrimary,
        experienceYears: s.experienceYears,
        certificationName: s.certificationName || undefined,
        certificationDocumentUrl: s.certificationDocumentUrl || undefined
      }))
      
      const updated = await updateProviderSkills(profile.id, skillsPayload)
      setProfile(updated)
      setEditingSection(null)
      toast.success('Skills updated successfully! 🎉')
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to update skills'
      toast.error(errorMsg)
      console.error('Update skills error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveServiceAreas = async () => {
    if (!profile) return

    if (serviceAreasData.length === 0) {
      toast.error('Please add at least one service area')
      return
    }

    const primaryCount = serviceAreasData.filter(a => a.isPrimary).length
    if (primaryCount !== 1) {
      toast.error('Please mark exactly one service area as primary')
      return
    }

    try {
      setSaving(true)
      const areasPayload: OnboardingStep4Dto['serviceAreas'] = serviceAreasData.map(a => ({
        cityId: a.cityId,
        zoneId: a.zoneId,
        podId: a.podId,
        serviceRadiusKm: a.serviceRadiusKm,
        isPrimary: a.isPrimary
      }))
      
      const updated = await updateProviderServiceAreas(profile.id, areasPayload)
      setProfile(updated)
      setEditingSection(null)
      toast.success('Service areas updated successfully! 🎉')
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to update service areas'
      toast.error(errorMsg)
      console.error('Update service areas error:', error)
    } finally {
      setSaving(false)
    }
  }

  const validateBasicForm = (): string | null => {
    if (formData.businessName && formData.businessName.trim().length < 3) {
      return 'Business name must be at least 3 characters'
    }
    if (formData.bio && formData.bio.trim().length < 10) {
      return 'Bio must be at least 10 characters'
    }
    if (formData.experienceYears && formData.experienceYears < 0) {
      return 'Experience years cannot be negative'
    }
    return null
  }

  const addSkill = () => {
    setSkillsData([...skillsData, {
      skillId: 0,
      isPrimary: skillsData.length === 0,
      experienceYears: 0,
      certificationName: '',
      certificationDocumentUrl: ''
    }])
  }

  const removeSkill = (index: number) => {
    setSkillsData(skillsData.filter((_, i) => i !== index))
  }

  const addServiceArea = () => {
    setServiceAreasData([...serviceAreasData, {
      cityId: 0,
      zoneId: 0,
      podId: 0,
      serviceRadiusKm: 5,
      isPrimary: serviceAreasData.length === 0
    }])
  }

  const removeServiceArea = (index: number) => {
    setServiceAreasData(serviceAreasData.filter((_, i) => i !== index))
  }

  if (loading) {
    return <Loader fullScreen text="Loading profile..." />
  }

  if (!profile) {
    return (
      <div className="px-6 py-6">
        <p className="text-neutral-textSecondary">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-background via-white to-neutral-background">
      {/* Enhanced Header Section with Modern Design */}
      <div className="bg-gradient-to-br from-primary-main via-primary-light to-primary-dark text-white relative overflow-hidden">
        {/* Enhanced Decorative Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.15, 0.1],
              x: [0, 30, 0],
              y: [0, -20, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1],
              x: [0, -20, 0],
              y: [0, 30, 0]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-accent-green/10 via-primary-light/10 to-accent-green/10 rounded-full blur-3xl"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{
              rotate: {
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              },
              scale: {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-6 lg:py-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4"
          >
            <div className="flex items-center gap-3 md:gap-4 lg:gap-6 w-full md:w-auto">
              {/* Enhanced Profile Image/Avatar */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-xl rounded-xl md:rounded-2xl flex items-center justify-center border-2 border-white/40 shadow-2xl overflow-hidden flex-shrink-0 group/avatar"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 group-hover/avatar:from-white/40 group-hover/avatar:to-white/20 transition-all" />
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white relative z-10 group-hover/avatar:scale-110 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-xl md:rounded-2xl bg-white/20"
                  animate={{
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display mb-1 truncate">
                  {profile.businessName || 'Provider Profile'}
                </h1>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className="px-2 sm:px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs font-semibold border border-white/30 whitespace-nowrap">
                    {profile.providerCode}
                  </span>
                  {profile.rating ? (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-300 text-yellow-300" />
                      <span className="font-semibold text-xs sm:text-sm">{profile.rating.toFixed(1)}</span>
                      {profile.ratingCount && (
                        <span className="text-white/80 text-xs">({profile.ratingCount})</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-white/70 text-xs">No ratings yet</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
              <motion.div
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 sm:px-4 py-2 rounded-xl font-bold text-xs backdrop-blur-md border-2 ${
                  profile.verificationStatus === 'VERIFIED'
                    ? 'bg-gradient-to-r from-accent-green/40 to-green-600/40 border-accent-green/80 text-white shadow-xl shadow-accent-green/30 glow-hover'
                    : 'bg-gradient-to-r from-yellow-500/40 to-orange-500/40 border-yellow-500/80 text-white shadow-xl shadow-yellow-500/30'
                } relative overflow-hidden group/badge`}
              >
                <div className="absolute inset-0 shimmer opacity-0 group-hover/badge:opacity-100 transition-opacity" />
                <div className="flex items-center gap-2 relative z-10">
                  <motion.div
                    animate={profile.verificationStatus === 'VERIFIED' ? {
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle2 className="w-4 h-4 sm:w-4 sm:h-4" />
                  </motion.div>
                  <span className="whitespace-nowrap">{profile.verificationStatus}</span>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 sm:px-4 py-2 rounded-xl font-bold text-xs backdrop-blur-md border-2 whitespace-nowrap ${
                  profile.isAvailable
                    ? 'bg-gradient-to-r from-accent-green/40 to-green-600/40 border-accent-green/80 text-white shadow-xl shadow-accent-green/30 glow-hover'
                    : 'bg-gradient-to-r from-gray-500/40 to-gray-600/40 border-gray-500/80 text-white shadow-xl'
                } relative overflow-hidden group/badge`}
              >
                <div className="absolute inset-0 shimmer opacity-0 group-hover/badge:opacity-100 transition-opacity" />
                <span className="relative z-10">{profile.isAvailable ? '✓ Available' : 'Unavailable'}</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Stats Cards - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8 -mt-4 md:-mt-6 relative z-20"
        >
          {[
            { 
              icon: Briefcase, 
              label: 'Jobs Completed', 
              value: profile.totalJobsCompleted || 0, 
              color: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-50',
              borderColor: 'border-blue-200'
            },
            { 
              icon: Clock, 
              label: 'Experience', 
              value: `${profile.experienceYears || 0} Years`, 
              color: 'from-purple-500 to-purple-600',
              bgColor: 'bg-purple-50',
              borderColor: 'border-purple-200'
            },
            { 
              icon: Star, 
              label: 'Rating', 
              value: profile.rating ? profile.rating.toFixed(1) : 'N/A', 
              color: 'from-yellow-500 to-yellow-600',
              bgColor: 'bg-yellow-50',
              borderColor: 'border-yellow-200'
            },
            { 
              icon: TrendingUp, 
              label: 'Status', 
              value: profile.profileStatus.replace('_', ' '), 
              color: 'from-accent-green to-green-600',
              bgColor: 'bg-green-50',
              borderColor: 'border-green-200'
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -8 }}
              className={`bg-white rounded-xl md:rounded-2xl p-4 md:p-5 shadow-xl border-2 ${stat.borderColor} hover:shadow-2xl transition-all duration-300 relative overflow-hidden group`}
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              
              <div className="relative z-10">
                <div className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${stat.color} rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <stat.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div className={`text-2xl md:text-3xl font-bold mb-1 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                <div className="text-xs font-semibold text-neutral-textSecondary uppercase tracking-wide">{stat.label}</div>
              </div>
              
              {/* Decorative Corner */}
              <div className={`absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 ${stat.bgColor} rounded-bl-full opacity-30`}></div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-neutral-border mb-4 md:mb-6 overflow-hidden"
        >
          <div className="flex border-b border-neutral-border overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'skills', label: 'Skills', icon: Award },
              { id: 'locations', label: 'Service Areas', icon: MapPin },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-3 md:py-4 font-semibold text-sm sm:text-base transition-all duration-300 relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-primary-main'
                    : 'text-neutral-textSecondary hover:text-primary-main'
                }`}
              >
                <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-main to-primary-dark"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Basic Information Card */}
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-neutral-border overflow-hidden">
                <div className="bg-gradient-to-r from-primary-main/10 to-primary-dark/10 px-4 sm:px-6 py-3 md:py-4 border-b border-neutral-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-lg md:text-xl font-bold text-neutral-textPrimary flex items-center gap-2">
                    <User className="w-4 h-4 md:w-5 md:h-5 text-primary-main" />
                    Basic Information
                  </h2>
                  {editingSection !== 'basic' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEditingSection('basic')}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all shadow-md w-full sm:w-auto justify-center"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </motion.button>
                  )}
                </div>
                <div className="p-4 sm:p-6">
                  {editingSection === 'basic' ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-semibold text-neutral-textSecondary mb-2">Business Name</label>
                        <input
                          type="text"
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                          placeholder="Enter business name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-textSecondary mb-2">Bio</label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors resize-none"
                          rows={4}
                          placeholder="Tell us about yourself, your experience, and what makes you special..."
                          maxLength={500}
                        />
                        <div className="text-xs text-neutral-textSecondary mt-1">{(formData.bio || '').length}/500 characters</div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-textSecondary mb-2">Experience (Years)</label>
                        <input
                          type="number"
                          value={formData.experienceYears}
                          onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                          className="w-full px-4 py-3 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                          min="0"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-neutral-border">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <span className="text-sm font-semibold text-neutral-textSecondary">Availability</span>
                          <button
                            onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                            className="flex items-center gap-2"
                          >
                            {formData.isAvailable ? (
                              <ToggleRight className="w-8 h-8 text-accent-green" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-neutral-textSecondary" />
                            )}
                          </button>
                        </label>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSaveBasicInfo}
                          disabled={saving}
                          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-accent-green to-green-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {saving ? 'Saving...' : 'Save Changes'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setEditingSection(null)
                            setFormData({
                              businessName: profile.businessName || '',
                              bio: profile.bio || '',
                              experienceYears: profile.experienceYears || 0,
                              isAvailable: profile.isAvailable
                            })
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-neutral-background text-neutral-textSecondary rounded-xl text-sm font-semibold hover:bg-neutral-border transition-all"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {profile.businessName && (
                        <div className="p-4 bg-gradient-to-r from-primary-main/5 to-primary-dark/5 rounded-xl border border-primary-main/10">
                          <div className="text-xs text-neutral-textSecondary mb-1 uppercase tracking-wide font-semibold">Business Name</div>
                          <div className="text-lg font-bold text-neutral-textPrimary">{profile.businessName}</div>
                        </div>
                      )}
                      {profile.bio && (
                        <div className="p-4 bg-neutral-background rounded-xl">
                          <div className="text-xs text-neutral-textSecondary mb-2 uppercase tracking-wide font-semibold">Bio</div>
                          <div className="text-sm text-neutral-textPrimary leading-relaxed">{profile.bio}</div>
                        </div>
                      )}
                      {profile.experienceYears && (
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                          <Clock className="w-6 h-6 text-purple-600" />
                          <div>
                            <div className="text-xs text-neutral-textSecondary uppercase tracking-wide font-semibold">Experience</div>
                            <div className="text-lg font-bold text-neutral-textPrimary">{profile.experienceYears} years</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-neutral-border overflow-hidden">
                <div className="bg-gradient-to-r from-accent-green/10 to-green-600/10 px-4 sm:px-6 py-3 md:py-4 border-b border-neutral-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-lg md:text-xl font-bold text-neutral-textPrimary flex items-center gap-2">
                    <Award className="w-4 h-4 md:w-5 md:h-5 text-accent-green" />
                    Skills & Expertise
                  </h2>
                  {editingSection !== 'skills' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEditingSection('skills')}
                      className="flex items-center gap-2 px-4 py-2 bg-accent-green text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-all shadow-md w-full sm:w-auto justify-center"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </motion.button>
                  )}
                </div>
                <div className="p-4 sm:p-6">
                  {editingSection === 'skills' ? (
                    <div className="space-y-4">
                      {skillsData.map((skill, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-5 border-2 border-neutral-border rounded-xl bg-gradient-to-br from-white to-neutral-background hover:border-primary-main/50 transition-all"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-neutral-textPrimary flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary-main" />
                              Skill {index + 1}
                            </span>
                            {skillsData.length > 1 && (
                              <button
                                onClick={() => removeSkill(index)}
                                className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs md:text-sm font-semibold text-neutral-textSecondary mb-2">Skill <span className="text-red-500">*</span></label>
                              <select
                                value={skill.skillId}
                                onChange={(e) => {
                                  const updated = [...skillsData]
                                  updated[index].skillId = Number(e.target.value)
                                  setSkillsData(updated)
                                }}
                                className="w-full px-4 py-3 md:px-3 md:py-2 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors text-sm md:text-base bg-white"
                              >
                                <option value={0}>Select a skill</option>
                                {availableSkills.map(s => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                              <div>
                                <label className="block text-xs md:text-sm font-semibold text-neutral-textSecondary mb-2">Experience (Years) <span className="text-red-500">*</span></label>
                                <input
                                  type="number"
                                  value={skill.experienceYears}
                                  onChange={(e) => {
                                    const updated = [...skillsData]
                                    updated[index].experienceYears = Number(e.target.value)
                                    setSkillsData(updated)
                                  }}
                                  className="w-full px-4 py-3 md:px-3 md:py-2 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors text-sm md:text-base"
                                  min="0"
                                  placeholder="Enter years"
                                />
                              </div>
                              <div className="flex items-end">
                                <label className="flex items-center gap-3 cursor-pointer w-full p-3 md:p-2 bg-primary-main/5 rounded-xl hover:bg-primary-main/10 transition-colors border-2 border-transparent hover:border-primary-main/20">
                                  <input
                                    type="checkbox"
                                    checked={skill.isPrimary}
                                    onChange={(e) => {
                                      const updated = skillsData.map((s, i) => ({
                                        ...s,
                                        isPrimary: i === index ? e.target.checked : false
                                      }))
                                      setSkillsData(updated)
                                    }}
                                    className="w-5 h-5 md:w-4 md:h-4 text-primary-main rounded focus:ring-2 focus:ring-primary-main focus:ring-offset-2"
                                  />
                                  <span className="text-sm md:text-xs font-semibold text-neutral-textPrimary">Mark as Primary Skill</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs md:text-sm font-semibold text-neutral-textSecondary mb-2">Certification Name <span className="text-xs text-neutral-textSecondary font-normal">(Optional)</span></label>
                              <input
                                type="text"
                                value={skill.certificationName}
                                onChange={(e) => {
                                  const updated = [...skillsData]
                                  updated[index].certificationName = e.target.value
                                  setSkillsData(updated)
                                }}
                                className="w-full px-4 py-3 md:px-3 md:py-2 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors text-sm md:text-base"
                                placeholder="e.g., Certified Electrician"
                              />
                            </div>
                            <div>
                              <label className="block text-xs md:text-sm font-semibold text-neutral-textSecondary mb-2">Certification Document URL <span className="text-xs text-neutral-textSecondary font-normal">(Optional)</span></label>
                              <input
                                type="url"
                                value={skill.certificationDocumentUrl}
                                onChange={(e) => {
                                  const updated = [...skillsData]
                                  updated[index].certificationDocumentUrl = e.target.value
                                  setSkillsData(updated)
                                }}
                                className="w-full px-4 py-3 md:px-3 md:py-2 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors text-sm md:text-base"
                                placeholder="https://example.com/certificate.pdf"
                              />
                              <p className="text-xs text-neutral-textSecondary mt-1">Enter a valid URL to your certification document</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={addSkill}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-primary-main rounded-xl text-sm font-semibold text-primary-main hover:bg-primary-main/5 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Skill
                      </motion.button>
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-border">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSaveSkills}
                          disabled={saving}
                          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 md:py-3 bg-gradient-to-r from-accent-green to-green-600 text-white rounded-xl text-sm md:text-base font-semibold hover:shadow-lg transition-all disabled:opacity-50 min-h-[48px]"
                        >
                          <Save className="w-5 h-5 md:w-4 md:h-4" />
                          {saving ? 'Saving...' : 'Save Skills'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setEditingSection(null)
                            if (profile.skills) {
                              setSkillsData(profile.skills.map(s => ({
                                skillId: s.skillId,
                                isPrimary: s.isPrimary || false,
                                experienceYears: s.experienceYears || 0,
                                certificationName: s.certificationName || '',
                                certificationDocumentUrl: s.certificationDocumentUrl || ''
                              })))
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 md:py-2.5 bg-neutral-background text-neutral-textSecondary rounded-xl text-sm md:text-base font-semibold hover:bg-neutral-border transition-all min-h-[48px]"
                        >
                          <X className="w-5 h-5 md:w-4 md:h-4" />
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {profile.skills && profile.skills.length > 0 ? (
                        profile.skills.map((skill, index) => {
                          const skillName = availableSkills.find(s => s.id === skill.skillId)?.name || `Skill ${skill.skillId}`
                          return (
                            <motion.div
                              key={skill.skillId}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                              whileHover={{ scale: 1.05, y: -2 }}
                              className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md ${
                                skill.isPrimary 
                                  ? 'bg-gradient-to-r from-primary-main to-primary-dark text-white border-2 border-primary-dark' 
                                  : 'bg-neutral-background text-neutral-textSecondary border-2 border-neutral-border'
                              }`}
                            >
                              {skill.isPrimary && <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />}
                              <span>{skillName}</span>
                              <span className="text-xs opacity-80">• {skill.experienceYears} {skill.experienceYears === 1 ? 'year' : 'years'}</span>
                            </motion.div>
                          )
                        })
                      ) : (
                        <p className="text-sm text-neutral-textSecondary">No skills added yet</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'locations' && (
            <motion.div
              key="locations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-neutral-border overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 px-4 sm:px-6 py-3 md:py-4 border-b border-neutral-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-lg md:text-xl font-bold text-neutral-textPrimary flex items-center gap-2">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                    Service Areas
                  </h2>
                  {editingSection !== 'serviceAreas' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEditingSection('serviceAreas')}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </motion.button>
                  )}
                </div>
                <div className="p-4 sm:p-6">
                  {editingSection === 'serviceAreas' ? (
                    <div className="space-y-4">
                      {serviceAreasData.map((area, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 md:p-5 border-2 border-neutral-border rounded-xl bg-gradient-to-br from-white to-orange-50/30 hover:border-orange-500/50 transition-all"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm md:text-base font-bold text-neutral-textPrimary flex items-center gap-2">
                              <MapPin className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                              Service Area {index + 1}
                            </span>
                            {serviceAreasData.length > 1 && (
                              <button
                                onClick={() => removeServiceArea(index)}
                                className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                aria-label="Remove service area"
                              >
                                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                              </button>
                            )}
                          </div>
                          <div className="space-y-4 md:space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                              <div>
                                <label className="block text-xs md:text-sm font-semibold text-neutral-textSecondary mb-2">City <span className="text-red-500">*</span></label>
                                <select
                                  value={area.cityId}
                                  onChange={async (e) => {
                                    const cityId = Number(e.target.value)
                                    const updated = [...serviceAreasData]
                                    updated[index].cityId = cityId
                                    updated[index].zoneId = 0
                                    updated[index].podId = 0
                                    setServiceAreasData(updated)
                                    if (cityId) await loadZonesForCity(cityId)
                                  }}
                                  className="w-full px-4 py-3 md:px-3 md:py-2 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors text-sm md:text-base bg-white"
                                >
                                  <option value={0}>Select City</option>
                                  {cities.map(city => (
                                    <option key={city.id} value={city.id}>{city.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs md:text-sm font-semibold text-neutral-textSecondary mb-2">Zone <span className="text-xs text-neutral-textSecondary font-normal">(Optional)</span></label>
                                <select
                                  value={area.zoneId}
                                  onChange={async (e) => {
                                    const zoneId = Number(e.target.value)
                                    const updated = [...serviceAreasData]
                                    updated[index].zoneId = zoneId
                                    updated[index].podId = 0
                                    setServiceAreasData(updated)
                                    if (zoneId) await loadPodsForZone(zoneId)
                                  }}
                                  disabled={!area.cityId}
                                  className="w-full px-4 py-3 md:px-3 md:py-2 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base bg-white"
                                >
                                  <option value={0}>Select Zone</option>
                                  {zones[area.cityId]?.map(zone => (
                                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                              <div>
                                <label className="block text-xs md:text-sm font-semibold text-neutral-textSecondary mb-2">POD <span className="text-xs text-neutral-textSecondary font-normal">(Optional)</span></label>
                                <select
                                  value={area.podId}
                                  onChange={(e) => {
                                    const updated = [...serviceAreasData]
                                    updated[index].podId = Number(e.target.value)
                                    setServiceAreasData(updated)
                                  }}
                                  disabled={!area.zoneId}
                                  className="w-full px-4 py-3 md:px-3 md:py-2 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base bg-white"
                                >
                                  <option value={0}>Select POD</option>
                                  {pods[area.zoneId]?.map(pod => (
                                    <option key={pod.id} value={pod.id}>{pod.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs md:text-sm font-semibold text-neutral-textSecondary mb-2">Service Radius (km) <span className="text-red-500">*</span></label>
                                <input
                                  type="number"
                                  value={area.serviceRadiusKm}
                                  onChange={(e) => {
                                    const updated = [...serviceAreasData]
                                    updated[index].serviceRadiusKm = Number(e.target.value)
                                    setServiceAreasData(updated)
                                  }}
                                  className="w-full px-4 py-3 md:px-3 md:py-2 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors text-sm md:text-base"
                                  min="1"
                                  step="1"
                                  placeholder="Enter radius"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="flex items-center gap-2 cursor-pointer w-full p-2 bg-orange-500/5 rounded-xl hover:bg-orange-500/10 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={area.isPrimary}
                                  onChange={(e) => {
                                    const updated = serviceAreasData.map((a, i) => ({
                                      ...a,
                                      isPrimary: i === index ? e.target.checked : false
                                    }))
                                    setServiceAreasData(updated)
                                  }}
                                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                                />
                                <span className="text-xs font-semibold text-neutral-textPrimary">Primary Service Area</span>
                              </label>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={addServiceArea}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-orange-500 rounded-xl text-sm font-semibold text-orange-500 hover:bg-orange-500/5 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Service Area
                      </motion.button>
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-border">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSaveServiceAreas}
                          disabled={saving}
                          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 md:py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm md:text-base font-semibold hover:shadow-lg transition-all disabled:opacity-50 min-h-[48px]"
                        >
                          <Save className="w-5 h-5 md:w-4 md:h-4" />
                          {saving ? 'Saving...' : 'Save Service Areas'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setEditingSection(null)
                            if (profile.serviceAreas) {
                              setServiceAreasData(profile.serviceAreas.map(a => ({
                                cityId: a.cityId,
                                zoneId: a.zoneId || 0,
                                podId: a.podId,
                                serviceRadiusKm: a.serviceRadiusKm,
                                isPrimary: a.isPrimary || false
                              })))
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 md:py-2.5 bg-neutral-background text-neutral-textSecondary rounded-xl text-sm md:text-base font-semibold hover:bg-neutral-border transition-all min-h-[48px]"
                        >
                          <X className="w-5 h-5 md:w-4 md:h-4" />
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profile.serviceAreas && profile.serviceAreas.length > 0 ? (
                        profile.serviceAreas.map((area, index) => {
                          const cityName = cities.find(c => c.id === area.cityId)?.name || `City ${area.cityId}`
                          const zoneName = area.zoneId ? zones[area.cityId]?.find(z => z.id === area.zoneId)?.name || `Zone ${area.zoneId}` : null
                          const podName = pods[area.zoneId || 0]?.find(p => p.id === area.podId)?.name || `POD ${area.podId}`
                          return (
                            <motion.div
                              key={`${area.cityId}-${area.zoneId}-${area.podId}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              whileHover={{ scale: 1.02, x: 5, y: -2 }}
                              className="group relative p-6 bg-gradient-to-br from-white to-orange-50/50 rounded-2xl border-2 border-orange-200 hover:border-orange-400 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden"
                            >
                              {/* Background Pattern */}
                              <div className="absolute inset-0 opacity-5">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400 rounded-full blur-3xl"></div>
                              </div>
                              
                              <div className="relative z-10 flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-start gap-3 mb-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                      <MapPin className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-lg font-bold text-neutral-textPrimary mb-1 flex items-center gap-2 flex-wrap">
                                        <span>{cityName}</span>
                                        {zoneName && (
                                          <>
                                            <span className="text-orange-400">•</span>
                                            <span>{zoneName}</span>
                                          </>
                                        )}
                                        <span className="text-orange-400">•</span>
                                        <span>{podName}</span>
                                      </div>
                                      <div className="flex items-center gap-4 flex-wrap mt-2">
                                        <div className="flex items-center gap-2 text-sm text-neutral-textSecondary">
                                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                          <span className="font-semibold">Service Radius: {area.serviceRadiusKm} km</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {area.isPrimary && (
                                  <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 whitespace-nowrap"
                                  >
                                    <Star className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
                                    Primary
                                  </motion.div>
                                )}
                              </div>
                              
                              {/* Hover Effect Border */}
                              <div className="absolute inset-0 border-2 border-orange-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </motion.div>
                          )
                        })
                      ) : (
                        <div className="text-center py-12 px-6 bg-neutral-background rounded-2xl border-2 border-dashed border-neutral-border">
                          <MapPin className="w-12 h-12 text-neutral-textSecondary mx-auto mb-3 opacity-50" />
                          <p className="text-sm font-semibold text-neutral-textSecondary mb-1">No service areas added yet</p>
                          <p className="text-xs text-neutral-textSecondary">Click "Edit" to add your service areas</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
