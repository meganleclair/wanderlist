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

function getCategoryIcon(category?: string, name?: string): string {
  if (!category) return 'fa-solid fa-location-dot'
  
  const cat = category.toLowerCase()
  const placeName = (name || '').toLowerCase()
  
  // Check the place name for clues too
  if (placeName.includes('museu') || placeName.includes('museum')) return 'fa-solid fa-building-columns'
  if (placeName.includes('llibreria') || placeName.includes('library') || placeName.includes('book')) return 'fa-solid fa-book'
  if (placeName.includes('teatre') || placeName.includes('theater') || placeName.includes('theatre')) return 'fa-solid fa-masks-theater'
  
  // Museums & Culture
  if (cat.includes('museum')) return 'fa-solid fa-building-columns'
  if (cat.includes('gallery')) return 'fa-solid fa-palette'
  if (cat.includes('art')) return 'fa-solid fa-palette'
  if (cat.includes('theatre') || cat.includes('theater')) return 'fa-solid fa-masks-theater'
  if (cat.includes('culture')) return 'fa-solid fa-masks-theater'
  if (cat.includes('entertainment')) return 'fa-solid fa-masks-theater'
  
  // Historic Sites
  if (cat.includes('historic')) return 'fa-solid fa-landmark'
  if (cat.includes('castle')) return 'fa-solid fa-chess-rook'
  if (cat.includes('palace')) return 'fa-solid fa-chess-rook'
  if (cat.includes('monument')) return 'fa-solid fa-monument'
  if (cat.includes('ruins') || cat.includes('ancient')) return 'fa-solid fa-archway'
  if (cat.includes('church') || cat.includes('cathedral')) return 'fa-solid fa-church'
  if (cat.includes('temple') || cat.includes('mosque') || cat.includes('synagogue')) return 'fa-solid fa-place-of-worship'
  if (cat.includes('building')) return 'fa-solid fa-landmark'
  
  // Nature
  if (cat.includes('park')) return 'fa-solid fa-tree'
  if (cat.includes('garden') || cat.includes('botanical')) return 'fa-solid fa-leaf'
  if (cat.includes('forest') || cat.includes('nature')) return 'fa-solid fa-tree'
  if (cat.includes('beach')) return 'fa-solid fa-umbrella-beach'
  if (cat.includes('waterfront') || cat.includes('marina') || cat.includes('pier')) return 'fa-solid fa-water'
  
  // Food & Drink
  if (cat.includes('cafe') || cat.includes('café') || cat.includes('coffee')) return 'fa-solid fa-mug-hot'
  if (cat.includes('restaurant') || cat.includes('food')) return 'fa-solid fa-utensils'
  if (cat.includes('bar') || cat.includes('pub') || cat.includes('nightlife')) return 'fa-solid fa-wine-glass'
  if (cat.includes('bakery')) return 'fa-solid fa-bread-slice'
  
  // Shopping & Commercial
  if (cat.includes('commercial')) return 'fa-solid fa-bag-shopping'
  if (cat.includes('market')) return 'fa-solid fa-store'
  if (cat.includes('shop') || cat.includes('store') || cat.includes('boutique')) return 'fa-solid fa-bag-shopping'
  if (cat.includes('mall')) return 'fa-solid fa-cart-shopping'
  
  // Entertainment
  if (cat.includes('cinema') || cat.includes('movie')) return 'fa-solid fa-film'
  if (cat.includes('zoo')) return 'fa-solid fa-paw'
  if (cat.includes('aquarium')) return 'fa-solid fa-fish'
  if (cat.includes('amusement') || cat.includes('theme')) return 'fa-solid fa-ticket'
  
  // Other
  if (cat.includes('book')) return 'fa-solid fa-book'
  if (cat.includes('attraction') || cat.includes('sights') || cat.includes('tourist')) return 'fa-solid fa-camera'
  if (cat.includes('landmark')) return 'fa-solid fa-landmark'
  
  return 'fa-solid fa-map-pin'
}

function getCategoryColor(category?: string, name?: string): string {
  if (!category) return 'bg-stone-100 text-stone-600'
  
  const cat = category.toLowerCase()
  const placeName = (name || '').toLowerCase()
  
  // Check place name for clues
  if (placeName.includes('museu') || placeName.includes('museum')) return 'bg-blue-100 text-blue-700'
  if (placeName.includes('llibreria') || placeName.includes('library') || placeName.includes('book')) return 'bg-amber-100 text-amber-700'
  
  // Museums & Culture
  if (cat.includes('museum')) return 'bg-blue-100 text-blue-700'
  if (cat.includes('gallery') || cat.includes('art')) return 'bg-purple-100 text-purple-700'
  if (cat.includes('theatre') || cat.includes('theater') || cat.includes('culture')) return 'bg-purple-100 text-purple-700'
  if (cat.includes('entertainment')) return 'bg-purple-100 text-purple-700'
  
  // Historic
  if (cat.includes('historic') || cat.includes('building') || cat.includes('landmark')) return 'bg-amber-100 text-amber-700'
  if (cat.includes('castle') || cat.includes('palace') || cat.includes('monument')) return 'bg-stone-200 text-stone-700'
  if (cat.includes('church') || cat.includes('cathedral') || cat.includes('temple')) return 'bg-stone-200 text-stone-700'
  
  // Nature
  if (cat.includes('park') || cat.includes('garden') || cat.includes('nature') || cat.includes('forest')) return 'bg-green-100 text-green-700'
  if (cat.includes('beach') || cat.includes('waterfront') || cat.includes('marina')) return 'bg-cyan-100 text-cyan-700'
  
  // Food & Drink  
  if (cat.includes('cafe') || cat.includes('café') || cat.includes('coffee') || cat.includes('bakery')) return 'bg-orange-100 text-orange-700'
  if (cat.includes('restaurant') || cat.includes('food')) return 'bg-orange-100 text-orange-700'
  if (cat.includes('bar') || cat.includes('pub') || cat.includes('nightlife')) return 'bg-rose-100 text-rose-700'
  
  // Shopping & Commercial
  if (cat.includes('commercial')) return 'bg-pink-100 text-pink-700'
  if (cat.includes('market') || cat.includes('shop') || cat.includes('store') || cat.includes('mall')) return 'bg-pink-100 text-pink-700'
  
  // Entertainment
  if (cat.includes('zoo') || cat.includes('aquarium')) return 'bg-purple-100 text-purple-700'
  if (cat.includes('cinema') || cat.includes('movie')) return 'bg-indigo-100 text-indigo-700'
  
  // Other
  if (cat.includes('book')) return 'bg-amber-100 text-amber-700'
  if (cat.includes('attraction') || cat.includes('sights') || cat.includes('tourist')) return 'bg-blue-100 text-blue-700'
  
  return 'bg-stone-100 text-stone-600'
}

