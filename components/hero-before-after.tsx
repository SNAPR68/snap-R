'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'

export function HeroBeforeAfter() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = (x / rect.width) * 100
    setPosition(Math.max(2, Math.min(98, pct)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    updatePosition(e.clientX)
  }, [updatePosition])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    updatePosition(e.clientX)
  }, [isDragging, updatePosition])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    updatePosition(e.touches[0].clientX)
  }, [updatePosition])

  return (
    <div className="max-w-3xl mx-auto mt-8 mb-2">
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden cursor-ew-resize select-none bg-neutral-900 shadow-2xl shadow-black/50 border border-white/10"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        role="slider"
        aria-label="Before and after comparison slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
      >
        {/* After image — full background */}
        <Image
          src="/gallery/sky-after.jpg"
          alt="Property photo after AI sky replacement"
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
          priority
          draggable={false}
        />

        {/* Before image — revealed via clipPath */}
        <Image
          src="/gallery/sky-before.jpg"
          alt="Property photo before enhancement"
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          priority
          draggable={false}
        />

        {/* Slider line */}
        <div
          className="absolute top-0 h-full w-0.5 bg-white/90 pointer-events-none transition-none"
          style={{ left: `${position}%` }}
        >
          {/* Slider handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg shadow-black/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
              <path d="M9 18l6-6-6-6" transform="translate(6,0)" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg text-xs text-white/90 font-medium tracking-wide">
          BEFORE
        </div>
        <div className="absolute top-3 right-3 px-3 py-1.5 bg-[#D4A017] rounded-lg text-xs text-black font-bold tracking-wide">
          AFTER
        </div>
      </div>

      <p className="text-center text-white/30 text-xs mt-3">
        Drag to compare · AI sky replacement in seconds
      </p>
    </div>
  )
}
