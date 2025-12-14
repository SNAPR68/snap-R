'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Mail, Sparkles, Copy, Check, Download, Eye } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const TONES = [
  { id: 'professional', name: 'Professional', emoji: '💼' },
  { id: 'friendly', name: 'Friendly', emoji: '😊' },
  { id: 'luxury', name: 'Luxury', emoji: '✨' },
  { id: 'urgent', name: 'Urgent', emoji: '🔥' },
]

const POST_TYPES = [
  { id: 'just-listed', name: 'Just Listed' },
  { id: 'open-house', name: 'Open House' },
  { id: 'price-reduced', name: 'Price Reduced' },
  { id: 'just-sold', name: 'Just Sold' },
]

function EmailCreatorContent() {
  const searchParams = useSearchParams()
  const listingId = searchParams.get('listing')

  const [listing, setListing] = useState<any>(null)
  const [postType, setPostType] = useState('just-listed')
  const [tone, setTone] = useState('professional')
  const [generating, setGenerating] = useState(false)
  const [email, setEmail] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [agentInfo, setAgentInfo] = useState({ name: '', phone: '', email: '' })

  useEffect(() => {
    if (listingId) fetchListing()
    fetchAgentInfo()
  }, [listingId])

  const fetchListing = async () => {
    try {
      const res = await fetch(`/api/listings/${listingId}`)
      const data = await res.json()
      setListing(data.listing)
    } catch (e) { console.error(e) }
  }

  const fetchAgentInfo = async () => {
    try {
      const res = await fetch('/api/brand-kit')
      const data = await res.json()
      if (data.brandKit) {
        setAgentInfo({
          name: data.brandKit.agent_name || '',
          phone: data.brandKit.phone || '',
          email: data.brandKit.email || ''
        })
      }
    } catch (e) { console.error(e) }
  }

  const generateEmail = async () => {
    if (!listing) return
    setGenerating(true)
    try {
      const res = await fetch('/api/email-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: {
            address: listing.address,
            city: listing.city,
            state: listing.state,
            price: listing.price,
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            sqft: listing.square_feet
          },
          postType,
          agentInfo,
          tone
        })
      })
      const data = await res.json()
      setEmail(data.email)
    } catch (e) { console.error(e) }
    finally { setGenerating(false) }
  }

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const downloadHTML = () => {
    if (!email) return
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${email.subject}</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
${listing?.photos?.[0] ? `<img src="${listing.photos[0]}" style="width: 100%; border-radius: 8px; margin-bottom: 20px;" />` : ''}
${email.body}
<div style="text-align: center; margin-top: 30px;">
<a href="#" style="background: #D4AF37; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">${email.ctaText}</a>
</div>
</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `email-${postType}-${Date.now()}.html`
    a.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/content-studio"><Button variant="ghost" size="sm" className="text-white/60 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
            <h1 className="text-xl font-bold flex items-center gap-2"><Mail className="w-5 h-5 text-[#D4AF37]" />Email Marketing</h1>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 gap-8">
          {/* Left - Controls */}
          <div className="space-y-6">
            {/* Listing Selection */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 className="text-sm font-medium text-white/60 mb-3">Property</h3>
              {listing ? (
                <div className="flex gap-4">
                  {listing.photos?.[0] && <img src={listing.photos[0]} alt="" className="w-20 h-20 rounded-lg object-cover" />}
                  <div>
                    <div className="font-medium">{listing.address}</div>
                    <div className="text-sm text-white/50">{listing.city}, {listing.state}</div>
                    <div className="text-[#D4AF37] font-bold mt-1">${listing.price?.toLocaleString()}</div>
                  </div>
                </div>
              ) : (
                <Link href="/dashboard/listings"><Button variant="outline" className="w-full border-white/20">Select a Listing</Button></Link>
              )}
            </div>

            {/* Post Type */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 className="text-sm font-medium text-white/60 mb-3">Email Type</h3>
              <div className="grid grid-cols-2 gap-2">
                {POST_TYPES.map(t => (
                  <button key={t.id} onClick={() => setPostType(t.id)} className={`p-3 rounded-lg text-sm transition ${postType === t.id ? 'bg-[#D4AF37] text-black font-medium' : 'bg-white/5 hover:bg-white/10'}`}>{t.name}</button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 className="text-sm font-medium text-white/60 mb-3">Tone</h3>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map(t => (
                  <button key={t.id} onClick={() => setTone(t.id)} className={`p-3 rounded-lg text-sm transition flex items-center gap-2 ${tone === t.id ? 'bg-[#D4AF37] text-black font-medium' : 'bg-white/5 hover:bg-white/10'}`}>
                    <span>{t.emoji}</span>{t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button onClick={generateEmail} disabled={!listing || generating} className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-black font-bold h-12">
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 mr-2" />Generate Email</>}
            </Button>
          </div>

          {/* Right - Preview */}
          <div className="space-y-4">
            {email ? (
              <>
                {/* Subject */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-white/50">Subject Line</span>
                    <button onClick={() => copyText(email.subject, 'subject')} className="text-xs text-[#D4AF37]">{copied === 'subject' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
                  </div>
                  <div className="font-medium">{email.subject}</div>
                </div>

                {/* Preview Text */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-white/50">Preview Text</span>
                    <button onClick={() => copyText(email.preview, 'preview')} className="text-xs text-[#D4AF37]">{copied === 'preview' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
                  </div>
                  <div className="text-sm text-white/80">{email.preview}</div>
                </div>

                {/* Body Preview */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-white/50">Email Body</span>
                    <div className="flex gap-2">
                      <button onClick={() => setShowPreview(!showPreview)} className="text-xs text-[#D4AF37] flex items-center gap-1"><Eye className="w-3 h-3" />{showPreview ? 'Raw' : 'Preview'}</button>
                      <button onClick={() => copyText(email.body, 'body')} className="text-xs text-[#D4AF37]">{copied === 'body' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
                    </div>
                  </div>
                  {showPreview ? (
                    <div className="bg-white rounded-lg p-4 text-gray-800 text-sm" dangerouslySetInnerHTML={{ __html: email.body }} />
                  ) : (
                    <div className="text-sm text-white/80 whitespace-pre-wrap font-mono text-xs">{email.body}</div>
                  )}
                </div>

                {/* CTA */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <span className="text-xs text-white/50">Call-to-Action Button</span>
                  <div className="mt-2"><button className="bg-[#D4AF37] text-black font-bold px-6 py-2 rounded-lg">{email.ctaText}</button></div>
                </div>

                {/* Download */}
                <Button onClick={downloadHTML} variant="outline" className="w-full border-white/20"><Download className="w-4 h-4 mr-2" />Download HTML</Button>
              </>
            ) : (
              <div className="bg-white/5 rounded-xl p-12 border border-white/10 text-center">
                <Mail className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <h3 className="text-lg font-medium mb-2">Generate an Email</h3>
                <p className="text-white/50 text-sm">Select a listing and click generate to create your email marketing template</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EmailMarketing() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>}><EmailCreatorContent /></Suspense>
}
