'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  MapPin, Bed, Bath, Square, Phone, Mail, Share2, ChevronLeft, ChevronRight, 
  X, Calendar, Home, Car, Sparkles, Play, DollarSign, Calculator,
  Facebook, Twitter, Linkedin, Link2, Check, MessageCircle, Building,
  ChevronDown, ChevronUp, ExternalLink, Heart, Grid, Copy
} from 'lucide-react'

// ============================================
// TYPE DEFINITIONS
// ============================================
interface Listing {
  id?: string
  title: string | null
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
  mls_number?: string | null
  hoa_fees?: number | null
  latitude?: number | null
  longitude?: number | null
}

interface Agent {
  name: string
  email: string | null
  phone: string | null
  avatar?: string | null
  company?: string | null
  title?: string | null
}

interface Brand {
  logo?: string | null
  primaryColor?: string
  secondaryColor?: string
  website?: string | null
  tagline?: string | null
}

interface Props {
  photos: string[]
  listing: Listing
  agent: Agent | null
  brand?: Brand | null
  videoUrl?: string | null
  slug: string
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function PropertySiteClient({ photos, listing, agent, brand, videoUrl, slug }: Props) {
  // State
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showAllFeatures, setShowAllFeatures] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [heroImageIndex, setHeroImageIndex] = useState(0)
  const [saved, setSaved] = useState(false)
  
  // Mortgage calculator state
  const [mortgageData, setMortgageData] = useState({
    downPaymentPercent: 20,
    interestRate: 6.5,
    loanTerm: 30,
  })
  
  // Derived values
  const primaryColor = brand?.primaryColor || '#D4A017'
  const location = [listing.city, listing.state].filter(Boolean).join(', ')
  const fullAddress = [listing.address, listing.city, listing.state, listing.postal_code].filter(Boolean).join(', ')
  const propertyUrl = typeof window !== 'undefined' ? window.location.href : ''
  
  // ============================================
  // EFFECTS
  // ============================================
  
