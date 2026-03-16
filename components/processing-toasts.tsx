'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Sparkles, Image, FileText, Share2, Globe } from 'lucide-react'

interface Toast {
  id: string
  icon: 'photo' | 'description' | 'caption' | 'site' | 'post' | 'complete'
  message: string
  timestamp: number
}

const ICON_MAP = {
  photo: Image,
  description: FileText,
  caption: Sparkles,
  site: Globe,
  post: Share2,
  complete: CheckCircle,
}

const ICON_COLOR = {
  photo: 'text-blue-400',
  description: 'text-purple-400',
  caption: 'text-pink-400',
  site: 'text-emerald-400',
  post: 'text-orange-400',
  complete: 'text-[#D4A017]',
}

/**
 * Processing toasts that appear in bottom-right corner.
 * Listens for 'snapr:processing-toast' custom events.
 *
 * Dispatch: window.dispatchEvent(new CustomEvent('snapr:processing-toast', {
 *   detail: { icon: 'photo', message: 'Sky replaced ✓' }
 * }))
 */
export function ProcessingToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const handleEvent = useCallback((e: Event) => {
    const detail = (e as CustomEvent<{ icon: Toast['icon']; message: string }>).detail
    const toast: Toast = {
      id: `${Date.now()}-${Math.random()}`,
      icon: detail.icon,
      message: detail.message,
      timestamp: Date.now(),
    }
    setToasts(prev => [...prev.slice(-4), toast]) // Keep max 5

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id))
    }, 4000)
  }, [])

  useEffect(() => {
    window.addEventListener('snapr:processing-toast', handleEvent)
    return () => window.removeEventListener('snapr:processing-toast', handleEvent)
  }, [handleEvent])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const IconComponent = ICON_MAP[toast.icon]
          const iconColor = ICON_COLOR[toast.icon]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25 }}
              className="flex items-center gap-3 px-4 py-3 bg-[#1A1A1A]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-xl pointer-events-auto min-w-[250px]"
            >
              <div className={`flex-shrink-0 ${iconColor}`}>
                <IconComponent className="w-4 h-4" />
              </div>
              <p className="text-sm text-white/80 font-medium">{toast.message}</p>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
