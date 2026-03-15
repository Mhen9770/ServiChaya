import api from '../api'

export interface CreateJobDto {
  serviceCategoryId?: number
  serviceSubCategoryId?: number
  serviceSkillId?: number
  title: string
  description: string
  preferredTime: string
  isEmergency?: boolean
  estimatedBudget?: number
  cityId?: number
  zoneId?: number
  podId?: number
  addressLine1: string
  addressLine2?: string
  pincode?: string
  latitude?: number
  longitude?: number
  specialInstructions?: string
  attachments?: Array<{
    attachmentType?: string
    fileUrl: string
    fileName?: string
    fileSize?: number
    displayOrder?: number
  }>
}

export interface JobDto {
  id: number
  jobCode: string
  customerId: number
  serviceCategoryId: number
  serviceSubCategoryId?: number
  serviceSkillId?: number
  title: string
  description: string
  preferredTime: string
  isEmergency: boolean
  estimatedBudget?: number
  finalPrice?: number
  status: string
  subStatus?: string
  podId?: number
  zoneId?: number
  cityId: number
  addressLine1: string
  addressLine2?: string
  pincode?: string
  latitude?: number
  longitude?: number
  providerId?: number
  acceptedAt?: string
  startedAt?: string
  completedAt?: string
  specialInstructions?: string
  attachments?: Array<{
    attachmentType: string
    fileUrl: string
    fileName?: string
    fileSize?: number
    displayOrder?: number
  }>
  createdAt: string
}

// Create a new job
export const createJob = async (customerId: number, data: CreateJobDto): Promise<JobDto> => {
  const response = await api.post(`/jobs/create?customerId=${customerId}`, data)
  return response.data.data
}

// Get job by ID
export const getJobById = async (jobId: number): Promise<JobDto> => {
  const response = await api.get(`/jobs/${jobId}`)
  return response.data.data
}

// Get job by code
export const getJobByCode = async (jobCode: string): Promise<JobDto> => {
  const response = await api.get(`/jobs/code/${jobCode}`)
  return response.data.data
}

// Get customer jobs
export const getCustomerJobs = async (
  customerId: number,
  page: number = 0,
  size: number = 10,
  status?: string,
  sortBy?: string,
  sortDir?: string,
  filters?: {
    isEmergency?: boolean
    dateFrom?: string
    dateTo?: string
    budgetMin?: number
    budgetMax?: number
  }
): Promise<{ content: JobDto[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('size', size.toString())
  if (status && status !== 'ALL') params.append('status', status)
  if (sortBy) params.append('sortBy', sortBy)
  if (sortDir) params.append('sortDir', sortDir)
  if (filters?.isEmergency !== undefined) params.append('isEmergency', filters.isEmergency.toString())
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters?.dateTo) params.append('dateTo', filters.dateTo)
  if (filters?.budgetMin !== undefined) params.append('budgetMin', filters.budgetMin.toString())
  if (filters?.budgetMax !== undefined) params.append('budgetMax', filters.budgetMax.toString())
  const response = await api.get(`/jobs/customer/${customerId}?${params.toString()}`)
  return response.data.data
}

// Get provider jobs
export const getProviderJobs = async (
  providerId: number,
  page: number = 0,
  size: number = 10,
  status?: string,
  sortBy?: string,
  sortDir?: string
): Promise<{ content: JobDto[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('size', size.toString())
  if (status && status !== 'ALL') params.append('status', status)
  if (sortBy) params.append('sortBy', sortBy)
  if (sortDir) params.append('sortDir', sortDir)
  const response = await api.get(`/jobs/provider/${providerId}?${params.toString()}`)
  return response.data.data
}

// Get jobs by status
export const getJobsByStatus = async (
  status: string,
  page: number = 0,
  size: number = 10
): Promise<{ content: JobDto[]; totalElements: number; totalPages: number }> => {
  const response = await api.get(`/jobs/status/${status}?page=${page}&size=${size}`)
  return response.data.data
}

// Get all jobs with filters
export const getAllJobs = async (
  status?: string,
  cityId?: number,
  page: number = 0,
  size: number = 20,
  sortBy?: string,
  sortDir?: string,
  filters?: {
    customerId?: number
    providerId?: number
    categoryId?: number
    subCategoryId?: number
    isEmergency?: boolean
    dateFrom?: string
    dateTo?: string
    budgetMin?: number
    budgetMax?: number
  }
): Promise<{ content: JobDto[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams()
  if (status && status !== 'ALL') params.append('status', status)
  if (cityId) params.append('cityId', cityId.toString())
  if (filters?.customerId) params.append('customerId', filters.customerId.toString())
  if (filters?.providerId) params.append('providerId', filters.providerId.toString())
  if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString())
  if (filters?.subCategoryId) params.append('subCategoryId', filters.subCategoryId.toString())
  if (filters?.isEmergency !== undefined) params.append('isEmergency', filters.isEmergency.toString())
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters?.dateTo) params.append('dateTo', filters.dateTo)
  if (filters?.budgetMin !== undefined) params.append('budgetMin', filters.budgetMin.toString())
  if (filters?.budgetMax !== undefined) params.append('budgetMax', filters.budgetMax.toString())
  params.append('page', page.toString())
  params.append('size', size.toString())
  if (sortBy) params.append('sortBy', sortBy)
  if (sortDir) params.append('sortDir', sortDir)
  
  const response = await api.get(`/jobs/all?${params.toString()}`)
  return response.data.data
}
