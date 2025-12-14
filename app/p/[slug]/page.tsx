import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Bed, Bath, Square, MapPin, Phone, Mail, Calendar } from 'lucide-react'

export default async function PropertySite({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  
  // Fetch site and listing data
  const { data: site } = await supabase
    .from('property_sites')
    .select('*, listings(*)')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!site || !site.listings) notFound()

  const listing = site.listings
  const agent = site.agent_info || {}
  const colors = site.custom_colors || { primary: '#D4AF37', secondary: '#1A1A1A' }

  // Increment views
  await supabase.from('property_sites').update({ views: (site.views || 0) + 1 }).eq('id', site.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-[60vh] min-h-[400px]">
        {listing.photos?.[0] && (
          <img src={listing.photos[0]} alt={listing.address} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: colors.primary }}>
              {listing.status || 'For Sale'}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{listing.address}</h1>
            <div className="flex items-center gap-2 text-white/80 mb-4">
              <MapPin className="w-4 h-4" />
              <span>{listing.city}, {listing.state} {listing.zip_code}</span>
            </div>
            <div className="text-4xl font-bold" style={{ color: colors.primary }}>
              ${listing.price?.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                <Bed className="w-8 h-8 mx-auto mb-2" style={{ color: colors.primary }} />
                <div className="text-3xl font-bold">{listing.bedrooms || '-'}</div>
                <div className="text-gray-500">Bedrooms</div>
              </div>
              <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                <Bath className="w-8 h-8 mx-auto mb-2" style={{ color: colors.primary }} />
                <div className="text-3xl font-bold">{listing.bathrooms || '-'}</div>
                <div className="text-gray-500">Bathrooms</div>
              </div>
              <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                <Square className="w-8 h-8 mx-auto mb-2" style={{ color: colors.primary }} />
                <div className="text-3xl font-bold">{listing.square_feet?.toLocaleString() || '-'}</div>
                <div className="text-gray-500">Sq Ft</div>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">About This Property</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{listing.description}</p>
              </div>
            )}

            {/* Photo Gallery */}
            {listing.photos?.length > 1 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Photo Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {listing.photos.slice(1, 7).map((photo: string, i: number) => (
                    <img key={i} src={photo} alt={`Photo ${i + 2}`} className="w-full aspect-[4/3] object-cover rounded-lg" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Agent Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-6">
              <h3 className="text-lg font-bold mb-4">Contact Agent</h3>
              {agent.photo && (
                <img src={agent.photo} alt={agent.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
              )}
              <div className="text-center mb-4">
                <div className="font-bold text-lg">{agent.name || 'Contact Us'}</div>
                {agent.title && <div className="text-gray-500 text-sm">{agent.title}</div>}
                {agent.company && <div className="text-gray-500 text-sm">{agent.company}</div>}
              </div>
              <div className="space-y-3">
                {agent.phone && (
                  <a href={`tel:${agent.phone}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                    <Phone className="w-5 h-5" style={{ color: colors.primary }} />
                    <span>{agent.phone}</span>
                  </a>
                )}
                {agent.email && (
                  <a href={`mailto:${agent.email}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                    <Mail className="w-5 h-5" style={{ color: colors.primary }} />
                    <span className="truncate">{agent.email}</span>
                  </a>
                )}
              </div>
              <button className="w-full mt-4 py-3 rounded-lg font-bold text-white transition" style={{ backgroundColor: colors.primary }}>
                Schedule a Showing
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t py-6 text-center text-gray-400 text-sm">
        <p>Property website powered by <span className="font-bold" style={{ color: colors.primary }}>SnapR</span></p>
      </div>
    </div>
  )
}
