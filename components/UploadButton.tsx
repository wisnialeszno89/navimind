"use client";

type Props = {
  onUpload: (file: File) => void;
};

export default function UploadButton({ onUpload }: Props) {
  return (
    <label className="cursor-pointer px-3 py-2 rounded bg-white/10 hover:bg-white/20 text-sm flex items-center gap-1">
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