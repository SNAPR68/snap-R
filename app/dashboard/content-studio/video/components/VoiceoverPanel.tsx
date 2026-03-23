'use client'

import { Loader2, Sparkles, Volume2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type VoiceId = 'professional-male' | 'professional-female' | 'luxury-male' | 'luxury-female' | 'friendly-male' | 'friendly-female'
type ScriptStyle = 'professional' | 'luxury' | 'friendly' | 'firstTimeBuyer'

const VOICE_OPTIONS: Record<VoiceId, { name: string; desc: string; emoji: string }> = {
  'professional-male': { name: 'James', desc: 'Professional Male', emoji: '👔' },
  'professional-female': { name: 'Sarah', desc: 'Professional Female', emoji: '👔' },
  'luxury-male': { name: 'Richard', desc: 'Luxury Male', emoji: '✨' },
  'luxury-female': { name: 'Victoria', desc: 'Luxury Female', emoji: '✨' },
  'friendly-male': { name: 'Mike', desc: 'Friendly Male', emoji: '😊' },
  'friendly-female': { name: 'Emma', desc: 'Friendly Female', emoji: '😊' },
}

const SCRIPT_STYLES: Record<ScriptStyle, { name: string; desc: string; emoji: string }> = {
  'professional': { name: 'Professional', desc: 'Business-like tone', emoji: '👔' },
  'luxury': { name: 'Luxury', desc: 'Upscale & exclusive', emoji: '✨' },
  'friendly': { name: 'Friendly', desc: 'Warm & welcoming', emoji: '😊' },
  'firstTimeBuyer': { name: 'First-Time', desc: 'Helpful & informative', emoji: '🏠' },
}

interface VoiceoverPanelProps {
  enableVoiceover: boolean
  voiceId: VoiceId
  scriptStyle: ScriptStyle
  script: string
  generatingScript: boolean
  generatingVoiceover: boolean
  voiceoverUrl: string | null
  voiceoverVolume: number
  onEnableVoiceoverChange: (enable: boolean) => void
  onVoiceIdChange: (voice: VoiceId) => void
  onScriptStyleChange: (style: ScriptStyle) => void
  onScriptChange: (script: string) => void
  onGenerateScript: () => void
  onGenerateVoiceover: () => void
  onVoiceoverVolumeChange: (volume: number) => void
}

export function VoiceoverPanel({
  enableVoiceover,
  voiceId,
  scriptStyle,
  script,
  generatingScript,
  generatingVoiceover,
  voiceoverUrl,
  voiceoverVolume,
  onEnableVoiceoverChange,
  onVoiceIdChange,
  onScriptStyleChange,
  onScriptChange,
  onGenerateScript,
  onGenerateVoiceover,
  onVoiceoverVolumeChange,
}: VoiceoverPanelProps) {
  return (
    <div className="space-y-4">
      {/* Enable Voiceover Toggle */}
      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
        <div>
          <p className="font-medium text-white">Add Voiceover</p>
          <p className="text-xs text-white/50 mt-0.5">AI-generated narration for your video</p>
        </div>
        <button
          onClick={() => onEnableVoiceoverChange(!enableVoiceover)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            enableVoiceover ? 'bg-amber-500' : 'bg-white/20'
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              enableVoiceover ? 'translate-x-6' : ''
            }`}
          />
        </button>
      </div>

      {enableVoiceover && (
        <>
          {/* Script Style */}
          <div>
            <Label className="text-white/80 mb-2 block text-sm">Script Style</Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(SCRIPT_STYLES) as Array<[ScriptStyle, typeof SCRIPT_STYLES.professional]>).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => onScriptStyleChange(key)}
                  className={`p-2 rounded-lg text-xs transition-all ${
                    scriptStyle === key
                      ? 'bg-purple-500/30 border border-purple-500'
                      : 'bg-white/5 border border-white/10 hover:border-purple-500/50'
                  }`}
                >
                  <span className="text-lg">{value.emoji}</span>
                  <p className="font-medium text-white mt-1">{value.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Selection */}
          <div>
            <Label className="text-white/80 mb-2 block text-sm">Voice Talent</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {(Object.entries(VOICE_OPTIONS) as Array<[VoiceId, typeof VOICE_OPTIONS['professional-female']]>).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => onVoiceIdChange(key)}
                  className={`p-2 rounded-lg text-center transition-all ${
                    voiceId === key
                      ? 'bg-purple-500/30 border border-purple-500'
                      : 'bg-white/5 border border-white/10 hover:border-purple-500/50'
                  }`}
                >
                  <span className="text-lg">{value.emoji}</span>
                  <p className="font-medium text-white text-xs mt-1">{value.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Script */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-white/80 text-sm">Script</Label>
              <Button
                size="sm"
                onClick={onGenerateScript}
                disabled={generatingScript}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                {generatingScript ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-1" />
                    Generate AI Script
                  </>
                )}
              </Button>
            </div>
            <textarea
              value={script}
              onChange={e => onScriptChange(e.target.value)}
              placeholder="Write or generate a script for the voiceover..."
              rows={4}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none resize-none"
            />
          </div>

          {/* Generate Voiceover Button */}
          <Button
            onClick={onGenerateVoiceover}
            disabled={!script.trim() || generatingVoiceover}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold"
          >
            {generatingVoiceover ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Audio...
              </>
            ) : voiceoverUrl ? (
              'Regenerate Voiceover'
            ) : (
              'Generate Voiceover'
            )}
          </Button>

          {/* Voiceover Volume */}
          {voiceoverUrl && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-white/80 text-sm flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Voiceover Volume
                </Label>
                <span className="text-xs text-white/50">{voiceoverVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={voiceoverVolume}
                onChange={e => onVoiceoverVolumeChange(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
