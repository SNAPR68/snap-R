import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Home, Image, MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ListingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: listings } = await supabase.from('listings').select('*, photos(id, raw_url, processed_url, status)').eq('user_id', user.id).order('created_at', { ascending: false })

  const listingsWithThumbnails = await Promise.all((listings || []).map(async (listing: any) => {
    const photos = listing.photos || []
    const firstPhoto = photos.find((p: any) => p.processed_url) || photos[0]
    let thumbnail = null
    if (firstPhoto) {
      const path = firstPhoto.processed_url || firstPhoto.raw_url
      if (path && !path.startsWith('http')) { const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600); thumbnail = data?.signedUrl } else { thumbnail = path }
    }
    return { ...listing, thumbnail, photoCount: photos.length }
  }))

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-3xl font-bold">My Listings</h1><p className="text-white/50 mt-1">{listingsWithThumbnails.length} properties</p></div>
          <Link href="/listings/new" className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-xl font-semibold hover:bg-amber-400"><Plus className="w-5 h-5" />New Listing</Link>
        </div>
        {listingsWithThumbnails.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10"><Home className="w-16 h-16 text-white/20 mx-auto mb-4" /><h3 className="text-xl font-medium mb-2">No listings yet</h3><p className="text-white/40 mb-6">Create your first listing to get started</p><Link href="/listings/new" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-black rounded-xl font-semibold hover:bg-amber-400"><Plus className="w-5 h-5" />Create First Listing</Link></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{listingsWithThumbnails.map((listing: any) => (<Link key={listing.id} href={'/dashboard/studio?listing=' + listing.id} className="group bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-amber-500/50 transition-all"><div className="aspect-video relative">{listing.thumbnail ? <img src={listing.thumbnail} alt={listing.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center"><Home className="w-12 h-12 text-white/20" /></div>}<div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/70 rounded-lg text-xs"><Image className="w-3 h-3" />{listing.photoCount}</div></div><div className="p-4"><h3 className="font-semibold text-lg truncate group-hover:text-amber-400 transition-colors">{listing.title || listing.address || 'Untitled'}</h3>{listing.address && <p className="text-white/50 text-sm flex items-center gap-1 mt-1 truncate"><MapPin className="w-3 h-3 flex-shrink-0" />{listing.address}</p>}{listing.price && <p className="text-amber-400 font-semibold mt-2">${listing.price.toLocaleString()}</p>}</div></Link>))}</div>
        )}
      </div>
    </div>
  )
}
