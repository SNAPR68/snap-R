'use client'

import { useState } from 'react'
import { MapPin, Bed, Bath, Square, Phone, Mail, Share2, ChevronLeft, ChevronRight, X, Calendar, Home, Car, Sparkles } from 'lucide-react'

interface Listing {
  id?: string
  title: string
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
}

interface Agent {
  name: string
  email: string | null
  phone: string | null
}

interface Props {
  photos: string[]
  listing: Listing
  agent: Agent | null
}

export default function PropertySiteClient({ photos, listing, agent }: Props) {
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const location = [listing.city, listing.state].filter(Boolean).join(', ')
  const fullAddress = [listing.address, listing.city, listing.state, listing.postal_code].filter(Boolean).join(', ')

  const nextPhoto = () => setCurrentPhoto((prev) => (prev + 1) % photos.length)
  const prevPhoto = () => setCurrentPhoto((prev) => (prev - 1 + photos.length) % photos.length)

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: listing.title,
        text: `Check out this property: ${listing.title}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    
    console.log('=== Form Submit Debug ===')
    console.log('contactForm:', contactForm)
    console.log('agent:', agent)
    console.log('listing.id:', listing.id)
    
    const requestBody = {
      name: contactForm.name,
      email: contactForm.email,
      phone: contactForm.phone,
      message: contactForm.message,
      listingId: listing.id,
      listingTitle: listing.title,
      listingAddress: listing.address,
      agentEmail: agent?.email,
      agentName: agent?.name
    }
    
    console.log('Request body being sent:', JSON.stringify(requestBody, null, 2))
    
    try {
      const response = await fetch('/api/property-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) throw new Error('Failed to send')
      setFormSubmitted(true)
    } catch (error) {
      setSubmitError('Failed to send message. Please try again.')
      console.error('Contact form error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Hero with Gallery */}
      <section className="relative">
        {/* Main Image */}
        <div className="relative h-[70vh] min-h-[500px]">
          {photos.length > 0 ? (
            <img 
              src={photos[currentPhoto]} 
              alt={`${listing.title} - Photo ${currentPhoto + 1}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <Home className="w-24 h-24 text-gray-600" />
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
          
          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <button 
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Photo Counter */}
          {photos.length > 1 && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-sm">
              {currentPhoto + 1} / {photos.length}
            </div>
          )}

          {/* Property Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-start justify-between">
                <div>
                  {listing.price && (
                    <p className="text-4xl md:text-5xl font-bold text-amber-500 mb-2">
                      ${listing.price.toLocaleString()}
                    </p>
                  )}
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{listing.title}</h1>
                  {fullAddress && (
                    <p className="flex items-center gap-2 text-white/70">
                      <MapPin className="w-4 h-4" />
                      {fullAddress}
                    </p>
                  )}
                </div>
                <button 
                  onClick={handleShare}
                  className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Strip */}
        {photos.length > 1 && (
          <div className="bg-gray-900 py-4 px-6 overflow-x-auto">
            <div className="max-w-6xl mx-auto flex gap-2">
              {photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPhoto(i)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    i === currentPhoto ? 'border-amber-500' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Property Details */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {listing.bedrooms && (
                  <div className="bg-gray-900 rounded-xl p-4 text-center">
                    <Bed className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                    <p className="text-2xl font-bold">{listing.bedrooms}</p>
                    <p className="text-sm text-white/50">Bedrooms</p>
                  </div>
                )}
                {listing.bathrooms && (
                  <div className="bg-gray-900 rounded-xl p-4 text-center">
                    <Bath className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                    <p className="text-2xl font-bold">{listing.bathrooms}</p>
                    <p className="text-sm text-white/50">Bathrooms</p>
                  </div>
                )}
                {listing.square_feet && (
                  <div className="bg-gray-900 rounded-xl p-4 text-center">
                    <Square className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                    <p className="text-2xl font-bold">{listing.square_feet.toLocaleString()}</p>
                    <p className="text-sm text-white/50">Sq Ft</p>
                  </div>
                )}
                {listing.year_built && (
                  <div className="bg-gray-900 rounded-xl p-4 text-center">
                    <Calendar className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                    <p className="text-2xl font-bold">{listing.year_built}</p>
                    <p className="text-sm text-white/50">Year Built</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {listing.description && (
                <div>
                  <h2 className="text-xl font-bold mb-4">About This Property</h2>
                  <p className="text-white/70 leading-relaxed whitespace-pre-line">
                    {listing.description}
                  </p>
                </div>
              )}

              {/* Additional Details */}
              {(listing.property_type || listing.lot_size || listing.parking) && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Property Details</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {listing.property_type && (
                      <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                        <Home className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="text-sm text-white/50">Property Type</p>
                          <p className="font-medium capitalize">{listing.property_type}</p>
                        </div>
                      </div>
                    )}
                    {listing.lot_size && (
                      <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                        <Square className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="text-sm text-white/50">Lot Size</p>
                          <p className="font-medium">{listing.lot_size}</p>
                        </div>
                      </div>
                    )}
                    {listing.parking && (
                      <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                        <Car className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="text-sm text-white/50">Parking</p>
                          <p className="font-medium">{listing.parking}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Features */}
              {listing.features && listing.features.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Features & Amenities</h2>
                  <div className="grid md:grid-cols-2 gap-2">
                    {listing.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-white/70">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900 rounded-2xl p-6 sticky top-6">
                <h3 className="text-lg font-bold mb-4">Interested in this property?</h3>
                
                {agent && (
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <p className="font-medium text-lg">{agent.name}</p>
                    {agent.phone && (
                      <a href={`tel:${agent.phone}`} className="flex items-center gap-2 text-white/70 hover:text-amber-500 mt-2">
                        <Phone className="w-4 h-4" />
                        {agent.phone}
                      </a>
                    )}
                    {agent.email && (
                      <a href={`mailto:${agent.email}`} className="flex items-center gap-2 text-white/70 hover:text-amber-500 mt-1">
                        <Mail className="w-4 h-4" />
                        {agent.email}
                      </a>
                    )}
                  </div>
                )}

                {formSubmitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-green-400" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Message Sent!</h4>
                    <p className="text-white/60 text-sm">We'll get back to you soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Your Name"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <textarea
                      placeholder="I'm interested in this property..."
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 transition-colors resize-none"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                    {submitError && (
                      <p className="text-red-500 text-sm mt-2">{submitError}</p>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button 
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full"
          >
            <X className="w-8 h-8" />
          </button>
          
          <button 
            onClick={prevPhoto}
            className="absolute left-4 p-3 bg-white/10 rounded-full hover:bg-white/20"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <img 
            src={photos[currentPhoto]} 
            alt="" 
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
          
          <button 
            onClick={nextPhoto}
            className="absolute right-4 p-3 bg-white/10 rounded-full hover:bg-white/20"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
            {currentPhoto + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  )
}