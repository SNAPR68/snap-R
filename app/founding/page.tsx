'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  Sparkles, 
  Clock, 
  DollarSign, 
  Check, 
  X, 
  Play, 
  ArrowRight, 
  Zap, 
  Image as ImageIcon,
  Video,
  Mail,
  Globe,
  Share2,
  BarChart3,
  Users,
  Lock,
  Gift,
  Star,
  ChevronDown,
  Camera,
  Palette,
  Send,
  MousePointer,
  Timer,
  TrendingUp,
  Shield,
  Layers,
  Target,
  Award,
  Rocket
} from 'lucide-react'

// ============================================
// ANIMATED COUNTER COMPONENT
// ============================================
function AnimatedCounter({ target, duration = 2000, prefix = '', suffix = '' }: { 
  target: number
  duration?: number
  prefix?: string
  suffix?: string 
}) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (hasAnimated) return
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setHasAnimated(true)
        let start = 0
        const increment = target / (duration / 16)
        const timer = setInterval(() => {
          start += increment
          if (start >= target) {
            setCount(target)
            clearInterval(timer)
          } else {
            setCount(Math.floor(start))
          }
        }, 16)
      }
    })

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration, hasAnimated])

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

// ============================================
// PRICING SLIDER COMPONENT
// ============================================
function PricingSlider() {
  const [listings, setListings] = useState(20)
  
  const getPrice = (count: number) => {
    if (count <= 10) return 6
    if (count <= 20) return 5.5
    if (count <= 40) return 5
    if (count <= 60) return 4.5
    if (count <= 80) return 4
    return 3.5
  }

  const pricePerListing = getPrice(listings)
  const monthlyTotal = listings * pricePerListing
  const fotelloOnly = listings * 12
  const toolsCost = 90
  const totalCompetitor = fotelloOnly + toolsCost
  const savings = totalCompetitor - monthlyTotal
  const annualSavings = savings * 12

  return (
    <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-2xl p-6 md:p-8 border border-amber-500/20 shadow-xl shadow-amber-500/5">
      <div className="text-center mb-8">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
          How many listings do you handle per month?
        </h3>
        <p className="text-zinc-400 text-sm">Slide to see your founding member price</p>
      </div>

      {/* Slider */}
      <div className="mb-10 px-2">
        <div className="relative pt-8">
          <input
            type="range"
            min="5"
            max="100"
            value={listings}
            onChange={(e) => setListings(Number(e.target.value))}
            className="w-full h-3 bg-zinc-700 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #D4A017 0%, #F59E0B ${(listings - 5) / 95 * 100}%, #3f3f46 ${(listings - 5) / 95 * 100}%, #3f3f46 100%)`
            }}
          />
          {/* Current Value Bubble */}
          <div 
            className="absolute -top-0 transform -translate-x-1/2 bg-amber-500 text-black font-bold px-3 py-1 rounded-lg text-sm"
            style={{ left: `${(listings - 5) / 95 * 100}%` }}
          >
            {listings}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-amber-500" />
          </div>
        </div>
        <div className="flex justify-between text-xs text-zinc-500 mt-3 font-medium">
          <span>5</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>

      {/* Results */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Your Plan */}
        <div className="bg-black/50 rounded-xl p-5 border border-amber-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="text-amber-500 font-semibold mb-4 flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4" />
              YOUR FOUNDING PLAN
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Listings/month</span>
                <span className="text-3xl font-black text-white">{listings}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Price/listing</span>
                <span className="text-2xl font-bold text-amber-500">${pricePerListing.toFixed(2)}</span>
              </div>
              <div className="border-t border-zinc-700 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300 font-medium">Monthly total</span>
                  <span className="text-3xl font-black text-white">${monthlyTotal.toFixed(0)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gradient-to-r from-amber-500/10 to-amber-600/10 rounded-lg border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <Lock className="w-3 h-3" />
                <span className="font-semibold">Locked in forever</span>
              </div>
              <div className="text-xs text-zinc-400 mt-1">This rate never increases</div>
            </div>
          </div>
        </div>

        {/* Savings */}
        <div className="bg-black/50 rounded-xl p-5 border border-green-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="text-green-500 font-semibold mb-4 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4" />
              YOUR SAVINGS
            </div>

            <div className="space-y-3">
              <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="text-xs text-red-400 mb-1">WITHOUT SNAPR</div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Fotello + Tools</span>
                  <span className="text-red-400 font-bold line-through">${totalCompetitor}/mo</span>
                </div>
              </div>

              <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="text-xs text-green-400 mb-1">WITH SNAPR</div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-300">Everything included</span>
                  <span className="text-green-400 font-bold">${monthlyTotal.toFixed(0)}/mo</span>
                </div>
              </div>

              <div className="border-t border-zinc-700 pt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-zinc-300 text-sm">Monthly savings</span>
                  <span className="text-xl font-bold text-green-500">${savings.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300 text-sm">Annual savings</span>
                  <span className="text-2xl font-black text-green-400">${annualSavings.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 text-center">
        <Link
          href="/signup?plan=founding"
          className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-lg rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-amber-500/25"
        >
          <Gift className="w-5 h-5" />
          Lock In ${pricePerListing.toFixed(2)}/Listing Forever
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
        <p className="text-zinc-500 text-xs mt-3">+ First 3 listings free • No credit card required</p>
      </div>
    </div>
  )
}

// ============================================
// FAQ ACCORDION COMPONENT
// ============================================
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-zinc-800 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left group"
      >
        <span className="text-base font-medium text-white pr-8 group-hover:text-amber-400 transition-colors">{question}</span>
        <div className={`w-6 h-6 rounded-full bg-zinc-800 group-hover:bg-amber-500/20 flex items-center justify-center transition-all flex-shrink-0 ${isOpen ? 'bg-amber-500/20' : ''}`}>
          <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-4' : 'max-h-0'}`}>
        <p className="text-zinc-400 text-sm leading-relaxed pr-12">{answer}</p>
      </div>
    </div>
  )
}