  // Ken Burns effect - rotate hero image every 6 seconds
  useEffect(() => {
    if (photos.length <= 1) return
    const interval = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % Math.min(photos.length, 5))
    }, 6000)
    return () => clearInterval(interval)
  }, [photos.length])
  
  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxOpen) {
        if (e.key === 'ArrowRight') nextPhoto()
        else if (e.key === 'ArrowLeft') prevPhoto()
        else if (e.key === 'Escape') setLightboxOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen])
  
  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowShareMenu(false)
    if (showShareMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showShareMenu])
  
  // ============================================
  // HANDLERS
  // ============================================
  
  const nextPhoto = () => setCurrentPhoto((prev) => (prev + 1) % photos.length)
  const prevPhoto = () => setCurrentPhoto((prev) => (prev - 1 + photos.length) % photos.length)
  
  // Mortgage calculation
  const calculateMortgage = useCallback(() => {
    if (!listing.price) return null
    const principal = listing.price * (1 - mortgageData.downPaymentPercent / 100)
    const monthlyRate = mortgageData.interestRate / 100 / 12
    const numPayments = mortgageData.loanTerm * 12
    
    if (monthlyRate === 0) return principal / numPayments
    
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
      (Math.pow(1 + monthlyRate, numPayments) - 1)
    
    return monthlyPayment
  }, [listing.price, mortgageData])
  
  const monthlyPayment = calculateMortgage()
  
  // Contact form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      const response = await fetch('/api/property-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contactForm,
          listingId: listing.id,
          listingAddress: fullAddress,
          agentEmail: agent?.email,
        }),
      })
      
      if (!response.ok) throw new Error('Failed to send message')
      
      setFormSubmitted(true)
      setContactForm({ name: '', email: '', phone: '', message: '' })
    } catch (error) {
      setSubmitError('Failed to send message. Please try again or contact the agent directly.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Share functionality
  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(propertyUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}`, '_blank')
  }
  
  const shareOnTwitter = () => {
    const text = `Check out this property: ${listing.title || fullAddress}`
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(propertyUrl)}&text=${encodeURIComponent(text)}`, '_blank')
  }
  
  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(propertyUrl)}`, '_blank')
  }
  
  const shareOnWhatsApp = () => {
    const text = `Check out this property: ${listing.title || fullAddress} ${propertyUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }
  
  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price)
  }
  
  // Get status badge color
  const getStatusColor = (status: string | null | undefined) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'for sale':
        return 'bg-green-500'
      case 'pending':
      case 'under contract':
        return 'bg-yellow-500'
      case 'sold':
        return 'bg-red-500'
      case 'coming soon':
        return 'bg-blue-500'
      default:
        return 'bg-green-500'
    }
  }
  
  // Parse features if needed
  const getFeatures = (): string[] => {
    if (!listing.features) return []
    if (Array.isArray(listing.features)) return listing.features
    if (typeof listing.features === 'string') {
      try {
        return JSON.parse(listing.features)
      } catch {
        return (listing.features as string).split(',').map(f => f.trim())
      }
    }
    return []
  }
  
  const features = getFeatures()

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* ============================================ */}
      {/* HERO SECTION with Ken Burns Effect */}
      {/* ============================================ */}
      <section className="relative h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden">
        {/* Background Images with Ken Burns */}
        {photos.slice(0, 5).map((photo, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === heroImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center ken-burns-active"
              style={{ 
                backgroundImage: `url(${photo})`,
              }}
            />
          </div>
        ))}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
          <div className="max-w-6xl mx-auto w-full">
            {/* Status Badge */}
            {listing.status && (
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-white mb-4 ${getStatusColor(listing.status)}`}>
                {listing.status}
              </span>
            )}
            
            {/* Title & Address */}
            <h1 className="text-3xl md:text-5xl font-bold mb-2">
              {listing.title || listing.address || 'Beautiful Property'}
            </h1>
            <div className="flex items-center gap-2 text-white/80 text-lg mb-4">
              <MapPin className="w-5 h-5" />
              <span>{fullAddress || location}</span>
            </div>
            
            {/* Price */}
            {listing.price && (
              <div className="text-4xl md:text-5xl font-bold mb-6" style={{ color: primaryColor }}>
                {formatPrice(listing.price)}
              </div>
            )}
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 text-lg">
              {listing.bedrooms && (
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5" style={{ color: primaryColor }} />
                  <span>{listing.bedrooms} Beds</span>
                </div>
              )}
              {listing.bathrooms && (
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5" style={{ color: primaryColor }} />
                  <span>{listing.bathrooms} Baths</span>
                </div>
              )}
              {listing.square_feet && (
                <div className="flex items-center gap-2">
                  <Square className="w-5 h-5" style={{ color: primaryColor }} />
                  <span>{listing.square_feet.toLocaleString()} Sq Ft</span>
                </div>
              )}
              {listing.year_built && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                  <span>Built {listing.year_built}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Hero Actions */}
        <div className="absolute top-6 right-6 flex gap-3">
          <button
            onClick={() => setSaved(!saved)}
            className={`p-3 rounded-full backdrop-blur-sm transition ${
              saved ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
            aria-label={saved ? 'Unsave property' : 'Save property'}
          >
            <Heart className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowShareMenu(!showShareMenu)
              }}
              className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition"
              aria-label="Share property"
            >
              <Share2 className="w-5 h-5" />
            </button>
            
            {/* Share Dropdown */}
            {showShareMenu && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={copyLink} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <button onClick={shareOnFacebook} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition">
                  <Facebook className="w-4 h-4 text-blue-500" />
                  <span>Facebook</span>
                </button>
                <button onClick={shareOnTwitter} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition">
                  <Twitter className="w-4 h-4 text-sky-400" />
                  <span>Twitter</span>
                </button>
                <button onClick={shareOnLinkedIn} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition">
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  <span>LinkedIn</span>
                </button>
                <button onClick={shareOnWhatsApp} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition">
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  <span>WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Photo Counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-sm flex items-center gap-2">
            <Grid className="w-4 h-4" />
            <span>{photos.length} photos</span>
          </div>
        )}
      </section>

      {/* ============================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================ */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* ============================================ */}
            {/* PHOTO GALLERY */}
            {/* ============================================ */}
            {photos.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Photo Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.slice(0, 7).map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentPhoto(index)
                        setLightboxOpen(true)
                      }}
                      className={`relative aspect-[4/3] rounded-xl overflow-hidden group ${
                        index === 0 ? 'col-span-2 row-span-2' : ''
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`Property photo ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      {index === 6 && photos.length > 7 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-lg font-semibold">+{photos.length - 7} more</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {photos.length > 7 && (
                  <button
                    onClick={() => {
                      setCurrentPhoto(0)
                      setLightboxOpen(true)
                    }}
                    className="mt-4 flex items-center gap-2 hover:underline"
                    style={{ color: primaryColor }}
                  >
                    <Grid className="w-4 h-4" />
                    View all {photos.length} photos
                  </button>
                )}
              </section>
            )}
            
            {/* ============================================ */}
            {/* VIDEO TOUR (if available) */}
            {/* ============================================ */}
            {videoUrl && (
              <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Play className="w-6 h-6" style={{ color: primaryColor }} />
                  Video Tour
                </h2>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-[#1A1A1A]">
                  <video
                    src={videoUrl}
                    controls
                    className="w-full h-full"
                    poster={photos[0]}
                    preload="metadata"
                  />
                </div>
              </section>
            )}
            
            {/* ============================================ */}
            {/* DESCRIPTION */}
            {/* ============================================ */}
            {listing.description && (
              <section>
                <h2 className="text-2xl font-bold mb-6">About This Property</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-white/80 leading-relaxed whitespace-pre-line text-lg">
                    {listing.description}
                  </p>
                </div>
              </section>
            )}
            
            {/* ============================================ */}
            {/* PROPERTY DETAILS */}
            {/* ============================================ */}
            <section>
              <h2 className="text-2xl font-bold mb-6">Property Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {listing.property_type && (
                  <div className="p-4 bg-[#1A1A1A] rounded-xl">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                      <Home className="w-4 h-4" />
                      <span>Property Type</span>
                    </div>
                    <div className="font-semibold capitalize">{listing.property_type}</div>
                  </div>
                )}
                {listing.bedrooms !== null && listing.bedrooms !== undefined && (
                  <div className="p-4 bg-[#1A1A1A] rounded-xl">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                      <Bed className="w-4 h-4" />
                      <span>Bedrooms</span>
                    </div>
                    <div className="font-semibold">{listing.bedrooms}</div>
                  </div>
                )}
                {listing.bathrooms !== null && listing.bathrooms !== undefined && (
                  <div className="p-4 bg-[#1A1A1A] rounded-xl">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                      <Bath className="w-4 h-4" />
                      <span>Bathrooms</span>
                    </div>
                    <div className="font-semibold">{listing.bathrooms}</div>
                  </div>
                )}
                {listing.square_feet && (
                  <div className="p-4 bg-[#1A1A1A] rounded-xl">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                      <Square className="w-4 h-4" />
                      <span>Square Feet</span>
                    </div>
                    <div className="font-semibold">{listing.square_feet.toLocaleString()}</div>
                  </div>
                )}
                {listing.lot_size && (
                  <div className="p-4 bg-[#1A1A1A] rounded-xl">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                      <MapPin className="w-4 h-4" />
                      <span>Lot Size</span>
                    </div>
                    <div className="font-semibold">{listing.lot_size}</div>
                  </div>
                )}
                {listing.year_built && (
                  <div className="p-4 bg-[#1A1A1A] rounded-xl">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>Year Built</span>
                    </div>
                    <div className="font-semibold">{listing.year_built}</div>
                  </div>
                )}
                {listing.parking && (
                  <div className="p-4 bg-[#1A1A1A] rounded-xl">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                      <Car className="w-4 h-4" />
                      <span>Parking</span>
                    </div>
                    <div className="font-semibold capitalize">{listing.parking}</div>
                  </div>
                )}
                {listing.mls_number && (
                  <div className="p-4 bg-[#1A1A1A] rounded-xl">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                      <Building className="w-4 h-4" />
                      <span>MLS #</span>
                    </div>
                    <div className="font-semibold">{listing.mls_number}</div>
                  </div>
                )}
                {listing.hoa_fees !== null && listing.hoa_fees !== undefined && (
                  <div className="p-4 bg-[#1A1A1A] rounded-xl">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span>HOA Fees</span>
                    </div>
                    <div className="font-semibold">${listing.hoa_fees}/mo</div>
                  </div>
                )}
              </div>
            </section>
            
            {/* ============================================ */}
            {/* FEATURES & AMENITIES */}
            {/* ============================================ */}
            {features.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Features & Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(showAllFeatures ? features : features.slice(0, 9)).map((feature, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 p-3 bg-[#1A1A1A] rounded-lg"
                    >
                      <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                {features.length > 9 && (
                  <button
                    onClick={() => setShowAllFeatures(!showAllFeatures)}
                    className="mt-4 flex items-center gap-2 hover:underline"
                    style={{ color: primaryColor }}
                  >
                    {showAllFeatures ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Show All {features.length} Features
                      </>
                    )}
                  </button>
                )}
              </section>
            )}
            
            {/* ============================================ */}
            {/* LOCATION MAP */}
            {/* ============================================ */}
            {fullAddress && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Location</h2>
                <div className="aspect-[16/9] rounded-xl overflow-hidden bg-[#1A1A1A]">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8'}&q=${encodeURIComponent(fullAddress)}`}
                  />
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 hover:underline"
                  style={{ color: primaryColor }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Google Maps
                </a>
              </section>
            )}
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* ============================================ */}
            {/* MORTGAGE CALCULATOR */}
            {/* ============================================ */}
            {listing.price && (
              <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/10 sticky top-6">
                <div className="flex items-center gap-2 mb-6">
                  <Calculator className="w-5 h-5" style={{ color: primaryColor }} />
                  <h3 className="text-lg font-bold">Mortgage Calculator</h3>
                </div>
                
                {/* Monthly Payment Display */}
                <div className="text-center mb-6 p-4 rounded-xl" style={{ backgroundColor: `${primaryColor}15` }}>
                  <div className="text-sm text-white/60 mb-1">Est. Monthly Payment</div>
                  <div className="text-3xl font-bold" style={{ color: primaryColor }}>
                    {monthlyPayment ? formatPrice(monthlyPayment) : '$0'}
                  </div>
                </div>
                
                {/* Calculator Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="flex justify-between text-sm text-white/60 mb-2">
                      <span>Down Payment</span>
                      <span>{mortgageData.downPaymentPercent}%</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={mortgageData.downPaymentPercent}
                      onChange={(e) => setMortgageData(prev => ({ ...prev, downPaymentPercent: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: primaryColor }}
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                      <span>5%</span>
                      <span>{formatPrice(listing.price * mortgageData.downPaymentPercent / 100)}</span>
                      <span>50%</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex justify-between text-sm text-white/60 mb-2">
                      <span>Interest Rate</span>
                      <span>{mortgageData.interestRate}%</span>
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="12"
                      step="0.25"
                      value={mortgageData.interestRate}
                      onChange={(e) => setMortgageData(prev => ({ ...prev, interestRate: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: primaryColor }}
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                      <span>3%</span>
                      <span>12%</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Loan Term</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[15, 20, 30].map((term) => (
                        <button
                          key={term}
                          onClick={() => setMortgageData(prev => ({ ...prev, loanTerm: term }))}
                          className="py-2 rounded-lg text-sm font-medium transition"
                          style={{
                            backgroundColor: mortgageData.loanTerm === term ? primaryColor : 'rgba(255,255,255,0.05)',
                            color: mortgageData.loanTerm === term ? '#000' : '#fff',
                          }}
                        >
                          {term} yrs
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Payment Breakdown */}
                <div className="mt-6 pt-6 border-t border-white/10 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Loan Amount</span>
                    <span>{formatPrice(listing.price * (1 - mortgageData.downPaymentPercent / 100))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Principal & Interest</span>
                    <span>{monthlyPayment ? formatPrice(monthlyPayment) : '-'}</span>
                  </div>
                  {listing.hoa_fees !== null && listing.hoa_fees !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-white/60">HOA</span>
                      <span>${listing.hoa_fees}/mo</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* ============================================ */}
            {/* AGENT CONTACT CARD */}
            {/* ============================================ */}
            {agent && (
              <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                  {agent.avatar ? (
                    <img 
                      src={agent.avatar} 
                      alt={agent.name}
                      className="w-16 h-16 rounded-full object-cover border-2"
                      style={{ borderColor: primaryColor }}
                    />
                  ) : (
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                      style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                    >
                      {agent.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg">{agent.name}</h3>
                    {agent.title && <p className="text-white/60 text-sm">{agent.title}</p>}
                    {agent.company && <p className="text-white/60 text-sm">{agent.company}</p>}
                  </div>
                </div>
                
                {/* Brand Logo */}
                {brand?.logo && (
                  <div className="mb-6">
                    <img 
                      src={brand.logo} 
                      alt={agent.company || 'Company logo'}
                      className="max-h-12 object-contain"
                    />
                  </div>
                )}
                
                {/* Contact Buttons */}
                <div className="space-y-3 mb-6">
                  {agent.phone && (
                    <a
                      href={`tel:${agent.phone}`}
                      className="flex items-center justify-center gap-2 w-full py-3 font-semibold rounded-xl transition hover:opacity-90"
                      style={{ backgroundColor: primaryColor, color: '#000' }}
                    >
                      <Phone className="w-4 h-4" />
                      Call {agent.phone}
                    </a>
                  )}
                  {agent.email && (
                    <a
                      href={`mailto:${agent.email}?subject=Inquiry about ${listing.address || listing.title}`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 font-semibold rounded-xl hover:bg-white/20 transition"
                    >
                      <Mail className="w-4 h-4" />
                      Email Agent
                    </a>
                  )}
                </div>
                
                {/* Contact Form */}
                <div className="pt-6 border-t border-white/10">
                  <h4 className="font-semibold mb-4">Send a Message</h4>
                  
                  {formSubmitted ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                        <Check className="w-6 h-6 text-green-500" />
                      </div>
                      <p className="font-semibold mb-1">Message Sent!</p>
                      <p className="text-sm text-white/60">The agent will get back to you soon.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <input
                        type="text"
                        placeholder="Your Name"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none transition"
                        style={{ borderColor: contactForm.name ? primaryColor : undefined }}
                      />
                      <input
                        type="email"
                        placeholder="Email Address"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none transition"
                        style={{ borderColor: contactForm.email ? primaryColor : undefined }}
                      />
                      <input
                        type="tel"
                        placeholder="Phone (optional)"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none transition"
                      />
                      <textarea
                        placeholder="I'm interested in this property..."
                        required
                        rows={3}
                        value={contactForm.message}
                        onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none transition resize-none"
                        style={{ borderColor: contactForm.message ? primaryColor : undefined }}
                      />
                      
                      {submitError && (
                        <p className="text-red-400 text-sm">{submitError}</p>
                      )}
                      
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                        style={{ backgroundColor: primaryColor, color: '#000' }}
                      >
                        {isSubmitting ? 'Sending...' : 'Send Message'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ============================================ */}
      {/* LIGHTBOX */}
      {/* ============================================ */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition z-10"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevPhoto() }}
                className="absolute left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button
                onClick={(e) => { e.stopPropagation(); nextPhoto() }}
                className="absolute right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition"
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          
          {/* Image */}
          <img
            src={photos[currentPhoto]}
            alt={`Photo ${currentPhoto + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
            {currentPhoto + 1} / {photos.length}
          </div>
          
          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto py-2 px-4">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentPhoto(index) }}
                  className={`w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                    index === currentPhoto ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ borderColor: index === currentPhoto ? primaryColor : 'transparent' }}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <span>Powered by</span>
            <a 
              href="https://snap-r.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-semibold hover:underline"
              style={{ color: primaryColor }}
            >
              SnapR
            </a>
          </div>
          <div className="text-white/40 text-sm">
            © {new Date().getFullYear()} {agent?.company || 'All rights reserved'}
          </div>
        </div>
      </footer>

      {/* Ken Burns Animation Styles */}
      <style jsx global>{`
        @keyframes kenBurns {
          0% {
            transform: scale(1) translate(0, 0);
          }
          50% {
            transform: scale(1.08) translate(-1%, -0.5%);
          }
          100% {
            transform: scale(1) translate(0, 0);
          }
        }
        .ken-burns-active {
          animation: kenBurns 12s ease-in-out infinite;
        }
        
        /* Custom range slider */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}
