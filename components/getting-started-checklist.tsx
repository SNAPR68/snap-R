'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CheckCircle, Circle, Home, Palette, Share2, X, ChevronRight, Sparkles, Wand2, Megaphone
} from 'lucide-react'

interface SetupStatus {
  hasListings: boolean
  hasBrand: boolean
  hasSocials: boolean
  hasPrepared?: boolean
  hasMarketing?: boolean
  tier: string
}

const DISMISSED_KEY = 'snapr_checklist_dismissed'

export function GettingStartedChecklist({ hasListings, hasBrand, hasSocials, hasPrepared, hasMarketing, tier }: SetupStatus) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true')
    }
  }, [])

  const items = [
    {
      label: 'Create your first listing',
      description: 'Upload photos and enhance with AI',
      href: '/listings/new',
      done: hasListings,
      icon: Home,
    },
    {
      label: 'Set up your brand profile',
      description: 'Logo, colors, and contact info for marketing',
      href: '/dashboard/brand',
      done: hasBrand,
      icon: Palette,
    },
    {
      label: 'Connect social accounts',
      description: 'Publish directly to Facebook, Instagram, LinkedIn',
      href: '/dashboard/settings/social',
      done: hasSocials,
      icon: Share2,
    },
    {
      label: 'Prepare a listing with AI',
      description: 'Enhance photos with sky replacement, staging & more',
      href: '/dashboard/listings',
      done: !!hasPrepared,
      icon: Wand2,
    },
    {
      label: 'Create marketing content',
      description: 'Auto-generate descriptions, captions & social posts',
      href: '/dashboard/content-studio',
      done: !!hasMarketing,
      icon: Megaphone,
    },
  ]

  const completedCount = items.filter(i => i.done).length
  const allDone = completedCount === items.length

  // Don't show if all done or dismissed
  if (allDone || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISSED_KEY, 'true')
    }
  }

  const progressPercent = (completedCount / items.length) * 100

  return (
    <div className="mb-6 bg-gradient-to-br from-[#D4A017]/10 to-purple-500/5 border border-[#D4A017]/20 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4A017] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Get Started with SnapR</h3>
            <p className="text-sm text-white/50">{completedCount} of {items.length} steps complete</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white/30 hover:text-white/60 transition-colors p-1"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/10 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-[#D4A017] rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.done ? '#' : item.href}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                item.done
                  ? 'bg-white/5 opacity-60'
                  : 'bg-white/5 hover:bg-white/10 cursor-pointer'
              }`}
            >
              {item.done ? (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-white/30 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.done ? 'line-through text-white/40' : ''}`}>
                  {item.label}
                </p>
                <p className="text-xs text-white/40 truncate">{item.description}</p>
              </div>
              {!item.done && (
                <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
