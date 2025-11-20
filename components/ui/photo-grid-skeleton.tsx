export default function PhotoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
      {[1, 2].map((i) => (
        <div key={i} className="card animate-pulse">
          <div className="relative w-full h-[250px] md:h-[350px] bg-[var(--surface-soft)] rounded-xl"></div>
        </div>
      ))}
    </div>
  );
}

