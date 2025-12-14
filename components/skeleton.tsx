'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = '', variant = 'rectangular', width, height }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-white/10';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : '100%'),
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

export function PhotoSkeleton() {
  return (
    <div className="w-16 h-16 rounded-lg overflow-hidden">
      <Skeleton className="w-full h-full" />
    </div>
  );
}

export function PhotoGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-2 overflow-x-auto py-1">
      {Array.from({ length: count }).map((_, i) => (
        <PhotoSkeleton key={i} />
      ))}
    </div>
  );
}

export function EnhancedPhotoSkeleton() {
  return (
    <div className="bg-[#0F0F0F] rounded-lg overflow-hidden border border-white/10">
      <Skeleton className="aspect-video" />
      <div className="p-2">
        <Skeleton variant="text" width="60%" height={12} />
      </div>
    </div>
  );
}
