'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Sparkles, Download, Copy, Check, Home, Loader2, ChevronDown, Eye, Code } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Listing { id: string; title: string; address: string; city: string; state: string; postal_code: string; price: number | null; bedrooms: number | null; bathrooms: number | null; square_feet: number | null; description: string | null; thumbnail: string | null }
type EmailType = 'just-listed' | 'open-house' | 'price-reduced' | 'just-sold'
type Tone = 'professional' | 'friendly' | 'luxury' | 'urgent'
type ViewMode = 'preview' | 'html' | 'text'

export default function EmailMarketingClient() {
  const searchParams = useSearchParams()
  const listingId = searchParams.get('listing')
  const [listings, setListings] = useState<Listing[]>([])
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [emailType, setEmailType] = useState<EmailType>('just-listed')
  const [tone, setTone] = useState<Tone>('professional')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; html: string; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [agentName, setAgentName] = useState('Your Name')
  const [agentPhone, setAgentPhone] = useState('(555) 123-4567')
  const [agentEmail, setAgentEmail] = useState('agent@realestate.com')

  useEffect(() => { loadListings() }, [])
  useEffect(() => { if (listingId && listings.length > 0) { const l = listings.find(x => x.id === listingId); if (l) setSelectedListing(l) } }, [listingId, listings])

  const loadListings = async () => {
    setLoading(true)
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('full_name, email, phone').eq('id', user.id).single()
      if (profile) { if (profile.full_name) setAgentName(profile.full_name); if (profile.email) setAgentEmail(profile.email); if (profile.phone) setAgentPhone(profile.phone) }
      const { data: listingsData } = await supabase.from('listings').select('*, photos(id, raw_url, processed_url, status)').eq('user_id', user.id).order('created_at', { ascending: false })
      if (listingsData) {
        const processed = await Promise.all(listingsData.map(async (listing: any) => {
          const photos = listing.photos || []
          const firstPhoto = photos.find((p: any) => p.processed_url) || photos[0]
          let thumbnail = null
          if (firstPhoto) { const path = firstPhoto.processed_url || firstPhoto.raw_url; if (path && !path.startsWith('http')) { const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 86400); thumbnail = data?.signedUrl } else thumbnail = path }
          return { id: listing.id, title: listing.title || listing.address || 'Untitled', address: listing.address || '', city: listing.city || '', state: listing.state || '', postal_code: listing.postal_code || '', price: listing.price, bedrooms: listing.bedrooms, bathrooms: listing.bathrooms, square_feet: listing.square_feet, description: listing.description, thumbnail }
        }))
        setListings(processed)
      }
    } catch (error) { console.error('Error loading listings:', error) }
    setLoading(false)
  }

  const generateEmail = async () => {
    if (!selectedListing) return
    setGenerating(true); setGeneratedEmail(null)
    await new Promise(r => setTimeout(r, 1000))
    const { subject, textBody, htmlBody } = createEmailContent(selectedListing, emailType, tone)
    setGeneratedEmail({ subject, html: htmlBody, text: textBody })
    setGenerating(false)
  }

  const createEmailContent = (listing: Listing, type: EmailType, t: Tone) => {
    const priceStr = listing.price ? '$' + listing.price.toLocaleString() : 'Contact for Price'
    const location = [listing.city, listing.state].filter(Boolean).join(', ')
    const fullAddress = [listing.address, listing.city, listing.state, listing.postal_code].filter(Boolean).join(', ')
    const typeConfig: Record<EmailType, { badge: string; color: string; subject: string; headline: string }> = {
      'just-listed': { badge: 'JUST LISTED', color: '#D4AF37', subject: '🏠 Just Listed: ' + listing.title + ' in ' + location, headline: 'A New Property Has Hit The Market' },
      'open-house': { badge: 'OPEN HOUSE', color: '#22C55E', subject: '🚪 Open House This Weekend: ' + listing.title, headline: 'You Are Invited to an Exclusive Open House' },
      'price-reduced': { badge: 'PRICE REDUCED', color: '#EF4444', subject: '💰 Price Reduced: ' + listing.title + ' - Now ' + priceStr, headline: 'Great News - The Price Has Been Reduced!' },
      'just-sold': { badge: 'JUST SOLD', color: '#8B5CF6', subject: '🎉 Just Sold: ' + listing.title, headline: 'Another Happy Homeowner!' }
    }
    const config = typeConfig[type]
    const toneContent: Record<Tone, { greeting: string; intro: string; cta: string; closing: string; signoff: string }> = {
      professional: { greeting: 'Dear Valued Client,', intro: type === 'just-listed' ? 'I am pleased to present an exceptional property in ' + location + '.' : type === 'open-house' ? 'I would like to extend a personal invitation to view this property.' : type === 'price-reduced' ? 'I wanted to bring to your attention a significant price adjustment.' : 'I am delighted to announce this property has found new owners.', cta: 'Schedule a Private Viewing', closing: 'I look forward to assisting you.', signoff: 'Warm regards,' },
      friendly: { greeting: 'Hi there! 👋', intro: type === 'just-listed' ? 'I am so excited to share this amazing property with you!' : type === 'open-house' ? 'Great news! We are hosting an open house this weekend!' : type === 'price-reduced' ? 'Guess what? The price has been reduced!' : 'Amazing news - we just closed on this property!', cta: 'Let Us Schedule a Tour!', closing: 'Can not wait to hear from you!', signoff: 'Cheers,' },
      luxury: { greeting: 'Distinguished Client,', intro: type === 'just-listed' ? 'An extraordinary residence has become available in prestigious ' + location + '.' : type === 'open-house' ? 'You are cordially invited to an exclusive viewing.' : type === 'price-reduced' ? 'A rare opportunity has emerged with a new offering price.' : 'We are pleased to announce the successful acquisition.', cta: 'Arrange a Private Consultation', closing: 'It would be my privilege to guide you.', signoff: 'With distinction,' },
      urgent: { greeting: 'ATTENTION! ⚡', intro: type === 'just-listed' ? '🚨 DO NOT MISS THIS! A prime property just hit the market!' : type === 'open-house' ? '⏰ THIS WEEKEND ONLY! See this incredible home in person.' : type === 'price-reduced' ? '🔥 PRICE DROP ALERT! The sellers are motivated!' : '✅ ANOTHER ONE SOLD! Properties are moving FAST.', cta: 'CONTACT ME NOW!', closing: 'Do not wait - opportunities like this are rare!', signoff: 'Ready when you are,' }
    }
    const content = toneContent[t]
    const textBody = content.greeting + '\n\n' + content.intro + '\n\n' + config.badge + '\n\n' + listing.title + '\n' + fullAddress + '\n\n' + priceStr + '\n\n' + content.closing + '\n\n' + content.signoff + '\n' + agentName + '\n' + agentPhone + '\n' + agentEmail
    const htmlBody = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>' + config.subject + '</title></head><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;background:#f5f5f5"><table width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table width="600" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1)"><tr><td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:30px 40px;text-align:center"><p style="margin:0;color:#fff;font-size:14px;letter-spacing:2px;text-transform:uppercase">Real Estate</p></td></tr>' + (listing.thumbnail ? '<tr><td style="position:relative"><img src="' + listing.thumbnail + '" alt="' + listing.title + '" style="width:100%;height:300px;object-fit:cover;display:block"><div style="position:absolute;top:20px;left:20px;background:' + config.color + ';color:#000;padding:8px 20px;font-weight:bold;font-size:14px;letter-spacing:1px;border-radius:4px">' + config.badge + '</div></td></tr>' : '<tr><td style="padding:30px 40px 0;text-align:center"><span style="display:inline-block;background:' + config.color + ';color:#000;padding:10px 24px;font-weight:bold;font-size:14px;letter-spacing:1px;border-radius:4px">' + config.badge + '</span></td></tr>') + '<tr><td style="padding:40px"><h1 style="margin:0 0 10px;font-size:28px;font-weight:700;color:#1a1a2e">' + config.headline + '</h1><h2 style="margin:0 0 20px;font-size:20px;font-weight:600;color:#666">' + listing.title + '</h2><p style="margin:0 0 20px;font-size:16px;color:#333">' + content.greeting + '</p><p style="margin:0 0 30px;font-size:16px;color:#555;line-height:1.7">' + content.intro + '</p><table width="100%" cellspacing="0" cellpadding="0" style="background:#f8f9fa;border-radius:12px;margin-bottom:30px"><tr><td style="padding:25px"><p style="margin:0 0 15px;font-size:32px;font-weight:700;color:' + config.color + '">' + priceStr + '</p><p style="margin:0 0 20px;font-size:16px;color:#666">📍 ' + fullAddress + '</p><table width="100%" cellspacing="0" cellpadding="0"><tr>' + (listing.bedrooms ? '<td style="text-align:center;padding:15px;background:#fff;border-radius:8px"><p style="margin:0;font-size:24px;font-weight:700;color:#1a1a2e">' + listing.bedrooms + '</p><p style="margin:5px 0 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px">Beds</p></td>' : '') + (listing.bathrooms ? '<td style="text-align:center;padding:15px;background:#fff;border-radius:8px"><p style="margin:0;font-size:24px;font-weight:700;color:#1a1a2e">' + listing.bathrooms + '</p><p style="margin:5px 0 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px">Baths</p></td>' : '') + (listing.square_feet ? '<td style="text-align:center;padding:15px;background:#fff;border-radius:8px"><p style="margin:0;font-size:24px;font-weight:700;color:#1a1a2e">' + listing.square_feet.toLocaleString() + '</p><p style="margin:5px 0 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px">Sq Ft</p></td>' : '') + '</tr></table></td></tr></table><table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><a href="mailto:' + agentEmail + '?subject=Inquiry: ' + listing.title + '" style="display:inline-block;background:' + config.color + ';color:#000;text-decoration:none;font-weight:600;font-size:16px;padding:16px 40px;border-radius:8px">' + content.cta + '</a></td></tr></table><p style="margin:30px 0 0;font-size:16px;color:#555">' + content.closing + '</p><table cellspacing="0" cellpadding="0" style="margin-top:30px;border-top:1px solid #eee;padding-top:30px"><tr><td><p style="margin:0 0 5px;font-size:14px;color:#888">' + content.signoff + '</p><p style="margin:0 0 5px;font-size:18px;font-weight:600;color:#1a1a2e">' + agentName + '</p><p style="margin:0 0 3px;font-size:14px;color:#666">📞 ' + agentPhone + '</p><p style="margin:0;font-size:14px;color:#666">✉️ ' + agentEmail + '</p></td></tr></table></td></tr><tr><td style="background:#1a1a2e;padding:25px 40px;text-align:center"><p style="margin:0;font-size:12px;color:rgba(255,255,255,0.6)">Created with SnapR</p></td></tr></table></td></tr></table></body></html>'
    return { subject: config.subject, textBody, htmlBody }
  }

  const copyToClipboard = (content: string) => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const downloadHtml = () => { if (!generatedEmail) return; const blob = new Blob([generatedEmail.html], { type: 'text/html' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (selectedListing?.title.replace(/[^a-z0-9]/gi, '_') || 'email') + '_email.html'; a.click() }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="h-14 bg-[#111] border-b border-white/5 flex items-center px-4">
        <Link href="/dashboard/content-studio" className="flex items-center gap-2 hover:opacity-80"><ArrowLeft className="w-4 h-4 text-white/50" /><span className="text-white/50 text-sm">Back</span></Link>
        <div className="h-5 w-px bg-white/10 mx-4" />
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center"><Mail className="w-4 h-4" /></div><span className="font-bold">Email Marketing</span></div>
      </header>
      <div className="flex h-[calc(100vh-56px)]">
        <aside className="w-96 bg-[#111] border-r border-white/5 flex flex-col p-4 overflow-auto">
          <div className="mb-6"><h3 className="font-medium mb-2">Property</h3><div className="relative"><button onClick={() => setShowDropdown(!showDropdown)} className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/20">{selectedListing ? <div className="flex items-center gap-3">{selectedListing.thumbnail ? <img src={selectedListing.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"><Home className="w-5 h-5 text-white/30" /></div>}<div className="text-left"><p className="font-medium text-sm">{selectedListing.title}</p><p className="text-xs text-white/40">{selectedListing.address}</p></div></div> : <span className="text-white/50">Select a Listing</span>}<ChevronDown className="w-4 h-4 text-white/50" /></button>{showDropdown && <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden z-10 max-h-60 overflow-auto">{loading ? <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-500" /></div> : listings.length === 0 ? <div className="p-4 text-center text-white/40 text-sm">No listings found</div> : listings.map(l => <button key={l.id} onClick={() => { setSelectedListing(l); setShowDropdown(false); setGeneratedEmail(null) }} className={'w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors ' + (selectedListing?.id === l.id ? 'bg-blue-500/10' : '')}>{l.thumbnail ? <img src={l.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"><Home className="w-5 h-5 text-white/30" /></div>}<div className="text-left"><p className="font-medium text-sm">{l.title}</p><p className="text-xs text-white/40">{l.city}{l.city && l.state ? ', ' : ''}{l.state}</p></div></button>)}</div>}</div></div>
          <div className="mb-6"><h3 className="font-medium mb-2">Email Type</h3><div className="grid grid-cols-2 gap-2">{[{ id: 'just-listed', label: 'Just Listed', icon: '🏠', color: '#D4AF37' }, { id: 'open-house', label: 'Open House', icon: '🚪', color: '#22C55E' }, { id: 'price-reduced', label: 'Price Reduced', icon: '💰', color: '#EF4444' }, { id: 'just-sold', label: 'Just Sold', icon: '🎉', color: '#8B5CF6' }].map(type => <button key={type.id} onClick={() => { setEmailType(type.id as EmailType); setGeneratedEmail(null) }} className={'py-3 px-4 rounded-xl text-sm font-medium transition-all border ' + (emailType === type.id ? 'text-white border-current' : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10')} style={{ backgroundColor: emailType === type.id ? type.color + '20' : undefined, borderColor: emailType === type.id ? type.color : undefined, color: emailType === type.id ? type.color : undefined }}>{type.icon} {type.label}</button>)}</div></div>
          <div className="mb-6"><h3 className="font-medium mb-2">Tone</h3><div className="grid grid-cols-2 gap-2">{[{ id: 'professional', label: 'Professional', icon: '🏢' }, { id: 'friendly', label: 'Friendly', icon: '😊' }, { id: 'luxury', label: 'Luxury', icon: '✨' }, { id: 'urgent', label: 'Urgent', icon: '🔥' }].map(t => <button key={t.id} onClick={() => { setTone(t.id as Tone); setGeneratedEmail(null) }} className={'py-3 px-4 rounded-xl text-sm font-medium transition-all ' + (tone === t.id ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10')}>{t.icon} {t.label}</button>)}</div></div>
          <div className="mb-6"><h3 className="font-medium mb-2">Agent Info</h3><div className="space-y-2"><input type="text" value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Your Name" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500" /><input type="tel" value={agentPhone} onChange={e => setAgentPhone(e.target.value)} placeholder="Phone" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500" /><input type="email" value={agentEmail} onChange={e => setAgentEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500" /></div></div>
          <button onClick={generateEmail} disabled={!selectedListing || generating} className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed mt-auto">{generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}{generating ? 'Generating...' : 'Generate Email'}</button>
        </aside>
        <div className="flex-1 bg-[#080808] p-6 overflow-auto">
          {generatedEmail ? <div className="max-w-3xl mx-auto"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2">{[{ id: 'preview', label: 'Preview', icon: Eye }, { id: 'html', label: 'HTML', icon: Code }, { id: 'text', label: 'Plain Text', icon: Mail }].map(tab => <button key={tab.id} onClick={() => setViewMode(tab.id as ViewMode)} className={'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ' + (viewMode === tab.id ? 'bg-blue-500 text-white' : 'bg-white/10 hover:bg-white/20')}><tab.icon className="w-4 h-4" />{tab.label}</button>)}</div><div className="flex items-center gap-2"><button onClick={() => copyToClipboard(viewMode === 'html' ? generatedEmail.html : generatedEmail.text)} className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-sm">{copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied!' : 'Copy'}</button><button onClick={downloadHtml} className="flex items-center gap-2 px-3 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 text-sm font-medium"><Download className="w-4 h-4" />Download HTML</button></div></div><div className="bg-white/5 rounded-lg p-3 mb-4"><p className="text-xs text-white/50 mb-1">Subject Line:</p><p className="font-medium">{generatedEmail.subject}</p></div>{viewMode === 'preview' ? <div className="bg-white rounded-xl overflow-hidden shadow-2xl"><iframe srcDoc={generatedEmail.html} className="w-full h-[700px] border-0" title="Email Preview" /></div> : viewMode === 'html' ? <pre className="bg-[#111] p-4 rounded-xl overflow-auto text-xs text-green-400 max-h-[700px]">{generatedEmail.html}</pre> : <pre className="bg-[#111] p-4 rounded-xl overflow-auto text-sm text-white/80 whitespace-pre-wrap max-h-[700px]">{generatedEmail.text}</pre>}</div>
          : <div className="h-full flex flex-col items-center justify-center text-center"><div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4"><Mail className="w-10 h-10 text-white/20" /></div><h3 className="text-lg font-medium mb-2">Generate Professional Email</h3><p className="text-white/40 max-w-sm">Select a listing and click generate to create a beautiful email template</p></div>}
        </div>
      </div>
    </div>
  )
}
