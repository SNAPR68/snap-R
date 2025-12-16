'use client';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Loader2, Home, ChevronRight, Upload, Sparkles, Download, 
  RotateCcw, Check, X, Image, Wand2, Paintbrush, Hammer,
  ChefHat, Bath, Bed, Sofa, UtensilsCrossed, Trees,
  ArrowRight, Lightbulb, Clock, DollarSign, Layers,
  Palette, Grid, CheckCircle, AlertCircle, Eye, History
} from 'lucide-react';
import Link from 'next/link';

// Import configuration (will be created)
const ROOM_TYPES = {
  kitchen: { id: 'kitchen', label: 'Kitchen', icon: ChefHat, renovationTypes: ['full-remodel', 'cabinets', 'counters', 'backsplash', 'flooring', 'appliances'] },
  bathroom: { id: 'bathroom', label: 'Bathroom', icon: Bath, renovationTypes: ['full-remodel', 'vanity', 'shower', 'flooring', 'fixtures'] },
  bedroom: { id: 'bedroom', label: 'Bedroom', icon: Bed, renovationTypes: ['flooring', 'paint', 'lighting'] },
  'living-room': { id: 'living-room', label: 'Living Room', icon: Sofa, renovationTypes: ['flooring', 'paint', 'fireplace', 'lighting'] },
  'dining-room': { id: 'dining-room', label: 'Dining Room', icon: UtensilsCrossed, renovationTypes: ['flooring', 'paint', 'lighting'] },
  exterior: { id: 'exterior', label: 'Exterior', icon: Home, renovationTypes: ['full-remodel', 'siding', 'roof', 'landscaping', 'paint'] },
};

const RENOVATION_TYPES: Record<string, { id: string; label: string; description: string; credits: number; priceDisplay: string }> = {
  'full-remodel': { id: 'full-remodel', label: 'Full Remodel', description: 'Complete room transformation', credits: 5, priceDisplay: '$49' },
  cabinets: { id: 'cabinets', label: 'Cabinet Replacement', description: 'New cabinet style and color', credits: 3, priceDisplay: '$29' },
  counters: { id: 'counters', label: 'Countertop Change', description: 'New countertop material', credits: 3, priceDisplay: '$29' },
  backsplash: { id: 'backsplash', label: 'Backsplash Update', description: 'New backsplash style', credits: 2, priceDisplay: '$19' },
  flooring: { id: 'flooring', label: 'Flooring Change', description: 'New floor type and color', credits: 3, priceDisplay: '$29' },
  paint: { id: 'paint', label: 'Paint Color', description: 'Change wall colors', credits: 2, priceDisplay: '$19' },
  appliances: { id: 'appliances', label: 'Appliance Upgrade', description: 'Modern appliances', credits: 2, priceDisplay: '$19' },
  vanity: { id: 'vanity', label: 'Vanity Replacement', description: 'New bathroom vanity', credits: 3, priceDisplay: '$29' },
  shower: { id: 'shower', label: 'Shower Remodel', description: 'Modern shower design', credits: 3, priceDisplay: '$29' },
  fixtures: { id: 'fixtures', label: 'Fixture Update', description: 'New faucets and hardware', credits: 2, priceDisplay: '$19' },
  fireplace: { id: 'fireplace', label: 'Fireplace Remodel', description: 'Updated fireplace', credits: 3, priceDisplay: '$29' },
  lighting: { id: 'lighting', label: 'Lighting Update', description: 'New light fixtures', credits: 2, priceDisplay: '$19' },
  siding: { id: 'siding', label: 'Siding Change', description: 'New exterior siding', credits: 3, priceDisplay: '$29' },
  roof: { id: 'roof', label: 'Roof Replacement', description: 'New roof style', credits: 3, priceDisplay: '$29' },
  landscaping: { id: 'landscaping', label: 'Landscaping', description: 'Updated yard', credits: 3, priceDisplay: '$29' },
};

