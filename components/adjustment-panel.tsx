'use client';

import { ChevronDown, ChevronUp, RotateCcw, SlidersHorizontal, X, Check } from 'lucide-react';
import { useState } from 'react';

interface AdjustmentPanelProps {
  adjustments: {
    intensity: number;
    brightness: number;
    contrast: number;
    saturation: number;
    warmth: number;
  };
  setAdjustments: (adjustments: any) => void;
  showFineTune: boolean;
  setShowFineTune: (show: boolean) => void;
  onDiscard: () => void;
  onAccept: () => void;
}

export function AdjustmentPanel({
  adjustments,
  setAdjustments,
  showFineTune,
  setShowFineTune,
  onDiscard,
  onAccept,
}: AdjustmentPanelProps) {
  const resetAdjustments = () => {
    setAdjustments({ intensity: 100, brightness: 0, contrast: 0, saturation: 0, warmth: 0 });
  };

  const hasChanges = adjustments.intensity !== 100 || 
    adjustments.brightness !== 0 || 
    adjustments.contrast !== 0 || 
    adjustments.saturation !== 0 || 
    adjustments.warmth !== 0;

  return (
    <div className="mt-2 p-3 bg-[#1A1A1A] rounded-xl border border-white/10 flex-shrink-0">
      {/* Main Row: Adjust Button + Actions */}
      <div className="flex items-center justify-between gap-3">
        {/* Adjust Settings Button */}
        <button
          onClick={() => setShowFineTune(!showFineTune)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
            showFineTune 
              ? 'bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/40' 
              : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Adjust Settings</span>
          {hasChanges && !showFineTune && (
            <span className="w-2 h-2 bg-[#D4A017] rounded-full"></span>
          )}
          {showFineTune ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button onClick={onDiscard} className="flex items-center gap-1.5 px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm hover:bg-red-500/30 transition-colors">
            <X className="w-4 h-4" /> Discard
          </button>
          <button onClick={onAccept} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg text-white text-sm font-medium hover:from-emerald-400 hover:to-emerald-500 transition-all">
            <Check className="w-4 h-4" /> Accept & Save
          </button>
        </div>
      </div>

      {/* Expanded Adjustment Panel */}
      {showFineTune && (
        <div className="mt-3 pt-3 border-t border-white/10">
          {/* Intensity - Full Width */}
          <div className="mb-3">
            <div className="flex items-center gap-3">
              <label className="text-xs text-white/60 w-20">Effect Intensity</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={adjustments.intensity} 
                onChange={(e) => setAdjustments({ ...adjustments, intensity: Number(e.target.value) })} 
                className="flex-1 h-1.5 bg-white/10 rounded appearance-none cursor-pointer accent-[#D4A017]" 
              />
              <span className="text-xs text-[#D4A017] font-mono w-10 text-right">{adjustments.intensity}%</span>
            </div>
            <div className="flex justify-between text-[9px] text-white/30 mt-1 ml-20 mr-10">
              <span>Subtle</span>
              <span>Full Effect</span>
            </div>
          </div>

          {/* Fine Tune Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-white/50 w-16">Brightness</label>
              <input type="range" min="-50" max="50" value={adjustments.brightness} onChange={(e) => setAdjustments({ ...adjustments, brightness: Number(e.target.value) })} className="flex-1 h-1 bg-white/10 rounded appearance-none cursor-pointer accent-[#D4A017]" />
              <span className="text-[10px] text-white/40 font-mono w-7 text-right">{adjustments.brightness > 0 ? '+' : ''}{adjustments.brightness}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-white/50 w-16">Contrast</label>
              <input type="range" min="-50" max="50" value={adjustments.contrast} onChange={(e) => setAdjustments({ ...adjustments, contrast: Number(e.target.value) })} className="flex-1 h-1 bg-white/10 rounded appearance-none cursor-pointer accent-[#D4A017]" />
              <span className="text-[10px] text-white/40 font-mono w-7 text-right">{adjustments.contrast > 0 ? '+' : ''}{adjustments.contrast}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-white/50 w-16">Saturation</label>
              <input type="range" min="-50" max="50" value={adjustments.saturation} onChange={(e) => setAdjustments({ ...adjustments, saturation: Number(e.target.value) })} className="flex-1 h-1 bg-white/10 rounded appearance-none cursor-pointer accent-[#D4A017]" />
              <span className="text-[10px] text-white/40 font-mono w-7 text-right">{adjustments.saturation > 0 ? '+' : ''}{adjustments.saturation}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-white/50 w-16">Warmth</label>
              <input type="range" min="-50" max="50" value={adjustments.warmth} onChange={(e) => setAdjustments({ ...adjustments, warmth: Number(e.target.value) })} className="flex-1 h-1 bg-white/10 rounded appearance-none cursor-pointer accent-[#D4A017]" />
              <span className="text-[10px] text-white/40 font-mono w-7 text-right">{adjustments.warmth > 0 ? '+' : ''}{adjustments.warmth}</span>
            </div>
          </div>
          
          {/* Reset */}
          {hasChanges && (
            <button onClick={resetAdjustments} className="mt-3 flex items-center gap-1 text-[10px] text-white/40 hover:text-white/60 transition-colors">
              <RotateCcw className="w-2.5 h-2.5" /> Reset to Default
            </button>
          )}
        </div>
      )}
    </div>
  );
}
