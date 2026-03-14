'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getConversations, type ConversationDto } from '@/lib/services/jobMessaging'
import { toast } from 'react-hot-toast'
import Loader from '@/components/ui/Loader'
import { MessageSquare, Clock, User, Briefcase } from 'lucide-react'
import { motion } from 'framer-motion'
export default function CustomerChatPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login?redirect=/customer/chat')
      return
    }
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const data = await getConversations()
      setConversations(data)
    } catch (error: any) {
      toast.error('Failed to load conversations')
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConversationClick = (conversation: ConversationDto) => {
    router.push(`/customer/chat/${conversation.conversationId}`)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <Loader />
        </div>
    )
  }

  return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="w-12 h-12 rounded-full bg-primary-main/20 flex items-center justify-center border-2 border-primary-main/50">
            <MessageSquare className="w-6 h-6 text-primary-light" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Chat</h1>
            <p className="text-sm text-slate-400">Your conversations</p>
          </div>
        </motion.div>

        {conversations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 rounded-2xl glass-dark border border-white/10"
          >
            <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-300 text-lg font-semibold mb-2">No conversations yet</p>
            <p className="text-slate-400 text-sm">Start chatting with service providers from your job requests</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <motion.div
                key={conversation.conversationId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleConversationClick(conversation)}
                className="rounded-2xl glass-dark border-2 border-white/10 p-4 cursor-pointer transition-all hover:border-primary-main/30 hover:bg-primary-main/5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-main to-primary-dark flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">{conversation.providerName}</h3>
                        <p className="text-xs text-slate-400 truncate">{conversation.jobTitle}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {conversation.unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-primary-main text-white text-xs font-bold">
                            {conversation.unreadCount}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {formatTime(conversation.lastMessageTime)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">{conversation.lastMessage}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-400">{conversation.jobCode}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
  )
}
