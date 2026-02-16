'use client';

import { useState } from 'react';
import {
  FileText, MessageSquare, FileArchive, Globe, Calendar,
  CheckCircle, AlertCircle, Copy, Check, ExternalLink,
  Download, X, ChevronDown, ChevronUp, Clock, Loader2,
  Facebook, Instagram, Linkedin,
} from 'lucide-react';
import type { MarketingJobData } from './marketing-banner';

type MarketingResultsPanelProps = {
  marketingJob: MarketingJobData;
  listingId: string;
  onClose: () => void;
};

// Platform icon helper
function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  switch (platform) {
    case 'facebook': return <Facebook className={className} />;
    case 'instagram': return <Instagram className={className} />;
    case 'linkedin': return <Linkedin className={className} />;
    default: return <MessageSquare className={className} />;
  }
}

function StatusDot({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />;
  if (status === 'processing') return <Loader2 className="w-3 h-3 text-amber-400 animate-spin flex-shrink-0" />;
  if (status === 'failed') return <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />;
  return <Clock className="w-3 h-3 text-white/30 flex-shrink-0" />;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-white/50 hover:text-white/70 transition-colors"
    >
      {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function CollapsibleSection({
  title,
  icon: Icon,
  status,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: any;
  status: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/8 transition-colors"
      >
        <Icon className="w-3.5 h-3.5 text-white/60" />
        <span className="text-xs font-medium flex-1 text-left">{title}</span>
        <StatusDot status={status} />
        {open ? <ChevronUp className="w-3 h-3 text-white/40" /> : <ChevronDown className="w-3 h-3 text-white/40" />}
      </button>
      {open && (
        <div className="px-3 py-2.5 border-t border-white/10 bg-black/20">
          {children}
        </div>
      )}
    </div>
  );
}

export function MarketingResultsPanel({ marketingJob, listingId, onClose }: MarketingResultsPanelProps) {
  return (
    <aside className="w-[280px] bg-[#1A1A1A] border-l border-white/10 flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/10">
        <h2 className="text-xs font-semibold text-[#D4A017] tracking-wider">MARKETING RESULTS</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title="Back to Downloads"
        >
          <X className="w-3.5 h-3.5 text-white/50" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">

        {/* 1. Description */}
        <CollapsibleSection
          title="Property Description"
          icon={FileText}
          status={marketingJob.description.status}
          defaultOpen={true}
        >
          {marketingJob.description.status === 'completed' && marketingJob.description.result ? (
            <div>
              <p className="text-xs text-white/70 leading-relaxed line-clamp-6 mb-2">
                {typeof marketingJob.description.result === 'string'
                  ? marketingJob.description.result
                  : marketingJob.description.result?.description || JSON.stringify(marketingJob.description.result)}
              </p>
              <CopyButton
                text={
                  typeof marketingJob.description.result === 'string'
                    ? marketingJob.description.result
                    : marketingJob.description.result?.description || ''
                }
              />
            </div>
          ) : marketingJob.description.status === 'processing' ? (
            <p className="text-xs text-amber-400/70 animate-pulse">Generating description...</p>
          ) : marketingJob.description.status === 'failed' ? (
            <p className="text-xs text-red-400/70">Failed to generate</p>
          ) : (
            <p className="text-xs text-white/30">Pending</p>
          )}
        </CollapsibleSection>

        {/* 2. Social Captions */}
        <CollapsibleSection
          title="Social Captions"
          icon={MessageSquare}
          status={marketingJob.captions.status}
        >
          {marketingJob.captions.status === 'completed' && marketingJob.captions.result ? (
            <div className="space-y-2.5">
              {(() => {
                const captions = marketingJob.captions.result;
                const platforms = typeof captions === 'object' ? Object.entries(captions) : [];
                if (platforms.length === 0) return <p className="text-xs text-white/30">No captions generated</p>;

                return platforms.map(([platform, data]: [string, any]) => {
                  const captionText = typeof data === 'string' ? data : data?.caption || data?.text || '';
                  const hashtags = typeof data === 'object' ? data?.hashtags : null;

                  return (
                    <div key={platform} className="bg-white/5 rounded-lg p-2">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <PlatformIcon platform={platform} className="w-3 h-3 text-white/50" />
                        <span className="text-[10px] font-medium text-white/60 uppercase">{platform}</span>
                      </div>
                      <p className="text-[11px] text-white/70 leading-relaxed line-clamp-4 mb-1.5">
                        {captionText}
                      </p>
                      {hashtags && (
                        <p className="text-[10px] text-blue-400/70 mb-1.5">
                          {Array.isArray(hashtags) ? hashtags.join(' ') : hashtags}
                        </p>
                      )}
                      <CopyButton
                        text={captionText + (hashtags ? '\n' + (Array.isArray(hashtags) ? hashtags.join(' ') : hashtags) : '')}
                      />
                    </div>
                  );
                });
              })()}
            </div>
          ) : marketingJob.captions.status === 'processing' ? (
            <p className="text-xs text-amber-400/70 animate-pulse">Generating captions...</p>
          ) : marketingJob.captions.status === 'failed' ? (
            <p className="text-xs text-red-400/70">Failed to generate</p>
          ) : (
            <p className="text-xs text-white/30">Pending</p>
          )}
        </CollapsibleSection>

        {/* 3. MLS Package */}
        <CollapsibleSection
          title="MLS Package"
          icon={FileArchive}
          status={marketingJob.mls.status}
        >
          {marketingJob.mls.status === 'completed' && marketingJob.mls.result ? (
            <div className="space-y-2">
              {(() => {
                const mls = marketingJob.mls.result;
                const fields = typeof mls === 'object' ? Object.entries(mls) : [];
                if (fields.length === 0) return <p className="text-xs text-white/30">No MLS data</p>;

                // Show key fields as a mini table
                const keyFields = ['publicRemarks', 'features', 'propertyType', 'style', 'bedrooms', 'bathrooms', 'squareFeet'];
                const displayFields = fields.filter(([k]) => keyFields.includes(k)).slice(0, 5);

                return (
                  <>
                    {displayFields.map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-2">
                        <span className="text-[10px] text-white/40 capitalize flex-shrink-0">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-[10px] text-white/70 text-right truncate">
                          {typeof value === 'string' ? value.slice(0, 60) : Array.isArray(value) ? value.slice(0, 3).join(', ') : String(value)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-1">
                      <CopyButton text={JSON.stringify(mls, null, 2)} />
                    </div>
                  </>
                );
              })()}
            </div>
          ) : marketingJob.mls.status === 'processing' ? (
            <p className="text-xs text-amber-400/70 animate-pulse">Generating MLS data...</p>
          ) : marketingJob.mls.status === 'failed' ? (
            <p className="text-xs text-red-400/70">Failed to generate</p>
          ) : (
            <p className="text-xs text-white/30">Pending</p>
          )}
        </CollapsibleSection>

        {/* 4. Property Site */}
        <CollapsibleSection
          title="Property Site"
          icon={Globe}
          status={marketingJob.propertySite.status}
        >
          {marketingJob.propertySite.status === 'completed' && marketingJob.propertySite.result ? (
            <div className="space-y-2">
              {(() => {
                const site = marketingJob.propertySite.result;
                const slug = typeof site === 'string' ? site : site?.slug || site?.url;
                if (!slug) return <p className="text-xs text-white/30">No site data</p>;

                const siteUrl = slug.startsWith('http') ? slug : `/p/${slug}`;

                return (
                  <>
                    <a
                      href={siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-xs text-purple-300 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span className="flex-1 truncate">{siteUrl}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                    <CopyButton text={typeof window !== 'undefined' ? `${window.location.origin}${siteUrl}` : siteUrl} />
                  </>
                );
              })()}
            </div>
          ) : marketingJob.propertySite.status === 'processing' ? (
            <p className="text-xs text-amber-400/70 animate-pulse">Building property site...</p>
          ) : marketingJob.propertySite.status === 'failed' ? (
            <p className="text-xs text-red-400/70">Failed to build</p>
          ) : (
            <p className="text-xs text-white/30">Pending</p>
          )}
        </CollapsibleSection>

        {/* 5. Scheduled Posts */}
        <CollapsibleSection
          title="Scheduled Posts"
          icon={Calendar}
          status={marketingJob.scheduledPosts.status}
        >
          {marketingJob.scheduledPosts.status === 'completed' && marketingJob.scheduledPosts.result ? (
            <div className="space-y-2">
              {(() => {
                const posts = marketingJob.scheduledPosts.result;
                const postList = Array.isArray(posts) ? posts : posts?.posts || [];
                const count = typeof posts === 'object' && !Array.isArray(posts) ? posts?.count : postList.length;

                return (
                  <>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Calendar className="w-3 h-3" />
                      <span>{count || postList.length} post(s) scheduled</span>
                    </div>
                    {postList.slice(0, 3).map((post: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded text-[11px]">
                        <PlatformIcon platform={post.platform || 'unknown'} className="w-3 h-3 text-white/40" />
                        <span className="text-white/60 flex-1 truncate">{post.platform || 'Platform'}</span>
                        {post.scheduledFor && (
                          <span className="text-white/30 text-[10px]">
                            {new Date(post.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          ) : marketingJob.scheduledPosts.status === 'processing' ? (
            <p className="text-xs text-amber-400/70 animate-pulse">Scheduling posts...</p>
          ) : marketingJob.scheduledPosts.status === 'failed' ? (
            <p className="text-xs text-red-400/70">Failed to schedule</p>
          ) : (
            <p className="text-xs text-white/30">Pending</p>
          )}
        </CollapsibleSection>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        {marketingJob.completedAt && (
          <p className="text-[10px] text-white/30 mb-2 text-center">
            Completed {new Date(marketingJob.completedAt).toLocaleDateString()} at{' '}
            {new Date(marketingJob.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        <button
          onClick={onClose}
          className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/60 transition-colors"
        >
          Back to Downloads
        </button>
      </div>
    </aside>
  );
}
