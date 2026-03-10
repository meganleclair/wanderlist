'use client'

import { useState, useEffect, useMemo } from 'react'
import { PlaceResult, SearchRecord, SavedPlace } from '@/lib/database.types'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import SearchForm from '@/components/SearchForm'
import PlaceCard from '@/components/PlaceCard'
import RecentSearches from '@/components/RecentSearches'
import EmptyState from '@/components/EmptyState'
import LoadingState from '@/components/LoadingState'
import ErrorState from '@/components/ErrorState'
import SavePlaceModal from '@/components/SavePlaceModal'
import PlaceDetailModal from '@/components/PlaceDetailModal'

type AppState = 'empty' | 'loading' | 'success' | 'error'
type SortOption = 'default' | 'distance' | 'name'

function capitalizeCity(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

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

interface CityImage {
  url: string
  credit: string
}

interface CityCoords {
  lat: number
  lon: number
}

interface PlaceWithType extends PlaceResult {
  type: 'top' | 'gem'
}

const CATEGORY_FILTERS = [
  { id: 'culture', label: 'Museums & Culture', icon: 'fa-building-columns', keywords: ['museum', 'gallery', 'art', 'culture', 'theatre', 'theater', 'entertainment'] },
  { id: 'nature', label: 'Parks & Nature', icon: 'fa-leaf', keywords: ['park', 'garden', 'nature', 'beach'] },
  { id: 'food', label: 'Food & Drink', icon: 'fa-utensils', keywords: ['cafe', 'catering', 'restaurant', 'food', 'bar', 'pub'] },
  { id: 'shopping', label: 'Shopping', icon: 'fa-bag-shopping', keywords: ['market', 'shop', 'store', 'marketplace', 'commercial'] },
  { id: 'historic', label: 'Historic Sites', icon: 'fa-monument', keywords: ['historic', 'monument', 'building', 'castle', 'church', 'temple', 'tourism.attraction', 'tourism.sights', 'access'] },
]

const TYPE_FILTERS = [
  { id: 'top', label: 'Top Picks', icon: 'fa-star' },
  { id: 'gem', label: 'Hidden Gems', icon: 'fa-gem' },
]

export default function Home() {
  const { user, session } = useAuth()
  const [appState, setAppState] = useState<AppState>('empty')
  const [searchedCity, setSearchedCity] = useState('')
  const [cityImage, setCityImage] = useState<CityImage | null>(null)
  const [cityCoords, setCityCoords] = useState<CityCoords | null>(null)
  const [topResults, setTopResults] = useState<PlaceResult[]>([])
  const [hiddenGems, setHiddenGems] = useState<PlaceResult[]>([])
  const [recentSearches, setRecentSearches] = useState<SearchRecord[]>([])
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [placeToSave, setPlaceToSave] = useState<PlaceResult | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['top', 'gem'])
  const [sortBy, setSortBy] = useState<SortOption>('default')

  useEffect(() => {
    fetchRecentSearches()
  }, [])

  useEffect(() => {
    if (user && session) {
      fetchSavedPlaces()
    } else {
      setSavedPlaces([])
    }
  }, [user, session])

  async function fetchRecentSearches() {
    try {
      const response = await fetch('/api/searches')
      if (response.ok) {
        const data = await response.json()
        setRecentSearches(data.searches || [])
      }
    } catch (error) {
      console.error('Failed to fetch recent searches:', error)
    }
  }

  async function fetchSavedPlaces() {
    if (!session?.access_token) return
    
    try {
      const response = await fetch('/api/itineraries', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        const allSavedPlaces: SavedPlace[] = []
        for (const itinerary of data.itineraries || []) {
          if (itinerary.saved_places) {
            allSavedPlaces.push(...itinerary.saved_places)
          }
        }
        setSavedPlaces(allSavedPlaces)
      }
    } catch (error) {
      console.error('Failed to fetch saved places:', error)
    }
  }

  async function handleSearch(city: string) {
    if (!city.trim()) return

    setAppState('loading')
    setSearchedCity(capitalizeCity(city))
    setErrorMessage('')
    setCityImage(null)
    setCityCoords(null)

    try {
      const response = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch places')
      }

      const coords = data.cityLat && data.cityLon 
        ? { lat: data.cityLat, lon: data.cityLon } 
        : null
      setCityCoords(coords)

      const addDistance = (places: PlaceResult[]) => {
        if (!coords) return places
        return places.map(p => ({
          ...p,
          distance: p.lat && p.lon 
            ? calculateDistance(coords.lat, coords.lon, p.lat, p.lon)
            : undefined
        }))
      }

      setTopResults(addDistance(data.topResults || []))
      setHiddenGems(addDistance(data.hiddenGems || []))
      setCityImage(data.cityImage || null)
      setSearchedCity(data.city || city)
      setAppState('success')
      fetchRecentSearches()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong')
      setAppState('error')
    }
  }

  function handleRecentSearchClick(city: string) {
    handleSearch(city)
  }

  function handleSavePlace(place: PlaceResult) {
    setPlaceToSave(place)
    setShowSaveModal(true)
  }

  function isPlaceSaved(placeName: string): SavedPlace | undefined {
    return savedPlaces.find(sp => sp.name === placeName)
  }

  async function handleUnsavePlace(place: PlaceResult) {
    const saved = isPlaceSaved(place.name)
    if (!saved || !session?.access_token) return

    try {
      const response = await fetch(`/api/saved-places?id=${saved.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      if (response.ok) {
        fetchSavedPlaces()
      }
    } catch (error) {
      console.error('Failed to unsave place:', error)
    }
  }

  function handlePlaceClick(place: PlaceResult) {
    setSelectedPlace(place)
  }

  function toggleCategory(categoryId: string) {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    )
  }

  function toggleType(typeId: string) {
    setSelectedTypes(prev => {
      if (prev.includes(typeId)) {
        // Don't allow deselecting both
        if (prev.length === 1) return prev
        return prev.filter(t => t !== typeId)
      }
      return [...prev, typeId]
    })
  }

  // Merge, filter, and sort places with useMemo
  const allPlaces = useMemo(() => {
    const merged: PlaceWithType[] = [
      ...topResults.map(p => ({ ...p, type: 'top' as const })),
      ...hiddenGems.map(p => ({ ...p, type: 'gem' as const })),
    ]
    
    const filtered = merged.filter(place => {
      if (!selectedTypes.includes(place.type)) return false
      
      if (selectedCategories.length > 0) {
        const rawCat = place.rawCategories || ''
        const matchesAnyCategory = selectedCategories.some(selectedCat => {
          const filter = CATEGORY_FILTERS.find(f => f.id === selectedCat)
          return filter?.keywords.some(keyword => rawCat.includes(keyword))
        })
        if (!matchesAnyCategory) return false
      }
      
      return true
    })

    if (sortBy === 'distance') {
      return [...filtered].sort((a, b) => (a.distance || 999) - (b.distance || 999))
    }
    if (sortBy === 'name') {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    }
    return filtered
  }, [topResults, hiddenGems, selectedTypes, selectedCategories, sortBy])

  return (
    <main className="min-h-screen bg-cream-100">
      <Navigation />
      
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1558642084-fd07fae5282e?w=1920&q=80"
            alt="Travel"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-cream-100"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-4 leading-tight drop-shadow-lg">
            Discover Your Next
            <span className="italic"> Adventure</span>
          </h1>
          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto mb-10 drop-shadow">
            Uncover the best attractions and hidden gems in any city around the world.
          </p>
          
          <SearchForm onSearch={handleSearch} isLoading={appState === 'loading'} />
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <section className="mb-16">
          {appState === 'empty' && <EmptyState onCityClick={handleSearch} />}
          
          {appState === 'loading' && <LoadingState city={searchedCity} />}
          
          {appState === 'error' && (
            <ErrorState 
              message={errorMessage} 
              onRetry={() => handleSearch(searchedCity)} 
            />
          )}
          
          {appState === 'success' && (
            <div className="animate-fade-in">
              {cityImage ? (
                <div className="relative rounded-xl overflow-hidden mb-8 h-64 md:h-80">
                  <img 
                    src={cityImage.url} 
                    alt={searchedCity}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <p className="text-white/70 text-sm uppercase tracking-widest mb-1">Exploring</p>
                    <h2 className="text-3xl md:text-5xl font-serif text-white">
                      {searchedCity}
                    </h2>
                    <p className="text-white/50 text-xs mt-2">
                      Photo by {cityImage.credit} on Unsplash
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center mb-8">
                  <p className="text-stone-500 text-sm uppercase tracking-widest mb-2">Exploring</p>
                  <h2 className="text-3xl md:text-4xl font-serif text-stone-900">
                    {searchedCity}
                  </h2>
                </div>
              )}

              {/* Filter Chips */}
              <div className="mb-8">
                {/* Type Filters */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {TYPE_FILTERS.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => toggleType(filter.id)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedTypes.includes(filter.id)
                          ? 'bg-stone-900 text-white'
                          : 'bg-white text-stone-600 border border-cream-300 hover:border-stone-400'
                      }`}
                    >
                      <i className={`fa-solid ${filter.icon} text-xs`}></i>
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_FILTERS.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => toggleCategory(filter.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedCategories.includes(filter.id)
                          ? 'bg-stone-700 text-white'
                          : 'bg-cream-200 text-stone-600 hover:bg-cream-300'
                      }`}
                    >
                      <i className={`fa-solid ${filter.icon}`}></i>
                      {filter.label}
                    </button>
                  ))}
                  {selectedCategories.length > 0 && (
                    <button
                      onClick={() => setSelectedCategories([])}
                      className="text-xs text-stone-400 hover:text-stone-600 px-2"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              {/* Sort & Results Count */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-stone-500">
                  {allPlaces.length} {allPlaces.length === 1 ? 'place' : 'places'} found
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400">Sort by</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="text-sm bg-white border border-cream-300 rounded-md px-3 py-1.5 text-stone-700 focus:outline-none focus:border-stone-400"
                  >
                    <option value="default">Default</option>
                    <option value="distance">Distance</option>
                    <option value="name">Name A-Z</option>
                  </select>
                </div>
              </div>
              
              {topResults.length === 0 && hiddenGems.length === 0 ? (
                <div className="bg-cream-200 border border-cream-300 rounded-lg p-8 text-center max-w-lg mx-auto">
                  <i className="fa-solid fa-map-location-dot text-3xl text-stone-400 mb-4"></i>
                  <p className="text-stone-600">
                    We couldn't find many attractions for this location. 
                    Try searching for a larger city or check the spelling.
                  </p>
                </div>
              ) : allPlaces.length === 0 ? (
                <div className="bg-cream-200 border border-cream-300 rounded-lg p-8 text-center max-w-lg mx-auto">
                  <i className="fa-solid fa-filter text-3xl text-stone-400 mb-4"></i>
                  <p className="text-stone-600">
                    No places match your current filters. Try adjusting your selection.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {allPlaces.map((place, index) => (
                    <PlaceCard 
                      key={`${place.type}-${index}`} 
                      place={place} 
                      variant={place.type}
                      onSave={handleSavePlace}
                      onUnsave={handleUnsavePlace}
                      isSaved={!!isPlaceSaved(place.name)}
                      onClick={handlePlaceClick}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {recentSearches.length > 0 && (
          <RecentSearches 
            searches={recentSearches} 
            onSearchClick={handleRecentSearchClick}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-cream-300 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center text-stone-500 text-sm">
          <p className="font-serif text-lg text-stone-700 mb-2">Wanderlist</p>
          <p>Discover the world, one city at a time.</p>
        </div>
      </footer>

      {/* Save Place Modal */}
      <SavePlaceModal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false)
          setPlaceToSave(null)
          fetchSavedPlaces()
        }}
        place={placeToSave}
        currentCity={searchedCity}
      />

      {/* Place Detail Modal */}
      {selectedPlace && (
        <PlaceDetailModal
          place={selectedPlace}
          isOpen={!!selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onSave={handleSavePlace}
          onUnsave={handleUnsavePlace}
          isSaved={!!isPlaceSaved(selectedPlace.name)}
        />
      )}
    </main>
  )
}
