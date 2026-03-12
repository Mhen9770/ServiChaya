import type { Metadata } from 'next'
import Script from 'next/script'
import { Toaster } from 'react-hot-toast'
import { LoadingProvider } from '@/contexts/LoadingContext'
import { NavigationLoader } from '@/components/navigation/NavigationLoader'
import './globals.css'

export const metadata: Metadata = {
  title: 'SERVICHAYA - Service at Your Doorstep',
  description: 'Trusted service marketplace for home services and workforce hiring',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* OneSignal Web Push SDK */}
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          defer
        />
        <Script id="onesignal-init" strategy="afterInteractive">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) {
              try {
                const allowedOrigins = ["https://way2rental.com", "http://localhost:3000"];
                if (allowedOrigins.includes(window.location.origin)) {
                  await OneSignal.init({
                    appId: "07f9fc72-b60b-419a-87ca-13a87bb97c72",
                  });
                } else {
                  console.warn('OneSignal init skipped for origin', window.location.origin);
                }
              } catch (e) {
                console.error('OneSignal init failed', e);
              }
            });
          `}
        </Script>
      </head>
      <body className="font-sans antialiased">
        <LoadingProvider>
          <NavigationLoader />
          {children}
          <Toaster position="top-right" />
        </LoadingProvider>
      </body>
    </html>
  )
}