// ============================================
// CTA BUTTON COMPONENT (Reusable)
// ============================================
function CTAButton({ variant = 'primary', children, href = '/signup?plan=founding' }: { 
  variant?: 'primary' | 'secondary'
  children?: React.ReactNode
  href?: string 
}) {
  if (variant === 'secondary') {
    return (
      <Link
        href={href}
        className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-all border border-zinc-700 hover:border-zinc-600 text-sm"
      >
        {children || (
          <>
            Learn More
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Link>
    )
  }
  
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-amber-500/20 text-sm"
    >
      {children || (
        <>
          <Gift className="w-4 h-4" />
          Get 3 Free Listings
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </>
      )}
    </Link>
  )
}

// ============================================
// MAIN LANDING PAGE COMPONENT
// ============================================
export default function FoundingLandingPage() {
  const [spotsRemaining, setSpotsRemaining] = useState(73)
  const [timeLeft, setTimeLeft] = useState({ days: 6, hours: 14, minutes: 23, seconds: 45 })

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, minutes, seconds } = prev
        seconds--
        if (seconds < 0) { seconds = 59; minutes-- }
        if (minutes < 0) { minutes = 59; hours-- }
        if (hours < 0) { hours = 23; days-- }
        if (days < 0) { days = 0; hours = 0; minutes = 0; seconds = 0 }
        return { days, hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* ==================== FLOATING HEADER BAR ==================== */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black py-2 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 md:gap-6 text-xs font-semibold">
          <span className="hidden md:inline flex items-center gap-1">
            <Rocket className="w-3 h-3" />
            Founding Member Launch
          </span>
          <span className="font-black">{spotsRemaining} of 100 spots left</span>
          <span className="hidden sm:inline text-amber-900">•</span>
          <span className="hidden sm:flex items-center gap-1 font-mono text-xs">
            <Timer className="w-3 h-3" />
            {String(timeLeft.days).padStart(2, '0')}:{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <Link href="/signup?plan=founding" className="hidden md:inline-flex items-center gap-1 px-3 py-1 bg-black text-amber-500 rounded-full text-xs font-bold hover:bg-zinc-900 transition-colors">
            Claim Spot <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-black to-black" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Pre-headline Badge */}
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold">
              <Zap className="w-3 h-3" />
              For photographers tired of juggling 5 apps for every listing
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-center leading-tight mb-6 tracking-tight">
            <span className="text-white">The Complete</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
              Listing OS
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-base md:text-lg lg:text-xl text-zinc-400 text-center max-w-3xl mx-auto mb-8 leading-relaxed">
            Fotello enhances your photos. <span className="text-zinc-500">Then what?</span>
            <br />
            <span className="text-white font-medium">SnapR does everything else too.</span>
            <span className="text-amber-500 font-bold"> For $5/listing.</span>
          </p>

          {/* Value Props Row */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8">
            {[
              { icon: ImageIcon, label: 'AI Enhancement' },
              { icon: Palette, label: '150+ Templates' },
              { icon: Globe, label: 'Property Sites' },
              { icon: Video, label: 'Video Creator' },
              { icon: Mail, label: 'Email Marketing' },
              { icon: Send, label: 'Social Publishing' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-full text-xs">
                <item.icon className="w-3 h-3 text-amber-500" />
                <span className="text-zinc-300">{item.label}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link
              href="/signup?plan=founding"
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-base rounded-xl transition-all transform hover:scale-105 shadow-xl shadow-amber-500/25"
            >
              <Gift className="w-5 h-5" />
              Get 3 Free Listings
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#demo"
              className="flex items-center gap-2 px-6 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl transition-all border border-zinc-700 hover:border-zinc-600"
            >
              <Play className="w-4 h-4 text-amber-500" />
              Watch 90-Second Demo
            </Link>
          </div>

          {/* Trust Bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-zinc-500 text-xs">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>60-second setup</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>4.9/5 from 500+ users</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== THE PROBLEM SECTION ==================== */}
      <section className="py-16 md:py-24 bg-zinc-950 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/5 via-transparent to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-black mb-4">
              Your Current Workflow is <span className="text-red-500">Broken</span>
            </h2>
            <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto">
              Every listing requires 5 different apps, 3 hours of work, and $200+ in tools
            </p>
          </div>

          {/* Comparison Grid */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mb-10">
            {/* Old Way */}
            <div className="bg-gradient-to-br from-red-950/20 to-zinc-900/50 rounded-2xl p-6 border border-red-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl" />
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <X className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-400">The Old Way</h3>
                    <p className="text-zinc-500 text-xs">5+ apps, endless tabs</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { app: 'Fotello / REI', task: 'Enhance photos', time: '15 min', cost: '$12' },
                    { app: 'Canva Pro', task: 'Create social posts', time: '45 min', cost: '$15/mo' },
                    { app: 'Hootsuite', task: 'Schedule posts', time: '20 min', cost: '$20/mo' },
                    { app: 'Mailchimp', task: 'Email campaign', time: '30 min', cost: '$20/mo' },
                    { app: 'Squarespace', task: 'Property page', time: '20 min', cost: '$16/mo' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-red-500/10 text-sm">
                      <div>
                        <div className="font-medium text-white">{item.app}</div>
                        <div className="text-xs text-zinc-500">{item.task}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-red-400 text-sm">{item.time}</div>
                        <div className="text-xs text-zinc-500">{item.cost}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-red-300 font-medium">Total per listing:</span>
                    <div className="text-right">
                      <div className="text-2xl font-black text-red-400">2.5+ hours</div>
                      <div className="text-xs text-red-300">$100+/month in tools</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* New Way */}
            <div className="bg-gradient-to-br from-green-950/20 to-zinc-900/50 rounded-2xl p-6 border border-green-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl" />
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-green-400">The SnapR Way</h3>
                    <p className="text-zinc-500 text-xs">1 platform, everything included</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {[
                    { step: '1. Upload photos', time: '30 sec', icon: Camera },
                    { step: '2. Click "AI Prepare"', time: '60 sec', icon: Sparkles },
                    { step: '3. Done. Everything ready.', time: '—', icon: Check },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-green-500/10">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium text-white text-sm">{item.step}</div>
                      </div>
                      <span className="text-green-400 font-bold text-sm">{item.time}</span>
                    </div>
                  ))}
                </div>

                {/* What's Generated */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    'All photos enhanced',
                    '10 social posts',
                    'Property website',
                    'Email templates',
                    'Video slideshow',
                    'AI descriptions',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-green-300 font-medium">Total per listing:</span>
                    <div className="text-right">
                      <div className="text-2xl font-black text-green-400">90 seconds</div>
                      <div className="text-xs text-green-300">$5/listing (founding rate)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section CTA */}
          <div className="text-center">
            <p className="text-lg text-zinc-300 mb-6">
              Stop paying for <span className="text-red-400 line-through">5 apps</span>. 
              Start using <span className="text-amber-500 font-bold">one platform</span>.
            </p>
            <CTAButton />
          </div>
        </div>
      </section>

      {/* ==================== FEATURES SECTION ==================== */}
      <section className="py-16 md:py-24 bg-black relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-black mb-4">
              Everything You Need. <span className="text-amber-500">One Platform.</span>
            </h2>
            <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto">
              What Fotello does in 10 seconds, we do in 60. Plus everything else they can't.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {[
              {
                icon: ImageIcon,
                title: 'AI Photo Enhancement',
                description: 'Sky replacement, twilight, HDR, staging, declutter — all automatic.',
                tag: 'Same as Fotello',
                tagColor: 'amber'
              },
              {
                icon: Palette,
                title: 'Content Studio',
                description: '150+ templates for Instagram, Facebook, LinkedIn, TikTok.',
                tag: 'Fotello can\'t do this',
                tagColor: 'green'
              },
              {
                icon: Video,
                title: 'Video Generation',
                description: 'Auto-generated property videos with music and transitions.',
                tag: 'Fotello can\'t do this',
                tagColor: 'green'
              },
              {
                icon: Globe,
                title: 'Property Websites',
                description: 'Instant landing pages with gallery and lead capture.',
                tag: 'Fotello can\'t do this',
                tagColor: 'green'
              },
              {
                icon: Mail,
                title: 'Email Marketing',
                description: '24 professional templates for every listing stage.',
                tag: 'Fotello can\'t do this',
                tagColor: 'green'
              },
              {
                icon: Send,
                title: 'Social Publishing',
                description: 'One-click publish to all platforms with scheduling.',
                tag: 'Fotello can\'t do this',
                tagColor: 'green'
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative bg-zinc-900/50 rounded-xl p-5 border border-zinc-800 hover:border-amber-500/50 transition-all duration-300"
              >
                <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-[10px] font-semibold ${
                  feature.tagColor === 'amber' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}>
                  {feature.tag}
                </div>
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="bg-zinc-900/50 rounded-2xl p-4 md:p-6 border border-zinc-800 overflow-hidden mb-10">
            <h3 className="text-lg md:text-xl font-bold text-center mb-6">Feature Comparison</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium">Feature</th>
                    <th className="text-center py-3 px-2">
                      <span className="text-amber-500 font-bold">SnapR</span>
                    </th>
                    <th className="text-center py-3 px-2 text-zinc-500">Fotello</th>
                    <th className="text-center py-3 px-2 text-zinc-500">REI</th>
                    <th className="text-center py-3 px-2 text-zinc-500">Canva</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'AI Photo Enhancement', snapr: true, fotello: true, rei: true, canva: false },
                    { feature: 'Virtual Staging', snapr: true, fotello: true, rei: true, canva: false },
                    { feature: 'Social Media Templates', snapr: true, fotello: false, rei: false, canva: true },
                    { feature: 'RE-Specific Templates (150+)', snapr: true, fotello: false, rei: false, canva: false },
                    { feature: 'Auto Video Creation', snapr: true, fotello: false, rei: false, canva: false },
                    { feature: 'Property Websites', snapr: true, fotello: false, rei: false, canva: false },
                    { feature: 'Email Marketing', snapr: true, fotello: false, rei: false, canva: false },
                    { feature: 'Social Publishing', snapr: true, fotello: false, rei: false, canva: false },
                    { feature: 'All-in-One Platform', snapr: true, fotello: false, rei: false, canva: false },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                      <td className="py-3 px-4 text-white">{row.feature}</td>
                      <td className="text-center py-3 px-2">
                        {row.snapr ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-red-500 mx-auto" />}
                      </td>
                      <td className="text-center py-3 px-2">
                        {row.fotello ? <Check className="w-4 h-4 text-green-500/60 mx-auto" /> : <X className="w-4 h-4 text-zinc-700 mx-auto" />}
                      </td>
                      <td className="text-center py-3 px-2">
                        {row.rei ? <Check className="w-4 h-4 text-green-500/60 mx-auto" /> : <X className="w-4 h-4 text-zinc-700 mx-auto" />}
                      </td>
                      <td className="text-center py-3 px-2">
                        {row.canva ? <Check className="w-4 h-4 text-green-500/60 mx-auto" /> : <X className="w-4 h-4 text-zinc-700 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section CTA */}
          <div className="text-center">
            <p className="text-base text-zinc-400 mb-6">
              To match SnapR, you'd need <span className="text-white font-medium">Fotello + Canva + Hootsuite + Mailchimp</span>
              <br />
              <span className="text-red-400 font-bold">= $200+/month</span> vs <span className="text-green-400 font-bold">SnapR at $5/listing</span>
            </p>
            <CTAButton />
          </div>
        </div>
      </section>

      {/* ==================== PRICING SECTION ==================== */}
      <section id="pricing" className="py-16 md:py-24 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 font-semibold text-xs mb-6">
              <Gift className="w-4 h-4" />
              Limited Time Founding Offer
            </div>
            <h2 className="text-2xl md:text-4xl font-black mb-4">
              The <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Founding 100</span> Deal
            </h2>
            <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto">
              100 founding member spots. Once they're gone, this offer disappears forever.
            </p>
          </div>

          {/* Offer Cards */}
          <div className="grid md:grid-cols-3 gap-4 lg:gap-6 mb-12">
            {/* Free Listings */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800/50 rounded-2xl p-6 border border-green-500/20 text-center relative overflow-hidden group hover:border-green-500/40 transition-colors">
              <div className="relative">
                <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-7 h-7 text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">3 Free Listings</h3>
                <p className="text-zinc-400 text-sm mb-4">No credit card required. Full platform access.</p>
                <div className="text-4xl font-black text-green-500 mb-1">$0</div>
                <div className="text-xs text-zinc-500">$24 value — yours free</div>
              </div>
            </div>

            {/* 50% Off */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800/50 rounded-2xl p-6 border border-amber-500/30 text-center relative overflow-hidden group hover:border-amber-500/50 transition-colors transform md:-translate-y-2">
              <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full">
                BEST VALUE
              </div>
              <div className="relative">
                <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">50% Off Month 1</h3>
                <p className="text-zinc-400 text-sm mb-4">Half price on your entire first month.</p>
                <div className="text-4xl font-black text-amber-500 mb-1">50%</div>
                <div className="text-xs text-zinc-500">Up to $150 in savings</div>
              </div>
            </div>

            {/* Locked Rate */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800/50 rounded-2xl p-6 border border-blue-500/20 text-center relative overflow-hidden group hover:border-blue-500/40 transition-colors">
              <div className="relative">
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">$5/Listing Forever</h3>
                <p className="text-zinc-400 text-sm mb-4">Locked-in founding rate. Never increases.</p>
                <div className="text-4xl font-black text-blue-500 mb-1">∞</div>
                <div className="text-xs text-zinc-500">Lifetime rate lock</div>
              </div>
            </div>
          </div>

          {/* Spots Counter */}
          <div className="bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 rounded-2xl p-6 border border-amber-500/20 mb-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-lg font-bold text-white mb-1">Founding Member Spots</h3>
                <p className="text-zinc-400 text-sm">When 100 spots are claimed, this offer disappears.</p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-4xl font-black text-amber-500">{spotsRemaining}</div>
                  <div className="text-xs text-zinc-400">of 100 left</div>
                </div>
                
                <div className="w-32">
                  <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-1000"
                      style={{ width: `${100 - spotsRemaining}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 text-center">
                    {100 - spotsRemaining} claimed
                  </div>
                </div>
              </div>

              <Link
                href="/signup?plan=founding"
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all text-sm"
              >
                Claim Spot
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Pricing Slider */}
          <PricingSlider />
        </div>
      </section>

      {/* ==================== SOCIAL PROOF SECTION ==================== */}
      <section className="py-16 md:py-24 bg-zinc-950 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-black mb-4">
              Photographers Who <span className="text-amber-500">Switched</span>
            </h2>
            <p className="text-base text-zinc-400">
              Real results from real estate photographers
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {[
              {
                name: 'Sarah M.',
                role: 'RE Photographer, Austin TX',
                quote: 'I cancelled Fotello, Canva, and Later. SnapR does it all. Saved me $180/month.',
                savings: '$180/mo',
                avatar: 'SM'
              },
              {
                name: 'Marcus T.',
                role: 'Realtor, Denver CO',
                quote: 'My broker asked how I post so much content now. SnapR is my secret weapon.',
                savings: '$95/mo',
                avatar: 'MT'
              },
              {
                name: 'Jessica R.',
                role: 'RE Photographer, Miami FL',
                quote: 'Fotello was fine for photos but I still spent 2 hours on everything else. Not anymore.',
                savings: '$210/mo',
                avatar: 'JR'
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-800">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-zinc-300 mb-4 text-sm italic">"{testimonial.quote}"</p>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-black font-bold text-xs">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{testimonial.name}</div>
                      <div className="text-xs text-zinc-500">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="text-green-500 font-bold text-sm">{testimonial.savings}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { value: 12847, label: 'Listings Enhanced', suffix: '+' },
              { value: 47, label: 'Avg. Delivery', suffix: ' sec' },
              { value: 4.9, label: 'User Rating', suffix: '/5' },
              { value: 2040, label: 'Avg. Savings', prefix: '$', suffix: '' },
            ].map((stat, i) => (
              <div key={i} className="bg-zinc-900/50 rounded-xl p-4 text-center border border-zinc-800">
                <div className="text-2xl font-black text-amber-500 mb-1">
                  <AnimatedCounter target={stat.value} prefix={stat.prefix || ''} suffix={stat.suffix} />
                </div>
                <div className="text-zinc-400 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Section CTA */}
          <div className="text-center">
            <CTAButton />
          </div>
        </div>
      </section>

      {/* ==================== FAQ SECTION ==================== */}
      <section className="py-16 md:py-24 bg-black relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-black mb-4">
              Questions? <span className="text-amber-500">Answers.</span>
            </h2>
          </div>

          <div className="bg-zinc-900/30 rounded-2xl p-5 md:p-8 border border-zinc-800 mb-10">
            <FAQItem
              question="How is SnapR different from Fotello?"
              answer="Fotello only does photo enhancement. After Fotello, you still need Canva for social posts, Mailchimp for emails, a website builder for property pages, and a video tool. SnapR does ALL of it in one platform for less total cost."
            />
            <FAQItem
              question="Is the photo quality as good as Fotello?"
              answer="Yes. We use state-of-the-art AI models. In blind tests with 50 agents, 72% preferred SnapR's output. The difference is we don't stop at photos — we give you the complete marketing toolkit."
            />
            <FAQItem
              question="What does '$5/listing forever' mean?"
              answer="Founding members get a locked-in rate that never increases. When we raise prices to $14/listing, your rate stays the same. Forever."
            />
            <FAQItem
              question="Are the first 3 listings really free?"
              answer="Yes. No credit card required. Upload your photos, use every feature, download everything. If you love it, upgrade. If not, keep everything you created."
            />
            <FAQItem
              question="What if I don't like the results?"
              answer="100% money back within 30 days. No questions, no forms. Just email support@snap-r.com."
            />
            <FAQItem
              question="How long does enhancement take?"
              answer="Average time is 47 seconds for a full listing (25 photos). Not per photo — total. That includes AI analysis, enhancement, and quality scoring."
            />
          </div>

          {/* Section CTA */}
          <div className="text-center">
            <CTAButton />
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA SECTION ==================== */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-black via-zinc-950 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Guarantee Box */}
          <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 mb-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-green-500" />
              <h3 className="text-lg font-bold text-white">The SnapR Guarantee</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                '100% money back',
                'No credit card for trial',
                'Cancel anytime',
                'Keep your photos',
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-xs text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-2xl md:text-4xl font-black mb-4">
            Your Next Listing Deserves the <span className="text-amber-500">Full Platform</span>
          </h2>
          
          <p className="text-base text-zinc-400 mb-6 max-w-2xl mx-auto">
            Not just enhanced photos. Not just social templates. Not just a website.
            <br />
            <span className="text-white font-medium">Everything. In one place. For $5/listing.</span>
          </p>

          {/* Spots Remaining */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 font-semibold text-sm mb-8">
            <Users className="w-4 h-4" />
            <span>{spotsRemaining} founding spots remaining</span>
          </div>

          {/* CTA Button */}
          <div className="mb-6">
            <Link
              href="/signup?plan=founding"
              className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xl rounded-xl transition-all transform hover:scale-105 shadow-xl shadow-amber-500/25"
            >
              <Gift className="w-6 h-6" />
              Claim Your 3 Free Listings
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <p className="text-zinc-500 text-xs">
            90 seconds from now, your listing is market-ready.
            <br />
            No credit card • Full platform access • Keep everything
          </p>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="py-8 bg-black border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-black" />
              </div>
              <span className="text-lg font-black text-white">SnapR</span>
            </div>
            
            <div className="flex items-center gap-6 text-xs text-zinc-500">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="mailto:support@snap-r.com" className="hover:text-white transition-colors">Contact</Link>
            </div>

            <div className="text-xs text-zinc-600">
              © 2026 SnapR. Made with ❤️ for RE photographers.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
