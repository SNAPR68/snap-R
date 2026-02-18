'use client'

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ExternalLink, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface ExpandableCardProps {
  id: string
  title: string
  icon: LucideIcon
  color: string
  badge?: string | number
  isExpanded: boolean
  onExpand: () => void
  onCollapse: () => void
  collapsedContent: ReactNode
  expandedContent: ReactNode
  fullPageHref?: string
  className?: string
}

export function ExpandableCard({
  id,
  title,
  icon: Icon,
  color,
  badge,
  isExpanded,
  onExpand,
  onCollapse,
  collapsedContent,
  expandedContent,
  fullPageHref,
  className = '',
}: ExpandableCardProps) {
  if (isExpanded) {
    return (
      <motion.div
        layoutId={`card-${id}`}
        className="min-h-[calc(100vh-120px)] bg-[#0A0A0A] rounded-2xl border border-white/10 overflow-hidden"
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Expanded header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <button
              onClick={onCollapse}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
            <div className="w-px h-5 bg-white/10" />
            <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {badge !== undefined && (
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-white/60">{badge}</span>
            )}
          </div>
          {fullPageHref && (
            <Link
              href={fullPageHref}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              Open full page <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
        {/* Expanded content */}
        <div className="p-6 overflow-auto max-h-[calc(100vh-200px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              {expandedContent}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layoutId={`card-${id}`}
      onClick={onExpand}
      className={`group cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-colors overflow-hidden flex flex-col ${className}`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
    >
      {/* Colored accent line at top */}
      <div className={`h-[2px] ${color} opacity-40`} />
      {/* Collapsed header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {badge !== undefined && (
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-white/50">{badge}</span>
        )}
      </div>
      {/* Collapsed content */}
      <div className="p-4 flex-1 flex flex-col justify-center">
        {collapsedContent}
      </div>
    </motion.div>
  )
}
