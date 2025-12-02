'use client';

export function GoldFrame() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4A017]/80 via-[#FFD700] to-[#D4A017]/80" />
      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4A017]/80 via-[#FFD700] to-[#D4A017]/80" />
      {/* Left border */}
      <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-[#D4A017]/80 via-[#FFD700] to-[#D4A017]/80" />
      {/* Right border */}
      <div className="absolute top-0 bottom-0 right-0 w-1 bg-gradient-to-b from-[#D4A017]/80 via-[#FFD700] to-[#D4A017]/80" />
      {/* Corner accents - larger and brighter */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#FFD700]" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#FFD700]" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#FFD700]" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#FFD700]" />
    </div>
  );
}
