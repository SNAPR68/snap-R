'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
      <div className="text-center px-6">
        <h1 className="text-6xl font-bold text-[#D4AF37] mb-4">Oops</h1>
        <h2 className="text-2xl text-white mb-4">Something went wrong</h2>
        <p className="text-gray-400 mb-8">We are working on fixing this. Please try again.</p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#b8962f] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