function getDescription(place: PlaceResult): string {
  if (place.description) return place.description
  
  const cat = place.category?.toLowerCase() || ''
  const city = place.city || 'the area'
  const name = place.name || ''
  const nameLower = name.toLowerCase()
  
  // Check place name for better descriptions
  if (nameLower.includes('museu') || nameLower.includes('museum')) {
    return `Explore the collections and exhibits at ${name}. A cultural highlight worth visiting.`
  }
  if (nameLower.includes('llibreria') || nameLower.includes('library') || nameLower.includes('book')) {
    return `Browse the shelves at this beloved bookshop. A haven for readers and literary explorers.`
  }
  if (nameLower.includes('teatre') || nameLower.includes('theater') || nameLower.includes('theatre')) {
    return `Experience performing arts at this venue. Check their schedule for shows and events.`
  }
  if (nameLower.includes('mercat') || nameLower.includes('market')) {
    return `Wander through the stalls and soak in the atmosphere. Fresh produce, local goods, and authentic flavors.`
  }
  if (nameLower.includes('parc') || nameLower.includes('park') || nameLower.includes('jardí') || nameLower.includes('garden')) {
    return `A green oasis perfect for a leisurely stroll. Enjoy the fresh air and beautiful surroundings.`
  }
  if (nameLower.includes('platja') || nameLower.includes('beach')) {
    return `Relax by the water and enjoy the coastal scenery. Great for a sunny day out.`
  }
  if (nameLower.includes('basilica') || nameLower.includes('cathedral') || nameLower.includes('church') || nameLower.includes('església')) {
    return `Admire the stunning architecture and peaceful atmosphere of this sacred space.`
  }
  
  // Fallback to category-based descriptions
  if (cat.includes('museum')) return `Explore the exhibits and collections here. A great spot for curious minds.`
  if (cat.includes('gallery') || cat.includes('art')) return `Discover artwork and creative exhibitions. Worth a visit for art enthusiasts.`
  if (cat.includes('historic') || cat.includes('building')) return `A historic landmark with architectural charm and stories to tell.`
  if (cat.includes('entertainment')) return `A cultural venue offering entertainment and artistic experiences.`
  if (cat.includes('park') || cat.includes('garden')) return `A peaceful green space to unwind. Perfect for a stroll or afternoon rest.`
  if (cat.includes('beach')) return `Soak up the sun and enjoy the waterfront views.`
  if (cat.includes('cafe') || cat.includes('café')) return `A cozy spot to grab a coffee and watch the world go by.`
  if (cat.includes('restaurant') || cat.includes('food')) return `Enjoy local flavors and good food in a welcoming setting.`
  if (cat.includes('bar') || cat.includes('pub')) return `A lively spot for drinks and socializing. Popular with locals.`
  if (cat.includes('commercial') || cat.includes('shop')) return `Browse unique finds and local goods at this popular spot.`
  if (cat.includes('market')) return `A bustling marketplace with local vendors and authentic products.`
  if (cat.includes('church') || cat.includes('cathedral') || cat.includes('temple')) return `A place of worship with beautiful architecture and serene atmosphere.`
  if (cat.includes('castle') || cat.includes('palace')) return `Step into history at this impressive landmark.`
  if (cat.includes('monument')) return `A significant monument marking an important part of local history.`
  if (cat.includes('attraction') || cat.includes('sights')) return `A popular destination that draws visitors from near and far.`
  if (cat.includes('culture')) return `Experience local culture and artistic expression.`
  
  return `A local favorite worth checking out while you're in ${city}.`
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

  const categoryColor = getCategoryColor(place.category, place.name)
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

      <div className="p-5">
        {/* Header with icon and name */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${categoryColor} flex items-center justify-center`}>
            <i className={`${getCategoryIcon(place.category, place.name)} text-sm`}></i>
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

        {/* Address */}
        {place.address && (
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <i className="fa-solid fa-location-dot flex-shrink-0"></i>
            <span className="truncate">{place.address}</span>
          </div>
        )}
      </div>
    </div>
  )
}
