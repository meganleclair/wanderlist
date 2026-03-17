'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'

interface SearchFormProps {
  onSearch: (city: string) => void
  isLoading: boolean
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [city, setCity] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (city.length < 2) {
        setSuggestions([])
        return
      }

      try {
        const res = await fetch(`/api/cities?q=${encodeURIComponent(city)}`)
        const data = await res.json()
        setSuggestions(data.suggestions || [])
      } catch {
        setSuggestions([])
      }
    }

    const debounce = setTimeout(fetchSuggestions, 200)
    return () => clearTimeout(debounce)
  }, [city])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (city.trim() && !isLoading) {
      setShowSuggestions(false)
      onSearch(city.trim().split(',')[0])
    }
  }

  function handleSuggestionClick(suggestion: string) {
    const cityName = suggestion.split(',')[0]
    setCity(cityName)
    setShowSuggestions(false)
    onSearch(cityName)
  }

  async function handleSurpriseMe() {
    try {
      const res = await fetch('/api/cities?type=random')
      const data = await res.json()
      if (data.city) {
        setCity(data.city)
        onSearch(data.city)
      }
    } catch {
      onSearch('Paris')
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <i className="fa-solid fa-location-dot absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 z-10"></i>
            <input
              ref={inputRef}
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Enter a city name..."
              className="input-field w-full pl-11 pr-4 py-3.5 rounded-md text-stone-900 placeholder:text-stone-400"
              disabled={isLoading}
              autoComplete="off"
            />
            
            {showSuggestions && suggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-cream-200 overflow-hidden z-50"
              >
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2.5 text-stone-700 hover:bg-cream-100 transition-colors flex items-center gap-2"
                  >
                    <i className="fa-solid fa-location-dot text-stone-400 text-xs"></i>
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !city.trim()}
            className="btn-primary px-8 py-3.5 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="fa-solid fa-circle-notch animate-spin"></i>
                Searching
              </span>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>

      <div className="flex items-center justify-center mt-4">
        <button
          type="button"
          onClick={handleSurpriseMe}
          disabled={isLoading}
          className="text-white/80 hover:text-white text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <i className="fa-solid fa-shuffle"></i>
          Surprise me
        </button>
      </div>
    </div>
  )
}
