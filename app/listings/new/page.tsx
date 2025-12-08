'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Loader2, X, Image } from 'lucide-react';

export default function NewListingPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = useCallback((incoming: FileList) => {
    const arr = Array.from(incoming).filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...arr]);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please enter a listing title');
      return;
    }
    if (files.length === 0) {
      setError('Please upload at least one photo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create listing
      const listingRes = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, address, description }),
      });

      if (!listingRes.ok) throw new Error('Failed to create listing');
      const listing = await listingRes.json();

      // Upload photos
      const formData = new FormData();
      formData.append('listingId', listing.id);
      files.forEach(file => formData.append('files', file));

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload photos');

      // Redirect to studio
      router.push(`/dashboard/studio?id=${listing.id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <header className="h-16 bg-[#1A1A1A] border-b border-white/10 flex items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Create New Listing</h1>
        <p className="text-white/50 mb-8">Add your property details and upload photos to enhance</p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Listing Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 123 Main Street"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#D4A017] transition-all"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full property address"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#D4A017] transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the property"
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#D4A017] transition-all resize-none"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Photos *</label>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                dragActive ? 'border-[#D4A017] bg-[#D4A017]/5' : 'border-white/20 hover:border-white/40'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="w-12 h-12 text-[#D4A017] mx-auto mb-4" />
              <p className="text-lg mb-2">Drag & drop your photos here</p>
              <p className="text-white/50 text-sm">or click to browse</p>
              <input
                id="file-input"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </div>

            {/* Preview */}
            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {files.map((file, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-white/5">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-500 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {files.length > 0 && (
              <p className="mt-2 text-sm text-white/50">{files.length} photo(s) selected</p>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Listing...
              </>
            ) : (
              <>
                <Image className="w-5 h-5" />
                Create & Open in Studio
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
