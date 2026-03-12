import api from '../api'

export interface OneSignalRegisterRequest {
  userId: number
  playerId: string
  deviceType?: string
  browser?: string
}

export const registerOneSignalPlayer = async (data: OneSignalRegisterRequest): Promise<void> => {
  await api.post('/notifications/onesignal/register', data)
}

export const unregisterOneSignalPlayer = async (playerId: string): Promise<void> => {
  await api.post(`/notifications/onesignal/unregister?playerId=${playerId}`)
}

/**
 * Register OneSignal player ID after user subscribes
 * Call this after OneSignal subscription is successful
 */
export const handleOneSignalSubscription = async (userId: number): Promise<void> => {
  if (typeof window === 'undefined' || !window.OneSignal) {
    return
  }

  try {
    const playerId = await window.OneSignal.User.PushSubscription.id
    if (playerId) {
      const deviceType = 'WEB'
      const browser = navigator.userAgent.includes('Chrome') ? 'Chrome' 
        : navigator.userAgent.includes('Firefox') ? 'Firefox'
        : navigator.userAgent.includes('Safari') ? 'Safari'
        : 'Unknown'

      await registerOneSignalPlayer({
        userId,
        playerId,
        deviceType,
        browser,
      })
      console.log('OneSignal player registered successfully')
    }
  } catch (error) {
    console.error('Failed to register OneSignal player:', error)
  }
}

declare global {
  interface Window {
    OneSignal: any
  }
}
