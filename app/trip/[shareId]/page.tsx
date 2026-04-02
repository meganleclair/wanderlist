'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Itinerary, SavedPlace } from '@/lib/database.types'
import {
  estimateTripDaysFromPlaces,
  countTripCityCount,
  estimateCustomTripBudgetUsd,
  formatEstimatedBudgetUsd,
} from '@/lib/trip-pricing'

const PlacesMap = dynamic(() => import('@/components/PlacesMap'), { ssr: false })

interface SharedTripPageProps {
  params: Promise<{ shareId: string }>
}

export default function SharedTripPage({ params }: SharedTripPageProps) {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareId, setShareId] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => setShareId(p.shareId))
  }, [params])

  useEffect(() => {
    if (!shareId) return

    async function fetchTrip() {
      try {
        const res = await fetch(`/api/shared-trip?shareId=${shareId}`)
        const data = await res.json()
        
        if (!res.ok) {
          setError(data.error || 'Trip not found')
        } else {
          setItinerary(data.itinerary)
        }
      } catch {
        setError('Failed to load trip')
      } finally {
        setLoading(false)
      }
    }

    fetchTrip()
  }, [shareId])

  function groupByDay(places: SavedPlace[]): Map<number, SavedPlace[]> {
    const groups = new Map<number, SavedPlace[]>()
    places.forEach(place => {
      const day = place.day_number || 0
      if (!groups.has(day)) groups.set(day, [])
      groups.get(day)!.push(place)
    })
    return new Map(Array.from(groups.entries()).sort((a, b) => a[0] - b[0]))
  }

  function getCities(): string[] {
    if (!itinerary?.saved_places) return []
    const cities = new Set<string>()
    itinerary.saved_places.forEach(p => {
      if (p.city) cities.add(p.city)
    })
    return Array.from(cities)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream-100 flex items-center justify-center">
        <i className="fa-solid fa-circle-notch animate-spin text-3xl text-stone-400"></i>
      </main>
    )
  }

  if (error || !itinerary) {
    return (
      <main className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <i className="fa-solid fa-map-location-dot text-5xl text-stone-300 mb-4"></i>
          <h1 className="text-2xl font-serif text-stone-900 mb-2">Trip not found</h1>
          <p className="text-stone-500 mb-6">This trip may have been removed or the link is invalid.</p>
          <Link href="/" className="btn-primary px-6 py-2.5 rounded-md text-sm font-medium inline-block">
            Explore Cities
          </Link>
        </div>
      </main>
    )
  }

  const cities = getCities()
  const dayGroups = groupByDay(itinerary.saved_places || [])
  const places = itinerary.saved_places || []
  const sharedBudgetEstimate =
    places.length > 0
      ? estimateCustomTripBudgetUsd({
          dayCount: estimateTripDaysFromPlaces(places, null),
          placeCount: places.length,
          cityCount: countTripCityCount(places),
        })
      : null

  return (
    <main className="min-h-screen bg-cream-100">
      <nav className="bg-cream-50 border-b border-cream-300 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-serif text-xl text-stone-900">Wanderlist</Link>
          <Link href="/" className="text-sm text-stone-500 hover:text-stone-700">
            Plan your own trip →
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">Shared Itinerary</p>
          <h1 className="text-3xl md:text-4xl font-serif text-stone-900 mb-2">{itinerary.name}</h1>
          {cities.length > 0 && (
            <p className="text-stone-500 flex items-center justify-center gap-2">
              <i className="fa-solid fa-location-dot"></i>
              {cities.join(' • ')}
            </p>
          )}
          {sharedBudgetEstimate != null && (
            <p className="text-stone-600 text-sm mt-4 flex flex-col items-center gap-1">
              <span>
                <i className="fa-solid fa-tag mr-1.5 text-stone-400"></i>
                <span className="font-medium text-stone-800">Est. {formatEstimatedBudgetUsd(sharedBudgetEstimate)}</span>
              </span>
              <span className="text-xs text-stone-400">Trip budget, excl. flights</span>
            </p>
          )}
        </div>

        {itinerary.saved_places && itinerary.saved_places.length > 0 && (
          <div className="mb-8 rounded-xl overflow-hidden border border-cream-300">
            <PlacesMap places={itinerary.saved_places} />
          </div>
        )}

        {itinerary.saved_places && itinerary.saved_places.length > 0 ? (
          <div className="space-y-6">
            {Array.from(dayGroups.entries()).map(([day, places]) => (
              <div key={day} className="bg-white border border-cream-300 rounded-xl overflow-hidden">
                <div className="bg-cream-50 px-5 py-3 border-b border-cream-200">
                  <h2 className="font-serif text-lg text-stone-900">
                    {day === 0 ? 'Unscheduled' : `Day ${day}`}
                  </h2>
                </div>
                <div className="divide-y divide-cream-200">
                  {places.map((place) => (
                    <div key={place.id} className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-stone-900">{place.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            {place.city && (
                              <span className="text-xs text-stone-500">
                                <i className="fa-solid fa-location-dot mr-1"></i>
                                {place.city}
                              </span>
                            )}
                            {place.category && (
                              <span className="text-xs text-stone-400">{place.category}</span>
                            )}
                          </div>
                          {place.notes && (
                            <p className="text-sm text-stone-600 mt-2 bg-cream-50 px-3 py-2 rounded-lg">
                              <i className="fa-solid fa-sticky-note mr-2 text-stone-400"></i>
                              {place.notes}
                            </p>
                          )}
                        </div>
                        {place.lat && place.lon && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1"
                          >
                            <i className="fa-solid fa-map"></i>
                            Map
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-cream-50 rounded-xl border border-cream-300">
            <p className="text-stone-500">No places saved to this trip yet.</p>
          </div>
        )}
      </div>
    </main>
  )
}
