'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface Photo {
  id: string;
  thumbnailUrl?: string;
  url?: string;
  signedRawUrl?: string | null;
  signedProcessedUrl?: string | null;
}

interface PrepareResult {
  status: string;
  heroPhotoId?: string;
  confidenceScore: number;
  totalPhotos: number;
  enhancedPhotos: number;
  flaggedPhotos: number;
  processingTime?: number;
}

interface PreparationOverlayProps {
  isOpen: boolean;
  listingId: string;
  listingTitle: string;
  photos: Photo[];
  onComplete: (result: PrepareResult) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

type Phase = 'analyzing' | 'strategizing' | 'executing' | 'verifying' | 'complete' | 'error';

const PHASE_CONFIG: Record<Phase, { index: number; label: string; desc: string }> = {
  analyzing: { index: 0, label: 'AI Analyzer', desc: 'GPT-4 Vision examining each photo' },
  strategizing: { index: 1, label: 'Building Strategy', desc: 'Determining optimal enhancements' },
  executing: { index: 2, label: 'Applying Enhancements', desc: 'Processing with AI models' },
  verifying: { index: 3, label: 'Quality Check', desc: 'Validating results' },
  complete: { index: 4, label: 'Complete', desc: 'Your listing is ready' },
  error: { index: -1, label: 'Error', desc: 'Something went wrong' },
};

export function PreparationOverlay({
  isOpen,
  listingId,
  listingTitle,
  photos,
  onComplete,
  onError,
  onCancel,
}: PreparationOverlayProps) {
  const [phase, setPhase] = useState<Phase>('analyzing');
  const [progress, setProgress] = useState(0);
  const [currentDetail, setCurrentDetail] = useState('Initializing SnapR AI Vision...');
  const [photoProgress, setPhotoProgress] = useState({ current: 0, total: photos.length });
  const [activityFeed, setActivityFeed] = useState<string[]>([]);
  const [result, setResult] = useState<PrepareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastProgressRef = useRef(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getPhaseIndex = (value: Phase) => PHASE_CONFIG[value]?.index ?? 0;

  const mapPhase = (raw?: string): Phase | null => {
    switch (raw) {
      case 'analyzing':
        return 'analyzing';
      case 'strategizing':
        return 'strategizing';
      case 'processing':
        return 'executing';
      case 'validating':
      case 'consistency_pass':
        return 'verifying';
      case 'completed':
      case 'needs_review':
        return 'complete';
      case 'failed':
        return 'error';
      case 'starting':
      case 'pending':
        return 'analyzing';
      default:
        return null;
    }
  };

  const addActivity = (msg: string) => {
    setActivityFeed(prev => [...prev.slice(-4), msg]);
  };

  useEffect(() => {
    if (!isOpen || isStarted) return;
    setIsStarted(true);

    const startPolling = () => {
      if (pollIntervalRef.current) return;
      const poll = async () => {
        try {
          const res = await fetch(`/api/listing/status?listingId=${listingId}`);
          if (!res.ok) return;
          const data = await res.json();
          const mapped = mapPhase(data.status);
          if (mapped) {
            setPhase(prev => (getPhaseIndex(mapped) >= getPhaseIndex(prev) ? mapped : prev));
          }

          const total = data.totalPhotos || photos.length || 0;
          const enhanced = data.enhancedPhotos || 0;
          if (total > 0) {
            const next = Math.min(99, Math.round((enhanced / total) * 100));
            const locked = Math.max(lastProgressRef.current, next);
            lastProgressRef.current = locked;
            setProgress(locked);
            setPhotoProgress({ current: enhanced, total });
          }

          if (data.status === 'prepared' || data.status === 'needs_review' || data.status === 'failed') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            if (data.status === 'failed') {
              setError('Preparation failed');
              setPhase('error');
              onError('Preparation failed');
              return;
            }
            const resultPayload: PrepareResult = {
              status: data.status,
              heroPhotoId: data.heroPhotoId || undefined,
              confidenceScore: data.confidence || 0,
              totalPhotos: total,
              enhancedPhotos: enhanced,
              flaggedPhotos: Array.isArray(data.flaggedPhotos) ? data.flaggedPhotos.length : 0,
            };
            setResult(resultPayload);
            setPhase('complete');
            setProgress(100);
            setTimeout(() => onComplete(resultPayload), 1500);
          }
        } catch {
          // Ignore polling errors; we'll try again on next interval.
        }
      };

      poll();
      pollIntervalRef.current = setInterval(poll, 5000);
    };

    const runPreparation = async () => {
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch('/api/listing/prepare-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) throw new Error('Failed to start preparation');

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent = 'message';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
              continue;
            }
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                handleSSEMessage(data, currentEvent);
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        if (!result && !error) {
          startPolling();
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Preparation failed');
          setPhase('error');
          onError(err.message);
        }
      }
    };

    runPreparation();

    return () => {
      abortControllerRef.current?.abort();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isOpen, listingId]);

  const handleSSEMessage = (data: any, event?: string) => {
    if (event === 'complete' && data.result) {
      setResult(data.result);
      setPhase('complete');
      setProgress(100);
      setTimeout(() => onComplete(data.result), 1500);
      return;
    }

    if (event === 'error') {
      setError(data.error || 'Unknown error');
      setPhase('error');
      return;
    }

    if (data.phase) {
      const mapped = mapPhase(data.phase);
      if (mapped) {
        setPhase(prev => (getPhaseIndex(mapped) >= getPhaseIndex(prev) ? mapped : prev));
      }
    }
    if (data.progress !== undefined) {
      const next = Math.min(100, Math.max(0, data.progress));
      const locked = Math.max(lastProgressRef.current, next);
      lastProgressRef.current = locked;
      setProgress(locked);
    }
    if (data.message) {
      setCurrentDetail(data.message);
      addActivity(data.message);
    }
    if (data.photoProgress) {
      setPhotoProgress({
        current: data.photoProgress.current || 0,
        total: data.photoProgress.total || photos.length,
      });
    }
    if (data.type === 'complete' && data.result) {
      setResult(data.result);
      setPhase('complete');
      setProgress(100);
      setTimeout(() => onComplete(data.result), 1500);
    }
    if (data.type === 'error') {
      setError(data.error || 'Unknown error');
      setPhase('error');
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    onCancel?.();
  };

  if (!isOpen) return null;

  const currentPhaseIndex = PHASE_CONFIG[phase]?.index ?? 0;
  const phases: Phase[] = ['analyzing', 'strategizing', 'executing', 'verifying'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-zinc-900 to-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Cancel Button */}
        {phase !== 'complete' && phase !== 'error' && (
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 p-2 text-white/40 hover:text-white/70 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-14 h-14 mb-3 rounded-2xl border ${
              phase === 'complete'
                ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30'
                : phase === 'error'
                ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border-red-500/30'
                : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30'
            }`}>
              {phase === 'complete' ? (
                <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : phase === 'error' ? (
                <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              {phase === 'complete' ? 'Your Listing is Ready' : phase === 'error' ? 'Preparation Failed' : 'Preparing Your Listing'}
            </h2>
            <p className="text-white/50 text-sm">{listingTitle}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  phase === 'complete'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60 truncate mr-4">{currentDetail}</span>
              <span className={`font-medium flex-shrink-0 ${phase === 'complete' ? 'text-green-400' : 'text-amber-400'}`}>
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* Phases */}
          <div className="space-y-2 mb-6">
            {phases.map((p, idx) => {
              const config = PHASE_CONFIG[p];
              const isActive = p === phase;
              const isComplete = currentPhaseIndex > idx || phase === 'complete';

              return (
                <div
                  key={p}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                    isActive ? 'bg-amber-500/10 border border-amber-500/30' :
                    isComplete ? 'bg-green-500/10 border border-green-500/20' :
                    'bg-white/5 border border-transparent'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-amber-500/20 text-amber-400' :
                    isComplete ? 'bg-green-500/20 text-green-400' :
                    'bg-white/10 text-white/40'
                  }`}>
                    {isComplete ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isActive ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <span className="text-xs font-medium">{idx + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium text-sm ${
                      isActive ? 'text-white' : isComplete ? 'text-green-400' : 'text-white/40'
                    }`}>{config.label}</h3>
                    <p className="text-xs text-white/50">{config.desc}</p>
                  </div>
                  {isActive && photoProgress.total > 0 && (
                    <span className="text-amber-400 text-xs font-medium">
                      {photoProgress.current}/{photoProgress.total}
                    </span>
                  )}
                  {isComplete && p === 'analyzing' && (
                    <span className="text-green-400 text-xs font-medium">
                      {photos.length}/{photos.length}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Photo Strip */}
          {photos.length > 0 && phase !== 'complete' && phase !== 'error' && (
            <div className="mb-5">
              <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                {photos.slice(0, 8).map((photo, idx) => (
                  <div
                    key={photo.id}
                    className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all duration-300 ${
                      idx < photoProgress.current ? 'ring-2 ring-green-500' :
                      idx === photoProgress.current ? 'ring-2 ring-amber-500 animate-pulse' :
                      'opacity-40'
                    }`}
                  >
                  <img
                    src={
                      photo.thumbnailUrl ||
                      photo.url ||
                      photo.signedRawUrl ||
                      photo.signedProcessedUrl ||
                      '/placeholder.jpg'
                    }
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {idx < photoProgress.current && (
                      <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
                {photos.length > 8 && (
                  <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center text-white/50 text-xs font-medium">
                    +{photos.length - 8}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Feed */}
          {activityFeed.length > 0 && phase !== 'complete' && phase !== 'error' && (
            <div className="bg-white/5 rounded-xl p-3 mb-5">
              <div className="space-y-1.5 max-h-20 overflow-y-auto">
                {activityFeed.map((msg, idx) => (
                  <p key={idx} className="text-xs text-white/60 flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    {msg}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Result Stats */}
          {phase === 'complete' && result && (
            <div className="p-5 bg-green-500/10 border border-green-500/30 rounded-xl mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{result.totalPhotos}</p>
                  <p className="text-xs text-white/50 mt-1">Photos Enhanced</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400">{result.confidenceScore}%</p>
                  <p className="text-xs text-white/50 mt-1">Quality Score</p>
                </div>
                <div>
                  <p className="te-2xl font-bold text-green-400">Ready</p>
                  <p className="text-xs text-white/50 mt-1">MLS Export</p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {phase === 'error' && error && (
            <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-xl mb-6">
              <p className="text-red-400 text-center mb-2 font-medium text-sm">{error}</p>
              <p className="text-white/50 text-xs text-center">Please try again in a few moments.</p>
            </div>
          )}

          {/* Action Buttons for Complete/Error */}
          {(phase === 'complete' || phase === 'error') && (
            <div className="flex gap-3">
              <button
                onClick={() => phase === 'error' ? window.location.reload() : onCancel?.()}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold rounded-xl transition-all text-sm"
              >
                {phase === 'error' ? 'Try Again' : 'View Photos'}
              </button>
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all border border-white/10 text-sm"
              >
                Close
              </button>
            </div>
          )}

          {/* Footer */}
          {phase !== 'complete' && phase !== 'error' && (
            <p className="text-center text-white/40 text-xs">
              Powered by <span className="text-amber-400 font-medium">SnapR AI Vision</span> • Usually takes 30-60 seconds
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
