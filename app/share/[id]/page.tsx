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
const shareUrl =
  typeof window !== "undefined"
    ? window.location.href
    : "";
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <img
        src={`data:image/png;base64,${image}`}
        className="max-w-full rounded"
      />

      <div className="text-sm opacity-60">
        Wygenerowano w NaviMind AI 🚀
      </div>
      const url = typeof window !== "undefined"
  ? window.location.href
  : "";
  <div className="flex gap-3 flex-wrap justify-center mt-4">

  <a
    href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`}
    target="_blank"
    className="px-3 py-2 bg-green-500 rounded text-white text-sm"
  >
    WhatsApp
  </a>

  <a
    href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
    target="_blank"
    className="px-3 py-2 bg-blue-600 rounded text-white text-sm"
  >
    Facebook
  </a>

  <a
    href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
    target="_blank"
    className="px-3 py-2 bg-blue-500 rounded text-white text-sm"
  >
    LinkedIn
  </a>

  <a
    href={`mailto:?subject=Zobacz to&body=${shareUrl}`}
    className="px-3 py-2 bg-gray-600 rounded text-white text-sm"
  >
    Email
  </a>

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