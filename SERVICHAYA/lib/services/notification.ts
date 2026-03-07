import api from '../api'

export interface NotificationDto {
  id: number
  userId: number
  userType: string
  notificationType: string
  title: string
  message: string
  relatedEntityType?: string
  relatedEntityId?: number
  isRead: boolean
  readAt?: string
  actionUrl?: string
  metadata?: Record<string, any>
  createdAt: string
}

export const getNotifications = async (userId: number, userType: string, page: number = 0, size: number = 20): Promise<{ content: NotificationDto[]; totalElements: number; totalPages: number }> => {
  const response = await api.get(`/notifications?userId=${userId}&userType=${userType}&page=${page}&size=${size}`)
  return response.data.data
}

export const getUnreadCount = async (userId: number, userType: string): Promise<number> => {
  const response = await api.get(`/notifications/unread-count?userId=${userId}&userType=${userType}`)
  return response.data.data
}

export const markAsRead = async (notificationId: number, userId: number): Promise<void> => {
  await api.post(`/notifications/${notificationId}/read?userId=${userId}`)
}

export const markAllAsRead = async (userId: number, userType: string): Promise<void> => {
  await api.post(`/notifications/read-all?userId=${userId}&userType=${userType}`)
}
