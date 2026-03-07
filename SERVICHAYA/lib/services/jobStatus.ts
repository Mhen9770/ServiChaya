import api from '../api'

export interface JobStatusUpdateDto {
  action: string
  finalPrice?: number
  cancelReason?: string
}

export const startJob = async (jobId: number, providerId: number): Promise<string> => {
  const response = await api.post(`/jobs/${jobId}/start?providerId=${providerId}`)
  return response.data.data
}

export const completeJob = async (jobId: number, providerId: number, finalPrice: number): Promise<string> => {
  const response = await api.post(`/jobs/${jobId}/complete?providerId=${providerId}`, { action: 'COMPLETE', finalPrice })
  return response.data.data
}

export const cancelJob = async (jobId: number, userId: number, cancelReason: string, isProvider: boolean = false): Promise<string> => {
  const response = await api.post(`/jobs/${jobId}/cancel?userId=${userId}&isProvider=${isProvider}`, { action: 'CANCEL', cancelReason })
  return response.data.data
}
