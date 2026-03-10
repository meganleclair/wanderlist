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
    <section className="border-t border-cream-300 pt-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-cream-300"></div>
        <h3 className="text-sm uppercase tracking-widest text-stone-500">
          Recent Searches
        </h3>
        <div className="h-px flex-1 bg-cream-300"></div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-3">
        {recentUnique.map((search) => (
          <button
            key={search.id}
            onClick={() => onSearchClick(search.city)}
            className="group flex items-center gap-2 px-4 py-2.5 bg-white border border-cream-300 rounded-full text-sm text-stone-700 hover:border-stone-400 transition-colors"
          >
            <span>{search.city}</span>
            <span className="text-stone-400 text-xs">
              {formatDate(search.searched_at)}
            </span>
            <i className="fa-solid fa-arrow-right text-xs text-stone-300 group-hover:text-stone-500 transition-colors"></i>
          </button>
        ))}
      </div>
    </section>
  )
}
