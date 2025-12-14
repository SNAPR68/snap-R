'use client';

import { useState, useRef } from 'react';
import { GripVertical, X, Check, AlertCircle } from 'lucide-react';

interface Photo {
  id: string;
  signedRawUrl: string;
  signedProcessedUrl?: string;
  status: string;
  raw_url: string;
  client_approved?: boolean | null;
}

interface DraggablePhotoStripProps {
  photos: Photo[];
  selectedPhotoId?: string;
  onSelect: (photo: Photo) => void;
  onDelete: (photoId: string, rawUrl: string) => void;
  onReorder: (newOrder: string[]) => void;
  listingStyle?: { brightness: number; contrast: number; saturation: number; warmth: number } | null;
  showApprovalStatus?: boolean;
}

export function DraggablePhotoStrip({
  photos,
  selectedPhotoId,
  onSelect,
  onDelete,
  onReorder,
  listingStyle,
  showApprovalStatus = false
}: DraggablePhotoStripProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getListingStyleFilter = () => {
    if (!listingStyle) return 'none';
    const { brightness, contrast, saturation, warmth } = listingStyle;
    const filters: string[] = [];
    if (brightness !== 0) filters.push(`brightness(${100 + brightness}%)`);
    if (contrast !== 0) filters.push(`contrast(${100 + contrast}%)`);
    if (saturation !== 0) filters.push(`saturate(${100 + saturation}%)`);
    if (warmth > 0) filters.push(`sepia(${warmth * 0.3}%)`);
    else if (warmth < 0) filters.push(`hue-rotate(${warmth * 0.5}deg)`);
    return filters.length > 0 ? filters.join(' ') : 'none';
  };

  const handleDragStart = (e: React.DragEvent, photoId: string) => {
    setDraggedId(photoId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', photoId);
  };

  const handleDragOver = (e: React.DragEvent, photoId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (photoId !== draggedId) {
      setDragOverId(photoId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const currentOrder = photos.map(p => p.id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);

    currentOrder.splice(draggedIndex, 1);
    currentOrder.splice(targetIndex, 0, draggedId);

    onReorder(currentOrder);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // Touch support
  const [touchDragId, setTouchDragId] = useState<string | null>(null);
  
  const handleTouchStart = (photoId: string) => {
    setTouchDragId(photoId);
  };

  const handleTouchEnd = () => {
    setTouchDragId(null);
  };

  return (
    <div 
      ref={containerRef}
      className="flex gap-2 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
    >
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          draggable
          onDragStart={(e) => handleDragStart(e, photo.id)}
          onDragOver={(e) => handleDragOver(e, photo.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, photo.id)}
          onDragEnd={handleDragEnd}
          onTouchStart={() => handleTouchStart(photo.id)}
          onTouchEnd={handleTouchEnd}
          className={`relative flex-shrink-0 group transition-all duration-150 ${
            dragOverId === photo.id ? 'scale-105 ring-2 ring-[#D4A017]' : ''
          } ${draggedId === photo.id ? 'opacity-40 scale-95' : ''} ${
            touchDragId === photo.id ? 'scale-105' : ''
          }`}
        >
          {/* Order badge */}
          <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-gradient-to-br from-[#D4A017] to-[#B8860B] rounded-full flex items-center justify-center z-10 shadow-lg">
            <span className="text-[10px] font-bold text-black">{index + 1}</span>
          </div>
          
          {/* Approval status badge */}
          {showApprovalStatus && photo.client_approved !== undefined && photo.client_approved !== null && (
            <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center z-10 shadow-lg ${
              photo.client_approved ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {photo.client_approved ? (
                <Check className="w-3 h-3 text-white" />
              ) : (
                <AlertCircle className="w-3 h-3 text-white" />
              )}
            </div>
          )}
          
          {/* Drag handle - visible on hover */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-1">
              <GripVertical className="w-4 h-4 text-white" />
            </div>
          </div>

          <button
            onClick={() => onSelect(photo)}
            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${
              selectedPhotoId === photo.id 
                ? 'border-[#D4A017] shadow-lg shadow-[#D4A017]/20' 
                : 'border-transparent hover:border-white/30'
            } ${photo.status === 'completed' ? 'ring-1 ring-green-500/30' : ''}`}
          >
            <img
              src={photo.signedRawUrl}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: getListingStyleFilter() }}
              draggable={false}
            />
            {photo.status === 'completed' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
            )}
          </button>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(photo.id, photo.raw_url);
            }}
            className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full items-center justify-center text-white hidden group-hover:flex z-20 shadow-lg transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
