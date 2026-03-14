'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MessageSquare,
  Star,
  CheckCircle2,
  MapPin,
  TrendingUp,
  User,
  Phone,
  Mail,
  Loader2,
  ChevronRight,
  FileText,
  X,
} from 'lucide-react'
import { getAvailableProviders, selectProvider, confirmProviderAcceptance, getMatchedProviders, type ProviderSelectionDto } from '@/lib/services/providerSelection'
import { getMessagesWithProvider, sendMessage, uploadAttachment, getAttachmentUrl, type JobMessageDto } from '@/lib/services/jobMessaging'
import { getContactDetails, type ContactDetails } from '@/lib/services/jobContact'
import { getJobById } from '@/lib/services/job'
import { PageLoader, ButtonLoader } from '@/components/ui/Loader'
import { useMessageNotifications } from '@/lib/hooks/useMessageNotifications'

export default function SelectProviderPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [providers, setProviders] = useState<ProviderSelectionDto[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<JobMessageDto[]>([])
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>(undefined)
  const [attachmentType, setAttachmentType] = useState<string | undefined>(undefined)
  const [contactDetails, setContactDetails] = useState<ContactDetails | null>(null)
  const [job, setJob] = useState<any>(null)
  const [selectingProvider, setSelectingProvider] = useState<number | null>(null)
  const [confirmingProvider, setConfirmingProvider] = useState<number | null>(null)
  const [matchedProviders, setMatchedProviders] = useState<number[]>([]) // Provider IDs that are already selected/matched
  const [providersWithMessages, setProvidersWithMessages] = useState<Set<number>>(new Set()) // Provider IDs that have messages

  const fetchJobAndProviders = useCallback(async () => {
    try {
      setLoading(true)
      const [jobData, providersData, matchedData] = await Promise.all([
        getJobById(jobId),
        getAvailableProviders(jobId, 0, 10),
        getMatchedProviders(jobId).catch(() => []) // Fetch matched providers
      ])
      setJob(jobData)
      setProviders(providersData.content)
      setHasMore(providersData.totalPages > 1)
      
      // Extract matched provider IDs (status NOTIFIED or ACCEPTED)
      const matchedIds = matchedData
        .filter((mp: any) => mp.status === 'NOTIFIED' || mp.status === 'ACCEPTED')
        .map((mp: any) => mp.providerId)
      setMatchedProviders(matchedIds)
      
      // Check messages for each provider (async, don't block)
      const providersWithMsgs = new Set<number>()
      for (const provider of providersData.content) {
        try {
          const msgs = await getMessagesWithProvider(jobId, provider.providerId)
          if (msgs && msgs.length > 0) {
            providersWithMsgs.add(provider.providerId)
          }
        } catch (e) {
          // Ignore errors, provider might not have messages yet
        }
      }
      setProvidersWithMessages(providersWithMsgs)
      
      // If job is ACCEPTED, fetch contact details
      if (jobData.status === 'ACCEPTED' || jobData.status === 'IN_PROGRESS') {
        try {
          const contact = await getContactDetails(jobId)
          setContactDetails(contact)
        } catch (e) {
          // Contact details not available yet
        }
      }
    } catch (error: any) {
      toast.error('Failed to load providers')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    fetchJobAndProviders()
  }, [fetchJobAndProviders])

  const loadMoreProviders = async () => {
    try {
      const nextPage = page + 1
      const data = await getAvailableProviders(jobId, nextPage, 10)
      setProviders([...providers, ...data.content])
      setPage(nextPage)
      setHasMore(data.totalPages > nextPage + 1)
    } catch (error: any) {
      toast.error('Failed to load more providers')
    }
  }

  const fetchMessages = useCallback(async () => {
    if (!selectedProviderId) return
    try {
      // selectedProviderId is provider profile ID
      const msgs = await getMessagesWithProvider(jobId, selectedProviderId)
      setMessages(msgs)
      // Update providersWithMessages if messages exist
      if (msgs && msgs.length > 0 && selectedProviderId) {
        setProvidersWithMessages(prev => new Set([...prev, selectedProviderId]))
      }
    } catch (error: any) {
      console.error('Failed to fetch messages:', error)
    }
  }, [jobId, selectedProviderId])

  // Fetch messages when selectedProviderId changes and chat is shown
  useEffect(() => {
    if (selectedProviderId && showChat) {
      fetchMessages()
    }
  }, [selectedProviderId, showChat, fetchMessages])

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedProviderId) return

    try {
      setSendingMessage(true)
      const newMessage = await sendMessage(jobId, { message: messageText.trim() })
      setMessages([...messages, newMessage])
      setMessageText('')
      // Mark provider as having messages
      setProvidersWithMessages(prev => new Set([...prev, selectedProviderId]))
      toast.success('Message sent')
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to send message'
      toast.error(errorMsg)
      if (errorMsg.includes('contact details') || errorMsg.includes('blocked')) {
        // Message was blocked - clear input
        setMessageText('')
      }
    } finally {
      setSendingMessage(false)
    }
  }

  const handleSelectProvider = async (providerId: number) => {
    setSelectedProviderId(providerId)
    setShowChat(true)
  }

  const handleChooseProvider = async (providerId: number) => {
    // If provider is already selected, just open chat
    if (matchedProviders.includes(providerId)) {
      await handleSelectProvider(providerId)
      return
    }

    if (!window.confirm('Are you sure you want to select this provider? They will be notified to accept the job.')) {
      return
    }

    try {
      setSelectingProvider(providerId)
      await selectProvider(jobId, providerId)
      toast.success('Provider selected! They have been notified to accept the job.')
      // Refresh job data
      await fetchJobAndProviders()
      // Add to matched providers
      setMatchedProviders(prev => [...prev, providerId])
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to select provider. Please try again.'
      toast.error(errorMsg)
    } finally {
      setSelectingProvider(null)
    }
  }

  const handleConfirmProvider = async (providerId: number) => {
    if (!window.confirm('Are you sure you want to confirm this provider? This will finalize the assignment and other providers will be notified.')) {
      return
    }

    try {
      setConfirmingProvider(providerId)
      await confirmProviderAcceptance(jobId, providerId)
      toast.success('Provider confirmed! The job is now accepted and work can begin.')
      // Refresh job data
      await fetchJobAndProviders()
      // Navigate to job details
      router.push(`/customer/jobs/${jobId}`)
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to confirm provider. Please try again.'
      toast.error(errorMsg)
    } finally {
      setConfirmingProvider(null)
    }
  }

  if (loading) {
    return <PageLoader text="Loading available providers..." />
  }

  const selectedProvider = providers.find(p => p.providerId === selectedProviderId)

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between"
      >
        <Link href={`/customer/jobs/${jobId}`} className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-primary-light transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          Back to job details
        </Link>
        <h1 className="text-2xl font-bold text-white">Select Service Provider</h1>
        <div className="w-24" /> {/* Spacer */}
      </motion.div>

      {/* Job Info Card */}
      {job && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl glass-dark border border-white/10 p-6"
        >
          <h2 className="text-lg font-bold text-white mb-2">{job.title}</h2>
          <p className="text-sm text-slate-300">{job.description}</p>
          <div className="mt-3 flex gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20">
              Budget: ₹{job.estimatedBudget?.toLocaleString() || '0'}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20">
              Status: {job.status}
            </span>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Provider List */}
        <div className={`lg:col-span-2 space-y-4 ${showChat ? 'hidden lg:block' : ''}`}>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-light" />
            Available Providers
          </h2>
          
          {/* Provider Accepted Banner - FIX BUG #6 */}
          {job?.status === 'MATCHED' && job?.subStatus === 'PROVIDER_ACCEPTED' && job?.providerId && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl glass-dark border-2 border-accent-green/50 bg-accent-green/10 p-4 mb-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-accent-green" />
                    <h3 className="font-bold text-white">Provider Has Accepted!</h3>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">
                    A provider has accepted your job. Please confirm to proceed, or you can choose a different provider.
                  </p>
                  {job.providerId && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleConfirmProvider(job.providerId)}
                      disabled={confirmingProvider === job.providerId}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-green to-emerald-500 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-accent-green/50 transition-all inline-flex items-center gap-2"
                    >
                      {confirmingProvider === job.providerId ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Confirm Provider
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          
          <p className="text-sm text-slate-300 mb-4">
            Browse through available providers. 
            <span className="text-primary-light font-semibold"> Click on any provider to chat and discuss your requirements.</span>
          </p>

          {providers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-300">No providers available yet</p>
              <p className="text-sm text-slate-400 mt-2">Providers will appear here once they bid on your job</p>
            </div>
          ) : (
            <>
              {providers.map((provider, index) => (
                <motion.div
                  key={provider.providerId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-2xl glass-dark border-2 p-6 cursor-pointer transition-all group ${
                    selectedProviderId === provider.providerId
                      ? 'border-primary-main bg-primary-main/10'
                      : 'border-white/10 hover:border-primary-main/30'
                  }`}
                  onClick={() => handleSelectProvider(provider.providerId)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-primary-main/20 flex items-center justify-center border-2 border-primary-main/50">
                          <User className="w-6 h-6 text-primary-light" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{provider.providerName}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>#{provider.rankOrder}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {provider.rating.toFixed(1)} ({provider.ratingCount} reviews)
                            </span>
                            {provider.distanceKm && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {provider.distanceKm.toFixed(1)} km
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-xs text-slate-400">Experience</div>
                          <div className="font-semibold text-white">{provider.experienceYears}+ years</div>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-xs text-slate-400">Jobs Completed</div>
                          <div className="font-semibold text-white">{provider.totalJobsCompleted}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-xs text-slate-400">Bid Amount</div>
                          <div className="font-semibold text-accent-green">₹{provider.bidAmount.toLocaleString()}</div>
                        </div>
                      </div>

                      {provider.proposedPrice && (
                        <div className="mt-3 p-2 rounded-lg bg-primary-main/10 border border-primary-main/30">
                          <div className="text-xs text-slate-300">Proposed Price: ₹{provider.proposedPrice.toLocaleString()}</div>
                        </div>
                      )}

                      {provider.bio && (
                        <p className="mt-3 text-sm text-slate-300 line-clamp-2">{provider.bio}</p>
                      )}

                      {provider.unreadMessageCount && provider.unreadMessageCount > 0 && (
                        <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs text-blue-200">
                          <MessageSquare className="w-3 h-3" />
                          {provider.unreadMessageCount} unread {provider.unreadMessageCount === 1 ? 'message' : 'messages'}
                        </div>
                      )}
                      
                      {provider.isPaidProvider && (
                        <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs text-emerald-200">
                          <TrendingUp className="w-3 h-3" />
                          Paid Provider
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {/* Show Confirm button if this provider has accepted */}
                      {job?.status === 'MATCHED' && job?.subStatus === 'PROVIDER_ACCEPTED' && job?.providerId === provider.providerId ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleConfirmProvider(provider.providerId)
                          }}
                          disabled={confirmingProvider === provider.providerId}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-green to-emerald-500 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-accent-green/50 transition-all inline-flex items-center gap-2"
                        >
                          {confirmingProvider === provider.providerId ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Confirming...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Confirm Provider
                            </>
                          )}
                        </motion.button>
                      ) : (
                        (() => {
                          const isSelected = matchedProviders.includes(provider.providerId)
                          const hasMessages = providersWithMessages.has(provider.providerId)
                          const buttonText = isSelected 
                            ? (hasMessages ? 'Continue Chat' : 'Selected')
                            : 'Select Provider'
                          const isDisabled = selectingProvider === provider.providerId || 
                                           job?.status === 'ACCEPTED' || 
                                           (job?.status === 'MATCHED' && job?.subStatus === 'PROVIDER_ACCEPTED')
                          
                          return (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (isSelected) {
                                  // If already selected, just open chat
                                  handleSelectProvider(provider.providerId)
                                } else {
                                  // Otherwise, select the provider
                                  handleChooseProvider(provider.providerId)
                                }
                              }}
                              disabled={isDisabled}
                              className={`px-4 py-2 rounded-lg text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all inline-flex items-center gap-2 ${
                                isSelected 
                                  ? 'bg-gradient-to-r from-accent-green to-emerald-500 hover:shadow-accent-green/50'
                                  : 'bg-gradient-to-r from-primary-main to-primary-light hover:shadow-primary-main/50'
                              }`}
                            >
                              {selectingProvider === provider.providerId ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Selecting...
                                </>
                              ) : (
                                <>
                                  {hasMessages ? (
                                    <MessageSquare className="w-3 h-3" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                  {buttonText}
                                </>
                              )}
                            </motion.button>
                          )
                        })()
                      )}
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary-light opacity-0 group-hover:opacity-100 transition-opacity" />
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary-light transition-colors" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {hasMore && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={loadMoreProviders}
                  className="w-full rounded-xl border-2 border-primary-main/50 text-primary-light px-4 py-3 font-semibold hover:bg-primary-main/10 transition-all"
                >
                  Load More Providers
                </motion.button>
              )}
            </>
          )}
        </div>

        {/* Chat Panel */}
        {showChat && selectedProvider && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-4"
          >
            <div className="rounded-2xl glass-dark border-2 border-primary-main/30 p-6 h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-main/20 flex items-center justify-center border-2 border-primary-main/50">
                    <User className="w-5 h-5 text-primary-light" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{selectedProvider.providerName}</h3>
                    <p className="text-xs text-slate-400">Rank #{selectedProvider.rankOrder}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowChat(false)
                    setSelectedProviderId(null)
                  }}
                  className="lg:hidden text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-slate-300 text-sm font-semibold mb-2">💬 Start Your Conversation</div>
                    <div className="text-slate-400 text-xs space-y-1">
                      <p>• Explain your problem in detail</p>
                      <p>• Discuss the requirements</p>
                      <p>• Negotiate the price</p>
                      <p>• Ask any questions you have</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl p-3 ${
                          msg.senderType === 'CUSTOMER'
                            ? 'bg-primary-main/20 text-white'
                            : 'bg-white/10 text-slate-200'
                        }`}
                      >
                        <div className="text-xs text-slate-400 mb-1">{msg.senderName}</div>
                        <div className="text-sm">{msg.message}</div>
                        {msg.attachmentUrl && (
                          <a
                            href={getAttachmentUrl(msg.attachmentUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-2 text-xs text-primary-light hover:underline"
                          >
                            <FileText className="w-3 h-3" />
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
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Type your message... (Contact details are not allowed)"
                  className="w-full rounded-xl glass border border-white/20 px-4 py-3 text-sm text-white bg-white/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-main/50 resize-none"
                  rows={3}
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendingMessage}
                  className="w-full rounded-xl bg-gradient-to-r from-primary-main to-primary-light text-white px-4 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary-main/50 transition-all inline-flex items-center justify-center gap-2"
                >
                  {sendingMessage ? (
                    <>
                      <ButtonLoader size="sm" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </motion.button>
              </div>

              {/* Contact Details (if job accepted) */}
              {contactDetails && contactDetails.providerName && (
                <div className="mt-4 p-3 rounded-lg bg-accent-green/10 border border-accent-green/30">
                  <div className="text-xs font-semibold text-accent-green mb-2">Contact Details</div>
                  <div className="text-sm text-slate-200 space-y-1">
                    {contactDetails.providerName && (
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {contactDetails.providerName}
                      </div>
                    )}
                    {contactDetails.providerCode && (
                      <div className="text-xs text-slate-400">Code: {contactDetails.providerCode}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
