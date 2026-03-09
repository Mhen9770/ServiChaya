import api from '../api'

export interface OnboardingStatus {
  currentStep: number
  onboardingCompleted: boolean
  profileStatus: string
  verificationStatus: string
  providerId?: number
}

export interface OnboardingStep1Dto {
  firstName: string
  lastName: string
  email: string
  businessName?: string
  providerType: string
}

export interface OnboardingStep2Dto {
  documents: Array<{
    documentType: string
    documentNumber?: string
    documentUrl: string
  }>
}

export interface OnboardingStep3Dto {
  skills: Array<{
    skillId: number
    isPrimary: boolean
    experienceYears: number
    certificationName?: string
    certificationDocumentUrl?: string
  }>
}

export interface OnboardingStep4Dto {
  serviceAreas: Array<{
    cityId: number
    zoneId: number
    podId: number
    serviceRadiusKm: number
    isPrimary: boolean
  }>
}

export interface OnboardingStep5Dto {
  bio: string
  profileImageUrl?: string
  experienceYears: number
}

export const uploadProviderDocuments = async (files: File[]): Promise<string[]> => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })

  const response = await api.post('/provider/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data.data as string[]
}

// Get onboarding status
export const getOnboardingStatus = async (userId: number): Promise<OnboardingStatus> => {
  const response = await api.get(`/provider/onboarding/status?userId=${userId}`)
  return response.data.data
}

// Get complete onboarding data (all steps)
export interface OnboardingDataDto {
  status: OnboardingStatus
  step1: {
    firstName: string
    lastName: string
    email: string
    businessName?: string
    providerType: string
    completed: boolean
  }
  step2: {
    documents: Array<{
      documentType: string
      documentNumber?: string
      documentUrl: string
    }>
    completed: boolean
  }
  step3: {
    skills: Array<{
      skillId: number
      isPrimary: boolean
      experienceYears: number
      certificationName?: string
      certificationDocumentUrl?: string
    }>
    completed: boolean
  }
  step4: {
    serviceAreas: Array<{
      cityId: number
      zoneId: number
      podId: number
      serviceRadiusKm: number
      isPrimary: boolean
    }>
    completed: boolean
  }
  step5: {
    bio?: string
    profileImageUrl?: string
    experienceYears?: number
    completed: boolean
  }
}

export const getOnboardingData = async (userId: number): Promise<OnboardingDataDto> => {
  const response = await api.get(`/provider/onboarding/data?userId=${userId}`)
  return response.data.data
}

// Complete Step 1
export const completeStep1 = async (userId: number, data: OnboardingStep1Dto): Promise<OnboardingStatus> => {
  const response = await api.post(`/provider/onboarding/step/1?userId=${userId}`, data)
  return response.data.data
}

// Complete Step 2
export const completeStep2 = async (userId: number, data: OnboardingStep2Dto): Promise<OnboardingStatus> => {
  const response = await api.post(`/provider/onboarding/step/2?userId=${userId}`, data)
  return response.data.data
}

// Complete Step 3
export const completeStep3 = async (userId: number, data: OnboardingStep3Dto): Promise<OnboardingStatus> => {
  const response = await api.post(`/provider/onboarding/step/3?userId=${userId}`, data)
  return response.data.data
}

// Complete Step 4
export const completeStep4 = async (userId: number, data: OnboardingStep4Dto): Promise<OnboardingStatus> => {
  const response = await api.post(`/provider/onboarding/step/4?userId=${userId}`, data)
  return response.data.data
}

// Complete Step 5
export const completeStep5 = async (userId: number, data: OnboardingStep5Dto): Promise<OnboardingStatus> => {
  const response = await api.post(`/provider/onboarding/step/5?userId=${userId}`, data)
  return response.data.data
}

// Provider Profile
export interface SkillDto {
  skillId: number
  isPrimary: boolean
  experienceYears: number
  certificationName?: string
  certificationDocumentUrl?: string
}

export interface ServiceAreaDto {
  cityId: number
  zoneId: number
  podId: number
  serviceRadiusKm: number
  isPrimary: boolean
}

export interface ProviderProfileDto {
  id: number
  userId: number
  providerCode: string
  businessName?: string
  providerType: string
  experienceYears?: number
  rating?: number
  ratingCount?: number
  totalJobsCompleted?: number
  verificationStatus: string
  profileStatus: string
  isAvailable: boolean
  bio?: string
  skills?: SkillDto[]
  serviceAreas?: ServiceAreaDto[]
}

export interface UpdateProviderProfileDto {
  businessName?: string
  bio?: string
  experienceYears?: number
  isAvailable?: boolean
}

export const getProviderProfile = async (providerId: number): Promise<ProviderProfileDto> => {
  const response = await api.get(`/provider/profile?providerId=${providerId}`)
  return response.data.data
}

export const updateProviderProfile = async (providerId: number, data: UpdateProviderProfileDto): Promise<ProviderProfileDto> => {
  const response = await api.put(`/provider/profile?providerId=${providerId}`, data)
  return response.data.data
}

export const updateProviderSkills = async (providerId: number, skills: OnboardingStep3Dto['skills']): Promise<ProviderProfileDto> => {
  const response = await api.put(`/provider/profile/skills?providerId=${providerId}`, { skills })
  return response.data.data
}

export const updateProviderServiceAreas = async (providerId: number, serviceAreas: OnboardingStep4Dto['serviceAreas']): Promise<ProviderProfileDto> => {
  const response = await api.put(`/provider/profile/service-areas?providerId=${providerId}`, { serviceAreas })
  return response.data.data
}

// Helper functions for onboarding dropdowns
export interface ServiceSkillDto {
  id: number
  code: string
  name: string
  description?: string
  isActive: boolean
}

export const getAllServiceSkills = async (): Promise<ServiceSkillDto[]> => {
  const response = await api.get('/admin/master-data/service-skills?page=0&size=1000')
  return response.data.data?.content || []
}

export const getServiceSkillsByCategory = async (categoryId: number): Promise<ServiceSkillDto[]> => {
  const response = await api.get(`/admin/master-data/service-skills?page=0&size=1000&serviceCategoryId=${categoryId}`)
  return response.data.data.content || []
}
