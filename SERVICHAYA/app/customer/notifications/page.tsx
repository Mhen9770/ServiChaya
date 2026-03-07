'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Bell, CheckCheck, Clock3, ExternalLink, Filter, Inbox, ArrowRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getNotifications, markAllAsRead, markAsRead, type NotificationDto } from '@/lib/services/notification'
import Loader from '@/components/ui/Loader'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 10

export default function CustomerNotificationsPage() {
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
      router.push('/login?redirect=/customer/notifications')
      return
    }
    fetchData(user.userId, user.role)
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
      setNotifications((prev) => prev.map((item) => item.id === notificationId ? { ...item, isRead: true, readAt: new Date().toISOString() } : item))
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const onMarkAll = async () => {
    const user = getCurrentUser()
    if (!user) return
    try {
      await markAllAsRead(user.userId, user.role)
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-primary-dark text-white border border-slate-800 p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-300">Updates & Alerts</p>
            <h1 className="text-3xl font-bold mt-2">Notification Center</h1>
            <p className="text-sm text-slate-300 mt-2">Track all request, provider, payment and system updates in one place.</p>
          </div>
          {unreadCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onMarkAll} 
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:shadow-lg transition-all"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </motion.button>
          )}
        </div>
      </motion.section>

      <section className="rounded-2xl glass-dark border border-white/10 p-4 flex flex-wrap justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-sm text-slate-300"><Filter className="w-4 h-4" /> Filter</div>
        <div className="inline-flex gap-2">
          <button onClick={() => setFilter('ALL')} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === 'ALL' ? 'bg-primary-main text-white' : 'glass border border-white/20 text-slate-300 hover:bg-white/10'}`}>All</button>
          <button onClick={() => setFilter('UNREAD')} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === 'UNREAD' ? 'bg-primary-main text-white' : 'glass border border-white/20 text-slate-300 hover:bg-white/10'}`}>Unread ({unreadCount})</button>
        </div>
      </section>

      {visibleNotifications.length === 0 ? (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl glass-dark border border-white/10 p-10 text-center"
        >
          <Inbox className="w-9 h-9 mx-auto text-slate-400 mb-3" />
          <p className="font-semibold text-white">No notifications found</p>
          <p className="text-sm text-slate-300 mt-1">You are all set for now.</p>
        </motion.section>
      ) : (
        <section className="space-y-3">
          {visibleNotifications.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, x: 5 }}
              className={`rounded-2xl border p-5 transition-all ${item.isRead ? 'glass-dark border-white/10' : 'border-primary-main/30 bg-primary-main/20 hover:border-primary-main/50'}`}
            >
              <div className="flex justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-white inline-flex items-center gap-2">
                    <Bell className={`w-4 h-4 ${item.isRead ? 'text-slate-400' : 'text-primary-light'}`} /> 
                    {item.title}
                  </p>
                  <p className="text-sm text-slate-300 mt-2">{item.message}</p>
                  <p className="text-xs text-slate-400 mt-2 inline-flex items-center gap-1">
                    <Clock3 className="w-3.5 h-3.5" /> {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {!item.isRead && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onMarkAsRead(item.id)} 
                      className="text-xs px-2.5 py-1 rounded-full bg-primary-main text-white font-semibold hover:bg-primary-dark transition-colors"
                    >
                      Mark read
                    </motion.button>
                  )}
                  {item.actionUrl && (
                    <Link 
                      href={item.actionUrl} 
                      className="text-xs text-primary-light font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all group"
                    >
                      Open <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>
            </motion.article>
          ))}

          {totalPages > 1 && (
            <div className="rounded-2xl glass-dark border border-white/10 p-3">
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
