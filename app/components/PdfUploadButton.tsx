"use client";

import { useState } from "react";

type Mode = "summary" | "translate" | "analyze" | "keypoints";

export default function PdfUploadButton() {
  const [loading, setLoading] = useState(false);

  async function handleUpload(file: File) {
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", "summary");

    const res = await fetch("/api/pdf-v2", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    console.log("PDF RESULT:", data);

    setLoading(false);
  }

  return (
    <label className="cursor-pointer px-3 py-2 rounded bg-white/10 text-blue-200">
      📄 PDF
      <input
        type="file"
        accept="application/pdf"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
      {loading && <span className="ml-2 text-xs">Analiza...</span>}
    </label>
  );
}