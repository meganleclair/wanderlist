import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Wanderlist - Plan Your Perfect Trip',
    template: '%s | Wanderlist'
  },
  description: 'Discover amazing places, create custom itineraries, and plan unforgettable trips. Find top attractions and hidden gems in cities around the world.',
  keywords: ['travel', 'trip planner', 'itinerary', 'vacation', 'travel guide', 'things to do', 'attractions'],
  authors: [{ name: 'Wanderlist' }],
  creator: 'Wanderlist',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Wanderlist',
    title: 'Wanderlist - Plan Your Perfect Trip',
    description: 'Discover amazing places, create custom itineraries, and plan unforgettable trips.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wanderlist - Plan Your Perfect Trip',
    description: 'Discover amazing places, create custom itineraries, and plan unforgettable trips.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
