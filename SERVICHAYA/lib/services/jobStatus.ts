import api from '../api'

export interface JobStatusUpdateDto {
  action: string
  finalPrice?: number
  paymentChannel?: 'CASH' | 'ONLINE'
  cancelReason?: string
}

export const startJob = async (jobId: number, providerId: number): Promise<string> => {
  const response = await api.post(`/jobs/${jobId}/start?providerId=${providerId}`)
  return response.data.data
}

export const completeJob = async (jobId: number, providerId: number, finalPrice: number, paymentChannel: 'CASH' | 'ONLINE' = 'ONLINE'): Promise<string> => {
  const response = await api.post(`/jobs/${jobId}/complete?providerId=${providerId}`, { 
    action: 'COMPLETE', 
    finalPrice,
    paymentChannel 
  })
  return response.data.data
}

export const getCancellationFee = async (jobId: number, userId: number, isProvider: boolean = false): Promise<{
  cancellationFee: number
  refundAmount: number
  jobAmount: number
  canCancel: boolean
}> => {
  const response = await api.get(`/jobs/${jobId}/cancellation-fee?userId=${userId}&isProvider=${isProvider}`)
  return response.data.data
}

export const cancelJob = async (jobId: number, userId: number, cancelReason: string, isProvider: boolean = false): Promise<string> => {
  const response = await api.post(`/jobs/${jobId}/cancel?userId=${userId}&isProvider=${isProvider}`, { action: 'CANCEL', cancelReason })
  return response.data.data
}

// Complete cancellation after fee payment (customer only)
export const completeCancellation = async (jobId: number): Promise<string> => {
  const response = await api.post(`/jobs/${jobId}/complete-cancellation`)
  return response.data.data
}

// Track job status
export interface JobTrackingInfo {
  jobId: number
  jobCode: string
  status: string
  providerId: number | string
  acceptedAt: string | null
  startedAt: string | null
  completedAt: string | null
  finalPrice?: number | string
}

export const trackJob = async (jobId: number, isProvider: boolean = false): Promise<JobTrackingInfo> => {
  const endpoint = isProvider ? `/provider/jobs/${jobId}/track` : `/customer/jobs/${jobId}/track`
  const response = await api.get(endpoint)
  return response.data.data
}