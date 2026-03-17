import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Discover Itineraries',
  description: 'Browse curated travel itineraries for destinations around the world. From city breaks to multi-country adventures.',
}

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
