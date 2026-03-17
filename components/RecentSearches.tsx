import { SearchRecord } from '@/lib/database.types'

interface RecentSearchesProps {
  searches: SearchRecord[]
  onSearchClick: (city: string) => void
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })
}

export default function RecentSearches({ searches, onSearchClick }: RecentSearchesProps) {
  const uniqueCities = new Map<string, SearchRecord>()
  searches.forEach(search => {
    const cityLower = search.city.toLowerCase()
    if (!uniqueCities.has(cityLower)) {
      uniqueCities.set(cityLower, search)
    }
  })
  const recentUnique = Array.from(uniqueCities.values()).slice(0, 6)

  return (
    <section className="pt-8 pb-4">
      <p className="text-xs uppercase tracking-widest text-stone-400 text-center mb-4">
        Recent Searches
      </p>
      
      <div className="flex flex-wrap justify-center gap-2">
        {recentUnique.map((search) => (
          <button
            key={search.id}
            onClick={() => onSearchClick(search.city)}
            className="group px-4 py-2 bg-white border border-cream-300 rounded-full text-sm text-stone-600 hover:border-stone-400 hover:text-stone-900 transition-colors"
          >
            {search.city}
          </button>
        ))}
      </div>
    </section>
  )
}
