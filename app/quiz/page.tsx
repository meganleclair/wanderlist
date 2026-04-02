'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import Navigation from '@/components/Navigation'
import AuthModal from '@/components/AuthModal'
import { getCuratedPriceFromUsd } from '@/lib/curated-itinerary-prices'
import { formatEstimatedBudgetUsd } from '@/lib/trip-pricing'

interface Question {
  id: string
  question: string
  options: {
    label: string
    icon: string
    tags: string[]
  }[]
}

const QUESTIONS: Question[] = [
  {
    id: 'vibe',
    question: "What's your travel vibe?",
    options: [
      { label: 'Adventure & Exploration', icon: 'fa-compass', tags: ['Adventure', 'Nature'] },
      { label: 'Culture & History', icon: 'fa-landmark', tags: ['Culture', 'History', 'Art'] },
      { label: 'Relaxation & Beaches', icon: 'fa-umbrella-beach', tags: ['Beach', 'Wellness'] },
      { label: 'Food & Nightlife', icon: 'fa-utensils', tags: ['Food', 'Modern'] },
      { label: 'Romance & Charm', icon: 'fa-heart', tags: ['Romance'] },
    ]
  },
  {
    id: 'duration',
    question: 'How long do you want to travel?',
    options: [
      { label: 'Quick escape (4-5 days)', icon: 'fa-bolt', tags: ['short'] },
      { label: 'About a week (6-7 days)', icon: 'fa-calendar-week', tags: ['medium'] },
      { label: 'Extended trip (10-14 days)', icon: 'fa-calendar', tags: ['long'] },
    ]
  },
  {
    id: 'scope',
    question: 'How do you like to explore?',
    options: [
      { label: 'One city, deep dive', icon: 'fa-city', tags: ['City'] },
      { label: 'One country, multiple cities', icon: 'fa-flag', tags: ['Country'] },
      { label: 'Multiple countries, big adventure', icon: 'fa-globe', tags: ['Region'] },
    ]
  },
  {
    id: 'landscape',
    question: 'What landscape calls to you?',
    options: [
      { label: 'Beaches & coastlines', icon: 'fa-water', tags: ['Beach'] },
      { label: 'Mountains & nature', icon: 'fa-mountain', tags: ['Nature'] },
      { label: 'Historic cities & architecture', icon: 'fa-building-columns', tags: ['History', 'Architecture'] },
      { label: 'A mix of everything', icon: 'fa-shuffle', tags: [] },
    ]
  },
  {
    id: 'pace',
    question: 'What\'s your ideal pace?',
    options: [
      { label: 'Pack it all in!', icon: 'fa-fire', tags: ['Adventure', 'Culture'] },
      { label: 'Balanced - activities + downtime', icon: 'fa-scale-balanced', tags: [] },
      { label: 'Slow & relaxed', icon: 'fa-spa', tags: ['Wellness', 'Beach', 'Romance'] },
    ]
  },
]

interface Itinerary {
  id: string
  name: string
  description: string
  duration: string
  image: string
  tags: string[]
  cities: string[]
  durationDays: number
}

