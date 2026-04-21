import { Suspense } from 'react'
import nextDynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const VideoCreatorClient = nextDynamic(
  () => import('./VideoCreator'),
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
      <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function VideoPage() {
  return (
    <Suspense fallback={<Loading />}>
      <VideoCreatorClient />
    </Suspense>
  )
}
