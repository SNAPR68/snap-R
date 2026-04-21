'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle, Circle, X, ChevronDown, ChevronRight, Sparkles
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function GettingStartedChecklist({ hasListings, hasBrand, hasSocials, hasPrepared, hasMarketing, tier }: SetupStatus) {
  const [dismissed, setDismissed] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

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
    },
    {
      label: 'Set up your brand profile',
      description: 'Logo, colors, and contact info for marketing',
      href: '/dashboard/brand',
      done: hasBrand,
    },
    {
      label: 'Connect social accounts',
      description: 'Publish directly to Facebook, Instagram, LinkedIn',
      href: '/dashboard/settings/social',
      done: hasSocials,
    },
    {
      label: 'Prepare a listing with AI',
      description: 'Enhance photos with sky replacement, staging & more',
      href: '/dashboard/listings',
      done: !!hasPrepared,
    },
    {
      label: 'Create marketing content',
      description: 'Auto-generate descriptions, captions & social posts',
      href: '/dashboard/content-studio',
      done: !!hasMarketing,
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

  return (
    <div className="mb-5">
      {/* Compact banner */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 glass-gold-luxury glossy-top rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
      >
        <div className="w-8 h-8 rounded-lg bg-accent-gold flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Get Started with SnapR</p>
          <p className="text-xs text-white/40">{completedCount} of {items.length} steps complete</p>
        </div>
        {/* Progress dots */}
        <div className="flex gap-1.5">
          {items.map((item, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${item.done ? 'bg-accent-gold' : 'bg-white/15'}`}
            />
          ))}
        </div>
        <ChevronDown className={`w-4 h-4 text-white/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        <button
          onClick={(e) => { e.stopPropagation(); handleDismiss() }}
          className="text-white/20 hover:text-white/50 transition-colors p-1"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expandable checklist items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-3">
              {items.map((item) => {
                return (
                  <Link
                    key={item.label}
                    href={item.done ? '#' : item.href}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      item.done
                        ? 'glass-luxury opacity-50'
                        : 'glass-luxury hover:opacity-90 cursor-pointer'
                    }`}
                  >
                    {item.done ? (
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-white/30 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${item.done ? 'line-through text-white/40' : ''}`}>
                        {item.label}
                      </p>
                      <p className="text-[10px] text-white/30 truncate">{item.description}</p>
                    </div>
                    {!item.done && (
                      <ChevronRight className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                    )}
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
