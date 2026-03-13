'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, Send, ShieldCheck, Sparkles, AlertCircle, Info } from 'lucide-react'
import { PageLoader, ButtonLoader, ContentLoader } from '@/components/ui/Loader'
import { getCurrentUser, sendOtp, verifyOtp } from '@/lib/auth'
import { createJob, type CreateJobDto } from '@/lib/services/job'
import { getAllCategories, getRootCategories, getCategoryTree, type ServiceCategory, type ServiceSubCategory } from '@/lib/services/service'
import { getServiceSkillsByCategory, type ServiceSkillDto } from '@/lib/services/provider'
import { getCustomerProfile, type AddressDto } from '@/lib/services/customer'
import {
  getAllActiveCities,
  getPodsByZone,
  getZonesByCity,
  type CityMasterDto,
  type PodMasterDto,
  type ZoneMasterDto,
} from '@/lib/services/admin'
import { resolveLocation } from '@/lib/services/location'
import LocationPicker from '@/components/map/LocationPicker'
import DateTimePicker from '@/components/ui/DateTimePicker'

const emptyForm: CreateJobDto = {
  serviceCategoryId: 0,
  serviceSubCategoryId: undefined,
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
   // precise geo-coordinates are optional but recommended
  latitude: undefined,
  longitude: undefined,
  specialInstructions: '',
}

