interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="text-center py-16 max-w-md mx-auto">
      <div className="mb-6">
        <i className="fa-solid fa-triangle-exclamation text-4xl text-stone-400"></i>
      </div>
      
      <h2 className="text-2xl font-serif text-stone-900 mb-3">
        Something went wrong
      </h2>
      
      <p className="text-stone-500 mb-8">
        {message || "We couldn't fetch the places. Please try again."}
      </p>
      
      <button
        onClick={onRetry}
        className="btn-primary px-6 py-3 rounded-md font-medium"
      >
        Try Again
      </button>
    </div>
  )
}
