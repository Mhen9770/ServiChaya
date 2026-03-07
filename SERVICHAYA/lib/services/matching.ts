import api from '../api'

export interface ProviderMatchDto {
  matchId: number
  jobId: number
  providerId: number
  matchScore: number
  status: string
  notifiedAt?: string
  respondedAt?: string
  rankOrder?: number
  job: {
    id: number
    jobCode: string
    title: string
    description: string
    preferredTime: string
    isEmergency: boolean
    estimatedBudget?: number
    addressLine1: string
    cityName?: string
  }
  provider?: {
    id: number
    businessName: string
    providerCode: string
    rating?: number
    totalJobsCompleted?: number
  }
}

export interface MatchingResultDto {
  jobId: number
  jobCode: string
  totalProvidersMatched: number
  providersNotified: number
  matches: ProviderMatchDto[]
}

// Match job to providers
export const matchJobToProviders = async (jobId: number): Promise<MatchingResultDto> => {
  const response = await api.post(`/matching/job/${jobId}/match`)
  return response.data.data
}

// Get available jobs for provider
export const getAvailableJobsForProvider = async (providerId: number): Promise<ProviderMatchDto[]> => {
  const response = await api.get(`/matching/provider/${providerId}/available-jobs`)
  return response.data.data
}

// Accept a job match
export const acceptJob = async (matchId: number, providerId: number): Promise<string> => {
  const response = await api.post(`/matching/match/${matchId}/accept?providerId=${providerId}`)
  return response.data.data
}
