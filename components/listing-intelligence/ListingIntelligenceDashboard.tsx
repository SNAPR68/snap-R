'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Brain, Upload, Sparkles, TrendingUp, Clock, Image as ImageIcon,
  CheckCircle2, AlertCircle, Loader2, Crown, Zap, BarChart3, Target,
  ChevronRight, RefreshCw
} from 'lucide-react';

interface PhotoScore {
  id: string;
  photoIndex: number;
  photoUrl: string;
  overallScore: number;
  lightingScore: number;
  compositionScore: number;
  clarityScore: number;
  appealScore: number;
  roomType: string;
  isExterior: boolean;
  isHeroCandidate: boolean;
  heroPotential: number;
  enhancementPotential: number;
  aiFeedback: string;
  recommendations: any[];
}

interface Recommendation {
  id: string;
  photoIndex: number;
  photoUrl: string;
  toolId: string;
  toolName: string;
  priority: number;
  impactEstimate: number;
  impactDescription: string;
  reason: string;
  applied: boolean;
}

interface AnalysisResult {
  id: string;
  overallScore: number;
  heroImageIndex: number;
  heroImageUrl: string;
  totalPhotos: number;
  analysisSummary: string;
  competitiveBenchmark: string;
  estimatedDomCurrent: number;
  estimatedDomOptimized: number;
  status: string;
}

interface Props {
  onApplyEnhancement?: (toolId: string, photoUrl: string) => void;
  onApplyAll?: (recommendations: Recommendation[]) => void;
  preloadedPhotos?: string[];
  listingId?: string;
  listingTitle?: string;
  isLoading?: boolean;
}

