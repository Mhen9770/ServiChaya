'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { 
  getConversationMessages, 
  sendMessage, 
  uploadAttachment,
  getAttachmentUrl,
  markMessagesAsRead,
  type JobMessageDto 
} from '@/lib/services/jobMessaging'
import { toast } from 'react-hot-toast'
import Loader, { ButtonLoader } from '@/components/ui/Loader'
import { ArrowLeft, MessageSquare, Send, FileText, Image as ImageIcon } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CustomerConversationPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = Number(params.conversationId || params.jobId) // Support both for backward compatibility
  
  const [messages, setMessages] = useState<JobMessageDto[]>([])
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const isPollingRef = useRef(false)
  const wasAtBottomRef = useRef(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login?redirect=/customer/chat')
      return
    }
    if (conversationId) {
      fetchMessages(0, true)
      // Poll for new messages every 3 seconds (without resetting/loading state)
      const interval = setInterval(() => fetchMessages(0, false), 3000)
      return () => clearInterval(interval)
    }
  }, [conversationId])

  useEffect(() => {
    // Only auto-scroll if user was at bottom before update AND we're not polling
    if (!isPollingRef.current && wasAtBottomRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
    // Scroll position preservation is handled in fetchMessages
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async (pageNum: number = 0, reset: boolean = false) => {
    try {
      let scrollPosition = 0
      let oldScrollHeight = 0
      
      if (reset) {
        setLoading(true)
        isPollingRef.current = false
      } else {
        isPollingRef.current = true
        // Save scroll position before fetching
        const container = messagesContainerRef.current
        if (container) {
          scrollPosition = container.scrollTop
          oldScrollHeight = container.scrollHeight
          const clientHeight = container.clientHeight
          wasAtBottomRef.current = oldScrollHeight - scrollPosition - clientHeight < 100
        }
      }
      
      const data = await getConversationMessages(conversationId, pageNum, 10)
      
      if (reset) {
        setMessages(data.content)
        wasAtBottomRef.current = true
      } else {
        // During polling: check for new messages using functional update
        setMessages(prev => {
          const currentMessageIds = new Set(prev.map(m => m.id))
          const newMessages = data.content.filter(m => !currentMessageIds.has(m.id))
          
          if (newMessages.length > 0) {
            // Restore scroll position after state update if user was scrolled up
            if (!wasAtBottomRef.current) {
              requestAnimationFrame(() => {
                const container = messagesContainerRef.current
                if (container) {
                  // Maintain scroll position (keep same scrollTop)
                  container.scrollTop = scrollPosition
                }
              })
            }
            // Messages are in ASC order (oldest first), so add new ones at the end
            return [...prev, ...newMessages]
          }
          return prev // No changes, return same array to prevent re-render
        })
      }
      setHasMore(data.hasNext)
      setPage(pageNum)
    } catch (error: any) {
      if (reset) {
        toast.error('Failed to load messages')
        console.error('Error fetching messages:', error)
      }
      // Silently fail during polling
    } finally {
      if (reset) {
        setLoading(false)
      }
      isPollingRef.current = false
    }
  }

  const loadMoreMessages = () => {
    if (hasMore && !loading) {
      fetchMessages(page + 1, false)
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedFile) return

    try {
      setSending(true)
      let attachmentUrl: string | undefined = undefined
      let attachmentType: string | undefined = undefined

        if (selectedFile) {
        setUploadingFile(true)
        try {
          // Get jobId from first message or conversation
          const jobId = messages.length > 0 ? messages[0].jobId : conversationId
          const uploadResult = await uploadAttachment(jobId, selectedFile)
          attachmentUrl = uploadResult.fileUrl
          attachmentType = uploadResult.attachmentType as any
          setSelectedFile(null)
        } catch (error) {
          toast.error('Failed to upload file')
          setSending(false)
          setUploadingFile(false)
          return
        }
        setUploadingFile(false)
      }

      // Get jobId from first message or conversation
      const jobId = messages.length > 0 ? messages[0].jobId : conversationId
      const newMessage = await sendMessage(jobId, {
        message: messageText.trim(),
        attachmentUrl,
        attachmentType
      })

      setMessages(prev => [...prev, newMessage])
      setMessageText('')
      wasAtBottomRef.current = true
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
    }
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <button
            onClick={() => router.push('/customer/chat')}
            className="p-2 rounded-lg glass-dark border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Conversation</h1>
            <p className="text-sm text-slate-400">Conversation #{conversationId}</p>
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex flex-col h-[calc(100vh-250px)] rounded-2xl glass-dark border-2 border-white/10 overflow-hidden">
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
            onScroll={(e) => {
              const target = e.target as HTMLDivElement
              if (target.scrollTop === 0 && hasMore && !loading && !isPollingRef.current) {
                loadMoreMessages()
              }
              // Update wasAtBottomRef when user scrolls
              const scrollHeight = target.scrollHeight
              const scrollTop = target.scrollTop
              const clientHeight = target.clientHeight
              wasAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100
            }}
          >
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-300 text-lg font-semibold mb-2">No messages yet</p>
                <p className="text-slate-400 text-sm">Start the conversation</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderType === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl p-3 ${
                      msg.senderType === 'CUSTOMER'
                        ? 'bg-primary-main/20 text-white'
                        : 'bg-white/10 text-slate-200'
                    }`}
                  >
                    <div className="text-xs text-slate-400 mb-1">{msg.senderName}</div>
                    <div className="text-sm mb-1">{msg.message}</div>
                    {msg.attachmentUrl && (
                      <a
                        href={getAttachmentUrl(msg.attachmentUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-2 text-xs text-primary-light hover:underline"
                      >
                        {msg.attachmentType === 'IMAGE' ? (
                          <ImageIcon className="w-3 h-3" />
                        ) : (
                          <FileText className="w-3 h-3" />
                        )}
                        {msg.attachmentType === 'IMAGE' ? 'View Image' : 
                         msg.attachmentType === 'PDF' ? 'View PDF' : 
                         'Download Attachment'}
                      </a>
                    )}
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-white/10 p-4 bg-slate-900/50 space-y-2">
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
                <FileText className="w-4 h-4 text-primary-light" />
                <span className="text-xs text-slate-300 flex-1 truncate">{selectedFile.name}</span>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <label className="p-2 rounded-lg glass border border-white/20 hover:bg-white/10 cursor-pointer transition-colors">
                <FileText className="w-5 h-5 text-slate-300" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf,.doc,.docx"
                  onChange={handleFileSelect}
                />
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 rounded-xl glass border border-white/20 px-4 py-3 text-sm text-white bg-white/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-main/50 resize-none"
                rows={2}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={(!messageText.trim() && !selectedFile) || sending || uploadingFile}
                className="p-3 rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary-main/50 transition-all"
              >
                {sending || uploadingFile ? (
                  <ButtonLoader size="sm" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
  )
}
