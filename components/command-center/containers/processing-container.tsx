'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image';
import { Loader2, CheckCircle, Sparkles, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/components/toast'

export interface ProcessingItem {
  id: string
  title: string
  thumbnail?: string | null
  preparation_status: string | null
  marketing_status: string | null
}

interface ProcessingContainerProps {
  initialItems: ProcessingItem[]
}

const MARKETING_STEPS = [
  { key: 'description', label: 'Description' },
  { key: 'captions', label: 'Captions' },
  { key: 'mls', label: 'MLS Package' },
  { key: 'site', label: 'Property Site' },
  { key: 'posts', label: 'Schedule Posts' },
]

function ProcessingDots({ count, total }: { count: number; total: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i < count ? 'bg-[#D4A017]' : 'bg-white/15'
          }`}
        />
      ))}
    </div>
  )
}

export function ProcessingCollapsed({ initialItems }: ProcessingContainerProps) {
  const [items, setItems] = useState(initialItems)
  const prevItemsRef = useRef(initialItems)
  const { toast } = useToast()

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/processing-status', { signal: AbortSignal.timeout(15000) })
      if (!res.ok) return
      const data = await res.json()
      const newItems = data.items || []

      // Check for newly completed marketing
      for (const item of data.recentlyCompleted || []) {
        const prev = prevItemsRef.current.find(p => p.id === item.id)
        if (prev && prev.marketing_status !== 'completed') {
          toast('success', `Marketing ready for "${item.title}"! Descriptions, captions, and posts are ready.`, 8000)
        }
      }

      prevItemsRef.current = newItems
      setItems(newItems)
    } catch {
      // Silent fail on poll error
    }
  }, [toast])

  useEffect(() => {
    if (items.length === 0 && initialItems.length === 0) return
    const interval = setInterval(pollStatus, 5000)
    return () => clearInterval(interval)
  }, [items.length, initialItems.length, pollStatus])

  if (items.length === 0) return null

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{item.title}</p>
            <p className="text-[10px] text-white/40">
              {item.preparation_status === 'preparing' ? 'Enhancing photos...' : 'Generating marketing...'}
            </p>
          </div>
          <ProcessingDots
            count={item.marketing_status === 'processing' ? 2 : 0}
            total={5}
          />
        </div>
      ))}
    </div>
  )
}

export function ProcessingExpanded({ initialItems }: ProcessingContainerProps) {
  const [items, setItems] = useState(initialItems)
  const prevItemsRef = useRef(initialItems)
  const { toast } = useToast()

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/processing-status', { signal: AbortSignal.timeout(15000) })
      if (!res.ok) return
      const data = await res.json()

      for (const item of data.recentlyCompleted || []) {
        const prev = prevItemsRef.current.find(p => p.id === item.id)
        if (prev && prev.marketing_status !== 'completed') {
          toast('success', `Marketing ready for "${item.title}"!`, 8000)
        }
      }

      prevItemsRef.current = data.items || []
      setItems(data.items || [])
    } catch {
      // Silent fail
    }
  }, [toast])

  useEffect(() => {
    const interval = setInterval(pollStatus, 5000)
    return () => clearInterval(interval)
  }, [pollStatus])

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-10 h-10 text-green-400/30 mx-auto mb-3" />
        <p className="text-sm text-white/40">All caught up! Nothing processing right now.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.id} className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
              {item.thumbnail ? (
                <Image src={item.thumbnail} alt="" className="w-full h-full object-cover" width={400} height={300} unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-white/20" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{item.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                <p className="text-xs text-amber-400">
                  {item.preparation_status === 'preparing' ? 'Enhancing photos...' : 'Generating marketing content...'}
                </p>
              </div>
            </div>
            <Link
              href={`/dashboard/studio?id=${item.id}`}
              className="px-3 py-1.5 text-xs bg-white/10 rounded-lg hover:bg-white/15 transition-colors"
            >
              View
            </Link>
          </div>

          {item.marketing_status === 'processing' && (
            <div className="grid grid-cols-5 gap-2">
              {MARKETING_STEPS.map((step, i) => {
                const isActive = i <= 1 // Simplified — real status from marketing_jobs
                return (
                  <div key={step.key} className="text-center">
                    <div className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center ${
                      isActive ? 'bg-[#D4A017]/20' : 'bg-white/5'
                    }`}>
                      {isActive ? (
                        <CheckCircle className="w-3 h-3 text-[#D4A017]" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-white/15" />
                      )}
                    </div>
                    <p className="text-[9px] text-white/30">{step.label}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
