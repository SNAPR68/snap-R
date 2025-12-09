import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { CreateContentClient } from './client'

export default function CreateContentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    }>
      <CreateContentClient />
    </Suspense>
  )
}
