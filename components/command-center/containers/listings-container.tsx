'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Plus, ArrowRight, Image as ImageIcon } from 'lucide-react'
import { StatusBadge } from '../status-badge'

export interface ListingItem {
  id: string
  title: string
  address?: string
  thumbnail?: string | null
  preparation_status: string | null
  marketing_status: string | null
  photoCount?: number
}

interface ListingsContainerProps {
  listings: ListingItem[]
}

function ListingCard({ listing, compact = false }: { listing: ListingItem; compact?: boolean }) {
  return (
    <Link
      href={`/dashboard/studio?id=${listing.id}`}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 hover:bg-white/[0.06] transition-all"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative w-12 h-12 rounded-lg bg-white/10 flex-shrink-0 overflow-hidden">
        {listing.thumbnail ? (
          <Image src={listing.thumbnail} alt="" fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-white/20" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{listing.title}</p>
        {!compact && listing.address && (
          <p className="text-xs text-white/40 truncate">{listing.address}</p>
        )}
        <StatusBadge
          preparationStatus={listing.preparation_status}
          marketingStatus={listing.marketing_status}
        />
      </div>
      {!compact && (
        <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0" />
      )}
    </Link>
  )
}

export function ListingsCollapsed({ listings }: ListingsContainerProps) {
  const topListings = listings.slice(0, 4)

  return (
    <div>
      {topListings.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-white/40 mb-3">No listings yet</p>
          <Link
            href="/listings/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D4A017] text-black rounded-lg text-xs font-semibold"
            onClick={(e) => e.stopPropagation()}
          >
            <Plus className="w-3 h-3" /> Create Listing
          </Link>
        </div>
      ) : (
        <div className="flex gap-3 overflow-hidden">
          {topListings.map(listing => (
            <Link
              key={listing.id}
              href={`/dashboard/studio?id=${listing.id}`}
              className="flex-1 min-w-0 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 hover:bg-white/[0.06] transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full aspect-[4/3] rounded-lg bg-white/10 overflow-hidden mb-2">
                {listing.thumbnail ? (
                  <Image src={listing.thumbnail} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-white/20" />
                  </div>
                )}
              </div>
              <p className="text-xs font-medium truncate">{listing.title}</p>
              <StatusBadge
                preparationStatus={listing.preparation_status}
                marketingStatus={listing.marketing_status}
              />
            </Link>
          ))}
          {listings.length > 4 && (
            <div className="flex-shrink-0 flex items-center px-2">
              <span className="text-xs text-white/30 whitespace-nowrap">+{listings.length - 4} more</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ListingsExpanded({ listings }: ListingsContainerProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-white/50">{listings.length} listing{listings.length !== 1 ? 's' : ''}</p>
        <Link
          href="/listings/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D4A017] text-black rounded-lg text-sm font-semibold hover:bg-[#B8960C] transition-colors"
        >
          <Plus className="w-4 h-4" /> New Listing
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {listings.map(listing => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
      {listings.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/40 mb-4">Upload your first property photos</p>
          <Link
            href="/listings/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4A017] text-black rounded-lg font-semibold text-sm"
          >
            <Plus className="w-4 h-4" /> Create First Listing
          </Link>
        </div>
      )}
    </div>
  )
}
