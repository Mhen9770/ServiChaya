import type { Metadata } from 'next'
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
