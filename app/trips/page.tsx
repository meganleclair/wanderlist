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

// Suggest cities based on trip name
const REGION_CITIES: Record<string, string[]> = {
  greece: ['Athens', 'Santorini', 'Mykonos', 'Crete', 'Rhodes'],
  italy: ['Rome', 'Florence', 'Venice', 'Milan', 'Amalfi'],
  spain: ['Barcelona', 'Madrid', 'Seville', 'Valencia', 'Ibiza'],
  france: ['Paris', 'Nice', 'Lyon', 'Marseille', 'Bordeaux'],
  japan: ['Tokyo', 'Kyoto', 'Osaka', 'Hiroshima', 'Nara'],
  thailand: ['Bangkok', 'Chiang Mai', 'Phuket', 'Krabi', 'Pattaya'],
  portugal: ['Lisbon', 'Porto', 'Sintra', 'Faro', 'Madeira'],
  croatia: ['Dubrovnik', 'Split', 'Zagreb', 'Hvar', 'Plitvice'],
  mexico: ['Mexico City', 'Cancun', 'Tulum', 'Oaxaca', 'Playa del Carmen'],
  uk: ['London', 'Edinburgh', 'Bath', 'Oxford', 'Cambridge'],
  england: ['London', 'Bath', 'Oxford', 'Cambridge', 'Brighton'],
  germany: ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt'],
  netherlands: ['Amsterdam', 'Rotterdam', 'Utrecht', 'The Hague', 'Haarlem'],
  australia: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Gold Coast'],
  bali: ['Ubud', 'Seminyak', 'Canggu', 'Uluwatu', 'Sanur'],
  indonesia: ['Bali', 'Jakarta', 'Yogyakarta', 'Lombok', 'Komodo'],
  vietnam: ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Hoi An', 'Ha Long Bay'],
  morocco: ['Marrakech', 'Fes', 'Casablanca', 'Chefchaouen', 'Essaouira'],
  turkey: ['Istanbul', 'Cappadocia', 'Antalya', 'Bodrum', 'Ephesus'],
  egypt: ['Cairo', 'Luxor', 'Aswan', 'Alexandria', 'Hurghada'],
  europe: ['Paris', 'Rome', 'Barcelona', 'Amsterdam', 'Prague'],
  asia: ['Tokyo', 'Bangkok', 'Singapore', 'Hong Kong', 'Seoul'],
  summer: ['Barcelona', 'Santorini', 'Amalfi', 'Dubrovnik', 'Ibiza'],
  beach: ['Bali', 'Phuket', 'Cancun', 'Maldives', 'Santorini'],
}

function getSuggestedCities(tripName: string): string[] {
  const nameLower = tripName.toLowerCase()
  
  // Check if trip name contains a known region
  for (const [region, cities] of Object.entries(REGION_CITIES)) {
    if (nameLower.includes(region)) {
      return cities
    }
  }
  
  // Default popular cities
  return ['Paris', 'Barcelona', 'Rome', 'Tokyo', 'New York']
}

