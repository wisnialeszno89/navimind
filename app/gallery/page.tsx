"use client";

import { useEffect, useState } from "react";

export default function GalleryPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/share/list")
      .then((res) => res.json())
      .then((data) => setItems(data.items));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl mb-4">🔥 Ostatnie efekty</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <a
            key={item.id}
            href={`/share/${item.id}`}
            className="block"
          >
            <img
              src={`data:image/png;base64,${item.image}`}
              className="rounded hover:scale-105 transition"
            />
          </a>
        ))}
      </div>
    </div>
  );
}