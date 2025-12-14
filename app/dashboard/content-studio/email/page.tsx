import { Suspense } from 'react'
import EmailMarketingClient from './EmailMarketing'

export const dynamic = 'force-dynamic'

function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
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
