import { Suspense } from 'react'
import VideoCreatorClient from './VideoCreator'

export const dynamic = 'force-dynamic'

function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
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
