'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import {
  Loader2, ArrowLeft, Plus, Trash2, Star, ChevronUp, ChevronDown,
  ArrowDownToLine, X, Edit, Check, GripVertical
} from 'lucide-react';

interface PortfolioItem {
  id: string;
  portfolio_id: string;
  before_url: string;
  after_url: string;
  title: string | null;
  description: string | null;
  enhancement_type: string | null;
  room_type: string | null;
  client_name: string | null;
  client_testimonial: string | null;
  tags: string[];
  is_featured: boolean;
  display_order: number;
}

interface Portfolio {
  id: string;
  title: string;
  slug: string;
}

interface ListingPhoto {
  id: string;
  listing_id: string;
  raw_url: string;
  processed_url: string | null;
  variant: string | null;
  listing_address?: string;
}

export default function PortfolioItemsPage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Add item modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    beforeUrl: '',
    afterUrl: '',
    title: '',
    description: '',
    enhancementType: '',
    roomType: '',
    tags: '',
    isFeatured: false,
  });
  const [adding, setAdding] = useState(false);

  // Import from listings
  const [showImportModal, setShowImportModal] = useState(false);
  const [listingPhotos, setListingPhotos] = useState<ListingPhoto[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [importLoading, setImportLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // Edit item
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const fetchItems = useCallback(async () => {
    try {
      const [portfolioRes, itemsRes] = await Promise.all([
        fetch(`/api/portfolio?id=${portfolioId}`, { signal: AbortSignal.timeout(15000) }),
        fetch(`/api/portfolio/items?portfolioId=${portfolioId}`, { signal: AbortSignal.timeout(15000) }),
      ]);

      if (!portfolioRes.ok) {
        setError('Portfolio not found');
        return;
      }

      const portfolioData = await portfolioRes.json();
      const itemsData = await itemsRes.json();

      setPortfolio(portfolioData);
      setItems(itemsData);
    } catch {
      setError('Failed to load portfolio items');
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      fetchItems();
    }
    init();
  }, [fetchItems, router]);

  const handleAddItem = async () => {
    if (!addForm.beforeUrl || !addForm.afterUrl) {
      setError('Before and After URLs are required');
      return;
    }

    setAdding(true);
    setError(null);

    try {
      const response = await fetch('/api/portfolio/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId,
          beforeUrl: addForm.beforeUrl,
          afterUrl: addForm.afterUrl,
          title: addForm.title || null,
          description: addForm.description || null,
          enhancementType: addForm.enhancementType || null,
          roomType: addForm.roomType || null,
          tags: addForm.tags ? addForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
          isFeatured: addForm.isFeatured,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      const data = await response.json();
      setItems(prev => [...prev, data.item]);
      setShowAddModal(false);
      setAddForm({ beforeUrl: '', afterUrl: '', title: '', description: '', enhancementType: '', roomType: '', tags: '', isFeatured: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add item';
      setError(message);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this item?')) return;

    try {
      const response = await fetch(`/api/portfolio/items?id=${itemId}&portfolioId=${portfolioId}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) throw new Error('Failed to delete');

      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch {
      setError('Failed to delete item');
    }
  };

  const handleToggleFeatured = async (item: PortfolioItem) => {
    try {
      const response = await fetch('/api/portfolio/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          portfolioId,
          isFeatured: !item.is_featured,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) throw new Error('Failed to update');

      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, is_featured: !i.is_featured } : i
      ));
    } catch {
      setError('Failed to update item');
    }
  };

  const handleMoveItem = async (item: PortfolioItem, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(i => i.id === item.id);
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (swapIndex < 0 || swapIndex >= items.length) return;

    const swapItem = items[swapIndex];

    // Swap display_order values
    try {
      await Promise.all([
        fetch('/api/portfolio/items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id, portfolioId, displayOrder: swapItem.display_order }),
          signal: AbortSignal.timeout(15000),
        }),
        fetch('/api/portfolio/items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: swapItem.id, portfolioId, displayOrder: item.display_order }),
          signal: AbortSignal.timeout(15000),
        }),
      ]);

      // Swap in local state
      const newItems = [...items];
      newItems[currentIndex] = { ...swapItem, display_order: item.display_order };
      newItems[swapIndex] = { ...item, display_order: swapItem.display_order };
      setItems(newItems);
    } catch {
      setError('Failed to reorder items');
    }
  };

  const handleInlineEdit = async (item: PortfolioItem) => {
    if (editingId === item.id) {
      // Save
      try {
        await fetch('/api/portfolio/items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id, portfolioId, title: editTitle || null }),
          signal: AbortSignal.timeout(15000),
        });

        setItems(prev => prev.map(i =>
          i.id === item.id ? { ...i, title: editTitle || null } : i
        ));
        setEditingId(null);
      } catch {
        setError('Failed to update item');
      }
    } else {
      setEditingId(item.id);
      setEditTitle(item.title ?? '');
    }
  };

  const handleImportFromListings = async () => {
    setImportLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: photos } = await supabase
        .from('photos')
        .select('id, listing_id, raw_url, processed_url, variant, listings!inner(address)')
        .eq('listings.user_id', user.id)
        .not('processed_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (photos) {
        const mapped: ListingPhoto[] = photos.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          listing_id: p.listing_id as string,
          raw_url: p.raw_url as string,
          processed_url: p.processed_url as string | null,
          variant: p.variant as string | null,
          listing_address: (p.listings as Record<string, unknown>)?.address as string | undefined,
        }));
        setListingPhotos(mapped);
      }

      setShowImportModal(true);
    } catch {
      setError('Failed to load listing photos');
    } finally {
      setImportLoading(false);
    }
  };

  const handleBulkImport = async () => {
    if (selectedPhotos.size === 0) return;

    setImporting(true);
    setError(null);

    try {
      const importItems = listingPhotos
        .filter(p => selectedPhotos.has(p.id))
        .map(p => ({
          beforeUrl: p.raw_url,
          afterUrl: p.processed_url ?? p.raw_url,
          title: p.listing_address ?? 'Imported Photo',
          enhancementType: p.variant ?? 'enhanced',
        }));

      const response = await fetch('/api/portfolio/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioId, items: importItems }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) throw new Error('Failed to import');

      const data = await response.json();
      setItems(prev => [...prev, ...(data.items || [])]);
      setShowImportModal(false);
      setSelectedPhotos(new Set());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Import failed';
      setError(message);
    } finally {
      setImporting(false);
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/portfolio" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{portfolio?.title ?? 'Portfolio'} — Items</h1>
              <p className="text-sm text-white/40">{items.length} item{items.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleImportFromListings}
              disabled={importLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              {importLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
              Import from Listings
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#D4A017] text-black rounded-lg text-sm font-semibold hover:bg-[#D4A017]/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
              <GripVertical className="w-8 h-8 text-white/20" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No items yet</h2>
            <p className="text-white/40 mb-6">Add before/after photos to showcase your work</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleImportFromListings}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
              >
                <ArrowDownToLine className="w-4 h-4" />
                Import from Listings
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#D4A017] text-black rounded-lg text-sm font-semibold hover:bg-[#D4A017]/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Manually
              </button>
            </div>
          </div>
        )}

        {/* Items Grid */}
        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 bg-[#1A1A1A] border border-white/10 rounded-lg hover:border-white/20 transition-colors"
              >
                {/* Order controls */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveItem(item, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-white/10 rounded disabled:opacity-20 transition-colors"
                    aria-label="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveItem(item, 'down')}
                    disabled={index === items.length - 1}
                    className="p-1 hover:bg-white/10 rounded disabled:opacity-20 transition-colors"
                    aria-label="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Before/After thumbnails */}
                <div className="flex gap-2 flex-shrink-0">
                  <div className="relative w-20 h-16 rounded overflow-hidden bg-white/5">
                    <Image src={item.before_url} alt="Before" fill className="object-cover" sizes="80px" />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-center py-0.5">Before</span>
                  </div>
                  <div className="relative w-20 h-16 rounded overflow-hidden bg-white/5">
                    <Image src={item.after_url} alt="After" fill className="object-cover" sizes="80px" />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-center py-0.5">After</span>
                  </div>
                </div>

                {/* Item info */}
                <div className="flex-1 min-w-0">
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-sm text-white focus:outline-none focus:border-[#D4A017]/50"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleInlineEdit(item); if (e.key === 'Escape') setEditingId(null); }}
                      aria-label="Edit item title"
                    />
                  ) : (
                    <p className="text-sm font-medium truncate">{item.title ?? 'Untitled'}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {item.enhancement_type && (
                      <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/50">{item.enhancement_type}</span>
                    )}
                    {item.room_type && (
                      <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/50">{item.room_type}</span>
                    )}
                    {item.tags.length > 0 && (
                      <span className="text-xs text-white/30">{item.tags.length} tag{item.tags.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggleFeatured(item)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.is_featured ? 'text-[#D4A017] bg-[#D4A017]/10' : 'text-white/30 hover:bg-white/10'
                    }`}
                    title={item.is_featured ? 'Remove from featured' : 'Mark as featured'}
                    aria-label={item.is_featured ? 'Remove from featured' : 'Mark as featured'}
                  >
                    <Star className="w-4 h-4" fill={item.is_featured ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => handleInlineEdit(item)}
                    className="p-2 text-white/30 hover:bg-white/10 rounded-lg transition-colors"
                    title="Edit title"
                    aria-label="Edit title"
                  >
                    {editingId === item.id ? <Check className="w-4 h-4 text-green-400" /> : <Edit className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-red-400/50 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete item"
                    aria-label="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAddModal(false)}>
          <div
            className="bg-[#1A1A1A] border border-white/10 rounded-xl w-full max-w-lg mx-4 p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Add portfolio item"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Add Portfolio Item</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-white/10 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Before URL *</label>
                <input
                  type="url"
                  value={addForm.beforeUrl}
                  onChange={(e) => setAddForm(prev => ({ ...prev, beforeUrl: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A017]/50"
                  placeholder="https://..."
                  aria-label="Before image URL"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">After URL *</label>
                <input
                  type="url"
                  value={addForm.afterUrl}
                  onChange={(e) => setAddForm(prev => ({ ...prev, afterUrl: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A017]/50"
                  placeholder="https://..."
                  aria-label="After image URL"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Title</label>
                <input
                  type="text"
                  value={addForm.title}
                  onChange={(e) => setAddForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A017]/50"
                  placeholder="Living Room Staging"
                  aria-label="Item title"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Description</label>
                <textarea
                  value={addForm.description}
                  onChange={(e) => setAddForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white resize-none focus:outline-none focus:border-[#D4A017]/50"
                  aria-label="Item description"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Enhancement Type</label>
                  <input
                    type="text"
                    value={addForm.enhancementType}
                    onChange={(e) => setAddForm(prev => ({ ...prev, enhancementType: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A017]/50"
                    placeholder="virtual-staging"
                    aria-label="Enhancement type"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Room Type</label>
                  <input
                    type="text"
                    value={addForm.roomType}
                    onChange={(e) => setAddForm(prev => ({ ...prev, roomType: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A017]/50"
                    placeholder="living-room"
                    aria-label="Room type"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={addForm.tags}
                  onChange={(e) => setAddForm(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#D4A017]/50"
                  placeholder="luxury, modern, staging"
                  aria-label="Tags"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addForm.isFeatured}
                  onChange={(e) => setAddForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  className="rounded border-white/20"
                />
                <span className="text-sm text-white/70">Featured item</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={adding || !addForm.beforeUrl || !addForm.afterUrl}
                className="flex items-center gap-2 px-4 py-2 bg-[#D4A017] text-black rounded-lg text-sm font-semibold hover:bg-[#D4A017]/90 transition-colors disabled:opacity-50"
              >
                {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import from Listings Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowImportModal(false)}>
          <div
            className="bg-[#1A1A1A] border border-white/10 rounded-xl w-full max-w-3xl mx-4 p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Import photos from listings"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Import from Listings</h2>
                <p className="text-sm text-white/40">Select enhanced photos to add to your portfolio</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-1 hover:bg-white/10 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {listingPhotos.length === 0 ? (
              <p className="text-center py-10 text-white/40">No enhanced photos found in your listings</p>
            ) : (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
                  {listingPhotos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => togglePhotoSelection(photo.id)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedPhotos.has(photo.id)
                          ? 'border-[#D4A017]'
                          : 'border-transparent hover:border-white/20'
                      }`}
                    >
                      <Image
                        src={photo.processed_url ?? photo.raw_url}
                        alt={photo.listing_address ?? 'Photo'}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                      {selectedPhotos.has(photo.id) && (
                        <div className="absolute top-1 right-1 w-6 h-6 bg-[#D4A017] rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-black" />
                        </div>
                      )}
                      {photo.listing_address && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                          <p className="text-[10px] text-white truncate">{photo.listing_address}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/40">
                    {selectedPhotos.size} photo{selectedPhotos.size !== 1 ? 's' : ''} selected
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowImportModal(false)}
                      className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkImport}
                      disabled={importing || selectedPhotos.size === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-[#D4A017] text-black rounded-lg text-sm font-semibold hover:bg-[#D4A017]/90 transition-colors disabled:opacity-50"
                    >
                      {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                      Import {selectedPhotos.size} Photo{selectedPhotos.size !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
