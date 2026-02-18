'use client'

import Link from 'next/link'
import { Sparkles, CheckCircle, FileText, MessageSquare, Globe, Calendar } from 'lucide-react'

export interface MarketingStatus {
  status: string
  hasDescription: boolean
  hasCaptions: boolean
  hasSite: boolean
  hasScheduledPosts: boolean
}

interface ContentContainerProps {
  listings: Array<{ id: string; title: string; thumbnail?: string | null }>
  marketingStatuses: Record<string, MarketingStatus>
}

function MarketingCheckItem({ label, done }: { label: string; done: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${done ? 'text-green-400' : 'text-white/20'}`}>
      <CheckCircle className="w-3 h-3" /> {label}
    </span>
  )
}

export function ContentCollapsed({ listings, marketingStatuses }: ContentContainerProps) {
  const readyCount = Object.values(marketingStatuses).filter(m => m.status === 'completed').length

  return (
    <div className="space-y-3">
      {readyCount > 0 ? (
        <>
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-white/70">{readyCount} listing{readyCount !== 1 ? 's' : ''} with content ready</span>
          </div>
          <div className="space-y-1.5">
            {listings
              .filter(l => marketingStatuses[l.id]?.status === 'completed')
              .slice(0, 2)
              .map(l => (
                <Link
                  key={l.id}
                  href={`/dashboard/content-studio/create-all?listing=${l.id}&prefill=marketing`}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] transition-colors text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
                  <span className="truncate">{l.title}</span>
                </Link>
              ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-white/40 text-center py-2">
          Prepare a listing to generate marketing content
        </p>
      )}
      <Link
        href="/dashboard/content-studio"
        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#D4A017] text-black rounded-lg text-xs font-semibold w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Sparkles className="w-3 h-3" /> Create Post
      </Link>
    </div>
  )
}

export function ContentExpanded({ listings, marketingStatuses }: ContentContainerProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-white/50">Select a listing to create marketing content</p>
        <Link
          href="/dashboard/content-studio"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D4A017] text-black rounded-lg text-sm font-semibold"
        >
          <Sparkles className="w-4 h-4" /> Open Studio
        </Link>
      </div>
      <div className="space-y-3">
        {listings.map(listing => {
          const mkt = marketingStatuses[listing.id]
          const isReady = mkt?.status === 'completed'

          return (
            <div
              key={listing.id}
              className={`p-4 rounded-xl border transition-colors ${
                isReady
                  ? 'border-purple-500/20 bg-purple-500/5'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">{listing.title}</h4>
                {isReady && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-xs text-purple-400">
                    Content Ready
                  </span>
                )}
              </div>
              {isReady && mkt && (
                <div className="flex flex-wrap gap-3 mb-3">
                  <MarketingCheckItem label="Description" done={mkt.hasDescription} />
                  <MarketingCheckItem label="Captions" done={mkt.hasCaptions} />
                  <MarketingCheckItem label="Property Site" done={mkt.hasSite} />
                  <MarketingCheckItem label="Posts Scheduled" done={mkt.hasScheduledPosts} />
                </div>
              )}
              <div className="flex gap-2">
                {isReady ? (
                  <Link
                    href={`/dashboard/content-studio/create-all?listing=${listing.id}&prefill=marketing`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D4A017] text-black rounded-lg text-xs font-semibold"
                  >
                    <Sparkles className="w-3 h-3" /> Create Post
                  </Link>
                ) : (
                  <Link
                    href={`/dashboard/studio?id=${listing.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs"
                  >
                    Open Studio
                  </Link>
                )}
              </div>
            </div>
          )
        })}
        {listings.length === 0 && (
          <div className="text-center py-8 text-white/40">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No listings yet. Create one to start generating content.</p>
          </div>
        )}
      </div>
    </div>
  )
}
