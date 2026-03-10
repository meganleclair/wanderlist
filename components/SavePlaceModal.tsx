'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { Itinerary, PlaceResult } from '@/lib/database.types'

interface SavePlaceModalProps {
  isOpen: boolean
  onClose: () => void
  place: PlaceResult | null
  currentCity: string
}

export default function SavePlaceModal({ isOpen, onClose, place, currentCity }: SavePlaceModalProps) {
  const { user, session } = useAuth()
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreateNew, setShowCreateNew] = useState(false)
  const [newTripName, setNewTripName] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (isOpen && user && session) {
      fetchItineraries()
    }
  }, [isOpen, user, session])

  async function fetchItineraries() {
    setLoading(true)
    try {
      const response = await fetch('/api/itineraries', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setItineraries(data.itineraries || [])
      }
    } catch (error) {
      console.error('Failed to fetch itineraries:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveToItinerary(itineraryId: string) {
    if (!place) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/saved-places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          itinerary_id: itineraryId,
          name: place.name,
          category: place.category,
          description: place.description,
          address: place.address,
          city: place.city || currentCity,
          lat: place.lat,
          lon: place.lon,
        }),
      })
      
      if (response.ok) {
        setSuccess('Place saved!')
        setTimeout(() => {
          onClose()
          setSuccess('')
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to save place:', error)
    } finally {
      setSaving(false)
    }
  }

  async function createAndSave() {
    if (!newTripName.trim() || !place) return
    
    setSaving(true)
    try {
      const createResponse = await fetch('/api/itineraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ name: newTripName }),
      })
      
      if (createResponse.ok) {
        const { itinerary } = await createResponse.json()
        await saveToItinerary(itinerary.id)
      }
    } catch (error) {
      console.error('Failed to create itinerary:', error)
    } finally {
      setSaving(false)
    }
  }

  function getCitiesFromItinerary(itinerary: Itinerary): string[] {
    if (!itinerary.saved_places) return []
    const cities = new Set<string>()
    itinerary.saved_places.forEach(p => {
      if (p.city) cities.add(p.city)
    })
    return Array.from(cities)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div className="relative bg-cream-50 rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors z-10"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        <div className="p-6 border-b border-cream-200">
          <h2 className="text-xl font-serif text-stone-900 mb-1">Save Place</h2>
          {place && (
            <p className="text-stone-500 text-sm">{place.name}</p>
          )}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {success ? (
            <div className="text-center py-8">
              <i className="fa-solid fa-check-circle text-4xl text-green-500 mb-3"></i>
              <p className="text-stone-900 font-medium">{success}</p>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <i className="fa-solid fa-circle-notch animate-spin text-2xl text-stone-400"></i>
            </div>
          ) : showCreateNew ? (
            <div className="space-y-4">
              <button
                onClick={() => setShowCreateNew(false)}
                className="text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1"
              >
                <i className="fa-solid fa-arrow-left"></i>
                Back to trips
              </button>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Trip Name
                </label>
                <input
                  type="text"
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                  className="input-field w-full px-4 py-3 rounded-md"
                  placeholder="Summer Europe Adventure"
                  onKeyDown={(e) => e.key === 'Enter' && createAndSave()}
                />
              </div>
              <button
                onClick={createAndSave}
                disabled={saving || !newTripName.trim()}
                className="btn-primary w-full py-3 rounded-md font-medium disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create & Save'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {itineraries.length > 0 ? (
                <>
                  <p className="text-sm text-stone-500 mb-3">Select a trip:</p>
                  {itineraries.map((itinerary) => {
                    const cities = getCitiesFromItinerary(itinerary)
                    return (
                      <button
                        key={itinerary.id}
                        onClick={() => saveToItinerary(itinerary.id)}
                        disabled={saving}
                        className="w-full text-left p-4 bg-white border border-cream-300 rounded-lg hover:border-stone-400 transition-colors disabled:opacity-50"
                      >
                        <p className="font-medium text-stone-900">{itinerary.name}</p>
                        {cities.length > 0 && (
                          <p className="text-sm text-stone-500 flex items-center gap-1 mt-0.5">
                            <i className="fa-solid fa-location-dot text-xs"></i>
                            {cities.slice(0, 3).join(', ')}
                            {cities.length > 3 && ` +${cities.length - 3} more`}
                          </p>
                        )}
                        <p className="text-xs text-stone-400 mt-1">
                          {itinerary.saved_places?.length || 0} places
                        </p>
                      </button>
                    )
                  })}
                </>
              ) : (
                <p className="text-stone-500 text-center py-4">No trips yet</p>
              )}
              
              <button
                onClick={() => setShowCreateNew(true)}
                className="w-full p-4 border border-dashed border-cream-400 rounded-lg text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-colors flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-plus"></i>
                Create New Trip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
