'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Loader2, Home, ChevronRight, Mic, Play, Pause, Download,
  Check, Volume2, VolumeX, RefreshCw, Sparkles, Clock,
  DollarSign, FileText, Copy, Edit2, User, Phone, Lightbulb,
  Wand2, Music, Settings, ChevronDown
} from 'lucide-react';

// Voice Options
const VOICE_OPTIONS = [
  { id: 'professional-male', name: 'James', description: 'Professional Male', gender: 'male', style: 'professional' },
  { id: 'professional-female', name: 'Sarah', description: 'Professional Female', gender: 'female', style: 'professional' },
  { id: 'luxury-male', name: 'Richard', description: 'Luxury Male', gender: 'male', style: 'luxury' },
  { id: 'luxury-female', name: 'Victoria', description: 'Luxury Female', gender: 'female', style: 'luxury' },
  { id: 'friendly-male', name: 'Mike', description: 'Friendly Male', gender: 'male', style: 'friendly' },
  { id: 'friendly-female', name: 'Emma', description: 'Friendly Female', gender: 'female', style: 'friendly' },
];

const SCRIPT_STYLES = [
  { id: 'professional', name: 'Professional', description: 'Formal, business-like tone' },
  { id: 'luxury', name: 'Luxury', description: 'Upscale, exclusive tone' },
  { id: 'friendly', name: 'Friendly', description: 'Warm, welcoming tone' },
  { id: 'firstTimeBuyer', name: 'First-Time Buyer', description: 'Helpful, informative tone' },
];

// Flat $2 price per voiceover - Complete plan gets 5 free/month
const DURATION_OPTIONS = [
  { value: 30, label: '30 seconds', price: 2 },
  { value: 60, label: '60 seconds', price: 2 },
  { value: 90, label: '90 seconds', price: 2 },
  { value: 120, label: '2 minutes', price: 2 },
];

interface Listing {
  id: string;
  title: string;
  address?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  features?: string[];
  thumbnail?: string | null;
}

