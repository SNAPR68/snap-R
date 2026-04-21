import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const UnifiedCreator = dynamic(
  () => import('@/components/content-studio/unified-creator').then(m => ({ default: m.UnifiedCreator })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
      </div>
    ),
  }
)

export default function UnifiedCreatorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
      </div>
    }>
      <UnifiedCreator />
    </Suspense>
  )
}
