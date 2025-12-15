'use client'
import { useState } from 'react'
import { X, Copy, Check, Link2, Mail, Loader2, UserCheck } from 'lucide-react'

interface Props {
  listingId: string
  listingTitle: string
  onClose: () => void
}

export default function ShareGalleryModal({ listingId, listingTitle, onClose }: Props) {
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [expiresInDays, setExpiresInDays] = useState(7)
  const [generating, setGenerating] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const generateLink = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, clientName, clientEmail, expiresInDays })
      })
      const data = await response.json()
      if (data.shareUrl) setShareUrl(data.shareUrl)
      else if (data.success && data.token) setShareUrl(`${window.location.origin}/share/${data.token}`)
      else alert(data.error || 'Failed to generate link')
    } catch (error) {
      console.error('Error generating link:', error)
      alert('Failed to generate link')
    }
    setGenerating(false)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendEmail = () => {
    const subject = encodeURIComponent(`Photo Gallery for Review: ${listingTitle}`)
    const body = encodeURIComponent(`Hi${clientName ? ' ' + clientName : ''},\n\nPlease review and approve the photos for ${listingTitle}.\n\nView Gallery: ${shareUrl}\n\nThank you!`)
    window.open(`mailto:${clientEmail}?subject=${subject}&body=${body}`)
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><UserCheck className="w-5 h-5 text-[#D4A017]" /> Share for Client Approval</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          {!shareUrl ? (
            <>
              <div>
                <label className="text-sm text-white/50 block mb-1">Client Name (optional)</label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="John Smith" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#D4A017]" />
              </div>
              <div>
                <label className="text-sm text-white/50 block mb-1">Client Email (optional)</label>
                <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@email.com" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#D4A017]" />
              </div>
              <div>
                <label className="text-sm text-white/50 block mb-1">Link Expires In</label>
                <select value={expiresInDays} onChange={e => setExpiresInDays(Number(e.target.value))} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#D4A017]">
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
              <button onClick={generateLink} disabled={generating} className="w-full py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50">
                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5" />}
                {generating ? 'Generating...' : 'Generate Approval Link'}
              </button>
            </>
          ) : (
            <>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-white/50 mb-2">Share Link:</p>
                <p className="text-[#D4A017] text-sm break-all font-mono">{shareUrl}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={copyLink} className="flex-1 py-3 bg-white/10 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-white/20 text-white">
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                {clientEmail && (
                  <button onClick={sendEmail} className="flex-1 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90">
                    <Mail className="w-5 h-5" /> Email Client
                  </button>
                )}
              </div>
              <div className="text-center">
                <button onClick={() => setShareUrl('')} className="text-white/50 text-sm hover:text-white">Generate New Link</button>
              </div>
            </>
          )}
        </div>
        <div className="p-4 border-t border-white/10 bg-white/5 rounded-b-2xl">
          <p className="text-xs text-white/40 text-center">Client can view photos and mark them as approved or rejected. You&apos;ll be notified when they submit their selections.</p>
        </div>
      </div>
    </div>
  )
}
