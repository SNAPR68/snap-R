'use client';

import React, { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Loader2, Home, ChevronRight, Upload, Sparkles, Download,
  Check, X, Image, Eye, Clock, DollarSign, Share2, Lightbulb,
  Plus, Trash2, GripVertical, Play, Pause, Settings, Globe,
  Link2, Copy, ExternalLink, RotateCcw, Compass, Music,
  Maximize2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Camera, Video, MapPin, Info, Edit, ChevronDown
} from 'lucide-react';
import Link from 'next/link';

interface Tour {
  id: string;
  name: string;
  description?: string;
  slug: string;
  status: string;
  is_public: boolean;
  view_count: number;
  cover_image_url?: string;
  created_at: string;
  tour_scenes?: Scene[];
}

interface Scene {
  id: string;
  name: string;
  image_url: string;
  thumbnail_url?: string;
  is_360: boolean;
  sort_order: number;
  is_start_scene: boolean;
  floor_name?: string;
}

interface Listing {
  id: string;
  title: string;
  address?: string;
  thumbnail?: string | null;
  photoCount: number;
}

// Tour Card Component
function TourCard({ tour, onView, onEdit, onDelete }: { 
  tour: Tour; 
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const tourUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/tour/${tour.slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(tourUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all">
      {/* Cover Image */}
      <div className="aspect-video bg-white/5 relative">
        {tour.cover_image_url || tour.tour_scenes?.[0]?.image_url ? (
          <img
            src={tour.cover_image_url || tour.tour_scenes?.[0]?.image_url}
            alt={tour.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-12 h-12 text-white/20" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium ${
          tour.status === 'published' && tour.is_public
            ? 'bg-green-500/20 text-green-400'
            : 'bg-amber-500/20 text-amber-400'
        }`}>
          {tour.status === 'published' && tour.is_public ? 'Live' : 'Draft'}
        </div>

        {/* Scene Count */}
        <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 rounded text-xs">
          {tour.tour_scenes?.length || 0} scenes
        </div>

        {/* Play Button Overlay */}
        <button
          onClick={onView}
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium truncate mb-1">{tour.name}</h3>
        
        <div className="flex items-center gap-4 text-sm text-white/50 mb-4">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {tour.view_count}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {new Date(tour.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-sm"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Link2 className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={onEdit}
            className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-white/5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Tour Creator Component
function TourCreator({
  listingId,
  listingTitle,
  photoUrls,
  onBack,
  onComplete,
}: {
  listingId?: string;
  listingTitle?: string;
  photoUrls: { url: string; id: string }[];
  onBack: () => void;
  onComplete: (tour: Tour) => void;
}) {
  const [step, setStep] = useState(0);
  const [tourName, setTourName] = useState(listingTitle || 'Virtual Tour');
  const [tourType, setTourType] = useState<'regular' | '360'>('regular');
  const [selectedPhotos, setSelectedPhotos] = useState<{ url: string; id: string; name: string; file?: File }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [settings, setSettings] = useState({
    autoRotate: true,
    showCompass: true,
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const togglePhoto = (photo: { url: string; id: string }) => {
    const exists = selectedPhotos.find(p => p.id === photo.id);
    if (exists) {
      setSelectedPhotos(selectedPhotos.filter(p => p.id !== photo.id));
    } else {
      setSelectedPhotos([...selectedPhotos, { ...photo, name: `Scene ${selectedPhotos.length + 1}` }]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const uploadedUrls: { url: string; id: string; name: string; file: File }[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));

        // Upload to Supabase storage
        const fileName = `tour-photos/${user.id}/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('tour-photos')
          .upload(fileName, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        // Get signed URL
        const { data: urlData } = await supabase.storage
          .from('tour-photos')
          .createSignedUrl(fileName, 3600 * 24 * 365); // 1 year expiry

        if (urlData?.signedUrl) {
          uploadedUrls.push({
            url: urlData.signedUrl,
            id: `uploaded-${Date.now()}-${i}`,
            name: `Scene ${selectedPhotos.length + uploadedUrls.length + 1}`,
            file,
          });
        }
      }

      setSelectedPhotos([...selectedPhotos, ...uploadedUrls]);
      setUploadProgress(0);
    } catch (err: any) {
      setError(err.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (id: string) => {
    setSelectedPhotos(selectedPhotos.filter(p => p.id !== id));
  };

  const handleSelectFromListing = () => {
    // This will show the photo selection grid
    setStep(1);
  };

  const updateSceneName = (id: string, name: string) => {
    setSelectedPhotos(selectedPhotos.map(p => p.id === id ? { ...p, name } : p));
  };

  const moveScene = (index: number, direction: 'up' | 'down') => {
    const newPhotos = [...selectedPhotos];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newPhotos.length) return;
    [newPhotos[index], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[index]];
    setSelectedPhotos(newPhotos);
  };

  const handleCreate = async () => {
    if (selectedPhotos.length === 0) {
      setError('Please select at least one photo');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/virtual-tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          listingId,
          name: tourName,
          tourType: tourType === '360' ? '360' : 'regular',
          settings: {
            autoRotate: settings.autoRotate,
            showCompass: settings.showCompass,
          },
          scenes: selectedPhotos.map((photo, index) => ({
            name: photo.name,
            imageUrl: photo.url,
            is360: tourType === '360',
            sortOrder: index,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tour');
      }

      onComplete(data.tour);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
              <Camera className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Create Virtual Tour</h1>
              <p className="text-white/50">{listingTitle || 'New Tour'}</p>
            </div>
          </div>
          <button onClick={onBack} className="text-white/50 hover:text-white transition-colors">
            ← Back
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  step >= s ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/40'
                }`}
              >
                {s === 0 ? 'Type' : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 rounded ${step > s ? 'bg-purple-500' : 'bg-white/10'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 0: Tour Type Selection */}
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Choose Tour Type</h2>
            <p className="text-white/50 mb-6">Select the type of virtual tour you want to create</p>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <button
                onClick={() => {
                  setTourType('regular');
                  setStep(1);
                }}
                className={`p-6 border-2 rounded-xl transition-all text-left ${
                  tourType === 'regular'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    tourType === 'regular' ? 'bg-purple-500' : 'bg-white/10'
                  }`}>
                    <Image className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">Regular Photo Tour</h3>
                </div>
                <p className="text-white/60 text-sm">Use your existing listing photos</p>
              </button>

              <button
                onClick={() => {
                  setTourType('360');
                  setStep(1);
                }}
                className={`p-6 border-2 rounded-xl transition-all text-left ${
                  tourType === '360'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    tourType === '360' ? 'bg-purple-500' : 'bg-white/10'
                  }`}>
                    <Compass className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">360° Panoramic Tour</h3>
                </div>
                <p className="text-white/60 text-sm">Upload panoramic photos from 360° camera (Ricoh Theta, Insta360, etc.)</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Select Photos */}
        {step === 1 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold mb-2">Step 1: Select Photos</h2>
                <p className="text-white/50">
                  {tourType === 'regular' 
                    ? 'Choose photos from your listing or upload new ones'
                    : 'Upload 360° panoramic photos'}
                </p>
              </div>
              <button onClick={() => setStep(0)} className="text-purple-400 hover:underline text-sm">
                Change type
              </button>
            </div>

            {/* Photo Selection Options */}
            <div className="mb-6 space-y-4">
              {tourType === 'regular' ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {photoUrls.length > 0 && (
                    <button
                      onClick={handleSelectFromListing}
                      className="p-6 border-2 border-dashed border-white/20 rounded-xl hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-center"
                    >
                      <Image className="w-10 h-10 text-white/30 mx-auto mb-3" />
                      <div className="font-medium">Select from Listing</div>
                      <div className="text-sm text-white/40 mt-1">{photoUrls.length} photos available</div>
                    </button>
                  )}
                  <label className="p-6 border-2 border-dashed border-white/20 rounded-xl hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-center cursor-pointer">
                    <Upload className="w-10 h-10 text-white/30 mx-auto mb-3" />
                    <div className="font-medium">Upload New Photos</div>
                    <div className="text-sm text-white/40 mt-1">Select multiple images</div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="block p-6 border-2 border-dashed border-white/20 rounded-xl hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-center cursor-pointer">
                  <Upload className="w-10 h-10 text-white/30 mx-auto mb-3" />
                  <div className="font-medium">Upload 360° Photos</div>
                  <div className="text-sm text-white/40 mt-1">Select panoramic images from your 360° camera</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70">Uploading photos...</span>
                    <span className="text-sm text-purple-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Selected Photos Grid */}
              {selectedPhotos.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3 text-white/70">Selected Photos ({selectedPhotos.length})</h3>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {selectedPhotos.map((photo, index) => (
                      <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border-2 border-purple-500 ring-2 ring-purple-500/50">
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <button
                          onClick={() => removePhoto(photo.id)}
                          className="absolute top-1 right-1 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Listing Photos Grid (only show if regular type and photos available) */}
              {tourType === 'regular' && photoUrls.length > 0 && selectedPhotos.length === 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3 text-white/70">Listing Photos</h3>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {photoUrls.map((photo, index) => {
                      const isSelected = selectedPhotos.find(p => p.id === photo.id);
                      const selectionIndex = selectedPhotos.findIndex(p => p.id === photo.id);
                      
                      return (
                        <button
                          key={photo.id}
                          onClick={() => togglePhoto(photo)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            isSelected
                              ? 'border-purple-500 ring-2 ring-purple-500/50'
                              : 'border-transparent hover:border-white/30'
                          }`}
                        >
                          <img
                            src={photo.url}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center font-bold">
                                {selectionIndex + 1}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/50">{selectedPhotos.length} photos selected</span>
              <button
                onClick={() => setStep(2)}
                disabled={selectedPhotos.length === 0 || uploading}
                className="px-6 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Arrange Scenes */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Step 2: Arrange Scenes</h2>
                <p className="text-white/50">Name and order your tour scenes</p>
              </div>
              <button onClick={() => setStep(1)} className="text-purple-400 hover:underline text-sm">
                Change photos
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {selectedPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveScene(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveScene(index, 'down')}
                      disabled={index === selectedPhotos.length - 1}
                      className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-20 h-14 rounded-lg overflow-hidden bg-white/10">
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={photo.name}
                      onChange={(e) => updateSceneName(photo.id, e.target.value)}
                      placeholder="Scene name"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-white/50">
                    {index === 0 && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                        Start
                      </span>
                    )}
                    <span>#{index + 1}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full py-4 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-400 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3: Settings & Create */}
        {step === 3 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Step 3: Tour Settings</h2>
                <p className="text-white/50">Configure your virtual tour</p>
              </div>
              <button onClick={() => setStep(2)} className="text-purple-400 hover:underline text-sm">
                Edit scenes
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Tour Info */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-4">Tour Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Tour Name</label>
                    <input
                      type="text"
                      value={tourName}
                      onChange={(e) => setTourName(e.target.value)}
                      placeholder="My Virtual Tour"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-4">Viewer Settings</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <RotateCcw className="w-5 h-5 text-white/50" />
                      <span>Auto-rotate</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoRotate}
                      onChange={(e) => setSettings({ ...settings, autoRotate: e.target.checked })}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Compass className="w-5 h-5 text-white/50" />
                      <span>Show compass</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showCompass}
                      onChange={(e) => setSettings({ ...settings, showCompass: e.target.checked })}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 mb-6">
              <h3 className="font-bold mb-4">Tour Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-400">{selectedPhotos.length}</div>
                  <div className="text-sm text-white/50">Scenes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">$25</div>
                  <div className="text-sm text-white/50">Price</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">5</div>
                  <div className="text-sm text-white/50">Credits</div>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6 text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={processing}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-400 hover:to-pink-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Tour...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create Virtual Tour
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Tour Success View
function TourSuccess({ tour, onBack }: { tour: Tour; onBack: () => void }) {
  const [copied, setCopied] = useState(false);
  const tourUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/tour/${tour.slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(tourUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const publishTour = async () => {
    await fetch('/api/virtual-tours', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: tour.id,
        status: 'published',
        isPublic: true,
      }),
    });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <Check className="w-10 h-10 text-green-400" />
        </div>

        <h1 className="text-3xl font-bold mb-2">Tour Created!</h1>
        <p className="text-white/50 mb-8">Your virtual tour is ready. Share it with the world!</p>

        {/* Preview */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-6">
          {tour.tour_scenes?.[0]?.image_url && (
            <img
              src={tour.tour_scenes[0].image_url}
              alt={tour.name}
              className="w-full aspect-video object-cover"
            />
          )}
          <div className="p-6">
            <h2 className="text-xl font-bold mb-2">{tour.name}</h2>
            <p className="text-white/50">{tour.tour_scenes?.length || 0} scenes</p>
          </div>
        </div>

        {/* Share Link */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <label className="block text-sm text-white/60 mb-2">Tour Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tourUrl}
              readOnly
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
            />
            <button
              onClick={copyLink}
              className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-400 transition-colors flex items-center gap-2"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors"
          >
            Create Another
          </button>
          <Link
            href={`/tour/${tour.slug}`}
            target="_blank"
            className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-400 transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            View Tour
          </Link>
        </div>

        {tour.status !== 'published' && (
          <button
            onClick={publishTour}
            className="w-full mt-4 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-400 transition-colors flex items-center justify-center gap-2"
          >
            <Globe className="w-5 h-5" />
            Publish Tour
          </button>
        )}
      </div>
    </div>
  );
}

// Listing Selector
function ListingSelector({ 
  onSelect, 
  onUpload,
  existingTours,
}: { 
  onSelect: (listing: any, photos: { url: string; id: string }[]) => void; 
  onUpload: () => void;
  existingTours: Tour[];
}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('listings')
      .select('*, photos(id, raw_url, processed_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      const withThumbnails = await Promise.all(
        data.map(async (listing: any) => {
          const photos = listing.photos || [];
          const firstPhoto = photos[0];
          let thumbnail = null;
          if (firstPhoto) {
            const path = firstPhoto.processed_url || firstPhoto.raw_url;
            if (path && !path.startsWith('http')) {
              const { data: urlData } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600);
              thumbnail = urlData?.signedUrl;
            }
          }
          return { id: listing.id, title: listing.title, address: listing.address, thumbnail, photoCount: photos.length };
        })
      );
      setListings(withThumbnails);
    }
    setLoading(false);
  };

  const handleSelectListing = async (listing: Listing) => {
    const supabase = createClient();
    const { data: photos } = await supabase
      .from('photos')
      .select('*')
      .eq('listing_id', listing.id)
      .order('created_at', { ascending: true });

    const urls = await Promise.all(
      (photos || []).map(async (photo) => {
        const path = photo.processed_url || photo.raw_url;
        const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600);
        return { url: data?.signedUrl || '', id: photo.id };
      })
    );

    onSelect(listing, urls.filter(u => u.url));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
            <Camera className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">360° Virtual Tours</h1>
            <p className="text-white/50">Interactive property walkthroughs</p>
          </div>
        </div>

        {/* What this does */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-purple-400 mb-1">What Virtual Tours do</h3>
              <p className="text-sm text-white/70">
                Create immersive 360° walkthroughs of your properties. Buyers can explore every room 
                from their phone or computer. Tours increase engagement by 40% and generate more inquiries.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">$25</div>
            <div className="text-sm text-white/50">Per tour</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">Instant</div>
            <div className="text-sm text-white/50">Creation</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">Unlimited</div>
            <div className="text-sm text-white/50">Views</div>
          </div>
        </div>

        {/* Existing Tours */}
        {existingTours.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Your Tours</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {existingTours.map((tour) => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  onView={() => window.open(`/tour/${tour.slug}`, '_blank')}
                  onEdit={() => {/* TODO: Edit mode */}}
                  onDelete={async () => {
                    if (confirm('Delete this tour?')) {
                      await fetch(`/api/virtual-tours?id=${tour.id}`, { method: 'DELETE' });
                      window.location.reload();
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Create New Tour */}
        <h2 className="text-lg font-bold mb-4">Create New Tour</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* From Listing */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="font-medium mb-3">From Existing Listing</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {listings.filter(l => l.photoCount > 0).map(listing => (
                <button
                  key={listing.id}
                  onClick={() => handleSelectListing(listing)}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <div className="w-12 h-8 rounded overflow-hidden bg-white/10">
                    {listing.thumbnail ? (
                      <img src={listing.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-4 h-4 text-white/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{listing.title || 'Untitled'}</div>
                    <div className="text-xs text-white/40">{listing.photoCount} photos</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30" />
                </button>
              ))}
            </div>
          </div>

          {/* Upload New */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="font-medium mb-3">Upload 360° Photos</h3>
            <button
              onClick={onUpload}
              className="w-full p-6 border-2 border-dashed border-white/20 rounded-xl hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-center"
            >
              <Upload className="w-10 h-10 text-white/30 mx-auto mb-3" />
              <div className="font-medium">Upload Photos</div>
              <div className="text-sm text-white/40 mt-1">360° panoramas or regular photos</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
function VirtualToursContent() {
  const [existingTours, setExistingTours] = useState<Tour[]>([]);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [photoUrls, setPhotoUrls] = useState<{ url: string; id: string }[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [completedTour, setCompletedTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTours();
  }, []);

  const loadTours = async () => {
    try {
      const response = await fetch('/api/virtual-tours?includeScenes=true');
      if (response.ok) {
        const tours = await response.json();
        setExistingTours(tours);
      }
    } catch (error) {
      console.error('Load tours error:', error);
    }
    setLoading(false);
  };

  const handleSelectListing = (listing: any, photos: { url: string; id: string }[]) => {
    setSelectedListing(listing);
    setPhotoUrls(photos);
    setShowCreator(true);
  };

  const handleUpload = () => {
    // For now, just show creator without listing
    setSelectedListing(null);
    setPhotoUrls([]);
    setShowCreator(true);
  };

  const handleBack = () => {
    setShowCreator(false);
    setCompletedTour(null);
    setSelectedListing(null);
    setPhotoUrls([]);
  };

  const handleComplete = (tour: Tour) => {
    setCompletedTour(tour);
    setShowCreator(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (completedTour) {
    return <TourSuccess tour={completedTour} onBack={handleBack} />;
  }

  if (showCreator) {
    return (
      <TourCreator
        listingId={selectedListing?.id}
        listingTitle={selectedListing?.title}
        photoUrls={photoUrls}
        onBack={handleBack}
        onComplete={handleComplete}
      />
    );
  }

  return (
    <ListingSelector
      onSelect={handleSelectListing}
      onUpload={handleUpload}
      existingTours={existingTours}
    />
  );
}

export default function VirtualToursPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    }>
      <VirtualToursContent />
    </Suspense>
  );
}