export default function TripsPage() {
  const { user, session, loading: authLoading } = useAuth()
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTripName, setNewTripName] = useState('')
  const [newTripStartDate, setNewTripStartDate] = useState('')
  const [newTripEndDate, setNewTripEndDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [tripDates, setTripDates] = useState<Record<string, { start: string; end: string }>>({})
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [editingDates, setEditingDates] = useState<string | null>(null)
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [draggedPlace, setDraggedPlace] = useState<SavedPlace | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [sharingTrip, setSharingTrip] = useState<Itinerary | null>(null)
  const [showOptimizeModal, setShowOptimizeModal] = useState(false)
  const [optimizingTrip, setOptimizingTrip] = useState<Itinerary | null>(null)
  const [showTravelInfoModal, setShowTravelInfoModal] = useState(false)
  const [travelInfoTrip, setTravelInfoTrip] = useState<Itinerary | null>(null)
  const [tripNotes, setTripNotes] = useState('')
  const [dayTravelInfo, setDayTravelInfo] = useState<Record<string, { flight: string; hotel: string }>>({})
  const [editingDayInfo, setEditingDayInfo] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [completedTrips, setCompletedTrips] = useState<Set<string>>(new Set())
  const [archivedTrips, setArchivedTrips] = useState<Set<string>>(new Set())
  const [showArchived, setShowArchived] = useState(false)
  const noteInputRef = useRef<HTMLTextAreaElement>(null)

  // Load completed/archived status and trip dates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('wanderlist-trip-status')
    if (saved) {
      const { completed, archived } = JSON.parse(saved)
      setCompletedTrips(new Set(completed || []))
      setArchivedTrips(new Set(archived || []))
    }
    const savedDates = localStorage.getItem('wanderlist-trip-dates')
    if (savedDates) {
      setTripDates(JSON.parse(savedDates))
    }
  }, [])

  // Save completed/archived status to localStorage
  useEffect(() => {
    localStorage.setItem('wanderlist-trip-status', JSON.stringify({
      completed: Array.from(completedTrips),
      archived: Array.from(archivedTrips),
    }))
  }, [completedTrips, archivedTrips])

  // Save trip dates to localStorage
  useEffect(() => {
    localStorage.setItem('wanderlist-trip-dates', JSON.stringify(tripDates))
  }, [tripDates])

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside() {
      setOpenMenuId(null)
    }
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuId])

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
        const data = await response.json()
        // Save dates if provided
        if (newTripStartDate || newTripEndDate) {
          setTripDates(prev => ({
            ...prev,
            [data.itinerary.id]: { start: newTripStartDate, end: newTripEndDate }
          }))
        }
        setNewTripName('')
        setNewTripStartDate('')
        setNewTripEndDate('')
        setShowCreateModal(false)
        fetchItineraries()
      }
    } catch (error) {
      console.error('Failed to create itinerary:', error)
    } finally {
      setCreating(false)
    }
  }

  async function duplicateTrip(itinerary: Itinerary) {
    setDuplicating(itinerary.id)
    try {
      // Create new itinerary with copied name
      const response = await fetch('/api/itineraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ name: `${itinerary.name} (Copy)` }),
      })
      
      if (response.ok) {
        const data = await response.json()
        const newItineraryId = data.itinerary.id
        
        // Copy all saved places
        if (itinerary.saved_places && itinerary.saved_places.length > 0) {
          for (const place of itinerary.saved_places) {
            await fetch('/api/saved-places', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session?.access_token}`,
              },
              body: JSON.stringify({
                itinerary_id: newItineraryId,
                place_id: place.place_id,
                name: place.name,
                category: place.category,
                address: place.address,
                city: place.city,
                lat: place.lat,
                lon: place.lon,
                notes: place.notes,
                day_number: place.day_number,
                sort_order: place.sort_order,
              }),
            })
          }
        }
        
        // Copy dates if they exist
        if (tripDates[itinerary.id]) {
          setTripDates(prev => ({
            ...prev,
            [newItineraryId]: { ...tripDates[itinerary.id] }
          }))
        }
        
        fetchItineraries()
      }
    } catch (error) {
      console.error('Failed to duplicate trip:', error)
    } finally {
      setDuplicating(null)
      setOpenMenuId(null)
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
        // Clean up local status
        setCompletedTrips(prev => { prev.delete(id); return new Set(prev) })
        setArchivedTrips(prev => { prev.delete(id); return new Set(prev) })
      }
    } catch (error) {
      console.error('Failed to delete itinerary:', error)
    }
  }

  function toggleCompleted(id: string) {
    setCompletedTrips(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  function toggleArchived(id: string) {
    setArchivedTrips(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  async function swapDays(itinerary: Itinerary, day1: number, day2: number) {
    const places = itinerary.saved_places || []
    const updates: Promise<Response>[] = []
    
    for (const place of places) {
      if (place.day_number === day1) {
        updates.push(
          fetch('/api/saved-places', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ id: place.id, day_number: day2 }),
          })
        )
      } else if (place.day_number === day2) {
        updates.push(
          fetch('/api/saved-places', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ id: place.id, day_number: day1 }),
          })
        )
      }
    }
    
    await Promise.all(updates)
    fetchItineraries()
  }

  function getCountdown(tripId: string): string | null {
    const dates = tripDates[tripId]
    if (!dates?.start) return null
    
    const start = new Date(dates.start)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    
    const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diff < 0) return null
    if (diff === 0) return "Today!"
    if (diff === 1) return "Tomorrow!"
    return `In ${diff} days`
  }

  function formatDateRange(tripId: string): string | null {
    const dates = tripDates[tripId]
    if (!dates?.start) return null
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    const start = new Date(dates.start).toLocaleDateString('en-US', options)
    
    if (dates.end) {
      const endDate = new Date(dates.end)
      const startDate = new Date(dates.start)
      const endOptions: Intl.DateTimeFormatOptions = startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() === endDate.getMonth()
        ? { day: 'numeric' }
        : { month: 'short', day: 'numeric' }
      const end = endDate.toLocaleDateString('en-US', endOptions)
      return `${start} - ${end}`
    }
    return start
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

  async function optimizeEntireTrip(itinerary: Itinerary) {
    const places = itinerary.saved_places || []
    if (places.length === 0) return

    // Group places by city
    const byCity: Record<string, SavedPlace[]> = {}
    places.forEach(place => {
      const city = place.city || 'Unknown'
      if (!byCity[city]) byCity[city] = []
      byCity[city].push(place)
    })

    // Assign days - one city at a time, optimized within each city
    let currentDay = 1
    const cityNames = Object.keys(byCity)
    
    for (const cityName of cityNames) {
      const cityPlaces = byCity[cityName]
      const optimized = optimizeRoute(cityPlaces)
      
      for (const place of optimized) {
        await updatePlace(place.id, { day_number: currentDay })
      }
      currentDay++
    }

    setShowOptimizeModal(false)
    setOptimizingTrip(null)
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
          <>
            {/* Active Trips */}
            {itineraries.filter(i => !completedTrips.has(i.id) && !archivedTrips.has(i.id)).length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">
                  <i className="fa-solid fa-suitcase-rolling mr-2"></i>
                  Upcoming Trips
                </h2>
                <div className="space-y-4">
                  {itineraries.filter(i => !completedTrips.has(i.id) && !archivedTrips.has(i.id)).map((itinerary) => {
                    const cities = getCitiesFromPlaces(itinerary)
                    const isExpanded = expandedTrip === itinerary.id
                    const dayGroups = groupByDay(itinerary.saved_places || [])
                    const maxDay = getMaxDay(itinerary)
                    
                    return (
                <div key={itinerary.id} className="bg-white border border-cream-300 rounded-xl">
                  <div 
                    className="p-5 border-b border-cream-200 cursor-pointer hover:bg-cream-50 transition-colors"
                    onClick={() => setExpandedTrip(isExpanded ? null : itinerary.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-serif text-xl text-stone-900">{itinerary.name}</h3>
                          {getCountdown(itinerary.id) && (
                            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                              {getCountdown(itinerary.id)}
                            </span>
                          )}
                        </div>
                        {editingDates === itinerary.id ? (
                          <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="date"
                              value={editStartDate}
                              onChange={(e) => setEditStartDate(e.target.value)}
                              className="text-xs px-2 py-1 border border-cream-300 rounded bg-white"
                            />
                            <span className="text-stone-400">to</span>
                            <input
                              type="date"
                              value={editEndDate}
                              onChange={(e) => setEditEndDate(e.target.value)}
                              min={editStartDate}
                              className="text-xs px-2 py-1 border border-cream-300 rounded bg-white"
                            />
                            <button
                              onClick={() => {
                                setTripDates(prev => ({
                                  ...prev,
                                  [itinerary.id]: { start: editStartDate, end: editEndDate }
                                }))
                                setEditingDates(null)
                              }}
                              className="text-green-600 hover:text-green-700 p-1"
                            >
                              <i className="fa-solid fa-check"></i>
                            </button>
                            <button
                              onClick={() => setEditingDates(null)}
                              className="text-stone-400 hover:text-stone-600 p-1"
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        ) : formatDateRange(itinerary.id) ? (
                          <p className="text-stone-500 text-sm flex items-center gap-1.5 mt-1">
                            <i className="fa-regular fa-calendar"></i>
                            {formatDateRange(itinerary.id)}
                          </p>
                        ) : null}
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
                      <div className="flex items-center gap-2">
                        {/* Mark Complete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleCompleted(itinerary.id)
                          }}
                          className="text-stone-400 hover:text-green-600 transition-colors p-2"
                          title="Mark as complete"
                        >
                          <i className="fa-solid fa-circle-check"></i>
                        </button>
                        
                        {/* More Actions Dropdown */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(openMenuId === itinerary.id ? null : itinerary.id)
                            }}
                            className="text-stone-400 hover:text-stone-600 transition-colors p-2"
                          >
                            <i className="fa-solid fa-ellipsis"></i>
                          </button>
                          
                          {openMenuId === itinerary.id && (
                            <div 
                              className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-cream-200 py-1 z-50 min-w-[160px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setEditingDates(itinerary.id)
                                  setEditStartDate(tripDates[itinerary.id]?.start || '')
                                  setEditEndDate(tripDates[itinerary.id]?.end || '')
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-cream-100 flex items-center gap-3"
                              >
                                <i className="fa-regular fa-calendar w-4"></i>
                                Edit Dates
                              </button>
                              <button
                                onClick={() => {
                                  setTravelInfoTrip(itinerary)
                                  setShowTravelInfoModal(true)
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-cream-100 flex items-center gap-3"
                              >
                                <i className="fa-solid fa-clipboard-list w-4"></i>
                                Trip Notes
                              </button>
                              <button
                                onClick={() => {
                                  setOptimizingTrip(itinerary)
                                  setShowOptimizeModal(true)
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-cream-100 flex items-center gap-3"
                              >
                                <i className="fa-solid fa-wand-magic-sparkles w-4"></i>
                                Optimize Trip
                              </button>
                              <button
                                onClick={() => {
                                  exportToPDF(itinerary)
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-cream-100 flex items-center gap-3"
                              >
                                <i className="fa-solid fa-file-pdf w-4"></i>
                                Export PDF
                              </button>
                              <button
                                onClick={() => {
                                  shareTrip(itinerary)
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-cream-100 flex items-center gap-3"
                              >
                                <i className="fa-solid fa-share-nodes w-4"></i>
                                Share Trip
                              </button>
                              <button
                                onClick={() => duplicateTrip(itinerary)}
                                disabled={duplicating === itinerary.id}
                                className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-cream-100 flex items-center gap-3 disabled:opacity-50"
                              >
                                <i className={`fa-solid ${duplicating === itinerary.id ? 'fa-circle-notch animate-spin' : 'fa-copy'} w-4`}></i>
                                {duplicating === itinerary.id ? 'Duplicating...' : 'Duplicate Trip'}
                              </button>
                              <div className="border-t border-cream-200 my-1"></div>
                              <button
                                onClick={() => {
                                  toggleArchived(itinerary.id)
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-cream-100 flex items-center gap-3"
                              >
                                <i className="fa-solid fa-box-archive w-4"></i>
                                Archive
                              </button>
                              <button
                                onClick={() => {
                                  deleteItinerary(itinerary.id)
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-3"
                              >
                                <i className="fa-solid fa-trash w-4"></i>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Expand/Collapse */}
                        <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-stone-400`}></i>
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
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-stone-700 text-sm">
                                    {day === 0 ? 'Unscheduled' : `Day ${day}`}
                                  </h4>
                                  {/* Day reorder buttons */}
                                  {day > 0 && maxDay > 1 && (
                                    <div className="flex items-center gap-0.5 ml-1">
                                      <button
                                        onClick={() => day > 1 && swapDays(itinerary, day, day - 1)}
                                        disabled={day <= 1}
                                        className={`p-1 rounded ${day > 1 ? 'text-stone-400 hover:text-stone-600 hover:bg-cream-200' : 'text-stone-200 cursor-not-allowed'}`}
                                        title="Move day up"
                                      >
                                        <i className="fa-solid fa-chevron-up text-xs"></i>
                                      </button>
                                      <button
                                        onClick={() => day < maxDay && swapDays(itinerary, day, day + 1)}
                                        disabled={day >= maxDay}
                                        className={`p-1 rounded ${day < maxDay ? 'text-stone-400 hover:text-stone-600 hover:bg-cream-200' : 'text-stone-200 cursor-not-allowed'}`}
                                        title="Move day down"
                                      >
                                        <i className="fa-solid fa-chevron-down text-xs"></i>
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {day > 0 && (
                                    <button
                                      onClick={() => setEditingDayInfo(editingDayInfo === `${itinerary.id}-${day}` ? null : `${itinerary.id}-${day}`)}
                                      className={`text-xs flex items-center gap-1 ${
                                        dayTravelInfo[`${itinerary.id}-${day}`]?.flight || dayTravelInfo[`${itinerary.id}-${day}`]?.hotel
                                          ? 'text-blue-600 hover:text-blue-700'
                                          : 'text-stone-400 hover:text-stone-600'
                                      }`}
                                      title="Add flight/hotel"
                                    >
                                      <i className="fa-solid fa-plane-departure"></i>
                                    </button>
                                  )}
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

                              {/* Day travel info (flight/hotel) */}
                              {day > 0 && (editingDayInfo === `${itinerary.id}-${day}` || dayTravelInfo[`${itinerary.id}-${day}`]?.flight || dayTravelInfo[`${itinerary.id}-${day}`]?.hotel) && (
                                <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                                  {editingDayInfo === `${itinerary.id}-${day}` ? (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-plane text-blue-500 text-xs w-4"></i>
                                        <input
                                          type="text"
                                          placeholder="Flight info (e.g., UA123 departs 10am)"
                                          value={dayTravelInfo[`${itinerary.id}-${day}`]?.flight || ''}
                                          onChange={(e) => setDayTravelInfo(prev => ({
                                            ...prev,
                                            [`${itinerary.id}-${day}`]: { ...prev[`${itinerary.id}-${day}`], flight: e.target.value }
                                          }))}
                                          className="flex-1 text-xs bg-white border border-blue-200 rounded px-2 py-1.5"
                                        />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-hotel text-green-500 text-xs w-4"></i>
                                        <input
                                          type="text"
                                          placeholder="Hotel info (e.g., Hotel Arts, Conf #ABC123)"
                                          value={dayTravelInfo[`${itinerary.id}-${day}`]?.hotel || ''}
                                          onChange={(e) => setDayTravelInfo(prev => ({
                                            ...prev,
                                            [`${itinerary.id}-${day}`]: { ...prev[`${itinerary.id}-${day}`], hotel: e.target.value }
                                          }))}
                                          className="flex-1 text-xs bg-white border border-blue-200 rounded px-2 py-1.5"
                                        />
                                      </div>
                                      <button
                                        onClick={() => setEditingDayInfo(null)}
                                        className="text-xs text-blue-600 hover:text-blue-700"
                                      >
                                        Done
                                      </button>
                                    </div>
                                  ) : (
                                    <div 
                                      className="space-y-1 cursor-pointer"
                                      onClick={() => setEditingDayInfo(`${itinerary.id}-${day}`)}
                                    >
                                      {dayTravelInfo[`${itinerary.id}-${day}`]?.flight && (
                                        <p className="text-xs text-blue-700">
                                          <i className="fa-solid fa-plane mr-2"></i>
                                          {dayTravelInfo[`${itinerary.id}-${day}`].flight}
                                        </p>
                                      )}
                                      {dayTravelInfo[`${itinerary.id}-${day}`]?.hotel && (
                                        <p className="text-xs text-green-700">
                                          <i className="fa-solid fa-hotel mr-2"></i>
                                          {dayTravelInfo[`${itinerary.id}-${day}`].hotel}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              
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
                                          {maxDay > 0 && [...Array(maxDay)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>Day {i + 1}</option>
                                          ))}
                                          <option value={maxDay + 1}>+ Day {maxDay + 1}</option>
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
                        <div className="text-center py-8">
                          <p className="text-stone-500 mb-4">No places saved yet. Start exploring!</p>
                          <p className="text-xs text-stone-400 mb-3">Popular cities to get started:</p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {getSuggestedCities(itinerary.name).map((city) => (
                              <a
                                key={city}
                                href={`/?search=${encodeURIComponent(city)}`}
                                className="px-3 py-1.5 bg-white border border-cream-300 rounded-full text-sm text-stone-600 hover:border-stone-400 hover:text-stone-800 transition-colors"
                              >
                                {city}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Completed Trips */}
            {itineraries.filter(i => completedTrips.has(i.id) && !archivedTrips.has(i.id)).length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">
                  <i className="fa-solid fa-circle-check mr-2 text-green-500"></i>
                  Completed Trips
                </h2>
                <div className="space-y-4">
                  {itineraries.filter(i => completedTrips.has(i.id) && !archivedTrips.has(i.id)).map((itinerary) => {
                    const cities = getCitiesFromPlaces(itinerary)
                    return (
                      <div key={itinerary.id} className="bg-white/60 border border-cream-300 rounded-xl p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-serif text-xl text-stone-700">{itinerary.name}</h3>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Completed</span>
                            </div>
                            {cities.length > 0 && (
                              <p className="text-stone-400 text-sm flex items-center gap-1.5 mt-1">
                                <i className="fa-solid fa-location-dot"></i>
                                {cities.join(', ')}
                              </p>
                            )}
                            <p className="text-stone-400 text-xs mt-1">
                              {itinerary.saved_places?.length || 0} places
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleCompleted(itinerary.id)}
                              className="text-stone-400 hover:text-stone-600 transition-colors p-2"
                              title="Mark as active"
                            >
                              <i className="fa-solid fa-rotate-left"></i>
                            </button>
                            <button
                              onClick={() => toggleArchived(itinerary.id)}
                              className="text-stone-400 hover:text-stone-600 transition-colors p-2"
                              title="Archive"
                            >
                              <i className="fa-solid fa-box-archive"></i>
                            </button>
                            <button
                              onClick={() => setExpandedTrip(expandedTrip === itinerary.id ? null : itinerary.id)}
                              className="text-stone-400 p-2"
                            >
                              <i className={`fa-solid fa-chevron-${expandedTrip === itinerary.id ? 'up' : 'down'}`}></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Archived Trips Toggle */}
            {itineraries.filter(i => archivedTrips.has(i.id)).length > 0 && (
              <div className="border-t border-cream-300 pt-6">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="text-sm text-stone-400 hover:text-stone-600 flex items-center gap-2"
                >
                  <i className={`fa-solid fa-chevron-${showArchived ? 'up' : 'down'}`}></i>
                  <i className="fa-solid fa-box-archive"></i>
                  {showArchived ? 'Hide' : 'Show'} archived trips ({itineraries.filter(i => archivedTrips.has(i.id)).length})
                </button>
                
                {showArchived && (
                  <div className="mt-4 space-y-3">
                    {itineraries.filter(i => archivedTrips.has(i.id)).map((itinerary) => {
                      const cities = getCitiesFromPlaces(itinerary)
                      return (
                        <div key={itinerary.id} className="bg-cream-50 border border-cream-200 rounded-lg p-4 opacity-60">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-stone-600">{itinerary.name}</h3>
                              {cities.length > 0 && (
                                <p className="text-stone-400 text-xs">{cities.join(', ')}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => toggleArchived(itinerary.id)}
                                className="text-stone-400 hover:text-stone-600 transition-colors p-2 text-sm"
                                title="Unarchive"
                              >
                                <i className="fa-solid fa-box-open"></i>
                              </button>
                              <button
                                onClick={() => deleteItinerary(itinerary.id)}
                                className="text-stone-400 hover:text-red-500 transition-colors p-2 text-sm"
                                title="Delete permanently"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">Start date (optional)</label>
                    <input
                      type="date"
                      value={newTripStartDate}
                      onChange={(e) => setNewTripStartDate(e.target.value)}
                      className="input-field w-full px-3 py-2 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">End date (optional)</label>
                    <input
                      type="date"
                      value={newTripEndDate}
                      onChange={(e) => setNewTripEndDate(e.target.value)}
                      min={newTripStartDate}
                      className="input-field w-full px-3 py-2 rounded-md text-sm"
                    />
                  </div>
                </div>
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

      {/* Optimize Entire Trip Modal */}
      {showOptimizeModal && optimizingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowOptimizeModal(false)}></div>
          <div className="relative bg-cream-50 rounded-xl shadow-2xl w-full max-w-md mx-4">
            <button onClick={() => setShowOptimizeModal(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            <div className="p-8">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-wand-magic-sparkles text-2xl text-purple-600"></i>
              </div>
              <h2 className="text-2xl font-serif text-stone-900 mb-2 text-center">Optimize Trip</h2>
              <p className="text-stone-500 text-sm mb-6 text-center">
                This will reorganize your entire trip so you visit one city at a time, 
                with places optimized by proximity within each city.
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-amber-800 text-sm">
                  <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                  This will reassign all places to new days. Your current day assignments will be replaced.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowOptimizeModal(false)}
                  className="flex-1 py-3 rounded-lg font-medium border border-cream-300 text-stone-600 hover:bg-cream-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => optimizeEntireTrip(optimizingTrip)}
                  className="flex-1 btn-primary py-3 rounded-lg font-medium"
                >
                  Optimize
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trip Notes Modal */}
      {showTravelInfoModal && travelInfoTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTravelInfoModal(false)}></div>
          <div className="relative bg-cream-50 rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <button onClick={() => setShowTravelInfoModal(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            <div className="p-8">
              <h2 className="text-2xl font-serif text-stone-900 mb-2">Trip Notes</h2>
              <p className="text-stone-500 text-sm mb-6">Add general notes for "{travelInfoTrip.name}".</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-700 text-sm">
                  <i className="fa-solid fa-lightbulb mr-2"></i>
                  <strong>Tip:</strong> Add flight and hotel info directly to each day using the <i className="fa-solid fa-plane-departure mx-1"></i> icon in the day header.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  <i className="fa-solid fa-note-sticky mr-2 text-amber-500"></i>
                  Travel Notes
                </label>
                <textarea
                  value={tripNotes}
                  onChange={(e) => setTripNotes(e.target.value)}
                  placeholder="e.g., Travel insurance policy #, emergency contacts, packing list, restaurant reservations..."
                  className="input-field w-full px-4 py-3 rounded-lg resize-none"
                  rows={6}
                />
              </div>

              <div className="mt-6 pt-4 border-t border-cream-200">
                <p className="text-xs text-stone-400 text-center">
                  <i className="fa-solid fa-info-circle mr-1"></i>
                  Notes are saved locally and included in your PDF export.
                </p>
              </div>
              
              <button
                onClick={() => setShowTravelInfoModal(false)}
                className="btn-primary w-full py-3 rounded-lg font-medium mt-4"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
