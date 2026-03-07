'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getNotifications, markAsRead, markAllAsRead, type NotificationDto } from '@/lib/services/notification'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import Pagination from '@/components/ui/Pagination'
import { Bell, CheckCircle2, XCircle, ArrowRight, CheckCheck } from 'lucide-react'
import { motion } from 'framer-motion'

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const PAGE_SIZE = 10

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login?redirect=/notifications')
      return
    }
    fetchNotifications(currentUser.userId, currentUser.role)
  }, [router, currentPage])

  const fetchNotifications = async (userId: number, userType: string) => {
    try {
      setLoading(true)
      const result = await getNotifications(userId, userType, currentPage, PAGE_SIZE)
      setNotifications(result.content)
      setTotalPages(result.totalPages)
      setTotalElements(result.totalElements)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    const currentUser = getCurrentUser()
    if (!currentUser) return

    try {
      await markAsRead(notificationId, currentUser.userId)
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ))
    } catch (error) {
      toast.error('Failed to mark notification as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    const currentUser = getCurrentUser()
    if (!currentUser) return

    try {
      await markAllAsRead(currentUser.userId, currentUser.role)
      setNotifications(notifications.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark all notifications as read')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'JOB_ACCEPTED':
      case 'JOB_COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-accent-green" />
      case 'JOB_CANCELLED':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Bell className="w-5 h-5 text-primary-main" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'JOB_ACCEPTED':
      case 'JOB_COMPLETED':
        return 'bg-accent-green/10 border-accent-green/30'
      case 'JOB_CANCELLED':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-primary-main/10 border-primary-main/30'
    }
  }

  if (loading) {
    return <Loader fullScreen text="Loading notifications..." />
  }

  const currentUser = getCurrentUser()
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-neutral-textPrimary font-display">Notifications</h1>
          <p className="text-sm text-neutral-textSecondary mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-5 py-2.5 bg-neutral-background text-neutral-textSecondary rounded-xl text-sm font-semibold hover:bg-neutral-border transition-all"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </button>
        )}
      </motion.div>

      {notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-2xl p-12 shadow-sm border border-neutral-border text-center"
        >
          <div className="w-16 h-16 bg-neutral-background rounded-full flex items-center justify-center mx-auto mb-3">
            <Bell className="w-8 h-8 text-neutral-textSecondary" />
          </div>
          <p className="text-sm font-semibold text-neutral-textPrimary mb-1">No notifications</p>
          <p className="text-xs text-neutral-textSecondary">You're all caught up! New notifications will appear here</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-3"
        >
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
                notification.isRead 
                  ? 'border-neutral-border' 
                  : `${getNotificationColor(notification.notificationType)} border-2`
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  notification.isRead ? 'bg-neutral-background' : getNotificationColor(notification.notificationType)
                }`}>
                  {getNotificationIcon(notification.notificationType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h3 className={`text-sm font-bold mb-1 ${
                        notification.isRead ? 'text-neutral-textSecondary' : 'text-neutral-textPrimary'
                      }`}>
                        {notification.title}
                      </h3>
                      <p className="text-xs text-neutral-textSecondary leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="flex-shrink-0 p-1.5 hover:bg-neutral-background rounded-lg transition-all"
                        title="Mark as read"
                      >
                        <div className="w-2 h-2 bg-primary-main rounded-full"></div>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-neutral-textSecondary">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                    {notification.actionUrl && (
                      <Link
                        href={notification.actionUrl}
                        className="flex items-center gap-1 text-xs text-primary-main font-semibold hover:text-primary-dark transition-colors"
                      >
                        View
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
            />
          )}
        </motion.div>
      )}
    </div>
  )
}
