"use client";

import React, { useState } from "react";

export function BeforeAfterSlider({
  before,
  after,
}: {
  before: string;
  after: string;
}) {
  const [position, setPosition] = useState(50);

  return (
    <div className="relative w-full h-64 rounded-xl overflow-hidden cursor-col-resize">
      <img
        src={before}
        alt="before"
        className="absolute top-0 left-0 w-full h-full object-cover"
      />
      <img
        src={after}
        alt="after"
        className="absolute top-0 left-0 w-full h-full object-cover"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />
      <div
        className="absolute top-0 bottom-0 w-1 bg-white/70"
        style={{ left: `${position}%` }}
      />
      <input
        type="range"
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/2"
      />
    </div>
  );
}



