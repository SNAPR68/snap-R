'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Sparkles, Download, Copy, Check, Home, Loader2, ChevronDown, Eye, Code, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Listing {
  id: string
  title: string
  address: string
  city: string
  state: string
  postal_code: string
  price: number | null
  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  description: string | null
  thumbnail: string | null
  features: string[] | null
  year_built: number | null
  lot_size: string | null
}

type EmailType = 'just-listed' | 'open-house' | 'price-reduced' | 'just-sold' | 'market-update' | 'follow-up'
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
  const [agentTitle, setAgentTitle] = useState('Real Estate Professional')
  const [agentPhone, setAgentPhone] = useState('(555) 123-4567')
  const [agentEmail, setAgentEmail] = useState('agent@realestate.com')
  const [agentPhoto, setAgentPhoto] = useState('')
  const [companyName, setCompanyName] = useState('Premier Realty')
  const [openHouseDate, setOpenHouseDate] = useState('')
  const [openHouseTime, setOpenHouseTime] = useState('')

  useEffect(() => { loadListings() }, [])
  useEffect(() => { if (listingId && listings.length > 0) { const l = listings.find(x => x.id === listingId); if (l) setSelectedListing(l) } }, [listingId, listings])

  const loadListings = async () => {
    setLoading(true)
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('full_name, email, phone').eq('id', user.id).single()
      if (profile) {
        if (profile.full_name) setAgentName(profile.full_name)
        if (profile.email) setAgentEmail(profile.email)
        if (profile.phone) setAgentPhone(profile.phone)
      }
      const { data: listingsData } = await supabase.from('listings').select('*, photos!photos_listing_id_fkey(id, raw_url, processed_url, status)').eq('user_id', user.id).order('created_at', { ascending: false })
      if (listingsData) {
        const processed = await Promise.all(listingsData.map(async (listing: any) => {
          const photos = listing.photos || []
          const firstPhoto = photos.find((p: any) => p.processed_url) || photos[0]
          let thumbnail = null
          if (firstPhoto) {
            const path = firstPhoto.processed_url || firstPhoto.raw_url
            if (path && !path.startsWith('http')) { const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 86400); thumbnail = data?.signedUrl }
            else thumbnail = path
          }
          return { ...listing, thumbnail }
        }))
        setListings(processed)
      }
    } catch (error) { console.error('Error loading listings:', error) }
    setLoading(false)
  }

  const generateEmail = async () => {
    if (!selectedListing) return
    setGenerating(true)
    setGeneratedEmail(null)
    await new Promise(r => setTimeout(r, 800))
    const email = createProfessionalEmail(selectedListing, emailType, tone)
    setGeneratedEmail(email)
    setGenerating(false)
  }

  const createProfessionalEmail = (listing: Listing, type: EmailType, t: Tone) => {
    const priceStr = listing.price ? '$' + listing.price.toLocaleString() : 'Contact for Price'
    const location = [listing.city, listing.state].filter(Boolean).join(', ')
    const fullAddress = [listing.address, listing.city, listing.state, listing.postal_code].filter(Boolean).join(', ')
    const features = [
      listing.bedrooms ? listing.bedrooms + ' Bedrooms' : null,
      listing.bathrooms ? listing.bathrooms + ' Bathrooms' : null,
      listing.square_feet ? listing.square_feet.toLocaleString() + ' Sq Ft' : null,
      listing.year_built ? 'Built ' + listing.year_built : null,
      listing.lot_size ? listing.lot_size + ' Lot' : null
    ].filter(Boolean)

    const colorSchemes = {
      professional: { primary: '#1a365d', secondary: '#2b6cb0', accent: '#3182ce', bg: '#f7fafc' },
      friendly: { primary: '#276749', secondary: '#38a169', accent: '#48bb78', bg: '#f0fff4' },
      luxury: { primary: '#1a1a1a', secondary: '#d4af37', accent: '#b8860b', bg: '#fafafa' },
      urgent: { primary: '#c53030', secondary: '#e53e3e', accent: '#fc8181', bg: '#fff5f5' }
    }
    const colors = colorSchemes[t]

    const subjects: Record<EmailType, string> = {
      'just-listed': `🏠 New Listing: ${listing.title} | ${priceStr} in ${location}`,
      'open-house': `�� Open House Invitation: ${listing.title} | ${openHouseDate || 'This Weekend'}`,
      'price-reduced': `💰 Price Reduced! ${listing.title} Now ${priceStr}`,
      'just-sold': `🎉 Just Sold: ${listing.title} in ${location}`,
      'market-update': `📊 Market Update: Your ${location} Real Estate Report`,
      'follow-up': `Following Up: ${listing.title} - Still Interested?`
    }

    const headlines: Record<EmailType, Record<Tone, string>> = {
      'just-listed': {
        professional: 'Introducing an Exceptional Property',
        friendly: 'Check Out This Amazing New Listing! 🏡',
        luxury: 'A Distinguished Residence Awaits',
        urgent: '🚨 Just Listed - Act Fast!'
      },
      'open-house': {
        professional: 'You Are Cordially Invited',
        friendly: 'Come See Your Dream Home! 🎉',
        luxury: 'An Exclusive Viewing Experience',
        urgent: '⏰ Open House This Weekend Only!'
      },
      'price-reduced': {
        professional: 'New Pricing Announcement',
        friendly: 'Great News - The Price Dropped! 💰',
        luxury: 'An Enhanced Value Proposition',
        urgent: '🔥 Price Just Reduced - Don\'t Miss Out!'
      },
      'just-sold': {
        professional: 'Another Successful Transaction',
        friendly: 'Congratulations to Our Clients! 🎊',
        luxury: 'Excellence in Real Estate',
        urgent: 'SOLD! Properties Are Moving Fast!'
      },
      'market-update': {
        professional: 'Your Real Estate Market Analysis',
        friendly: 'What\'s Happening in Your Neighborhood? 📈',
        luxury: 'Exclusive Market Intelligence',
        urgent: 'The Market Is HOT Right Now!'
      },
      'follow-up': {
        professional: 'Following Up on Your Property Interest',
        friendly: 'Still Thinking About That Property? 🤔',
        luxury: 'Continuing Our Conversation',
        urgent: 'Don\'t Let This One Get Away!'
      }
    }

    const intros: Record<EmailType, Record<Tone, string>> = {
      'just-listed': {
        professional: `I am pleased to present an exceptional property that has just entered the market. Located in the desirable ${location} area, this residence offers an outstanding combination of location, quality, and value that discerning buyers will appreciate.`,
        friendly: `I'm so excited to share this amazing property with you! It just hit the market and I immediately thought of you. This beautiful home in ${location} has everything you've been looking for!`,
        luxury: `It is my privilege to present this distinguished residence to a select group of qualified buyers. This property represents the pinnacle of refined living in ${location}, offering an unparalleled lifestyle for those who appreciate the finer things.`,
        urgent: `A prime property has just been listed and it won't last long! In today's competitive market, properties like this in ${location} are receiving multiple offers within days. I wanted to make sure you saw it first.`
      },
      'open-house': {
        professional: `I would like to extend a personal invitation to tour this exceptional property. Our upcoming open house provides the perfect opportunity to experience all that this residence has to offer.`,
        friendly: `You're invited! 🎉 Come join us for an open house at this gorgeous property. It's the perfect chance to walk through, ask questions, and really get a feel for the space. Refreshments will be served!`,
        luxury: `You are cordially invited to an exclusive viewing of this remarkable residence. This private showing will provide an intimate opportunity to appreciate the exceptional craftsmanship and thoughtful design that define this property.`,
        urgent: `Don't miss your chance to see this property in person! Our open house is THIS WEEKEND ONLY. With the current market conditions, serious buyers are making decisions fast.`
      },
      'price-reduced': {
        professional: `I am writing to inform you of a significant pricing adjustment on a property I believe aligns with your criteria. The sellers have demonstrated their motivation, creating an enhanced opportunity for qualified buyers.`,
        friendly: `Great news! The sellers just reduced the price on this beautiful home. I know you were interested before, and now it's an even better value. This could be the perfect time to make a move!`,
        luxury: `An extraordinary opportunity has emerged. The principals have elected to adjust the offering price of this distinguished residence, presenting a compelling value proposition for astute buyers who recognize exceptional quality.`,
        urgent: `PRICE DROP ALERT! 🚨 The sellers are motivated and have just reduced the price significantly. At this new price point, this property represents incredible value and I expect it to generate immediate interest.`
      },
      'just-sold': {
        professional: `I am delighted to announce the successful closing of another transaction. This achievement reflects our commitment to exceptional service and market expertise that delivers results for our clients.`,
        friendly: `We did it! 🎊 Another happy family is moving into their dream home. It was such a pleasure working with our amazing buyers and sellers on this transaction. Congratulations to everyone involved!`,
        luxury: `It is with great satisfaction that I announce the successful acquisition of this prestigious property on behalf of our distinguished clients. This transaction exemplifies our commitment to discretion and excellence in luxury real estate.`,
        urgent: `JUST SOLD! Another property off the market. This is exactly why you shouldn't wait when you find the right home. Properties are selling FAST. Let's find yours before someone else does!`
      },
      'market-update': {
        professional: `As your trusted real estate advisor, I want to keep you informed about current market conditions in your area. Understanding these trends is essential for making informed decisions about your real estate goals.`,
        friendly: `Curious about what's happening in the ${location} real estate market? I've put together some insights I think you'll find really interesting. Whether you're thinking about buying, selling, or just staying informed, this is for you!`,
        luxury: `For our distinguished clients who appreciate being ahead of market trends, I have prepared an exclusive analysis of the premium real estate segment in ${location}. This intelligence will help inform your strategic real estate decisions.`,
        urgent: `The market is moving FAST and I wanted to make sure you're up to speed! Whether you're thinking about buying or selling, now is the time to pay attention. Here's what you need to know.`
      },
      'follow-up': {
        professional: `I wanted to follow up regarding your interest in the property we discussed. I remain available to answer any questions and would be happy to arrange another viewing at your convenience.`,
        friendly: `Hey there! I've been thinking about our conversation about that property and wanted to check in. Have you had a chance to think it over? I'm here to help with any questions you might have! 😊`,
        luxury: `Following our previous discussion regarding the residence at ${listing.address}, I wanted to personally ensure that all your questions have been addressed. I remain at your service to facilitate your decision-making process.`,
        urgent: `I wanted to reach out quickly because there's been some activity on that property you liked. I'd hate for you to miss out! Are you still interested? Let's talk soon before it's too late.`
      }
    }

    const ctas: Record<EmailType, Record<Tone, string>> = {
      'just-listed': {
        professional: 'Schedule a Private Viewing',
        friendly: 'Let\'s Go See It! 🏃',
        luxury: 'Request a Private Showing',
        urgent: 'Schedule NOW Before It\'s Gone!'
      },
      'open-house': {
        professional: 'RSVP for Open House',
        friendly: 'I\'ll Be There! 🙋',
        luxury: 'Confirm Your Attendance',
        urgent: 'Reserve Your Spot NOW!'
      },
      'price-reduced': {
        professional: 'Schedule a Viewing',
        friendly: 'Show Me This Deal! 💰',
        luxury: 'Arrange a Private Tour',
        urgent: 'Act Now - Contact Me Today!'
      },
      'just-sold': {
        professional: 'Discuss Your Real Estate Goals',
        friendly: 'Let\'s Find Your Home Too! 🏠',
        luxury: 'Schedule a Consultation',
        urgent: 'Find Your Home Before It\'s Gone!'
      },
      'market-update': {
        professional: 'Request a Personal Consultation',
        friendly: 'Let\'s Chat About Your Options!',
        luxury: 'Schedule a Strategy Session',
        urgent: 'Call Me Today!'
      },
      'follow-up': {
        professional: 'Continue the Conversation',
        friendly: 'Let\'s Talk! 📞',
        luxury: 'Schedule a Discussion',
        urgent: 'Contact Me Before It\'s Too Late!'
      }
    }

    const textBody = `
${headlines[type][t]}

${intros[type][t]}

${listing.title}
${fullAddress}
${priceStr}

${features.join(' • ')}

${listing.description || ''}

${type === 'open-house' ? `Open House Details:\nDate: ${openHouseDate || 'This Weekend'}\nTime: ${openHouseTime || '1:00 PM - 4:00 PM'}\n` : ''}

Ready to take the next step? Contact me today.

${agentName}
${agentTitle}
${companyName}
${agentPhone}
${agentEmail}
    `.trim()

    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subjects[type]}</title>
