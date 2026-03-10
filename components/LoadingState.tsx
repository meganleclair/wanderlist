'use client'

interface LoadingStateProps {
  city: string
}

export default function LoadingState({ city }: LoadingStateProps) {
  return (
    <div className="text-center py-16 max-w-md mx-auto">
      <p className="text-sm uppercase tracking-widest text-stone-400 mb-2">Exploring</p>
      <h2 className="text-3xl font-serif text-stone-900 mb-8">
        {city}
      </h2>
      
      <div className="flex items-center justify-center gap-2">
        <i className="fa-solid fa-circle-notch animate-spin text-stone-400"></i>
        <p className="text-stone-500 text-sm">Finding the best places...</p>
      </div>
    </div>
  )
}
