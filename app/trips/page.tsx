'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/AuthContext'
import { Itinerary, SavedPlace } from '@/lib/database.types'
import Navigation from '@/components/Navigation'

const PlacesMap = dynamic(() => import('@/components/PlacesMap'), { ssr: false })

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export default function TripsPage() {
  const { user, session, loading: authLoading } = useAuth()
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTripName, setNewTripName] = useState('')
  const [creating, setCreating] = useState(false)
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [draggedPlace, setDraggedPlace] = useState<SavedPlace | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [sharingTrip, setSharingTrip] = useState<Itinerary | null>(null)
  const noteInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (user && session) {
      fetchItineraries()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [user, session, authLoading])

  useEffect(() => {
    if (editingNote && noteInputRef.current) {
      noteInputRef.current.focus()
    }
  }, [editingNote])

  async function fetchItineraries() {
    try {
      const response = await fetch('/api/itineraries', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
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

  async function createItinerary() {
    if (!newTripName.trim()) return
    
    setCreating(true)
    try {
      const response = await fetch('/api/itineraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ name: newTripName }),
      })
      
      if (response.ok) {
        setNewTripName('')
        setShowCreateModal(false)
        fetchItineraries()
      }
    } catch (error) {
      console.error('Failed to create itinerary:', error)
    } finally {
      setCreating(false)
    }
  }

  async function deleteItinerary(id: string) {
    if (!confirm('Are you sure you want to delete this trip?')) return
    
    try {
      const response = await fetch(`/api/itineraries?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      
      if (response.ok) {
        fetchItineraries()
      }
    } catch (error) {
      console.error('Failed to delete itinerary:', error)
    }
  }

  async function removePlace(placeId: string) {
    try {
      const response = await fetch(`/api/saved-places?id=${placeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      
      if (response.ok) {
        fetchItineraries()
      }
    } catch (error) {
      console.error('Failed to remove place:', error)
    }
  }

  async function updatePlace(placeId: string, updates: { notes?: string; day_number?: number }) {
    try {
      const response = await fetch('/api/saved-places', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ id: placeId, ...updates }),
      })
      
      if (response.ok) {
        fetchItineraries()
      }
    } catch (error) {
      console.error('Failed to update place:', error)
    }
  }

  async function saveNote(placeId: string) {
    await updatePlace(placeId, { notes: noteText })
    setEditingNote(null)
    setNoteText('')
  }

  function startEditNote(place: SavedPlace) {
    setEditingNote(place.id)
    setNoteText(place.notes || '')
  }

  async function shareTrip(itinerary: Itinerary) {
    setSharingTrip(itinerary)
    
    if (itinerary.share_id) {
      setShareUrl(`${window.location.origin}/trip/${itinerary.share_id}`)
      setShowShareModal(true)
      return
    }

    try {
      const response = await fetch('/api/itineraries', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ id: itinerary.id, action: 'generate_share_link' }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setShareUrl(`${window.location.origin}${data.shareUrl}`)
        setShowShareModal(true)
        fetchItineraries()
      }
    } catch (error) {
      console.error('Failed to share trip:', error)
    }
  }

  async function unshareTrip(itinerary: Itinerary) {
    try {
      await fetch('/api/itineraries', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ id: itinerary.id, action: 'remove_share_link' }),
      })
      fetchItineraries()
      setShowShareModal(false)
    } catch (error) {
      console.error('Failed to unshare trip:', error)
    }
  }

  function copyShareLink() {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      alert('Link copied to clipboard!')
    }
  }

  function optimizeRoute(places: SavedPlace[]): SavedPlace[] {
    if (places.length < 2) return places
    
    const placesWithCoords = places.filter(p => p.lat && p.lon)
    if (placesWithCoords.length < 2) return places

    const optimized: SavedPlace[] = [placesWithCoords[0]]
    const remaining = placesWithCoords.slice(1)

    while (remaining.length > 0) {
      const last = optimized[optimized.length - 1]
      let nearestIdx = 0
      let nearestDist = Infinity

      remaining.forEach((place, idx) => {
        const dist = calculateDistance(last.lat!, last.lon!, place.lat!, place.lon!)
        if (dist < nearestDist) {
          nearestDist = dist
          nearestIdx = idx
        }
      })

      optimized.push(remaining.splice(nearestIdx, 1)[0])
    }

    return optimized
  }

  async function applyOptimizedRoute(itinerary: Itinerary, day: number) {
    const dayPlaces = (itinerary.saved_places || []).filter(p => (p.day_number || 0) === day)
    const optimized = optimizeRoute(dayPlaces)
    
    for (let i = 0; i < optimized.length; i++) {
      await updatePlace(optimized[i].id, { day_number: day })
    }
    
    alert('Route optimized! Places are now ordered by proximity.')
    fetchItineraries()
  }

  function handleDragStart(place: SavedPlace) {
    setDraggedPlace(place)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  async function handleDropOnDay(day: number) {
    if (draggedPlace) {
      await updatePlace(draggedPlace.id, { day_number: day })
      setDraggedPlace(null)
    }
  }

  function groupByDay(places: SavedPlace[]): Map<number, SavedPlace[]> {
    const groups = new Map<number, SavedPlace[]>()
    places.forEach(place => {
      const day = place.day_number || 0
      if (!groups.has(day)) groups.set(day, [])
      groups.get(day)!.push(place)
    })
    return new Map(Array.from(groups.entries()).sort((a, b) => a[0] - b[0]))
  }

  function getMaxDay(itinerary: Itinerary): number {
    if (!itinerary.saved_places) return 0
    return Math.max(0, ...itinerary.saved_places.map(p => p.day_number || 0))
  }

  function getCitiesFromPlaces(itinerary: Itinerary): string[] {
    if (!itinerary.saved_places) return []
    const cities = new Set<string>()
    itinerary.saved_places.forEach(p => {
      if (p.city) cities.add(p.city)
    })
    return Array.from(cities)
  }

  function exportToPDF(itinerary: Itinerary) {
    const dayGroups = groupByDay(itinerary.saved_places || [])
    const cities = getCitiesFromPlaces(itinerary)
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${itinerary.name} - Wanderlist</title>
        <style>
          body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1c1917; }
          h1 { font-size: 28px; margin-bottom: 8px; }
          .subtitle { color: #78716c; margin-bottom: 24px; }
          .day { margin-bottom: 32px; }
          .day-header { font-size: 18px; border-bottom: 2px solid #E8E6E1; padding-bottom: 8px; margin-bottom: 16px; }
          .place { margin-bottom: 16px; padding-left: 16px; border-left: 3px solid #E8E6E1; }
          .place-name { font-weight: 600; margin-bottom: 4px; }
          .place-info { font-size: 14px; color: #57534e; }
          .place-notes { font-size: 14px; color: #44403c; background: #FAF9F7; padding: 8px 12px; margin-top: 8px; border-radius: 4px; }
          .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #E8E6E1; font-size: 12px; color: #a8a29e; text-align: center; }
        </style>
      </head>
      <body>
        <h1>${itinerary.name}</h1>
        <p class="subtitle">${cities.join(' • ') || 'Your travel itinerary'}</p>
        
        ${Array.from(dayGroups.entries()).map(([day, places]) => `
          <div class="day">
            <h2 class="day-header">${day === 0 ? 'Unscheduled' : `Day ${day}`}</h2>
            ${places.map(place => `
              <div class="place">
                <div class="place-name">${place.name}</div>
                <div class="place-info">
                  ${place.city ? `<span>${place.city}</span>` : ''}
                  ${place.category ? `<span> • ${place.category}</span>` : ''}
                </div>
                ${place.notes ? `<div class="place-notes">${place.notes}</div>` : ''}
              </div>
            `).join('')}
          </div>
        `).join('')}
        
        <div class="footer">
          Created with Wanderlist • wanderlist.app
        </div>
      </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-cream-100">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <i className="fa-solid fa-circle-notch animate-spin text-3xl text-stone-400"></i>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-cream-100">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <i className="fa-solid fa-lock text-4xl text-stone-300 mb-6"></i>
          <h1 className="text-2xl font-serif text-stone-900 mb-3">Sign in to view your trips</h1>
          <p className="text-stone-500">Create an account to start saving places and planning itineraries.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream-100">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif text-stone-900 mb-1">My Trips</h1>
            <p className="text-stone-500">Plan and organize your adventures</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary px-5 py-2.5 rounded-md text-sm font-medium flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i>
            New Trip
          </button>
        </div>

        {itineraries.length === 0 ? (
          <div className="text-center py-16 bg-cream-50 rounded-xl border border-cream-300">
            <i className="fa-solid fa-suitcase text-4xl text-stone-300 mb-4"></i>
            <h2 className="text-xl font-serif text-stone-900 mb-2">No trips yet</h2>
            <p className="text-stone-500 mb-6">Create your first trip to start saving places.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary px-5 py-2.5 rounded-md text-sm font-medium"
            >
              Create Your First Trip
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {itineraries.map((itinerary) => {
              const cities = getCitiesFromPlaces(itinerary)
              const isExpanded = expandedTrip === itinerary.id
              const dayGroups = groupByDay(itinerary.saved_places || [])
              const maxDay = getMaxDay(itinerary)
              
              return (
                <div key={itinerary.id} className="bg-white border border-cream-300 rounded-xl overflow-hidden">
                  <div 
                    className="p-5 border-b border-cream-200 cursor-pointer hover:bg-cream-50 transition-colors"
                    onClick={() => setExpandedTrip(isExpanded ? null : itinerary.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-serif text-xl text-stone-900">{itinerary.name}</h3>
                        {cities.length > 0 && (
                          <p className="text-stone-500 text-sm flex items-center gap-1.5 mt-1">
                            <i className="fa-solid fa-location-dot"></i>
                            {cities.join(', ')}
                          </p>
                        )}
                        <p className="text-stone-400 text-xs mt-1">
                          {itinerary.saved_places?.length || 0} places saved
                          {itinerary.share_id && (
                            <span className="ml-2 text-green-600">
                              <i className="fa-solid fa-link mr-1"></i>
                              Shared
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            exportToPDF(itinerary)
                          }}
                          className="text-stone-400 hover:text-stone-600 transition-colors p-2"
                          title="Export to PDF"
                        >
                          <i className="fa-solid fa-file-pdf"></i>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            shareTrip(itinerary)
                          }}
                          className="text-stone-400 hover:text-stone-600 transition-colors p-2"
                          title="Share trip"
                        >
                          <i className="fa-solid fa-share-nodes"></i>
                        </button>
                        <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-stone-400 px-2`}></i>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteItinerary(itinerary.id)
                          }}
                          className="text-stone-400 hover:text-red-500 transition-colors p-2"
                          title="Delete trip"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-5">
                      {itinerary.saved_places && itinerary.saved_places.length > 0 && (
                        <div className="mb-5 rounded-xl overflow-hidden border border-cream-200">
                          <PlacesMap places={itinerary.saved_places} />
                        </div>
                      )}

                      {itinerary.saved_places && itinerary.saved_places.length > 0 ? (
                        <div className="space-y-4">
                          {Array.from(dayGroups.entries()).map(([day, places]) => (
                            <div 
                              key={day}
                              onDragOver={handleDragOver}
                              onDrop={() => handleDropOnDay(day)}
                              className="bg-cream-50 rounded-lg overflow-hidden border border-cream-200"
                            >
                              <div className="flex items-center justify-between px-4 py-2 bg-cream-100 border-b border-cream-200">
                                <h4 className="font-medium text-stone-700 text-sm">
                                  {day === 0 ? 'Unscheduled' : `Day ${day}`}
                                </h4>
                                <div className="flex items-center gap-2">
                                  {day > 0 && places.length > 1 && (
                                    <button
                                      onClick={() => applyOptimizedRoute(itinerary, day)}
                                      className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1"
                                      title="Optimize route order"
                                    >
                                      <i className="fa-solid fa-route"></i>
                                      Optimize
                                    </button>
                                  )}
                                  <span className="text-xs text-stone-400">{places.length} places</span>
                                </div>
                              </div>
                              
                              <div className="divide-y divide-cream-200">
                                {places.map((place) => (
                                  <div 
                                    key={place.id}
                                    draggable
                                    onDragStart={() => handleDragStart(place)}
                                    className="p-4 bg-white hover:bg-cream-50 transition-colors cursor-move"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <i className="fa-solid fa-grip-vertical text-stone-300 mt-1 cursor-grab"></i>
                                        <div className="flex-1 min-w-0">
                                          <h5 className="font-medium text-stone-900">{place.name}</h5>
                                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            {place.city && (
                                              <span className="text-xs text-stone-500">
                                                <i className="fa-solid fa-location-dot mr-1"></i>
                                                {place.city}
                                              </span>
                                            )}
                                            {place.category && (
                                              <span className="text-xs text-stone-400">• {place.category}</span>
                                            )}
                                          </div>
                                          
                                          {editingNote === place.id ? (
                                            <div className="mt-2">
                                              <textarea
                                                ref={noteInputRef}
                                                value={noteText}
                                                onChange={(e) => setNoteText(e.target.value)}
                                                placeholder="Add a note..."
                                                className="w-full text-sm p-2 border border-cream-300 rounded-md resize-none focus:outline-none focus:border-stone-400"
                                                rows={2}
                                              />
                                              <div className="flex gap-2 mt-1">
                                                <button
                                                  onClick={() => saveNote(place.id)}
                                                  className="text-xs bg-stone-900 text-white px-3 py-1 rounded"
                                                >
                                                  Save
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setEditingNote(null)
                                                    setNoteText('')
                                                  }}
                                                  className="text-xs text-stone-500 hover:text-stone-700"
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            </div>
                                          ) : place.notes ? (
                                            <p 
                                              onClick={() => startEditNote(place)}
                                              className="text-sm text-stone-600 mt-2 bg-cream-100 px-3 py-2 rounded cursor-pointer hover:bg-cream-200 transition-colors"
                                            >
                                              <i className="fa-solid fa-sticky-note mr-2 text-amber-500"></i>
                                              {place.notes}
                                            </p>
                                          ) : (
                                            <button
                                              onClick={() => startEditNote(place)}
                                              className="text-xs text-stone-400 hover:text-stone-600 mt-2"
                                            >
                                              <i className="fa-solid fa-plus mr-1"></i>
                                              Add note
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        <select
                                          value={place.day_number || 0}
                                          onChange={(e) => updatePlace(place.id, { day_number: parseInt(e.target.value) })}
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-xs bg-cream-100 border border-cream-300 rounded px-2 py-1 text-stone-600"
                                        >
                                          <option value={0}>No day</option>
                                          {[...Array(maxDay + 2)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>Day {i + 1}</option>
                                          ))}
                                        </select>
                                        <button
                                          onClick={() => removePlace(place.id)}
                                          className="text-stone-400 hover:text-red-500 transition-colors p-1"
                                          title="Remove"
                                        >
                                          <i className="fa-solid fa-xmark"></i>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          
                          <button
                            onDragOver={handleDragOver}
                            onDrop={() => handleDropOnDay(maxDay + 1)}
                            onClick={() => {
                              const unscheduled = (itinerary.saved_places || []).find(p => !p.day_number || p.day_number === 0)
                              if (unscheduled) {
                                updatePlace(unscheduled.id, { day_number: maxDay + 1 })
                              }
                            }}
                            className="w-full py-3 border-2 border-dashed border-cream-300 rounded-lg text-stone-400 hover:border-stone-400 hover:text-stone-500 transition-colors text-sm cursor-pointer"
                          >
                            <i className="fa-solid fa-plus mr-2"></i>
                            Add Day {maxDay + 1}
                          </button>
                        </div>
                      ) : (
                        <p className="text-stone-400 text-sm text-center py-8">
                          No places saved yet. Search for a city and save places to this trip!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
          <div className="relative bg-cream-50 rounded-xl shadow-2xl w-full max-w-md mx-4">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            <div className="p-8">
              <h2 className="text-2xl font-serif text-stone-900 mb-2">Create New Trip</h2>
              <p className="text-stone-500 text-sm mb-6">Give your trip a name. You can add places from any city!</p>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                  className="input-field w-full px-4 py-3 rounded-md"
                  placeholder="Summer Europe Adventure"
                  onKeyDown={(e) => e.key === 'Enter' && createItinerary()}
                />
                <button
                  onClick={createItinerary}
                  disabled={creating || !newTripName.trim()}
                  className="btn-primary w-full py-3 rounded-md font-medium disabled:opacity-50"
                >
                  {creating ? <><i className="fa-solid fa-circle-notch animate-spin mr-2"></i>Creating...</> : 'Create Trip'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showShareModal && sharingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowShareModal(false)}></div>
          <div className="relative bg-cream-50 rounded-xl shadow-2xl w-full max-w-md mx-4">
            <button onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            <div className="p-8">
              <h2 className="text-2xl font-serif text-stone-900 mb-2">Share Trip</h2>
              <p className="text-stone-500 text-sm mb-6">Share "{sharingTrip.name}" with friends and family.</p>
              
              <div className="bg-cream-100 rounded-lg p-4 mb-4">
                <p className="text-xs text-stone-500 mb-2">Share link</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl || ''}
                    className="flex-1 text-sm bg-white border border-cream-300 rounded px-3 py-2"
                  />
                  <button
                    onClick={copyShareLink}
                    className="btn-primary px-4 py-2 rounded text-sm"
                  >
                    <i className="fa-solid fa-copy"></i>
                  </button>
                </div>
              </div>

              <button
                onClick={() => unshareTrip(sharingTrip)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                <i className="fa-solid fa-link-slash mr-1"></i>
                Remove share link
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
