'use client'

import { Bed, Bath, Ruler, Home, MapPin, DollarSign, Calendar, Car, Building } from 'lucide-react'
import { useState } from 'react'

interface Listing {
  title?: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  price: number | null
  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  description: string | null
  property_type: string | null
  year_built: number | null
  lot_size: string | null
  parking: string | null
  features: string[] | null
  status?: string | null
}

interface PropertyDetailsProps {
  listing: Listing
  location: string
  fullAddress: string
  primaryColor?: string
  monthlyPayment: number | null
  mortgageData: {
    downPaymentPercent: number
    interestRate: number
    loanTerm: number
  }
  onMortgageChange: (data: any) => void
}

export function PropertyDetails({
  listing,
  location,
  fullAddress,
  primaryColor = '#D4A017',
  monthlyPayment,
  mortgageData,
  onMortgageChange,
}: PropertyDetailsProps) {
  const [showAllFeatures, setShowAllFeatures] = useState(false)
  const visibleFeatures = showAllFeatures
    ? listing.features || []
    : (listing.features || []).slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Price & Location */}
      <div>
        <div className="text-4xl font-bold text-white mb-2">
          {listing.price ? `$${listing.price.toLocaleString()}` : 'Price N/A'}
        </div>
        <div className="flex items-center gap-2 text-lg text-white/80 mb-2">
          <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
          {location}
        </div>
        <p className="text-white/60">{listing.address}</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-4 gap-3">
        {listing.bedrooms !== null && (
          <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
            <Bed className="w-5 h-5 mx-auto mb-1 text-white/60" />
            <p className="text-lg font-semibold text-white">{listing.bedrooms}</p>
            <p className="text-xs text-white/50">Beds</p>
          </div>
        )}
        {listing.bathrooms !== null && (
          <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
            <Bath className="w-5 h-5 mx-auto mb-1 text-white/60" />
            <p className="text-lg font-semibold text-white">{listing.bathrooms}</p>
            <p className="text-xs text-white/50">Baths</p>
          </div>
        )}
        {listing.square_feet !== null && (
          <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
            <Ruler className="w-5 h-5 mx-auto mb-1 text-white/60" />
            <p className="text-lg font-semibold text-white">{(listing.square_feet / 1000).toFixed(1)}k</p>
            <p className="text-xs text-white/50">Sq Ft</p>
          </div>
        )}
        {listing.year_built && (
          <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-white/60" />
            <p className="text-lg font-semibold text-white">{listing.year_built}</p>
            <p className="text-xs text-white/50">Year Built</p>
          </div>
        )}
      </div>

      {/* Description */}
      {listing.description && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">About</h3>
          <p className="text-white/70 leading-relaxed">{listing.description}</p>
        </div>
      )}

      {/* Features */}
      {listing.features && listing.features.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Features</h3>
          <div className="grid grid-cols-2 gap-2">
            {visibleFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-white/70">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                {feature}
              </div>
            ))}
          </div>
          {(listing.features.length > 4) && (
            <button
              onClick={() => setShowAllFeatures(!showAllFeatures)}
              className="mt-3 text-sm font-medium transition-colors"
              style={{ color: primaryColor }}
            >
              {showAllFeatures ? 'Show Less' : `Show ${listing.features.length - 4} More`}
            </button>
          )}
        </div>
      )}

      {/* Property Details */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-3">
        <h3 className="text-lg font-semibold text-white">Property Details</h3>
        {listing.property_type && (
          <div className="flex justify-between">
            <span className="text-white/60">Type</span>
            <span className="text-white font-medium">{listing.property_type}</span>
          </div>
        )}
        {listing.lot_size && (
          <div className="flex justify-between">
            <span className="text-white/60">Lot Size</span>
            <span className="text-white font-medium">{listing.lot_size}</span>
          </div>
        )}
        {listing.parking && (
          <div className="flex justify-between">
            <span className="text-white/60">Parking</span>
            <span className="text-white font-medium">{listing.parking}</span>
          </div>
        )}
        {listing.status && (
          <div className="flex justify-between">
            <span className="text-white/60">Status</span>
            <span className="text-white font-medium">{listing.status}</span>
          </div>
        )}
      </div>

      {/* Mortgage Calculator */}
      {listing.price && monthlyPayment && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-4">
          <h3 className="text-lg font-semibold text-white">Mortgage Calculator</h3>
          <div className="space-y-3">
            <div>
              <label className="text-white/60 text-sm">Down Payment %</label>
              <input
                type="range"
                min="5"
                max="50"
                value={mortgageData.downPaymentPercent}
                onChange={(e) =>
                  onMortgageChange({ ...mortgageData, downPaymentPercent: Number(e.target.value) })
                }
                className="w-full"
              />
              <span className="text-white text-sm">{mortgageData.downPaymentPercent}%</span>
            </div>
            <div>
              <label className="text-white/60 text-sm">Interest Rate %</label>
              <input
                type="number"
                value={mortgageData.interestRate}
                onChange={(e) =>
                  onMortgageChange({ ...mortgageData, interestRate: Number(e.target.value) })
                }
                step="0.1"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              />
            </div>
            <div>
              <label className="text-white/60 text-sm">Loan Term (Years)</label>
              <select
                value={mortgageData.loanTerm}
                onChange={(e) =>
                  onMortgageChange({ ...mortgageData, loanTerm: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              >
                <option value="15">15 Years</option>
                <option value="30">30 Years</option>
              </select>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 border border-white/20">
            <p className="text-white/60 text-sm mb-1">Estimated Monthly Payment</p>
            <p className="text-2xl font-bold text-white">${monthlyPayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      )}
    </div>
  )
}
