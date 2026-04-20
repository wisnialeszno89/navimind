"use client";

import { useEffect, useState } from "react";

export default function SharePage({ params }: any) {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/share/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setImage(data.image);
      });
  }, [params.id]);

  if (!image) {
    return <div className="p-10 text-center">Ładowanie...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <img
        src={`data:image/png;base64,${image}`}
        className="max-w-full rounded"
      />

      <div className="text-sm opacity-60">
        Wygenerowano w NaviMind AI 🚀
      </div>
      <div className="mt-4 text-center">
  <a
    href="/"
    className="px-4 py-2 bg-blue-600 rounded text-white text-sm"
  >
    ✨ Stwórz własny efekt
  </a>
</div>
    </div>
  );
}