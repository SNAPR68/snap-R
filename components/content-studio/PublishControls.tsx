'use client'

import { Download, Loader2, ExternalLink, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PublishControlsProps {
  platform: 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'story'
  caption: string
  hashtags: string
  copied: string | null
  uploading: string | null
  uploadSuccess: string | null
  uploadError: string | null
  connectedPlatforms: Set<string>
  onDownload: () => Promise<void>
  onCopyCaption: (text: string) => void
  onOpenSchedule: () => void
  onPublishDirect: (platformId: string) => Promise<void>
}

const PLATFORM_URLS: Record<string, string> = {
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  linkedin: 'https://www.linkedin.com/feed/',
  tiktok: 'https://www.tiktok.com/upload',
  story: 'https://www.instagram.com/',
}

export function PublishControls({
  platform,
  caption,
  hashtags,
  copied,
  uploading,
  uploadSuccess,
  uploadError,
  connectedPlatforms,
  onDownload,
  onCopyCaption,
  onOpenSchedule,
  onPublishDirect,
}: PublishControlsProps) {
  const platformUrl = PLATFORM_URLS[platform]
  const isConnected = connectedPlatforms.has(platform)

  return (
    <div className="space-y-4">
      {/* Success/Error Messages */}
      {uploadSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex gap-2">
          <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-green-300">{uploadSuccess}</p>
        </div>
      )}

      {uploadError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-xs text-red-300">{uploadError}</p>
        </div>
      )}

      {/* Copy Caption */}
      <div className="space-y-2">
        <button
          onClick={() => onCopyCaption(caption ? `${caption} ${hashtags}`.trim() : hashtags)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
        >
          {copied === 'caption' ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Caption
            </>
          )}
        </button>
      </div>

      {/* Download */}
      <Button
        onClick={onDownload}
        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
      >
        <Download className="w-4 h-4 mr-2" />
        Download Image
      </Button>

      {/* Direct Publish or Schedule */}
      <div className="flex gap-2">
        {isConnected ? (
          <Button
            onClick={() => onPublishDirect(platform)}
            disabled={uploading === platform}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90 text-white font-semibold"
          >
            {uploading === platform ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Publish Now
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onOpenSchedule}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold"
          >
            Schedule
          </Button>
        )}

        {!isConnected && (
          <Button
            asChild
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold"
          >
            <Link href={platformUrl} target="_blank">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open {platform}
            </Link>
          </Button>
        )}
      </div>

      {/* Info */}
      <p className="text-xs text-white/50 text-center">
        {isConnected
          ? `${platform} is connected. Publish directly or schedule for later.`
          : `Download the image and upload manually, or schedule for automatic posting.`}
      </p>
    </div>
  )
}