const STYLES = [
  { id: 'modern', label: 'Modern', description: 'Clean lines, minimalist' },
  { id: 'traditional', label: 'Traditional', description: 'Classic, timeless' },
  { id: 'farmhouse', label: 'Farmhouse', description: 'Rustic, warm' },
  { id: 'contemporary', label: 'Contemporary', description: 'Current trends' },
  { id: 'scandinavian', label: 'Scandinavian', description: 'Light, airy' },
  { id: 'luxury', label: 'Luxury', description: 'High-end, premium' },
  { id: 'industrial', label: 'Industrial', description: 'Raw, urban' },
  { id: 'coastal', label: 'Coastal', description: 'Beach-inspired' },
  { id: 'transitional', label: 'Transitional', description: 'Traditional + Modern blend' },
  { id: 'mediterranean', label: 'Mediterranean', description: 'Warm, textured' },
];

const RENOVATION_OPTIONS = {
  cabinets: {
    colors: [
      { id: 'white', label: 'White', hex: '#FFFFFF' },
      { id: 'cream', label: 'Cream', hex: '#FFFDD0' },
      { id: 'gray', label: 'Gray', hex: '#808080' },
      { id: 'navy', label: 'Navy Blue', hex: '#000080' },
      { id: 'sage', label: 'Sage Green', hex: '#9DC183' },
      { id: 'black', label: 'Black', hex: '#1a1a1a' },
      { id: 'natural-wood', label: 'Natural Wood', hex: '#DEB887' },
      { id: 'walnut', label: 'Dark Walnut', hex: '#5C4033' },
    ],
    styles: [
      { id: 'shaker', label: 'Shaker' },
      { id: 'flat-panel', label: 'Flat Panel / Slab' },
      { id: 'raised-panel', label: 'Raised Panel' },
      { id: 'glass-front', label: 'Glass Front' },
    ],
  },
  counters: {
    materials: [
      { id: 'quartz', label: 'Quartz' },
      { id: 'granite', label: 'Granite' },
      { id: 'marble', label: 'Marble' },
      { id: 'butcher-block', label: 'Butcher Block' },
      { id: 'concrete', label: 'Concrete' },
    ],
    colors: [
      { id: 'white', label: 'White', hex: '#FFFFFF' },
      { id: 'gray', label: 'Gray', hex: '#808080' },
      { id: 'black', label: 'Black', hex: '#1a1a1a' },
      { id: 'beige', label: 'Beige', hex: '#F5F5DC' },
      { id: 'veined', label: 'White w/ Veins', hex: '#F0F0F0' },
    ],
  },
  flooring: {
    types: [
      { id: 'hardwood', label: 'Hardwood' },
      { id: 'laminate', label: 'Laminate' },
      { id: 'tile', label: 'Tile' },
      { id: 'vinyl-plank', label: 'Luxury Vinyl' },
      { id: 'carpet', label: 'Carpet' },
      { id: 'stone', label: 'Natural Stone' },
    ],
    colors: [
      { id: 'light-oak', label: 'Light Oak', hex: '#C4A35A' },
      { id: 'natural-oak', label: 'Natural Oak', hex: '#B8860B' },
      { id: 'dark-walnut', label: 'Dark Walnut', hex: '#5C4033' },
      { id: 'gray-wash', label: 'Gray Wash', hex: '#A9A9A9' },
      { id: 'espresso', label: 'Espresso', hex: '#3C2415' },
      { id: 'white-tile', label: 'White Tile', hex: '#FFFFFF' },
    ],
  },
  paint: {
    colors: [
      { id: 'white', label: 'Pure White', hex: '#FFFFFF' },
      { id: 'warm-white', label: 'Warm White', hex: '#FAF9F6' },
      { id: 'light-gray', label: 'Light Gray', hex: '#D3D3D3' },
      { id: 'gray', label: 'Medium Gray', hex: '#808080' },
      { id: 'greige', label: 'Greige', hex: '#C0B9A8' },
      { id: 'beige', label: 'Beige', hex: '#F5F5DC' },
      { id: 'navy', label: 'Navy Blue', hex: '#000080' },
      { id: 'sage', label: 'Sage Green', hex: '#9DC183' },
      { id: 'charcoal', label: 'Charcoal', hex: '#36454F' },
    ],
  },
  siding: {
    types: [
      { id: 'vinyl', label: 'Vinyl Siding' },
      { id: 'wood', label: 'Wood Siding' },
      { id: 'fiber-cement', label: 'Fiber Cement' },
      { id: 'brick', label: 'Brick' },
      { id: 'stone', label: 'Stone Veneer' },
      { id: 'stucco', label: 'Stucco' },
    ],
    colors: [
      { id: 'white', label: 'White', hex: '#FFFFFF' },
      { id: 'gray', label: 'Gray', hex: '#808080' },
      { id: 'blue', label: 'Blue', hex: '#4682B4' },
      { id: 'beige', label: 'Beige', hex: '#F5F5DC' },
      { id: 'brown', label: 'Brown', hex: '#8B4513' },
    ],
  },
};