export default function CreateJobPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loadingInitialData, setLoadingInitialData] = useState(true)
  const [loadingCategory, setLoadingCategory] = useState(false)
  const [loadingSubCategory, setLoadingSubCategory] = useState(false)
  const [loadingCity, setLoadingCity] = useState(false)
  const [loadingZone, setLoadingZone] = useState(false)
  const [form, setForm] = useState<CreateJobDto>(emptyForm)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [subCategories, setSubCategories] = useState<ServiceSubCategory[]>([])
  const [skills, setSkills] = useState<ServiceSkillDto[]>([])
  const [cities, setCities] = useState<CityMasterDto[]>([])
  const [zones, setZones] = useState<ZoneMasterDto[]>([])
  const [pods, setPods] = useState<PodMasterDto[]>([])
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [currentUser, setCurrentUser] = useState(getCurrentUser())
  const [savedAddresses, setSavedAddresses] = useState<AddressDto[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [resolvingLocation, setResolvingLocation] = useState(false)
  const [resolvedLocationInfo, setResolvedLocationInfo] = useState<{ cityName?: string; zoneName?: string; podName?: string } | null>(null)
  const resolveLocationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Guest mobile + OTP state
  const [guestMobile, setGuestMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)

  useEffect(() => {
    loadInitialData()
    setCurrentUser(getCurrentUser())
  }, [router])

  const loadInitialData = async () => {
    try {
      setLoadingInitialData(true)
      // Load Electronics categories by default (can be made configurable)
      const [categoryRes, cityRes] = await Promise.all([
        getRootCategories(), // Get root categories (hierarchical tree)
        getAllActiveCities()
      ])
      setCategories(categoryRes)
      setCities(cityRes)

      // Load saved addresses if user is logged in
      const user = getCurrentUser()
      if (user) {
        try {
          const profile = await getCustomerProfile(user.userId)
          setSavedAddresses(profile.addresses || [])
        } catch (e) {
          // Silently fail - addresses are optional
          console.warn('Could not load saved addresses:', e)
        }
      }
    } catch {
      toast.error('Failed to load create job form data')
    } finally {
      setLoadingInitialData(false)
    }
  }

  // Flatten category tree for cascading select
  const flattenCategories = (cats: ServiceCategory[], level = 0): ServiceCategory[] => {
    const result: ServiceCategory[] = []
    cats.forEach(cat => {
      result.push({ ...cat, level })
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children, level + 1))
      }
    })
    return result
  }

  const allCategoriesFlat = useMemo(() => flattenCategories(categories), [categories])

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === form.serviceCategoryId),
    [categories, form.serviceCategoryId]
  )

  const handleCategory = async (categoryId: number) => {
    setForm((prev) => ({ ...prev, serviceCategoryId: categoryId, serviceSubCategoryId: undefined, serviceSkillId: undefined }))
    if (!categoryId) {
      setSubCategories([])
      setSkills([])
      return
    }

    try {
      setLoadingCategory(true)
      // Load category tree to get children
      const categoryTree = await getCategoryTree(categoryId)
      const children = categoryTree.children || []
      
      // Convert children to subcategory format for backward compatibility
      const subCategoryRes: ServiceSubCategory[] = children.map(child => ({
        id: child.id,
        code: child.code,
        name: child.name,
        description: child.description || '',
        categoryId: categoryId,
        categoryName: categoryTree.name,
        iconUrl: child.iconUrl || '',
        displayOrder: child.displayOrder || 0,
        isFeatured: child.isFeatured || false,
        providerCount: child.providerCount || 0
      }))
      
      const [skillRes] = await Promise.all([
        getServiceSkillsByCategory(categoryId)
      ])
      setSubCategories(subCategoryRes)
      setSkills(skillRes)
    } catch {
      toast.error('Unable to load category details or skills')
    } finally {
      setLoadingCategory(false)
    }
  }

  const handleSubCategory = async (subCategoryId: number) => {
    setForm((prev) => ({ ...prev, serviceSubCategoryId: subCategoryId, serviceSkillId: undefined }))
    if (!subCategoryId || !form.serviceCategoryId) {
      setSkills([])
      return
    }

    try {
      setLoadingSubCategory(true)
      // Use the selected subcategory's ID for skills (or parent category)
      const skillRes = await getServiceSkillsByCategory(form.serviceCategoryId)
      setSkills(skillRes)
    } catch {
      toast.error('Unable to load skills')
    } finally {
      setLoadingSubCategory(false)
    }
  }

  const handleCity = async (cityId: number) => {
    setForm((prev) => ({ ...prev, cityId, zoneId: undefined, podId: undefined }))
    setPods([])

    if (!cityId) {
      setZones([])
      return
    }

    try {
      setLoadingCity(true)
      const zoneRes = await getZonesByCity(cityId)
      setZones(zoneRes)
    } catch {
      toast.error('Unable to load zones')
    } finally {
      setLoadingCity(false)
    }
  }

  const handleZone = async (zoneId: number) => {
    setForm((prev) => ({ ...prev, zoneId, podId: undefined }))

    if (!zoneId) {
      setPods([])
      return
    }

    try {
      setLoadingZone(true)
      const podRes = await getPodsByZone(zoneId)
      setPods(podRes)
    } catch {
      toast.error('Unable to load PODs')
    } finally {
      setLoadingZone(false)
    }
  }

  // Helper function to resolve location and update form
  const resolveAndUpdateLocation = async (latitude: number, longitude: number, showToast = true) => {
    try {
      setResolvingLocation(true)
      const resolved = await resolveLocation(latitude, longitude)

      // Ensure cityId is set (required field)
      if (!resolved.cityId) {
        throw new Error('Could not resolve city from location. Please select city manually.')
      }

      setForm(prev => ({
        ...prev,
        cityId: resolved.cityId, // Required - always set
        zoneId: resolved.zoneId || undefined,
        podId: resolved.podId || undefined,
        latitude,
        longitude,
      }))

      // Update resolved location info for display
      setResolvedLocationInfo({
        cityName: resolved.cityName,
        zoneName: resolved.zoneName,
        podName: resolved.podName,
      })

      // Load dropdown data based on resolved IDs
      try {
        const zoneRes = await getZonesByCity(resolved.cityId)
        setZones(zoneRes)
        if (resolved.zoneId) {
          const podRes = await getPodsByZone(resolved.zoneId)
          setPods(podRes)
        } else {
          setPods([])
        }
      } catch (loadErr) {
        console.error('Failed to load zones/pods', loadErr)
        // Don't fail the whole operation if dropdowns fail to load
      }

      if (showToast) {
        const locationParts = [
          resolved.podName,
          resolved.zoneName,
          resolved.cityName,
        ].filter(Boolean)
        toast.success(`Location detected: ${locationParts.join(' → ')}`)
      }
    } catch (err: any) {
      console.error('Failed to resolve location', err)
      setResolvedLocationInfo(null)
      if (showToast) {
        toast.error(err?.response?.data?.message || err?.message || 'Could not detect area from location')
      }
    } finally {
      setResolvingLocation(false)
    }
  }

  const useCurrentLocationForJob = async () => {
    if (!navigator.geolocation) {
      toast.error('Location is not supported in this browser')
      return
    }

    // Show loader immediately
    setResolvingLocation(true)

    try {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const { latitude, longitude } = pos.coords
              await resolveAndUpdateLocation(latitude, longitude, true)
            } catch (err) {
              // Error already handled in resolveAndUpdateLocation
            } finally {
              resolve()
            }
          },
          (err) => {
            console.error('Geolocation error', err)
            toast.error('Unable to access current location')
            setResolvingLocation(false)
            resolve()
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        )
      })
    } catch (err) {
      console.error('Error getting current location', err)
      setResolvingLocation(false)
    }
  }

  // Debounced location resolution when map pin moves
  const handleMapLocationChange = ({ lat, lng }: { lat: number; lng: number }) => {
    // Update lat/lng immediately
    setForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }))

    // Debounce the resolution call (wait 1 second after user stops moving pin)
    if (resolveLocationTimeoutRef.current) {
      clearTimeout(resolveLocationTimeoutRef.current)
    }
    
    resolveLocationTimeoutRef.current = setTimeout(() => {
      resolveAndUpdateLocation(lat, lng, false) // Don't show toast on every pin move
    }, 1000)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.serviceCategoryId || !form.title || !form.description || !form.preferredTime || !form.cityId || !form.addressLine1) {
      toast.error('Please fill all required fields before submitting')
      return
    }

    // Require login OR verified OTP before creating job
    let user = getCurrentUser()
    if (!user) {
      if (!otpVerified) {
        toast.error('Please verify your mobile number with OTP before submitting')
        setCurrentStep(3)
        return
      }
      user = getCurrentUser()
    }
    if (!user) {
      toast.error('Unable to identify user. Please try OTP verification again.')
      return
    }

    try {
      setSaving(true)
      await createJob(user.userId, {
        ...form,
        estimatedBudget: form.estimatedBudget || undefined,
      })
      toast.success('Request submitted successfully')
      router.push('/customer/jobs')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not create request')
    } finally {
      setSaving(false)
    }
  }

  const formProgress = useMemo(() => {
    let filled = 0
    const total = 7
    if (form.serviceCategoryId) filled++
    if (form.title) filled++
    if (form.description) filled++
    if (form.preferredTime) filled++
    if (form.cityId) filled++
    if (form.addressLine1) filled++
    if (form.estimatedBudget) filled++
    return Math.round((filled / total) * 100)
  }, [form])

  if (loadingInitialData) {
    return <PageLoader text="Loading form..." />
  }

  const handleNextFromStep1 = () => {
    if (!form.serviceCategoryId || !form.title || !form.description) {
      toast.error('Please fill service details before continuing')
      return
    }
    setCurrentStep(2)
  }

  const handleNextFromStep2 = () => {
    if (!form.preferredTime || !form.cityId || !form.addressLine1) {
      toast.error('Please fill schedule & location before continuing')
      return
    }
    setCurrentStep(3)
  }

  const handleSendGuestOtp = async () => {
    if (!guestMobile || guestMobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }
    try {
      setOtpLoading(true)
      const code = await sendOtp(guestMobile)
      setOtpSent(true)
      setOtpVerified(false)
      toast.success(`OTP sent! OTP: ${code} (for testing)`)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyGuestOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }
    try {
      setOtpLoading(true)
      const resp = await verifyOtp(guestMobile, otp)
      setOtpVerified(true)
      setCurrentUser(resp)
      toast.success('Mobile verified and account created!')
    } catch (error: any) {
      setOtpVerified(false)
      toast.error(error?.response?.data?.message || 'Invalid OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link href="/customer/jobs" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-primary-light transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to requests
        </Link>
      </motion.div>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark text-white p-7 border border-slate-800"
      >
        <p className="text-xs uppercase tracking-wide text-slate-300">Smart Request Builder</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2">Create a request that gets matched faster</h1>
        <p className="text-sm text-slate-300 mt-2 max-w-3xl">Complete details improve match quality, reduce confusion, and help providers give better final outcomes.</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-white/20 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${formProgress}%` }}
              className="h-full bg-white"
            />
          </div>
          <span className="text-xs text-slate-300">
            Step {currentStep} of 3 · {formProgress}% complete
          </span>
        </div>
      </motion.section>

      <form onSubmit={submit} className="grid xl:grid-cols-[1.3fr_1fr] gap-5">
        <div className="rounded-2xl glass-dark border border-white/10 p-6 space-y-7">
          {/* Step 1: Service scope */}
          {currentStep === 1 && (
          <section>
            <h2 className="font-bold text-lg text-white">Service scope</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="relative">
                <SelectField required label="Category" value={form.serviceCategoryId} onChange={(value) => handleCategory(Number(value))} disabled={loadingCategory || loadingInitialData}>
                  <option value={0}>Select category</option>
                  {allCategoriesFlat.map((category) => (
                    <option key={category.id} value={category.id}>
                      {'  '.repeat(category.level || 0)}{category.path || category.name}
                    </option>
                  ))}
                </SelectField>
                {loadingCategory && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <ButtonLoader size="sm" />
                  </div>
                )}
              </div>

              {form.serviceCategoryId > 0 && subCategories.length > 0 && (
                <div className="relative">
                  <SelectField label="Sub Category (optional)" value={form.serviceSubCategoryId || ''} onChange={(value) => handleSubCategory(value ? Number(value) : 0)} disabled={loadingSubCategory}>
                    <option value="">Select subcategory</option>
                    {subCategories.map((subCategory) => (
                      <option key={subCategory.id} value={subCategory.id}>{subCategory.name}</option>
                    ))}
                  </SelectField>
                  {loadingSubCategory && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <ButtonLoader size="sm" />
                    </div>
                  )}
                </div>
              )}

              <SelectField label="Skill (optional)" value={form.serviceSkillId || ''} onChange={(value) => setForm((prev) => ({ ...prev, serviceSkillId: value ? Number(value) : undefined }))}>
                <option value="">Select skill</option>
                {skills.map((skill) => (
                  <option key={skill.id} value={skill.id}>{skill.name}</option>
                ))}
              </SelectField>
            </div>

            {selectedCategory?.description && <p className="text-xs text-slate-300 mt-2">{selectedCategory.description}</p>}

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <InputField required label="Request Title" value={form.title} onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} placeholder="Ex: Bathroom leakage repair" />
              <InputField label="Estimated Budget (₹)" type="number" value={form.estimatedBudget || ''} onChange={(value) => setForm((prev) => ({ ...prev, estimatedBudget: value ? Number(value) : undefined }))} />
            </div>

            <label className="block text-sm font-semibold mt-4 mb-1 text-white">
              Description *
              <span className="ml-2 text-xs font-normal text-slate-400">
                ({form.description.length} characters)
              </span>
            </label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className={`w-full rounded-xl glass border px-3 py-2.5 text-sm text-white bg-white/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                form.description.length < 20
                  ? 'border-amber-400/50 focus:border-amber-400 focus:ring-amber-400/30'
                  : 'border-white/20 focus:border-primary-main/50 focus:ring-primary-main/50'
              }`}
              placeholder="Mention issue details, expected outcome, urgency and specific instructions"
            />
            {form.description.length > 0 && form.description.length < 20 && (
              <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Add more details (minimum 20 characters recommended)
              </p>
            )}

            <label className="mt-3 inline-flex items-center gap-2 text-sm text-white">
              <input type="checkbox" checked={!!form.isEmergency} onChange={(e) => setForm((prev) => ({ ...prev, isEmergency: e.target.checked }))} className="rounded" /> Emergency request
            </label>
          </section>
          )}

          {/* Step 2: Schedule & location */}
          {currentStep === 2 && (
          <section>
            <h2 className="font-bold text-lg text-white">Schedule & location</h2>
            <p className="text-xs text-slate-300 mt-1">
              Pick from your saved addresses or add a new one, then fine-tune on the map if needed.
            </p>
            
            {savedAddresses.length > 0 && (
              <div className="mb-4 rounded-xl bg-white/5 border border-primary-main/50 p-4 shadow-sm shadow-primary-main/20">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">Saved addresses</p>
                    <p className="text-[11px] text-slate-300">
                      Select one to auto-fill city / zone / POD and address. You can still edit details below.
                    </p>
                  </div>
                  <Link
                    href="/customer/profile"
                    className="text-xs text-primary-light hover:text-primary-main"
                    target="_blank"
                  >
                    Manage addresses
                  </Link>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-2 text-xs text-slate-200 cursor-pointer p-2 rounded-lg border transition-colors ${
                        selectedAddressId === addr.id
                          ? 'bg-primary-main/15 border-primary-main/60'
                          : 'bg-slate-900/40 border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        className="mt-1"
                        checked={selectedAddressId === addr.id}
                        onChange={async () => {
                          setSelectedAddressId(addr.id)
                          setForm(prev => ({
                            ...prev,
                            cityId: addr.cityId || 0,
                            zoneId: addr.zoneId,
                            podId: addr.podId,
                            addressLine1: addr.addressLine1,
                            addressLine2: addr.addressLine2 || '',
                            pincode: addr.pincode || '',
                            latitude: addr.latitude,
                            longitude: addr.longitude,
                          }))
                          
                          // Update resolved location info
                          if (addr.cityName || addr.zoneName || addr.podName) {
                            setResolvedLocationInfo({
                              cityName: addr.cityName,
                              zoneName: addr.zoneName,
                              podName: addr.podName,
                            })
                          }
                          
                          // Load zones if city is selected
                          if (addr.cityId) {
                            await handleCity(addr.cityId)
                            // Load pods if zone is selected
                            if (addr.zoneId) {
                              await handleZone(addr.zoneId)
                            }
                          }
                          
                          // If lat/lng exist but POD/Zone missing, try to resolve
                          if (addr.latitude && addr.longitude && (!addr.podId || !addr.zoneId)) {
                            try {
                              await resolveAndUpdateLocation(addr.latitude, addr.longitude, false)
                            } catch (err) {
                              // Silently fail - user can manually select
                              console.warn('Could not auto-resolve location for saved address', err)
                            }
                          }
                        }}
                      />
                      <span className="flex-1">
                        <span className="font-semibold text-white">
                          {addr.addressLabel || 'Address'}
                          {addr.isDefault && (
                            <span className="ml-1 inline-flex items-center rounded-full bg-primary-main/20 px-1.5 py-0.5 text-[9px] text-primary-light border border-primary-main/40">
                              Default
                            </span>
                          )}
                        </span>
                        <br />
                        {addr.addressLine1}
                        {addr.addressLine2 && `, ${addr.addressLine2}`}
                        <br />
                        {addr.cityName} {addr.pincode && `- ${addr.pincode}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <DateTimePicker 
                required 
                label="Preferred Date & Time" 
                icon={CalendarDays} 
                value={form.preferredTime} 
                onChange={(value) => setForm((prev) => ({ ...prev, preferredTime: value }))}
                minDate={new Date()} // Can't select past dates
              />
              <div className="relative">
                <SelectField required label="City" value={form.cityId} onChange={(value) => handleCity(Number(value))} disabled={loadingCity || loadingInitialData}>
                  <option value={0}>Select city</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </SelectField>
                {loadingCity && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <ButtonLoader size="sm" />
                  </div>
                )}
              </div>

              <div className="md:col-span-2 flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-300">
                  Use your current position to auto-detect the right city / zone / POD.
                </p>
                <motion.button
                  type="button"
                  whileHover={{ scale: resolvingLocation ? 1 : 1.02 }}
                  whileTap={{ scale: resolvingLocation ? 1 : 0.98 }}
                  onClick={useCurrentLocationForJob}
                  disabled={resolvingLocation}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary-main/50 px-3 py-1.5 text-[11px] text-primary-light hover:bg-primary-main/10 disabled:opacity-60"
                >
                  {resolvingLocation ? (
                    <>
                      <ButtonLoader size="sm" />
                      <span>Detecting location...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3 h-3" />
                      <span>Use current location</span>
                    </>
                  )}
                </motion.button>
              </div>
              
              {resolvingLocation && (
                <div className="md:col-span-2 flex items-center gap-2 text-xs text-slate-400 bg-primary-main/5 border border-primary-main/20 rounded-lg px-3 py-2">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-main border-t-transparent" />
                  <span>Getting your location and detecting area...</span>
                </div>
              )}

              {form.cityId > 0 && zones.length > 0 && (
                <div className="relative">
                  <SelectField label="Zone" value={form.zoneId || ''} onChange={(value) => handleZone(value ? Number(value) : 0)} disabled={loadingZone}>
                    <option value="">Select zone</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>{zone.name}</option>
                    ))}
                  </SelectField>
                  {loadingZone && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <ButtonLoader size="sm" />
                    </div>
                  )}
                </div>
              )}

              <SelectField label="POD" value={form.podId || ''} onChange={(value) => setForm((prev) => ({ ...prev, podId: value ? Number(value) : undefined }))}>
                <option value="">Select POD</option>
                {pods.map((pod) => (
                  <option key={pod.id} value={pod.id}>{pod.name}</option>
                ))}
              </SelectField>

              <InputField required label="Address line 1" icon={MapPin} value={form.addressLine1} onChange={(value) => setForm((prev) => ({ ...prev, addressLine1: value }))} />
              <InputField label="Address line 2" value={form.addressLine2 || ''} onChange={(value) => setForm((prev) => ({ ...prev, addressLine2: value }))} />
              <InputField label="Pincode" value={form.pincode || ''} onChange={(value) => setForm((prev) => ({ ...prev, pincode: value }))} />
            </div>

            <label className="block text-sm font-semibold mt-4 mb-1 text-white">Special instructions</label>
            <textarea
              rows={3}
              value={form.specialInstructions || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, specialInstructions: e.target.value }))}
              className="w-full rounded-xl glass border border-white/20 px-3 py-2.5 text-sm text-white bg-white/5 placeholder:text-slate-400"
              placeholder="Landmark, entry notes, contact preference"
            />

            {/* Map-based precise location picker */}
            {(form.cityId > 0 || form.podId) && (
              <div className="mt-4 space-y-2">
                <label className="block text-sm font-semibold text-white">
                  Exact job location on map{' '}
                  <span className="text-xs font-normal text-slate-400">(optional but improves matching)</span>
                </label>
                {resolvingLocation && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                    Detecting area...
                  </div>
                )}
                {resolvedLocationInfo && !resolvingLocation && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>
                      {[resolvedLocationInfo.podName, resolvedLocationInfo.zoneName, resolvedLocationInfo.cityName]
                        .filter(Boolean)
                        .join(' → ')}
                    </span>
                  </div>
                )}
                <LocationPicker
                  center={
                    (() => {
                      const selectedPod = pods.find(p => p.id === form.podId)
                      if (selectedPod) {
                        return { lat: selectedPod.latitude, lng: selectedPod.longitude }
                      }
                      const selectedCity = cities.find(c => c.id === form.cityId)
                      if (selectedCity && selectedCity.latitude && selectedCity.longitude) {
                        return { lat: selectedCity.latitude, lng: selectedCity.longitude }
                      }
                      return { lat: 22.9734, lng: 78.6569 }
                    })()
                  }
                  radiusKm={
                    (() => {
                      const selectedPod = pods.find(p => p.id === form.podId)
                      return selectedPod?.serviceRadiusKm
                    })()
                  }
                  value={
                    form.latitude !== undefined && form.longitude !== undefined
                      ? { lat: form.latitude, lng: form.longitude }
                      : undefined
                  }
                  onChange={handleMapLocationChange}
                />
              </div>
            )}
          </section>
          )}

          {/* Step 3: Contact & confirmation */}
          {currentStep === 3 && (
            <section className="space-y-5">
              <h2 className="font-bold text-lg text-white">Contact & confirmation</h2>
              {!currentUser && (
                <div className="rounded-xl border border-white/15 bg-white/5 p-4 space-y-3">
                  <p className="text-sm text-slate-200 font-semibold">
                    Create request without account – verify your mobile
                  </p>
                  <p className="text-xs text-slate-400">
                    We will create your SERVICHAYA account after OTP verification so you can track this job.
                  </p>
                  <div className="grid sm:grid-cols-[2fr,1fr] gap-3">
                    <InputField
                      label="Mobile number"
                      value={guestMobile}
                      onChange={(value) => setGuestMobile(value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter 10-digit mobile"
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: otpLoading ? 1 : 1.02 }}
                      whileTap={{ scale: otpLoading ? 1 : 0.98 }}
                      disabled={otpLoading}
                      onClick={handleSendGuestOtp}
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-main text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
                    >
                      {otpLoading ? <ButtonLoader size="sm" /> : 'Send OTP'}
                    </motion.button>
                  </div>
                  {otpSent && (
                    <div className="grid sm:grid-cols-[2fr,1fr] gap-3">
                      <InputField
                        label="OTP"
                        value={otp}
                        onChange={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                      />
                      <motion.button
                        type="button"
                        whileHover={{ scale: otpLoading ? 1 : 1.02 }}
                        whileTap={{ scale: otpLoading ? 1 : 0.98 }}
                        disabled={otpLoading}
                        onClick={handleVerifyGuestOtp}
                        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
                      >
                        {otpLoading ? <ButtonLoader size="sm" /> : 'Verify OTP'}
                      </motion.button>
                    </div>
                  )}
                  {otpVerified && (
                    <p className="text-xs text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Mobile verified. You can submit your request now.
                    </p>
                  )}
                </div>
              )}
              {currentUser && (
                <p className="text-sm text-slate-300">
                  Logged in as <span className="font-semibold text-white">{currentUser.mobileNumber}</span>. We
                  will use this number to contact you about this job.
                </p>
              )}
            </section>
          )}

          <div className="flex justify-between pt-4 border-t border-white/10 mt-4">
            <motion.button
              type="button"
              whileHover={{ scale: currentStep === 1 ? 1 : 1.02 }}
              whileTap={{ scale: currentStep === 1 ? 1 : 0.98 }}
              disabled={currentStep === 1}
              onClick={() =>
                setCurrentStep((prev) => (prev === 1 ? 1 : ((prev - 1) as 1 | 2 | 3)))
              }
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 text-white px-4 py-2 text-sm disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </motion.button>

            {currentStep < 3 ? (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={currentStep === 1 ? handleNextFromStep1 : handleNextFromStep2}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-5 py-2.5 text-sm font-semibold hover:shadow-lg hover:shadow-primary-main/50 transition-all"
              >
                Next
              </motion.button>
            ) : (
              <motion.button
                type="submit"
                whileHover={{ scale: saving ? 1 : 1.02 }}
                whileTap={{ scale: saving ? 1 : 0.98 }}
                disabled={saving || (!currentUser && !otpVerified)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-5 py-2.5 font-semibold disabled:opacity-60 hover:shadow-lg hover:shadow-primary-main/50 transition-all"
              >
                {saving ? (
                  <>
                    <ButtonLoader />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Request
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl glass-dark border border-white/10 p-6"
          >
            <h3 className="font-bold text-lg text-white">What happens next</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="inline-flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-accent-green" />We match your request with relevant nearby providers.</li>
              <li className="inline-flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-accent-green" />You can track progress and updates in My Requests.</li>
              <li className="inline-flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-accent-green" />After completion, payment and rating become available.</li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-emerald-400/30 bg-emerald-500/20 p-5"
          >
            <p className="font-semibold text-emerald-200 inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />Safety note
            </p>
            <p className="text-xs text-emerald-100 mt-2">Share only necessary details. Avoid sensitive personal information in instructions.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-primary-main/30 bg-primary-main/20 p-5"
          >
            <p className="font-semibold inline-flex items-center gap-2 text-primary-light">
              <Sparkles className="w-4 h-4" />Pro tip
            </p>
            <p className="text-xs text-slate-300 mt-2">Include exact issue scope and preferred slot to reduce provider back-and-forth.</p>
          </motion.div>

          {formProgress < 50 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-amber-400/30 bg-amber-500/20 p-5"
            >
              <p className="font-semibold text-amber-200 inline-flex items-center gap-2">
                <Info className="w-4 h-4" />Quick tip
              </p>
              <p className="text-xs text-amber-100 mt-2">Fill in more details to improve your request quality and get better matches.</p>
            </motion.div>
          )}
        </aside>
      </form>
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = 'text',
  icon: Icon,
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  type?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1 text-white">{label}{required ? ' *' : ''}</label>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />}
        <input
          required={required}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl glass border border-white/20 ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 text-sm text-white bg-white/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-main/50 focus:border-primary-main/50`}
        />
      </div>
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  required,
  disabled,
  children,
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1 text-white">{label}{required ? ' *' : ''}</label>
      <select 
        required={required}
        disabled={disabled}
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full rounded-xl glass border border-white/20 px-3 py-2.5 text-sm text-white bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary-main/50 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ colorScheme: 'dark' }}
      >
        {children}
      </select>
    </div>
  )
}
