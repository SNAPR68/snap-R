'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Mail, Phone, Globe, Instagram, Facebook, Linkedin, ExternalLink } from 'lucide-react';

interface PortfolioItem {
  id: string;
  before_url: string;
  after_url: string;
  title?: string;
  description?: string;
  enhancement_type?: string;
  room_type?: string;
  client_name?: string;
  client_testimonial?: string;
  is_featured: boolean;
}

interface Portfolio {
  id: string;
  slug: string;
  title: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  theme: string;
  accent_color: string;
  contact_email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  show_contact_form: boolean;
  show_booking_link: boolean;
  booking_url?: string;
  portfolio_items: PortfolioItem[];
}

function BeforeAfterSlider({ beforeUrl, afterUrl, title }: { 
  beforeUrl: string; 
  afterUrl: string; 
  title?: string 
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number, rect: DOMRect) => {
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    handleMove(e.clientX, rect);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    handleMove(e.touches[0].clientX, rect);
  };

  return (
    <div 
      className="relative aspect-[4/3] overflow-hidden rounded-xl cursor-ew-resize select-none"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* After image (full) */}
      <img 
        src={afterUrl} 
        alt="After"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      
      {/* Before image (clipped) */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={beforeUrl} 
          alt="Before"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ 
            width: `${100 / (sliderPosition / 100)}%`,
            maxWidth: 'none'
          }}
          draggable={false}
        />
      </div>
      
      {/* Slider line */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8L22 12L18 16" />
            <path d="M6 8L2 12L6 16" />
          </svg>
        </div>
      </div>
      
      {/* Labels */}
      <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 rounded text-white text-sm font-medium">
        Before
      </div>
      <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 rounded text-white text-sm font-medium">
        After
      </div>
    </div>
  );
}

function ContactForm({ portfolioId, accentColor }: { portfolioId: string; accentColor: string }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const supabase = createClient();
      await supabase.from('portfolio_inquiries').insert({
        portfolio_id: portfolioId,
        ...formData,
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
        <p className="text-white/60">We'll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Your Name"
        required
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
      />
      <input
        type="email"
        placeholder="Email Address"
        required
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
      />
      <input
        type="tel"
        placeholder="Phone (optional)"
        value={formData.phone}
        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
      />
      <textarea
        placeholder="Tell us about your project..."
        required
        rows={4}
        value={formData.message}
        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 resize-none"
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-lg font-semibold transition-opacity disabled:opacity-50"
        style={{ backgroundColor: accentColor, color: '#000' }}
      >
        {submitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}

export default function PublicPortfolioPage({ params }: { params: { slug: string } }) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    loadPortfolio();
  }, [params.slug]);

  const loadPortfolio = async () => {
    try {
      const response = await fetch(`/api/portfolio?slug=${params.slug}`);
      if (!response.ok) {
        throw new Error('Portfolio not found');
      }
      const data = await response.json();
      setPortfolio(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Portfolio Not Found</h1>
          <p className="text-white/50">This portfolio may have been removed or made private.</p>
        </div>
      </div>
    );
  }

  const accentColor = portfolio.accent_color || '#D4A017';
  const featuredItems = portfolio.portfolio_items.filter(i => i.is_featured);
  const otherItems = portfolio.portfolio_items.filter(i => !i.is_featured);

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Hero Section */}
      <div className="relative">
        {portfolio.cover_image_url && (
          <div className="absolute inset-0 h-[400px]">
            <img 
              src={portfolio.cover_image_url} 
              alt=""
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0F0F0F]" />
          </div>
        )}
        
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-12">
          {/* Logo */}
          {portfolio.logo_url && (
            <img 
              src={portfolio.logo_url} 
              alt={portfolio.title}
              className="w-24 h-24 object-contain mb-6"
            />
          )}
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{portfolio.title}</h1>
          
          {portfolio.tagline && (
            <p className="text-xl text-white/70 mb-6">{portfolio.tagline}</p>
          )}
          
          {portfolio.description && (
            <p className="text-white/60 max-w-2xl mb-8">{portfolio.description}</p>
          )}
          
          {/* Social Links */}
          <div className="flex gap-4">
            {portfolio.instagram && (
              <a href={`https://instagram.com/${portfolio.instagram}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {portfolio.facebook && (
              <a href={portfolio.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            )}
            {portfolio.linkedin && (
              <a href={portfolio.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            )}
            {portfolio.website && (
              <a href={portfolio.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <Globe className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Featured Work */}
      {featuredItems.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold mb-8" style={{ color: accentColor }}>
            Featured Work
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {featuredItems.map(item => (
              <div key={item.id} className="space-y-4">
                <BeforeAfterSlider 
                  beforeUrl={item.before_url} 
                  afterUrl={item.after_url}
                  title={item.title}
                />
                {item.title && (
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                )}
                {item.description && (
                  <p className="text-white/60 text-sm">{item.description}</p>
                )}
                {item.client_testimonial && (
                  <blockquote className="border-l-2 pl-4 italic text-white/70" style={{ borderColor: accentColor }}>
                    "{item.client_testimonial}"
                    {item.client_name && (
                      <cite className="block text-sm mt-2 not-italic text-white/50">
                        — {item.client_name}
                      </cite>
                    )}
                  </blockquote>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Work Gallery */}
      {otherItems.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold mb-8">
            {featuredItems.length > 0 ? 'More Work' : 'Portfolio'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {otherItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group relative aspect-square overflow-hidden rounded-xl"
              >
                <img 
                  src={item.after_url} 
                  alt={item.title || 'Portfolio item'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium">
                    View
                  </span>
                </div>
                {item.enhancement_type && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs">
                    {item.enhancement_type.replace('-', ' ')}
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Get In Touch</h2>
            <div className="space-y-4">
              {portfolio.contact_email && (
                <a href={`mailto:${portfolio.contact_email}`} className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                  <Mail className="w-5 h-5" style={{ color: accentColor }} />
                  {portfolio.contact_email}
                </a>
              )}
              {portfolio.phone && (
                <a href={`tel:${portfolio.phone}`} className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                  <Phone className="w-5 h-5" style={{ color: accentColor }} />
                  {portfolio.phone}
                </a>
              )}
              {portfolio.website && (
                <a href={portfolio.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                  <Globe className="w-5 h-5" style={{ color: accentColor }} />
                  {portfolio.website}
                </a>
              )}
            </div>
            
            {portfolio.show_booking_link && portfolio.booking_url && (
              <a 
                href={portfolio.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-lg font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: accentColor, color: '#000' }}
              >
                Book a Session
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          
          {/* Contact Form */}
          {portfolio.show_contact_form && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Send a Message</h3>
              <ContactForm portfolioId={portfolio.id} accentColor={accentColor} />
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-white/40">
          <p>© {new Date().getFullYear()} {portfolio.title}</p>
          <a href="https://snap-r.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">
            Powered by SnapR
          </a>
        </div>
      </footer>

      {/* Modal for viewing item */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="max-w-4xl w-full bg-[#1A1A1A] rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <BeforeAfterSlider 
              beforeUrl={selectedItem.before_url} 
              afterUrl={selectedItem.after_url}
            />
            <div className="p-6">
              {selectedItem.title && (
                <h3 className="text-xl font-semibold mb-2">{selectedItem.title}</h3>
              )}
              {selectedItem.description && (
                <p className="text-white/60">{selectedItem.description}</p>
              )}
              <button 
                onClick={() => setSelectedItem(null)}
                className="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
