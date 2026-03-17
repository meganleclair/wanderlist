'use client'

import { useState, useEffect } from 'react'

interface LoadingStateProps {
  city: string
}

const LOADING_MESSAGES = [
  'Finding the best places...',
  'Searching for hidden gems...',
  'Loading photos...',
  'Almost there...',
]

export default function LoadingState({ city }: LoadingStateProps) {
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev // Stop at 90% until actually done
        return prev + Math.random() * 15
      })
    }, 500)

    // Cycle through messages
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 2500)

    return () => {
      clearInterval(progressInterval)
      clearInterval(messageInterval)
    }
  }, [])

  return (
    <div className="text-center py-16 max-w-md mx-auto">
      <p className="text-sm uppercase tracking-widest text-stone-400 mb-2">Exploring</p>
      <h2 className="text-3xl font-serif text-stone-900 mb-8">
        {city}
      </h2>
      
      {/* Progress bar */}
      <div className="w-full max-w-xs mx-auto mb-6">
        <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-stone-900 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 95)}%` }}
          />
        </div>
      </div>
      
      <p className="text-stone-500 text-sm animate-pulse">
        {LOADING_MESSAGES[messageIndex]}
      </p>
    </div>
  )
}
