'use client'

import { PlaceResult } from '@/lib/database.types'
import { useAuth } from '@/lib/AuthContext'

interface PlaceDetailModalProps {
  place: PlaceResult
  isOpen: boolean
  onClose: () => void
  onSave?: (place: PlaceResult) => void
  onUnsave?: (place: PlaceResult) => void
  isSaved?: boolean
}

function getDescription(place: PlaceResult): string {
  if (place.description) return place.description
  
  const cat = place.category?.toLowerCase() || ''
  const city = place.city || 'the area'
  
  if (cat.includes('museum')) {
    return `Explore fascinating exhibits and collections at this museum in ${city}. A must-visit destination for culture enthusiasts and curious travelers alike.`
  }
  if (cat.includes('gallery') || cat.includes('art')) {
    return `Discover inspiring artwork and creative exhibitions at this cultural gem in ${city}. Perfect for art lovers and those seeking creative inspiration.`
  }
  if (cat.includes('historic') || cat.includes('building') || cat.includes('monument')) {
    return `Step back in time at this historic landmark in ${city}. Rich with heritage and architectural beauty, it offers a glimpse into the region's past.`
  }
  if (cat.includes('park') || cat.includes('garden')) {
    return `Escape to this peaceful green space in ${city}. Ideal for a relaxing stroll, a picnic, or simply enjoying nature in the heart of the city.`
  }
  if (cat.includes('cafe') || cat.includes('coffee')) {
    return `A charming café in ${city} where locals gather. Stop by to savor quality drinks and soak in the authentic neighborhood atmosphere.`
  }
  if (cat.includes('bar') || cat.includes('pub')) {
    return `Experience the local nightlife at this popular spot in ${city}. Great drinks, good vibes, and a chance to mingle with locals and fellow travelers.`
  }
  if (cat.includes('restaurant') || cat.includes('food')) {
    return `Taste the flavors of ${city} at this dining destination. From local specialties to creative cuisine, it's a treat for your taste buds.`
  }
  if (cat.includes('book') || cat.includes('library')) {
    return `A haven for book lovers in ${city}. Browse through shelves of literary treasures and find your next great read.`
  }
  if (cat.includes('market')) {
    return `Immerse yourself in local culture at this vibrant market in ${city}. Browse unique finds, taste local treats, and experience everyday life.`
  }
  if (cat.includes('church') || cat.includes('temple') || cat.includes('worship')) {
    return `A place of spiritual significance and architectural beauty in ${city}. Visitors are welcome to admire the peaceful atmosphere and stunning design.`
  }
  if (cat.includes('theater') || cat.includes('cinema')) {
    return `Catch a show or performance at this entertainment venue in ${city}. A great way to experience local arts and culture.`
  }
  if (cat.includes('attraction') || cat.includes('sights')) {
    return `One of ${city}'s notable attractions, drawing visitors with its unique character and appeal. Worth adding to your itinerary.`
  }
  
  return `A noteworthy destination in ${city} that's worth exploring. Discover what makes this place special and create your own memorable experience.`
}

export default function PlaceDetailModal({ place, isOpen, onClose, onSave, onUnsave, isSaved }: PlaceDetailModalProps) {
  const { user } = useAuth()

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleBookmarkClick = () => {
    if (isSaved && onUnsave) {
      onUnsave(place)
      onClose()
    } else if (onSave) {
      onSave(place)
      onClose()
    }
  }

  const googleMapsUrl = place.lat && place.lon
    ? `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`
    : place.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`
    : null

  const description = getDescription(place)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-cream-200 text-stone-600 flex items-center justify-center hover:bg-cream-300 transition-colors z-10"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="p-6 pt-8">
          <h2 className="font-serif text-2xl text-stone-900 mb-1 pr-8">{place.name}</h2>
          {place.category && (
            <p className="text-xs uppercase tracking-wider text-stone-400 mb-5">
              {place.category}
            </p>
          )}

          <p className="text-stone-600 leading-relaxed mb-6">{description}</p>

          {place.address && (
            <div className="flex items-start gap-3 text-sm mb-6 p-4 bg-cream-100 rounded-xl">
              <i className="fa-solid fa-location-dot text-stone-400 mt-0.5"></i>
              <span className="text-stone-600">{place.address}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3.5 px-4 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors"
              >
                <i className="fa-solid fa-map-location-dot"></i>
                <span>View Map</span>
              </a>
            )}

            {user && (onSave || onUnsave) ? (
              <button
                onClick={handleBookmarkClick}
                className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-medium transition-colors ${
                  isSaved 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-cream-200 text-stone-700 hover:bg-cream-300'
                }`}
              >
                <i className={`fa-solid ${isSaved ? 'fa-trash-can' : 'fa-bookmark'}`}></i>
                <span>{isSaved ? 'Remove' : 'Save'}</span>
              </button>
            ) : !googleMapsUrl ? null : (
              <div></div>
            )}

            {place.website && (
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 flex items-center justify-center gap-2 py-3.5 px-4 border border-stone-200 text-stone-600 rounded-xl font-medium hover:bg-stone-50 transition-colors"
              >
                <i className="fa-solid fa-globe"></i>
                <span>Visit Website</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
