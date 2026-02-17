'use client';

import Link from 'next/link';
import { FileText, MessageSquare, FileArchive, Globe, Calendar, CheckCircle, Loader2, ChevronRight, AlertCircle, Megaphone, Lock, Sparkles } from 'lucide-react';

export type MarketingJobData = {
  id: string;
  status: string;
  description: { status: string; result: any };
  captions: { status: string; result: any };
  mls: { status: string; result: any };
  propertySite: { status: string; result: any };
  scheduledPosts: { status: string; result: any };
  totalCostCents: number;
  costBreakdown: any;
  startedAt: string;
  completedAt: string;
  error: string | null;
};

type MarketingBannerProps = {
  marketingStatus: string | null;
  marketingJob: MarketingJobData | null;
  onViewResults: () => void;
};

const STEPS = [
  { key: 'description', label: 'Description', icon: FileText },
  { key: 'captions', label: 'Captions', icon: MessageSquare },
  { key: 'mls', label: 'MLS Package', icon: FileArchive },
  { key: 'propertySite', label: 'Property Site', icon: Globe },
  { key: 'scheduledPosts', label: 'Social Posts', icon: Calendar },
] as const;

function getStepStatus(job: MarketingJobData, key: string): string {
  const step = (job as any)[key];
  return step?.status || 'pending';
}

function countCompleted(job: MarketingJobData): number {
  return STEPS.filter(s => getStepStatus(job, s.key) === 'completed').length;
}

export function MarketingBanner({ marketingStatus, marketingJob, onViewResults }: MarketingBannerProps) {
  // Don't show banner if no marketing activity at all
  if (!marketingStatus && !marketingJob) return null;

  // Show upgrade prompt for free-tier users (skipped marketing)
  if (marketingStatus === 'skipped') {
    return (
      <div className="bg-gradient-to-r from-[#D4A017]/10 via-[#D4A017]/5 to-transparent border-b border-[#D4A017]/20 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4A017]" />
          <span className="text-sm font-medium text-[#D4A017]">Marketing Automation</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <Lock className="w-3 h-3" />
          <span>Auto-generate descriptions, social captions, MLS packages, property sites & scheduled posts</span>
        </div>
        <div className="flex-1" />
        <Link
          href="/dashboard/billing"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4A017]/20 hover:bg-[#D4A017]/30 border border-[#D4A017]/30 rounded-lg text-xs text-[#D4A017] font-medium transition-colors"
        >
          Upgrade to Pro
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // Processing state
  if (marketingStatus === 'processing' || marketingJob?.status === 'processing') {
    const completed = marketingJob ? countCompleted(marketingJob) : 0;
    const currentStep = marketingJob
      ? STEPS.find(s => getStepStatus(marketingJob, s.key) === 'processing')
      : null;

    return (
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Megaphone className="w-4 h-4 text-amber-400" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
          </div>
          <span className="text-sm font-medium text-amber-300">Marketing Pipeline</span>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((step) => {
            const status = marketingJob ? getStepStatus(marketingJob, step.key) : 'pending';
            return (
              <div
                key={step.key}
                className="flex items-center gap-1"
                title={`${step.label}: ${status}`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    status === 'completed'
                      ? 'bg-emerald-400'
                      : status === 'processing'
                        ? 'bg-amber-400 animate-pulse w-2 h-2'
                        : status === 'failed'
                          ? 'bg-red-400'
                          : 'bg-white/20'
                  }`}
                />
              </div>
            );
          })}
        </div>

        <span className="text-xs text-white/50">
          {completed}/{STEPS.length} steps
        </span>

        {currentStep && (
          <span className="text-xs text-amber-400/80 animate-pulse">
            {currentStep.label}...
          </span>
        )}

        <div className="flex-1" />

        <span className="text-xs text-white/30">Auto-triggered by preparation</span>
      </div>
    );
  }

  // Completed state
  if (marketingStatus === 'completed' || marketingJob?.status === 'completed') {
    const completed = marketingJob ? countCompleted(marketingJob) : STEPS.length;
    const hasSite = marketingJob?.propertySite?.status === 'completed' && marketingJob?.propertySite?.result;
    const hasPosts = marketingJob?.scheduledPosts?.status === 'completed';

    return (
      <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b border-emerald-500/20 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">Marketing Complete</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/50">
          <span>{completed} artifacts generated</span>
          {hasSite && (
            <>
              <span className="text-white/20">|</span>
              <Globe className="w-3 h-3 text-purple-400" />
              <span className="text-purple-300">Property site live</span>
            </>
          )}
          {hasPosts && (
            <>
              <span className="text-white/20">|</span>
              <Calendar className="w-3 h-3 text-blue-400" />
              <span className="text-blue-300">Posts scheduled</span>
            </>
          )}
        </div>

        <div className="flex-1" />

        <button
          onClick={onViewResults}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 font-medium transition-colors"
        >
          View Results
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // Failed state
  if (marketingStatus === 'failed' || marketingJob?.status === 'failed') {
    return (
      <div className="bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent border-b border-red-500/20 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium text-red-300">Marketing Failed</span>
        </div>
        <span className="text-xs text-white/40">{marketingJob?.error || 'Unknown error'}</span>
        <div className="flex-1" />
        {marketingJob && (
          <button
            onClick={onViewResults}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-xs text-red-300 font-medium transition-colors"
          >
            View Details
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return null;
}
