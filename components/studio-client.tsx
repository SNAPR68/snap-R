'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import ShareGalleryModal from "./ShareGalleryModal";
import { HumanEditRequestModal } from "./human-edit-request";
import { MlsExportModal } from "./mls-export-modal";
import { AdjustmentPanel } from "./adjustment-panel";
import { StylePromptModal } from "./style-prompt-modal";
import Link from 'next/link';
import { ArrowLeft, Upload, Sun, Moon, Leaf, Trash2, Sofa, Sparkles, Wand2, Loader2, ChevronDown, ChevronUp, Check, X, Download, Share2, Copy, LogOut, FileArchive, UserCheck, Flame, Tv, Lightbulb, PanelTop, Waves, Move, Circle, Palette, Brain } from 'lucide-react';

const AI_TOOLS = [
  { id: 'sky-replacement', name: 'Sky Replacement', icon: Sun, credits: 1, category: 'EXTERIOR', hasPresets: true },
  { id: 'virtual-twilight', name: 'Virtual Twilight', icon: Moon, credits: 2, category: 'EXTERIOR', hasPresets: true },
  { id: 'lawn-repair', name: 'Lawn Repair', icon: Leaf, credits: 1, category: 'EXTERIOR', hasPresets: true },
  { id: 'pool-enhance', name: 'Pool Enhancement', icon: Waves, credits: 1, category: 'EXTERIOR', hasPresets: false },
  { id: 'declutter', name: 'Declutter', icon: Trash2, credits: 2, category: 'INTERIOR', hasPresets: true },
  { id: 'virtual-staging', name: 'Virtual Staging', icon: Sofa, credits: 3, category: 'INTERIOR', hasPresets: true },
  { id: 'fire-fireplace', name: 'Fire in Fireplace', icon: Flame, credits: 1, category: 'INTERIOR', hasPresets: true },
  { id: 'tv-screen', name: 'TV Screen Replace', icon: Tv, credits: 1, category: 'INTERIOR', hasPresets: true },
  { id: 'lights-on', name: 'Lights On', icon: Lightbulb, credits: 1, category: 'INTERIOR', hasPresets: true },
  { id: 'window-masking', name: 'Window Masking', icon: PanelTop, credits: 2, category: 'INTERIOR', hasPresets: true },
  { id: 'hdr', name: 'HDR Enhancement', icon: Sparkles, credits: 1, category: 'ENHANCE', hasPresets: false },
  { id: 'auto-enhance', name: 'Auto Enhance', icon: Wand2, credits: 1, category: 'ENHANCE', hasPresets: false },
  { id: 'perspective-correction', name: 'Perspective Fix', icon: Move, credits: 1, category: 'ENHANCE', hasPresets: false },
  { id: 'lens-correction', name: 'Lens Correction', icon: Circle, credits: 1, category: 'ENHANCE', hasPresets: false },
  { id: 'color-balance', name: 'Color Balance', icon: Palette, credits: 1, category: 'ENHANCE', hasPresets: true },
];

