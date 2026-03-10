'use client'

import { PlaceResult } from '@/lib/database.types'
import { useAuth } from '@/lib/AuthContext'

interface PlaceCardProps {
  place: PlaceResult
  variant: 'top' | 'gem'
  rank?: number
  onSave?: (place: PlaceResult) => void
  onUnsave?: (place: PlaceResult) => void
  isSaved?: boolean
  onClick?: (place: PlaceResult) => void
}

function getCategoryIcon(category?: string): string {
  if (!category) return 'fa-solid fa-location-dot'
  
  const cat = category.toLowerCase()
  
  if (cat.includes('museum')) return 'fa-solid fa-building-columns'
  if (cat.includes('gallery') || cat.includes('art')) return 'fa-solid fa-palette'
  if (cat.includes('park') || cat.includes('garden')) return 'fa-solid fa-leaf'
  if (cat.includes('cafe') || cat.includes('coffee')) return 'fa-solid fa-mug-hot'
  if (cat.includes('restaurant') || cat.includes('food')) return 'fa-solid fa-utensils'
  if (cat.includes('bar') || cat.includes('pub')) return 'fa-solid fa-wine-glass'
  if (cat.includes('shop') || cat.includes('store') || cat.includes('market')) return 'fa-solid fa-bag-shopping'
  if (cat.includes('beach')) return 'fa-solid fa-umbrella-beach'
  if (cat.includes('theater') || cat.includes('cinema')) return 'fa-solid fa-masks-theater'
  if (cat.includes('church') || cat.includes('temple') || cat.includes('worship')) return 'fa-solid fa-place-of-worship'
  if (cat.includes('monument') || cat.includes('historic')) return 'fa-solid fa-monument'
  if (cat.includes('book')) return 'fa-solid fa-book'
  if (cat.includes('attraction') || cat.includes('sights')) return 'fa-solid fa-camera'
  if (cat.includes('culture')) return 'fa-solid fa-masks-theater'
  
  return 'fa-solid fa-location-dot'
}

function getCategoryColor(category?: string): string {
  if (!category) return 'bg-stone-100 text-stone-600'
  
  const cat = category.toLowerCase()
  
  if (cat.includes('museum') || cat.includes('historic') || cat.includes('monument')) return 'bg-amber-100 text-amber-700'
  if (cat.includes('gallery') || cat.includes('art') || cat.includes('culture')) return 'bg-purple-100 text-purple-700'
  if (cat.includes('park') || cat.includes('garden')) return 'bg-green-100 text-green-700'
  if (cat.includes('cafe') || cat.includes('coffee')) return 'bg-orange-100 text-orange-700'
  if (cat.includes('bar') || cat.includes('pub')) return 'bg-rose-100 text-rose-700'
  if (cat.includes('book')) return 'bg-sky-100 text-sky-700'
  if (cat.includes('market') || cat.includes('shop')) return 'bg-teal-100 text-teal-700'
  if (cat.includes('attraction') || cat.includes('sights')) return 'bg-blue-100 text-blue-700'
  
  return 'bg-stone-100 text-stone-600'
}

function getDescription(place: PlaceResult): string {
  if (place.description) return place.description
  
  const cat = place.category?.toLowerCase() || ''
  const city = place.city || 'the area'
  
  if (cat.includes('museum')) return `Explore fascinating exhibits and collections at this museum in ${city}. A must-visit for culture enthusiasts.`
  if (cat.includes('gallery') || cat.includes('art')) return `Discover inspiring artwork and creative exhibitions at this cultural gem in ${city}.`
  if (cat.includes('historic') || cat.includes('building') || cat.includes('monument')) return `Step back in time at this historic landmark in ${city}. Rich with heritage and architectural beauty.`
  if (cat.includes('park') || cat.includes('garden')) return `Escape to this peaceful green space in ${city}. Perfect for a relaxing stroll or picnic.`
  if (cat.includes('cafe')) return `A charming café in ${city} where locals gather. Great atmosphere and quality drinks.`
  if (cat.includes('bar')) return `Experience the local nightlife at this popular spot in ${city}. Great drinks and good vibes.`
  if (cat.includes('book')) return `A haven for book lovers in ${city}. Browse shelves of literary treasures.`
  if (cat.includes('market')) return `Immerse yourself in local culture at this vibrant market in ${city}. Browse unique finds and local goods.`
  if (cat.includes('attraction') || cat.includes('sights')) return `One of ${city}'s notable attractions, drawing visitors with its unique character and appeal.`
  if (cat.includes('culture')) return `Immerse yourself in local culture and artistic expression in ${city}.`
  
  return `A noteworthy destination in ${city} that's worth exploring.`
}

export default function PlaceCard({ place, variant, rank, onSave, onUnsave, isSaved, onClick }: PlaceCardProps) {
  const { user } = useAuth()

  const handleCardClick = () => {
    if (onClick) onClick(place)
  }

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isSaved && onUnsave) {
      onUnsave(place)
    } else if (onSave) {
      onSave(place)
    }
  }

  const categoryColor = getCategoryColor(place.category)
  const description = getDescription(place)

  return (
    <div 
      className="bg-white border border-cream-300 rounded-xl hover:shadow-lg hover:border-stone-300 transition-all duration-200 cursor-pointer group relative"
      onClick={handleCardClick}
    >
      {/* Bookmark button */}
      {user && (onSave || onUnsave) && (
        <button
          onClick={handleBookmarkClick}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 ${
            isSaved 
              ? 'bg-stone-900 text-white' 
              : 'bg-white/80 text-stone-400 opacity-0 group-hover:opacity-100 hover:bg-stone-900 hover:text-white shadow-sm'
          }`}
          title={isSaved ? "Remove from trip" : "Save to trip"}
        >
          <i className="fa-solid fa-bookmark text-sm"></i>
        </button>
      )}

      <div className="p-4">
        {/* Type Badge */}
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded ${
            variant === 'top' 
              ? 'bg-amber-100 text-amber-700' 
              : 'bg-purple-100 text-purple-700'
          }`}>
            <i className={`fa-solid ${variant === 'top' ? 'fa-star' : 'fa-gem'}`}></i>
            {variant === 'top' ? 'Top Pick' : 'Hidden Gem'}
          </span>
        </div>

        {/* Header with icon and name */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`flex-shrink-0 w-9 h-9 rounded-full ${categoryColor} flex items-center justify-center`}>
            <i className={`${getCategoryIcon(place.category)}`}></i>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-serif text-lg text-stone-900 leading-tight mb-1 group-hover:text-stone-700 transition-colors">
              {place.name}
            </h4>
            {place.category && (
              <span className="text-xs text-stone-400">
                {place.category}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-stone-600 leading-relaxed mb-3 line-clamp-2">
          {description}
        </p>

        {/* Footer with address and distance */}
        <div className="flex items-center justify-between text-xs text-stone-400">
          {place.address && (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <i className="fa-solid fa-location-dot flex-shrink-0"></i>
              <span className="truncate">{place.address}</span>
            </div>
          )}
          {place.distance !== undefined && (
            <span className="flex-shrink-0 ml-2 bg-cream-100 px-2 py-0.5 rounded text-stone-500">
              {place.distance < 1 
                ? `${Math.round(place.distance * 1000)}m` 
                : `${place.distance.toFixed(1)}km`}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