interface Listing {
  id: string;
  title: string;
  address?: string;
  thumbnail?: string | null;
  photoCount: number;
}

interface RenovationHistory {
  id: string;
  original_url: string;
  result_url: string;
  room_type: string;
  renovation_type: string;
  style: string;
  created_at: string;
  status: string;
}

// Color Swatch Component
function ColorSwatch({ color, selected, onClick }: { color: { id: string; label: string; hex: string }; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative group flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
        selected ? 'bg-amber-500/20 ring-2 ring-amber-500' : 'hover:bg-white/5'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full border-2 transition-all ${
          selected ? 'border-amber-500 scale-110' : 'border-white/20 group-hover:border-white/40'
        }`}
        style={{ backgroundColor: color.hex }}
      />
      <span className="text-xs text-white/60">{color.label}</span>
      {selected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-black" />
        </div>
      )}
    </button>
  );
}

// Option Button Component
function OptionButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        selected
          ? 'bg-amber-500 text-black'
          : 'bg-white/5 text-white/70 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );
}

// Main Renovation Interface
function RenovationInterface({
  imageUrl,
  listingId,
  onBack,
}: {
  imageUrl: string;
  listingId?: string;
  onBack: () => void;
}) {
  const [step, setStep] = useState(1);
  const [roomType, setRoomType] = useState<string>('');
  const [renovationType, setRenovationType] = useState<string>('');
  const [style, setStyle] = useState<string>('modern');
  const [options, setOptions] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; processingTime: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedRoom = ROOM_TYPES[roomType as keyof typeof ROOM_TYPES];
  const selectedRenovation = RENOVATION_TYPES[renovationType];
  const availableOptions = RENOVATION_OPTIONS[renovationType as keyof typeof RENOVATION_OPTIONS];

  const handleProcess = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/renovation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          imageUrl,
          roomType,
          renovationType,
          style,
          options,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Renovation failed');
      }

      setResult({
        url: data.resultUrl,
        processingTime: data.processingTime,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setRoomType('');
    setRenovationType('');
    setStyle('modern');
    setOptions({});
    setResult(null);
    setError(null);
  };

  // Result View
  if (result) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Renovation Complete!</h1>
                <p className="text-white/50">
                  {selectedRoom?.label} • {selectedRenovation?.label} • {STYLES.find(s => s.id === style)?.label}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                New Renovation
              </button>
              <a
                href={result.url}
                download
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg font-semibold hover:bg-amber-400 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>

          {/* Before/After Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-2xl overflow-hidden">
              <div className="p-3 border-b border-white/10 text-center">
                <span className="text-sm font-medium text-white/60">BEFORE</span>
              </div>
              <img src={imageUrl} alt="Before" className="w-full aspect-[4/3] object-cover" />
            </div>
            <div className="bg-white/5 rounded-2xl overflow-hidden border-2 border-amber-500/30">
              <div className="p-3 border-b border-amber-500/30 text-center bg-amber-500/10">
                <span className="text-sm font-medium text-amber-400">AFTER</span>
              </div>
              <img src={result.url} alt="After" className="w-full aspect-[4/3] object-cover" />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 flex items-center justify-center gap-8 text-sm text-white/50">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {(result.processingTime / 1000).toFixed(1)}s processing
            </span>
            <span className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {selectedRenovation?.credits || 3} credits used
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl">
              <Hammer className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Virtual Renovation</h1>
              <p className="text-white/50">Transform any room with AI</p>
            </div>
          </div>
          <button onClick={onBack} className="text-white/50 hover:text-white transition-colors">
            ← Back
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  step >= s
                    ? 'bg-amber-500 text-black'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div className={`w-16 h-1 rounded ${step > s ? 'bg-amber-500' : 'bg-white/10'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr,400px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Step 1: Room Type */}
            {step === 1 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-2">Step 1: Select Room Type</h2>
                <p className="text-white/50 mb-6">What type of room is this?</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.values(ROOM_TYPES).map((room) => {
                    const Icon = room.icon;
                    return (
                      <button
                        key={room.id}
                        onClick={() => {
                          setRoomType(room.id);
                          setRenovationType('');
                          setStep(2);
                        }}
                        className={`p-6 rounded-xl border text-center transition-all hover:scale-105 ${
                          roomType === room.id
                            ? 'bg-amber-500/20 border-amber-500/50'
                            : 'bg-white/5 border-white/10 hover:border-white/30'
                        }`}
                      >
                        <Icon className={`w-10 h-10 mx-auto mb-3 ${roomType === room.id ? 'text-amber-400' : 'text-white/50'}`} />
                        <span className="font-medium">{room.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Renovation Type */}
            {step === 2 && selectedRoom && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Step 2: What to Renovate?</h2>
                    <p className="text-white/50">Select what you want to change in the {selectedRoom.label.toLowerCase()}</p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-amber-400 hover:underline text-sm">
                    Change room
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedRoom.renovationTypes.map((typeId) => {
                    const type = RENOVATION_TYPES[typeId];
                    if (!type) return null;
                    return (
                      <button
                        key={type.id}
                        onClick={() => {
                          setRenovationType(type.id);
                          setStep(3);
                        }}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          renovationType === type.id
                            ? 'bg-amber-500/20 border-amber-500/50'
                            : 'bg-white/5 border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="font-medium mb-1">{type.label}</div>
                        <div className="text-xs text-white/50 mb-2">{type.description}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400 font-bold">{type.priceDisplay}</span>
                          <span className="text-xs text-white/40">{type.credits} credits</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Style & Options */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Style Selection */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Step 3: Choose Style</h2>
                      <p className="text-white/50">Select the design style for your renovation</p>
                    </div>
                    <button onClick={() => setStep(2)} className="text-amber-400 hover:underline text-sm">
                      Change renovation
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {STYLES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          style === s.id
                            ? 'bg-amber-500/20 border-amber-500/50'
                            : 'bg-white/5 border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className={`font-medium text-sm ${style === s.id ? 'text-amber-400' : ''}`}>
                          {s.label}
                        </div>
                        <div className="text-xs text-white/40 mt-1">{s.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific Options */}
                {availableOptions && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-4">Customize Options</h3>
                    
                    {/* Colors */}
                    {'colors' in availableOptions && (
                      <div className="mb-6">
                        <label className="block text-sm text-white/60 mb-3">Color</label>
                        <div className="flex flex-wrap gap-2">
                          {(availableOptions.colors as { id: string; label: string; hex: string }[]).map((color) => (
                            <ColorSwatch
                              key={color.id}
                              color={color}
                              selected={options[`${renovationType}_color`] === color.id}
                              onClick={() => setOptions({ ...options, [`${renovationType}_color`]: color.id })}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Materials/Types */}
                    {'materials' in availableOptions && (
                      <div className="mb-6">
                        <label className="block text-sm text-white/60 mb-3">Material</label>
                        <div className="flex flex-wrap gap-2">
                          {(availableOptions.materials as { id: string; label: string }[]).map((mat) => (
                            <OptionButton
                              key={mat.id}
                              label={mat.label}
                              selected={options.counter_material === mat.id}
                              onClick={() => setOptions({ ...options, counter_material: mat.id })}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {'types' in availableOptions && (
                      <div className="mb-6">
                        <label className="block text-sm text-white/60 mb-3">Type</label>
                        <div className="flex flex-wrap gap-2">
                          {(availableOptions.types as { id: string; label: string }[]).map((type) => (
                            <OptionButton
                              key={type.id}
                              label={type.label}
                              selected={options[`${renovationType}_type`] === type.id}
                              onClick={() => setOptions({ ...options, [`${renovationType}_type`]: type.id })}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {'styles' in availableOptions && (
                      <div className="mb-6">
                        <label className="block text-sm text-white/60 mb-3">Style</label>
                        <div className="flex flex-wrap gap-2">
                          {(availableOptions.styles as { id: string; label: string }[]).map((s) => (
                            <OptionButton
                              key={s.id}
                              label={s.label}
                              selected={options.cabinet_style === s.id}
                              onClick={() => setOptions({ ...options, cabinet_style: s.id })}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setStep(4)}
                  className="w-full py-4 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors"
                >
                  Continue to Preview
                </button>
              </div>
            )}

            {/* Step 4: Preview & Process */}
            {step === 4 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Step 4: Review & Generate</h2>
                  <button onClick={() => setStep(3)} className="text-amber-400 hover:underline text-sm">
                    Change options
                  </button>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="text-xs text-white/40 mb-1">Room</div>
                    <div className="font-medium">{selectedRoom?.label}</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="text-xs text-white/40 mb-1">Renovation</div>
                    <div className="font-medium">{selectedRenovation?.label}</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="text-xs text-white/40 mb-1">Style</div>
                    <div className="font-medium">{STYLES.find(s => s.id === style)?.label}</div>
                  </div>
                </div>

                {/* Selected Options */}
                {Object.keys(options).length > 0 && (
                  <div className="mb-6 p-4 bg-white/5 rounded-xl">
                    <div className="text-xs text-white/40 mb-2">Selected Options</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(options).map(([key, value]) => (
                        <span key={key} className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded text-sm">
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cost */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Credits Required</span>
                    <span className="text-xl font-bold text-amber-400">{selectedRenovation?.credits || 3} credits</span>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6 flex items-start gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleProcess}
                  disabled={processing}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-400 hover:to-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Renovation... (30-60 sec)
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Renovation
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {/* Original Image */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-3 border-b border-white/10 text-center">
                <span className="text-sm font-medium text-white/60">ORIGINAL PHOTO</span>
              </div>
              <img src={imageUrl} alt="Original" className="w-full aspect-[4/3] object-cover" />
            </div>

            {/* What You're Creating */}
            {(roomType || renovationType) && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="font-medium mb-3 text-white/80">Your Renovation</h3>
                <div className="space-y-2 text-sm">
                  {roomType && (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>{selectedRoom?.label}</span>
                    </div>
                  )}
                  {renovationType && (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>{selectedRenovation?.label}</span>
                    </div>
                  )}
                  {style && step >= 3 && (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>{STYLES.find(s => s.id === style)?.label} Style</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-orange-400 mb-1">Pro Tip</h3>
                  <p className="text-sm text-white/60">
                    For best results, use high-quality photos with good lighting. The AI preserves room structure while transforming finishes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Photo Selector
function PhotoSelector({ onSelect }: { onSelect: (url: string, listingId?: string) => void }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [photos, setPhotos] = useState<{ url: string; id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadUrl, setUploadUrl] = useState('');

  useEffect(() => {
    loadListings();
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
        data.filter((l: any) => (l.photos || []).length > 0).map(async (listing: any) => {
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
          return { id: listing.id, title: listing.title, address: listing.address, thumbnail, photoCount: photos.length };
        })
      );
      setListings(withThumbnails);
    }
    setLoading(false);
  };

  const loadPhotos = async (listingId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: true });

    if (data) {
      const urls = await Promise.all(
        data.map(async (photo) => {
          const path = photo.processed_url || photo.raw_url;
          const { data: urlData } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600);
          return { url: urlData?.signedUrl || '', id: photo.id };
        })
      );
      setPhotos(urls.filter(p => p.url));
    }
  };

  useEffect(() => {
    if (selectedListing) {
      loadPhotos(selectedListing);
    }
  }, [selectedListing]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl">
            <Hammer className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Virtual Renovation</h1>
            <p className="text-white/50">Transform kitchens, bathrooms, and more with AI</p>
          </div>
        </div>

        {/* What this does */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-orange-400 mb-1">What Virtual Renovation does</h3>
              <p className="text-sm text-white/70">
                Show buyers the potential! Replace cabinets, countertops, flooring, paint colors, and more. 
                Help sellers visualize updates and help buyers see possibilities. BoxBrownie charges $24-$176 per room - 
                we do it with AI for a fraction of the cost.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">$19-49</div>
            <div className="text-sm text-white/50">Per renovation</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">30-60s</div>
            <div className="text-sm text-white/50">Processing time</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">10+</div>
            <div className="text-sm text-white/50">Design styles</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">15+</div>
            <div className="text-sm text-white/50">Renovation types</div>
          </div>
        </div>

        {/* URL Input */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <h3 className="font-medium mb-3">Option 1: Paste Image URL</h3>
          <div className="flex gap-3">
            <input
              type="url"
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
            />
            <button
              onClick={() => uploadUrl && onSelect(uploadUrl)}
              disabled={!uploadUrl}
              className="px-6 py-3 bg-orange-500 text-black font-semibold rounded-xl hover:bg-orange-400 transition-colors disabled:opacity-50"
            >
              Use This Photo
            </button>
          </div>
        </div>

        {/* Listing Selection */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="font-medium mb-3">Option 2: Select from Listings</h3>
          
          {!selectedListing ? (
            <div className="grid md:grid-cols-2 gap-4">
              {listings.map(listing => (
                <button
                  key={listing.id}
                  onClick={() => setSelectedListing(listing.id)}
                  className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-orange-500/50 transition-all text-left"
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
                    <div className="font-medium">{listing.title || 'Untitled'}</div>
                    <div className="text-sm text-white/50">{listing.photoCount} photos</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/30" />
                </button>
              ))}
            </div>
          ) : (
            <div>
              <button
                onClick={() => { setSelectedListing(null); setPhotos([]); }}
                className="text-orange-400 hover:underline text-sm mb-4"
              >
                ← Back to listings
              </button>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {photos.map((photo, i) => (
                  <button
                    key={photo.id}
                    onClick={() => onSelect(photo.url, selectedListing)}
                    className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-orange-500 transition-all"
                  >
                    <img src={photo.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Page Component
function VirtualRenovationContent() {
  const [selectedImage, setSelectedImage] = useState<{ url: string; listingId?: string } | null>(null);

  if (selectedImage) {
    return (
      <RenovationInterface
        imageUrl={selectedImage.url}
        listingId={selectedImage.listingId}
        onBack={() => setSelectedImage(null)}
      />
    );
  }

  return (
    <PhotoSelector
      onSelect={(url, listingId) => setSelectedImage({ url, listingId })}
    />
  );
}

export default function VirtualRenovationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
      </div>
    }>
      <VirtualRenovationContent />
    </Suspense>
  );
}
