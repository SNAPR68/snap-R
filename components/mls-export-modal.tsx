'use client';

import { useState, useEffect } from 'react';
import { X, Download, Loader2, FileArchive, CheckCircle, AlertCircle, Building2 } from 'lucide-react';

interface Photo {
  id: string;
  signedProcessedUrl?: string;
  processed_url?: string;
  variant?: string;
}

interface MlsOption {
  value: string;
  label: string;
  region: string;
}

interface MlsExportModalProps {
  photos: Photo[];
  listingTitle?: string;
  listingAddress?: string;
  onClose: () => void;
}

export function MlsExportModal({ photos, listingTitle, listingAddress, onClose }: MlsExportModalProps) {
  const [mlsOptions, setMlsOptions] = useState<MlsOption[]>([]);
  const [selectedMls, setSelectedMls] = useState('');
  const [agentName, setAgentName] = useState('');
  const [mlsNumber, setMlsNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [result, setResult] = useState<{ success: boolean; downloadUrl?: string; error?: string } | null>(null);

  // Fetch MLS options on mount
  useEffect(() => {
    async function fetchMlsOptions() {
      try {
        const res = await fetch('/api/compliance/export');
        const data = await res.json();
        if (data.mlsOptions) {
          setMlsOptions(data.mlsOptions);
          if (data.mlsOptions.length > 0) {
            setSelectedMls(data.mlsOptions[0].value);
          }
        }
      } catch (err) {
        console.error('Failed to fetch MLS options:', err);
      } finally {
        setLoadingOptions(false);
      }
    }
    fetchMlsOptions();
  }, []);

  const handleExport = async () => {
    if (!selectedMls || photos.length === 0) return;

    setLoading(true);
    setResult(null);

    try {
      const exportPhotos = photos.map((photo, index) => ({
        url: photo.signedProcessedUrl || photo.processed_url,
        toolId: photo.variant || 'auto-enhance',
        filename: `photo-${index + 1}.jpg`,
      }));

      const res = await fetch('/api/compliance/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mlsId: selectedMls,
          photos: exportPhotos,
          listingAddress: listingAddress || listingTitle || 'Property Listing',
          mlsNumber,
          agentName,
        }),
      });

      const data = await res.json();

      if (data.success && data.downloadUrl) {
        setResult({ success: true, downloadUrl: data.downloadUrl });
      } else {
        setResult({ success: false, error: data.error || 'Export failed' });
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result?.downloadUrl) {
      const a = document.createElement('a');
      a.href = result.downloadUrl;
      a.download = `mls-export-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#1A1A1A] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#D4A017] to-[#B8860B] rounded-xl flex items-center justify-center">
              <FileArchive className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold">MLS Export Package</h2>
              <p className="text-white/50 text-sm">{photos.length} photos ready</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* MLS Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Target MLS</label>
            {loadingOptions ? (
              <div className="flex items-center gap-2 text-white/50">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading MLS options...
              </div>
            ) : (
              <select
                value={selectedMls}
                onChange={(e) => setSelectedMls(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#D4A017] focus:outline-none"
              >
                {mlsOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-[#1A1A1A]">
                    {option.label} ({option.region})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Agent Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Agent Name (optional)</label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#D4A017] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">MLS # (optional)</label>
              <input
                type="text"
                value={mlsNumber}
                onChange={(e) => setMlsNumber(e.target.value)}
                placeholder="123456789"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#D4A017] focus:outline-none"
              />
            </div>
          </div>

          {/* What's Included */}
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-sm font-medium mb-3">Package Includes:</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                {photos.length} photos with watermarks (where required)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                RESO-compliant metadata embedded
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Disclosure document (DISCLOSURE.txt)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Photo descriptions CSV for MLS upload
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                XMP metadata sidecars
              </li>
            </ul>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-xl p-4 ${result.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              {result.success ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="font-medium text-green-400">Export Ready!</p>
                    <p className="text-sm text-white/70">Your MLS-compliant package is ready to download.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  <div>
                    <p className="font-medium text-red-400">Export Failed</p>
                    <p className="text-sm text-white/70">{result.error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          {result?.success ? (
            <button
              onClick={handleDownload}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download ZIP Package
            </button>
          ) : (
            <button
              onClick={handleExport}
              disabled={loading || !selectedMls || photos.length === 0}
              className="w-full py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Package...
                </>
              ) : (
                <>
                  <FileArchive className="w-5 h-5" />
                  Generate MLS Package
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
