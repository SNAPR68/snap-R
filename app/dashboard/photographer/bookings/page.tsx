import { Suspense } from 'react'
import BookingsDashboard from './BookingsDashboard'

export const dynamic = 'force-dynamic'

export default function BookingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BookingsDashboard />
    </Suspense>
  )
}
