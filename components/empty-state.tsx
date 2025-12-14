'use client';

import { ReactNode } from 'react';
import { Upload, Image, Sparkles, Share2, Download } from 'lucide-react';

type EmptyStateType = 'no-photos' | 'no-enhanced' | 'no-shared' | 'no-downloads';

interface EmptyStateProps {
  type: EmptyStateType;
  action?: ReactNode;
}

const states = {
  'no-photos': {
    icon: Upload,
    title: 'No photos yet',
    description: 'Upload your listing photos to get started with AI enhancement',
    tip: 'Drag & drop or click Upload to add photos',
  },
  'no-enhanced': {
    icon: Sparkles,
    title: 'No enhanced photos',
    description: 'Select a photo and apply AI tools to enhance it',
    tip: 'Use keyboard shortcut E to enhance quickly',
  },
  'no-shared': {
    icon: Share2,
    title: 'Nothing shared yet',
    description: 'Share your enhanced photos with clients for approval',
    tip: 'Click Share Gallery to generate a link',
  },
  'no-downloads': {
    icon: Download,
    title: 'Ready for download',
    description: 'Enhanced photos will appear here',
    tip: 'Download individually or use ZIP for all',
  },
};

export function EmptyState({ type, action }: EmptyStateProps) {
  const state = states[type];
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-white/20" />
      </div>
      <h3 className="text-lg font-medium text-white/80 mb-1">{state.title}</h3>
      <p className="text-sm text-white/40 mb-2 max-w-xs">{state.description}</p>
      <p className="text-xs text-[#D4A017]/60 mb-4">{state.tip}</p>
      {action}
    </div>
  );
}
