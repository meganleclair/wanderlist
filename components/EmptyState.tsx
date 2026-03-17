'use client'

import { useState, useEffect } from 'react'

interface EmptyStateProps {
  onCityClick?: (city: string) => void
}

const FEATURED_DESTINATIONS = [
  { 
    city: 'Paris', 
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
    tagline: 'The City of Light'
  },
  { 
    city: 'Tokyo', 
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
    tagline: 'Where tradition meets future'
  },
  { 
    city: 'New York', 
    country: 'USA',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80',
    tagline: 'The city that never sleeps'
  },
  { 
    city: 'Barcelona', 
    country: 'Spain',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
    tagline: 'Art, beach & tapas'
  },
]

const SEASONAL_PICKS = {
  spring: [
    { city: 'Tokyo', reason: 'Cherry blossom season', image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&q=80' },
    { city: 'Amsterdam', reason: 'Tulip gardens bloom', image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&q=80' },
    { city: 'Washington DC', reason: 'Cherry blossoms', image: 'https://images.unsplash.com/photo-1617581629397-a72507c3de9e?w=400&q=80' },
  ],
  summer: [
    { city: 'Barcelona', reason: 'Beach & nightlife', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80' },
    { city: 'Santorini', reason: 'Perfect weather', image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=400&q=80' },
    { city: 'Reykjavik', reason: 'Midnight sun', image: 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=400&q=80' },
  ],
  fall: [
    { city: 'New York', reason: 'Fall foliage', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&q=80' },
    { city: 'Munich', reason: 'Oktoberfest', image: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=400&q=80' },
    { city: 'Kyoto', reason: 'Autumn leaves', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80' },
  ],
  winter: [
    { city: 'Vienna', reason: 'Christmas markets', image: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=400&q=80' },
    { city: 'Zurich', reason: 'Alpine skiing', image: 'https://images.unsplash.com/photo-1544989164-31dc3c645987?w=400&q=80' },
    { city: 'Sydney', reason: 'Summer escape', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80' },
  ],
}


const VIBES = [
  {
    id: 'beach',
    label: 'Beach & Chill',
    icon: 'fa-umbrella-beach',
    cities: ['Bali', 'Cancun', 'Maldives', 'Phuket', 'Miami', 'Honolulu', 'Cabo San Lucas', 'Tulum']
  },
  {
    id: 'mediterranean',
    label: 'Mediterranean',
    icon: 'fa-sun',
    cities: ['Santorini', 'Amalfi', 'Barcelona', 'Nice', 'Dubrovnik', 'Mykonos', 'Ibiza', 'Malta']
  },
  {
    id: 'history',
    label: 'History & Culture',
    icon: 'fa-landmark',
    cities: ['Rome', 'Athens', 'Cairo', 'Jerusalem', 'Petra', 'Machu Picchu', 'Angkor Wat', 'Istanbul']
  },
  {
    id: 'adventure',
    label: 'Adventure',
    icon: 'fa-mountain',
    cities: ['Queenstown', 'Interlaken', 'Reykjavik', 'Patagonia', 'Cape Town', 'Nepal', 'Costa Rica', 'Norway']
  },
  {
    id: 'city',
    label: 'Big City Energy',
    icon: 'fa-city',
    cities: ['New York', 'Tokyo', 'London', 'Hong Kong', 'Singapore', 'Dubai', 'Los Angeles', 'Shanghai']
  },
  {
    id: 'romantic',
    label: 'Romance',
    icon: 'fa-heart',
    cities: ['Paris', 'Venice', 'Santorini', 'Maldives', 'Florence', 'Vienna', 'Prague', 'Bruges']
  },
  {
    id: 'foodie',
    label: 'Foodie Paradise',
    icon: 'fa-utensils',
    cities: ['Tokyo', 'Bangkok', 'Mexico City', 'Bologna', 'Lyon', 'San Sebastian', 'Marrakech', 'Lima']
  },
  {
    id: 'party',
    label: 'Nightlife',
    icon: 'fa-champagne-glasses',
    cities: ['Ibiza', 'Las Vegas', 'Berlin', 'Amsterdam', 'Miami', 'Bangkok', 'Rio de Janeiro', 'Tel Aviv']
  },
]

function getSeason(): keyof typeof SEASONAL_PICKS {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'fall'
  return 'winter'
}

export default function EmptyState({ onCityClick }: EmptyStateProps) {
  const [mounted, setMounted] = useState(false)
  const [vibeResult, setVibeResult] = useState<{ vibe: string; city: string } | null>(null)
  const season = getSeason()
  const seasonalPicks = SEASONAL_PICKS[season]

  useEffect(() => {
    setMounted(true)
  }, [])

  function handleVibeClick(vibe: typeof VIBES[0]) {
    const randomCity = vibe.cities[Math.floor(Math.random() * vibe.cities.length)]
    setVibeResult({ vibe: vibe.label, city: randomCity })
    setTimeout(() => {
      onCityClick?.(randomCity)
      setVibeResult(null)
    }, 1500)
  }

  if (!mounted) return null

  return (
    <div className="py-4 max-w-5xl mx-auto">
      {/* Vibe Result Overlay */}
      {vibeResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="text-center animate-fade-in-up">
            <p className="text-white/70 text-sm uppercase tracking-widest mb-2">You're going to...</p>
            <h2 className="text-5xl md:text-7xl font-serif text-white mb-4">{vibeResult.city}</h2>
            <p className="text-white/50 text-sm">Get ready for {vibeResult.vibe.toLowerCase()}</p>
          </div>
        </div>
      )}

      {/* Trip Quiz CTA */}
      <div className="mb-12">
        <a 
          href="/quiz"
          className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-teal-500 text-white text-xs font-bold px-2 py-1 rounded">NEW</span>
                <span className="text-teal-700 text-sm font-medium">Trip Quiz</span>
              </div>
              <h3 className="font-serif text-2xl text-stone-900 mb-1">Plan my perfect trip</h3>
              <p className="text-stone-500">Answer 5 questions and get a personalized itinerary</p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                <i className="fa-solid fa-wand-magic-sparkles text-teal-500 text-xl"></i>
              </div>
              <i className="fa-solid fa-arrow-right text-stone-400"></i>
            </div>
          </div>
        </a>
      </div>

      {/* Pick Your Vibe - Quick Random Pick */}
      <div className="mb-12">
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Feeling adventurous?</p>
          <h2 className="font-serif text-2xl text-stone-900">Surprise Me</h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {VIBES.map((vibe) => (
            <button
              key={vibe.id}
              onClick={() => handleVibeClick(vibe)}
              className="group relative h-24 rounded-xl overflow-hidden bg-white border border-cream-300 hover:border-stone-400 hover:shadow-md transition-all"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-cream-200 group-hover:bg-stone-900 flex items-center justify-center mb-2 transition-colors">
                  <i className={`fa-solid ${vibe.icon} text-stone-500 group-hover:text-white transition-colors`}></i>
                </div>
                <span className="text-sm font-medium text-stone-700">{vibe.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Featured Destinations */}
      <div className="mb-12">
        <p className="text-xs uppercase tracking-widest text-stone-400 text-center mb-6">Popular Destinations</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURED_DESTINATIONS.map((dest) => (
            <button
              key={dest.city}
              onClick={() => onCityClick?.(dest.city)}
              className="group relative aspect-[4/5] rounded-xl overflow-hidden"
            >
              <img 
                src={dest.image} 
                alt={dest.city}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                <h3 className="font-serif text-xl text-white mb-0.5">{dest.city}</h3>
                <p className="text-white/70 text-xs">{dest.tagline}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Seasonal Picks */}
      <div className="mb-12">
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Best for {season}</p>
          <h2 className="font-serif text-2xl text-stone-900">Seasonal Picks</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {seasonalPicks.map((pick) => (
            <button
              key={pick.city}
              onClick={() => onCityClick?.(pick.city)}
              className="group relative h-48 rounded-xl overflow-hidden"
            >
              <img 
                src={pick.image} 
                alt={pick.city}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                <h3 className="font-serif text-lg text-white">{pick.city}</h3>
                <p className="text-white/70 text-sm">{pick.reason}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
