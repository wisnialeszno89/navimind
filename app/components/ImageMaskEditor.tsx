"use client";

import { useRef, useState } from "react";

export default function ImageMaskEditor({
  image,
  onMaskReady,
}: {
  image: string;
  onMaskReady: (maskBase64: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);

  function startDraw() {
    setDrawing(true);
  }

  function endDraw() {
    setDrawing(false);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  function exportMask() {
    const canvas = canvasRef.current!;
    const data = canvas.toDataURL("image/png");
    onMaskReady(data);
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <img src={image} className="w-full rounded" />

        <canvas
          ref={canvasRef}
          width={512}
          height={512}
          className="absolute top-0 left-0 w-full h-full"
          onMouseDown={startDraw}
          onMouseUp={endDraw}
          onMouseMove={draw}
        />
      </div>

      <button
        onClick={exportMask}
        className="px-3 py-2 bg-blue-600 rounded text-sm"
      >
        🎯 Zastosuj zaznaczenie
      </button>
    </div>
  );
}