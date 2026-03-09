import api from '../api'

export type OpenPointType = 'FEATURE_REQUEST' | 'FLOW_ISSUE' | 'CHANGE_SUGGESTION' | 'BUG' | 'OTHER'
export type OpenPointStatus = 'NEW' | 'UNDER_REVIEW' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
export type OpenPointPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface PublicOpenPointRequest {
  type?: OpenPointType
  title: string
  description: string
  impactArea?: string
  url?: string
  environment?: string
  clientInfo?: string
  reporterName?: string
  reporterEmail?: string
  reporterMobile?: string
  reporterRole?: string
  attachmentUrls?: string[]
}

export interface PublicOpenPointResponse {
  id: number
  type: OpenPointType
  status: OpenPointStatus
  priority: OpenPointPriority
  title: string
  description: string
  impactArea?: string
  url?: string
  environment?: string
  clientInfo?: string
  reporterName?: string
  reporterEmail?: string
  reporterMobile?: string
  reporterRole?: string
  createdAt: string
  attachments?: SimpleAttachmentDto[]
}

export interface SimpleAttachmentDto {
  id: number
  fileName?: string
  fileUrl: string
  attachmentType?: string
  fileSize?: number
}

export interface AdminOpenPointListResponse {
  content: PublicOpenPointResponse[]
  totalElements: number
  totalPages: number
}

export const submitPublicOpenPoint = async (
  data: PublicOpenPointRequest
): Promise<PublicOpenPointResponse> => {
  const response = await api.post('/public/open-points', data)
  return response.data.data
}

export const uploadFeedbackFiles = async (files: File[]): Promise<string[]> => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })

  const response = await api.post('/public/open-points/files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data.data as string[]
}

export const getAdminOpenPoints = async (
  params: {
    status?: OpenPointStatus
    type?: OpenPointType
    page?: number
    size?: number
    sortBy?: string
    sortDir?: 'ASC' | 'DESC'
  } = {}
): Promise<AdminOpenPointListResponse> => {
  const search = new URLSearchParams()
  if (params.status) search.append('status', params.status)
  if (params.type) search.append('type', params.type)
  if (params.page !== undefined) search.append('page', params.page.toString())
  if (params.size !== undefined) search.append('size', params.size.toString())
  if (params.sortBy) search.append('sortBy', params.sortBy)
  if (params.sortDir) search.append('sortDir', params.sortDir)

  const response = await api.get(`/admin/open-points?${search.toString()}`)
  return response.data.data
}

export const getAdminOpenPointById = async (id: number): Promise<PublicOpenPointResponse> => {
  const response = await api.get(`/admin/open-points/${id}`)
  return response.data.data
}

export const updateAdminOpenPoint = async (
  id: number,
  data: { status?: OpenPointStatus; priority?: OpenPointPriority; internalNotes?: string }
): Promise<PublicOpenPointResponse> => {
  const search = new URLSearchParams()
  if (data.status) search.append('status', data.status)
  if (data.priority) search.append('priority', data.priority)
  if (data.internalNotes) search.append('internalNotes', data.internalNotes)

  const response = await api.put(`/admin/open-points/${id}?${search.toString()}`)
  return response.data.data
}

