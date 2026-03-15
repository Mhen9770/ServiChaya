import api from '../api'

export interface JobMessageDto {
  id: number
  jobId: number
  senderId: number
  senderType: 'CUSTOMER' | 'PROVIDER'
  senderName: string
  message: string
  attachmentUrl?: string
  attachmentType?: string
  status: string
  isFlagged: boolean
  flagReason?: string
  createdAt: string
}

export interface SendMessageRequest {
  message: string
  attachmentUrl?: string
  attachmentType?: 'IMAGE' | 'PDF' | 'DOCUMENT' | 'OTHER'
}

export interface UploadAttachmentResponse {
  fileUrl: string
  attachmentType: string
  fileName?: string
}

/**
 * Send a message in job chat
 */
export const sendMessage = async (
  jobId: number,
  messageData: SendMessageRequest
): Promise<JobMessageDto> => {
  const response = await api.post(`/jobs/${jobId}/messages`, messageData)
  return response.data.data
}

/**
 * Get messages for a job (paginated)
 */
export const getMessages = async (
  jobId: number,
  page: number = 0,
  size: number = 20
): Promise<{ content: JobMessageDto[]; totalElements: number; totalPages: number }> => {
  const response = await api.get(`/jobs/${jobId}/messages`, {
    params: { page, size }
  })
  return response.data.data
}

/**
 * Get conversation ID for a job and provider
 * @param jobId Job ID
 */
export const getConversationId = async (jobId: number): Promise<number | null> => {
  try {
    const response = await api.get(`/jobs/${jobId}/conversation`)
    return response.data.data
  } catch (error) {
    return null
  }
}

/**
 * Get messages between customer and a specific provider
 * @param jobId Job ID
 * @param providerId Provider profile ID (not user ID)
 * @deprecated Use getConversationMessages with conversationId instead
 */
export const getMessagesWithProvider = async (
  jobId: number,
  providerId: number
): Promise<JobMessageDto[]> => {
  const response = await api.get(`/jobs/${jobId}/messages/with/${providerId}`)
  return response.data.data
}

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (jobId: number): Promise<void> => {
  await api.put(`/jobs/${jobId}/messages/read`)
}

/**
 * Upload file attachment for job message
 */
export const uploadAttachment = async (
  jobId: number,
  file: File
): Promise<UploadAttachmentResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await api.post(`/jobs/${jobId}/messages/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data.data
}

/**
 * Get attachment file URL (for display/download)
 */
export const getAttachmentUrl = (fileUrl: string): string => {
  // If it's already a full URL, return as is
  if (fileUrl.startsWith('http')) {
    return fileUrl
  }
  // Otherwise, construct full URL from API base
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
  return `${baseUrl}${fileUrl}`
}

// Conversation types
export interface ConversationDto {
  conversationId: number
  jobId: number
  jobTitle: string
  jobCode: string
  customerId: number
  customerName: string
  providerId: number
  providerName: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  jobStatus: string
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

/**
 * Get list of conversations for current user
 */
export async function getConversations(): Promise<ConversationDto[]> {
  const response = await api.get<ApiResponse<ConversationDto[]>>('/jobs/conversations')
  return response.data.data || []
}

/**
 * Get paginated messages for a conversation
 * @param conversationId Conversation ID
 * @param page Page number (0-indexed)
 * @param size Page size (default 10)
 */
export async function getConversationMessages(
  conversationId: number,
  page: number = 0,
  size: number = 10
): Promise<{ content: JobMessageDto[]; totalElements: number; totalPages: number; hasNext: boolean }> {
  const response = await api.get<ApiResponse<{ content: JobMessageDto[]; totalElements: number; totalPages: number }>>(
    `/jobs/conversations/${conversationId}/messages`,
    { params: { page, size } }
  )
  const data = response.data.data
  return {
    ...data,
    hasNext: data.totalPages > page + 1
  }
}