</head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background-color:${colors.bg};line-height:1.6;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color:${colors.bg};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, ${colors.primary}, ${colors.secondary});padding:40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">${headlines[type][t]}</h1>
            </td>
          </tr>
          
          <!-- Hero Image -->
          ${listing.thumbnail ? `
          <tr>
            <td style="position:relative;">
              <img src="${listing.thumbnail}" alt="${listing.title}" style="width:100%;height:320px;object-fit:cover;display:block;">
              <div style="position:absolute;top:20px;left:20px;background:${colors.secondary};color:#ffffff;padding:10px 20px;font-weight:bold;font-size:14px;letter-spacing:1px;border-radius:6px;text-transform:uppercase;">
                ${type.replace('-', ' ')}
              </div>
            </td>
          </tr>
          ` : ''}
          
          <!-- Property Info -->
          <tr>
            <td style="padding:40px;">
              <!-- Price & Title -->
              <div style="text-align:center;margin-bottom:30px;">
                ${listing.price ? `<p style="margin:0 0 10px;font-size:42px;font-weight:800;color:${colors.secondary};">${priceStr}</p>` : ''}
                <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${colors.primary};">${listing.title}</h2>
                <p style="margin:0;font-size:16px;color:#666;">📍 ${fullAddress}</p>
              </div>
              
              <!-- Features Grid -->
              ${features.length > 0 ? `
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:30px;background:#f8f9fa;border-radius:10px;overflow:hidden;">
                <tr>
                  ${features.filter((f): f is string => Boolean(f)).slice(0, 4).map(f => `
                    <td style="width:25%;text-align:center;padding:20px 10px;border-right:1px solid #e2e8f0;">
                      <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:${colors.primary};">${f.split(' ')[0]}</p>
                      <p style="margin:0;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">${f.split(' ').slice(1).join(' ')}</p>
                    </td>
                  `).join('')}
                </tr>
              </table>
              ` : ''}
              
              <!-- Introduction -->
              <p style="margin:0 0 25px;font-size:16px;color:#444;line-height:1.8;">${intros[type][t]}</p>
              
              <!-- Description -->
              ${listing.description ? `
              <div style="margin-bottom:30px;padding:25px;background:#f8f9fa;border-radius:10px;border-left:4px solid ${colors.secondary};">
                <h3 style="margin:0 0 12px;font-size:18px;color:${colors.primary};">Property Description</h3>
                <p style="margin:0;font-size:15px;color:#555;line-height:1.7;">${listing.description.substring(0, 500)}${listing.description.length > 500 ? '...' : ''}</p>
              </div>
              ` : ''}
              
              <!-- Open House Details -->
              ${type === 'open-house' ? `
              <div style="margin-bottom:30px;padding:25px;background:linear-gradient(135deg, ${colors.primary}, ${colors.secondary});border-radius:10px;text-align:center;">
                <p style="margin:0 0 5px;font-size:14px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:1px;">Open House</p>
                <p style="margin:0 0 5px;font-size:24px;font-weight:700;color:#ffffff;">${openHouseDate || 'This Saturday & Sunday'}</p>
                <p style="margin:0;font-size:18px;color:rgba(255,255,255,0.9);">${openHouseTime || '1:00 PM - 4:00 PM'}</p>
              </div>
              ` : ''}
              
              <!-- CTA Button -->
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:10px 0 30px;">
                    <a href="mailto:${agentEmail}?subject=Inquiry: ${listing.title}" style="display:inline-block;background:${colors.secondary};color:#ffffff;text-decoration:none;font-weight:700;font-size:18px;padding:18px 50px;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,0.2);">
                      ${ctas[type][t]}
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Agent Card -->
              <table width="100%" cellspacing="0" cellpadding="0" style="border-top:2px solid #e2e8f0;padding-top:30px;">
                <tr>
                  <td style="padding:25px;background:#f8f9fa;border-radius:10px;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="80" valign="top">
                          <div style="width:70px;height:70px;background:linear-gradient(135deg, ${colors.primary}, ${colors.secondary});border-radius:50%;display:flex;align-items:center;justify-content:center;">
                            <span style="color:#fff;font-size:28px;font-weight:700;">${agentName.charAt(0)}</span>
                          </div>
                        </td>
                        <td valign="top" style="padding-left:20px;">
                          <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:${colors.primary};">${agentName}</p>
                          <p style="margin:0 0 4px;font-size:14px;color:#666;">${agentTitle}</p>
                          <p style="margin:0 0 12px;font-size:14px;color:#666;">${companyName}</p>
                          <p style="margin:0 0 4px;font-size:14px;color:${colors.secondary};">📞 ${agentPhone}</p>
                          <p style="margin:0;font-size:14px;color:${colors.secondary};">✉️ ${agentEmail}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:${colors.primary};padding:30px 40px;text-align:center;">
              <p style="margin:0 0 10px;font-size:14px;color:rgba(255,255,255,0.8);">${companyName}</p>
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.5);">Created with SnapR • Professional Real Estate Marketing</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    return { subject: subjects[type], html: htmlBody, text: textBody }
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadHtml = () => {
    if (!generatedEmail) return
    const blob = new Blob([generatedEmail.html], { type: 'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = (selectedListing?.title.replace(/[^a-z0-9]/gi, '_') || 'email') + '_email.html'
    a.click()
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="h-14 bg-[#111] border-b border-white/5 flex items-center px-4">
        <Link href="/dashboard/content-studio" className="flex items-center gap-2 hover:opacity-80">
          <ArrowLeft className="w-4 h-4 text-white/50" />
          <span className="text-white/50 text-sm">Back</span>
        </Link>
        <div className="h-5 w-px bg-white/10 mx-4" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center"><Mail className="w-4 h-4" /></div>
          <span className="font-bold">Email Marketing</span>
        </div>
      </header>

      <div className="flex h-[calc(100vh-56px)]">
        {/* Sidebar */}
        <aside className="w-[420px] bg-[#111] border-r border-white/5 flex flex-col overflow-auto">
          <div className="p-4 space-y-5">
            {/* Property Selector */}
            <div>
              <label className="text-sm text-white/50 mb-2 block">Property</label>
              <div className="relative">
                <button onClick={() => setShowDropdown(!showDropdown)} className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/20">
                  {selectedListing ? (
                    <div className="flex items-center gap-3">
                      {selectedListing.thumbnail ? <img src={selectedListing.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"><Home className="w-5 h-5 text-white/30" /></div>}
                      <div className="text-left">
                        <p className="font-medium text-sm">{selectedListing.title}</p>
                        <p className="text-xs text-white/40">{selectedListing.city}, {selectedListing.state}</p>
                      </div>
                    </div>
                  ) : <span className="text-white/50">Select a Listing</span>}
                  <ChevronDown className="w-4 h-4 text-white/50" />
                </button>
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden z-10 max-h-60 overflow-auto">
                    {loading ? <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-500" /></div>
                    : listings.length === 0 ? <div className="p-4 text-center text-white/40 text-sm">No listings found</div>
                    : listings.map(l => (
                      <button key={l.id} onClick={() => { setSelectedListing(l); setShowDropdown(false); setGeneratedEmail(null) }} className={'w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors ' + (selectedListing?.id === l.id ? 'bg-blue-500/10' : '')}>
                        {l.thumbnail ? <img src={l.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"><Home className="w-5 h-5 text-white/30" /></div>}
                        <div className="text-left">
                          <p className="font-medium text-sm">{l.title}</p>
                          <p className="text-xs text-white/40">{l.city}{l.city && l.state ? ', ' : ''}{l.state}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Email Type */}
            <div>
              <label className="text-sm text-white/50 mb-2 block">Email Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'just-listed', label: 'Just Listed', icon: '🏠' },
                  { id: 'open-house', label: 'Open House', icon: '🚪' },
                  { id: 'price-reduced', label: 'Price Reduced', icon: '💰' },
                  { id: 'just-sold', label: 'Just Sold', icon: '🎉' },
                  { id: 'market-update', label: 'Market Update', icon: '📊' },
                  { id: 'follow-up', label: 'Follow Up', icon: '📧' }
                ].map(type => (
                  <button key={type.id} onClick={() => { setEmailType(type.id as EmailType); setGeneratedEmail(null) }} className={'py-3 px-3 rounded-xl text-sm font-medium transition-all border ' + (emailType === type.id ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-transparent hover:bg-white/10 text-white/70')}>
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div>
              <label className="text-sm text-white/50 mb-2 block">Tone & Style</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'professional', label: 'Professional', icon: '🏢', desc: 'Formal & polished' },
                  { id: 'friendly', label: 'Friendly', icon: '😊', desc: 'Warm & approachable' },
                  { id: 'luxury', label: 'Luxury', icon: '✨', desc: 'Exclusive & refined' },
                  { id: 'urgent', label: 'Urgent', icon: '🔥', desc: 'Action-oriented' }
                ].map(t => (
                  <button key={t.id} onClick={() => { setTone(t.id as Tone); setGeneratedEmail(null) }} className={'py-3 px-3 rounded-xl text-left transition-all border ' + (tone === t.id ? 'bg-blue-500/20 border-blue-500/50' : 'bg-white/5 border-transparent hover:bg-white/10')}>
                    <p className="font-medium text-sm">{t.icon} {t.label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Open House Details */}
            {emailType === 'open-house' && (
              <div>
                <label className="text-sm text-white/50 mb-2 block">Open House Details</label>
                <div className="space-y-2">
                  <input type="text" value={openHouseDate} onChange={e => setOpenHouseDate(e.target.value)} placeholder="Date (e.g., Saturday, Dec 21st)" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                  <input type="text" value={openHouseTime} onChange={e => setOpenHouseTime(e.target.value)} placeholder="Time (e.g., 1:00 PM - 4:00 PM)" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            )}

            {/* Agent Info */}
            <div>
              <label className="text-sm text-white/50 mb-2 block">Agent Information</label>
              <div className="space-y-2">
                <input type="text" value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Your Name" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                <input type="text" value={agentTitle} onChange={e => setAgentTitle(e.target.value)} placeholder="Title" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company Name" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="tel" value={agentPhone} onChange={e => setAgentPhone(e.target.value)} placeholder="Phone" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                  <input type="email" value={agentEmail} onChange={e => setAgentEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="p-4 mt-auto border-t border-white/5">
            <button onClick={generateEmail} disabled={!selectedListing || generating} className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'Generating...' : 'Generate Email'}
            </button>
          </div>
        </aside>

        {/* Preview */}
        <div className="flex-1 bg-[#080808] flex flex-col overflow-hidden">
          {generatedEmail ? (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  {[
                    { id: 'preview', label: 'Preview', icon: Eye },
                    { id: 'html', label: 'HTML', icon: Code },
                    { id: 'text', label: 'Plain Text', icon: Mail }
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setViewMode(tab.id as ViewMode)} className={'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ' + (viewMode === tab.id ? 'bg-blue-500 text-white' : 'bg-white/10 hover:bg-white/20')}>
                      <tab.icon className="w-4 h-4" />{tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyToClipboard(viewMode === 'html' ? generatedEmail.html : generatedEmail.text)} className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-sm">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={downloadHtml} className="flex items-center gap-2 px-3 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 text-sm font-medium">
                    <Download className="w-4 h-4" />Download HTML
                  </button>
                </div>
              </div>

              {/* Subject Line */}
              <div className="px-4 py-3 bg-white/5 border-b border-white/5">
                <p className="text-xs text-white/50 mb-1">Subject Line:</p>
                <p className="font-medium">{generatedEmail.subject}</p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-4">
                {viewMode === 'preview' ? (
                  <div className="max-w-[650px] mx-auto bg-white rounded-xl overflow-hidden shadow-2xl">
                    <iframe srcDoc={generatedEmail.html} className="w-full h-[800px] border-0" title="Email Preview" />
                  </div>
                ) : viewMode === 'html' ? (
                  <pre className="bg-[#111] p-4 rounded-xl overflow-auto text-xs text-green-400 max-h-full font-mono">{generatedEmail.html}</pre>
                ) : (
                  <pre className="bg-[#111] p-4 rounded-xl overflow-auto text-sm text-white/80 whitespace-pre-wrap max-h-full">{generatedEmail.text}</pre>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <Mail className="w-10 h-10 text-white/20" />
              </div>
              <h3 className="text-lg font-medium mb-2">Create Professional Email</h3>
              <p className="text-white/40 max-w-sm">Select a listing and choose your email type to generate a beautiful, professional email template</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
