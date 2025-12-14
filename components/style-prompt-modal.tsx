'use client';

import { Check } from 'lucide-react';

const QUICK_STYLES = [
  { id: 'bright-airy', name: 'Bright & Airy', filters: { brightness: 15, contrast: -10, saturation: -5, warmth: -10 }, color: 'from-sky-200 to-white' },
  { id: 'warm-inviting', name: 'Warm & Inviting', filters: { brightness: 5, contrast: 5, saturation: 10, warmth: 25 }, color: 'from-orange-300 to-yellow-200' },
  { id: 'magazine-ready', name: 'Magazine Ready', filters: { brightness: 5, contrast: 20, saturation: 15, warmth: 0 }, color: 'from-purple-300 to-pink-200' },
  { id: 'mls-standard', name: 'MLS Standard', filters: { brightness: 0, contrast: 0, saturation: 0, warmth: 0 }, color: 'from-gray-300 to-gray-200' },
  { id: 'twilight-glow', name: 'Twilight Glow', filters: { brightness: -5, contrast: 10, saturation: 5, warmth: 30 }, color: 'from-orange-400 to-purple-400' },
  { id: 'natural-clean', name: 'Natural Clean', filters: { brightness: 5, contrast: 5, saturation: 0, warmth: 5 }, color: 'from-green-200 to-emerald-100' },
];

interface StylePromptModalProps {
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
    warmth: number;
  };
  onJustThisPhoto: () => void;
  onApplyToAll: (style: { brightness: number; contrast: number; saturation: number; warmth: number }) => void;
}

export function StylePromptModal({ adjustments, onJustThisPhoto, onApplyToAll }: StylePromptModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-lg border border-white/10 shadow-2xl">
        {/* Success Icon */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        
        {/* Title */}
        <h2 className="text-lg font-bold text-center text-white mb-1">Photo Enhanced!</h2>
        <p className="text-white/50 text-sm text-center mb-5">
          Choose a style for all your listing photos
        </p>
        
        {/* Quick Styles Grid */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {QUICK_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => onApplyToAll(style.filters)}
              className="group relative p-3 rounded-xl border border-white/10 hover:border-[#D4A017]/50 bg-white/5 hover:bg-white/10 transition-all text-center"
            >
              <div className={`w-full h-8 rounded-lg bg-gradient-to-br ${style.color} mb-2 group-hover:scale-105 transition-transform`} />
              <span className="text-xs text-white/80 group-hover:text-white font-medium">{style.name}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-xs text-white/30">or</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>
        
        {/* Just This Photo Button */}
        <button
          onClick={onJustThisPhoto}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 text-sm hover:bg-white/10 hover:text-white/80 transition-colors"
        >
          Skip — Just save this photo without a listing style
        </button>
      </div>
    </div>
  );
}
