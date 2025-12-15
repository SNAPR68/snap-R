'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, Clock, Home, ExternalLink, Copy, Check, Search, Download, ChevronDown, ChevronRight, AlertTriangle, Eye, Share2, BarChart3 } from 'lucide-react'

interface Photo { id: string; status: 'pending' | 'approved' | 'rejected'; rejectionReason?: string; approvedBy?: string; approvedAt?: string }
interface ShareLink { id: string; token: string; clientName?: string; clientEmail?: string; createdAt: string; lastAccessed?: string; isActive: boolean }
interface Listing { id: string; title: string; address?: string; city?: string; state?: string; thumbnail?: string; stats: { total: number; approved: number; rejected: number; pending: number }; shareLinks: ShareLink[]; photos: Photo[] }
interface OverallStats { totalListings: number; totalPhotos: number; totalApproved: number; totalRejected: number; totalPending: number; listingsWithPending: number; listingsWithRejected: number }
type FilterType = 'all' | 'pending' | 'rejected' | 'approved' | 'needs-attention'

export default function ApprovalsDashboard({ listings, overallStats }: { listings: Listing[]; overallStats: OverallStats }) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [expandedListing, setExpandedListing] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const filteredListings = listings.filter(listing => {
    if (search) {
      const searchLower = search.toLowerCase()
      if (!listing.title.toLowerCase().includes(searchLower) && !listing.address?.toLowerCase().includes(searchLower)) return false
    }
    switch (filter) {
      case 'pending': return listing.stats.pending > 0
      case 'rejected': return listing.stats.rejected > 0
      case 'approved': return listing.stats.approved === listing.stats.total && listing.stats.total > 0
      case 'needs-attention': return listing.stats.rejected > 0 || (listing.stats.pending > 0 && listing.shareLinks.length > 0)
      default: return true
    }
  })

  const copyShareLink = (token: string) => { navigator.clipboard.writeText(`${window.location.origin}/share/${token}`); setCopiedLink(token); setTimeout(() => setCopiedLink(null), 2000) }
  const getStatusColor = (l: Listing) => l.stats.rejected > 0 ? 'border-red-500/50 bg-red-500/5' : l.stats.pending > 0 && l.shareLinks.length > 0 ? 'border-amber-500/50 bg-amber-500/5' : l.stats.approved === l.stats.total && l.stats.total > 0 ? 'border-green-500/50 bg-green-500/5' : 'border-white/10'
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="bg-[#111] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Client Approvals</h1><p className="text-white/50 mt-1">Track photo approvals across all listings</p></div>
          <Link href="/dashboard" className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20">← Back to Dashboard</Link>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-[#111] border border-white/10 rounded-xl p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-500/20 rounded-lg"><BarChart3 className="w-5 h-5 text-blue-400" /></div><div><p className="text-2xl font-bold">{overallStats.totalPhotos}</p><p className="text-xs text-white/50">Total Photos</p></div></div></div>
          <div className="bg-[#111] border border-white/10 rounded-xl p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-500/20 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-400" /></div><div><p className="text-2xl font-bold text-green-400">{overallStats.totalApproved}</p><p className="text-xs text-white/50">Approved</p></div></div></div>
          <div className="bg-[#111] border border-white/10 rounded-xl p-4"><div className="flex items-center gap-3"><div className="p-2 bg-red-500/20 rounded-lg"><XCircle className="w-5 h-5 text-red-400" /></div><div><p className="text-2xl font-bold text-red-400">{overallStats.totalRejected}</p><p className="text-xs text-white/50">Rejected</p></div></div></div>
          <div className="bg-[#111] border border-white/10 rounded-xl p-4"><div className="flex items-center gap-3"><div className="p-2 bg-amber-500/20 rounded-lg"><Clock className="w-5 h-5 text-amber-400" /></div><div><p className="text-2xl font-bold text-amber-400">{overallStats.totalPending}</p><p className="text-xs text-white/50">Pending</p></div></div></div>
          <div className="bg-[#111] border border-white/10 rounded-xl p-4"><div className="flex items-center gap-3"><div className="p-2 bg-purple-500/20 rounded-lg"><AlertTriangle className="w-5 h-5 text-purple-400" /></div><div><p className="text-2xl font-bold text-purple-400">{overallStats.listingsWithRejected}</p><p className="text-xs text-white/50">Need Attention</p></div></div></div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" /><input type="text" placeholder="Search listings..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500" /></div>
          <div className="flex gap-2 flex-wrap">
            {[{ id: 'all', label: 'All', icon: Home }, { id: 'needs-attention', label: 'Needs Attention', icon: AlertTriangle }, { id: 'pending', label: 'Pending', icon: Clock }, { id: 'rejected', label: 'Rejected', icon: XCircle }, { id: 'approved', label: 'Completed', icon: CheckCircle2 }].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id as FilterType)} className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${filter === f.id ? 'bg-amber-500 text-black' : 'bg-white/5 hover:bg-white/10'}`}><f.icon className="w-4 h-4" />{f.label}</button>
            ))}
          </div>
        </div>
        {filteredListings.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10"><Home className="w-16 h-16 text-white/20 mx-auto mb-4" /><h3 className="text-xl font-medium mb-2">No listings found</h3><p className="text-white/40">{filter !== 'all' ? 'Try changing your filter' : 'Create a listing to get started'}</p></div>
        ) : (
          <div className="space-y-4">
            {filteredListings.map(listing => (
              <div key={listing.id} className={`bg-[#111] border rounded-xl overflow-hidden transition-all ${getStatusColor(listing)}`}>
                <div className="p-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setExpandedListing(expandedListing === listing.id ? null : listing.id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-14 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">{listing.thumbnail ? <img src={listing.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Home className="w-6 h-6 text-white/20" /></div>}</div>
                    <div className="flex-1 min-w-0"><h3 className="font-semibold truncate">{listing.title}</h3><p className="text-sm text-white/50 truncate">{[listing.address, listing.city, listing.state].filter(Boolean).join(', ') || 'No address'}</p></div>
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-center"><p className="text-lg font-bold text-green-400">{listing.stats.approved}</p><p className="text-xs text-white/40">Approved</p></div>
                      <div className="text-center"><p className="text-lg font-bold text-red-400">{listing.stats.rejected}</p><p className="text-xs text-white/40">Rejected</p></div>
                      <div className="text-center"><p className="text-lg font-bold text-amber-400">{listing.stats.pending}</p><p className="text-xs text-white/40">Pending</p></div>
                    </div>
                    <div className="hidden lg:block w-32"><div className="h-2 bg-white/10 rounded-full overflow-hidden flex"><div className="h-full bg-green-500" style={{ width: `${listing.stats.total > 0 ? (listing.stats.approved / listing.stats.total) * 100 : 0}%` }} /><div className="h-full bg-red-500" style={{ width: `${listing.stats.total > 0 ? (listing.stats.rejected / listing.stats.total) * 100 : 0}%` }} /></div><p className="text-xs text-white/40 mt-1 text-center">{listing.stats.total} photos</p></div>
                    <div className="flex items-center gap-2"><Link href={`/dashboard/studio?listing=${listing.id}`} onClick={e => e.stopPropagation()} className="p-2 bg-white/10 rounded-lg hover:bg-white/20" title="Open in Studio"><Eye className="w-4 h-4" /></Link>{expandedListing === listing.id ? <ChevronDown className="w-5 h-5 text-white/50" /> : <ChevronRight className="w-5 h-5 text-white/50" />}</div>
                  </div>
                  <div className="flex md:hidden items-center gap-4 mt-3 pt-3 border-t border-white/5"><span className="flex items-center gap-1 text-sm text-green-400"><CheckCircle2 className="w-4 h-4" /> {listing.stats.approved}</span><span className="flex items-center gap-1 text-sm text-red-400"><XCircle className="w-4 h-4" /> {listing.stats.rejected}</span><span className="flex items-center gap-1 text-sm text-amber-400"><Clock className="w-4 h-4" /> {listing.stats.pending}</span></div>
                </div>
                {expandedListing === listing.id && (
                  <div className="border-t border-white/10 p-4 bg-black/20">
                    {listing.shareLinks.length > 0 && <div className="mb-4"><h4 className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2"><Share2 className="w-4 h-4" /> Share Links</h4><div className="space-y-2">{listing.shareLinks.map(link => (<div key={link.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"><div className="flex-1 min-w-0"><p className="font-mono text-sm text-amber-400 truncate">/share/{link.token}</p><p className="text-xs text-white/40">{link.clientName || 'No name'}{link.clientEmail && ` • ${link.clientEmail}`}{link.lastAccessed && ` • Last viewed: ${formatDate(link.lastAccessed)}`}</p></div><button onClick={() => copyShareLink(link.token)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">{copiedLink === link.token ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}</button><a href={`/share/${link.token}`} target="_blank" className="p-2 bg-white/10 rounded-lg hover:bg-white/20"><ExternalLink className="w-4 h-4" /></a></div>))}</div></div>}
                    {listing.photos.filter(p => p.status === 'rejected').length > 0 && <div className="mb-4"><h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2"><XCircle className="w-4 h-4" /> Rejected Photos ({listing.photos.filter(p => p.status === 'rejected').length})</h4><div className="space-y-2">{listing.photos.filter(p => p.status === 'rejected').map((photo, i) => (<div key={photo.id} className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"><XCircle className="w-4 h-4 text-red-400 flex-shrink-0" /><div className="flex-1"><p className="text-sm">Photo #{i + 1}</p>{photo.rejectionReason && <p className="text-xs text-red-400/70">&quot;{photo.rejectionReason}&quot;</p>}</div><p className="text-xs text-white/40">{photo.approvedBy && `by ${photo.approvedBy}`}</p></div>))}</div></div>}
                    <div className="flex gap-3 mt-4 pt-4 border-t border-white/10"><Link href={`/dashboard/studio?listing=${listing.id}`} className="px-4 py-2 bg-amber-500 text-black rounded-lg font-medium hover:bg-amber-400 flex items-center gap-2"><Eye className="w-4 h-4" /> View in Studio</Link>{listing.stats.approved > 0 && <a href={`/api/download-all?listing=${listing.id}&approved=true`} className="px-4 py-2 bg-white/10 rounded-lg font-medium hover:bg-white/20 flex items-center gap-2"><Download className="w-4 h-4" /> Download Approved</a>}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
