"use client";

import { useState } from "react";

export default function BeforeAfterSlider({
  before,
  after,
}: {
  before: string;
  after: string;
}) {
  const [pos, setPos] = useState(50);

  return (
    <div className="relative w-full max-w-md mx-auto mb-4">
      <img src={before} className="w-full rounded" />

      <div
        className="absolute top-0 left-0 h-full overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        <img src={after} className="w-full rounded" />
      </div>

      {/* slider */}
      <input
        type="range"
        min="0"
        max="100"
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="w-full mt-2"
      />

      {/* linia */}
      <div
        className="absolute top-0 h-full w-[2px] bg-white"
        style={{ left: `${pos}%` }}
      />
    </div>
  );
}