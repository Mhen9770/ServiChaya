import api from '../api'
import { JobDto } from './job'
import { getCancellationFee, completeCancellation, trackJob, JobTrackingInfo } from './jobStatus'

export type { JobTrackingInfo }

// Get customer job details
export const getCustomerJobDetails = async (jobId: number): Promise<JobDto> => {
  const response = await api.get(`/customer/jobs/${jobId}`)
  return response.data.data
}

// Cancel job (customer action)
export const cancelCustomerJob = async (jobId: number, cancelReason: string): Promise<string> => {
  const response = await api.post(`/customer/jobs/${jobId}/cancel`, { cancelReason })
  return response.data.data
}

// Get cancellation fee (customer)
export const getCustomerCancellationFee = async (jobId: number): Promise<{
  cancellationFee: number
  refundAmount: number
  jobAmount: number
  canCancel: boolean
}> => {
  const response = await api.get(`/customer/jobs/${jobId}/cancellation-fee`)
  return response.data.data
}

// Complete cancellation (customer)
export const completeCustomerCancellation = async (jobId: number): Promise<string> => {
  return completeCancellation(jobId)
}

// Track job (customer)
export const trackCustomerJob = async (jobId: number): Promise<JobTrackingInfo> => {
  return trackJob(jobId, false)
}
