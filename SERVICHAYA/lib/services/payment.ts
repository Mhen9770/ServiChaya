import api from '../api'

export interface PaymentPreferenceDto {
  id: number
  providerId: number
  serviceCategoryId?: number
  paymentType: string
  partialPaymentPercentage?: number
  minimumUpfrontAmount?: number
  hourlyRate?: number
  isActive: boolean
}

export interface CreatePaymentPreferenceDto {
  serviceCategoryId?: number
  paymentType: string
  partialPaymentPercentage?: number
  minimumUpfrontAmount?: number
  hourlyRate?: number
}

export interface PaymentScheduleDto {
  id: number
  jobId: number
  paymentType: string
  hourlyRate?: number
  estimatedHours?: number
  upfrontPercentage?: number
  upfrontAmount: number
  finalAmount: number
  totalAmount: number
  upfrontPaid: boolean
  finalPaid: boolean
  upfrontPaymentDate?: string
  finalPaymentDate?: string
  paymentStatus: string
}

export interface CreatePaymentScheduleDto {
  paymentType: string
  totalAmount: number
  hourlyRate?: number
  estimatedHours?: number
  upfrontPercentage?: number
}

export interface PaymentRequestDto {
  jobId: number
  amount: number
  paymentMethod: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpaySignature?: string
}

export interface EarningsDto {
  id: number
  providerId: number
  jobId: number
  jobAmount: number
  commissionPercentage: number
  commissionAmount: number
  netEarnings: number
  payoutStatus: string
  payoutDate?: string
  payoutTransactionId?: string
}

export interface EarningsSummaryDto {
  totalEarnings: number
  pendingEarnings: number
  paidEarnings: number
  totalJobs: number
  completedJobs: number
}

export const createPaymentSchedule = async (jobId: number, data: CreatePaymentScheduleDto): Promise<PaymentScheduleDto> => {
  const response = await api.post(`/payments/schedule?jobId=${jobId}`, data)
  return response.data.data
}

export const processPayment = async (data: PaymentRequestDto): Promise<string> => {
  const response = await api.post('/payments/process', data)
  return response.data.data
}

export const getPaymentPreferences = async (providerId: number): Promise<PaymentPreferenceDto[]> => {
  const response = await api.get(`/payments/preferences?providerId=${providerId}`)
  return response.data.data
}

export const createPaymentPreference = async (providerId: number, data: CreatePaymentPreferenceDto): Promise<PaymentPreferenceDto> => {
  const response = await api.post(`/payments/preferences?providerId=${providerId}`, data)
  return response.data.data
}

export const updatePaymentPreference = async (preferenceId: number, data: CreatePaymentPreferenceDto): Promise<PaymentPreferenceDto> => {
  const response = await api.put(`/payments/preferences/${preferenceId}`, data)
  return response.data.data
}

export const deletePaymentPreference = async (preferenceId: number): Promise<void> => {
  await api.delete(`/payments/preferences/${preferenceId}`)
}

export const getEarningsSummary = async (providerId: number): Promise<EarningsSummaryDto> => {
  const response = await api.get(`/payments/earnings/summary?providerId=${providerId}`)
  return response.data.data
}

export const getEarningsHistory = async (providerId: number, page: number = 0, size: number = 20): Promise<{ content: EarningsDto[]; totalElements: number; totalPages: number }> => {
  const response = await api.get(`/payments/earnings/history?providerId=${providerId}&page=${page}&size=${size}`)
  return response.data.data
}

export const getPaymentSchedule = async (jobId: number): Promise<PaymentScheduleDto | null> => {
  try {
    const response = await api.get(`/payments/schedule?jobId=${jobId}`)
    return response.data.data
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 400) {
      return null
    }
    throw error
  }
}
