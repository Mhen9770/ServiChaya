'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createJob, type CreateJobDto } from '@/lib/services/job'
import { getAllCategories, type ServiceCategory } from '@/lib/services/service'
import { getAllServiceSkills, getServiceSkillsByCategory } from '@/lib/services/provider'
import { getAllActiveCities, getZonesByCity, getPodsByZone } from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import { Plus, Calendar, MapPin, DollarSign, FileText, AlertCircle, ArrowLeft, Sparkles, CheckCircle2, Loader2, Wrench } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function CreateJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [availableSkills, setAvailableSkills] = useState<any[]>([])
  const [loadingSkills, setLoadingSkills] = useState(false)
  const [cities, setCities] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [pods, setPods] = useState<any[]>([])
  const [loadingLocation, setLoadingLocation] = useState(false)

  const [formData, setFormData] = useState<CreateJobDto>({
    serviceCategoryId: 0,
    serviceSkillId: undefined,
    title: '',
    description: '',
    preferredTime: '',
    isEmergency: false,
    estimatedBudget: undefined,
    cityId: 0,
    zoneId: undefined,
    podId: undefined,
    addressLine1: '',
    addressLine2: '',
    pincode: '',
    specialInstructions: '',
    attachments: [],
  })

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login?redirect=/customer/jobs/create')
      return
    }
    Promise.all([fetchCategories(), loadLocationData()])
  }, [router])

  useEffect(() => {
    if (formData.serviceCategoryId) {
      loadSkillsForCategory(formData.serviceCategoryId)
    } else {
      setAvailableSkills([])
      setFormData(prev => ({ ...prev, serviceSkillId: undefined }))
    }
  }, [formData.serviceCategoryId])

  useEffect(() => {
    if (formData.cityId) {
      loadZonesForCity(formData.cityId)
    } else {
      setZones([])
      setFormData(prev => ({ ...prev, zoneId: undefined, podId: undefined }))
    }
  }, [formData.cityId])

  useEffect(() => {
    if (formData.zoneId) {
      loadPodsForZone(formData.zoneId)
    } else {
      setPods([])
      setFormData(prev => ({ ...prev, podId: undefined }))
    }
  }, [formData.zoneId])

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const cats = await getAllCategories()
      setCategories(cats)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      toast.error('Failed to load service categories')
    } finally {
      setLoadingCategories(false)
    }
  }

  const loadSkillsForCategory = async (categoryId: number) => {
    try {
      setLoadingSkills(true)
      const skills = await getServiceSkillsByCategory(categoryId)
      setAvailableSkills(skills.filter(s => s.isActive))
    } catch (error) {
      console.error('Failed to fetch skills:', error)
      // Fallback to all skills if category-specific fails
      try {
        const allSkills = await getAllServiceSkills()
        setAvailableSkills(allSkills.filter(s => s.isActive))
      } catch (fallbackError) {
        console.error('Failed to fetch all skills:', fallbackError)
        toast.error('Failed to load service types')
      }
    } finally {
      setLoadingSkills(false)
    }
  }

  const loadLocationData = async () => {
    try {
      setLoadingLocation(true)
      const citiesData = await getAllActiveCities()
      setCities(citiesData)
    } catch (error) {
      console.error('Failed to fetch cities:', error)
      toast.error('Failed to load location data')
    } finally {
      setLoadingLocation(false)
    }
  }

  const loadZonesForCity = async (cityId: number) => {
    try {
      const zonesData = await getZonesByCity(cityId)
      setZones(zonesData)
    } catch (error) {
      console.error('Failed to fetch zones:', error)
      toast.error('Failed to load zones')
    }
  }

  const loadPodsForZone = async (zoneId: number) => {
    try {
      const podsData = await getPodsByZone(zoneId)
      setPods(podsData)
    } catch (error) {
      console.error('Failed to fetch pods:', error)
      toast.error('Failed to load PODs')
    }
  }

  const validateForm = (): string | null => {
    if (!formData.serviceCategoryId || formData.serviceCategoryId === 0) {
      return 'Please select a service category'
    }
    if (!formData.title || formData.title.trim().length < 5) {
      return 'Job title must be at least 5 characters'
    }
    if (!formData.description || formData.description.trim().length < 20) {
      return 'Description must be at least 20 characters'
    }
    if (!formData.preferredTime) {
      return 'Please select a preferred time'
    }
    const selectedTime = new Date(formData.preferredTime)
    const now = new Date()
    if (selectedTime < now) {
      return 'Preferred time must be in the future'
    }
    if (!formData.cityId || formData.cityId === 0) {
      return 'Please select a city'
    }
    if (!formData.addressLine1 || formData.addressLine1.trim().length < 10) {
      return 'Please provide a complete address'
    }
    if (formData.estimatedBudget && formData.estimatedBudget < 0) {
      return 'Budget cannot be negative'
    }
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      return 'Pincode must be 6 digits'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const currentUser = getCurrentUser()
    if (!currentUser) {
      toast.error('Please login first')
      router.push('/login?redirect=/customer/jobs/create')
      return
    }
    
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      setLoading(true)
      const job = await createJob(currentUser.userId, {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2?.trim(),
        specialInstructions: formData.specialInstructions?.trim(),
        serviceSkillId: formData.serviceSkillId || undefined,
        zoneId: formData.zoneId || undefined,
        podId: formData.podId || undefined
      })
      toast.success('Job created successfully!')
      router.push(`/customer/jobs/${job.id}`)
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to create job. Please try again.'
      toast.error(errorMsg)
      console.error('Create job error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loadingCategories || loadingLocation) {
    return <Loader fullScreen text="Loading form data..." />
  }

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Link href="/customer/jobs" className="inline-flex items-center gap-2 text-sm text-neutral-textSecondary hover:text-primary-main mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-textPrimary font-display mb-2">Create New Job</h1>
          <p className="text-sm text-neutral-textSecondary">Fill in the details to post your service request</p>
        </div>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-border space-y-6"
      >
        {/* Service Category */}
        <div>
          <label className="block text-sm font-semibold text-neutral-textPrimary mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-main" />
            Service Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.serviceCategoryId}
            onChange={(e) => setFormData({ ...formData, serviceCategoryId: Number(e.target.value), serviceSkillId: undefined })}
            className="w-full px-4 py-3 border-2 border-neutral-border rounded-xl focus:ring-2 focus:ring-primary-main focus:border-primary-main transition-all bg-white"
            required
          >
            <option value={0}>Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Service Type/Skill */}
        {formData.serviceCategoryId > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <label className="block text-sm font-semibold text-neutral-textPrimary mb-2 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary-main" />
              Service Type <span className="text-xs text-neutral-textSecondary font-normal">(Optional but recommended)</span>
            </label>
            {loadingSkills ? (
              <div className="px-4 py-3 border-2 border-neutral-border rounded-xl bg-neutral-background animate-pulse">
                <span className="text-sm text-neutral-textSecondary">Loading service types...</span>
              </div>
            ) : (
              <select
                value={formData.serviceSkillId || ''}
                onChange={(e) => setFormData({ ...formData, serviceSkillId: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-4 py-3 border-2 border-neutral-border rounded-xl focus:ring-2 focus:ring-primary-main focus:border-primary-main transition-all bg-white"
              >
                <option value="">Select a service type (optional)</option>
                {availableSkills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
            )}
            {availableSkills.length === 0 && !loadingSkills && (
              <p className="text-xs text-neutral-textSecondary mt-1">No specific service types available for this category</p>
            )}
          </motion.div>
        )}

        {/* Job Title */}
        <div>
          <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 border-2 border-neutral-border rounded-xl focus:ring-2 focus:ring-primary-main focus:border-primary-main transition-all"
            placeholder="e.g., AC Repair at Home"
            maxLength={100}
            required
          />
          <div className="text-xs text-neutral-textSecondary mt-1">{formData.title.length}/100 characters</div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 border-2 border-neutral-border rounded-xl focus:ring-2 focus:ring-primary-main focus:border-primary-main transition-all resize-none"
            placeholder="Describe your service requirement in detail. Include any specific issues, requirements, or preferences..."
            maxLength={1000}
            required
          />
          <div className="text-xs text-neutral-textSecondary mt-1">{formData.description.length}/1000 characters (minimum 20)</div>
        </div>

        {/* Preferred Time and Budget */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Preferred Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.preferredTime}
              onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-3 border-2 border-neutral-border rounded-xl focus:ring-2 focus:ring-primary-main focus:border-primary-main transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Estimated Budget (₹)
            </label>
            <input
              type="number"
              value={formData.estimatedBudget || ''}
              onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-4 py-3 border-2 border-neutral-border rounded-xl focus:ring-2 focus:ring-primary-main focus:border-primary-main transition-all"
              placeholder="Optional - Enter your budget"
              min="0"
              step="100"
            />
          </div>
        </div>

        {/* Emergency Toggle */}
        <div>
          <label className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl cursor-pointer hover:bg-red-100 transition-colors">
            <input
              type="checkbox"
              checked={formData.isEmergency}
              onChange={(e) => setFormData({ ...formData, isEmergency: e.target.checked })}
              className="w-5 h-5 text-red-600 rounded focus:ring-red-500 focus:ring-2"
            />
            <div className="flex items-center gap-2 flex-1">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-sm font-semibold text-red-800">Emergency Service Required</div>
                <div className="text-xs text-red-600">This will prioritize your request and may incur additional charges</div>
              </div>
            </div>
          </label>
        </div>

        {/* Location Selection */}
        <div className="space-y-4 p-4 bg-neutral-background rounded-xl border border-neutral-border">
          <h3 className="text-sm font-semibold text-neutral-textPrimary flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-main" />
            Service Location <span className="text-red-500">*</span>
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-textSecondary mb-1">City</label>
              <select
                value={formData.cityId}
                onChange={(e) => setFormData({ ...formData, cityId: Number(e.target.value), zoneId: undefined, podId: undefined })}
                className="w-full px-3 py-2 border-2 border-neutral-border rounded-xl focus:ring-2 focus:ring-primary-main focus:border-primary-main transition-all bg-white text-sm"
                required
              >
                <option value={0}>Select City</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-textSecondary mb-1">Zone</label>
              <select
                value={formData.zoneId || ''}
                onChange={(e) => setFormData({ ...formData, zoneId: e.target.value ? Number(e.target.value) : undefined, podId: undefined })}
                disabled={!formData.cityId || formData.cityId === 0}
                className="w-full px-3 py-2 border-2 border-neutral-border rounded-xl focus:ring-2 focus:ring-primary-main focus:border-primary-main transition-all bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Zone (Optional)</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-textSecondary mb-1">POD</label>
              <select
                value={formData.podId || ''}
                onChange={(e) => setFormData({ ...formData, podId: e.target.value ? Number(e.target.value) : undefined })}
                disabled={!formData.zoneId}
                className="w-full px-3 py-2 border-2 border-neutral-border rounded-xl focus:ring-2 focus:ring-primary-main focus:border-primary-main transition-all bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select POD (Optional)</option>
                {pods.map((pod) => (
                  <option key={pod.id} value={pod.id}>{pod.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Address Line 1 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.addressLine1}
            onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
            className="w-full px-4 py-3 border-2 border-neutral-border rounded-xl focus:ring-2 focus:ring-primary-main focus:border-primary-main transition-all"
            placeholder="Street address, building name, etc."
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
              Address Line 2
            </label>
            <input
              type="text"
              value={formData.addressLine2 || ''}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-border rounded-xl focus:ring-2 focus:ring-primary-main focus:border-transparent"
              placeholder="Apartment, suite, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
              Pincode
            </label>
            <input
              type="text"
              value={formData.pincode || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                setFormData({ ...formData, pincode: value })
              }}
              className="w-full px-4 py-3 border-2 border-neutral-border rounded-xl focus:ring-2 focus:ring-primary-main focus:border-primary-main transition-all"
              placeholder="452001"
              maxLength={6}
            />
          </div>
        </div>

        {/* Special Instructions */}
        <div>
          <label className="block text-sm font-semibold text-neutral-textPrimary mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Special Instructions
          </label>
          <textarea
            value={formData.specialInstructions || ''}
            onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-neutral-border rounded-xl focus:ring-2 focus:ring-primary-main focus:border-transparent"
            placeholder="Any special instructions for the service provider..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-4 border-t border-neutral-border">
          <Link
            href="/customer/jobs"
            className="px-6 py-3 border-2 border-neutral-border text-neutral-textSecondary rounded-xl font-semibold hover:bg-neutral-background transition-all"
          >
            Cancel
          </Link>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Job...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Create Job Request
              </>
            )}
          </motion.button>
        </div>
      </motion.form>
    </div>
  )
}
