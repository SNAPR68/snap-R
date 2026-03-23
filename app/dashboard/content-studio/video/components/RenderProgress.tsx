'use client'

import { Loader2, Check, AlertCircle, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type RenderStatus = 'idle' | 'triggering' | 'rendering' | 'completed' | 'failed'

interface RenderProgressProps {
  status: RenderStatus
  progress: number
  error: string | null
  videoUrl: string | null
  onDownload: () => void
  onShare: () => void
  onRender: () => void
}

export function RenderProgress({
  status,
  progress,
  error,
  videoUrl,
  onDownload,
  onShare,
  onRender,
}: RenderProgressProps) {
  return (
    <div className="space-y-4">
      {/* Status Display */}
      {status === 'idle' && (
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-white/70 text-sm">Ready to render. Click the button below to generate your video.</p>
        </div>
      )}

      {(status === 'triggering' || status === 'rendering') && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-white font-medium">
              {status === 'triggering' ? 'Starting render...' : 'Rendering video...'}
            </span>
          </div>
          {status === 'rendering' && (
            <>
              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-blue-300">{progress}% complete</p>
            </>
          )}
        </div>
      )}

      {status === 'completed' && videoUrl && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-white font-medium">Video rendered successfully!</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onDownload}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={onShare}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      )}

      {status === 'failed' && error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium">Render failed</p>
              <p className="text-sm text-red-300 mt-1">{error}</p>
            </div>
          </div>
          <Button
            onClick={onRender}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            Try Again
          </Button>
        </div>
      )}

      {status === 'idle' && (
        <Button
          onClick={onRender}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold h-12"
        >
          <Loader2 className="w-4 h-4 mr-2" />
          Generate Video
        </Button>
      )}
    </div>
  )
}
