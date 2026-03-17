'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
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

function capitalizeCity(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

interface CityImage {
  url: string
  credit: string
}

// Category images for visual cards
const CATEGORY_IMAGES: Record<string, string> = {
  museum: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400&q=80',
  gallery: 'https://images.unsplash.com/photo-1577720643272-265f09367456?w=400&q=80',
  historic: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80',
  park: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&q=80',
  garden: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&q=80',
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
  cafe: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80',
  bar: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&q=80',
  market: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400&q=80',
  church: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=400&q=80',
  landmark: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80',
  default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80',
}

function getPlaceImage(place: PlaceResult): string {
  // Use real image if available from API
  if (place.imageUrl) return place.imageUrl
  
  // Fallback to category-based images
  const cat = (place.category || '').toLowerCase()
  const name = (place.name || '').toLowerCase()
  
  if (name.includes('museu') || name.includes('museum') || cat.includes('museum')) return CATEGORY_IMAGES.museum
  if (name.includes('gallery') || cat.includes('gallery') || cat.includes('art')) return CATEGORY_IMAGES.gallery
  if (name.includes('park') || name.includes('parc') || cat.includes('park')) return CATEGORY_IMAGES.park
  if (name.includes('garden') || name.includes('jardí') || cat.includes('garden')) return CATEGORY_IMAGES.garden
  if (name.includes('beach') || name.includes('platja') || cat.includes('beach')) return CATEGORY_IMAGES.beach
  if (name.includes('mercat') || name.includes('market') || cat.includes('market')) return CATEGORY_IMAGES.market
  if (name.includes('church') || name.includes('església') || name.includes('basilica') || cat.includes('church')) return CATEGORY_IMAGES.church
  if (cat.includes('cafe') || cat.includes('café')) return CATEGORY_IMAGES.cafe
  if (cat.includes('restaurant') || cat.includes('food')) return CATEGORY_IMAGES.restaurant
  if (cat.includes('bar') || cat.includes('pub')) return CATEGORY_IMAGES.bar
  if (cat.includes('historic') || cat.includes('building')) return CATEGORY_IMAGES.historic
  if (cat.includes('landmark') || cat.includes('monument')) return CATEGORY_IMAGES.landmark
  
  return CATEGORY_IMAGES.default
}

export default function Home() {
  const { user, session } = useAuth()
  const searchParams = useSearchParams()
  const [appState, setAppState] = useState<AppState>('empty')
  const [searchedCity, setSearchedCity] = useState('')
  const [cityImage, setCityImage] = useState<CityImage | null>(null)
  const [topResults, setTopResults] = useState<PlaceResult[]>([])
  const [hiddenGems, setHiddenGems] = useState<PlaceResult[]>([])
  const [recentSearches, setRecentSearches] = useState<SearchRecord[]>([])
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [placeToSave, setPlaceToSave] = useState<PlaceResult | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customPlaceName, setCustomPlaceName] = useState('')
  const [placeSuggestions, setPlaceSuggestions] = useState<Array<{name: string, address?: string, category?: string, lat?: number, lon?: number}>>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Debounced place search
  useEffect(() => {
    if (!showAddCustom || customPlaceName.length < 2) {
      setPlaceSuggestions([])
      return
    }

    setLoadingSuggestions(true)
    const debounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/place-search?q=${encodeURIComponent(customPlaceName)}&city=${encodeURIComponent(searchedCity)}`)
        const data = await res.json()
        setPlaceSuggestions(data.suggestions || [])
      } catch {
        setPlaceSuggestions([])
      }
      setLoadingSuggestions(false)
    }, 300)

    return () => clearTimeout(debounce)
  }, [customPlaceName, searchedCity, showAddCustom])

  // Combine and limit results for cleaner display
  const allPlaces = [...topResults, ...hiddenGems]

  useEffect(() => {
    fetchRecentSearches()
    
    // Check for search param in URL
    const searchQuery = searchParams.get('search')
    if (searchQuery) {
      handleSearch(searchQuery)
    }
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

      setTopResults(data.topResults || [])
      setHiddenGems(data.hiddenGems || [])
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
              {/* City Header */}
              {cityImage ? (
                <div className="relative rounded-2xl overflow-hidden mb-10 h-72 md:h-96">
                  <img 
                    src={cityImage.url} 
                    alt={searchedCity}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Exploring</p>
                    <h2 className="text-4xl md:text-6xl font-serif text-white mb-2">
                      {searchedCity}
                    </h2>
                    <p className="text-white/40 text-xs">
                      Photo by {cityImage.credit} on Unsplash
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center mb-10 py-8">
                  <p className="text-stone-400 text-xs uppercase tracking-widest mb-2">Exploring</p>
                  <h2 className="text-4xl md:text-5xl font-serif text-stone-900">
                    {searchedCity}
                  </h2>
                </div>
              )}

              {allPlaces.length === 0 ? (
                <div className="bg-cream-100 border border-cream-300 rounded-xl p-12 text-center max-w-lg mx-auto">
                  <i className="fa-solid fa-map-location-dot text-4xl text-stone-300 mb-4"></i>
                  <h3 className="font-serif text-xl text-stone-800 mb-2">No places found</h3>
                  <p className="text-stone-500 mb-6">
                    We couldn't find popular spots here, but you can add your own!
                  </p>
                  <button
                    onClick={() => setShowAddCustom(true)}
                    className="btn-primary px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
                  >
                    <i className="fa-solid fa-plus"></i>
                    Add a place you know
                  </button>
                </div>
              ) : (
                <>
                  {/* Results Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-serif text-2xl text-stone-900">Places to explore</h3>
                      <p className="text-stone-500 text-sm">{allPlaces.length} spots worth checking out</p>
                    </div>
                    <button
                      onClick={() => setShowAddCustom(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-cream-300 rounded-lg text-stone-600 hover:border-stone-400 hover:text-stone-800 transition-colors text-sm"
                    >
                      <i className="fa-solid fa-plus"></i>
                      Add your own
                    </button>
                  </div>

                  {/* Visual Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {allPlaces.map((place, index) => (
                      <div 
                        key={index}
                        onClick={() => handlePlaceClick(place)}
                        className="group cursor-pointer bg-white rounded-xl overflow-hidden border border-cream-200 hover:shadow-xl hover:border-stone-300 transition-all duration-300"
                      >
                        {/* Image */}
                        <div className="relative h-40 overflow-hidden">
                          <img 
                            src={getPlaceImage(place)} 
                            alt={place.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                          
                          {/* Save button */}
                          {user && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (isPlaceSaved(place.name)) {
                                  handleUnsavePlace(place)
                                } else {
                                  handleSavePlace(place)
                                }
                              }}
                              className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                isPlaceSaved(place.name)
                                  ? 'bg-white text-stone-900'
                                  : 'bg-black/30 text-white opacity-0 group-hover:opacity-100 hover:bg-white hover:text-stone-900'
                              }`}
                            >
                              <i className={`fa-${isPlaceSaved(place.name) ? 'solid' : 'regular'} fa-bookmark`}></i>
                            </button>
                          )}
                          
                          {/* Category pill */}
                          <div className="absolute bottom-3 left-3">
                            <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-stone-700">
                              {place.category || 'Attraction'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-4">
                          <h4 className="font-serif text-lg text-stone-900 mb-1 group-hover:text-stone-700 transition-colors line-clamp-1">
                            {place.name}
                          </h4>
                          {place.address && (
                            <p className="text-xs text-stone-400 mb-2 line-clamp-1">
                              <i className="fa-solid fa-location-dot mr-1"></i>
                              {place.address}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Custom Place Card */}
                    <button
                      onClick={() => setShowAddCustom(true)}
                      className="group cursor-pointer bg-cream-50 rounded-xl overflow-hidden border-2 border-dashed border-cream-300 hover:border-stone-400 transition-all duration-300 min-h-[240px] flex flex-col items-center justify-center gap-3"
                    >
                      <div className="w-14 h-14 rounded-full bg-cream-200 group-hover:bg-cream-300 transition-colors flex items-center justify-center">
                        <i className="fa-solid fa-plus text-xl text-stone-500"></i>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-stone-700">Know a place?</p>
                        <p className="text-sm text-stone-500">Add it to your trip</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
              
              {/* Add Custom Place Modal */}
              {showAddCustom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
                    setShowAddCustom(false)
                    setCustomPlaceName('')
                    setPlaceSuggestions([])
                  }}></div>
                  <div className="relative bg-cream-50 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
                    <button 
                      onClick={() => {
                        setShowAddCustom(false)
                        setCustomPlaceName('')
                        setPlaceSuggestions([])
                      }} 
                      className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
                    >
                      <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                    
                    <h3 className="font-serif text-2xl text-stone-900 mb-2">Add a place</h3>
                    <p className="text-stone-500 text-sm mb-6">
                      Search for a place in {searchedCity} or type your own.
                    </p>
                    
                    <div className="relative">
                      <input
                        type="text"
                        value={customPlaceName}
                        onChange={(e) => setCustomPlaceName(e.target.value)}
                        placeholder="Search for a place..."
                        className="input-field w-full px-4 py-3 rounded-lg"
                        autoFocus
                      />
                      
                      {loadingSuggestions && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <i className="fa-solid fa-circle-notch animate-spin text-stone-400"></i>
                        </div>
                      )}
                      
                      {/* Suggestions dropdown */}
                      {placeSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-cream-200 overflow-hidden z-10 max-h-64 overflow-y-auto">
                          {placeSuggestions.map((suggestion, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                const place: PlaceResult = {
                                  name: suggestion.name,
                                  address: suggestion.address,
                                  category: suggestion.category,
                                  city: searchedCity,
                                  lat: suggestion.lat,
                                  lon: suggestion.lon,
                                }
                                handleSavePlace(place)
                                setCustomPlaceName('')
                                setPlaceSuggestions([])
                                setShowAddCustom(false)
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-cream-100 transition-colors border-b border-cream-100 last:border-0"
                            >
                              <p className="font-medium text-stone-900">{suggestion.name}</p>
                              {suggestion.address && (
                                <p className="text-xs text-stone-500 truncate">{suggestion.address}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          if (customPlaceName.trim()) {
                            const customPlace: PlaceResult = {
                              name: customPlaceName.trim(),
                              city: searchedCity,
                              category: 'Custom',
                            }
                            handleSavePlace(customPlace)
                            setCustomPlaceName('')
                            setPlaceSuggestions([])
                            setShowAddCustom(false)
                          }
                        }}
                        disabled={!customPlaceName.trim()}
                        className="btn-primary w-full py-3 rounded-lg font-medium disabled:opacity-50"
                      >
                        {placeSuggestions.length > 0 ? 'Add as Custom Place' : 'Save to Trip'}
                      </button>
                      {placeSuggestions.length > 0 && (
                        <p className="text-xs text-stone-400 text-center mt-2">
                          Or click a suggestion above
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Featured Itineraries */}
        {appState === 'empty' && (
          <section className="pt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif text-stone-900">Ready-made Itineraries</h3>
              <a href="/discover" className="text-sm text-stone-500 hover:text-stone-700 transition-colors">
                See all <i className="fa-solid fa-arrow-right ml-1"></i>
              </a>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { id: 'paris', name: 'Classic Paris', duration: '4 days', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80', tag: 'Culture' },
                { id: 'bali', name: 'Bali Paradise', duration: '6 days', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80', tag: 'Beach' },
                { id: 'rome', name: 'Eternal Rome', duration: '4 days', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80', tag: 'History' },
              ].map(trip => (
                <a 
                  key={trip.id}
                  href="/discover"
                  className="group bg-white rounded-xl overflow-hidden border border-cream-300 hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[16/10] relative overflow-hidden">
                    <img 
                      src={trip.image} 
                      alt={trip.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-medium text-stone-700">
                      {trip.tag}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif text-stone-900">{trip.name}</h4>
                      <span className="text-xs text-stone-400">{trip.duration}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

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
