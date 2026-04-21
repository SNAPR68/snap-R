'use client';

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Admin Error</h2>
        <p className="text-white/60 mb-6">
          An error occurred in the admin panel. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-gradient-to-r from-gold to-gold-dark rounded-xl text-black font-semibold hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
