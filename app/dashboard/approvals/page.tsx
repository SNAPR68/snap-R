import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ApprovalsDashboard from './ApprovalsDashboard'

export const dynamic = 'force-dynamic'

export default async function ApprovalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, address, city, state, created_at, photos(id, raw_url, processed_url, approval_status, approved_at, approved_by, rejection_reason, display_order), share_links(id, token, client_name, client_email, created_at, last_accessed_at, is_active)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const processedListings = await Promise.all(
    (listings || []).map(async (listing: any) => {
      const photos = listing.photos || []
      let thumbnail = null
      const firstPhoto = photos.find((p: any) => p.processed_url) || photos[0]
      if (firstPhoto) {
        const path = firstPhoto.processed_url || firstPhoto.raw_url
        if (path && !path.startsWith('http')) {
          const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600)
          thumbnail = data?.signedUrl
        } else thumbnail = path
      }
      const stats = {
        total: photos.length,
        approved: photos.filter((p: any) => p.approval_status === 'approved').length,
        rejected: photos.filter((p: any) => p.approval_status === 'rejected').length,
        pending: photos.filter((p: any) => p.approval_status === 'pending' || !p.approval_status).length
      }
      return {
        id: listing.id, title: listing.title || listing.address || 'Untitled',
        address: listing.address, city: listing.city, state: listing.state, thumbnail, stats,
        shareLinks: (listing.share_links || []).map((sl: any) => ({ id: sl.id, token: sl.token, clientName: sl.client_name, clientEmail: sl.client_email, createdAt: sl.created_at, lastAccessed: sl.last_accessed_at, isActive: sl.is_active })),
        photos: photos.map((p: any) => ({ id: p.id, status: p.approval_status || 'pending', rejectionReason: p.rejection_reason, approvedBy: p.approved_by, approvedAt: p.approved_at }))
      }
    })
  )

  const overallStats = {
    totalListings: processedListings.length,
    totalPhotos: processedListings.reduce((sum, l) => sum + l.stats.total, 0),
    totalApproved: processedListings.reduce((sum, l) => sum + l.stats.approved, 0),
    totalRejected: processedListings.reduce((sum, l) => sum + l.stats.rejected, 0),
    totalPending: processedListings.reduce((sum, l) => sum + l.stats.pending, 0),
    listingsWithPending: processedListings.filter(l => l.stats.pending > 0).length,
    listingsWithRejected: processedListings.filter(l => l.stats.rejected > 0).length
  }

  return <ApprovalsDashboard listings={processedListings} overallStats={overallStats} />
}
