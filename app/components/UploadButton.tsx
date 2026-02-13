"use client";

type Props = {
  onUpload: (file: File) => void;
  disabled?: boolean;
};

const MAX_FILE_SIZE_MB = 10;

export default function UploadButton({ onUpload, disabled }: Props) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");

    if (!isPdf && !isImage) {
      alert("Obsługiwane są tylko pliki PDF lub obrazy (JPG, PNG).");
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`Maksymalny rozmiar pliku to ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    onUpload(file);

    // reset input
    e.target.value = "";
  }

  return (
    <label
      className={`cursor-pointer px-3 py-2 rounded text-sm flex items-center gap-1
        ${disabled
          ? "bg-white/5 text-white/40 cursor-not-allowed"
          : "bg-white/10 hover:bg-white/20 text-blue-200"}
      `}
      title="Wgraj PDF lub obraz (demo)"
    >
      📎 Plik
      <input
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </label>
  );
}