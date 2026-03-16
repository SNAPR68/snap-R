'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Upload, ArrowRight, Loader2 } from 'lucide-react'
import Image from 'next/image'

export function SampleListingCTA() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCreateSample = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/listings/sample', {
        method: 'POST',
        signal: AbortSignal.timeout(15000),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/dashboard/studio?id=${data.listingId}`)
      } else {
        // Fallback: just go to new listing page
        router.push('/listings/new')
      }
    } catch {
      router.push('/listings/new')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-gold-luxury glossy-top rounded-2xl p-6 mb-5">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Preview thumbnails */}
        <div className="flex -space-x-3 flex-shrink-0">
          {['/gallery/sky-before.jpg', '/gallery/staging-before.jpg', '/gallery/twilight-before.jpg'].map((src, i) => (
            <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-[#D4A017]/30 shadow-lg">
              <Image src={src} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>

        <div className="flex-1 text-center md:text-left">
          <h3 className="text-lg font-bold mb-1">
            See the magic in 60 seconds
          </h3>
          <p className="text-sm text-white/50">
            We&apos;ll create a sample listing with real photos so you can try AI enhancement, marketing, and everything else — no upload needed.
          </p>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={handleCreateSample}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold text-sm rounded-xl hover:opacity-90 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Try with Sample Photos
          </button>
          <button
            onClick={() => router.push('/listings/new')}
            className="flex items-center justify-center gap-2 px-5 py-2 text-white/50 hover:text-white text-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload my own
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
