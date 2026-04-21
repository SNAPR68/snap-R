'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
        <p className="text-white/60 mb-6">
          An error occurred while loading this page. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-gradient-to-r from-gold to-gold-dark rounded-xl text-black font-semibold hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}

