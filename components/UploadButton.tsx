"use client";

type Props = {
  onUpload: (file: File) => void;
};

export default function UploadButton({ onUpload }: Props) {
  return (
    <label
      className="px-3 py-2 bg-white/10 rounded cursor-pointer hover:bg-white/20 transition"
      title="Dodaj PDF"
    >
      📎
      <input
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
    </label>
  );
}