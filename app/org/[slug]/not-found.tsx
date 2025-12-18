import Link from 'next/link';

export default function OrgNotFound() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-amber-400 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Organization Not Found</h2>
        <p className="text-white/50 mb-8">
          This organization doesn't exist or white-label is not active.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 transition-colors"
        >
          Go to SnapR
        </Link>
      </div>
    </div>
  );
}
