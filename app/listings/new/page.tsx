'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Upload, Loader2, X, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function NewListingPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(f => 
      ['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(f.type)
    );
    
    setFiles(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (files.length === 0) {
      setError('Please upload at least one photo');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Auth check:', { user: user?.id, authError });
      if (!user) throw new Error('Not authenticated');

      // 1. Create listing first
      console.log('Creating listing...');
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          title: title.trim(),
          address: address.trim() || null,
          description: description.trim() || null,
          status: 'active',
        })
        .select('id')
        .single();

      console.log('Listing result:', { listing, listingError });
      if (listingError) throw new Error(`Listing error: ${listingError.message}`);

      // 2. Upload photos directly to Supabase Storage
      const uploadedPhotos = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${user.id}/${listing.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        console.log(`Uploading file ${i + 1}/${files.length}: ${fileName}`);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('raw-images')
          .upload(fileName, file, {
            contentType: file.type,
            upsert: false,
          });

        console.log('Upload result:', { uploadData, uploadError });
        
        if (uploadError) {
          console.error(`Storage upload failed:`, uploadError);
          setError(`Storage error: ${uploadError.message}`);
          continue;
        }

        // 3. Create photo record
        console.log('Creating photo record...');
        const { data: photo, error: photoError } = await supabase
          .from('photos')
          .insert({
            listing_id: listing.id,
            user_id: user.id,
            raw_url: uploadData.path,
            status: 'pending',
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
          })
          .select('id')
          .single();

        console.log('Photo record result:', { photo, photoError });

        if (photoError) {
          console.error(`Photo record failed:`, photoError);
          setError(`Photo record error: ${photoError.message}`);
          continue;
        }

        if (photo) {
          uploadedPhotos.push(photo);
        }

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      console.log('Total uploaded:', uploadedPhotos.length);

      if (uploadedPhotos.length === 0) {
        throw new Error('Failed to upload any photos');
      }

      router.push(`/dashboard/studio?id=${listing.id}`);

    } catch (err: any) {
      console.error('Full error:', err);
      setError(err.message || 'Failed to create listing');
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Create New Listing</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Listing Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 123 Main Street"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4A017]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full property address"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4A017]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Property description (optional)"
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4A017] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Photos *</label>
            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-[#D4A017]/50 transition-colors">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/heic"
                onChange={handleFileChange}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/70 mb-2">Drag & drop your photos here</p>
                <p className="text-white/40 text-sm">or click to browse (JPEG, PNG, WebP, HEIC)</p>
              </label>
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-4">
                {previews.map((preview, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-white/5">
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 p-1 bg-black/70 rounded-full hover:bg-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {files.length > 0 && (
              <p className="text-sm text-white/50 mt-2">{files.length} photo{files.length > 1 ? 's' : ''} selected</p>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading... {uploadProgress}%
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5" />
                Create Listing & Upload Photos
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
