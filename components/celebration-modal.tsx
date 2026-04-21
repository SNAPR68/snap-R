'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface CelebrationData {
  listingTitle: string
  totalPhotos: number
  confidence: number
  listingId: string
}

/**
 * Self-contained celebration modal that listens for 'snapr:preparation-complete'
 * custom events. Render once in studio — no state management needed in parent.
 *
 * Dispatch: window.dispatchEvent(new CustomEvent('snapr:preparation-complete', { detail: {...} }))
 */
export function CelebrationModal() {
  const [data, setData] = useState<CelebrationData | null>(null)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; delay: number; color: string }>>([])

  const handleEvent = useCallback((e: Event) => {
    const detail = (e as CustomEvent<CelebrationData>).detail
    setData(detail)
    const colors = ['#D4A017', '#FFD700', '#FFA500', '#FF6347', '#32CD32', '#4169E1', '#9370DB']
    setParticles(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      }))
    )
  }, [])

  useEffect(() => {
    window.addEventListener('snapr:preparation-complete', handleEvent)
    return () => window.removeEventListener('snapr:preparation-complete', handleEvent)
  }, [handleEvent])

  const onClose = () => setData(null)

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
          role="dialog"
          aria-modal="true"
          aria-label="Listing preparation complete"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Confetti particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: -20, x: `${p.x}vw`, scale: 1 }}
              animate={{ opacity: 0, y: '100vh', rotate: 720 }}
              transition={{ duration: 2 + Math.random(), delay: p.delay, ease: 'easeOut' }}
              className="absolute w-2 h-2 rounded-full pointer-events-none"
              style={{ backgroundColor: p.color, left: 0 }}
            />
          ))}

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative glass-luxury glossy-top p-8 max-w-md w-full shadow-2xl border border-primary/30 rounded-2xl text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center"
            >
              <CheckCircle className="w-10 h-10 text-black" />
            </motion.div>

            <h2 className="text-2xl font-bold mb-2">Listing Prepared!</h2>
            <p className="text-white/50 text-sm mb-6">
              <span className="text-white font-medium">{data.listingTitle}</span> is ready with{' '}
              <span className="text-primary font-semibold">{data.totalPhotos} enhanced photos</span>
              {data.confidence > 0 && (
                <> at <span className="text-primary font-semibold">{Math.round(data.confidence)}%</span> confidence</>
              )}
            </p>

            <div className="flex justify-center gap-6 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{data.totalPhotos}</p>
                <p className="text-xs text-white/40">Photos</p>
              </div>
              {data.confidence > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{Math.round(data.confidence)}%</p>
                  <p className="text-xs text-white/40">Confidence</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`/dashboard/content-studio?listing=${data.listingId}`}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-bold text-sm rounded-xl hover:opacity-90 transition-all"
                onClick={onClose}
              >
                <Sparkles className="w-4 h-4" />
                Generate Marketing Content
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-white/50 hover:text-white text-sm transition-colors"
              >
                Stay in Studio
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