export default function ListingIntelligenceDashboard({ onApplyEnhancement, onApplyAll, preloadedPhotos = [], listingId, listingTitle, isLoading = false }: Props) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Auto-load preloaded photos from listing
  useEffect(() => {
    if (preloadedPhotos.length > 0 && photos.length === 0) {
      setPhotos(preloadedPhotos);
      // Auto-select all preloaded photos
      setSelectedPhotos(new Set(preloadedPhotos.map((_, i) => i)));
    }
  }, [preloadedPhotos]);

  const [photoScores, setPhotoScores] = useState<PhotoScore[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoScore | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newPhotos: string[] = [];
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        newPhotos.push(reader.result as string);
        if (newPhotos.length === acceptedFiles.length) {
          setPhotos(prev => [...prev, ...newPhotos]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 50,
  });

  const clearPhotos = () => {
    setPhotos([]);
    setAnalysisResult(null);
    setPhotoScores([]);
    setRecommendations([]);
    setSelectedPhoto(null);
    setError(null);
  };

  const runAnalysis = async () => {
    if (photos.length === 0) {
      setError('Please add at least one photo to analyze');
      return;
    }
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/listing-intelligence/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrls: Array.from(selectedPhotos).map(idx => photos[idx]), listingId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      
      setAnalysisResult({
        id: data.analysisId,
        overallScore: data.result.overallScore,
        heroImageIndex: data.result.heroImageIndex,
        heroImageUrl: data.result.heroImageUrl,
        totalPhotos: data.result.totalPhotos,
        analysisSummary: data.result.analysisSummary,
        competitiveBenchmark: data.result.competitiveBenchmark,
        estimatedDomCurrent: data.result.estimatedDomCurrent,
        estimatedDomOptimized: data.result.estimatedDomOptimized,
        status: 'completed',
      });
      setPhotoScores(data.result.photoScores);
      setRecommendations(data.result.topRecommendations);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze photos');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
    if (score >= 40) return 'bg-orange-500/20 border-orange-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const handleApplyEnhancement = (rec: Recommendation) => {
    if (onApplyEnhancement) onApplyEnhancement(rec.toolId, rec.photoUrl);
  };

  const handleApplyAll = () => {
    const unapplied = recommendations.filter(r => !r.applied);
    if (onApplyAll && unapplied.length > 0) onApplyAll(unapplied);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="border-b border-white/10 bg-gradient-to-r from-[#0A0A0F] via-[#1a1a2e] to-[#0A0A0F]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                <Brain className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Listing Intelligence AI</h1>
                <p className="text-white/60 text-sm">AI-powered photo analysis & optimization</p>
              </div>
            </div>
            {analysisResult && (
              <button onClick={clearPhotos} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition">
                <RefreshCw className="w-4 h-4" />
                New Analysis
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {!analysisResult && (
          <div className="space-y-6">
            {preloadedPhotos.length === 0 && (
            <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragActive ? 'border-[#D4A017] bg-[#D4A017]/10' : 'border-white/20 hover:border-white/40 bg-white/5'}`}>
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#D4A017]/20 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-[#D4A017]" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{isDragActive ? 'Drop photos here' : 'Drag & drop listing photos'}</p>
                  <p className="text-white/60 text-sm mt-1">or click to select • Up to 50 photos • JPG, PNG, WebP</p>
                </div>
              </div>
            </div>
            )}
            {photos.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold">{selectedPhotos.size} of {photos.length} Selected</h3>
                    <button 
                      onClick={() => setSelectedPhotos(new Set(photos.map((_, i) => i)))} 
                      className="text-sm text-[#D4A017] hover:text-[#F4D03F]"
                    >
                      Select All
                    </button>
                    <button 
                      onClick={() => setSelectedPhotos(new Set())} 
                      className="text-sm text-white/60 hover:text-white"
                    >
                      Deselect All
                    </button>
                  </div>
                  {preloadedPhotos.length === 0 && (
                    <button onClick={clearPhotos} className="text-sm text-white/60 hover:text-white">Clear All</button>
                  )}
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {photos.map((photo, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        const newSelected = new Set(selectedPhotos);
                        if (newSelected.has(idx)) {
                          newSelected.delete(idx);
                        } else {
                          newSelected.add(idx);
                        }
                        setSelectedPhotos(newSelected);
                      }}
                      className={`aspect-square rounded-lg overflow-hidden bg-white/10 cursor-pointer relative border-2 transition-all ${selectedPhotos.has(idx) ? 'border-[#D4A017] ring-2 ring-[#D4A017]/50' : 'border-transparent hover:border-white/30'}`}
                    >
                      <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${selectedPhotos.has(idx) ? 'bg-[#D4A017] text-black' : 'bg-black/60 text-white'}`}>
                        {selectedPhotos.has(idx) ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-medium">{idx + 1}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400">{error}</p>
              </div>
            )}

            <button onClick={runAnalysis} disabled={selectedPhotos.size === 0 || isAnalyzing} className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition ${photos.length > 0 && !isAnalyzing ? 'bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black hover:opacity-90' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}>
              {isAnalyzing ? (<><Loader2 className="w-5 h-5 animate-spin" />Analyzing {selectedPhotos.size} photos...</>) : (<><Brain className="w-5 h-5" />Analyze {selectedPhotos.size} Photo{selectedPhotos.size !== 1 ? 's' : ''}</>)}
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <BarChart3 className="w-8 h-8 text-[#D4A017] mb-3" />
                <h4 className="font-semibold mb-1">Photo Scoring</h4>
                <p className="text-sm text-white/60">AI scores each photo on lighting, composition, clarity & appeal</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <Crown className="w-8 h-8 text-[#D4A017] mb-3" />
                <h4 className="font-semibold mb-1">Hero Selection</h4>
                <p className="text-sm text-white/60">Identifies the best photo to lead your MLS listing</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <Target className="w-8 h-8 text-[#D4A017] mb-3" />
                <h4 className="font-semibold mb-1">Smart Recommendations</h4>
                <p className="text-sm text-white/60">Specific enhancements to maximize buyer engagement</p>
              </div>
            </div>
          </div>
        )}

        {analysisResult && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 bg-gradient-to-br from-[#1a1a2e] to-[#0d0d15] rounded-2xl border border-white/10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white/60 mb-1">Overall Listing Score</h3>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-6xl font-bold ${getScoreColor(analysisResult.overallScore)}`}>{analysisResult.overallScore}</span>
                      <span className="text-2xl text-white/40">/100</span>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${getScoreBg(analysisResult.overallScore)}`}>
                    {analysisResult.overallScore >= 80 ? 'Excellent' : analysisResult.overallScore >= 60 ? 'Good' : analysisResult.overallScore >= 40 ? 'Average' : 'Needs Work'}
                  </div>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-gradient-to-r from-[#D4A017] to-[#F4D03F] rounded-full transition-all duration-1000" style={{ width: `${analysisResult.overallScore}%` }} />
                </div>
                <p className="text-white/60">{analysisResult.analysisSummary}</p>
                <p className="text-white/40 text-sm mt-2">{analysisResult.competitiveBenchmark}</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-[#1a1a2e] to-[#0d0d15] rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-[#D4A017]" />
                  <h3 className="font-semibold">Days on Market Prediction</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-white/60 mb-1">Current Photos</p>
                    <p className="text-3xl font-bold text-orange-400">~{analysisResult.estimatedDomCurrent} days</p>
                  </div>
                  <div className="flex items-center gap-2 text-[#D4A017]">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">With AI Enhancements</span>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-400">~{analysisResult.estimatedDomOptimized} days</p>
                    <p className="text-sm text-green-400/60">-{Math.round((1 - analysisResult.estimatedDomOptimized / analysisResult.estimatedDomCurrent) * 100)}% faster</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-[#1a1a2e] to-[#0d0d15] rounded-2xl border border-[#D4A017]/30">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-[#D4A017]" />
                <h3 className="font-semibold">Recommended Hero Image</h3>
                <span className="px-2 py-0.5 bg-[#D4A017]/20 text-[#D4A017] text-xs rounded-full">Photo #{analysisResult.heroImageIndex + 1}</span>
              </div>
              <div className="flex gap-6">
                <div className="w-48 h-32 rounded-xl overflow-hidden border-2 border-[#D4A017]">
                  <img src={analysisResult.heroImageUrl} alt="Hero image" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-white/80 mb-2">This photo has the highest engagement potential and should be your lead image on MLS, Zillow, and social media.</p>
                  {photoScores[analysisResult.heroImageIndex] && (
                    <div className="flex gap-4 text-sm">
                      <span className="text-white/60">Room: <span className="text-white">{photoScores[analysisResult.heroImageIndex].roomType}</span></span>
                      <span className="text-white/60">Score: <span className={getScoreColor(photoScores[analysisResult.heroImageIndex].overallScore)}>{photoScores[analysisResult.heroImageIndex].overallScore}/100</span></span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-[#1a1a2e] to-[#0d0d15] rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#D4A017]" />
                  <h3 className="font-semibold">Top Enhancement Recommendations</h3>
                </div>
                {onApplyAll && recommendations.filter(r => !r.applied).length > 0 && (
                  <button onClick={handleApplyAll} className="px-4 py-2 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black rounded-lg font-medium text-sm hover:opacity-90 transition flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Apply All ({recommendations.filter(r => !r.applied).length})
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {recommendations.slice(0, 5).map((rec, idx) => (
                  <div key={rec.id || idx} className={`flex items-center gap-4 p-4 rounded-xl border transition ${rec.applied ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={rec.photoUrl} alt={`Photo ${rec.photoIndex + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{rec.toolName}</span>
                        <span className="text-xs text-white/40">Photo #{rec.photoIndex + 1}</span>
                      </div>
                      <p className="text-sm text-white/60 truncate">{rec.reason}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-lg font-bold text-green-400">{rec.impactDescription}</span>
                      <p className="text-xs text-white/40">engagement boost</p>
                    </div>
                    {rec.applied ? (
                      <div className="flex items-center gap-1 text-green-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm">Applied</span>
                      </div>
                    ) : (
                      <button onClick={() => handleApplyEnhancement(rec)} className="px-3 py-2 bg-[#D4A017] text-black rounded-lg font-medium text-sm hover:opacity-90 transition flex items-center gap-1">
                        Apply<ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-[#1a1a2e] to-[#0d0d15] rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-[#D4A017]" />
                <h3 className="font-semibold">All Photo Scores</h3>
                <span className="text-white/40 text-sm">({photoScores.length} photos)</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {photoScores.map((photo, idx) => (
                  <div key={photo.id || idx} onClick={() => setSelectedPhoto(photo)} className={`relative rounded-xl overflow-hidden cursor-pointer transition group ${selectedPhoto?.photoIndex === photo.photoIndex ? 'ring-2 ring-[#D4A017]' : 'hover:ring-1 hover:ring-white/30'}`}>
                    <div className="aspect-[4/3]">
                      <img src={photo.photoUrl} alt={`Photo ${photo.photoIndex + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-sm font-bold ${getScoreBg(photo.overallScore)}`}>{photo.overallScore}</div>
                    {photo.photoIndex === analysisResult.heroImageIndex && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-[#D4A017] text-black rounded-lg text-xs font-bold flex items-center gap-1">
                        <Crown className="w-3 h-3" />HERO
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center p-2">
                      <p className="text-xs text-white/80 text-center mb-1">{photo.roomType}</p>
                      <p className="text-xs text-white/60">{photo.recommendations?.length || 0} recommendations</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedPhoto && (
              <div className="p-6 bg-gradient-to-br from-[#1a1a2e] to-[#0d0d15] rounded-2xl border border-[#D4A017]/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Photo #{selectedPhoto.photoIndex + 1} Details</h3>
                  <button onClick={() => setSelectedPhoto(null)} className="text-white/60 hover:text-white">Close</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><img src={selectedPhoto.photoUrl} alt="Selected photo" className="w-full rounded-xl" /></div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-white/60 mb-1">Room Type</p>
                      <p className="font-semibold capitalize">{selectedPhoto.roomType.replace('-', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/60 mb-2">Score Breakdown</p>
                      <div className="space-y-2">
                        {[
                          { label: 'Lighting', score: selectedPhoto.lightingScore },
                          { label: 'Composition', score: selectedPhoto.compositionScore },
                          { label: 'Clarity', score: selectedPhoto.clarityScore },
                          { label: 'Appeal', score: selectedPhoto.appealScore },
                        ].map(item => (
                          <div key={item.label} className="flex items-center gap-3">
                            <span className="text-sm text-white/60 w-24">{item.label}</span>
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-[#D4A017] to-[#F4D03F] rounded-full" style={{ width: `${item.score}%` }} />
                            </div>
                            <span className={`text-sm font-medium w-8 ${getScoreColor(item.score)}`}>{item.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-white/60 mb-1">Hero Image Potential</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-[#D4A017]">{selectedPhoto.heroPotential}</span>
                        <span className="text-white/40">/10</span>
                        {selectedPhoto.isHeroCandidate && <span className="px-2 py-0.5 bg-[#D4A017]/20 text-[#D4A017] text-xs rounded-full">Strong Candidate</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-white/60 mb-1">AI Feedback</p>
                      <p className="text-white/80">{selectedPhoto.aiFeedback}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
