'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Search, Loader2, X, CheckCircle, AlertCircle, Download } from 'lucide-react';

interface MLSPhoto {
  url: string;
  caption: string | null;
  order: number;
}

export interface MLSImportData {
  title: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  year_built: number | null;
  lot_size: string | null;
  property_type: string | null;
  description: string | null;
  parking: string | null;
  features: string[];
  hoa_fees: number | null;
  latitude: number | null;
  longitude: number | null;
  virtual_tour_url: string | null;
  mls_number: string;
  listing_status: string | null;
  photos: MLSPhoto[];
}

interface MLSImportModalProps {
  onImport: (data: MLSImportData) => void;
  onClose: () => void;
}

export function MLSImportModal({ onImport, onClose }: MLSImportModalProps) {
  const [mlsNumber, setMlsNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MLSImportData | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSearch = async () => {
    if (!mlsNumber.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/mls/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mlsNumber: mlsNumber.trim() }),
        signal: AbortSignal.timeout(15000),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to find listing');
        return;
      }

      setResult(data.data as MLSImportData);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseData = () => {
    if (result) {
      onImport(result);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Import from MLS"
    >
      <div
        className="bg-surface-container-high rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Download className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Import from MLS</h2>
              <p className="text-white/50 text-sm">Auto-fill listing details from MLS number</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg" aria-label="Close">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Search Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={mlsNumber}
            onChange={(e) => setMlsNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter MLS number (e.g., MLS12345)"
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none"
            aria-label="MLS number"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !mlsNumber.trim()}
            className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Result Preview */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-400">Found listing! Review the details below.</p>
            </div>

            {/* Photo Preview */}
            {result.photos.length > 0 && (
              <div>
                <p className="text-sm text-white/60 mb-2">{result.photos.length} photos found</p>
                <div className="grid grid-cols-4 gap-2">
                  {result.photos.slice(0, 8).map((photo, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-white/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <Image src={photo.url}
                        alt={`MLS photo ${i + 1}`}
                        className="w-full h-full object-cover" width={400} height={300} unoptimized />
                    </div>
                  ))}
                </div>
                {result.photos.length > 8 && (
                  <p className="text-xs text-white/40 mt-1">+{result.photos.length - 8} more photos</p>
                )}
              </div>
            )}

            {/* Data Preview */}
            <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Address</span>
                <span className="text-white font-medium">{result.address}</span>
              </div>
              {result.price && (
                <div className="flex justify-between">
                  <span className="text-white/50">Price</span>
                  <span className="text-primary font-bold">${result.price.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/50">Details</span>
                <span className="text-white">
                  {[
                    result.bedrooms && `${result.bedrooms} bed`,
                    result.bathrooms && `${result.bathrooms} bath`,
                    result.square_feet && `${result.square_feet.toLocaleString()} sqft`,
                  ].filter(Boolean).join(' • ')}
                </span>
              </div>
              {result.year_built && (
                <div className="flex justify-between">
                  <span className="text-white/50">Year Built</span>
                  <span className="text-white">{result.year_built}</span>
                </div>
              )}
              {result.mls_number && (
                <div className="flex justify-between">
                  <span className="text-white/50">MLS #</span>
                  <span className="text-white">{result.mls_number}</span>
                </div>
              )}
            </div>

            {/* Use Button */}
            <button
              onClick={handleUseData}
              className="w-full py-3 bg-gradient-to-r from-gold to-gold-dark rounded-xl text-black font-medium hover:opacity-90 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Use This Listing Data
            </button>
          </div>
        )}

        <p className="text-xs text-white/30 mt-4 text-center">
          Powered by MLS data &bull; Photos will be imported for AI enhancement
        </p>
      </div>
    </div>
  );
}
