'use client';

import { Loader2, Check, X, AlertCircle } from 'lucide-react';

interface BatchProgressModalProps {
  isOpen: boolean;
  title: string;
  current: number;
  total: number;
  currentItem?: string;
  errors?: string[];
  onCancel?: () => void;
  onComplete?: () => void;
}

export function BatchProgressModal({
  isOpen,
  title,
  current,
  total,
  currentItem,
  errors = [],
  onCancel,
  onComplete,
}: BatchProgressModalProps) {
  if (!isOpen) return null;

  const progress = total > 0 ? (current / total) * 100 : 0;
  const isComplete = current >= total;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {isComplete ? (
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-400" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-[#D4A017]/20 rounded-full flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-[#D4A017] animate-spin" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-sm text-white/50">
              {isComplete ? 'Complete!' : `Processing ${current} of ${total}`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-white/40">{Math.round(progress)}%</span>
            <span className="text-xs text-white/40">{current}/{total}</span>
          </div>
        </div>

        {/* Current item */}
        {currentItem && !isComplete && (
          <div className="mb-4 px-3 py-2 bg-white/5 rounded-lg">
            <p className="text-xs text-white/40">Currently processing:</p>
            <p className="text-sm text-white truncate">{currentItem}</p>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">{errors.length} error(s)</span>
            </div>
            <div className="max-h-24 overflow-y-auto space-y-1">
              {errors.map((error, i) => (
                <p key={i} className="text-xs text-red-400/70">{error}</p>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {isComplete ? (
            <button
              onClick={onComplete}
              className="flex-1 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-bold"
            >
              Done
            </button>
          ) : (
            <button
              onClick={onCancel}
              className="flex-1 py-3 border border-white/20 rounded-xl text-white/60 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
