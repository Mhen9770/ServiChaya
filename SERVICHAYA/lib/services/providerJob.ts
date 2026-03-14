import api from '../api'
import { JobDto } from './job'
import { startJob, completeJob, getCancellationFee, trackJob, JobTrackingInfo } from './jobStatus'

// Re-export types
export type { JobDto, JobTrackingInfo }

// Get provider job details
export const getProviderJobDetails = async (jobId: number): Promise<JobDto> => {
  const response = await api.get(`/provider/jobs/${jobId}`)
  return response.data.data
}

// Start job (provider action)
export const startProviderJob = async (jobId: number): Promise<string> => {
  const response = await api.post(`/provider/jobs/${jobId}/start`)
  return response.data.data
}

// Complete job (provider action)
export const completeProviderJob = async (
  jobId: number,
  finalPrice: number,
  paymentChannel: 'CASH' | 'ONLINE' = 'ONLINE'
): Promise<string> => {
  const response = await api.post(`/provider/jobs/${jobId}/complete`, {
    finalPrice,
    paymentChannel,
  })
  return response.data.data
}

// Cancel job (provider action)
export const cancelProviderJob = async (jobId: number, cancelReason: string): Promise<string> => {
  const response = await api.post(`/provider/jobs/${jobId}/cancel`, { cancelReason })
  return response.data.data
}

// Get cancellation fee (provider)
export const getProviderCancellationFee = async (jobId: number): Promise<{
  cancellationFee: number
  refundAmount: number
  jobAmount: number
  canCancel: boolean
}> => {
  const response = await api.get(`/provider/jobs/${jobId}/cancellation-fee`)
  return response.data.data
}

// Track job (provider)
export const trackProviderJob = async (jobId: number): Promise<JobTrackingInfo> => {
  return trackJob(jobId, true)
}
