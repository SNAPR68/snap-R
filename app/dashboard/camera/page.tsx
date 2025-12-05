'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Camera, ArrowLeft, Loader2, X, Sun, Moon, Leaf, Waves, Trash2, Sofa, Flame, Tv, Lightbulb, Sparkles, Wand2, Download, Check, Move, Circle, Palette, PanelTop } from 'lucide-react';
import Link from 'next/link';

const AI_TOOLS = [
  { id: 'sky-replacement', name: 'Sky Replace', icon: Sun, credits: 1, category: 'EXTERIOR', hasPresets: true },
  { id: 'virtual-twilight', name: 'Twilight', icon: Moon, credits: 2, category: 'EXTERIOR', hasPresets: true },
  { id: 'lawn-repair', name: 'Lawn Repair', icon: Leaf, credits: 1, category: 'EXTERIOR', hasPresets: true },
  { id: 'pool-enhance', name: 'Pool', icon: Waves, credits: 1, category: 'EXTERIOR', hasPresets: false },
  { id: 'declutter', name: 'Declutter', icon: Trash2, credits: 2, category: 'INTERIOR', hasPresets: true },
  { id: 'virtual-staging', name: 'Staging', icon: Sofa, credits: 3, category: 'INTERIOR', hasPresets: true },
  { id: 'fire-fireplace', name: 'Fireplace', icon: Flame, credits: 1, category: 'INTERIOR', hasPresets: true },
  { id: 'tv-screen', name: 'TV Screen', icon: Tv, credits: 1, category: 'INTERIOR', hasPresets: true },
  { id: 'lights-on', name: 'Lights On', icon: Lightbulb, credits: 1, category: 'INTERIOR', hasPresets: true },
  { id: 'window-masking', name: 'Window Fix', icon: PanelTop, credits: 2, category: 'INTERIOR', hasPresets: true },
  { id: 'hdr', name: 'HDR', icon: Sparkles, credits: 1, category: 'ENHANCE', hasPresets: false },
  { id: 'auto-enhance', name: 'Auto Enhance', icon: Wand2, credits: 1, category: 'ENHANCE', hasPresets: false },
  { id: 'perspective-correction', name: 'Perspective', icon: Move, credits: 1, category: 'ENHANCE', hasPresets: false },
  { id: 'lens-correction', name: 'Lens Fix', icon: Circle, credits: 1, category: 'ENHANCE', hasPresets: false },
  { id: 'color-balance', name: 'Color', icon: Palette, credits: 1, category: 'ENHANCE', hasPresets: true },
];

const PRESETS: Record<string, { id: string; name: string }[]> = {
  'sky-replacement': [
    { id: 'blue-sky', name: 'Blue Sky' },
    { id: 'partly-cloudy', name: 'Partly Cloudy' },
    { id: 'dramatic', name: 'Dramatic' },
    { id: 'sunset', name: 'Sunset' },
  ],
  'virtual-twilight': [
    { id: 'dusk', name: 'Dusk' },
    { id: 'blue-hour', name: 'Blue Hour' },
    { id: 'night', name: 'Night' },
  ],
  'lawn-repair': [
    { id: 'green-lush', name: 'Lush Green' },
    { id: 'natural', name: 'Natural' },
  ],
  'declutter': [
    { id: 'light', name: 'Light Clean' },
    { id: 'full', name: 'Full Clean' },
  ],
  'virtual-staging': [
    { id: 'modern', name: 'Modern' },
    { id: 'contemporary', name: 'Contemporary' },
    { id: 'minimalist', name: 'Minimalist' },
    { id: 'scandinavian', name: 'Scandinavian' },
  ],
  'fire-fireplace': [
    { id: 'warm', name: 'Warm Glow' },
    { id: 'bright', name: 'Bright Fire' },
  ],
  'tv-screen': [
    { id: 'nature', name: 'Nature Scene' },
    { id: 'abstract', name: 'Abstract' },
    { id: 'off', name: 'Screen Off' },
  ],
  'lights-on': [
    { id: 'warm', name: 'Warm Light' },
    { id: 'bright', name: 'Bright Light' },
  ],
  'window-masking': [
    { id: 'sky', name: 'Sky View' },
    { id: 'balanced', name: 'Balanced' },
  ],
  'color-balance': [
    { id: 'warm', name: 'Warm Tones' },
    { id: 'cool', name: 'Cool Tones' },
    { id: 'neutral', name: 'Neutral' },
  ],
};

