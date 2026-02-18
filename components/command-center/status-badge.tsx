'use client'

import { CheckCircle, Sparkles, Loader2, Clock, FileText } from 'lucide-react'

interface StatusBadgeProps {
  preparationStatus?: string | null
  marketingStatus?: string | null
}

export function StatusBadge({ preparationStatus, marketingStatus }: StatusBadgeProps) {
  // Show marketing status if available (higher priority)
  if (marketingStatus === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 text-xs text-purple-400">
        <Sparkles className="w-3 h-3" /> Marketing Ready
      </span>
    )
  }

  if (marketingStatus === 'processing') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-xs text-blue-400">
        <Loader2 className="w-3 h-3 animate-spin" /> Marketing...
      </span>
    )
  }

  // Fall back to preparation status
  if (preparationStatus === 'prepared') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 text-xs text-green-400">
        <CheckCircle className="w-3 h-3" /> Prepared
      </span>
    )
  }

  if (preparationStatus === 'preparing') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-xs text-amber-400">
        <Loader2 className="w-3 h-3 animate-spin" /> Preparing...
      </span>
    )
  }

  if (preparationStatus === 'needs_review') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/15 text-xs text-yellow-400">
        <FileText className="w-3 h-3" /> Needs Review
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-xs text-white/30">
      <Clock className="w-3 h-3" /> Draft
    </span>
  )
}
