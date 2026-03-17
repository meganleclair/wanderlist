import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Trips',
  description: 'Plan and organize your travel itineraries. Add places, organize by day, and share your trips with friends.',
}

export default function TripsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
