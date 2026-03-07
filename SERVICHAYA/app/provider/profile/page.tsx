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
  Plus, Trash2, Upload, FileText
} from 'lucide-react'
import { motion } from 'framer-motion'

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
      toast.success('Profile updated successfully')
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
      toast.success('Skills updated successfully')
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
      toast.success('Service areas updated successfully')
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
    <div className="px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">My Profile</h1>
          <p className="text-sm text-neutral-textSecondary mt-1">Manage your provider profile</p>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="md:col-span-1"
        >
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-border sticky top-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-main to-primary-dark rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-xl font-bold text-neutral-textPrimary mb-2">{profile.businessName || 'Provider'}</h2>
              <p className="text-xs text-neutral-textSecondary mb-3">Code: {profile.providerCode}</p>
              <div className="flex items-center justify-center gap-2 mb-4">
                {profile.rating && (
                  <>
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-semibold text-neutral-textPrimary">{profile.rating.toFixed(1)}</span>
                    {profile.ratingCount && (
                      <span className="text-xs text-neutral-textSecondary">({profile.ratingCount})</span>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  profile.verificationStatus === 'VERIFIED' 
                    ? 'bg-accent-green/20 text-accent-green' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {profile.verificationStatus}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  profile.profileStatus === 'ACTIVE' 
                    ? 'bg-accent-green/20 text-accent-green'
                    : 'bg-neutral-background text-neutral-textSecondary'
                }`}>
                  {profile.profileStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-neutral-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-textSecondary">Availability</span>
                {editingSection === 'basic' ? (
                  <button
                    onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                    className="flex items-center gap-2"
                  >
                    {formData.isAvailable ? (
                      <ToggleRight className="w-6 h-6 text-accent-green" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-neutral-textSecondary" />
                    )}
                  </button>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    profile.isAvailable 
                      ? 'bg-accent-green/20 text-accent-green' 
                      : 'bg-neutral-background text-neutral-textSecondary'
                  }`}>
                    {profile.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                )}
              </div>
              {profile.experienceYears && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-neutral-textSecondary" />
                  <span className="text-neutral-textSecondary">{profile.experienceYears} years experience</span>
                </div>
              )}
              {profile.totalJobsCompleted !== undefined && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-4 h-4 text-neutral-textSecondary" />
                  <span className="text-neutral-textSecondary">{profile.totalJobsCompleted} jobs completed</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="md:col-span-2 space-y-6"
        >
          {/* Basic Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-neutral-textPrimary font-display flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </h3>
              {editingSection !== 'basic' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditingSection('basic')}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </motion.button>
              )}
            </div>
            {editingSection === 'basic' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-textSecondary mb-2">Business Name</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                    placeholder="Enter business name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-textSecondary mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors resize-none"
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
                    className="w-full px-4 py-2.5 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                    min="0"
                  />
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveBasicInfo}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-accent-green text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-all disabled:opacity-50"
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
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-background text-neutral-textSecondary rounded-xl text-sm font-semibold hover:bg-neutral-border transition-all"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.businessName && (
                  <div>
                    <div className="text-xs text-neutral-textSecondary mb-1">Business Name</div>
                    <div className="text-sm font-semibold text-neutral-textPrimary">{profile.businessName}</div>
                  </div>
                )}
                {profile.bio && (
                  <div>
                    <div className="text-xs text-neutral-textSecondary mb-1">Bio</div>
                    <div className="text-sm text-neutral-textPrimary">{profile.bio}</div>
                  </div>
                )}
                {profile.experienceYears && (
                  <div>
                    <div className="text-xs text-neutral-textSecondary mb-1">Experience</div>
                    <div className="text-sm font-semibold text-neutral-textPrimary">{profile.experienceYears} years</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Skills Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-neutral-textPrimary font-display flex items-center gap-2">
                <Award className="w-5 h-5" />
                Skills
              </h3>
              {editingSection !== 'skills' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditingSection('skills')}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </motion.button>
              )}
            </div>
            {editingSection === 'skills' ? (
              <div className="space-y-4">
                {skillsData.map((skill, index) => (
                  <div key={index} className="p-4 border-2 border-neutral-border rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-neutral-textPrimary">Skill {index + 1}</span>
                      {skillsData.length > 1 && (
                        <button
                          onClick={() => removeSkill(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-textSecondary mb-1">Skill</label>
                      <select
                        value={skill.skillId}
                        onChange={(e) => {
                          const updated = [...skillsData]
                          updated[index].skillId = Number(e.target.value)
                          setSkillsData(updated)
                        }}
                        className="w-full px-3 py-2 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                      >
                        <option value={0}>Select a skill</option>
                        {availableSkills.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-textSecondary mb-1">Experience (Years)</label>
                        <input
                          type="number"
                          value={skill.experienceYears}
                          onChange={(e) => {
                            const updated = [...skillsData]
                            updated[index].experienceYears = Number(e.target.value)
                            setSkillsData(updated)
                          }}
                          className="w-full px-3 py-2 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                          min="0"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
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
                            className="w-4 h-4 text-primary-main rounded focus:ring-primary-main"
                          />
                          <span className="text-xs font-semibold text-neutral-textSecondary">Primary Skill</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-textSecondary mb-1">Certification Name (Optional)</label>
                      <input
                        type="text"
                        value={skill.certificationName}
                        onChange={(e) => {
                          const updated = [...skillsData]
                          updated[index].certificationName = e.target.value
                          setSkillsData(updated)
                        }}
                        className="w-full px-3 py-2 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                        placeholder="e.g., Certified Electrician"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-textSecondary mb-1">Certification Document URL (Optional)</label>
                      <input
                        type="url"
                        value={skill.certificationDocumentUrl}
                        onChange={(e) => {
                          const updated = [...skillsData]
                          updated[index].certificationDocumentUrl = e.target.value
                          setSkillsData(updated)
                        }}
                        className="w-full px-3 py-2 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={addSkill}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-neutral-border rounded-xl text-sm font-semibold text-neutral-textSecondary hover:border-primary-main hover:text-primary-main transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Skill
                </button>
                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveSkills}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-accent-green text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
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
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-background text-neutral-textSecondary rounded-xl text-sm font-semibold hover:bg-neutral-border transition-all"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => {
                    const skillName = availableSkills.find(s => s.id === skill.skillId)?.name || `Skill ${skill.skillId}`
                    return (
                      <motion.span
                        key={skill.skillId}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          skill.isPrimary 
                            ? 'bg-primary-main/10 text-primary-main border border-primary-main/20' 
                            : 'bg-neutral-background text-neutral-textSecondary'
                        }`}
                      >
                        {skill.isPrimary && <Star className="w-3 h-3 inline mr-1" />}
                        {skillName} • {skill.experienceYears} {skill.experienceYears === 1 ? 'year' : 'years'}
                      </motion.span>
                    )
                  })
                ) : (
                  <p className="text-sm text-neutral-textSecondary">No skills added yet</p>
                )}
              </div>
            )}
          </div>

          {/* Service Areas Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-neutral-textPrimary font-display flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Service Areas
              </h3>
              {editingSection !== 'serviceAreas' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditingSection('serviceAreas')}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </motion.button>
              )}
            </div>
            {editingSection === 'serviceAreas' ? (
              <div className="space-y-4">
                {serviceAreasData.map((area, index) => (
                  <div key={index} className="p-4 border-2 border-neutral-border rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-neutral-textPrimary">Service Area {index + 1}</span>
                      {serviceAreasData.length > 1 && (
                        <button
                          onClick={() => removeServiceArea(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-textSecondary mb-1">City</label>
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
                          className="w-full px-3 py-2 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                        >
                          <option value={0}>Select City</option>
                          {cities.map(city => (
                            <option key={city.id} value={city.id}>{city.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-textSecondary mb-1">Zone</label>
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
                          className="w-full px-3 py-2 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value={0}>Select Zone</option>
                          {zones[area.cityId]?.map(zone => (
                            <option key={zone.id} value={zone.id}>{zone.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-textSecondary mb-1">POD</label>
                        <select
                          value={area.podId}
                          onChange={(e) => {
                            const updated = [...serviceAreasData]
                            updated[index].podId = Number(e.target.value)
                            setServiceAreasData(updated)
                          }}
                          disabled={!area.zoneId}
                          className="w-full px-3 py-2 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value={0}>Select POD</option>
                          {pods[area.zoneId]?.map(pod => (
                            <option key={pod.id} value={pod.id}>{pod.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-textSecondary mb-1">Service Radius (km)</label>
                        <input
                          type="number"
                          value={area.serviceRadiusKm}
                          onChange={(e) => {
                            const updated = [...serviceAreasData]
                            updated[index].serviceRadiusKm = Number(e.target.value)
                            setServiceAreasData(updated)
                          }}
                          className="w-full px-3 py-2 border-2 border-neutral-border rounded-xl focus:border-primary-main focus:outline-none transition-colors"
                          min="1"
                          step="1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
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
                          className="w-4 h-4 text-primary-main rounded focus:ring-primary-main"
                        />
                        <span className="text-xs font-semibold text-neutral-textSecondary">Primary Service Area</span>
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addServiceArea}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-neutral-border rounded-xl text-sm font-semibold text-neutral-textSecondary hover:border-primary-main hover:text-primary-main transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Service Area
                </button>
                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveServiceAreas}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-accent-green text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
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
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-background text-neutral-textSecondary rounded-xl text-sm font-semibold hover:bg-neutral-border transition-all"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
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
                        className="p-4 bg-neutral-background rounded-xl border border-neutral-border"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-neutral-textPrimary">
                              {cityName}
                              {zoneName && ` • ${zoneName}`}
                              {` • ${podName}`}
                            </div>
                            <div className="text-xs text-neutral-textSecondary mt-1 flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              <span>Service Radius: {area.serviceRadiusKm} km</span>
                            </div>
                          </div>
                          {area.isPrimary && (
                            <span className="px-2 py-1 bg-primary-main/10 text-primary-main rounded-full text-xs font-semibold">
                              Primary
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )
                  })
                ) : (
                  <p className="text-sm text-neutral-textSecondary">No service areas added yet</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
