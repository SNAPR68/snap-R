export default function JobCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-[var(--surface-soft)] rounded w-24"></div>
        <div className="h-6 bg-[var(--surface-soft)] rounded w-20"></div>
        <div className="h-4 bg-[var(--surface-soft)] rounded w-32"></div>
        <div className="h-4 bg-[var(--surface-soft)] rounded w-32"></div>
      </div>
    </div>
  );
}

