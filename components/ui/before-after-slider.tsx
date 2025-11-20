"use client";

import { useState, memo } from "react";
import Image from "next/image";

const BeforeAfterSlider = memo(function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [value, setValue] = useState(50);

  return (
    <div className="relative w-full h-[250px] md:h-[350px] rounded-xl overflow-hidden shadow-quartz">
      {/* BEFORE image */}
      <Image
        src={before}
        alt="before"
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
        priority={false}
      />

      {/* AFTER image */}
      <Image
        src={after}
        alt="after"
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover absolute top-0 left-0"
        style={{ 
          clipPath: `inset(0 ${100 - value}% 0 0)`,
          willChange: "clip-path"
        }}
        priority={false}
      />

      {/* Divider Line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-[var(--accent-gold)] transition-transform duration-75 ease-linear"
        style={{ 
          left: `${value}%`,
          transform: "translateZ(0)"
        }}
      />

      {/* Slider control */}
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value))}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[85%] md:w-2/3 accent-[var(--accent-gold)]"
        style={{ transform: "translateZ(0)" }}
      />
    </div>
  );
});

export default BeforeAfterSlider;



