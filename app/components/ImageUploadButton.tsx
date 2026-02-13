"use client";

type Props = {
  onUpload: (file: File) => void;
  disabled?: boolean;
};

const MAX_IMAGE_MB = 5;

export default function ImageUploadButton({ onUpload, disabled }: Props) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Obsługiwane są tylko pliki graficzne.");
      return;
    }

    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      alert(`Maksymalny rozmiar zdjęcia to ${MAX_IMAGE_MB} MB.`);
      return;
    }

    onUpload(file);
    e.target.value = "";
  }

  return (
    <label
      className={`cursor-pointer px-3 py-2 rounded text-sm flex items-center gap-1
        ${
          disabled
            ? "bg-white/5 text-white/40 cursor-not-allowed"
            : "bg-white/10 hover:bg-white/20 text-blue-200"
        }`}
      title="Dodaj zdjęcie (demo: 1 dziennie)"
    >
      📷
      <input
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleChange}
        disabled={disabled}
      />
    </label>
  );
}