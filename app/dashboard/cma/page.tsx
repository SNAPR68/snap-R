'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Script from 'next/script';
import {
  Loader2, Home, ChevronRight, FileText, Plus, Trash2,
  Download, Sparkles, DollarSign,
  Check, ArrowLeft, User, Eye
} from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  year_built?: number;
  property_type?: string;
  thumbnail?: string | null;
  photos?: { id: string; url: string }[];
}

interface Comparable {
  id: string;
  address: string;
  soldPrice: number;
  soldDate: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt?: number;
  notes?: string;
}

interface AgentInfo {
  name: string;
  phone: string;
  email: string;
  brokerage: string;
  photo?: string;
}

declare global {
  interface Window {
    html2pdf: any;
  }
}

function CMAGenerator() {
  const [step, setStep] = useState<'select' | 'comps' | 'review' | 'result'>('select');
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [html2pdfLoaded, setHtml2pdfLoaded] = useState(false);
  
  // Comps state
  const [comps, setComps] = useState<Comparable[]>([
    { id: '1', address: '', soldPrice: 0, soldDate: '', bedrooms: 0, bathrooms: 0, sqft: 0 },
    { id: '2', address: '', soldPrice: 0, soldDate: '', bedrooms: 0, bathrooms: 0, sqft: 0 },
    { id: '3', address: '', soldPrice: 0, soldDate: '', bedrooms: 0, bathrooms: 0, sqft: 0 },
  ]);
  
  // Pricing state
  const [recommendedPrice, setRecommendedPrice] = useState<number>(0);
  const [priceRangeLow, setPriceRangeLow] = useState<number>(0);
  const [priceRangeHigh, setPriceRangeHigh] = useState<number>(0);
  
  // Agent info
  const [agentInfo, setAgentInfo] = useState<AgentInfo>({
    name: '',
    phone: '',
    email: '',
    brokerage: '',
  });
  
  // Result
  const [reportHtml, setReportHtml] = useState<string>('');
  const [reportData, setReportData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadListings();
    loadAgentInfo();
  }, []);

  // Check for html2pdf library loading
  useEffect(() => {
    const checkHtml2pdf = () => {
      if (window.html2pdf) {
        console.log('[CMA] html2pdf library loaded successfully');
        setHtml2pdfLoaded(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkHtml2pdf()) {
      return;
    }

    // Check every second until loaded
    const interval = setInterval(() => {
      if (checkHtml2pdf()) {
        clearInterval(interval);
      }
    }, 1000);

    // Cleanup after 30 seconds (fallback)
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!window.html2pdf) {
        console.warn('[CMA] html2pdf library failed to load after 30 seconds');
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const loadListings = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('listings')
      .select('*, photos(id, raw_url, processed_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      const withThumbnails = await Promise.all(
        data.map(async (listing: any) => {
          const photos = listing.photos || [];
          const photoUrls: { id: string; url: string }[] = [];
          
          for (const photo of photos.slice(0, 6)) {
            const path = photo.processed_url || photo.raw_url;
            if (path) {
              if (path.startsWith('http')) {
                photoUrls.push({ id: photo.id, url: path });
              } else {
                const { data: urlData } = await supabase.storage
                  .from('raw-images')
                  .createSignedUrl(path, 3600);
                if (urlData?.signedUrl) {
                  photoUrls.push({ id: photo.id, url: urlData.signedUrl });
                }
              }
            }
          }
          
          return {
            id: listing.id,
            title: listing.title,
            address: listing.address,
            city: listing.city,
            state: listing.state,
            zip: listing.zip,
            price: listing.price,
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            sqft: listing.sqft,
            year_built: listing.year_built,
            property_type: listing.property_type,
            thumbnail: photoUrls[0]?.url || null,
            photos: photoUrls,
          };
        })
      );
      setListings(withThumbnails);
    }
    setLoading(false);
  };

  const loadAgentInfo = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone, email, company')
      .eq('id', user.id)
      .single();

    if (profile) {
      setAgentInfo({
        name: profile.full_name || '',
        phone: profile.phone || '',
        email: profile.email || user.email || '',
        brokerage: profile.company || '',
      });
    }
  };

  const handleSelectListing = (listing: Listing) => {
    setSelectedListing(listing);
    if (listing.price) {
      setRecommendedPrice(listing.price);
      setPriceRangeLow(Math.round(listing.price * 0.95));
      setPriceRangeHigh(Math.round(listing.price * 1.05));
    }
    setStep('comps');
  };

  const updateComp = (id: string, field: keyof Comparable, value: any) => {
    setComps(comps.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addComp = () => {
    if (comps.length < 6) {
      setComps([...comps, {
        id: Date.now().toString(),
        address: '',
        soldPrice: 0,
        soldDate: '',
        bedrooms: 0,
        bathrooms: 0,
        sqft: 0,
      }]);
    }
  };

  const removeComp = (id: string) => {
    if (comps.length > 1) {
      setComps(comps.filter(c => c.id !== id));
    }
  };

  const calculateAverages = () => {
    const validComps = comps.filter(c => c.soldPrice > 0 && c.sqft > 0);
    if (validComps.length === 0) return { avgPrice: 0, avgPricePerSqft: 0, avgSqft: 0 };
    
    const avgPrice = validComps.reduce((sum, c) => sum + c.soldPrice, 0) / validComps.length;
    const avgPricePerSqft = validComps.reduce((sum, c) => sum + (c.soldPrice / c.sqft), 0) / validComps.length;
    const avgSqft = validComps.reduce((sum, c) => sum + c.sqft, 0) / validComps.length;
    
    return { avgPrice, avgPricePerSqft, avgSqft };
  };

  const generateReport = async () => {
    if (!selectedListing) return;
    
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/cma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing: selectedListing,
          comparables: comps.filter(c => c.address && c.soldPrice > 0),
          pricing: {
            recommended: recommendedPrice,
            rangeLow: priceRangeLow,
            rangeHigh: priceRangeHigh,
          },
          agentInfo,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }

      setReportHtml(data.html);
      setReportData(data);
      setStep('result');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const downloadPDF = async () => {
    console.log('[CMA] downloadPDF called');
    
    if (!reportHtml) {
      console.error('[CMA] No report HTML available');
      setError('No report content available. Please generate the report first.');
      return;
    }

    setDownloading(true);
    setError(null);
    
    let container: HTMLDivElement | null = null;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      console.log('[CMA] Libraries loaded via npm');

      container = document.createElement('div');
      container.innerHTML = reportHtml;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '8.5in';
      container.style.background = 'white';
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'in', 'letter');
      
      const pdfWidth = 8.5;
      const pdfHeight = 11;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const filename = `CMA-${selectedListing?.address || 'Report'}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      console.log('[CMA] PDF saved:', filename);
      
    } catch (err: any) {
      console.error('[CMA] PDF generation error:', err);
      setError(`Failed to generate PDF: ${err.message || 'Unknown error'}. Please try again.`);
    } finally {
      if (container && container.parentNode) {
        document.body.removeChild(container);
      }
      setDownloading(false);
      console.log('[CMA] downloadPDF finished');
    }
  };

  const validCompsCount = comps.filter(c => c.address && c.soldPrice > 0).length;
  const { avgPrice, avgPricePerSqft } = calculateAverages();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  // Step 1: Select Listing
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
        {/* Load html2pdf library */}
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
          onLoad={() => setHtml2pdfLoaded(true)}
        />
        
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl">
              <FileText className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">CMA Report Generator</h1>
              <p className="text-white/50">Create professional Comparative Market Analysis reports</p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
            <h3 className="font-semibold text-amber-400 mb-2">What's included in your CMA Report:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-white/70">
              {['Property photos', 'Comp comparison', 'Price analysis', 'Market narrative', '$/sqft charts', 'Agent branding', 'PDF download', 'Professional design'].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-lg font-bold mb-4">Select a Listing</h2>
          <div className="space-y-3">
            {listings.length > 0 ? listings.map(listing => (
              <button
                key={listing.id}
                onClick={() => handleSelectListing(listing)}
                className="w-full flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-amber-500/30 transition-all text-left"
              >
                <div className="w-20 h-14 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                  {listing.thumbnail ? (
                    <img src={listing.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-6 h-6 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{listing.title || listing.address || 'Untitled'}</div>
                  <div className="text-sm text-white/50 flex flex-wrap gap-x-3">
                    {listing.bedrooms && <span>{listing.bedrooms} bed</span>}
                    {listing.bathrooms && <span>{listing.bathrooms} bath</span>}
                    {listing.sqft && <span>{listing.sqft.toLocaleString()} sqft</span>}
                    {listing.price && <span className="text-amber-400">${listing.price.toLocaleString()}</span>}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
              </button>
            )) : (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <Home className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">No listings yet. Create one first.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Enter Comps
  if (step === 'comps') {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
          onLoad={() => setHtml2pdfLoaded(true)}
        />
        
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('select')}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Enter Comparable Sales</h1>
                <p className="text-white/50">{selectedListing?.address || selectedListing?.title}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/50">Subject Property</div>
              <div className="text-xl font-bold text-amber-400">
                ${selectedListing?.price?.toLocaleString() || '—'}
              </div>
            </div>
          </div>

          {/* Subject Property Summary */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-4">
              {selectedListing?.thumbnail && (
                <img src={selectedListing.thumbnail} alt="" className="w-24 h-16 object-cover rounded-lg" />
              )}
              <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                <div><div className="text-white/50">Beds</div><div className="font-bold">{selectedListing?.bedrooms || '—'}</div></div>
                <div><div className="text-white/50">Baths</div><div className="font-bold">{selectedListing?.bathrooms || '—'}</div></div>
                <div><div className="text-white/50">Sqft</div><div className="font-bold">{selectedListing?.sqft?.toLocaleString() || '—'}</div></div>
                <div><div className="text-white/50">Year Built</div><div className="font-bold">{selectedListing?.year_built || '—'}</div></div>
              </div>
            </div>
          </div>

          {/* Comps Entry */}
          <div className="space-y-4 mb-6">
            {comps.map((comp, index) => (
              <div key={comp.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Comparable #{index + 1}</h3>
                  {comps.length > 1 && (
                    <button onClick={() => removeComp(comp.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs text-white/50 mb-1">Address *</label>
                    <input type="text" value={comp.address} onChange={(e) => updateComp(comp.id, 'address', e.target.value)} placeholder="123 Main St" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Sold Price *</label>
                    <input type="number" value={comp.soldPrice || ''} onChange={(e) => updateComp(comp.id, 'soldPrice', Number(e.target.value))} placeholder="500000" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Sold Date</label>
                    <input type="date" value={comp.soldDate} onChange={(e) => updateComp(comp.id, 'soldDate', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Beds</label>
                    <input type="number" value={comp.bedrooms || ''} onChange={(e) => updateComp(comp.id, 'bedrooms', Number(e.target.value))} placeholder="3" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Baths</label>
                    <input type="number" step="0.5" value={comp.bathrooms || ''} onChange={(e) => updateComp(comp.id, 'bathrooms', Number(e.target.value))} placeholder="2" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Sqft *</label>
                    <input type="number" value={comp.sqft || ''} onChange={(e) => updateComp(comp.id, 'sqft', Number(e.target.value))} placeholder="2000" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">$/Sqft</label>
                    <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-amber-400">
                      {comp.sqft > 0 && comp.soldPrice > 0 ? `$${(comp.soldPrice / comp.sqft).toFixed(0)}` : '—'}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {comps.length < 6 && (
              <button onClick={addComp} className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-white/50 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                Add Another Comparable
              </button>
            )}
          </div>

          {/* Analysis Summary */}
          {validCompsCount > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <h3 className="font-bold mb-3">Quick Analysis</h3>
              <div className="grid grid-cols-3 gap-4">
                <div><div className="text-sm text-white/50">Avg Sold Price</div><div className="text-xl font-bold">${Math.round(avgPrice).toLocaleString()}</div></div>
                <div><div className="text-sm text-white/50">Avg $/Sqft</div><div className="text-xl font-bold">${avgPricePerSqft.toFixed(0)}</div></div>
                <div><div className="text-sm text-white/50">Suggested Price</div><div className="text-xl font-bold text-amber-400">${selectedListing?.sqft ? Math.round(avgPricePerSqft * selectedListing.sqft).toLocaleString() : '—'}</div></div>
              </div>
            </div>
          )}

          <button onClick={() => setStep('review')} disabled={validCompsCount < 1} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            Continue to Review ({validCompsCount} comp{validCompsCount !== 1 ? 's' : ''})
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Review & Pricing
  if (step === 'review') {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
          onLoad={() => setHtml2pdfLoaded(true)}
        />
        
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setStep('comps')} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Review & Generate</h1>
              <p className="text-white/50">Set pricing and agent info</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Pricing */}
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  Recommended Pricing
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Recommended List Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
                      <input type="number" value={recommendedPrice || ''} onChange={(e) => setRecommendedPrice(Number(e.target.value))} className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-xl font-bold focus:outline-none focus:border-amber-500/50" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Price Range Low</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
                        <input type="number" value={priceRangeLow || ''} onChange={(e) => setPriceRangeLow(Number(e.target.value))} className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Price Range High</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
                        <input type="number" value={priceRangeHigh || ''} onChange={(e) => setPriceRangeHigh(Number(e.target.value))} className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50" />
                      </div>
                    </div>
                  </div>
                </div>

                {avgPricePerSqft > 0 && selectedListing?.sqft && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="text-sm text-white/70">Based on ${avgPricePerSqft.toFixed(0)}/sqft avg:</div>
                    <button
                      onClick={() => {
                        const suggested = Math.round(avgPricePerSqft * selectedListing.sqft!);
                        setRecommendedPrice(suggested);
                        setPriceRangeLow(Math.round(suggested * 0.95));
                        setPriceRangeHigh(Math.round(suggested * 1.05));
                      }}
                      className="text-amber-400 font-bold hover:underline"
                    >
                      Use ${Math.round(avgPricePerSqft * selectedListing.sqft).toLocaleString()}
                    </button>
                  </div>
                )}
              </div>

              {/* Comps Summary */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-4">Comparables Summary</h3>
                <div className="space-y-2 text-sm">
                  {comps.filter(c => c.address && c.soldPrice > 0).map((comp) => (
                    <div key={comp.id} className="flex justify-between">
                      <span className="text-white/70 truncate max-w-[200px]">{comp.address}</span>
                      <span className="font-medium">${comp.soldPrice.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Agent Info */}
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-400" />
                  Agent Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Your Name</label>
                    <input type="text" value={agentInfo.name} onChange={(e) => setAgentInfo({ ...agentInfo, name: e.target.value })} placeholder="John Smith" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Phone</label>
                    <input type="text" value={agentInfo.phone} onChange={(e) => setAgentInfo({ ...agentInfo, phone: e.target.value })} placeholder="(555) 123-4567" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Email</label>
                    <input type="email" value={agentInfo.email} onChange={(e) => setAgentInfo({ ...agentInfo, email: e.target.value })} placeholder="john@realty.com" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Brokerage</label>
                    <input type="text" value={agentInfo.brokerage} onChange={(e) => setAgentInfo({ ...agentInfo, brokerage: e.target.value })} placeholder="ABC Realty" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50" />
                  </div>
                </div>
              </div>

              {/* What's Included */}
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-6">
                <h3 className="font-bold mb-3 text-amber-400">Your Report Will Include:</h3>
                <ul className="space-y-2 text-sm text-white/70">
                  {['Professional cover page', 'Property photos gallery', 'Side-by-side comp comparison', 'Price per sqft analysis chart', 'AI-generated market narrative', 'Your branding & contact info'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={generateReport}
            disabled={processing || !recommendedPrice}
            className="w-full mt-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {processing ? (
              <><Loader2 className="w-5 h-5 animate-spin" />Generating Report...</>
            ) : (
              <><Sparkles className="w-5 h-5" />Generate CMA Report</>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Result
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[CMA] html2pdf script loaded');
          setHtml2pdfLoaded(true);
          // Ensure it's available on window
          if (typeof window !== 'undefined' && !window.html2pdf && (window as any).html2pdf) {
            (window as any).html2pdf = (window as any).html2pdf;
          }
        }}
        onError={(e) => {
          console.error('[CMA] html2pdf script failed to load:', e);
          setError('Failed to load PDF library. Please refresh the page.');
        }}
      />
      
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">CMA Report Ready!</h1>
          <p className="text-white/50">Your professional report has been generated</p>
        </div>

        {/* Report Preview */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <FileText className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <div className="font-bold">CMA Report - {selectedListing?.address || selectedListing?.title}</div>
              <div className="text-sm text-white/50">
                {validCompsCount} comparables • Generated {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-white/5 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-white/50">Recommended Price</div>
              <div className="text-xl font-bold text-amber-400">${recommendedPrice.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-white/50">Price Range</div>
              <div className="text-lg font-medium">${priceRangeLow.toLocaleString()} - ${priceRangeHigh.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-white/50">Avg $/Sqft</div>
              <div className="text-xl font-bold">${avgPricePerSqft.toFixed(0)}</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              setStep('select');
              setSelectedListing(null);
              setComps([
                { id: '1', address: '', soldPrice: 0, soldDate: '', bedrooms: 0, bathrooms: 0, sqft: 0 },
                { id: '2', address: '', soldPrice: 0, soldDate: '', bedrooms: 0, bathrooms: 0, sqft: 0 },
                { id: '3', address: '', soldPrice: 0, soldDate: '', bedrooms: 0, bathrooms: 0, sqft: 0 },
              ]);
              setReportHtml('');
            }}
            className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors"
          >
            Create Another
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="py-3 px-6 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <Eye className="w-5 h-5" />
            Preview
          </button>
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {downloading ? (
              <><Loader2 className="w-5 h-5 animate-spin" />Generating PDF...</>
            ) : (
              <><Download className="w-5 h-5" />Download PDF</>
            )}
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && reportHtml && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-gray-100 p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Report Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
            <div 
              ref={reportContainerRef}
              dangerouslySetInnerHTML={{ __html: reportHtml }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function CMAPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    }>
      <CMAGenerator />
    </Suspense>
  );
}
