'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-raised">
      <div className="text-center px-6">
        <h1 className="text-6xl font-bold text-accent-gold mb-4">Oops</h1>
        <h2 className="text-2xl text-white mb-4">Something went wrong</h2>
        <p className="text-gray-400 mb-8">We are working on fixing this. Please try again.</p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
