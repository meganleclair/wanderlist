import Link from 'next/link'
import Navigation from '@/components/Navigation'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cream-100">
      <Navigation />
      
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="mb-8">
          <span className="text-8xl font-serif text-stone-200">404</span>
        </div>
        
        <h1 className="text-3xl font-serif text-stone-900 mb-3">
          Looks like you're lost
        </h1>
        <p className="text-stone-500 mb-8">
          This page doesn't exist, but there's a whole world out there waiting to be explored.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            href="/"
            className="btn-primary px-6 py-3 rounded-lg font-medium inline-flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-compass"></i>
            Start Exploring
          </Link>
          <Link 
            href="/discover"
            className="btn-outline px-6 py-3 rounded-lg font-medium inline-flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-map"></i>
            Browse Itineraries
          </Link>
        </div>
        
        <div className="mt-16 pt-8 border-t border-cream-300">
          <p className="text-stone-400 text-sm mb-4">Popular destinations to get you started:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Paris', 'Tokyo', 'Barcelona', 'Bali', 'New York'].map(city => (
              <Link
                key={city}
                href={`/?search=${encodeURIComponent(city)}`}
                className="px-3 py-1.5 bg-white border border-cream-300 rounded-full text-sm text-stone-600 hover:border-stone-400 transition-colors"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