const TOOL_PRESETS: Record<string, { id: string; name: string; prompt: string; thumbnail: string }[]> = {
  'sky-replacement': [
    { id: 'clear-blue', name: 'Clear Blue', prompt: 'Replace ONLY the sky with a perfectly clear bright blue sky with no clouds. Do NOT change the house, trees, lawn, or anything else. Only the sky changes.', thumbnail: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?w=200&h=120&fit=crop' },
    { id: 'sunset', name: 'Sunset', prompt: 'Replace ONLY the sky with a dramatic sunset with orange, pink and purple colors. Do NOT change the house, trees, lawn, or anything else. Only the sky changes.', thumbnail: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=200&h=120&fit=crop' },
    { id: 'dramatic-clouds', name: 'Dramatic Clouds', prompt: 'Replace ONLY the sky with dramatic white fluffy clouds against deep blue sky. Do NOT change the house, trees, lawn, or anything else. Only the sky changes.', thumbnail: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=200&h=120&fit=crop' },
    { id: 'twilight', name: 'Twilight Sky', prompt: 'Replace ONLY the sky with a twilight dusk sky showing deep purple and blue gradient. Do NOT change the house lighting or anything else. Only the sky changes to twilight colors.', thumbnail: 'https://images.unsplash.com/photo-1472120435266-53107fd0c44a?w=200&h=120&fit=crop' },
  ],
  'virtual-twilight': [
    { id: 'dusk', name: 'Dusk', prompt: 'Transform to early dusk with purple-orange sky at horizon, soft twilight beginning, warm glow starting in windows', thumbnail: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=200&h=120&fit=crop' },
    { id: 'blue-hour', name: 'Blue Hour', prompt: 'Transform to blue hour with DEEP BLUE sky, no orange, all windows glowing bright warm yellow, dramatic blue atmosphere', thumbnail: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&h=120&fit=crop' },
    { id: 'golden-hour', name: 'Golden Hour', prompt: 'Transform to golden hour with WARM ORANGE sunset glow, golden light on house, orange-pink sky, windows lit warmly', thumbnail: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200&h=120&fit=crop' },
    { id: 'deep-night', name: 'Night', prompt: 'Transform to NIGHT scene with DARK BLACK-BLUE sky with stars visible, all house lights glowing bright, nighttime atmosphere', thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=200&h=120&fit=crop' },
  ],
  'lawn-repair': [
    { id: 'lush-green', name: 'Lush Green', prompt: 'Transform lawn into PERFECTLY MANICURED VIBRANT EMERALD GREEN grass like golf course putting green', thumbnail: 'https://images.unsplash.com/photo-1589923188651-268a9765e432?w=200&h=120&fit=crop' },
    { id: 'natural-green', name: 'Natural Green', prompt: 'Transform lawn into healthy NATURAL looking green grass like well-maintained residential lawn', thumbnail: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=200&h=120&fit=crop' },
  ],
  'declutter': [
    { id: 'light', name: 'Light Clean', prompt: 'Light Clean: Remove only small clutter like papers, cups, remotes from surfaces', thumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200&h=120&fit=crop' },
    { id: 'moderate', name: 'Moderate', prompt: 'Moderate: Remove clutter and personal items from counters, tables, floors', thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200&h=120&fit=crop' },
    { id: 'full', name: 'Full Clear', prompt: 'Full Clear: Remove ALL loose items and decorations, keep only furniture, minimalist', thumbnail: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=200&h=120&fit=crop' },
    { id: 'staging-ready', name: 'Staging Ready', prompt: 'Staging Ready: Remove EVERYTHING except walls floors windows. Empty room for virtual staging.', thumbnail: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=200&h=120&fit=crop' },
  ],
  'virtual-staging': [
    { id: 'modern', name: 'Modern', prompt: 'Stage with modern furniture - clean lines, neutral gray/white, minimal decor', thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=120&fit=crop' },
    { id: 'traditional', name: 'Traditional', prompt: 'Stage with traditional furniture - warm wood, rich fabrics, classic style', thumbnail: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=200&h=120&fit=crop' },
    { id: 'scandinavian', name: 'Scandinavian', prompt: 'Stage with Scandinavian style - light wood, white/beige, cozy minimal', thumbnail: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=200&h=120&fit=crop' },
    { id: 'luxury', name: 'Luxury', prompt: 'Stage with luxury furniture - velvet, gold accents, marble, glamorous', thumbnail: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=200&h=120&fit=crop' },
  ],
  'fire-fireplace': [
    { id: 'cozy-embers', name: 'Cozy Embers', prompt: 'Add gentle glowing embers and small flames, soft warm ambient glow', thumbnail: 'https://images.unsplash.com/photo-1544894079-e81a9eb1da21?w=200&h=120&fit=crop' },
    { id: 'warm-fire', name: 'Warm Fire', prompt: 'Add medium crackling fire with orange-yellow flames, comfortable warmth', thumbnail: 'https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=200&h=120&fit=crop' },
    { id: 'roaring-fire', name: 'Roaring Fire', prompt: 'Add large roaring fire with tall bright flames, strong warm glow', thumbnail: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=200&h=120&fit=crop' },
    { id: 'romantic', name: 'Romantic', prompt: 'Add romantic fire with dancing flames, soft golden glow, intimate atmosphere', thumbnail: 'https://images.unsplash.com/photo-1602541680664-739da68d2423?w=200&h=120&fit=crop' },
  ],
  'tv-screen': [
    { id: 'nature', name: 'Nature', prompt: 'Replace TV screen with beautiful mountain landscape, forest and lake scene', thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=120&fit=crop' },
    { id: 'abstract', name: 'Abstract Art', prompt: 'Replace TV screen with colorful abstract modern art painting', thumbnail: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=200&h=120&fit=crop' },
    { id: 'ocean', name: 'Ocean View', prompt: 'Replace TV screen with ocean beach scene, blue water sandy beach', thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=120&fit=crop' },
    { id: 'off', name: 'Black / Off', prompt: 'Make TV screen completely black and off, no reflections, matte black', thumbnail: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=200&h=120&fit=crop' },
  ],
  'lights-on': [
    { id: 'warm-glow', name: 'Warm Glow', prompt: 'Turn on all lights with warm golden glow, cozy tungsten warmth', thumbnail: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&h=120&fit=crop' },
    { id: 'bright-white', name: 'Bright White', prompt: 'Turn on all lights with bright clean white light, modern daylight', thumbnail: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200&h=120&fit=crop' },
    { id: 'ambient', name: 'Ambient', prompt: 'Turn on lights with soft ambient glow, subtle relaxed evening mood', thumbnail: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=200&h=120&fit=crop' },
    { id: 'all-lights', name: 'All Lights Max', prompt: 'Turn ALL lights on at full brightness, maximum illumination', thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=120&fit=crop' },
  ],
  'window-masking': [
    { id: 'balanced', name: 'Balanced', prompt: 'Balance window exposure, show clear outdoor view with blue sky, HDR look', thumbnail: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=200&h=120&fit=crop' },
    { id: 'sunny', name: 'Sunny Day', prompt: 'Show bright sunny day through windows, blue sky with clouds, cheerful', thumbnail: 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=200&h=120&fit=crop' },
    { id: 'garden', name: 'Garden View', prompt: 'Show garden and greenery through windows, trees landscaping visible', thumbnail: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=200&h=120&fit=crop' },
    { id: 'soft-light', name: 'Soft Light', prompt: 'Show soft diffused daylight through windows, gentle natural light', thumbnail: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=200&h=120&fit=crop' },
  ],
  'color-balance': [
    { id: 'warm', name: 'Warm Tones', prompt: 'Apply warm color balance, cozy golden warmth, inviting atmosphere', thumbnail: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=200&h=120&fit=crop' },
    { id: 'cool', name: 'Cool Tones', prompt: 'Apply cool color balance, fresh modern blue tones, crisp clean look', thumbnail: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=200&h=120&fit=crop' },
  ],
};

export function StudioClient({ listingId, userRole, showMlsFeatures = false, credits = 0 }: { listingId: string; userRole?: string; showMlsFeatures?: boolean; credits?: number }) {
  const supabase = createClient();
  const [listing, setListing] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<{ id: string; name: string; prompt: string } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['EXTERIOR', 'INTERIOR', 'ENHANCE']);
  const [adjustments, setAdjustments] = useState({ intensity: 100, brightness: 0, contrast: 0, saturation: 0, warmth: 0 });
  const [showFineTune, setShowFineTune] = useState(false);
  const [showStylePrompt, setShowStylePrompt] = useState(false);
  const [listingStyle, setListingStyle] = useState<{ brightness: number; contrast: number; saturation: number; warmth: number } | null>(null);
  const [zipLoading, setZipLoading] = useState(false);

  const getFilterStyle = () => {
    const { brightness, contrast, saturation, warmth } = adjustments;
    const filters: string[] = [];
    if (brightness !== 0) filters.push(`brightness(${100 + brightness}%)`);
    if (contrast !== 0) filters.push(`contrast(${100 + contrast}%)`);
    if (saturation !== 0) filters.push(`saturate(${100 + saturation}%)`);
    if (warmth > 0) filters.push(`sepia(${warmth * 0.3}%)`);
    else if (warmth < 0) filters.push(`hue-rotate(${warmth * 0.5}deg)`);
    return filters.length > 0 ? filters.join(" ") : "none";
  };

  const getListingStyleFilter = () => {
    if (!listingStyle) return "none";
    const { brightness, contrast, saturation, warmth } = listingStyle;
    const filters: string[] = [];
    if (brightness !== 0) filters.push("brightness(" + (100 + brightness) + "%)");
    if (contrast !== 0) filters.push("contrast(" + (100 + contrast) + "%)");
    if (saturation !== 0) filters.push("saturate(" + (100 + saturation) + "%)");
    if (warmth > 0) filters.push("sepia(" + (warmth * 0.3) + "%)");
    else if (warmth < 0) filters.push("hue-rotate(" + (warmth * 0.5) + "deg)");
    return filters.length > 0 ? filters.join(" ") : "none";
  };

  type PendingEnhancement = {
    storagePath?: string;
    originalUrl: string;
    enhancedUrl: string;
    toolId: string;
    photoId: string;
  };

  const [pendingEnhancement, setPendingEnhancement] = useState<PendingEnhancement | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [completedPhotos, setCompletedPhotos] = useState<any[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHumanEditModal, setShowHumanEditModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showMlsExport, setShowMlsExport] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareOptions, setShareOptions] = useState({ allowDownload: true, showComparison: true });

  useEffect(() => { loadData(); }, [listingId]);

  useEffect(() => {
    if (!showShareModal) setShareLoading(false);
  }, [showShareModal]);

  useEffect(() => {
    if (!showShareModal) return;
    let cancelled = false;
    const generateLink = async () => {
      try {
        setShareLoading(true);
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId, options: { allowDownload: shareOptions.allowDownload, showComparison: shareOptions.showComparison } }),
        });
        const data = await res.json();
        if (!cancelled && data.success && data.shareUrl) setShareLink(data.shareUrl);
      } catch (error) {
        console.error('[Share] Error', error);
      } finally {
        if (!cancelled) setShareLoading(false);
      }
    };
    generateLink();
    return () => { cancelled = true; };
  }, [showShareModal, shareOptions.allowDownload, shareOptions.showComparison, listingId]);

  const loadData = async () => {
    const { data: listingData } = await supabase.from('listings').select('*').eq('id', listingId).single();
    setListing(listingData);
    const { data: photosData } = await supabase.from('photos').select('*').eq('listing_id', listingId).order('created_at', { ascending: false });
    if (photosData) {
      const photosWithUrls = await Promise.all(photosData.map(async (photo) => {
        const { data: signedUrl } = await supabase.storage.from('raw-images').createSignedUrl(photo.raw_url, 3600);
        let processedSignedUrl = null;
        if (photo.processed_url) {
          const { data } = await supabase.storage.from('raw-images').createSignedUrl(photo.processed_url, 3600);
          processedSignedUrl = data?.signedUrl;
        }
        return { ...photo, signedRawUrl: signedUrl?.signedUrl, signedProcessedUrl: processedSignedUrl };
      }));
      setPhotos(photosWithUrls);
      setCompletedPhotos(photosWithUrls.filter(p => p.status === 'completed' && p.signedProcessedUrl));
      if (photosWithUrls.length && !selectedPhoto) setSelectedPhoto(photosWithUrls[0]);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const path = `${listingId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('raw-images').upload(path, file);
      if (!uploadError) await supabase.from('photos').insert({ listing_id: listingId, raw_url: path, status: 'pending' });
    }
    loadData();
  };

  const handleEnhance = async (toolId: string) => {
    if (!selectedPhoto || processing) return;
    const tool = AI_TOOLS.find(t => t.id === toolId);
    if (tool?.hasPresets && !selectedPreset) { alert('Please select a style first'); return; }
    setProcessing(true);
    setActiveTool(toolId);
    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: selectedPhoto.id, toolId, options: selectedPreset ? { preset: selectedPreset.id, prompt: selectedPreset.prompt } : {} }),
      });
      const data = await res.json();
      if (data.success && data.enhancedUrl) {
        setPendingEnhancement({ originalUrl: selectedPhoto.signedRawUrl, storagePath: data.storagePath, enhancedUrl: data.enhancedUrl, toolId, photoId: selectedPhoto.id });
        setSliderPosition(50);
      } else alert(data.error || 'Enhancement failed');
    } catch (error) { console.error('Enhancement failed:', error); }
    setProcessing(false);
    setActiveTool(null);
  };

  const handleAcceptEnhancement = async () => {
    if (!pendingEnhancement) return;
    setShowStylePrompt(true);
  };

  const handleJustThisPhoto = async () => {
    if (!pendingEnhancement) return;
    await supabase.from("photos").update({ status: "completed", processed_url: pendingEnhancement.storagePath || pendingEnhancement.enhancedUrl, variant: pendingEnhancement.toolId }).eq("id", pendingEnhancement.photoId);
    setPendingEnhancement(null);
    setShowStylePrompt(false);
    setAdjustments({ intensity: 100, brightness: 0, contrast: 0, saturation: 0, warmth: 0 });
    loadData();
  };

  const handleApplyStyleToAll = async (style: { brightness: number; contrast: number; saturation: number; warmth: number }) => {
    if (!pendingEnhancement) return;
    setListingStyle(style);
    await supabase.from("photos").update({ status: "completed", processed_url: pendingEnhancement.storagePath || pendingEnhancement.enhancedUrl, variant: pendingEnhancement.toolId }).eq("id", pendingEnhancement.photoId);
    setPendingEnhancement(null);
    setShowStylePrompt(false);
    setAdjustments({ intensity: 100, brightness: 0, contrast: 0, saturation: 0, warmth: 0 });
    loadData();
  };

  const handleShare = () => { setShareLink(''); setShowShareModal(true); };

  const copyLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (url: string, filename: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
  };

  const handleDownloadAll = async () => {
    if (completedPhotos.length === 0) return;
    setZipLoading(true);
    try {
      const response = await fetch('/api/download-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      });
      if (!response.ok) throw new Error('Failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (listing?.title || 'listing').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() + '-enhanced.zip';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download ZIP');
    }
    setZipLoading(false);
  };

  const handleDeleteListing = async () => {
    if (!window.confirm('Delete this entire listing and all photos? This cannot be undone.')) return;
    await supabase.from('photos').delete().eq('listing_id', listingId);
    await supabase.from('listings').delete().eq('id', listingId);
    window.location.href = '/dashboard';
  };

  const handleDeletePhoto = async (photoId: string, rawUrl: string) => {
    if (!window.confirm('Delete this original photo?')) return;
    await supabase.storage.from('raw-images').remove([rawUrl]);
    await supabase.from('photos').delete().eq('id', photoId);
    if (selectedPhoto?.id === photoId) setSelectedPhoto(null);
    loadData();
  };

  const handleDeleteEnhanced = async (photoId: string, processedUrl: string) => {
    if (!window.confirm('Delete this enhanced photo?')) return;
    await supabase.storage.from('raw-images').remove([processedUrl]);
    await supabase.from('photos').update({ processed_url: null, status: 'pending' }).eq('id', photoId);
    loadData();
  };

  const handleToolSelect = (toolId: string) => {
    if (selectedTool === toolId) { setSelectedTool(null); setSelectedPreset(null); }
    else { setSelectedTool(toolId); setSelectedPreset(null); }
  };

  const categories = [...new Set(AI_TOOLS.map(t => t.category))];
  const currentTool = AI_TOOLS.find(t => t.id === selectedTool);
  const currentPresets = selectedTool ? TOOL_PRESETS[selectedTool] : null;

  return (
    <div className="h-screen bg-[#0F0F0F] text-white flex flex-col overflow-hidden">
      <header className="h-14 bg-[#1A1A1A] border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span></Link>
          <div className="h-6 w-px bg-white/20 mx-2" />
          <Link href="/" className="flex items-center gap-2"><img src="/snapr-logo.png" alt="SnapR" className="w-10 h-10" /></Link>
          <div className="h-6 w-px bg-white/20 mx-2" />
          <h1 className="font-semibold truncate max-w-[200px]"><span className="text-white/50">Listing:</span> {listing?.title || 'Loading...'}</h1>
          {listingStyle && (
            <button onClick={() => setListingStyle(null)} className="flex items-center gap-2 ml-2 px-2 py-1 bg-[#D4A017]/20 border border-[#D4A017]/40 rounded-lg hover:bg-[#D4A017]/30 transition-colors group">
              <div className="w-2 h-2 bg-[#D4A017] rounded-full"></div>
              <span className="text-xs text-[#D4A017]">Style Applied</span>
              <span className="text-xs text-[#D4A017]/60 group-hover:text-[#D4A017]">✕</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a href={`/dashboard/listing-intelligence?listing=${listingId}`} className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/40 rounded-lg text-sm text-purple-300"><Brain className="w-4 h-4" /> AI Analysis</a>
          <button onClick={() => setShowMlsExport(true)} style={showMlsFeatures ? {} : {display: "none"}} disabled={completedPhotos.length === 0} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm disabled:opacity-50"><FileArchive className="w-4 h-4" /> MLS Export</button>
          <button onClick={handleShare} disabled={shareLoading} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm disabled:opacity-50">{shareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Share Gallery</button>
          <label className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-lg cursor-pointer text-black font-medium text-sm"><Upload className="w-4 h-4" /> Upload<input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" /></label>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <aside className="w-[240px] bg-[#1A1A1A] border-r border-white/10 flex flex-col flex-shrink-0">
          <div className="flex-1 overflow-y-auto p-3">
            <h2 className="text-base font-bold text-[#D4A017] mb-4 tracking-wider">AI TOOLS</h2>
            {categories.map(category => (
              <div key={category} className="mb-3">
                <button onClick={() => setExpandedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category])} className="flex items-center justify-between w-full text-sm font-bold text-[#D4A017] mb-2 tracking-wide">
                  {category}
                  {expandedCategories.includes(category) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {expandedCategories.includes(category) && (
                  <div className="space-y-1">
                    {AI_TOOLS.filter(t => t.category === category).map(tool => (
                      <div key={tool.id}>
                        <button onClick={() => handleToolSelect(tool.id)} disabled={processing || !selectedPhoto} className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-xs transition-all ${selectedTool === tool.id ? 'bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black' : 'hover:bg-white/10 text-white/80'} disabled:opacity-50`}>
                          <span className="flex items-center gap-2"><tool.icon className="w-3 h-3" /><span className="truncate">{tool.name}</span></span>
                          <span className="flex items-center gap-1"><span className="text-[10px] opacity-60">{tool.credits}cr</span>{tool.hasPresets && selectedTool === tool.id && <ChevronDown className="w-3 h-3" />}</span>
                        </button>
                        {selectedTool === tool.id && tool.hasPresets && currentPresets && (
                          <div className="mt-2 mb-2 p-2 bg-black/30 rounded-lg">
                            <p className="text-[10px] text-white/40 mb-2 uppercase">Select Style</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {currentPresets.map(preset => (
                                <button key={preset.id} onClick={() => setSelectedPreset(preset)} className={`relative aspect-[4/3] rounded overflow-hidden border-2 transition-all ${selectedPreset?.id === preset.id ? 'border-[#D4A017] ring-1 ring-[#D4A017]/50' : 'border-transparent hover:border-white/30'}`}>
                                  <img src={preset.thumbnail} alt={preset.name} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                  <span className="absolute bottom-0.5 left-0.5 right-0.5 text-[9px] font-medium text-white truncate">{preset.name}</span>
                                  {selectedPreset?.id === preset.id && <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#D4A017] rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-black" /></div>}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-white/10 space-y-2">
            <button onClick={() => selectedTool && handleEnhance(selectedTool)} disabled={!selectedPhoto || !selectedTool || processing || (currentTool?.hasPresets && !selectedPreset)} className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-lg text-sm text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed">
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {!selectedTool ? 'Select Tool' : currentTool?.hasPresets && !selectedPreset ? 'Select Style' : selectedPreset ? `Apply ${selectedPreset.name}` : 'Enhance Now'}
            </button>
            <button onClick={() => setShowHumanEditModal(true)} disabled={!selectedPhoto} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#D4A017]/10 hover:bg-[#D4A017]/20 border border-[#D4A017]/30 rounded-lg text-sm text-[#D4A017] disabled:opacity-50 disabled:cursor-not-allowed"><UserCheck className="w-4 h-4" /> Request Human Edit</button>
            <button onClick={handleDeleteListing} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm"><Trash2 className="w-4 h-4" /> Delete Listing</button>
            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/60"><LogOut className="w-4 h-4" /> Sign Out</button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col p-4 min-w-0">
          {selectedPhoto ? (
            <>
              <div className="flex-1 relative flex items-center justify-center bg-[#0A0A0A] rounded-xl overflow-hidden min-h-0">
                {pendingEnhancement ? (
                  <div className="absolute inset-0 cursor-ew-resize select-none" onMouseDown={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const updatePosition = (clientX: number) => { const x = Math.max(0, Math.min(clientX - rect.left, rect.width)); setSliderPosition((x / rect.width) * 100); }; updatePosition(e.clientX); const onMouseMove = (event: MouseEvent) => updatePosition(event.clientX); const onMouseUp = () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); }; window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp); }}>
                    <img src={pendingEnhancement.enhancedUrl} alt="Enhanced" className="absolute inset-0 w-full h-full object-contain" style={{ filter: getFilterStyle(), opacity: adjustments.intensity / 100 }} draggable={false} />
                    <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}><img src={pendingEnhancement.originalUrl} alt="Original" className="absolute inset-0 w-full h-full object-contain" style={{ maxWidth: 'none', width: `${sliderPosition === 0 ? 0 : 100 / (sliderPosition / 100)}%` }} draggable={false} /></div>
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center cursor-ew-resize"><span className="text-gray-600 text-sm font-bold">↔</span></div></div>
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/70 rounded-lg text-sm font-medium">Before</div>
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 rounded-lg text-sm font-medium">After</div>
                  </div>
                ) : (
                  <img src={selectedPhoto.signedRawUrl} alt="Selected" className="max-w-full max-h-full object-contain" />
                )}
                {processing && <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#D4A017] mb-2" /><p>Processing...</p></div>}
              </div>
              {pendingEnhancement && <AdjustmentPanel adjustments={adjustments} setAdjustments={setAdjustments} showFineTune={showFineTune} setShowFineTune={setShowFineTune} onDiscard={() => { setPendingEnhancement(null); setAdjustments({ intensity: 100, brightness: 0, contrast: 0, saturation: 0, warmth: 0 }); }} onAccept={handleAcceptEnhancement} />}
              <div className="flex gap-2 mt-3 overflow-x-auto py-1 flex-shrink-0">
                {photos.map(photo => (
                  <div key={photo.id} className="relative flex-shrink-0 group">
                    <button onClick={() => { setSelectedPhoto(photo); setPendingEnhancement(null); setAdjustments({ intensity: 100, brightness: 0, contrast: 0, saturation: 0, warmth: 0 }); }} className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${selectedPhoto?.id === photo.id ? 'border-[#D4A017]' : 'border-transparent hover:border-white/30'}`}><img src={photo.signedRawUrl} alt="" className="w-full h-full object-cover" style={{ filter: getListingStyleFilter() }} /></button>
                    <button onClick={e => { e.stopPropagation(); handleDeletePhoto(photo.id, photo.raw_url); }} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center text-white hidden group-hover:flex"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-white/40"><Upload className="w-12 h-12 mb-3" /><p>Upload images to get started</p></div>
          )}
        </main>

        <aside className="w-[200px] bg-[#1A1A1A] border-l border-white/10 p-3 overflow-y-auto flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-white/40">READY FOR DOWNLOAD</h2>
            {completedPhotos.length > 1 && (
              <button onClick={handleDownloadAll} disabled={zipLoading} className="flex items-center gap-1 px-2 py-1 bg-[#D4A017] hover:bg-[#B8860B] rounded text-[10px] text-black font-bold disabled:opacity-50">
                {zipLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileArchive className="w-3 h-3" />} ZIP
              </button>
            )}
          </div>
          {completedPhotos.length === 0 ? (
            <div className="text-center text-white/30 py-6"><Download className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-xs">Enhanced photos appear here</p></div>
          ) : (
            <div className="space-y-2">
              {completedPhotos.map(photo => (
                <div key={photo.id} className="bg-[#0F0F0F] rounded-lg overflow-hidden border border-white/10 group relative">
                  <button onClick={() => handleDeleteEnhanced(photo.id, photo.processed_url)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center text-white hidden group-hover:flex z-10"><X className="w-3 h-3" /></button>
                  <div className="aspect-video relative"><img src={photo.signedProcessedUrl} alt="" className="w-full h-full object-cover" />{photo.variant && <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#D4A017] rounded text-[10px] text-black">{photo.variant}</div>}</div>
                  <button onClick={() => handleDownload(photo.signedProcessedUrl, `enhanced-${photo.id}.jpg`)} className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black text-xs font-medium"><Download className="w-3 h-3" /> Download</button>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Share2 className="w-5 h-5" /> Share with Client</h2>
            <p className="text-white/60 text-sm mb-4">Send this link to get instant approval before downloading.</p>
            <div className="flex gap-2 mb-4">
              <input type="text" value={shareLink} readOnly placeholder={shareLoading ? 'Generating link...' : 'Share link will appear here'} className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm" />
              <button onClick={copyLink} disabled={!shareLink} className="px-4 py-3 bg-[#D4A017] rounded-xl text-black disabled:opacity-50">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
            </div>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer"><input type="checkbox" checked={shareOptions.allowDownload} onChange={(e) => setShareOptions((prev) => ({ ...prev, allowDownload: e.target.checked }))} className="accent-[#D4A017]" /><span>Allow client to download</span></label>
              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer"><input type="checkbox" checked={shareOptions.showComparison} onChange={(e) => setShareOptions((prev) => ({ ...prev, showComparison: e.target.checked }))} className="accent-[#D4A017]" /><span>Show before/after comparison</span></label>
            </div>
            <button onClick={() => setShowShareModal(false)} className="w-full mt-4 py-3 border border-white/20 rounded-xl">Close</button>
          </div>
        </div>
      )}
      {showMlsExport && completedPhotos.length > 0 && <MlsExportModal photos={completedPhotos} listingTitle={listing?.title} listingAddress={listing?.address} onClose={() => setShowMlsExport(false)} />}
      {showStylePrompt && <StylePromptModal adjustments={adjustments} onJustThisPhoto={handleJustThisPhoto} onApplyToAll={handleApplyStyleToAll} />}
      {showHumanEditModal && selectedPhoto && <HumanEditRequestModal listingId={listingId} photoUrl={selectedPhoto?.signedUrl || ""} onClose={() => setShowHumanEditModal(false)} />}
    </div>
  );
}
