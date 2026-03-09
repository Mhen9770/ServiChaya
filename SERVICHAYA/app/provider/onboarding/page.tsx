'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getOnboardingStatus, completeStep1, completeStep2, completeStep3, completeStep4, completeStep5, type OnboardingStatus, getAllServiceSkills, getServiceSkillsByCategory, getProviderProfile, getOnboardingData, type OnboardingDataDto, uploadProviderDocuments } from '@/lib/services/provider'
import { getAllCategories } from '@/lib/services/service'
import { getAllActiveCities, getZonesByCity, getPodsByZone } from '@/lib/services/admin'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import { User, FileText, Wrench, MapPin, Sparkles, CheckCircle2, Plus, X, Star, Award, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { PageLoader, ButtonLoader, ContentLoader } from '@/components/ui/Loader'

const ONBOARDING_STEPS = [
  { number: 1, title: 'Basic Info', icon: User, description: 'Personal details' },
  { number: 2, title: 'Documents', icon: FileText, description: 'ID & certificates' },
  { number: 3, title: 'Skills', icon: Wrench, description: 'Your expertise' },
  { number: 4, title: 'Service Area', icon: MapPin, description: 'Where you serve' },
  { number: 5, title: 'Profile', icon: Sparkles, description: 'Complete profile' },
] as const
export default function ProviderOnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Dropdown data
  const [categories, setCategories] = useState<any[]>([])
  const [skills, setSkills] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [pods, setPods] = useState<any[]>([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(false)

  // Step 1 Data
  const [step1Data, setStep1Data] = useState({
    firstName: '',
    lastName: '',
    email: '',
    businessName: '',
    providerType: 'INDIVIDUAL',
  })

  // Step 2 Data
  const [step2Data, setStep2Data] = useState({
    aadhaarNumber: '',
    panNumber: '',
    // URLs are now managed internally after upload; not entered manually by user
    aadhaarUrl: '',
    panUrl: '',
    addressProofUrl: '',
    profilePhotoUrl: '',
  })

  const [step2Files, setStep2Files] = useState<{
    aadhaar?: File
    pan?: File
    address?: File
    photo?: File
  }>({})

  // Step 3 Data
  const [step3Data, setStep3Data] = useState<Array<{
    skillId: number
    isPrimary: boolean
    experienceYears: number
    certificationName: string
    certificationDocumentUrl: string
  }>>([])

  // Step 3 certification files (keyed by skill index)
  const [step3Files, setStep3Files] = useState<{ [index: number]: File | undefined }>({})

  // Step 4 Data
  const [step4Data, setStep4Data] = useState<Array<{
    cityId: number
    zoneId: number
    podId: number
    serviceRadiusKm: number
    isPrimary: boolean
  }>>([])

  // Step 5 Data
  const [step5Data, setStep5Data] = useState({
    bio: '',
    profileImageUrl: '',
    experienceYears: 0,
  })

  useEffect(() => {
    // Small delay to ensure localStorage is available after redirect
    const timer = setTimeout(() => {
      checkOnboardingStatus()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [router])

  // Load dropdown data when step changes
  useEffect(() => {
    if (currentStep === 3) {
      loadSkillsData()
    } else if (currentStep === 4) {
      loadLocationData()
    }
  }, [currentStep])

  const loadSkillsData = async () => {
    try {
      setLoadingDropdowns(true)
      const [catsData, skillsData] = await Promise.all([
        getAllCategories(),
        getAllServiceSkills()
      ])
      setCategories(catsData)
      setSkills(skillsData)
    } catch (error) {
      console.error('Failed to load skills data:', error)
      toast.error('Failed to load skills data')
    } finally {
      setLoadingDropdowns(false)
    }
  }

  const loadLocationData = async () => {
    try {
      setLoadingDropdowns(true)
      const citiesData = await getAllActiveCities()
      setCities(citiesData)
    } catch (error) {
      console.error('Failed to load location data:', error)
      toast.error('Failed to load location data')
    } finally {
      setLoadingDropdowns(false)
    }
  }

  const handleCityChange = async (cityId: number, index: number) => {
    try {
      const zonesData = await getZonesByCity(cityId)
      const newStep4Data = [...step4Data]
      newStep4Data[index] = { ...newStep4Data[index], cityId, zoneId: 0, podId: 0 }
      setStep4Data(newStep4Data)
      setZones(zonesData)
    } catch (error) {
      console.error('Failed to load zones:', error)
      toast.error('Failed to load zones')
    }
  }

  const handleZoneChange = async (zoneId: number, index: number) => {
    try {
      const podsData = await getPodsByZone(zoneId)
      const newStep4Data = [...step4Data]
      newStep4Data[index] = { ...newStep4Data[index], zoneId, podId: 0 }
      setStep4Data(newStep4Data)
      setPods(podsData)
    } catch (error) {
      console.error('Failed to load pods:', error)
      toast.error('Failed to load pods')
    }
  }

  const loadOnboardingDataFromDto = (data: OnboardingDataDto) => {
    try {
      // Load Step 1 data
      if (data.step1) {
        setStep1Data({
          firstName: data.step1.firstName || '',
          lastName: data.step1.lastName || '',
          email: data.step1.email || '',
          businessName: data.step1.businessName || '',
          providerType: data.step1.providerType || 'INDIVIDUAL',
        })
      }

      // Load Step 2 data (Documents)
      if (data.step2 && data.step2.documents && data.step2.documents.length > 0) {
        const docs = data.step2.documents
        const aadhaarDoc = docs.find(d => d.documentType === 'AADHAAR')
        const panDoc = docs.find(d => d.documentType === 'PAN')
        const addressDoc = docs.find(d => d.documentType === 'ADDRESS_PROOF')
        const photoDoc = docs.find(d => d.documentType === 'PROFILE_PHOTO')
        
        setStep2Data({
          aadhaarNumber: aadhaarDoc?.documentNumber || '',
          panNumber: panDoc?.documentNumber || '',
          aadhaarUrl: aadhaarDoc?.documentUrl || '',
          panUrl: panDoc?.documentUrl || '',
          addressProofUrl: addressDoc?.documentUrl || '',
          profilePhotoUrl: photoDoc?.documentUrl || '',
        })
      }

      // Load Step 3 data (Skills)
      if (data.step3 && data.step3.skills && data.step3.skills.length > 0) {
        const skillsData = data.step3.skills.map(skill => ({
          skillId: skill.skillId,
          isPrimary: skill.isPrimary || false,
          experienceYears: skill.experienceYears || 0,
          certificationName: skill.certificationName || '',
          certificationDocumentUrl: skill.certificationDocumentUrl || '',
        }))
        setStep3Data(skillsData)
      }

      // Load Step 4 data (Service Areas)
      if (data.step4 && data.step4.serviceAreas && data.step4.serviceAreas.length > 0) {
        const areasData = data.step4.serviceAreas.map(area => ({
          cityId: area.cityId,
          zoneId: area.zoneId,
          podId: area.podId,
          serviceRadiusKm: area.serviceRadiusKm || 5,
          isPrimary: area.isPrimary || false,
        }))
        setStep4Data(areasData)
      }

      // Load Step 5 data
      if (data.step5) {
        setStep5Data({
          bio: data.step5.bio || '',
          profileImageUrl: data.step5.profileImageUrl || '',
          experienceYears: data.step5.experienceYears || 0,
        })
      }
    } catch (error) {
      console.error('Failed to load onboarding data from DTO:', error)
      // Don't show error toast as this is optional
    }
  }

  const checkOnboardingStatus = async () => {
    try {
      // Wait a bit for localStorage to be available after page load
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const currentUser = getCurrentUser()
      if (!currentUser) {
        // Redirect to login with onboarding page as redirect target
        const currentPath = '/provider/onboarding'
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
        return
      }

      setUser(currentUser)

      // Allow any authenticated user to access onboarding (they might be CUSTOMER wanting to become provider)
      // The backend will handle creating the provider profile

      // Get complete onboarding data in one call
      const onboardingData = await getOnboardingData(currentUser.userId)
      setStatus(onboardingData.status)
      setCurrentStep(onboardingData.status.currentStep || 1)
      
      // Load all existing data from the comprehensive DTO
      loadOnboardingDataFromDto(onboardingData)
    } catch (error: any) {
      console.error('Failed to fetch onboarding status:', error)
      // If error (e.g., no provider profile exists yet), start from step 1
      setCurrentStep(1)
      setStatus({
        currentStep: 1,
        onboardingCompleted: false,
        profileStatus: 'NOT_STARTED',
        verificationStatus: 'PENDING',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStep1Submit = async () => {
    if (!step1Data.firstName || !step1Data.lastName) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      setSubmitting(true)
      const currentUser = getCurrentUser()
      if (!currentUser) {
        toast.error('Please login first')
        return
      }
      const status = await completeStep1(currentUser.userId, step1Data)
      setStatus(status)
      setCurrentStep(2)
      
      // Update user role in localStorage after Step 1 (user is now SERVICE_PROVIDER)
      const updatedUser = getCurrentUser()
      if (updatedUser) {
        updatedUser.role = 'SERVICE_PROVIDER'
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
      
      toast.success('Step 1 completed! You are now registered as a Service Provider.')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save step 1')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStep2Submit = async () => {
    try {
      setSubmitting(true)
      const currentUser = getCurrentUser()
      if (!currentUser) {
        toast.error('Please login first')
        return
      }
      // Build file list and metadata (type + number) for upload
      const filesToUpload: File[] = []
      const fileMeta: { type: string; number?: string }[] = []

      if (step2Files.aadhaar) {
        filesToUpload.push(step2Files.aadhaar)
        fileMeta.push({ type: 'AADHAAR', number: step2Data.aadhaarNumber })
      }
      if (step2Files.pan) {
        filesToUpload.push(step2Files.pan)
        fileMeta.push({ type: 'PAN', number: step2Data.panNumber })
      }
      if (step2Files.address) {
        filesToUpload.push(step2Files.address)
        fileMeta.push({ type: 'ADDRESS_PROOF' })
      }
      if (step2Files.photo) {
        filesToUpload.push(step2Files.photo)
        fileMeta.push({ type: 'PROFILE_PHOTO' })
      }

      if (filesToUpload.length === 0) {
        toast.error('Please upload at least one document')
        return
      }

      const uploadedUrls = await uploadProviderDocuments(filesToUpload)

      const finalDocs = uploadedUrls.map((url, index) => {
        const meta = fileMeta[index]
        return {
          documentType: meta.type,
          ...(meta.number ? { documentNumber: meta.number } : {}),
          documentUrl: url,
        }
      })

      const status = await completeStep2(currentUser.userId, { documents: finalDocs })
      setStatus(status)
      setCurrentStep(3)
      toast.success('Step 2 completed!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save step 2')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStep3Submit = async () => {
    if (step3Data.length === 0) {
      toast.error('Please select at least one skill')
      return
    }

    const hasPrimary = step3Data.some(s => s.isPrimary)
    if (!hasPrimary) {
      toast.error('Please mark at least one skill as primary')
      return
    }

    try {
      setSubmitting(true)
      const currentUser = getCurrentUser()
      if (!currentUser) {
        toast.error('Please login first')
        return
      }

      // Upload any certification files first
      const filesToUpload: File[] = []
      const fileSkillIndexes: number[] = []
      step3Data.forEach((skill, index) => {
        const file = step3Files[index]
        if (file) {
          filesToUpload.push(file)
          fileSkillIndexes.push(index)
        }
      })

      let updatedSkills = [...step3Data]
      if (filesToUpload.length > 0) {
        const uploadedUrls = await uploadProviderDocuments(filesToUpload)
        uploadedUrls.forEach((url, i) => {
          const skillIndex = fileSkillIndexes[i]
          if (skillIndex !== undefined) {
            updatedSkills[skillIndex] = {
              ...updatedSkills[skillIndex],
              certificationDocumentUrl: url,
            }
          }
        })
      }

      const status = await completeStep3(currentUser.userId, { skills: updatedSkills })
      setStatus(status)
      setCurrentStep(4)
      toast.success('Step 3 completed!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save step 3')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStep4Submit = async () => {
    if (step4Data.length === 0) {
      toast.error('Please select at least one service area')
      return
    }

    try {
      setSubmitting(true)
      const currentUser = getCurrentUser()
      if (!currentUser) {
        toast.error('Please login first')
        return
      }
      const status = await completeStep4(currentUser.userId, { serviceAreas: step4Data })
      setStatus(status)
      setCurrentStep(5)
      toast.success('Step 4 completed!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save step 4')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStep5Submit = async () => {
    if (!step5Data.bio || step5Data.experienceYears === 0) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      setSubmitting(true)
      const currentUser = getCurrentUser()
      if (!currentUser) {
        toast.error('Please login first')
        return
      }
      const status = await completeStep5(currentUser.userId, step5Data)
      setStatus(status)
      setCurrentStep(6)
      toast.success('Onboarding completed! Waiting for admin verification.')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save step 5')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PageLoader text="Loading onboarding..." />
    )
  }

  // Step 6: Verification Pending
  if (currentStep === 6) {
    return (
      <div className="min-h-screen bg-[#010B2A] text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-xl text-center border border-white/20 text-white">
              <div className="w-20 h-20 bg-primary-main/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-primary-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-4 text-white font-display">Onboarding Complete!</h1>
              <p className="text-lg text-slate-300 mb-6">
                Your profile is under review. We'll notify you once it's verified.
              </p>
              <div className="bg-primary-main/20 rounded-2xl p-6 mb-6 border border-primary-main/30">
                <p className="text-sm text-slate-300">
                  Status: <span className="font-semibold text-primary-light">Pending Verification</span>
                </p>
              </div>
              <Link
                href="/provider/dashboard"
                className="inline-block px-8 py-3 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 7: Approved (handled in dashboard)
  if (status?.profileStatus === 'ACTIVE') {
    router.push('/provider/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-[#010B2A] text-white">
      {/* Main Content */}
      <div className="w-full mx-auto px-4 py-4 md:py-6 max-w-6xl">
        {/* Page Header */}
        <div className="text-center mb-6 md:mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-primary-light mb-2">
            SERVICHAYA PARTNER PROGRAM
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 font-display">
            Become a <span className="text-primary-light">Service Provider</span>
          </h1>
          <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto">
            Complete these simple steps to start receiving verified jobs and grow your income in your city.
          </p>
        </div>

        <div className="grid lg:grid-cols-[2fr,1fr] gap-6 md:gap-8 mb-6">
          {/* Progress Bar */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-lg border border-white/15 text-white">
            <div className="flex items-center justify-between mb-6">
              {ONBOARDING_STEPS.map((step) => (
                <div key={step.number} className="flex flex-col items-center flex-1 relative">
                  {/* Connection Line */}
                  {step.number < ONBOARDING_STEPS.length && (
                    <div className="hidden md:block absolute top-6 left-[60%] w-full h-0.5 bg-white/20 -z-10">
                      <div
                        className={`h-full transition-all duration-500 ${
                          step.number < currentStep
                            ? 'bg-gradient-to-r from-primary-main to-primary-light'
                            : 'bg-white/20'
                        }`}
                        style={{ width: step.number < currentStep ? '100%' : '0%' }}
                      ></div>
                    </div>
                  )}
                  
                  <div
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-3 transition-all ${
                      step.number < currentStep
                        ? 'bg-accent-green text-white shadow-lg scale-110'
                        : step.number === currentStep
                        ? 'bg-primary-main text-white shadow-lg scale-110 ring-4 ring-primary-main/20'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {step.number < currentStep ? (
                      <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7" />
                    ) : (
                      <step.icon className="w-6 h-6 md:w-7 md:h-7" />
                    )}
                  </div>
                  <div className="text-center">
                    <span className={`text-xs md:text-sm font-semibold block ${
                      step.number === currentStep ? 'text-primary-light' : 'text-slate-400'
                    }`}>
                      {step.title}
                    </span>
                    <span className="text-xs text-slate-400 hidden md:block mt-1">
                      {step.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-main to-primary-dark transition-all duration-500"
                style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Benefits / Info card */}
          <div className="hidden lg:block">
            <div className="glass-dark border border-white/10 rounded-3xl p-5 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-light" />
                Why join as SERVICHAYA provider?
              </h3>
              <ul className="text-xs text-slate-300 space-y-2">
                <li>• Get nearby jobs from verified customers in your city.</li>
                <li>• Transparent earnings and payout tracking from dashboard.</li>
                <li>• Support team to help you with onboarding and verification.</li>
              </ul>
            </div>
          </div>
        </div>

          {/* Step Content Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-10 shadow-xl border border-white/20 text-white">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-main/10 text-primary-main rounded-full text-xs font-semibold mb-4">
                    Step 1 of 5
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white font-display">Basic Information</h2>
                  <p className="text-slate-300">Tell us about yourself to get started</p>
                </div>
                
                <div className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-white">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={step1Data.firstName}
                        onChange={(e) => setStep1Data({ ...step1Data, firstName: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-white">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={step1Data.lastName}
                        onChange={(e) => setStep1Data({ ...step1Data, lastName: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-white">Email</label>
                    <input
                      type="email"
                      value={step1Data.email}
                      onChange={(e) => setStep1Data({ ...step1Data, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-white">
                      Provider Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={step1Data.providerType}
                      onChange={(e) => setStep1Data({ ...step1Data, providerType: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all"
                    >
                      <option value="INDIVIDUAL">Individual Provider</option>
                      <option value="BUSINESS">Business/Company</option>
                    </select>
                  </div>
                  {step1Data.providerType === 'BUSINESS' && (
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-white">Business Name</label>
                      <input
                        type="text"
                        value={step1Data.businessName}
                        onChange={(e) => setStep1Data({ ...step1Data, businessName: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all"
                        placeholder="Enter business name"
                      />
                    </div>
                  )}
                </div>
                
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleStep1Submit}
                    disabled={submitting || !step1Data.firstName || !step1Data.lastName}
                    className="px-8 py-3 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <ButtonLoader />
                        Saving...
                      </span>
                    ) : (
                      'Continue'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Documents */}
            {currentStep === 2 && (
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-main/10 text-primary-main rounded-full text-xs font-semibold mb-4">
                    Step 2 of 5
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white font-display">Document Upload</h2>
                  <p className="text-slate-300">Upload your verification documents</p>
                </div>
                
                <div className="space-y-5">
                  <div className="bg-primary-main/10 border border-primary-main/40 rounded-xl p-4 mb-6 text-xs text-slate-100">
                    <p className="font-semibold mb-1">Document security</p>
                    <p className="text-slate-300">
                      Your documents are uploaded securely to SERVICHAYA servers and used only for verification. You can upload
                      Aadhaar, PAN, address proof and a clear profile photo.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-white">Aadhaar Number</label>
                    <input
                      type="text"
                      value={step2Data.aadhaarNumber}
                      onChange={(e) => setStep2Data({ ...step2Data, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                      className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all"
                      placeholder="Enter 12-digit Aadhaar number"
                      maxLength={12}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-white">Aadhaar File</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          setStep2Files((prev) => ({ ...prev, aadhaar: file }))
                        }}
                        className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-main/80 file:text-white hover:file:bg-primary-main cursor-pointer"
                      />
                      {step2Files.aadhaar && (
                        <p className="mt-1 text-xs text-slate-400">Selected: {step2Files.aadhaar.name}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-white">PAN Number</label>
                    <input
                      type="text"
                      value={step2Data.panNumber}
                      onChange={(e) => setStep2Data({ ...step2Data, panNumber: e.target.value.toUpperCase().slice(0, 10) })}
                      className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all"
                      placeholder="Enter PAN number"
                      maxLength={10}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-white">PAN File</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          setStep2Files((prev) => ({ ...prev, pan: file }))
                        }}
                        className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-main/80 file:text-white hover:file:bg-primary-main cursor-pointer"
                      />
                      {step2Files.pan && (
                        <p className="mt-1 text-xs text-slate-400">Selected: {step2Files.pan.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-white">Address Proof File</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          setStep2Files((prev) => ({ ...prev, address: file }))
                        }}
                        className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-main/80 file:text-white hover:file:bg-primary-main cursor-pointer"
                      />
                      {step2Files.address && (
                        <p className="mt-1 text-xs text-slate-400">Selected: {step2Files.address.name}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">Utility bill, rental agreement, or any government document with address</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-white">Profile Photo File</label>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          setStep2Files((prev) => ({ ...prev, photo: file }))
                        }}
                        className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-main/80 file:text-white hover:file:bg-primary-main cursor-pointer"
                      />
                      {step2Files.photo && (
                        <p className="mt-1 text-xs text-slate-400">Selected: {step2Files.photo.name}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 border-2 border-white/20 text-white rounded-xl font-semibold hover:bg-white/10 transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleStep2Submit}
                    disabled={
                      submitting ||
                      (!step2Files.aadhaar &&
                        !step2Files.pan &&
                        !step2Files.address &&
                        !step2Files.photo)
                    }
                    className="px-8 py-3 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <ButtonLoader />
                        Saving...
                      </span>
                    ) : (
                      'Continue'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Skills Selection */}
            {currentStep === 3 && (
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-main/10 text-primary-main rounded-full text-xs font-semibold mb-4">
                    Step 3 of 5
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white font-display">Select Your Skills</h2>
                  <p className="text-slate-300">Choose the skills you offer and mark your primary skill</p>
                </div>

                {loadingDropdowns ? (
                  <Loader text="Loading skills..." />
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setStep3Data([...step3Data, {
                            skillId: 0,
                            isPrimary: step3Data.length === 0,
                            experienceYears: 0,
                            certificationName: '',
                            certificationDocumentUrl: ''
                          }])
                        }}
                        className="px-4 py-2 bg-primary-main text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Skill
                      </button>
                    </div>

                    {step3Data.map((skill, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 rounded-2xl p-5 border-2 border-white/10"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-primary-main" />
                            <span className="font-semibold text-white">Skill {index + 1}</span>
                            {skill.isPrimary && (
                              <span className="px-2 py-1 bg-accent-green/10 text-accent-green rounded-full text-xs font-semibold flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                Primary
                              </span>
                            )}
                          </div>
                          {step3Data.length > 1 && (
                            <button
                              onClick={() => {
                                const newData = step3Data.filter((_, i) => i !== index)
                                // If deleted skill was primary, make first one primary
                                if (skill.isPrimary && newData.length > 0) {
                                  newData[0].isPrimary = true
                                }
                                setStep3Data(newData)
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold mb-2 text-white">
                              Skill <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={skill.skillId}
                              onChange={(e) => {
                                const newData = [...step3Data]
                                newData[index].skillId = Number(e.target.value)
                                setStep3Data(newData)
                              }}
                              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all"
                            >
                              <option value={0}>Select a skill</option>
                              {skills.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-2 text-white">
                              Experience (Years) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={skill.experienceYears}
                              onChange={(e) => {
                                const newData = [...step3Data]
                                newData[index].experienceYears = Number(e.target.value)
                                setStep3Data(newData)
                              }}
                              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all"
                              placeholder="Years of experience"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={skill.isPrimary}
                              onChange={(e) => {
                                const newData = step3Data.map((s, i) => ({
                                  ...s,
                                  isPrimary: i === index ? e.target.checked : false
                                }))
                                setStep3Data(newData)
                              }}
                              className="w-4 h-4 text-primary-main rounded focus:ring-primary-main"
                            />
                            <span className="text-sm font-semibold text-white">Mark as Primary Skill</span>
                          </label>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-semibold mb-2 text-white">Certification Name (Optional)</label>
                            <input
                              type="text"
                              value={skill.certificationName}
                              onChange={(e) => {
                                const newData = [...step3Data]
                                newData[index].certificationName = e.target.value
                                setStep3Data(newData)
                              }}
                              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all"
                              placeholder="e.g., Certified Electrician"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-2 text-white">Certification Document (Optional)</label>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                setStep3Files((prev) => ({ ...prev, [index]: file }))
                              }}
                              className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-main/80 file:text-white hover:file:bg-primary-main cursor-pointer"
                            />
                            {step3Files[index] && (
                              <p className="mt-1 text-xs text-slate-400">
                                Selected: {step3Files[index]?.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {step3Data.length === 0 && (
                      <div className="text-center py-8 text-slate-300">
                        <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No skills added yet. Click "Add Skill" to get started.</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-8 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 border-2 border-white/20 text-white rounded-xl font-semibold hover:bg-white/10 transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleStep3Submit}
                    disabled={submitting || step3Data.length === 0 || step3Data.some(s => !s.skillId || s.experienceYears === 0)}
                    className="px-8 py-3 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <ButtonLoader />
                        Saving...
                      </span>
                    ) : (
                      'Continue'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Service Area Selection */}
            {currentStep === 4 && (
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-main/10 text-primary-main rounded-full text-xs font-semibold mb-4">
                    Step 4 of 5
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white font-display">Select Service Areas</h2>
                  <p className="text-slate-300">Choose the areas where you provide services</p>
                </div>

                {loadingDropdowns ? (
                  <Loader text="Loading locations..." />
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setStep4Data([...step4Data, {
                            cityId: 0,
                            zoneId: 0,
                            podId: 0,
                            serviceRadiusKm: 5,
                            isPrimary: step4Data.length === 0
                          }])
                        }}
                        className="px-4 py-2 bg-primary-main text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Service Area
                      </button>
                    </div>

                    {step4Data.map((area, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 rounded-2xl p-5 border-2 border-white/10"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary-main" />
                            <span className="font-semibold text-white">Service Area {index + 1}</span>
                            {area.isPrimary && (
                              <span className="px-2 py-1 bg-accent-green/10 text-accent-green rounded-full text-xs font-semibold flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                Primary
                              </span>
                            )}
                          </div>
                          {step4Data.length > 1 && (
                            <button
                              onClick={() => {
                                const newData = step4Data.filter((_, i) => i !== index)
                                if (area.isPrimary && newData.length > 0) {
                                  newData[0].isPrimary = true
                                }
                                setStep4Data(newData)
                              }}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold mb-2 text-white">
                              City <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={area.cityId}
                              onChange={(e) => handleCityChange(Number(e.target.value), index)}
                              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all"
                            >
                              <option value={0}>Select City</option>
                              {cities.map((city) => (
                                <option key={city.id} value={city.id}>{city.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-2 text-white">
                              Zone <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={area.zoneId}
                              onChange={(e) => handleZoneChange(Number(e.target.value), index)}
                              disabled={!area.cityId}
                              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value={0}>Select Zone</option>
                              {zones.map((zone) => (
                                <option key={zone.id} value={zone.id}>{zone.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-2 text-white">
                              POD <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={area.podId}
                              onChange={(e) => {
                                const newData = [...step4Data]
                                newData[index].podId = Number(e.target.value)
                                setStep4Data(newData)
                              }}
                              disabled={!area.zoneId}
                              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value={0}>Select POD</option>
                              {pods.map((pod) => (
                                <option key={pod.id} value={pod.id}>{pod.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-2 text-white">
                              Service Radius (Km) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={area.serviceRadiusKm}
                              onChange={(e) => {
                                const newData = [...step4Data]
                                newData[index].serviceRadiusKm = Number(e.target.value)
                                setStep4Data(newData)
                              }}
                              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all"
                              placeholder="Service radius in km"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={area.isPrimary}
                              onChange={(e) => {
                                const newData = step4Data.map((a, i) => ({
                                  ...a,
                                  isPrimary: i === index ? e.target.checked : false
                                }))
                                setStep4Data(newData)
                              }}
                              className="w-4 h-4 text-primary-main rounded focus:ring-primary-main"
                            />
                            <span className="text-sm font-semibold text-slate-200">Mark as Primary Service Area</span>
                          </label>
                        </div>
                      </motion.div>
                    ))}

                    {step4Data.length === 0 && (
                      <div className="text-center py-8 text-slate-300">
                        <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No service areas added yet. Click "Add Service Area" to get started.</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-8 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-3 border-2 border-white/20 text-white rounded-xl font-semibold hover:bg-white/10 transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleStep4Submit}
                    disabled={submitting || step4Data.length === 0 || step4Data.some(a => !a.cityId || !a.zoneId || !a.podId)}
                    className="px-8 py-3 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <ButtonLoader />
                        Saving...
                      </span>
                    ) : (
                      'Continue'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Profile Completion */}
            {currentStep === 5 && (
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-main/10 text-primary-main rounded-full text-xs font-semibold mb-4">
                    Step 5 of 5
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white font-display">Complete Your Profile</h2>
                  <p className="text-slate-300">Add a bio and experience to complete your profile</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-white">
                      Bio/Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={step5Data.bio}
                      onChange={(e) => setStep5Data({ ...step5Data, bio: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all resize-none"
                      placeholder="Tell customers about yourself, your experience, and what makes you special..."
                    />
                    <p className="text-xs text-slate-300 mt-1">
                      {step5Data.bio.length}/500 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-white">
                      Total Experience (Years) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={step5Data.experienceYears}
                      onChange={(e) => setStep5Data({ ...step5Data, experienceYears: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all"
                      placeholder="Total years of experience"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-white">Profile Image URL (Optional)</label>
                    <input
                      type="url"
                      value={step5Data.profileImageUrl}
                      onChange={(e) => setStep5Data({ ...step5Data, profileImageUrl: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-main/20 transition-all"
                      placeholder="https://example.com/profile.jpg"
                    />
                    {step5Data.profileImageUrl && (
                      <div className="mt-3">
                        <img src={step5Data.profileImageUrl} alt="Profile preview" className="w-24 h-24 rounded-full object-cover border-2 border-white/20 shadow-md" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="px-6 py-3 border-2 border-white/20 text-white rounded-xl font-semibold hover:bg-white/10 transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleStep5Submit}
                    disabled={submitting || !step5Data.bio || step5Data.bio.length < 20 || step5Data.experienceYears === 0}
                    className="px-8 py-3 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <ButtonLoader />
                        Submitting...
                      </>
                    ) : (
                      'Complete Onboarding'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  
  )
}