export default function CameraPage() {
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<'capture' | 'tools' | 'presets' | 'processing' | 'result'>('capture');
  const [preview, setPreview] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [selectedTool, setSelectedTool] = useState<typeof AI_TOOLS[0] | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('EXTERIOR');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user);
      else router.push('/auth/login');
    });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOriginalFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
      setStep('tools');
    };
    reader.readAsDataURL(file);
  };

  const handleToolSelect = (tool: typeof AI_TOOLS[0]) => {
    setSelectedTool(tool);
    if (tool.hasPresets && PRESETS[tool.id]) {
      setStep('presets');
    } else {
      processImage(tool.id, null);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    if (selectedTool) {
      processImage(selectedTool.id, presetId);
    }
  };

  const processImage = async (toolId: string, presetId: string | null) => {
    if (!originalFile || !user) return;
    setStep('processing');
    setProcessing(true);
    setError(null);

    try {
      let { data: projects } = await supabase.from('projects').select('id').eq('user_id', user.id).limit(1);
      let projectId: string;
      if (!projects || projects.length === 0) {
        const { data: newProject, error: projError } = await supabase.from('projects').insert({ user_id: user.id, title: 'Quick Captures' }).select().single();
        if (projError || !newProject) throw new Error('Failed to create project');
        projectId = newProject.id;
      } else {
        projectId = projects[0].id;
      }

      const timestamp = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      const { data: listing, error: listError } = await supabase.from('listings').insert({ user_id: user.id, project_id: projectId, title: `Snap ${timestamp}` }).select().single();
      
      if (listError || !listing) throw new Error('Failed to create listing');
      setListingId(listing.id);

      const fileExt = originalFile.name.split('.').pop() || 'jpg';
      const path = `${listing.id}/${Date.now()}-photo.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('raw-images').upload(path, originalFile, { 
        contentType: originalFile.type || 'image/jpeg',
        cacheControl: '3600'
      });
      if (uploadError) throw new Error('Upload failed: ' + uploadError.message);

      const { data: photo, error: photoError } = await supabase.from('photos').insert({ listing_id: listing.id, raw_url: path, status: 'pending' }).select().single();
      if (photoError || !photo) throw new Error('Failed to save photo');
      setPhotoId(photo.id);

      const enhanceRes = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: photo.id,
          toolId,
          options: presetId ? { prompt: presetId } : {}
        }),
      });

      if (!enhanceRes.ok) {
        const errData = await enhanceRes.json();
        throw new Error(errData.error || 'Enhancement failed');
      }

      const enhanceData = await enhanceRes.json();
      setResult(enhanceData.enhancedUrl);
      setStep('result');

    } catch (err: any) {
      console.error('Process error:', err);
      setError(err.message || 'Something went wrong');
      setStep('tools');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.download = `snapr-enhanced-${Date.now()}.jpg`;
    link.click();
  };

  const reset = () => {
    setPreview(null);
    setOriginalFile(null);
    setSelectedTool(null);
    setSelectedPreset(null);
    setResult(null);
    setError(null);
    setPhotoId(null);
    setStep('capture');
    setActiveCategory('EXTERIOR');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const categories = ['EXTERIOR', 'INTERIOR', 'ENHANCE'];
  const filteredTools = AI_TOOLS.filter(t => t.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <header className="h-14 bg-[#1A1A1A] border-b border-white/10 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold">Snap & Enhance</h1>
        <div className="w-8" />
      </header>

      <div className="p-4 max-w-lg mx-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 flex items-center justify-between text-sm">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {step === 'capture' && (
          <label className="block">
            <div className="w-full py-20 border-2 border-dashed border-[#D4A017]/50 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#D4A017] transition-colors">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                <Camera className="w-10 h-10 text-black" />
              </div>
              <p className="text-lg font-semibold">Take Photo</p>
              <p className="text-white/50 text-sm">or choose from gallery</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
          </label>
        )}

        {step === 'tools' && preview && (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden">
              <img src={preview} alt="Preview" className="w-full max-h-64 object-cover" />
            </div>
            
            <div className="flex gap-2 justify-center">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeCategory === cat 
                      ? 'bg-[#D4A017] text-black' 
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {filteredTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool)}
                  className="flex flex-col items-center gap-1.5 p-3 bg-white/5 hover:bg-[#D4A017]/20 border border-white/10 hover:border-[#D4A017]/50 rounded-xl transition-colors"
                >
                  <tool.icon className="w-5 h-5 text-[#D4A017]" />
                  <span className="text-xs text-center leading-tight">{tool.name}</span>
                  <span className="text-[10px] text-white/40">{tool.credits} cr</span>
                </button>
              ))}
            </div>
            <button onClick={reset} className="w-full py-3 bg-white/10 rounded-xl text-sm">Cancel</button>
          </div>
        )}

        {step === 'presets' && selectedTool && PRESETS[selectedTool.id] && (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden">
              <img src={preview!} alt="Preview" className="w-full max-h-64 object-cover" />
            </div>
            <p className="text-center text-white/60 text-sm">Select {selectedTool.name} style</p>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS[selectedTool.id].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  className="p-4 bg-white/5 hover:bg-[#D4A017]/20 border border-white/10 hover:border-[#D4A017]/50 rounded-xl transition-colors"
                >
                  <span className="text-sm">{preset.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep('tools')} className="w-full py-3 bg-white/10 rounded-xl text-sm">Back</button>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-12 h-12 text-[#D4A017] animate-spin" />
            <p className="text-lg font-semibold">Enhancing...</p>
            <p className="text-white/50 text-sm">{selectedTool?.name}{selectedPreset ? ` - ${selectedPreset}` : ''}</p>
          </div>
        )}

        {step === 'result' && result && (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden">
              <img src={result} alt="Enhanced" className="w-full" />
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Enhanced
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="w-full py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" /> Download
            </button>
            <Link href={`/dashboard/studio?id=${listingId}`} className="w-full py-3 bg-white/10 rounded-xl text-sm text-center block">Open in Studio</Link>
            <button onClick={reset} className="w-full py-3 bg-white/5 rounded-xl text-sm text-white/60">Enhance Another</button>
          </div>
        )}
      </div>
    </div>
  );
}
