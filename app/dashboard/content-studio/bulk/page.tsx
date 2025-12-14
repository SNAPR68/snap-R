import { Suspense } from 'react'
import BulkCreatorClient from './BulkCreator'

export const dynamic = 'force-dynamic'

function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function BulkPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BulkCreatorClient />
    </Suspense>
  )
}