// Audio Player Component with better error handling
function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Reset state when audioUrl changes
    setIsPlaying(false);
    setProgress(0);
    setError(false);
    setIsLoaded(false);
    setDuration(0);
  }, [audioUrl]);

  const togglePlay = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (err) {
        console.error('Playback error:', err);
        setError(true);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoaded(true);
    }
  };

  const handleCanPlay = () => {
    setIsLoaded(true);
    setError(false);
  };

  const handleError = (e: any) => {
    console.error('Audio failed to load:', e);
    setError(true);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = percent * duration;
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Convert base64 data URL to blob URL for better browser compatibility
  const getAudioSrc = () => {
    if (audioUrl.startsWith('data:audio')) {
      try {
        const base64 = audioUrl.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        return URL.createObjectURL(blob);
      } catch (e) {
        console.error('Failed to convert base64 to blob:', e);
        return audioUrl;
      }
    }
    return audioUrl;
  };

  const [blobUrl, setBlobUrl] = useState<string>('');
  
  useEffect(() => {
    const url = getAudioSrc();
    setBlobUrl(url);
    
    // Cleanup blob URL on unmount
    return () => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [audioUrl]);

  const handleDownload = () => {
    try {
      const a = document.createElement('a');
      a.href = blobUrl || audioUrl;
      a.download = 'voiceover.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <audio
        ref={audioRef}
        src={blobUrl}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onEnded={handleEnded}
      />
      
      {error ? (
        <div className="text-center py-4">
          <p className="text-red-400 text-sm mb-2">Audio failed to load</p>
          <button 
            onClick={handleDownload}
            className="text-pink-400 hover:text-pink-300 text-sm underline"
          >
            Download audio file instead
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            disabled={!isLoaded}
            className={`w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center transition-all ${
              isLoaded ? 'hover:from-pink-400 hover:to-purple-400' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            {!isLoaded ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-1" />
            )}
          </button>
          
          <div className="flex-1">
            <div 
              className="h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-white/50">
              <span>{formatTime((progress / 100) * duration)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          <button
            onClick={handleDownload}
            className="p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

// Main Voiceover Generator Component
function VoiceoverGenerator() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [voiceId, setVoiceId] = useState('professional-male');
  const [style, setStyle] = useState('professional');
  const [duration, setDuration] = useState(60);
  const [includeCallToAction, setIncludeCallToAction] = useState(true);
  const [agentName, setAgentName] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [customScript, setCustomScript] = useState('');
  const [useCustomScript, setUseCustomScript] = useState(false);
  
  // Result state
  const [processing, setProcessing] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'configure' | 'result'>('select');

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('listings')
      .select('*, photos!photos_listing_id_fkey(id, raw_url, processed_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      const withThumbnails = await Promise.all(
        data.map(async (listing: any) => {
          const photos = listing.photos || [];
          const firstPhoto = photos[0];
          let thumbnail = null;
          if (firstPhoto) {
            const path = firstPhoto.processed_url || firstPhoto.raw_url;
            if (path && !path.startsWith('http')) {
              const { data: urlData } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600);
              thumbnail = urlData?.signedUrl;
            }
          }
          return { 
            id: listing.id, 
            title: listing.title, 
            address: listing.address,
            price: listing.price,
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            sqft: listing.sqft,
            features: listing.features,
            thumbnail 
          };
        })
      );
      setListings(withThumbnails);
    }
    setLoading(false);
  };

  const handleSelectListing = (listing: Listing) => {
    setSelectedListing(listing);
    setStep('configure');
  };

  const generateScriptOnly = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: selectedListing?.id,
          propertyDetails: {
            address: selectedListing?.address,
            price: selectedListing?.price ? `$${selectedListing.price.toLocaleString()}` : undefined,
            bedrooms: selectedListing?.bedrooms,
            bathrooms: selectedListing?.bathrooms,
            sqft: selectedListing?.sqft,
            features: selectedListing?.features,
          },
          style,
          duration,
          includeCallToAction,
          agentName,
          agentPhone,
          scriptOnly: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setGeneratedScript(data.script);
      setCustomScript(data.script);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const generateVoiceover = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: selectedListing?.id,
          propertyDetails: {
            address: selectedListing?.address,
            price: selectedListing?.price ? `$${selectedListing.price.toLocaleString()}` : undefined,
            bedrooms: selectedListing?.bedrooms,
            bathrooms: selectedListing?.bathrooms,
            sqft: selectedListing?.sqft,
            features: selectedListing?.features,
          },
          style,
          voiceId,
          duration,
          includeCallToAction,
          agentName,
          agentPhone,
          customScript: useCustomScript ? customScript : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setGeneratedScript(data.script);
      setAudioUrl(data.audioUrl);
      setStep('result');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const selectedDuration = DURATION_OPTIONS.find(d => d.value === duration)!;
  const selectedVoice = VOICE_OPTIONS.find(v => v.id === voiceId)!;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
      </div>
    );
  }

  // Step 1: Select Listing
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl">
              <Mic className="w-8 h-8 text-pink-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Video Voiceover</h1>
              <p className="text-white/50">Generate professional narration for your property videos</p>
            </div>
          </div>

          <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-pink-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-pink-400 mb-1">How it works</h3>
                <p className="text-sm text-white/70">
                  AI generates a professional script based on your property details, then creates 
                  a natural-sounding voiceover. Perfect for property videos, virtual tours, and social media.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-400">Pricing</h3>
                <p className="text-sm text-white/70">Complete plan: 5 FREE/month • Extra: $2 each</p>
              </div>
              <div className="text-2xl font-bold text-green-400">$2</div>
            </div>
          </div>

          <h2 className="text-lg font-bold mb-4">Select a Listing</h2>
          <div className="space-y-2">
            {listings.map(listing => (
              <button
                key={listing.id}
                onClick={() => handleSelectListing(listing)}
                className="w-full flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-left"
              >
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-white/10">
                  {listing.thumbnail ? (
                    <img src={listing.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-5 h-5 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{listing.title || 'Untitled Listing'}</div>
                  <div className="text-sm text-white/50">
                    {[
                      listing.bedrooms && `${listing.bedrooms} bed`,
                      listing.bathrooms && `${listing.bathrooms} bath`,
                      listing.sqft && `${listing.sqft.toLocaleString()} sqft`,
                    ].filter(Boolean).join(' • ') || 'No details'}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Configure
  if (step === 'configure') {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl">
                <Mic className="w-8 h-8 text-pink-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Configure Voiceover</h1>
                <p className="text-white/50">{selectedListing?.title}</p>
              </div>
            </div>
            <button onClick={() => setStep('select')} className="text-white/50 hover:text-white">
              ← Change Listing
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Voice & Style */}
            <div className="space-y-6">
              {/* Voice Selection */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-pink-400" />
                  Select Voice
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {VOICE_OPTIONS.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => setVoiceId(voice.id)}
                      className={`p-3 rounded-lg text-left transition-all ${
                        voiceId === voice.id
                          ? 'bg-pink-500/20 border border-pink-500/50'
                          : 'bg-white/5 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="font-medium">{voice.name}</div>
                      <div className="text-xs text-white/50">{voice.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Selection */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-pink-400" />
                  Script Style
                </h3>
                <div className="space-y-2">
                  {SCRIPT_STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        style === s.id
                          ? 'bg-pink-500/20 border border-pink-500/50'
                          : 'bg-white/5 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-white/50">{s.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-pink-400" />
                  Duration
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDuration(opt.value)}
                      className={`p-3 rounded-lg text-center transition-all ${
                        duration === opt.value
                          ? 'bg-pink-500/20 border border-pink-500/50'
                          : 'bg-white/5 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="font-medium">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Agent Info & Script */}
            <div className="space-y-6">
              {/* Agent Info */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-pink-400" />
                  Agent Info (for Call to Action)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Agent Name</label>
                    <input
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="John Smith"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Phone Number</label>
                    <input
                      type="text"
                      value={agentPhone}
                      onChange={(e) => setAgentPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50"
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCallToAction}
                      onChange={(e) => setIncludeCallToAction(e.target.checked)}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-pink-500 focus:ring-pink-500"
                    />
                    <span className="text-sm">Include call to action at end</span>
                  </label>
                </div>
              </div>

              {/* Custom Script Option */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-pink-400" />
                    Script
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomScript}
                      onChange={(e) => setUseCustomScript(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-pink-500 focus:ring-pink-500"
                    />
                    <span className="text-sm text-white/60">Use custom script</span>
                  </label>
                </div>
                
                {useCustomScript ? (
                  <textarea
                    value={customScript}
                    onChange={(e) => setCustomScript(e.target.value)}
                    placeholder="Enter your custom script here..."
                    rows={6}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50 resize-none"
                  />
                ) : (
                  <div>
                    <p className="text-sm text-white/50 mb-3">
                      AI will generate a script based on your property details and style selection.
                    </p>
                    <button
                      onClick={generateScriptOnly}
                      disabled={processing}
                      className="w-full py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Preview Script
                    </button>
                    {generatedScript && (
                      <div className="mt-3 p-3 bg-white/5 rounded-lg text-sm text-white/70 max-h-40 overflow-y-auto">
                        {generatedScript}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <div className="mt-8 bg-pink-500/10 border border-pink-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-lg">Total</span>
                <div className="text-sm text-white/50">
                  {selectedDuration.label} • {selectedVoice.name} voice
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-pink-400">$2</span>
                <div className="text-sm text-white/40">or FREE with Complete plan</div>
              </div>
            </div>
            
            <button
              onClick={generateVoiceover}
              disabled={processing || (useCustomScript && !customScript)}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl hover:from-pink-400 hover:to-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Voiceover...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Voiceover
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Result
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Voiceover Ready!</h1>
          <p className="text-white/50">Your AI-generated narration is ready to use</p>
        </div>

        {/* Audio Player */}
        <div className="mb-6">
          <h3 className="font-bold mb-3">Listen to Your Voiceover</h3>
          {audioUrl && <AudioPlayer audioUrl={audioUrl} />}
        </div>

        {/* Script */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Script</h3>
            <button
              onClick={() => navigator.clipboard.writeText(generatedScript)}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white"
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>
          <p className="text-white/70 whitespace-pre-wrap">{generatedScript}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              setStep('select');
              setAudioUrl('');
              setGeneratedScript('');
            }}
            className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors"
          >
            Create Another
          </button>
          <button
            onClick={() => {
              if (audioUrl) {
                // Convert base64 to blob for download
                if (audioUrl.startsWith('data:audio')) {
                  try {
                    const base64 = audioUrl.split(',')[1];
                    const binary = atob(base64);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                      bytes[i] = binary.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: 'audio/mpeg' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'voiceover.mp3';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } catch (e) {
                    console.error('Download failed:', e);
                  }
                } else {
                  const a = document.createElement('a');
                  a.href = audioUrl;
                  a.download = 'voiceover.mp3';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }
              }
            }}
            className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-bold text-center hover:from-pink-400 hover:to-purple-400 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download MP3
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VoiceoverPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
      </div>
    }>
      <VoiceoverGenerator />
    </Suspense>
  );
}
