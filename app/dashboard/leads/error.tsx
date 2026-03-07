'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-white/60 text-sm max-w-md">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
      </div>
      <button
        onClick={reset}
        className="px-4 py-2 bg-[#D4A017] text-black font-medium rounded-lg hover:bg-[#B8860B] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
