import api from '../api'

export interface ProviderSelectionDto {
  providerId: number
  providerCode: string
  providerName: string
  providerType: string
  rating: number
  ratingCount: number
  totalJobsCompleted: number
  experienceYears: number
  verificationStatus: string
  bidAmount: number
  proposedPrice?: number
  rankOrder: number
  distanceKm?: number
  bio?: string
  profileImageUrl?: string
  isOnline?: boolean
  unreadMessageCount?: number
  isPaidProvider?: boolean // True if provider has bid amount > 0 (paid platform fee)
}

export interface SubmitBidRequest {
  bidAmount: number
  proposedPrice?: number
  notes?: string
}

export interface ProviderBid {
  id: number
  jobId: number
  providerId: number
  bidAmount: number
  rankOrder?: number
  status: string
  proposedPrice?: number
  notes?: string
}

/**
 * Get available providers for a job (paginated, ranked)
 */
export const getAvailableProviders = async (
  jobId: number,
  page: number = 0,
  size: number = 10
): Promise<{ content: ProviderSelectionDto[]; totalElements: number; totalPages: number }> => {
  const response = await api.get(`/jobs/${jobId}/providers`, {
    params: { page, size }
  })
  return response.data.data
}

/**
 * Submit or update a provider bid
 */
export const submitBid = async (
  jobId: number,
  providerId: number,
  bidData: SubmitBidRequest
): Promise<ProviderBid> => {
  const response = await api.post(`/jobs/${jobId}/providers/${providerId}/bid`, bidData)
  return response.data.data
}

/**
 * Get provider's bid for a job
 */
export const getProviderBid = async (
  jobId: number,
  providerId: number
): Promise<ProviderBid | null> => {
  const response = await api.get(`/jobs/${jobId}/providers/${providerId}/bid`)
  return response.data.data
}

/**
 * Get matched providers for a job (system-matched providers)
 */
export const getMatchedProviders = async (jobId: number): Promise<any[]> => {
  const response = await api.get(`/jobs/${jobId}/providers/matched`)
  return response.data.data
}

/**
 * Customer selects a provider for their job
 */
export const selectProvider = async (jobId: number, providerId: number): Promise<string> => {
  const response = await api.post(`/jobs/${jobId}/providers/${providerId}/select`)
  return response.data.data
}

/**
 * Customer confirms a provider who has accepted the job
 * This is the final confirmation step after provider accepts
 */
export const confirmProviderAcceptance = async (jobId: number, providerId: number): Promise<string> => {
  const response = await api.post(`/jobs/${jobId}/providers/${providerId}/confirm`)
  return response.data.data
}