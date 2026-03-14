import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getMessages } from '@/lib/services/jobMessaging'
import { toast } from 'react-hot-toast'

/**
 * Hook to poll for new messages and show notifications
 * @param jobId - Job ID to poll messages for
 * @param lastMessageId - Last message ID seen (to detect new messages)
 * @param enabled - Whether polling is enabled
 * @param onNewMessage - Callback when new message is received
 */
export function useMessageNotifications(
  jobId: number | null,
  lastMessageId: number | null,
  enabled: boolean = true,
  onNewMessage?: (messageId: number) => void
) {
  const router = useRouter()

  useEffect(() => {
    if (!jobId || !enabled) return

    const pollInterval = setInterval(async () => {
      try {
        const result = await getMessages(jobId, 0, 1) // Get latest message
        if (result.content.length > 0) {
          const latestMessage = result.content[result.content.length - 1]
          
          // Check if this is a new message
          if (lastMessageId === null || latestMessage.id > lastMessageId) {
            // New message detected
            if (onNewMessage) {
              onNewMessage(latestMessage.id)
            } else {
              // Show toast notification
              const senderName = latestMessage.senderName || 'Someone'
              const preview = latestMessage.message.length > 50 
                ? latestMessage.message.substring(0, 47) + '...'
                : latestMessage.message
              
              toast.success(
                <div>
                  <div className="font-semibold">New message from {senderName}</div>
                  <div className="text-sm">{preview}</div>
                </div>,
                {
                  duration: 5000,
                  onClick: () => {
                    router.push(`/customer/jobs/${jobId}/select-provider`)
                  }
                }
              )
            }
          }
        }
      } catch (error) {
        // Silently fail - don't spam errors
        console.error('Error polling for messages:', error)
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(pollInterval)
  }, [jobId, lastMessageId, enabled, onNewMessage, router])
}
