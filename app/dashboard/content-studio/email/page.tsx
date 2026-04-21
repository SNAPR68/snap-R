import { Suspense } from 'react'
import nextDynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const EmailMarketingClient = nextDynamic(
  () => import('./EmailMarketing'),
  {
    loading: () => (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
)

function Loading() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function EmailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <EmailMarketingClient />
    </Suspense>
  )
}
