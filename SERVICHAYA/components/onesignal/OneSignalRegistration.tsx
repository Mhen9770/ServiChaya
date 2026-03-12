'use client'

import { useEffect } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { handleOneSignalSubscription } from '@/lib/services/onesignal'

/**
 * Component to automatically register OneSignal player ID when user subscribes
 * Add this to dashboards after login
 */
export default function OneSignalRegistration() {
  useEffect(() => {
    const user = getCurrentUser()
    if (!user) return

    // Wait for OneSignal to be available
    const checkAndRegister = async () => {
      if (typeof window === 'undefined' || !window.OneSignal) {
        // Retry after a short delay
        setTimeout(checkAndRegister, 500)
        return
      }

      try {
        // Check if user is subscribed
        const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn
        if (isSubscribed) {
          // User is subscribed, register the player ID
          await handleOneSignalSubscription(user.userId)
        } else {
          // Listen for subscription event
          window.OneSignal.User.PushSubscription.addEventListener('change', async () => {
            const newSubscriptionStatus = await window.OneSignal.User.PushSubscription.optedIn
            if (newSubscriptionStatus) {
              await handleOneSignalSubscription(user.userId)
            }
          })
        }
      } catch (error) {
        console.error('OneSignal registration check failed:', error)
      }
    }

    checkAndRegister()
  }, [])

  return null // This component doesn't render anything
}

declare global {
  interface Window {
    OneSignal: any
  }
}
