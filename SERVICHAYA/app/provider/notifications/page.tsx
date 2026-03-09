'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Bell, CheckCheck, Clock3, Filter, Inbox, ArrowRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getNotifications, markAllAsRead, markAsRead, type NotificationDto } from '@/lib/services/notification'
import Loader from '@/components/ui/Loader'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 10

export default function ProviderNotificationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL')

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push('/login?redirect=/provider/notifications')
      return
    }
    // Always request as PROVIDER to keep segregation
    fetchData(user.userId, 'PROVIDER')
  }, [router, page])

  const fetchData = async (userId: number, userType: string) => {
    try {
      setLoading(true)
      const result = await getNotifications(userId, userType, page, PAGE_SIZE)
      setNotifications(result.content || [])
      setTotalPages(result.totalPages || 0)
      setTotalElements(result.totalElements || 0)
    } catch {
      toast.error('Unable to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications])

  const visibleNotifications = useMemo(() => {
    if (filter === 'UNREAD') return notifications.filter((item) => !item.isRead)
    return notifications
  }, [notifications, filter])

  const onMarkAsRead = async (notificationId: number) => {
    const user = getCurrentUser()
    if (!user) return
    try {
      await markAsRead(notificationId, user.userId)
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, isRead: true, readAt: new Date().toISOString() } : item,
        ),
      )
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const onMarkAll = async () => {
    const user = getCurrentUser()
    if (!user) return
    try {
      await markAllAsRead(user.userId, 'PROVIDER')
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })))
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  if (loading) return <Loader fullScreen text="Loading notifications..." />

  return (
    <div className="px-6 py-6 space-y-6">
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white shadow-sm border border-neutral-border p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-textSecondary">Updates & Alerts</p>
            <h1 className="text-2xl font-bold mt-1 text-neutral-textPrimary font-display">Notification Center</h1>
            <p className="text-sm text-neutral-textSecondary mt-1">
              See updates about available jobs, accepted requests, payments and system messages.
            </p>
          </div>
          {unreadCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onMarkAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-main text-white text-sm font-semibold hover:bg-primary-dark transition-all"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </motion.button>
          )}
        </div>
      </motion.section>

      <section className="rounded-2xl bg-white shadow-sm border border-neutral-border p-4 flex flex-wrap justify-between gap-3 items-center">
        <div className="inline-flex items-center gap-2 text-sm text-neutral-textSecondary">
          <Filter className="w-4 h-4" /> Filter
        </div>
        <div className="inline-flex gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              filter === 'ALL'
                ? 'bg-primary-main text-white border-primary-main'
                : 'bg-neutral-background text-neutral-textSecondary border-neutral-border hover:bg-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              filter === 'UNREAD'
                ? 'bg-primary-main text-white border-primary-main'
                : 'bg-neutral-background text-neutral-textSecondary border-neutral-border hover:bg-white'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </section>

      {visibleNotifications.length === 0 ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white shadow-sm border border-neutral-border p-10 text-center"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-background flex items-center justify-center"
          >
            <Inbox className="w-8 h-8 text-neutral-textSecondary" />
          </motion.div>
          <h3 className="text-lg font-bold text-neutral-textPrimary mb-2">
            {filter === 'UNREAD' ? 'No unread notifications' : 'All caught up!'}
          </h3>
          <p className="text-sm text-neutral-textSecondary mb-2">
            {filter === 'UNREAD'
              ? 'You have no unread notifications right now.'
              : 'You will see job and payment updates here once they arrive.'}
          </p>
          {filter === 'UNREAD' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter('ALL')}
              className="mt-3 px-4 py-2 rounded-xl border border-neutral-border text-sm font-medium text-neutral-textPrimary hover:bg-neutral-background transition-colors"
            >
              View all notifications
            </motion.button>
          )}
        </motion.section>
      ) : (
        <section className="space-y-3">
          {visibleNotifications.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.01, x: 4 }}
              className={`rounded-2xl border p-5 transition-all relative overflow-hidden ${
                item.isRead
                  ? 'bg-white border-neutral-border'
                  : 'bg-primary-main/5 border-primary-main/40 hover:border-primary-main/60'
              }`}
            >
              {!item.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-main" />}

              <div className="flex justify-between gap-3 pl-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        item.isRead ? 'bg-neutral-background' : 'bg-primary-main/10'
                      }`}
                    >
                      <Bell
                        className={`w-4 h-4 ${
                          item.isRead ? 'text-neutral-textSecondary' : 'text-primary-main'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-neutral-textPrimary line-clamp-1">{item.title}</p>
                      <p className="text-xs text-neutral-textSecondary mt-0.5 inline-flex items-center gap-1">
                        <Clock3 className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-textSecondary leading-relaxed">{item.message}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {!item.isRead && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onMarkAsRead(item.id)}
                      className="text-xs px-3 py-1.5 rounded-full bg-primary-main text-white font-semibold hover:bg-primary-dark transition-colors whitespace-nowrap"
                    >
                      Mark read
                    </motion.button>
                  )}
                  {item.actionUrl && (
                    <Link
                      href={item.actionUrl}
                      className="text-xs text-primary-main font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all group whitespace-nowrap"
                    >
                      View <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>
            </motion.article>
          ))}

          {totalPages > 1 && (
            <div className="rounded-2xl bg-white shadow-sm border border-neutral-border p-3">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          )}
        </section>
      )}
    </div>
  )
}

