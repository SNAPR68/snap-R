'use client';

import { useState } from 'react';
import { 
  Brain, Loader2, Crown, Zap, AlertTriangle, CheckCircle2, 
  UserCheck, ChevronRight, RefreshCw, Sparkles, TrendingUp, Clock
} from 'lucide-react';

interface Photo {
  id: string;
  signedRawUrl: string;
  signedProcessedUrl?: string;
  raw_url: string;
}

interface PhotoScore {
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
  aiFeedback: string;
  recommendations: {
    toolId: string;
    toolName: string;
    reason: string;
    impactEstimate: number;
    needsHumanEdit?: boolean;
    humanEditReason?: string;
  }[];
}

interface AnalysisResult {
  overallScore: number;
  heroImageIndex: number;
  heroImageUrl: string;
  analysisSummary: string;
  estimatedDomCurrent: number;
  estimatedDomOptimized: number;
  photoScores: PhotoScore[];
}

interface Props {
  listingId: string;
  photos: Photo[];
  onApplyEnhancement: (photoIndex: number, toolId: string) => void;
  onRequestHumanEdit: (photoIndex: number, instructions: string) => void;
}

export function AIAnalysisTab({ listingId, photos, onApplyEnhancement, onRequestHumanEdit }: Props) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const runAnalysis = async () => {
    if (photos.length === 0) {
      setError('No photos to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const photoUrls = photos.map(p => p.signedProcessedUrl || p.signedRawUrl);
      
      const response = await fetch('/api/listing-intelligence/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          listingId,
          photoUrls 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setAnalysisResult({
        overallScore: data.result.overallScore,
        heroImageIndex: data.result.heroImageIndex,
        heroImageUrl: data.result.heroImageUrl,
        analysisSummary: data.result.analysisSummary,
        estimatedDomCurrent: data.result.estimatedDomCurrent,
        estimatedDomOptimized: data.result.estimatedDomOptimized,
        photoScores: data.result.photoScores,
      });
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

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Ready';
    if (score >= 50) return 'Needs AI Fix';
    return 'Needs Human Edit';
  };

  // Categorize photos
  const readyPhotos = analysisResult?.photoScores.filter(p => p.overallScore >= 80) || [];
  const needsAIFix = analysisResult?.photoScores.filter(p => p.overallScore >= 50 && p.overallScore < 80) || [];
  const needsHumanEdit = analysisResult?.photoScores.filter(p => p.overallScore < 50) || [];

  const selectedPhoto = selectedPhotoIndex !== null ? analysisResult?.photoScores[selectedPhotoIndex] : null;

  if (photos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-white/40 p-8">
        <Brain className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg mb-2">No Photos to Analyze</p>
        <p className="text-sm">Upload photos first, then run AI Analysis</p>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3">AI Photo Analysis</h2>
          <p className="text-white/60 mb-6">
            Analyze your {photos.length} photos to identify the best hero image, 
            get quality scores, and receive enhancement recommendations.
          </p>
          
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 hover:opacity-90 transition disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing {photos.length} photos...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                Run AI Analysis
              </>
            )}
          </button>

          <div className="grid grid-cols-3 gap-4 mt-8 text-left">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <Crown className="w-6 h-6 text-[#D4A017] mb-2" />
              <p className="text-sm font-medium">Hero Selection</p>
              <p className="text-xs text-white/50">Best MLS lead image</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <Zap className="w-6 h-6 text-[#D4A017] mb-2" />
              <p className="text-sm font-medium">AI Recommendations</p>
              <p className="text-xs text-white/50">Enhancement suggestions</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <UserCheck className="w-6 h-6 text-[#D4A017] mb-2" />
              <p className="text-sm font-medium">Human Edit Flags</p>
              <p className="text-xs text-white/50">Issues AI can't fix</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-0">
      {/* Main Analysis Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Overall Score Card */}
        <div className="p-5 bg-gradient-to-br from-[#1a1a2e] to-[#0d0d15] rounded-2xl border border-white/10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-white/60 mb-1">Listing Photo Score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${getScoreColor(analysisResult.overallScore)}`}>
                  {analysisResult.overallScore}
                </span>
                <span className="text-xl text-white/40">/100</span>
              </div>
            </div>
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Re-analyze
            </button>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-gradient-to-r from-[#D4A017] to-[#F4D03F] rounded-full transition-all duration-1000"
              style={{ width: `${analysisResult.overallScore}%` }}
            />
          </div>
          <p className="text-white/70 text-sm">{analysisResult.analysisSummary}</p>
          <div className="flex gap-4 mt-3 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              {readyPhotos.length} ready
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" />
              {needsAIFix.length} need AI fix
            </span>
            <span className="flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-red-400" />
              {needsHumanEdit.length} need human edit
            </span>
          </div>
        </div>

        {/* DOM Prediction */}
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#D4A017]" />
            <span className="text-sm font-medium">Days on Market Prediction</span>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-white/50">Current Photos</p>
              <p className="text-2xl font-bold text-orange-400">~{analysisResult.estimatedDomCurrent} days</p>
            </div>
            <TrendingUp className="w-5 h-5 text-[#D4A017]" />
            <div>
              <p className="text-xs text-white/50">With AI Optimization</p>
              <p className="text-2xl font-bold text-green-400">~{analysisResult.estimatedDomOptimized} days</p>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="p-4 bg-gradient-to-br from-[#D4A017]/20 to-[#B8860B]/10 rounded-xl border border-[#D4A017]/30">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-[#D4A017]" />
            <span className="text-sm font-medium text-[#D4A017]">Recommended Hero Image</span>
            <span className="px-2 py-0.5 bg-[#D4A017]/30 text-[#D4A017] text-xs rounded-full">
              Photo #{analysisResult.heroImageIndex + 1}
            </span>
          </div>
          <div className="flex gap-4">
            <div className="w-32 h-24 rounded-lg overflow-hidden border-2 border-[#D4A017]">
              <img 
                src={analysisResult.heroImageUrl} 
                alt="Hero" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-white/80 mb-2">
                This photo has the highest engagement potential. Use it as your primary image on MLS, Zillow, and social media.
              </p>
              {analysisResult.photoScores[analysisResult.heroImageIndex] && (
                <p className="text-xs text-white/50">
                  Score: {analysisResult.photoScores[analysisResult.heroImageIndex].overallScore}/100 · 
                  {analysisResult.photoScores[analysisResult.heroImageIndex].roomType}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Needs AI Fix */}
        {needsAIFix.length > 0 && (
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">Needs AI Enhancement ({needsAIFix.length})</span>
              </div>
            </div>
            <div className="space-y-2">
              {needsAIFix.slice(0, 5).map((photo) => (
                <div key={photo.photoIndex} className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={photo.photoUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">Photo #{photo.photoIndex + 1}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getScoreBg(photo.overallScore)}`}>
                        {photo.overallScore}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 truncate">{photo.aiFeedback}</p>
                  </div>
                  {photo.recommendations[0] && (
                    <button
                      onClick={() => onApplyEnhancement(photo.photoIndex, photo.recommendations[0].toolId)}
                      className="flex items-center gap-1 px-3 py-2 bg-[#D4A017] text-black rounded-lg text-xs font-medium hover:opacity-90"
                    >
                      Apply {photo.recommendations[0].toolName}
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Needs Human Edit */}
        {needsHumanEdit.length > 0 && (
          <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">Needs Human Edit ({needsHumanEdit.length})</span>
            </div>
            <div className="space-y-2">
              {needsHumanEdit.map((photo) => {
                const humanEditRec = photo.recommendations.find(r => r.needsHumanEdit);
                return (
                  <div key={photo.photoIndex} className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={photo.photoUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">Photo #{photo.photoIndex + 1}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400">
                          {photo.overallScore}
                        </span>
                      </div>
                      <p className="text-xs text-red-300/80">{humanEditRec?.humanEditReason || photo.aiFeedback}</p>
                    </div>
                    <button
                      onClick={() => onRequestHumanEdit(photo.photoIndex, humanEditRec?.humanEditReason || photo.aiFeedback)}
                      className="flex items-center gap-1 px-3 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30"
                    >
                      <UserCheck className="w-3 h-3" />
                      Request Edit
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ready Photos */}
        {readyPhotos.length > 0 && (
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">Ready for Content Studio ({readyPhotos.length})</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {readyPhotos.map((photo) => (
                <div 
                  key={photo.photoIndex}
                  onClick={() => setSelectedPhotoIndex(photo.photoIndex)}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition ${
                    selectedPhotoIndex === photo.photoIndex ? 'border-[#D4A017]' : 'border-transparent hover:border-white/30'
                  }`}
                >
                  <img src={photo.photoUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-green-500/80 text-white text-[10px] rounded font-medium">
                    {photo.overallScore}
                  </div>
                  {photo.photoIndex === analysisResult.heroImageIndex && (
                    <div className="absolute top-1 left-1">
                      <Crown className="w-4 h-4 text-[#D4A017] drop-shadow" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <div className="p-4 bg-gradient-to-r from-[#D4A017]/20 to-[#B8860B]/10 rounded-xl border border-[#D4A017]/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ready to create content?</p>
              <p className="text-sm text-white/60">
                {readyPhotos.length} optimized photos available
              </p>
            </div>
            <a
              href={`/dashboard/content-studio/create-all?listing=${listingId}`}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black rounded-xl font-semibold hover:opacity-90 transition"
            >
              <Sparkles className="w-4 h-4" />
              Continue to Content Studio
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Right Panel - Selected Photo Details */}
      {selectedPhoto && (
        <div className="w-[280px] border-l border-white/10 p-4 overflow-y-auto bg-[#1A1A1A]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Photo #{selectedPhoto.photoIndex + 1}</h3>
            <button onClick={() => setSelectedPhotoIndex(null)} className="text-white/40 hover:text-white">×</button>
          </div>
          
          <div className="aspect-video rounded-lg overflow-hidden mb-4">
            <img src={selectedPhoto.photoUrl} alt="" className="w-full h-full object-cover" />
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-white/50 mb-1">Overall Score</p>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${getScoreColor(selectedPhoto.overallScore)}`}>
                  {selectedPhoto.overallScore}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${getScoreBg(selectedPhoto.overallScore)}`}>
                  {getScoreLabel(selectedPhoto.overallScore)}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-white/50 mb-2">Score Breakdown</p>
              <div className="space-y-2">
                {[
                  { label: 'Lighting', score: selectedPhoto.lightingScore },
                  { label: 'Composition', score: selectedPhoto.compositionScore },
                  { label: 'Clarity', score: selectedPhoto.clarityScore },
                  { label: 'Appeal', score: selectedPhoto.appealScore },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="text-xs text-white/60 w-20">{item.label}</span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#D4A017] to-[#F4D03F] rounded-full"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <span className={`text-xs w-6 ${getScoreColor(item.score)}`}>{item.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-white/50 mb-1">Room Type</p>
              <p className="text-sm capitalize">{selectedPhoto.roomType.replace('-', ' ')}</p>
            </div>

            <div>
              <p className="text-xs text-white/50 mb-1">AI Feedback</p>
              <p className="text-sm text-white/80">{selectedPhoto.aiFeedback}</p>
            </div>

            {selectedPhoto.recommendations.length > 0 && (
              <div>
                <p className="text-xs text-white/50 mb-2">Recommendations</p>
                <div className="space-y-2">
                  {selectedPhoto.recommendations.map((rec, i) => (
                    <button
                      key={i}
                      onClick={() => rec.needsHumanEdit 
                        ? onRequestHumanEdit(selectedPhoto.photoIndex, rec.humanEditReason || rec.reason)
                        : onApplyEnhancement(selectedPhoto.photoIndex, rec.toolId)
                      }
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition ${
                        rec.needsHumanEdit 
                          ? 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/20'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span>{rec.needsHumanEdit ? '👤' : '⚡'} {rec.toolName}</span>
                      <span className="text-green-400">+{rec.impactEstimate}%</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