const ITINERARIES: Itinerary[] = [
  { id: 'paris-classic', name: 'Classic Paris', description: 'Iconic landmarks, world-class museums, and charming neighborhoods.', duration: '4 days', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80', tags: ['Culture', 'Romance', 'Art'], cities: ['Paris'], durationDays: 4 },
  { id: 'tokyo-adventure', name: 'Tokyo Explorer', description: 'Ancient temples to neon-lit streets in Japan\'s capital.', duration: '5 days', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80', tags: ['Culture', 'Food', 'Modern'], cities: ['Tokyo'], durationDays: 5 },
  { id: 'barcelona-sun', name: 'Barcelona Highlights', description: 'Gaudí masterpieces, Mediterranean beaches, and vibrant culture.', duration: '4 days', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80', tags: ['Architecture', 'Beach', 'Food'], cities: ['Barcelona'], durationDays: 4 },
  { id: 'rome-history', name: 'Eternal Rome', description: 'Walk through millennia of history in the ancient Roman heart.', duration: '4 days', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80', tags: ['History', 'Food', 'Art'], cities: ['Rome'], durationDays: 4 },
  { id: 'bali-escape', name: 'Bali Paradise', description: 'Temples, rice terraces, and pristine beaches.', duration: '6 days', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80', tags: ['Nature', 'Wellness', 'Beach'], cities: ['Ubud', 'Seminyak', 'Uluwatu'], durationDays: 6 },
  { id: 'nyc-first-timer', name: 'New York Essentials', description: 'The Big Apple\'s must-sees and incredible food.', duration: '5 days', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80', tags: ['Culture', 'Food', 'Shopping'], cities: ['New York'], durationDays: 5 },
  { id: 'greece-islands', name: 'Greek Island Hopping', description: 'Sun-soaked islands and the bluest Mediterranean waters.', duration: '7 days', image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&q=80', tags: ['Beach', 'History', 'Romance'], cities: ['Athens', 'Santorini', 'Mykonos'], durationDays: 7 },
  { id: 'amalfi-coast', name: 'Amalfi Coast Dream', description: 'Cliffside villages and crystal-clear waters.', duration: '4 days', image: 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=600&q=80', tags: ['Beach', 'Romance', 'Food'], cities: ['Positano', 'Amalfi', 'Ravello'], durationDays: 4 },
  { id: 'japan-grand-tour', name: 'Japan Grand Tour', description: 'From Tokyo to Kyoto - the full Japanese experience.', duration: '14 days', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80', tags: ['Country', 'Culture', 'Food'], cities: ['Tokyo', 'Kyoto', 'Osaka', 'Hiroshima'], durationDays: 14 },
  { id: 'portugal-complete', name: 'Best of Portugal', description: 'Lisbon\'s streets to Porto\'s wine cellars and the Algarve coast.', duration: '10 days', image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&q=80', tags: ['Country', 'Beach', 'Food'], cities: ['Lisbon', 'Porto', 'Algarve'], durationDays: 10 },
  { id: 'vietnam-journey', name: 'Vietnam North to South', description: 'From Hanoi to the Mekong Delta with stunning landscapes.', duration: '14 days', image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80', tags: ['Country', 'Culture', 'Adventure'], cities: ['Hanoi', 'Ha Long Bay', 'Hoi An', 'Ho Chi Minh City'], durationDays: 14 },
  { id: 'balkans-adventure', name: 'Balkans Adventure', description: 'Croatia\'s coast, Montenegro\'s fjords, and Slovenia\'s alps.', duration: '14 days', image: 'https://images.unsplash.com/photo-1555990793-da11153b2473?w=600&q=80', tags: ['Region', 'Adventure', 'Beach'], cities: ['Dubrovnik', 'Kotor', 'Ljubljana'], durationDays: 14 },
  { id: 'southeast-asia', name: 'Southeast Asia Explorer', description: 'Thai temples, Vietnamese cuisine, Cambodia\'s wonders.', duration: '14 days', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80', tags: ['Region', 'Culture', 'Adventure'], cities: ['Bangkok', 'Siem Reap', 'Hanoi'], durationDays: 14 },
  { id: 'scandinavia-road-trip', name: 'Scandinavia Road Trip', description: 'Norway\'s fjords, Sweden\'s design, Denmark\'s hygge.', duration: '12 days', image: 'https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?w=600&q=80', tags: ['Region', 'Nature', 'Modern'], cities: ['Copenhagen', 'Stockholm', 'Oslo', 'Bergen'], durationDays: 12 },
]

// Place data for the detail modal
const ITINERARY_PLACES: Record<string, Array<{name: string, category: string, day_number: number}>> = {
  'paris-classic': [
    { name: 'Eiffel Tower', category: 'Landmark', day_number: 1 },
    { name: 'Louvre Museum', category: 'Museum', day_number: 1 },
    { name: 'Notre-Dame', category: 'Historic', day_number: 2 },
    { name: 'Montmartre', category: 'Neighborhood', day_number: 2 },
    { name: 'Musée d\'Orsay', category: 'Museum', day_number: 3 },
    { name: 'Luxembourg Gardens', category: 'Park', day_number: 3 },
    { name: 'Champs-Élysées', category: 'Shopping', day_number: 4 },
    { name: 'Arc de Triomphe', category: 'Landmark', day_number: 4 },
  ],
  'tokyo-adventure': [
    { name: 'Senso-ji Temple', category: 'Temple', day_number: 1 },
    { name: 'Tokyo Skytree', category: 'Landmark', day_number: 1 },
    { name: 'Shibuya Crossing', category: 'Landmark', day_number: 2 },
    { name: 'Meiji Shrine', category: 'Temple', day_number: 2 },
    { name: 'Harajuku', category: 'Neighborhood', day_number: 3 },
    { name: 'Tsukiji Market', category: 'Food', day_number: 3 },
    { name: 'Akihabara', category: 'Entertainment', day_number: 4 },
    { name: 'Shinjuku Gyoen', category: 'Park', day_number: 5 },
  ],
}

export default function QuizPage() {
  const router = useRouter()
  const { user, session } = useAuth()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<Itinerary[]>([])
  const [viewingItinerary, setViewingItinerary] = useState<Itinerary | null>(null)
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const pendingCopyRef = useRef<Itinerary | null>(null)

  function selectOption(questionId: string, tags: string[]) {
    const newAnswers = { ...answers, [questionId]: tags }
    setAnswers(newAnswers)

    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300)
    } else {
      calculateResults(newAnswers)
    }
  }

  function calculateResults(finalAnswers: Record<string, string[]>) {
    const allSelectedTags = Object.values(finalAnswers).flat()
    
    const scored = ITINERARIES.map(itinerary => {
      let score = 0
      
      // Score based on tag matches
      allSelectedTags.forEach(tag => {
        if (itinerary.tags.includes(tag)) score += 10
        
        // Scope matching
        if (tag === 'City' && itinerary.cities.length === 1) score += 15
        if (tag === 'Country' && itinerary.tags.includes('Country')) score += 15
        if (tag === 'Region' && itinerary.tags.includes('Region')) score += 15
      })

      // Duration matching
      const durationTags = finalAnswers['duration'] || []
      if (durationTags.includes('short') && itinerary.durationDays <= 5) score += 20
      if (durationTags.includes('medium') && itinerary.durationDays >= 6 && itinerary.durationDays <= 8) score += 20
      if (durationTags.includes('long') && itinerary.durationDays >= 10) score += 20

      return { ...itinerary, score }
    })

    scored.sort((a, b) => b.score - a.score)
    setResults(scored.slice(0, 3))
    setShowResults(true)
  }

  function restart() {
    setCurrentQuestion(0)
    setAnswers({})
    setShowResults(false)
    setResults([])
  }

  const executeCopyItinerary = useCallback(
    async (itinerary: Itinerary) => {
      const token = session?.access_token
      if (!token) return

      setCopying(true)
      try {
        const response = await fetch('/api/itineraries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: itinerary.name }),
        })

        if (response.ok) {
          const data = await response.json()
          const newItineraryId = data.itinerary.id
          const places = ITINERARY_PLACES[itinerary.id] || []

          for (const place of places) {
            await fetch('/api/saved-places', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                itinerary_id: newItineraryId,
                place_id: `sample-${place.name.toLowerCase().replace(/\s+/g, '-')}`,
                name: place.name,
                category: place.category,
                city: itinerary.cities[0],
                day_number: place.day_number,
              }),
            })
          }

          setCopied(true)
          setTimeout(() => {
            setCopied(false)
            setViewingItinerary(null)
          }, 2000)
        }
      } catch (error) {
        console.error('Failed to copy itinerary:', error)
      } finally {
        setCopying(false)
      }
    },
    [session?.access_token]
  )

  useEffect(() => {
    if (!user || !session?.access_token) return
    const pending = pendingCopyRef.current
    if (!pending) return
    pendingCopyRef.current = null
    void executeCopyItinerary(pending)
  }, [user, session?.access_token, executeCopyItinerary])

  async function copyToMyTrips(itinerary: Itinerary) {
    if (!user || !session?.access_token) {
      pendingCopyRef.current = itinerary
      setShowAuthModal(true)
      return
    }
    await executeCopyItinerary(itinerary)
  }

  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100

  if (showResults) {
    return (
      <>
      <main className="min-h-screen bg-cream-100">
        <Navigation />
        
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-wand-magic-sparkles text-2xl text-teal-600"></i>
            </div>
            <h1 className="text-3xl font-serif text-stone-900 mb-2">Your Perfect Trips!</h1>
            <p className="text-stone-500">Based on your answers, here are our top picks for you</p>
          </div>

          <div className="space-y-4 mb-8">
            {results.map((itinerary, idx) => (
              <div 
                key={itinerary.id}
                className={`bg-white rounded-xl overflow-hidden border-2 ${idx === 0 ? 'border-teal-400' : 'border-cream-300'} hover:shadow-lg transition-shadow cursor-pointer`}
                onClick={() => setViewingItinerary(itinerary)}
              >
                <div className="flex">
                  <div className="w-32 h-32 flex-shrink-0 relative">
                    <img 
                      src={itinerary.image} 
                      alt={itinerary.name}
                      className="w-full h-full object-cover"
                    />
                    {idx === 0 && (
                      <div className="absolute top-2 left-2 bg-teal-500 text-white text-xs font-bold px-2 py-1 rounded">
                        #1 MATCH
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-serif text-lg text-stone-900">{itinerary.name}</h3>
                      <span className="text-xs text-stone-500 bg-cream-100 px-2 py-1 rounded">
                        {itinerary.duration}
                      </span>
                    </div>
                    <p className="text-stone-500 text-sm mb-2 line-clamp-2">{itinerary.description}</p>
                    <p className="text-sm font-medium text-stone-800 mb-1">
                      <i className="fa-solid fa-tag mr-1.5 text-stone-400"></i>
                      From {formatEstimatedBudgetUsd(getCuratedPriceFromUsd(itinerary.id))}
                    </p>
                    <p className="text-xs text-stone-400 mb-2">Est. trip budget (excl. flights)</p>
                    <div className="flex gap-1.5">
                      {itinerary.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-cream-200 text-stone-600 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={restart}
              className="flex-1 py-3 rounded-lg border border-cream-300 text-stone-600 hover:bg-cream-200 transition-colors text-sm font-medium"
            >
              <i className="fa-solid fa-rotate-left mr-2"></i>
              Retake Quiz
            </button>
            <button
              onClick={() => router.push('/discover')}
              className="flex-1 py-3 rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors text-sm font-medium"
            >
              View All Itineraries
              <i className="fa-solid fa-arrow-right ml-2"></i>
            </button>
          </div>
        </div>

        {/* Itinerary Detail Modal */}
        {viewingItinerary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
              onClick={() => setViewingItinerary(null)}
            ></div>
            <div className="relative bg-cream-50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
              {/* Header Image */}
              <div className="relative h-40 flex-shrink-0">
                <img 
                  src={viewingItinerary.image} 
                  alt={viewingItinerary.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <button 
                  onClick={() => setViewingItinerary(null)} 
                  className="absolute top-4 right-4 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-stone-600 hover:bg-white transition-colors"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex gap-2 mb-2">
                    {viewingItinerary.tags.map(tag => (
                      <span 
                        key={tag}
                        className="bg-white/90 px-2 py-0.5 rounded text-xs font-medium text-stone-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-2xl font-serif text-white">{viewingItinerary.name}</h2>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500 mb-3">
                    <span className="flex items-center gap-1.5">
                      <i className="fa-regular fa-calendar"></i>
                      {viewingItinerary.duration}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <i className="fa-solid fa-location-dot"></i>
                      {viewingItinerary.cities.join(' → ')}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-stone-800">
                      <i className="fa-solid fa-tag text-stone-400"></i>
                      From {formatEstimatedBudgetUsd(getCuratedPriceFromUsd(viewingItinerary.id))}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mb-3">Est. trip budget (excl. flights)</p>
                  <p className="text-stone-600">{viewingItinerary.description}</p>
                </div>

                {/* Places preview */}
                {ITINERARY_PLACES[viewingItinerary.id] && (
                  <div>
                    <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-3">
                      What's Included
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {ITINERARY_PLACES[viewingItinerary.id].slice(0, 6).map((place, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 border border-cream-200">
                          <p className="text-stone-800 text-sm font-medium">{place.name}</p>
                          <p className="text-xs text-stone-400">Day {place.day_number} • {place.category}</p>
                        </div>
                      ))}
                    </div>
                    {ITINERARY_PLACES[viewingItinerary.id].length > 6 && (
                      <p className="text-xs text-stone-400 mt-2 text-center">
                        + {ITINERARY_PLACES[viewingItinerary.id].length - 6} more places
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 p-4 border-t border-cream-300 bg-white">
                <button
                  onClick={() => copyToMyTrips(viewingItinerary)}
                  disabled={copying || copied}
                  className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
                    copied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50'
                  }`}
                >
                  {copying ? (
                    <><i className="fa-solid fa-circle-notch animate-spin mr-2"></i>Adding to My Trips...</>
                  ) : copied ? (
                    <><i className="fa-solid fa-check mr-2"></i>Added to My Trips!</>
                  ) : (
                    <><i className="fa-solid fa-plus mr-2"></i>Add to My Trips</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onDismiss={() => {
          pendingCopyRef.current = null
        }}
        initialMode="login"
      />
      </>
    )
  }

  const question = QUESTIONS[currentQuestion]

  return (
    <main className="min-h-screen bg-cream-100">
      <Navigation />
      
      <div className="max-w-xl mx-auto px-4 py-12">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-stone-400 mb-2">
            <span>Question {currentQuestion + 1} of {QUESTIONS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-cream-300 rounded-full overflow-hidden">
            <div 
              className="h-full bg-stone-900 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif text-stone-900">{question.question}</h1>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option) => (
            <button
              key={option.label}
              onClick={() => selectOption(question.id, option.tags)}
              className={`w-full p-4 rounded-xl border-2 border-cream-300 bg-white hover:border-stone-400 hover:shadow-md transition-all text-left flex items-center gap-4 ${
                answers[question.id]?.join() === option.tags.join() ? 'border-stone-900 bg-cream-50' : ''
              }`}
            >
              <div className="w-12 h-12 bg-cream-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i className={`fa-solid ${option.icon} text-xl text-stone-600`}></i>
              </div>
              <span className="text-stone-800 font-medium">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Back button */}
        {currentQuestion > 0 && (
          <button
            onClick={() => setCurrentQuestion(currentQuestion - 1)}
            className="mt-6 text-stone-400 hover:text-stone-600 text-sm flex items-center gap-2 mx-auto"
          >
            <i className="fa-solid fa-arrow-left"></i>
            Back
          </button>
        )}
      </div>
    </main>
  )
}
